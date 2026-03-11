import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/admin-auth";
import { getDBArticleById, updateDBArticle, deleteDBArticle } from "@/lib/articles";
import { notifyGoogleIndexing, articleUrl } from "@/lib/google-indexing";

async function auth(req: NextRequest) {
  const token = req.cookies.get("admin_session")?.value ?? "";
  return validateSession(token);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await auth(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const article = await getDBArticleById(Number(id));
  if (!article) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(article);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await auth(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json();

  const existing = await getDBArticleById(Number(id));
  const wasPublished = existing?.status === "published";

  await updateDBArticle(Number(id), {
    slug: body.slug,
    title: body.title,
    excerpt: body.excerpt,
    content: body.content,
    type: body.type,
    category: body.category,
    subcategory: body.subcategory,
    category2: body.category2 || undefined,
    subcategory2: body.subcategory2 || undefined,
    category3: body.category3 || undefined,
    subcategory3: body.subcategory3 || undefined,
    canonical_id: body.canonical_id ?? undefined,
    lang: body.lang,
    date: body.date,
    seo_title: body.seo_title,
    seo_description: body.seo_description,
    status: body.status,
    affiliate_url_1: body.affiliate_url_1 || undefined,
    affiliate_url_2: body.affiliate_url_2 || undefined,
    affiliate_url_3: body.affiliate_url_3 || undefined,
    increment_revision: true,
  });

  // Notify Google Indexing API when article is published (new publish or update of already-published)
  if (body.status === "published") {
    const slug = body.slug || existing?.slug;
    const type = body.type || existing?.type;
    if (slug && type) {
      notifyGoogleIndexing(articleUrl(type, slug), Number(id)); // fire-and-forget
    }
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await auth(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  await deleteDBArticle(Number(id));
  return NextResponse.json({ ok: true });
}
