import { notFound } from "next/navigation";
import Link from "next/link";
import { getCategoryBySlugDB } from "@/lib/categories-db";
import { getCategoryBySlug, CATEGORIES } from "@/lib/categories";
import { getPublishedArticlesBySubcategoryLang } from "@/lib/articles";
import {
  isSupportedLang,
  getLangStrings,
  langPrefix,
  buildLanguagesMap,
  type Lang,
} from "@/lib/i18n";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type SubShape = {
  slug: string;
  name: string;
  icon: string;
};

type CatShape = {
  slug: string;
  name: string;
  icon: string;
  colorFrom: string;
  colorTo: string;
  bgLight: string;
  subcategories: SubShape[];
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

type Props = { params: Promise<{ lang: string; slug: string; subslug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug, subslug } = await params;
  if (!isSupportedLang(lang) || lang === "uk") return {};
  const cat = await resolveCat(slug);
  const sub = cat?.subcategories.find((s) => s.slug === subslug);
  if (!cat || !sub) return {};
  const l = lang as Lang;
  const t = getLangStrings(l);
  const selfUrl = `https://comfortshop.com.ua/${lang}/kategoriyi/${slug}/${subslug}`;
  const languages = buildLanguagesMap({
    uk: `/kategoriyi/${slug}/${subslug}`,
    [lang]: `/${lang}/kategoriyi/${slug}/${subslug}`,
  });
  const title = `${sub.name} — ${cat.name} — ComfortShop`;
  const description = `${t.articlesSection}: ${sub.name}`;
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

export default async function TranslatedSubcategoryPage({ params }: Props) {
  const { lang, slug, subslug } = await params;
  if (!isSupportedLang(lang) || lang === "uk") notFound();
  const l = lang as Lang;
  const t = getLangStrings(l);
  const prefix = langPrefix(l);
  const locale = lang === "ru" ? "ru-RU" : "en-US";

  const cat = await resolveCat(slug);
  const sub = cat?.subcategories.find((s) => s.slug === subslug);
  if (!cat || !sub) notFound();

  const articles = await getPublishedArticlesBySubcategoryLang(slug, subslug, lang);

  const now = Date.now();
  const isNew = (date: string) => now - new Date(date).getTime() < 14 * 24 * 60 * 60 * 1000;

  const featured = articles[0] ?? null;
  const remainingArticles = featured ? articles.slice(1) : [];
  const siblingSubcategories = cat.subcategories.filter((s) => s.slug !== subslug).slice(0, 4);

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: t.home, item: `https://comfortshop.com.ua${prefix}/` },
      { "@type": "ListItem", position: 2, name: t.categories, item: "https://comfortshop.com.ua/kategoriyi" },
      { "@type": "ListItem", position: 3, name: cat.name, item: `https://comfortshop.com.ua/${lang}/kategoriyi/${slug}` },
      { "@type": "ListItem", position: 4, name: sub.name, item: `https://comfortshop.com.ua/${lang}/kategoriyi/${slug}/${subslug}` },
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
        <Link href={`${prefix}/kategoriyi/${cat.slug}/`} className="hover:text-gray-600">{cat.name}</Link>
        <span>›</span>
        <span className="text-gray-700">{sub.name}</span>
      </nav>

      {/* Hero */}
      <div
        className="relative overflow-hidden rounded-2xl p-8 mb-10"
        style={{ background: `linear-gradient(145deg, ${cat.colorFrom} 0%, ${cat.colorTo} 100%)` }}
      >
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-end pr-10 select-none"
          style={{ fontSize: "10rem", opacity: 0.12 }}
          aria-hidden
        >
          {sub.icon}
        </div>
        <div className="relative z-10 flex items-end gap-4">
          <span
            className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl text-4xl"
            style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
          >
            {sub.icon}
          </span>
          <div>
            <p className="text-sm font-medium text-white/70 mb-1">{cat.icon} {cat.name}</p>
            <h1 className="text-2xl font-extrabold text-white drop-shadow">{sub.name}</h1>
            {articles.length > 0 && (
              <p className="mt-1 text-sm text-white/70">{articles.length} {t.articlesLabel}</p>
            )}
          </div>
        </div>
      </div>

      {/* Articles */}
      {articles.length === 0 ? (
        <div
          className="flex items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-24"
          style={{ backgroundColor: cat.bgLight }}
        >
          <div className="text-center text-gray-400">
            <p className="text-4xl mb-3">{sub.icon}</p>
            <p className="text-lg font-semibold text-gray-500">{sub.name}</p>
            <p className="text-sm mt-2">{t.noArticles}</p>
            <Link
              href={`${prefix}/kategoriyi/${cat.slug}/`}
              className="mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
              style={{ background: `linear-gradient(135deg, ${cat.colorFrom}, ${cat.colorTo})` }}
            >
              ← {t.backTo} {cat.name}
            </Link>
          </div>
        </div>
      ) : (
        <>
          <h2 className="mb-4 text-xl font-bold text-gray-900">{t.articlesSection}</h2>

          {featured && (
            <article className="group mb-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md md:flex">
              {featured.image_url ? (
                <Link href={articleUrl(featured.type, featured.slug, prefix)} className="block flex-shrink-0 md:w-2/5">
                  <img src={featured.image_url} alt={featured.title} className="h-56 w-full object-cover md:h-full" />
                </Link>
              ) : (
                <div
                  className="flex h-56 flex-shrink-0 items-center justify-center text-6xl md:h-auto md:w-2/5"
                  style={{ background: `linear-gradient(135deg, ${cat.colorFrom}33, ${cat.colorTo}55)` }}
                >
                  {sub.icon}
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
            <>
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">{t.articlesSection}</h2>
                <Link href={`${prefix}/kategoriyi/${cat.slug}/`} className="text-sm text-orange-600 hover:text-orange-700">
                  ← {t.backTo} {cat.name}
                </Link>
              </div>
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
                        {sub.icon}
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
            </>
          )}
        </>
      )}

      {/* Sibling subcategories */}
      {siblingSubcategories.length > 0 && (
        <section className="mt-12 border-t border-gray-100 pt-8">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">{t.subcategories} — {cat.name}</h2>
          <div className="flex flex-wrap gap-3">
            {siblingSubcategories.map((s) => (
              <Link
                key={s.slug}
                href={`${prefix}/kategoriyi/${cat.slug}/${s.slug}/`}
                className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"
              >
                <span>{s.icon}</span>
                <span>{s.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
