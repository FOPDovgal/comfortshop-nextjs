import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/admin-auth";
import { getDBArticleById, updateDBArticle, deleteDBArticle } from "@/lib/articles";

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
