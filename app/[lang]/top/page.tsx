import Link from "next/link";
import { notFound } from "next/navigation";
import {
  isSupportedLang,
  getLangStrings,
  langPrefix,
  buildLanguagesMap,
  type Lang,
} from "@/lib/i18n";
import { getDBArticlesByTypeLang } from "@/lib/articles";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isSupportedLang(lang) || lang === "uk") return {};
  const t = getLangStrings(lang as Lang);
  const selfUrl = `https://comfortshop.com.ua/${lang}/top`;
  const languages = buildLanguagesMap({ uk: "/top", [lang]: `/${lang}/top` });
  return {
    title: t.listingTop,
    description: t.listingTopDesc,
    alternates: {
      canonical: selfUrl,
      ...(languages ? { languages } : {}),
    },
  };
}

export default async function TranslatedTopPage({ params }: Props) {
  const { lang } = await params;
  if (!isSupportedLang(lang) || lang === "uk") notFound();
  const l = lang as Lang;
  const t = getLangStrings(l);
  const prefix = langPrefix(l);
  const locale = lang === "ru" ? "ru-RU" : "en-US";

  const articles = await getDBArticlesByTypeLang(["top"], lang);

  const now = Date.now();
  const isNew = (date: string) => now - new Date(date).getTime() < 14 * 24 * 60 * 60 * 1000;

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold text-gray-900">{t.listingTop}</h1>
      <div className="grid gap-6 md:grid-cols-2">
        {articles.map((article) => (
          <article
            key={article.slug}
            className="overflow-hidden rounded-xl border border-gray-200 transition-shadow hover:shadow-md"
          >
            {article.image_url && (
              <Link href={`${prefix}/top/${article.slug}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={article.image_url}
                  alt={article.title}
                  className="w-full h-44 object-cover"
                />
              </Link>
            )}
            <div className="p-5">
              <span className="mb-2 inline-block rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700">
                {t.articleTypeTop}
              </span>
              <h2 className="mb-2 text-lg font-semibold text-gray-900">
                <Link
                  href={`${prefix}/top/${article.slug}`}
                  className="hover:text-orange-600"
                >
                  {article.title}
                </Link>
              </h2>
              {article.excerpt && (
                <p className="mb-4 text-sm text-gray-600">{article.excerpt}</p>
              )}
              <div className="flex items-center justify-between">
                <time
                  className="text-xs text-gray-400"
                  dateTime={new Date(article.date).toISOString()}
                >
                  {new Date(article.date).toLocaleDateString(locale, {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </time>
                <div className="flex items-center gap-2">
                  {isNew(article.date) && (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                      {t.newBadge}
                    </span>
                  )}
                  <Link
                    href={`${prefix}/top/${article.slug}`}
                    className="text-sm font-medium text-orange-600 hover:text-orange-700"
                  >
                    {t.readMore}
                  </Link>
                </div>
              </div>
            </div>
          </article>
        ))}
        {articles.length === 0 && (
          <div className="col-span-2 py-16 text-center text-gray-400">
            <p className="text-lg font-medium">{t.noArticles}</p>
          </div>
        )}
      </div>
    </div>
  );
}
