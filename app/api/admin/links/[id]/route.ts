import { NextRequest, NextResponse } from "next/server";
import { deleteCategoryLink, upsertCategoryLink } from "@/lib/affiliate";
import { createHash } from "crypto";
import pool from "@/lib/db";

const SALT = "comfortshop2026";

function isAuthed(req: NextRequest): boolean {
  const adminPass = process.env.ADMIN_PASSWORD ?? "";
  const token = createHash("sha256")
    .update(adminPass + SALT)
    .digest("hex");
  return req.cookies.get("admin_session")?.value === token;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { url, label } = await req.json();

  await pool.query(
    "UPDATE category_affiliate_links SET url = ?, label = ?, check_status = 'unchecked', updated_at = NOW() WHERE id = ?",
    [url, label, id]
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await deleteCategoryLink(Number(id));
  return NextResponse.json({ ok: true });
}
