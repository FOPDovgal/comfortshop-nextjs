import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/admin-auth";
import { getDBArticleById } from "@/lib/articles";
import { notifyGoogleIndexing, articleUrl } from "@/lib/google-indexing";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = req.cookies.get("admin_session")?.value ?? "";
  if (!(await validateSession(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const article = await getDBArticleById(Number(id));
  if (!article) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (article.status !== "published") {
    return NextResponse.json({ error: "Стаття не опублікована" }, { status: 400 });
  }

  const url = articleUrl(article.type, article.slug);
  const ok = await notifyGoogleIndexing(url, article.id);

  if (!ok) {
    return NextResponse.json({ error: "Google Indexing API error" }, { status: 502 });
  }

  const sentAt = new Date().toISOString();
  return NextResponse.json({ ok: true, sentAt });
}
