import { notFound } from "next/navigation";
import Link from "next/link";
import { getCategoryBySlugDB } from "@/lib/categories-db";
import { getCategoryBySlug, CATEGORIES } from "@/lib/categories";
import { getPublishedArticlesByCategoryLang } from "@/lib/articles";
import {
  isSupportedLang,
  getLangStrings,
  langPrefix,
  buildLanguagesMap,
  type Lang,
} from "@/lib/i18n";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type CatShape = {
  slug: string;
  name: string;
  icon: string;
  colorFrom: string;
  colorTo: string;
  bgLight: string;
  subcategories: { slug: string; name: string; icon: string }[];
};

async function resolveCat(slug: string): Promise<CatShape | null> {
  try {
    const db = await getCategoryBySlugDB(slug);
    if (db) {
      return {
        slug: db.slug,
        name: db.name,
        icon: db.icon,
        colorFrom: db.color_from,
        colorTo: db.color_to,
        bgLight: db.bg_light,
        subcategories: db.subcategories,
      };
    }
  } catch {}
  const hc = getCategoryBySlug(slug);
  return hc ?? null;
}

type Props = { params: Promise<{ lang: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isSupportedLang(lang) || lang === "uk") return {};
  const cat = await resolveCat(slug);
  if (!cat) return {};
  const l = lang as Lang;
  const selfUrl = `https://comfortshop.com.ua/${lang}/kategoriyi/${slug}`;
  const languages = buildLanguagesMap({
    uk: `/kategoriyi/${slug}`,
    [lang]: `/${lang}/kategoriyi/${slug}`,
  });
  const title = `${cat.name} — ComfortShop`;
  const description = `${getLangStrings(l).articlesSection}: ${cat.name}`;
  return {
    title,
    description,
    alternates: {
      canonical: selfUrl,
      ...(languages ? { languages } : {}),
    },
    openGraph: { type: "website", title, description, url: selfUrl },
  };
}

function articleUrl(type: string, slug: string, prefix: string) {
  return type === "top" ? `${prefix}/top/${slug}` : `${prefix}/oglyady/${slug}`;
}

