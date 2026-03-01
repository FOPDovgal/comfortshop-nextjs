import type { MetadataRoute } from "next";
import { CATEGORIES } from "@/lib/categories";
import { getAllGuides, getAllTops } from "@/lib/mdx";
import { getAllCategoriesDB } from "@/lib/categories-db";
import { getAllDBArticles } from "@/lib/articles";

const BASE = "https://comfortshop.com.ua";

function articleUrl(type: string, slug: string): string {
  if (type === "top") return `${BASE}/top/${slug}`;
  return `${BASE}/oglyady/${slug}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // ── Static pages ──────────────────────────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE,                 lastModified: now, changeFrequency: "daily",  priority: 1.0 },
    { url: `${BASE}/oglyady`,    lastModified: now, changeFrequency: "daily",  priority: 0.9 },
    { url: `${BASE}/top`,        lastModified: now, changeFrequency: "daily",  priority: 0.9 },
    { url: `${BASE}/kategoriyi`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    // NOTE: /umovy-vykorystannya is intentionally excluded (noindex page)
  ];

  // ── Category pages: DB-first, fallback to hardcoded ───────────────────────
  type CatLike = { slug: string; subcategories: { slug: string }[] };
  let cats: CatLike[] = CATEGORIES;
  try {
    const dbCats = await getAllCategoriesDB();
    if (dbCats.length > 0) cats = dbCats;
  } catch {}

  const categoryPages: MetadataRoute.Sitemap = cats.map((cat) => ({
    url: `${BASE}/kategoriyi/${cat.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const subcategoryPages: MetadataRoute.Sitemap = cats.flatMap((cat) =>
    cat.subcategories.map((sub) => ({
      url: `${BASE}/kategoriyi/${cat.slug}/${sub.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    }))
  );

  // ── Articles: DB (published) first, then MDX files not in DB ──────────────
  let dbSlugs = new Set<string>();
  let dbArticleEntries: MetadataRoute.Sitemap = [];
  try {
    const dbArticles = await getAllDBArticles();
    const published = dbArticles.filter((a) => a.status === "published");
    dbSlugs = new Set(published.map((a) => a.slug));
    dbArticleEntries = published.map((a) => ({
      url: articleUrl(a.type, a.slug),
      lastModified: new Date(a.updated_at ?? a.date),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    }));
  } catch {}

  // MDX-only articles (those not already covered by DB)
  const guides: MetadataRoute.Sitemap = getAllGuides()
    .filter((a) => !dbSlugs.has(a.slug))
    .map((a) => ({
      url: `${BASE}/oglyady/${a.slug}`,
      lastModified: new Date(a.frontmatter.date),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    }));

  const tops: MetadataRoute.Sitemap = getAllTops()
    .filter((a) => !dbSlugs.has(a.slug))
    .map((a) => ({
      url: `${BASE}/top/${a.slug}`,
      lastModified: new Date(a.frontmatter.date),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    }));

  return [
    ...staticPages,
    ...categoryPages,
    ...subcategoryPages,
    ...dbArticleEntries,
    ...guides,
    ...tops,
  ];
}
