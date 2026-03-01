import { getAllCategoryLinks } from "@/lib/affiliate";
import { getAllArticles } from "@/lib/mdx";
import { getAllDBArticles } from "@/lib/articles";
import AdminTabs from "./AdminTabs";
import type { ArticleMeta } from "./ArticlesTab";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  let links: Awaited<ReturnType<typeof getAllCategoryLinks>> = [];
  try {
    links = await getAllCategoryLinks();
  } catch (e) {
    console.error("DB error (links):", e);
  }

  // Merge DB articles (with id) + MDX file articles (without id)
  let dbArticles: Awaited<ReturnType<typeof getAllDBArticles>> = [];
  try {
    dbArticles = await getAllDBArticles();
  } catch (e) {
    console.error("DB error (articles):", e);
  }

  const dbSlugs = new Set(dbArticles.map((a) => a.slug));

  const fileArticles: ArticleMeta[] = getAllArticles()
    .filter((a) => !dbSlugs.has(a.slug))
    .map((a) => ({
      slug: a.slug,
      title: a.frontmatter.title,
      type: a.frontmatter.type,
      category: a.frontmatter.category,
      date: a.frontmatter.date,
      status: "published",
    }));

  const articles: ArticleMeta[] = [
    ...dbArticles.map((a) => ({
      id: a.id,
      slug: a.slug,
      title: a.title,
      type: a.type,
      category: a.category,
      date: new Date(a.date as unknown as string).toISOString().slice(0, 10),
      status: a.status,
      indexing_sent_at: a.indexing_sent_at ?? null,
    })),
    ...fileArticles,
  ];

  return <AdminTabs links={links} articles={articles} />;
}
