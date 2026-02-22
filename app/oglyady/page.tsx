import Link from "next/link";
import { getAllGuides } from "@/lib/mdx";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Огляди товарів",
  description: "Детальні огляди корисних товарів для дому та офісу з AliExpress та Temu.",
};

export default function OglyadyPage() {
  const guides = getAllGuides();

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold text-gray-900">Огляди товарів</h1>
      <div className="grid gap-6 md:grid-cols-2">
        {guides.map((article) => (
          <article
            key={article.slug}
            className="rounded-xl border border-gray-200 p-6 transition-shadow hover:shadow-md"
          >
            <h2 className="mb-2 text-lg font-semibold text-gray-900">
              <Link href={`/oglyady/${article.slug}`} className="hover:text-orange-600">
                {article.frontmatter.title}
              </Link>
            </h2>
            <p className="mb-4 text-sm text-gray-600">{article.frontmatter.excerpt}</p>
            <div className="flex items-center justify-between">
              <time className="text-xs text-gray-400">
                {new Date(article.frontmatter.date).toLocaleDateString("uk-UA", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </time>
              <Link
                href={`/oglyady/${article.slug}`}
                className="text-sm font-medium text-orange-600 hover:text-orange-700"
              >
                Читати →
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
