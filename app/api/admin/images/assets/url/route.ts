import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/admin-auth";
import pool from "@/lib/db";

async function auth(req: NextRequest) {
  const token = req.cookies.get("admin_session")?.value ?? "";
  return validateSession(token);
}

export async function POST(req: NextRequest) {
  if (!(await auth(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { target_id?: number; source_url?: string };
  const { target_id, source_url } = body;

  if (!target_id || !source_url) {
    return NextResponse.json({ error: "target_id and source_url required" }, { status: 400 });
  }
  if (typeof source_url !== "string" || !source_url.startsWith("http")) {
    return NextResponse.json({ error: "source_url must be an http(s) URL" }, { status: 400 });
  }

  try {
    const [targets] = await pool.execute(
      "SELECT id FROM image_targets WHERE id=?",
      [target_id]
    ) as [Array<{ id: number }>, unknown];
    if (targets.length === 0) {
      return NextResponse.json({ error: "Target not found" }, { status: 404 });
    }

    const [result] = await pool.execute(
      `INSERT INTO image_assets
         (target_id, source_url, origin, governance_status, lifecycle_status)
       VALUES (?, ?, 'manual_url', 'pending_review', 'active')`,
      [target_id, source_url.slice(0, 2000)]
    ) as [{ insertId: number }, unknown];

    return NextResponse.json({ asset_id: result.insertId }, { status: 201 });
  } catch (e) {
    console.error("images/assets/url error:", e);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}
