import { NextRequest, NextResponse } from "next/server";
import { getAllCategoryLinks, upsertCategoryLink } from "@/lib/affiliate";
import { createHash } from "crypto";

const SALT = "comfortshop2026";

function isAuthed(req: NextRequest): boolean {
  const adminPass = process.env.ADMIN_PASSWORD ?? "";
  const token = createHash("sha256")
    .update(adminPass + SALT)
    .digest("hex");
  return req.cookies.get("admin_session")?.value === token;
}

export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const links = await getAllCategoryLinks();
  return NextResponse.json(links);
}

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
