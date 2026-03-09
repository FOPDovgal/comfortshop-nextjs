import { notFound } from "next/navigation";
import Link from "next/link";
import { getCategoryBySlug, CATEGORIES } from "@/lib/categories";
import { getCategoryBySlugDB } from "@/lib/categories-db";
import { resolveImage } from "@/lib/images";
import { getAllArticlesForCategory } from "@/lib/mdx";
import { DISCOVER_PAGES } from "@/lib/discover-pages";
import { ENTITY_PAGES } from "@/lib/entity-pages";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.slug }));
}

type CatShape = {
  slug: string;
  name: string;
  icon: string;
  colorFrom: string;
  colorTo: string;
  bgLight: string;
  description?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
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
        description: db.description,
        seo_title: db.seo_title,
        seo_description: db.seo_description,
        subcategories: db.subcategories,
      };
    }
  } catch {}
  return getCategoryBySlug(slug) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const cat = await resolveCat(slug);
  if (!cat) return {};

  // OG image priority chain:
  //   1. image_targets → approved asset (governed image via resolveImage)
  //   2. first article in category with image_url
  //   3. FALLBACK_OG_IMAGE — set to "/og-default.png" when static file exists
  const FALLBACK_OG_IMAGE: string | null = null;
  const catArticles = await getAllArticlesForCategory(slug).catch(() => []);
  const articleImageUrl =
    catArticles.find((a) => a.frontmatter.image_url)?.frontmatter.image_url ??
    FALLBACK_OG_IMAGE;
  const ogImageUrl = await resolveImage("category", slug, articleImageUrl);

  const title = cat.seo_title ?? `${cat.name} — ComfortShop`;
  const description =
    cat.seo_description ??
    `Огляди, рейтинги та підбірки у категорії «${cat.name}». Підкатегорії: ${cat.subcategories.map((s) => s.name).join(", ")}.`;

  return {
    title,
    description,
    alternates: { canonical: `https://comfortshop.com.ua/kategoriyi/${slug}` },
    openGraph: {
      type: "website",
      title,
      description,
      url: `https://comfortshop.com.ua/kategoriyi/${slug}`,
      images: ogImageUrl ? [{ url: ogImageUrl, width: 1200, height: 630, alt: cat.name }] : [],
    },
  };
}

