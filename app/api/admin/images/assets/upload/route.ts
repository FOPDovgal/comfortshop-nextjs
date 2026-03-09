import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/admin-auth";
import pool from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

const IMAGES_DIR = path.join(process.cwd(), "public", "uploads", "images");
const ALLOWED_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

async function auth(req: NextRequest) {
  const token = req.cookies.get("admin_session")?.value ?? "";
  return validateSession(token);
}

export async function POST(req: NextRequest) {
  if (!(await auth(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid multipart form data" }, { status: 400 });
  }

  const targetIdRaw = formData.get("target_id");
  const file = formData.get("file") as File | null;

  if (!targetIdRaw || !file) {
    return NextResponse.json({ error: "target_id and file required" }, { status: 400 });
  }

  const targetId = Number(targetIdRaw);
  if (!Number.isInteger(targetId) || targetId <= 0) {
    return NextResponse.json({ error: "Invalid target_id" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 413 });
  }

  try {
    const [targets] = await pool.execute(
      "SELECT id FROM image_targets WHERE id=?",
      [targetId]
    ) as [Array<{ id: number }>, unknown];
    if (targets.length === 0) {
      return NextResponse.json({ error: "Target not found" }, { status: 404 });
    }

    const origExt = path.extname(file.name).toLowerCase();
    const ext = ALLOWED_EXTS.has(origExt) ? origExt : ".jpg";
    const filename = `${crypto.randomUUID()}${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    await mkdir(IMAGES_DIR, { recursive: true });
    await writeFile(path.join(IMAGES_DIR, filename), buffer);

    const [result] = await pool.execute(
      `INSERT INTO image_assets
         (target_id, local_path, origin, governance_status, lifecycle_status)
       VALUES (?, ?, 'manual_upload', 'pending_review', 'active')`,
      [targetId, filename]
    ) as [{ insertId: number }, unknown];

    return NextResponse.json({ asset_id: result.insertId, local_path: filename }, { status: 201 });
  } catch (e) {
    console.error("images/assets/upload error:", e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
