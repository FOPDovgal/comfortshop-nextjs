import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/admin-auth";
import pool from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

const REPLICATE_TOKEN = process.env.REPLICATE_API_TOKEN ?? "";
const IMAGES_DIR = path.join(process.cwd(), "public", "uploads", "images");

async function auth(req: NextRequest) {
  const token = req.cookies.get("admin_session")?.value ?? "";
  return validateSession(token);
}

type JobRow = {
  id: number;
  target_id: number;
  asset_id: number | null;
  replicate_prediction_id: string | null;
  prompt_used: string;
  model_id: string;
  job_status: string;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
};

type ReplicatePrediction = {
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  output: string[] | null;
  error: string | null;
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await auth(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const jobId = Number(id);
  if (!Number.isInteger(jobId) || jobId <= 0) {
    return NextResponse.json({ error: "Invalid job id" }, { status: 400 });
  }

  try {
    const [jobs] = await pool.execute(
      `SELECT id, target_id, asset_id, replicate_prediction_id, prompt_used, model_id,
              job_status, error_message, started_at, completed_at, created_at
       FROM image_jobs WHERE id=?`,
      [jobId]
    ) as [Array<JobRow>, unknown];

    if (jobs.length === 0) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const job = jobs[0];

    // Already terminal — return stored result without calling Replicate
    if (job.job_status === "succeeded" || job.job_status === "failed") {
      return NextResponse.json(job);
    }

    if (!job.replicate_prediction_id || !REPLICATE_TOKEN) {
      return NextResponse.json(job);
    }

    // Poll Replicate for current status
    const repRes = await fetch(
      `https://api.replicate.com/v1/predictions/${job.replicate_prediction_id}`,
      { headers: { Authorization: `Token ${REPLICATE_TOKEN}` } }
    );

    if (!repRes.ok) {
      // Return last known DB state on Replicate API failure
      return NextResponse.json(job);
    }

    const prediction = await repRes.json() as ReplicatePrediction;

    if (prediction.status === "succeeded" && prediction.output?.length) {
      const imageUrl = prediction.output[0];

      // Download image locally
      let localPath: string | null = null;
      try {
        const imgRes = await fetch(imageUrl);
        if (imgRes.ok) {
          const buffer = Buffer.from(await imgRes.arrayBuffer());
          const filename = `${crypto.randomUUID()}.jpg`;
          await mkdir(IMAGES_DIR, { recursive: true });
          await writeFile(path.join(IMAGES_DIR, filename), buffer);
          localPath = filename;
        }
      } catch (downloadErr) {
        console.error("Image download failed:", downloadErr);
        // Continue — asset created with source_url only if download fails
      }

      // Race-condition guard: re-read job before insert to prevent duplicate assets
      // on concurrent poll requests that both saw job_status='running'
      const [recheck] = await pool.execute(
        `SELECT asset_id FROM image_jobs WHERE id=?`,
        [jobId]
      ) as [Array<{ asset_id: number | null }>, unknown];
      if (recheck.length && recheck[0].asset_id !== null) {
        return NextResponse.json({ ...job, job_status: "succeeded", asset_id: recheck[0].asset_id });
      }

      // Create pending_review asset — do NOT touch current_asset_id
      const [assetResult] = await pool.execute(
        `INSERT INTO image_assets
           (target_id, source_url, local_path, origin, governance_status, lifecycle_status)
         VALUES (?, ?, ?, 'replicate', 'pending_review', 'active')`,
        [job.target_id, imageUrl, localPath]
      ) as [{ insertId: number }, unknown];

      const assetId = assetResult.insertId;

      await pool.execute(
        `UPDATE image_jobs SET job_status='succeeded', asset_id=?, completed_at=NOW() WHERE id=?`,
        [assetId, jobId]
      );

      return NextResponse.json({ ...job, job_status: "succeeded", asset_id: assetId });

    } else if (prediction.status === "failed" || prediction.status === "canceled") {
      const errMsg = prediction.error ?? `Replicate prediction ${prediction.status}`;

      await pool.execute(
        `UPDATE image_jobs SET job_status='failed', error_message=?, completed_at=NOW() WHERE id=?`,
        [errMsg, jobId]
      );

      return NextResponse.json({ ...job, job_status: "failed", error_message: errMsg });

    } else {
      // Still starting or processing
      return NextResponse.json({ ...job, job_status: "running" });
    }
  } catch (e) {
    console.error("images/jobs/[id] error:", e);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}
