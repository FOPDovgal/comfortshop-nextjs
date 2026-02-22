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
