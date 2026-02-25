import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

function authOk(req: NextRequest): boolean {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  return !!token && token === process.env.PUBLISH_API_KEY;
}

export async function POST(req: NextRequest) {
  if (!authOk(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { url, filename } = body as { url?: string; filename?: string };

  if (!url || !filename) {
    return NextResponse.json({ error: "Required: url, filename" }, { status: 400 });
  }

  // Sanitize filename — allow only safe characters, block path traversal
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "").replace(/\.\.+/g, "");
  if (!safe) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }

  try {
    const imgRes = await fetch(url);
    if (!imgRes.ok) {
      return NextResponse.json(
        { error: `Failed to fetch image: HTTP ${imgRes.status}` },
        { status: 502 }
      );
    }

    const buffer = Buffer.from(await imgRes.arrayBuffer());
    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(path.join(UPLOAD_DIR, safe), buffer);

    return NextResponse.json({ url: `/uploads/${safe}` });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
