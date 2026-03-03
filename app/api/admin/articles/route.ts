import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/admin-auth";
import { getAllDBArticles, createDBArticle } from "@/lib/articles";
import { notifyGoogleIndexing, articleUrl, checkAndNotifyCategoryIndexing } from "@/lib/google-indexing";

async function auth(req: NextRequest) {
  const token = req.cookies.get("admin_session")?.value ?? "";
  return validateSession(token);
}

export async function GET(req: NextRequest) {
  if (!(await auth(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const articles = await getAllDBArticles();
  return NextResponse.json(articles);
}

export async function POST(req: NextRequest) {
  if (!(await auth(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { slug, title, content, type, category, date } = body;

  if (!slug || !title || !content || !type || !category || !date) {
    return NextResponse.json({ error: "Обов'язкові поля: slug, title, content, type, category, date" }, { status: 400 });
  }
  if (!["guide", "top", "review"].includes(type)) {
    return NextResponse.json({ error: "Невірний тип статті" }, { status: 400 });
  }

  try {
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
      status: body.status ?? "draft",
      affiliate_url_1: body.affiliate_url_1 || undefined,
      affiliate_url_2: body.affiliate_url_2 || undefined,
      affiliate_url_3: body.affiliate_url_3 || undefined,
    });
    // Notify Google Indexing API for newly published articles + categories with 2+ articles
    const finalStatus = body.status ?? "draft";
    if (finalStatus === "published") {
      notifyGoogleIndexing(articleUrl(type, slug), id); // fire-and-forget
      checkAndNotifyCategoryIndexing([category, body.category2, body.category3]); // fire-and-forget
    }

    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("Duplicate entry")) {
      return NextResponse.json({ error: "Slug вже використовується" }, { status: 409 });
    }
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}
