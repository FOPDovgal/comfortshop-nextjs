import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/admin-auth";
import { addSubcategoryDB } from "@/lib/categories-db";

async function auth(req: NextRequest) {
  const token = req.cookies.get("admin_session")?.value ?? "";
  return validateSession(token);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await auth(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  if (!body.slug || !body.name) {
    return NextResponse.json({ error: "Обов'язкові поля: slug, name" }, { status: 400 });
  }
  try {
    const subId = await addSubcategoryDB(Number(id), body);
    return NextResponse.json({ ok: true, id: subId }, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("Duplicate entry")) return NextResponse.json({ error: "Slug вже існує в цій категорії" }, { status: 409 });
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}
