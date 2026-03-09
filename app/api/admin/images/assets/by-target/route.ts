import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/admin-auth";
import pool from "@/lib/db";

async function auth(req: NextRequest) {
  const token = req.cookies.get("admin_session")?.value ?? "";
  return validateSession(token);
}

export async function GET(req: NextRequest) {
  if (!(await auth(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const targetId = Number(req.nextUrl.searchParams.get("target_id") ?? "");
  if (!Number.isInteger(targetId) || targetId <= 0) {
    return NextResponse.json({ error: "target_id required" }, { status: 400 });
  }

  try {
    const [targets] = await pool.execute(
      "SELECT id, entity_type, entity_key, role, label, current_asset_id FROM image_targets WHERE id=?",
      [targetId]
    ) as [Array<{
      id: number; entity_type: string; entity_key: string; role: string;
      label: string | null; current_asset_id: number | null;
    }>, unknown];

    if (targets.length === 0) {
      return NextResponse.json({ error: "Target not found" }, { status: 404 });
    }

    const [assets] = await pool.execute(
      `SELECT id, target_id, source_url, local_path, alt_text, origin,
              governance_status, lifecycle_status, review_note, cleanup_after, created_at
       FROM image_assets
       WHERE target_id=?
       ORDER BY id DESC`,
      [targetId]
    ) as [Array<{
      id: number; target_id: number;
      source_url: string | null; local_path: string | null; alt_text: string | null;
      origin: string; governance_status: string; lifecycle_status: string;
      review_note: string | null; cleanup_after: string | null; created_at: string;
    }>, unknown];

    return NextResponse.json({ target: targets[0], assets });
  } catch (e) {
    console.error("images/assets/by-target error:", e);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}
