import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/admin-auth";
import pool from "@/lib/db";

const REPLICATE_TOKEN = process.env.REPLICATE_API_TOKEN ?? "";
const MODEL_ID = "black-forest-labs/flux-dev";
const REPLICATE_URL = `https://api.replicate.com/v1/models/${MODEL_ID}/predictions`;

async function auth(req: NextRequest) {
  const token = req.cookies.get("admin_session")?.value ?? "";
  return validateSession(token);
}

function buildDefaultPrompt(entityType: string, entityKey: string, label: string | null): string {
  const topic = label ?? entityKey.replace(/-/g, " ");
  switch (entityType) {
    case "article":
      return `Professional product review hero image for "${topic}", clean background, sharp focus, high quality e-commerce photography`;
    case "category":
    case "subcategory":
      return `Category banner image for "${topic}", collection of modern consumer electronics, clean white background, product photography`;
    case "discover":
      return `Editorial hero image representing "${topic}", modern gadgets and electronics, clean professional layout`;
    case "entity":
      return `Gift guide hero image for "${topic}", curated product selection, elegant presentation, professional photography`;
    default:
      return `Professional product hero image for "${topic}", clean background, high quality photography`;
  }
}

export async function POST(req: NextRequest) {
  if (!(await auth(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!REPLICATE_TOKEN) {
    return NextResponse.json({ error: "REPLICATE_API_TOKEN not configured on server" }, { status: 503 });
  }

  const body = await req.json() as { target_id?: number; prompt_override?: string };
  const { target_id, prompt_override } = body;

  if (!target_id || !Number.isInteger(target_id) || target_id <= 0) {
    return NextResponse.json({ error: "target_id required" }, { status: 400 });
  }

  try {
    const [targets] = await pool.execute(
      "SELECT id, entity_type, entity_key, label FROM image_targets WHERE id=?",
      [target_id]
    ) as [Array<{ id: number; entity_type: string; entity_key: string; label: string | null }>, unknown];

    if (targets.length === 0) {
      return NextResponse.json({ error: "Target not found" }, { status: 404 });
    }

    const target = targets[0];
    const promptUsed = prompt_override?.trim() ||
      buildDefaultPrompt(target.entity_type, target.entity_key, target.label);

    // Start Replicate prediction
    const repRes = await fetch(REPLICATE_URL, {
      method: "POST",
      headers: {
        Authorization: `Token ${REPLICATE_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: {
          prompt: promptUsed,
          aspect_ratio: "16:9",
          output_format: "jpeg",
        },
      }),
    });

    if (!repRes.ok) {
      const errText = await repRes.text();
      console.error("Replicate start error:", errText);
      return NextResponse.json(
        { error: `Replicate error: ${errText.slice(0, 300)}` },
        { status: 502 }
      );
    }

    const prediction = await repRes.json() as { id: string; status: string };

    const [result] = await pool.execute(
      `INSERT INTO image_jobs
         (target_id, replicate_prediction_id, prompt_used, prompt_override, model_id, job_status, started_at)
       VALUES (?, ?, ?, ?, ?, 'running', NOW())`,
      [target_id, prediction.id, promptUsed, prompt_override?.trim() ?? null, MODEL_ID]
    ) as [{ insertId: number }, unknown];

    return NextResponse.json(
      { job_id: result.insertId, prediction_id: prediction.id },
      { status: 201 }
    );
  } catch (e) {
    console.error("images/regenerate error:", e);
    return NextResponse.json({ error: "Failed to start regeneration" }, { status: 500 });
  }
}
