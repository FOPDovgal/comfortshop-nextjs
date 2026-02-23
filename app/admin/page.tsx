import { getAllCategoryLinks } from "@/lib/affiliate";
import { getAllArticles } from "@/lib/mdx";
import AdminTabs from "./AdminTabs";
import type { ArticleMeta } from "./ArticlesTab";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  let links: Awaited<ReturnType<typeof getAllCategoryLinks>> = [];
  try {
    links = await getAllCategoryLinks();
  } catch (e) {
    console.error("DB error:", e);
  }

  const articles: ArticleMeta[] = getAllArticles().map((a) => ({
    slug: a.slug,
    title: a.frontmatter.title,
    type: a.frontmatter.type,
    category: a.frontmatter.category,
    date: a.frontmatter.date,
  }));

  return <AdminTabs links={links} articles={articles} />;
}
