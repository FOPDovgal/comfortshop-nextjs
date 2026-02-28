import Link from "next/link";
import { getAllGuidesAsync, getAllTopsAsync } from "@/lib/mdx";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  return {
    title: q ? `Пошук: ${q}` : "Пошук статей",
    description: "Пошук по статтях ComfortShop",
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = (q ?? "").trim().toLowerCase();

  const [guides, tops] = await Promise.all([getAllGuidesAsync(), getAllTopsAsync()]);
  const all = [...guides, ...tops];

  const results = query
    ? all.filter((a) => {
        const haystack = [
          a.frontmatter.title,
          a.frontmatter.excerpt ?? "",
          a.frontmatter.category ?? "",
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(query);
      })
    : [];

  const urlPrefix = (type: string) => (type === "top" ? "/top" : "/oglyady");

  return (
    <div className="mx-auto max-w-3xl">
      {/* Search form */}
      <form method="GET" action="/search" className="mb-8">
        <div className="flex gap-2">
          <input
            type="text"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Пошук по статтях..."
            autoFocus
            className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-base text-gray-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
          />
          <button
            type="submit"
            className="rounded-xl bg-orange-500 px-6 py-3 text-base font-semibold text-white hover:bg-orange-600"
          >
            Знайти
          </button>
        </div>
      </form>

      {/* Results */}
      {!query ? (
        <p className="text-gray-500">Введіть запит для пошуку статей.</p>
      ) : results.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-6 py-10 text-center">
          <p className="text-lg font-semibold text-gray-700">Нічого не знайдено</p>
          <p className="mt-1 text-sm text-gray-500">
            Спробуйте інші ключові слова або перегляньте{" "}
            <Link href="/oglyady" className="text-orange-600 hover:underline">
              всі огляди
            </Link>
            .
          </p>
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm text-gray-500">
            Знайдено: <strong>{results.length}</strong>{" "}
            {results.length === 1 ? "стаття" : results.length < 5 ? "статті" : "статей"} за запитом{" "}
            <strong>«{q}»</strong>
          </p>
          <div className="flex flex-col gap-4">
            {results.map((article) => {
              const href = `${urlPrefix(article.frontmatter.type)}/${article.slug}`;
              return (
                <article
                  key={article.slug}
                  className="flex gap-4 overflow-hidden rounded-xl border border-gray-200 transition-shadow hover:shadow-md"
                >
                  {article.frontmatter.image_url && (
                    <Link href={href} className="shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={article.frontmatter.image_url}
                        alt={article.frontmatter.title}
                        className="h-28 w-28 object-cover"
                      />
                    </Link>
                  )}
                  <div className="flex flex-col justify-center py-4 pr-4">
                    <span className="mb-1 text-xs font-medium text-orange-600">
                      {article.frontmatter.type === "top" ? "Топ-список" : "Огляд"}
                    </span>
                    <h2 className="text-base font-semibold text-gray-900">
                      <Link href={href} className="hover:text-orange-600">
                        {article.frontmatter.title}
                      </Link>
                    </h2>
                    {article.frontmatter.excerpt && (
                      <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                        {article.frontmatter.excerpt}
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
