import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/admin-auth";
import { getGuideBySlug, getTopBySlug } from "@/lib/mdx";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("admin_session")?.value ?? "";
  if (!(await validateSession(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  const type = searchParams.get("type");

  if (!slug) {
    return NextResponse.json({ error: "slug required" }, { status: 400 });
  }

  const article = type === "top" ? getTopBySlug(slug) : getGuideBySlug(slug);
  if (!article) {
    return NextResponse.json({ error: "MDX file not found" }, { status: 404 });
  }

  const { frontmatter, content } = article;
  const now = new Date().toISOString();

  // Return DBArticle-shaped object with id: 0 to signal "new from MDX"
  return NextResponse.json({
    id: 0,
    slug: frontmatter.slug ?? slug,
    title: frontmatter.title,
    excerpt: frontmatter.excerpt ?? null,
    content,
    type: frontmatter.type,
    category: frontmatter.category,
    subcategory: frontmatter.subcategory ?? null,
    category2: frontmatter.category2 ?? null,
    subcategory2: frontmatter.subcategory2 ?? null,
    category3: frontmatter.category3 ?? null,
    subcategory3: frontmatter.subcategory3 ?? null,
    lang: frontmatter.lang ?? "uk",
    date: frontmatter.date,
    seo_title: frontmatter.seo_title ?? null,
    seo_description: frontmatter.seo_description ?? null,
    status: "published",
    revision_count: 0,
    created_at: now,
    updated_at: now,
    affiliate_url_1: null,
    affiliate_url_2: null,
    affiliate_url_3: null,
    image_url: frontmatter.image_url ?? null,
  });
}
