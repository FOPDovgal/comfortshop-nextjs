import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/admin-auth";
import pool from "@/lib/db";
import type { PoolConnection } from "mysql2/promise";

async function auth(req: NextRequest) {
  const token = req.cookies.get("admin_session")?.value ?? "";
  return validateSession(token);
}

export async function POST(req: NextRequest) {
  if (!(await auth(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { asset_id?: number; action?: string; review_note?: string };
  const { asset_id, action, review_note } = body;

  if (!asset_id || !action) {
    return NextResponse.json({ error: "asset_id and action required" }, { status: 400 });
  }
  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "action must be 'approve' or 'reject'" }, { status: 400 });
  }

  const conn: PoolConnection = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Verify asset exists
    const [assets] = await conn.execute(
      "SELECT id, target_id FROM image_assets WHERE id=?",
      [asset_id]
    ) as [Array<{ id: number; target_id: number }>, unknown];
    if (assets.length === 0) {
      await conn.rollback();
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    const { target_id } = assets[0];
    const note = review_note ?? null;

    if (action === "approve") {
      // Find current asset for this target
      const [[target]] = await conn.execute(
        "SELECT current_asset_id FROM image_targets WHERE id=?",
        [target_id]
      ) as [Array<{ current_asset_id: number | null }>, unknown];

      // Demote previous current asset to historical (if different)
      if (target.current_asset_id && target.current_asset_id !== asset_id) {
        await conn.execute(
          "UPDATE image_assets SET lifecycle_status='historical' WHERE id=?",
          [target.current_asset_id]
        );
      }

      // Approve this asset
      await conn.execute(
        `UPDATE image_assets
         SET governance_status='approved', lifecycle_status='active', review_note=?
         WHERE id=?`,
        [note, asset_id]
      );

      // Set as current on target
      await conn.execute(
        "UPDATE image_targets SET current_asset_id=? WHERE id=?",
        [asset_id, target_id]
      );
    } else {
      // Reject — cleanup candidate in 3 days
      await conn.execute(
        `UPDATE image_assets
         SET governance_status='rejected',
             lifecycle_status='cleanup_candidate',
             cleanup_after=DATE_ADD(NOW(), INTERVAL 3 DAY),
             review_note=?
         WHERE id=?`,
        [note, asset_id]
      );
      // F1: if this asset was the current one, clear the pointer
      await conn.execute(
        "UPDATE image_targets SET current_asset_id=NULL WHERE id=? AND current_asset_id=?",
        [target_id, asset_id]
      );
    }

    await conn.commit();
    return NextResponse.json({ ok: true });
  } catch (e) {
    await conn.rollback();
    console.error("images/assets/review error:", e);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  } finally {
    conn.release();
  }
}
