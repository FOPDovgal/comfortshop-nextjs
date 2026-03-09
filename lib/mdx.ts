import fs from "fs";
import path from "path";
import matter from "gray-matter";

const contentDir = path.join(process.cwd(), "content");

export type ArticleFrontmatter = {
  id?: number;
  title: string;
  slug: string;
  excerpt: string;
  type: "guide" | "top" | "review";
  category: string;
  subcategory?: string;
  category2?: string;
  subcategory2?: string;
  category3?: string;
  subcategory3?: string;
  lang: string;
  date: string;
  seo_title?: string;
  seo_description?: string;
  isHtml?: boolean;
  image_url?: string;
  // article-specific affiliate URLs (from DB fields or MDX frontmatter)
  affiliate_url_1?: string;
  affiliate_links?: Array<{
    label: string;
    url: string;
    platform: string;
  }>;
};

export type Article = {
  frontmatter: ArticleFrontmatter;
  content: string;
  slug: string;
};

function getFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith(".mdx"));
}

function readArticle(filePath: string): Article {
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  const slug = path.basename(filePath, ".mdx");
  return {
    frontmatter: data as ArticleFrontmatter,
    content,
    slug,
  };
}

export function getAllGuides(): Article[] {
  const dir = path.join(contentDir, "guides");
  return getFiles(dir)
    .map((f) => readArticle(path.join(dir, f)))
    .sort(
      (a, b) =>
        new Date(b.frontmatter.date).getTime() -
        new Date(a.frontmatter.date).getTime()
    );
}

export function getAllTops(): Article[] {
  const dir = path.join(contentDir, "top");
  return getFiles(dir)
    .map((f) => readArticle(path.join(dir, f)))
    .sort(
      (a, b) =>
        new Date(b.frontmatter.date).getTime() -
        new Date(a.frontmatter.date).getTime()
    );
}

export function getAllArticles(): Article[] {
  return [...getAllGuides(), ...getAllTops()].sort(
    (a, b) =>
      new Date(b.frontmatter.date).getTime() -
      new Date(a.frontmatter.date).getTime()
  );
}

