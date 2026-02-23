import type { MetadataRoute } from "next";
import { CATEGORIES } from "@/lib/categories";
import { getAllGuides, getAllTops } from "@/lib/mdx";

const BASE = "https://comfortshop.com.ua";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // ── Static pages ──────────────────────────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE,                    lastModified: now, changeFrequency: "daily",   priority: 1.0 },
    { url: `${BASE}/oglyady`,       lastModified: now, changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE}/top`,           lastModified: now, changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE}/kategoriyi`,    lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
  ];

  // ── Category pages ─────────────────────────────────────────────────────────
  const categoryPages: MetadataRoute.Sitemap = CATEGORIES.map((cat) => ({
    url: `${BASE}/kategoriyi/${cat.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  // ── Subcategory pages ──────────────────────────────────────────────────────
  const subcategoryPages: MetadataRoute.Sitemap = CATEGORIES.flatMap((cat) =>
    cat.subcategories.map((sub) => ({
      url: `${BASE}/kategoriyi/${cat.slug}/${sub.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    }))
  );

  // ── Guide articles ─────────────────────────────────────────────────────────
  const guides: MetadataRoute.Sitemap = getAllGuides().map((article) => ({
    url: `${BASE}/oglyady/${article.slug}`,
    lastModified: new Date(article.frontmatter.date),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  // ── Top articles ───────────────────────────────────────────────────────────
  const tops: MetadataRoute.Sitemap = getAllTops().map((article) => ({
    url: `${BASE}/top/${article.slug}`,
    lastModified: new Date(article.frontmatter.date),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [
    ...staticPages,
    ...categoryPages,
    ...subcategoryPages,
    ...guides,
    ...tops,
  ];
}
