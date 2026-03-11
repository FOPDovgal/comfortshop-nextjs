import Link from "next/link";
import AffiliateCTABlock from "@/components/AffiliateCTABlock";
import { DISCOVER_PAGES } from "@/lib/discover-pages";
import { ENTITY_PAGES } from "@/lib/entity-pages";

export type RelatedArticle = {
  slug: string;
  title: string;
  type: "guide" | "top" | "review";
  date: string;
};

type Props = {
  lang: "uk" | "ru" | "en";
  category: string;
  category2?: string | null;
  category3?: string | null;
  subcategory?: string | null;
  subcategory2?: string | null;
  subcategory3?: string | null;
  affiliateUrl?: string | null;
  relatedArticles: RelatedArticle[];
};

const STRINGS = {
  uk: {
    related: "Схожі статті",
    collections: "Пов\u2019язані добірки",
    gift: "Підійде як подарунок",
    top: "Топ-список",
    review: "Огляд",
  },
  ru: {
    related: "Похожие статьи",
    collections: "Связанные подборки",
    gift: "Подойдёт как подарок",
    top: "Топ-список",
    review: "Обзор",
  },
  en: {
    related: "Related articles",
    collections: "Related collections",
    gift: "Good as a gift",
    top: "Top list",
    review: "Review",
  },
} as const;

function articleUrl(lang: string, type: string, slug: string): string {
  const prefix = lang === "uk" ? "" : `/${lang}`;
  const section = type === "top" ? "top" : "oglyady";
  return `${prefix}/${section}/${slug}`;
}

export default async function ArticleBottomBlocks({
  lang,
  category,
  category2,
  category3,
  subcategory,
  subcategory2,
  subcategory3,
  affiliateUrl,
  relatedArticles,
}: Props) {
  const s = STRINGS[lang] ?? STRINGS.uk;
  const locale = lang === "ru" ? "ru-RU" : lang === "en" ? "en-US" : "uk-UA";

  const articleCats = [category, category2, category3].filter((c): c is string => Boolean(c));
  const articleSubcatPairs = (
    [
      [category, subcategory],
      [category2, subcategory2],
      [category3, subcategory3],
    ] as [string | undefined, string | undefined][]
  ).filter((p): p is [string, string] => Boolean(p[0] && p[1]));

  const matchedDiscover = DISCOVER_PAGES
    .filter((p) => p.status === "published")
    .flatMap((p) => {
      const cats = new Set(p.sources.categories ?? []);
      const hasSubMatch = (p.sources.subcategories ?? []).some(({ cat, sub }) =>
        articleSubcatPairs.some(([ac, as_]) => ac === cat && as_ === sub)
      );
      const hasCatMatch = articleCats.some((c) => cats.has(c));
      if (!hasSubMatch && !hasCatMatch) return [];
      return [{ page: p, score: hasSubMatch ? 2 : 1 }];
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((m) => m.page);

  const matchedGift = ENTITY_PAGES
    .filter((p) => p.status === "published")
    .flatMap((p) => {
      const cats = new Set(p.sources.categories ?? []);
      const hasSubMatch = (p.sources.subcategories ?? []).some(({ cat, sub }) =>
        articleSubcatPairs.some(([ac, as_]) => ac === cat && as_ === sub)
      );
      const hasCatMatch = articleCats.some((c) => cats.has(c));
      if (!hasSubMatch && !hasCatMatch) return [];
      return [{ page: p, score: hasSubMatch ? 2 : 1 }];
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((m) => m.page);

  return (
    <>
      <AffiliateCTABlock category={category} aliUrl={affiliateUrl ?? undefined} lang={lang} />

      {relatedArticles.length > 0 && (
        <section className="mt-12 border-t border-gray-100 pt-8">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">{s.related}</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {relatedArticles.map((a) => (
              <a
                key={a.slug}
                href={articleUrl(lang, a.type, a.slug)}
                className="group rounded-xl border border-gray-200 p-4 transition-shadow hover:shadow-md"
              >
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
                  {a.type === "top" ? s.top : s.review}
                </p>
                <h3 className="text-sm font-semibold leading-snug text-gray-900 group-hover:text-orange-600 line-clamp-3">
                  {a.title}
                </h3>
                <time
                  className="mt-2 block text-xs text-gray-400"
                  dateTime={new Date(a.date).toISOString()}
                >
                  {new Date(a.date).toLocaleDateString(locale, {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </time>
              </a>
            ))}
          </div>
        </section>
      )}

      {matchedDiscover.length > 0 && (
        <section className="mt-10 border-t border-gray-100 pt-8">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">{s.collections}</h2>
          <div className="flex flex-col gap-3">
            {matchedDiscover.map((p) => (
              <Link
                key={p.slug}
                href={`/discover/${p.slug}`}
                className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md"
              >
                <span className="text-xl">📋</span>
                <div>
                  <p className="font-semibold text-gray-900 group-hover:text-orange-600 leading-snug">{p.title}</p>
                  <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{p.seo_description}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {matchedGift.length > 0 && (
        <section className="mt-10 border-t border-gray-100 pt-8">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">{s.gift}</h2>
          <div className="flex flex-col gap-3">
            {matchedGift.map((p) => (
              <Link
                key={p.slug}
                href={`/podarunky/${p.slug}`}
                className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md"
              >
                <span className="text-xl">🎁</span>
                <div>
                  <p className="font-semibold text-gray-900 group-hover:text-orange-600 leading-snug">{p.title}</p>
                  <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{p.seo_description}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