export function getGuideBySlug(slug: string): Article | null {
  const filePath = path.join(contentDir, "guides", `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;
  return readArticle(filePath);
}

export function getTopBySlug(slug: string): Article | null {
  const filePath = path.join(contentDir, "top", `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;
  return readArticle(filePath);
}

// ── Async hybrid functions: DB-first, file fallback ──────────────────────────

import type { DBArticle } from "./articles";

function urlPlatform(url: string): "aliexpress" | "temu" | "other" {
  if (url.includes("aliexpress") || url.includes("s.click.aliexpress")) return "aliexpress";
  if (url.includes("temu.com")) return "temu";
  return "other";
}

function dbToArticle(db: DBArticle): Article {
  // Build affiliate_links from DB fields for top quick-access buttons
  const affiliate_links: ArticleFrontmatter["affiliate_links"] = [];
  if (db.affiliate_url_1) {
    const p = urlPlatform(db.affiliate_url_1);
    const label = p === "temu" ? "Купити на Temu" : p === "aliexpress" ? "Купити на AliExpress" : "Купити";
    affiliate_links.push({ label, url: db.affiliate_url_1, platform: p });
  }
  if (db.affiliate_url_2) {
    const p = urlPlatform(db.affiliate_url_2);
    affiliate_links.push({ label: "Також на AliExpress", url: db.affiliate_url_2, platform: p });
  }
  if (db.affiliate_url_3) {
    const p = urlPlatform(db.affiliate_url_3);
    affiliate_links.push({ label: "Ще варіант", url: db.affiliate_url_3, platform: p });
  }

  return {
    slug: db.slug,
    content: db.content,
    frontmatter: {
      id: db.id,
      title: db.title,
      slug: db.slug,
      excerpt: db.excerpt ?? "",
      type: db.type,
      category: db.category,
      subcategory: db.subcategory ?? undefined,
      category2: db.category2 ?? undefined,
      subcategory2: db.subcategory2 ?? undefined,
      category3: db.category3 ?? undefined,
      subcategory3: db.subcategory3 ?? undefined,
      lang: db.lang,
      date: new Date(db.date as unknown as string).toISOString().slice(0, 10),
      seo_title: db.seo_title ?? undefined,
      seo_description: db.seo_description ?? undefined,
      isHtml: true,
      image_url: db.image_url ?? undefined,
      affiliate_url_1: db.affiliate_url_1 ?? undefined,
      affiliate_links: affiliate_links.length > 0 ? affiliate_links : undefined,
    },
  };
}

export async function getGuideBySlugFull(slug: string): Promise<Article | null> {
  try {
    const { getDBArticleBySlug } = await import("./articles");
    const db = await getDBArticleBySlug(slug);
    if (db) return dbToArticle(db);
  } catch {}
  return getGuideBySlug(slug);
}

export async function getTopBySlugFull(slug: string): Promise<Article | null> {
  try {
    const { getDBArticleBySlug } = await import("./articles");
    const db = await getDBArticleBySlug(slug);
    if (db) return dbToArticle(db);
  } catch {}
  return getTopBySlug(slug);
}

export async function getAllGuidesAsync(): Promise<Article[]> {
  const fileArticles = getAllGuides();
  try {
    const { getDBArticlesByType } = await import("./articles");
    const dbArticles = await getDBArticlesByType(["guide", "review"]);
    const dbSlugs = new Set(dbArticles.map((a) => a.slug));
    const merged = [
      ...dbArticles.map(dbToArticle),
      ...fileArticles.filter((a) => !dbSlugs.has(a.slug)),
    ];
    return merged.sort(
      (a, b) => new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime()
    );
  } catch {
    return fileArticles;
  }
}

export async function getAllArticlesForCategory(categorySlug: string): Promise<Article[]> {
  const mdxAll = getAllArticles().filter((a) =>
    a.frontmatter.category === categorySlug ||
    a.frontmatter.category2 === categorySlug ||
    a.frontmatter.category3 === categorySlug
  );
  try {
    const { getPublishedArticlesByCategory } = await import("./articles");
    const dbArticles = await getPublishedArticlesByCategory(categorySlug);
    const dbSlugs = new Set(dbArticles.map((a) => a.slug));
    return [
      ...dbArticles.map(dbToArticle),
      ...mdxAll.filter((a) => !dbSlugs.has(a.slug)),
    ].sort((a, b) => new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime());
  } catch {
    return mdxAll;
  }
}

export async function getAllArticlesForSubcategory(
  categorySlug: string,
  subcategorySlug: string
): Promise<Article[]> {
  const mdxAll = getAllArticles().filter(
    (a) =>
      (a.frontmatter.category === categorySlug && a.frontmatter.subcategory === subcategorySlug) ||
      (a.frontmatter.category2 === categorySlug && a.frontmatter.subcategory2 === subcategorySlug) ||
      (a.frontmatter.category3 === categorySlug && a.frontmatter.subcategory3 === subcategorySlug)
  );
  try {
    const { getPublishedArticlesBySubcategory } = await import("./articles");
    const dbArticles = await getPublishedArticlesBySubcategory(categorySlug, subcategorySlug);
    const dbSlugs = new Set(dbArticles.map((a) => a.slug));
    return [
      ...dbArticles.map(dbToArticle),
      ...mdxAll.filter((a) => !dbSlugs.has(a.slug)),
    ].sort((a, b) => new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime());
  } catch {
    return mdxAll;
  }
}

export async function getAllTopsAsync(): Promise<Article[]> {
  const fileArticles = getAllTops();
  try {
    const { getDBArticlesByType } = await import("./articles");
    const dbArticles = await getDBArticlesByType(["top"]);
    const dbSlugs = new Set(dbArticles.map((a) => a.slug));
    const merged = [
      ...dbArticles.map(dbToArticle),
      ...fileArticles.filter((a) => !dbSlugs.has(a.slug)),
    ];
    return merged.sort(
      (a, b) => new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime()
    );
  } catch {
    return fileArticles;
  }
}
