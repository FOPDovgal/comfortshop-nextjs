import { NextRequest, NextResponse } from "next/server";
import { createDBArticle, updateDBArticle, getDBArticleBySlug } from "@/lib/articles";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://comfortshop.com.ua";

function authOk(req: NextRequest): boolean {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  return !!token && token === process.env.PUBLISH_API_KEY;
}

function articleUrl(type: string, slug: string): string {
  if (type === "top") return `${SITE_URL}/top/${slug}/`;
  return `${SITE_URL}/oglyady/${slug}/`;
}

export async function POST(req: NextRequest) {
  if (!authOk(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { slug, title, content, type, category, date } = body;

  if (!slug || !title || !content || !type || !category || !date) {
    return NextResponse.json(
      { error: "Required: slug, title, content, type, category, date" },
      { status: 400 }
    );
  }
  if (!["guide", "top", "review"].includes(type)) {
    return NextResponse.json({ error: "type must be guide|top|review" }, { status: 400 });
  }

  const existing = await getDBArticleBySlug(slug);

  if (existing) {
    // Update existing article
    await updateDBArticle(existing.id, {
      title,
      content,
      type,
      category,
      date,
      excerpt: body.excerpt,
      subcategory: body.subcategory,
      seo_title: body.seo_title,
      seo_description: body.seo_description,
      status: body.status ?? "published",
      increment_revision: true,
    });
    return NextResponse.json({
      ok: true,
      id: existing.id,
      action: "updated",
      url: articleUrl(type, slug),
    });
  }

  // Create new article
  try {
    const id = await createDBArticle({
      slug,
      title,
      excerpt: body.excerpt,
      content,
      type,
      category,
      subcategory: body.subcategory,
      lang: body.lang ?? "uk",
      date,
      seo_title: body.seo_title,
      seo_description: body.seo_description,
      status: body.status ?? "published",
    });
    return NextResponse.json({
      ok: true,
      id,
      action: "created",
      url: articleUrl(type, slug),
    }, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