export default async function TranslatedCategoryPage({ params }: Props) {
  const { lang, slug } = await params;
  if (!isSupportedLang(lang) || lang === "uk") notFound();
  const l = lang as Lang;
  const t = getLangStrings(l);
  const prefix = langPrefix(l);
  const locale = lang === "ru" ? "ru-RU" : "en-US";

  const cat = await resolveCat(slug);
  if (!cat) notFound();

  const articles = await getPublishedArticlesByCategoryLang(slug, lang);
  if (articles.length === 0) notFound();

  const now = Date.now();
  const isNew = (date: string) => now - new Date(date).getTime() < 14 * 24 * 60 * 60 * 1000;

  const featured = articles[0] ?? null;
  const remainingArticles = featured ? articles.slice(1) : [];

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: t.home, item: `https://comfortshop.com.ua${prefix}/` },
      { "@type": "ListItem", position: 2, name: t.categories, item: "https://comfortshop.com.ua/kategoriyi" },
      { "@type": "ListItem", position: 3, name: cat.name, item: `https://comfortshop.com.ua/${lang}/kategoriyi/${slug}` },
    ],
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-gray-400">
        <Link href={`${prefix}/`} className="hover:text-gray-600">{t.home}</Link>
        <span>›</span>
        <Link href="/kategoriyi" className="hover:text-gray-600">{t.categories}</Link>
        <span>›</span>
        <span className="text-gray-700">{cat.name}</span>
      </nav>

      {/* Hero */}
      <div
        className="relative overflow-hidden rounded-2xl p-10 mb-10"
        style={{ background: `linear-gradient(145deg, ${cat.colorFrom} 0%, ${cat.colorTo} 100%)` }}
      >
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-end pr-10"
          style={{ fontSize: "12rem", opacity: 0.12, userSelect: "none" }}
          aria-hidden
        >
          {cat.icon}
        </div>
        <div className="relative z-10">
          <p className="mb-3 text-5xl drop-shadow-md">{cat.icon}</p>
          <h1 className="text-3xl font-extrabold text-white drop-shadow">{cat.name}</h1>
          <div className="mt-2 flex items-center gap-4 text-sm text-white/70">
            <span>{cat.subcategories.length} {t.subcategories.toLowerCase()}</span>
            {articles.length > 0 && <span>{articles.length} {t.articlesLabel}</span>}
          </div>
        </div>
      </div>

      {/* Subcategory grid */}
      <h2 className="mb-5 text-xl font-bold text-gray-900">{t.subcategories}</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {cat.subcategories.map((sub) => (
          <Link
            key={sub.slug}
            href={`${prefix}/kategoriyi/${cat.slug}/${sub.slug}/`}
            className="group flex flex-col items-center gap-2 rounded-2xl bg-white p-5 text-center shadow-sm ring-1 ring-gray-100 transition-all hover:shadow-md hover:-translate-y-1"
          >
            <span
              className="flex h-14 w-14 items-center justify-center rounded-xl text-3xl"
              style={{ backgroundColor: cat.bgLight }}
            >
              {sub.icon}
            </span>
            <span className="text-sm font-medium leading-snug text-gray-700 group-hover:text-gray-900">
              {sub.name}
            </span>
          </Link>
        ))}
      </div>

      {/* Articles */}
      <div className="mt-14">
        <h2 className="mb-5 text-xl font-bold text-gray-900">{t.articlesSection}</h2>
        {articles.length === 0 ? (
          <div
            className="flex items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-16 text-gray-400"
            style={{ backgroundColor: cat.bgLight }}
          >
            <div className="text-center">
              <p className="text-3xl mb-2">{cat.icon}</p>
              <p className="text-sm mt-1">{t.noArticles}</p>
            </div>
          </div>
        ) : (
          <>
            {featured && (
              <article className="group mb-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md md:flex">
                {featured.image_url ? (
                  <Link href={articleUrl(featured.type, featured.slug, prefix)} className="block flex-shrink-0 md:w-2/5">
                    <img src={featured.image_url} alt={featured.title} className="h-56 w-full object-cover md:h-full" />
                  </Link>
                ) : (
                  <div
                    className="flex h-56 flex-shrink-0 items-center justify-center text-6xl md:h-auto md:w-2/5"
                    style={{ background: `linear-gradient(135deg, ${cat.colorFrom}33, ${cat.colorTo}55)` }}
                  >
                    {cat.icon}
                  </div>
                )}
                <div className="flex flex-col justify-between p-6">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                        {featured.type === "top" ? t.articleTypeTop : t.articleTypeReview}
                      </p>
                      {isNew(featured.date) && (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">{t.newBadge}</span>
                      )}
                    </div>
                    <h3 className="mb-3 text-xl font-bold leading-snug text-gray-900 group-hover:text-orange-600">
                      <Link href={articleUrl(featured.type, featured.slug, prefix)}>{featured.title}</Link>
                    </h3>
                    {featured.excerpt && (
                      <p className="text-sm text-gray-500 line-clamp-3">{featured.excerpt}</p>
                    )}
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <time className="text-xs text-gray-400" dateTime={new Date(featured.date).toISOString()}>
                      {new Date(featured.date).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" })}
                    </time>
                    <Link href={articleUrl(featured.type, featured.slug, prefix)} className="text-sm font-medium text-orange-600 hover:text-orange-700">
                      {t.readMore}
                    </Link>
                  </div>
                </div>
              </article>
            )}

            {remainingArticles.length > 0 && (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {remainingArticles.map((a) => (
                  <article key={a.slug} className="group rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md overflow-hidden">
                    {a.image_url ? (
                      <Link href={articleUrl(a.type, a.slug, prefix)}>
                        <img src={a.image_url} alt={a.title} className="w-full h-44 object-cover" />
                      </Link>
                    ) : (
                      <div className="w-full h-44 flex items-center justify-center text-5xl"
                        style={{ background: `linear-gradient(135deg, ${cat.colorFrom}33, ${cat.colorTo}55)` }}>
                        {cat.icon}
                      </div>
                    )}
                    <div className="p-5">
                      <div className="mb-2 flex items-center gap-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          {a.type === "top" ? t.articleTypeTop : t.articleTypeReview}
                        </p>
                        {isNew(a.date) && (
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">{t.newBadge}</span>
                        )}
                      </div>
                      <h3 className="mb-2 text-base font-semibold leading-snug text-gray-900 group-hover:text-orange-600">
                        <Link href={articleUrl(a.type, a.slug, prefix)}>{a.title}</Link>
                      </h3>
                      {a.excerpt && (
                        <p className="mb-4 text-sm text-gray-500 line-clamp-2">{a.excerpt}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <time className="text-xs text-gray-400" dateTime={new Date(a.date).toISOString()}>
                          {new Date(a.date).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" })}
                        </time>
                        <Link href={articleUrl(a.type, a.slug, prefix)} className="text-sm font-medium text-orange-600 hover:text-orange-700">
                          {t.readMore}
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
