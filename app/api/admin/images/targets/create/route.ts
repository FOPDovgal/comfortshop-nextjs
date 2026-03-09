import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/admin-auth";
import pool from "@/lib/db";

const VALID_TYPES = ["article", "category", "subcategory", "discover", "entity"] as const;

async function auth(req: NextRequest) {
  const token = req.cookies.get("admin_session")?.value ?? "";
  return validateSession(token);
}

export async function POST(req: NextRequest) {
  if (!(await auth(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { entity_type?: string; entity_key?: string; role?: string };
  const { entity_type, entity_key, role = "hero" } = body;

  if (!entity_type || !(VALID_TYPES as readonly string[]).includes(entity_type)) {
    return NextResponse.json({ error: "Invalid entity_type" }, { status: 400 });
  }
  if (!entity_key || typeof entity_key !== "string" || !entity_key.trim()) {
    return NextResponse.json({ error: "entity_key required" }, { status: 400 });
  }

  const safeKey  = entity_key.trim().slice(0, 200);
  const safeRole = (typeof role === "string" ? role.trim() : "hero").slice(0, 50) || "hero";

  try {
    // Return existing target instead of failing on duplicate
    const [existing] = await pool.execute(
      "SELECT id FROM image_targets WHERE entity_type=? AND entity_key=? AND role=?",
      [entity_type, safeKey, safeRole]
    ) as [Array<{ id: number }>, unknown];

    if (existing.length > 0) {
      return NextResponse.json({ id: existing[0].id, created: false });
    }

    const [result] = await pool.execute(
      "INSERT INTO image_targets (entity_type, entity_key, role) VALUES (?, ?, ?)",
      [entity_type, safeKey, safeRole]
    ) as [{ insertId: number }, unknown];

    return NextResponse.json({ id: result.insertId, created: true }, { status: 201 });
  } catch (e) {
    console.error("images/targets/create error:", e);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}
