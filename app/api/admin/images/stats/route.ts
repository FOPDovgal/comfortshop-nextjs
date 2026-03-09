import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/admin-auth";
import pool from "@/lib/db";

async function auth(req: NextRequest) {
  const token = req.cookies.get("admin_session")?.value ?? "";
  return validateSession(token);
}

export async function GET(req: NextRequest) {
  if (!(await auth(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // --- targets total ---
    const [[targetsTotal]] = await pool.execute(
      "SELECT COUNT(*) AS total FROM image_targets"
    ) as [Array<{ total: number }>, unknown];

    // --- targets by entity_type ---
    const [targetsByType] = await pool.execute(
      "SELECT entity_type, COUNT(*) AS cnt FROM image_targets GROUP BY entity_type"
    ) as [Array<{ entity_type: string; cnt: number }>, unknown];

    // --- assets total ---
    const [[assetsTotal]] = await pool.execute(
      "SELECT COUNT(*) AS total FROM image_assets"
    ) as [Array<{ total: number }>, unknown];

    // --- assets by governance_status ---
    const [assetsByGov] = await pool.execute(
      "SELECT governance_status, COUNT(*) AS cnt FROM image_assets GROUP BY governance_status"
    ) as [Array<{ governance_status: string; cnt: number }>, unknown];

    // --- assets by lifecycle_status ---
    const [assetsByLife] = await pool.execute(
      "SELECT lifecycle_status, COUNT(*) AS cnt FROM image_assets GROUP BY lifecycle_status"
    ) as [Array<{ lifecycle_status: string; cnt: number }>, unknown];

    // --- assets by origin ---
    const [assetsByOrigin] = await pool.execute(
      "SELECT origin, COUNT(*) AS cnt FROM image_assets GROUP BY origin"
    ) as [Array<{ origin: string; cnt: number }>, unknown];

    // --- recent targets (last 20) with current asset info via LEFT JOIN ---
    const [recentTargets] = await pool.execute(
      `SELECT
         t.id,
         t.entity_type,
         t.entity_key,
         t.role,
         t.label,
         t.current_asset_id,
         a.origin          AS asset_origin,
         a.governance_status AS asset_governance,
         a.lifecycle_status  AS asset_lifecycle,
         a.local_path,
         a.source_url
       FROM image_targets t
       LEFT JOIN image_assets a ON a.id = t.current_asset_id
       ORDER BY t.id DESC
       LIMIT 20`
    ) as [Array<{
      id: number;
      entity_type: string;
      entity_key: string;
      role: string;
      label: string | null;
      current_asset_id: number | null;
      asset_origin: string | null;
      asset_governance: string | null;
      asset_lifecycle: string | null;
      local_path: string | null;
      source_url: string | null;
    }>, unknown];

    // convert BigInt/number fields safely
    const toNum = (v: unknown) => Number(v);

    return NextResponse.json({
      targets: {
        total: toNum(targetsTotal.total),
        by_type: Object.fromEntries(targetsByType.map((r) => [r.entity_type, toNum(r.cnt)])),
      },
      assets: {
        total: toNum(assetsTotal.total),
        by_governance: Object.fromEntries(assetsByGov.map((r) => [r.governance_status, toNum(r.cnt)])),
        by_lifecycle: Object.fromEntries(assetsByLife.map((r) => [r.lifecycle_status, toNum(r.cnt)])),
        by_origin: Object.fromEntries(assetsByOrigin.map((r) => [r.origin, toNum(r.cnt)])),
      },
      recent_targets: recentTargets,
    });
  } catch (e) {
    console.error("images/stats error:", e);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}
