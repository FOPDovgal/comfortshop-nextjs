import Link from "next/link";
import { getAllTopsAsync } from "@/lib/mdx";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Топ-списки товарів",
  description: "Добірки найкращих товарів для дому та офісу: рейтинги, порівняння, рекомендації.",
};

export default async function TopPage() {
  const tops = await getAllTopsAsync();

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold text-gray-900">Топ-списки</h1>
      <div className="grid gap-6 md:grid-cols-2">
        {tops.map((article) => (
          <article
            key={article.slug}
            className="rounded-xl border border-gray-200 p-6 transition-shadow hover:shadow-md"
          >
            <span className="mb-2 inline-block rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700">
              Топ-список
            </span>
            <h2 className="mb-2 text-lg font-semibold text-gray-900">
              <Link href={`/top/${article.slug}`} className="hover:text-orange-600">
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
                href={`/top/${article.slug}`}
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
