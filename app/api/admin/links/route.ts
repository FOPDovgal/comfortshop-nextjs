import { NextRequest, NextResponse } from "next/server";
import { getAllCategoryLinks, upsertCategoryLink } from "@/lib/affiliate";
import { validateSession } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("admin_session")?.value ?? "";
  if (!(await validateSession(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const links = await getAllCategoryLinks();
  return NextResponse.json(links);
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("admin_session")?.value ?? "";
  if (!(await validateSession(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { category, platform, url, label } = await req.json();
  if (!category || !platform || !url || !label) {
    return NextResponse.json({ error: "Всі поля обов'язкові" }, { status: 400 });
  }
  if (!["aliexpress", "temu"].includes(platform)) {
    return NextResponse.json({ error: "Невірна платформа" }, { status: 400 });
  }

  const id = await upsertCategoryLink({ category, platform, url, label });
  return NextResponse.json({ ok: true, id }, { status: 201 });
}