function articleUrl(type: string, slug: string) {
  return type === "top" ? `/top/${slug}` : `/oglyady/${slug}`;
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cat = await resolveCat(slug);
  if (!cat) notFound();

  const articles = await getAllArticlesForCategory(slug);

  // Featured: future override via cat.featured_slug → default to most recent article (index 0)
  // When cat.featured_slug is available in DB, replace null with that value
  const FEATURED_SLUG: string | null = null;
  const featuredIdx = FEATURED_SLUG
    ? Math.max(0, articles.findIndex((a) => a.slug === FEATURED_SLUG))
    : 0;
  const featured = articles[featuredIdx] ?? null;
  const remainingArticles = featured ? articles.filter((_, i) => i !== featuredIdx) : articles;

  const now = Date.now();
  const isNew = (date: string) => now - new Date(date).getTime() < 14 * 24 * 60 * 60 * 1000;

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Головна", item: "https://comfortshop.com.ua" },
      { "@type": "ListItem", position: 2, name: "Категорії", item: "https://comfortshop.com.ua/kategoriyi" },
      { "@type": "ListItem", position: 3, name: cat.name, item: `https://comfortshop.com.ua/kategoriyi/${slug}` },
    ],
  };

  const collectionPageLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: cat.name,
    url: `https://comfortshop.com.ua/kategoriyi/${slug}`,
    description: cat.seo_description ?? `Огляди та підбірки у категорії «${cat.name}».`,
    hasPart: articles.slice(0, 5).map((a) => ({
      "@type": "Article",
      name: a.frontmatter.title,
      url: `https://comfortshop.com.ua${articleUrl(a.frontmatter.type, a.slug)}`,
    })),
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPageLd) }} />
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-gray-400">
        <Link href="/" className="hover:text-gray-600">Головна</Link>
        <span>›</span>
        <Link href="/kategoriyi" className="hover:text-gray-600">Категорії</Link>
        <span>›</span>
        <span className="text-gray-700">{cat.name}</span>
      </nav>

      {/* Hero */}
      <div
        className="relative overflow-hidden rounded-2xl p-10 mb-10"
        style={{
          background: `linear-gradient(145deg, ${cat.colorFrom} 0%, ${cat.colorTo} 100%)`,
        }}
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
            <span>{cat.subcategories.length} підкатегорій</span>
            {articles.length > 0 && <span>{articles.length} статей</span>}
          </div>
        </div>
      </div>

      {/* Subcategory grid */}
      <h2 className="mb-5 text-xl font-bold text-gray-900">Підкатегорії</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {cat.subcategories.map((sub) => (
          <Link
            key={sub.slug}
            href={`/kategoriyi/${cat.slug}/${sub.slug}/`}
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

      {/* Discover добірки for this category */}
      {(() => {
        const discoverLinks = DISCOVER_PAGES.filter(
          (p) => p.status === "published" && p.parent_category === cat.slug
        );
        if (discoverLinks.length === 0) return null;
        return (
          <div className="mt-10">
            <h2 className="mb-4 text-xl font-bold text-gray-900">Добірки</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {discoverLinks.map((p) => (
                <Link
                  key={p.slug}
                  href={`/discover/${p.slug}`}
                  className="group flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
                >
                  <span
                    className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-2xl"
                    style={{ backgroundColor: cat.bgLight }}
                  >
                    {cat.icon}
                  </span>
                  <div>
                    <p className="font-semibold text-gray-900 group-hover:text-orange-600 leading-snug">
                      {p.title}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-400 line-clamp-1">{p.seo_description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Gift entity pages for this category */}
      {(() => {
        const giftLinks = ENTITY_PAGES.filter(
          (p) => p.status === "published" && p.parent_category === cat.slug
        );
        if (giftLinks.length === 0) return null;
        return (
          <div className="mt-10">
            <h2 className="mb-4 text-xl font-bold text-gray-900">Ідеї подарунків</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {giftLinks.map((p) => (
                <Link
                  key={p.slug}
                  href={`/podarunky/${p.slug}`}
                  className="group flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
                >
                  <span
                    className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-2xl"
                    style={{ backgroundColor: cat.bgLight }}
                  >
                    🎁
                  </span>
                  <div>
                    <p className="font-semibold text-gray-900 group-hover:text-orange-600 leading-snug">
                      {p.title}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-400 line-clamp-1">{p.seo_description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Category description — shown before articles so it's visible on mobile */}
      {cat.description && (
        <div
          className="category-description prose prose-sm sm:prose-base max-w-none mt-10 mb-10"
          dangerouslySetInnerHTML={{ __html: cat.description }}
        />
      )}

      {/* Articles */}
      <div className="mt-14">
        {!cat.description && articles.length > 0 && (
          <p className="mb-5 text-sm leading-relaxed text-gray-500">
            Актуальні огляди та підбірки у категорії «{cat.name}». Матеріали регулярно доповнюються.
          </p>
        )}
        <h2 className="mb-5 text-xl font-bold text-gray-900">Статті та огляди</h2>
        {articles.length === 0 ? (
          <div
            className="flex items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-16 text-gray-400"
            style={{ backgroundColor: cat.bgLight }}
          >
            <div className="text-center">
              <p className="text-3xl mb-2">{cat.icon}</p>
              <p className="font-medium">Статті з'являться тут</p>
              <p className="text-sm mt-1">Скоро додамо огляди та топ-підбірки у цій категорії</p>
            </div>
          </div>
        ) : (
          <>
            {/* Featured article — виділена стаття над основною сіткою */}
            {featured && (
              <article className="group mb-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md md:flex">
                {featured.frontmatter.image_url ? (
                  <Link href={articleUrl(featured.frontmatter.type, featured.slug)} className="block flex-shrink-0 md:w-2/5">
                    <img
                      src={featured.frontmatter.image_url}
                      alt={featured.frontmatter.title}
                      className="h-56 w-full object-cover md:h-full"
                    />
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
                        {featured.frontmatter.type === "top" ? "Топ-підбірка" : "Огляд"}
                      </p>
                      {isNew(featured.frontmatter.date) && (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">Нове</span>
                      )}
                    </div>
                    <h3 className="mb-3 text-xl font-bold leading-snug text-gray-900 group-hover:text-orange-600">
                      <Link href={articleUrl(featured.frontmatter.type, featured.slug)}>
                        {featured.frontmatter.title}
                      </Link>
                    </h3>
                    {featured.frontmatter.excerpt && (
                      <p className="text-sm text-gray-500 line-clamp-3">{featured.frontmatter.excerpt}</p>
                    )}
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <time className="text-xs text-gray-400" dateTime={new Date(featured.frontmatter.date).toISOString()}>
                      {new Date(featured.frontmatter.date).toLocaleDateString("uk-UA", { day: "numeric", month: "long", year: "numeric" })}
                    </time>
                    <Link href={articleUrl(featured.frontmatter.type, featured.slug)} className="text-sm font-medium text-orange-600 hover:text-orange-700">
                      Читати →
                    </Link>
                  </div>
                </div>
              </article>
            )}

            {/* Remaining articles grid */}
            {remainingArticles.length > 0 && (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {remainingArticles.map((a) => (
                  <article
                    key={a.slug}
                    className="group rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md overflow-hidden"
                  >
                    {a.frontmatter.image_url ? (
                      <Link href={articleUrl(a.frontmatter.type, a.slug)}>
                        <img
                          src={a.frontmatter.image_url}
                          alt={a.frontmatter.title}
                          className="w-full h-44 object-cover"
                        />
                      </Link>
                    ) : (
                      <div
                        className="w-full h-44 flex items-center justify-center text-5xl"
                        style={{ background: `linear-gradient(135deg, ${cat.colorFrom}33, ${cat.colorTo}55)` }}
                      >
                        {cat.icon}
                      </div>
                    )}
                    <div className="p-5">
                      <div className="mb-2 flex items-center gap-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          {a.frontmatter.type === "top" ? "Топ-підбірка" : "Огляд"}
                        </p>
                        {isNew(a.frontmatter.date) && (
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">Нове</span>
                        )}
                      </div>
                      <h3 className="mb-2 text-base font-semibold leading-snug text-gray-900 group-hover:text-orange-600">
                        <Link href={articleUrl(a.frontmatter.type, a.slug)}>
                          {a.frontmatter.title}
                        </Link>
                      </h3>
                      {a.frontmatter.excerpt && (
                        <p className="mb-4 text-sm text-gray-500 line-clamp-2">{a.frontmatter.excerpt}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <time className="text-xs text-gray-400" dateTime={new Date(a.frontmatter.date).toISOString()}>
                          {new Date(a.frontmatter.date).toLocaleDateString("uk-UA", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </time>
                        <Link
                          href={articleUrl(a.frontmatter.type, a.slug)}
                          className="text-sm font-medium text-orange-600 hover:text-orange-700"
                        >
                          Читати →
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
