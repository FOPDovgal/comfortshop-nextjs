import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/admin-auth";
import { updateCategoryDB, deleteCategoryDB } from "@/lib/categories-db";

async function auth(req: NextRequest) {
  const token = req.cookies.get("admin_session")?.value ?? "";
  return validateSession(token);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await auth(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  try {
    await updateCategoryDB(Number(id), body);
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("Duplicate entry")) return NextResponse.json({ error: "Slug вже існує" }, { status: 409 });
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await auth(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await deleteCategoryDB(Number(id));
  return NextResponse.json({ ok: true });
}
