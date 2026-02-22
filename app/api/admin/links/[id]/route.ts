import { NextRequest, NextResponse } from "next/server";
import { deleteCategoryLink } from "@/lib/affiliate";
import { validateSession } from "@/lib/admin-auth";
import pool from "@/lib/db";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = req.cookies.get("admin_session")?.value ?? "";
  if (!(await validateSession(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
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
  const token = req.cookies.get("admin_session")?.value ?? "";
  if (!(await validateSession(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  await deleteCategoryLink(Number(id));
  return NextResponse.json({ ok: true });
}
