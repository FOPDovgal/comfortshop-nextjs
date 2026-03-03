import { NextRequest, NextResponse } from "next/server";
import { createDBArticle, updateDBArticle, getDBArticleBySlug } from "@/lib/articles";
import { notifyGoogleIndexing, articleUrl as libArticleUrl, checkAndNotifyCategoryIndexing } from "@/lib/google-indexing";

function authOk(req: NextRequest): boolean {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  return !!token && token === process.env.PUBLISH_API_KEY;
}

function articleUrl(type: string, slug: string): string {
  return libArticleUrl(type, slug);
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
    const finalStatus = body.status ?? "published";
    await updateDBArticle(existing.id, {
      title,
      content,
      type,
      category,
      date,
      excerpt: body.excerpt,
      subcategory: body.subcategory,
      category2: body.category2 || undefined,
      subcategory2: body.subcategory2 || undefined,
      category3: body.category3 || undefined,
      subcategory3: body.subcategory3 || undefined,
      seo_title: body.seo_title,
      seo_description: body.seo_description,
      status: finalStatus,
      affiliate_url_1: body.affiliate_url_1 || undefined,
      affiliate_url_2: body.affiliate_url_2 || undefined,
      affiliate_url_3: body.affiliate_url_3 || undefined,
      image_url: body.image_url,
      increment_revision: true,
    });
    if (finalStatus === "published") {
      notifyGoogleIndexing(articleUrl(type, slug), existing.id); // fire-and-forget
      checkAndNotifyCategoryIndexing([category, body.category2, body.category3]); // fire-and-forget
    }
    return NextResponse.json({
      ok: true,
      id: existing.id,
      action: "updated",
      url: articleUrl(type, slug),
    });
  }

  // Create new article
  try {
    const finalStatus = body.status ?? "published";
    const id = await createDBArticle({
      slug,
      title,
      excerpt: body.excerpt,
      content,
      type,
      category,
      subcategory: body.subcategory,
      category2: body.category2 || undefined,
      subcategory2: body.subcategory2 || undefined,
      category3: body.category3 || undefined,
      subcategory3: body.subcategory3 || undefined,
      lang: body.lang ?? "uk",
      date,
      seo_title: body.seo_title,
      seo_description: body.seo_description,
      status: finalStatus,
      affiliate_url_1: body.affiliate_url_1 || undefined,
      affiliate_url_2: body.affiliate_url_2 || undefined,
      affiliate_url_3: body.affiliate_url_3 || undefined,
      image_url: body.image_url,
    });
    if (finalStatus === "published") {
      notifyGoogleIndexing(articleUrl(type, slug), id); // fire-and-forget
      checkAndNotifyCategoryIndexing([category, body.category2, body.category3]); // fire-and-forget
    }
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
