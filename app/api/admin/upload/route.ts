import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/admin-auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  const token = req.cookies.get("admin_session")?.value ?? "";
  if (!(await validateSession(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return NextResponse.json({ error: "Файл не надано" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Дозволені формати: JPG, PNG, GIF, WebP" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Максимальний розмір файлу — 5 МБ" }, { status: 400 });
  }

  // Sanitize filename and prepend timestamp to avoid collisions
  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
  const base = file.name
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9а-яА-ЯіІїЇєЄ]/g, "_")
    .slice(0, 40);
  const filename = `${Date.now()}_${base}.${ext}`;

  await mkdir(UPLOAD_DIR, { recursive: true });
  const bytes = await file.arrayBuffer();
  await writeFile(path.join(UPLOAD_DIR, filename), Buffer.from(bytes));

  return NextResponse.json({ url: `/uploads/${filename}` });
}
