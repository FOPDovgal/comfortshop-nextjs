import fs from "fs";
import path from "path";
import matter from "gray-matter";

const contentDir = path.join(process.cwd(), "content");

export type ArticleFrontmatter = {
  title: string;
  slug: string;
  excerpt: string;
  type: "guide" | "top" | "review";
  category: string;
  subcategory?: string;
  lang: string;
  date: string;
  seo_title?: string;
  seo_description?: string;
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

function dbToArticle(db: DBArticle): Article {
  return {
    slug: db.slug,
    content: db.content,
    frontmatter: {
      title: db.title,
      slug: db.slug,
      excerpt: db.excerpt ?? "",
      type: db.type,
      category: db.category,
      subcategory: db.subcategory ?? undefined,
      lang: db.lang,
      date: db.date.toString().slice(0, 10),
      seo_title: db.seo_title ?? undefined,
      seo_description: db.seo_description ?? undefined,
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
