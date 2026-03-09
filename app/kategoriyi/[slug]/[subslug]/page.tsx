import { notFound } from "next/navigation";
import Link from "next/link";
import { getCategoryBySlug, CATEGORIES } from "@/lib/categories";
import { getCategoryBySlugDB } from "@/lib/categories-db";
import { getAllArticlesForSubcategory } from "@/lib/mdx";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  const params: { slug: string; subslug: string }[] = [];
  for (const cat of CATEGORIES) {
    for (const sub of cat.subcategories) {
      params.push({ slug: cat.slug, subslug: sub.slug });
    }
  }
  return params;
}

type SubShape = {
  slug: string;
  name: string;
  icon: string;
  description?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
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
        subcategories: db.subcategories.map((s) => ({
          slug: s.slug,
          name: s.name,
          icon: s.icon,
          description: s.description,
          seo_title: s.seo_title,
          seo_description: s.seo_description,
        })),
      };
    }
  } catch {}
  return getCategoryBySlug(slug) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; subslug: string }>;
}): Promise<Metadata> {
  const { slug, subslug } = await params;
  const cat = await resolveCat(slug);
  const sub = cat?.subcategories.find((s) => s.slug === subslug);
  if (!cat || !sub) return {};

  // OG image priority chain:
  //   1. sub.og_image — dedicated field (not yet in DB; add here when ready)
  //   2. first article in subcategory with image_url
  //   3. FALLBACK_OG_IMAGE — set to "/og-default.png" when static file exists
  const FALLBACK_OG_IMAGE: string | null = null;
  const subArticles = await getAllArticlesForSubcategory(slug, subslug).catch(() => []);
  const ogImageUrl =
    subArticles.find((a) => a.frontmatter.image_url)?.frontmatter.image_url ??
    FALLBACK_OG_IMAGE;

  const title = sub.seo_title ?? `${sub.name} — ${cat.name} — ComfortShop`;
  const description =
    sub.seo_description ??
    `Огляди та підбірки товарів у підкатегорії «${sub.name}» розділу «${cat.name}».`;

  return {
    title,
    description,
    alternates: { canonical: `https://comfortshop.com.ua/kategoriyi/${slug}/${subslug}` },
    openGraph: {
      type: "website",
      title,
      description,
      url: `https://comfortshop.com.ua/kategoriyi/${slug}/${subslug}`,
      images: ogImageUrl ? [{ url: ogImageUrl, width: 1200, height: 630, alt: sub.name }] : [],
    },
  };
}

function articleUrl(type: string, slug: string) {
  return type === "top" ? `/top/${slug}` : `/oglyady/${slug}`;
}

export default async function SubcategoryPage({
  params,
}: {
  params: Promise<{ slug: string; subslug: string }>;
}) {
  const { slug, subslug } = await params;
  const cat = await resolveCat(slug);
  const sub = cat?.subcategories.find((s) => s.slug === subslug);
  if (!cat || !sub) notFound();

  const articles = await getAllArticlesForSubcategory(slug, subslug);

  // Featured: future override via sub.featured_slug → default to most recent article (index 0)
  // When sub.featured_slug is available in DB, replace null with that value
  const FEATURED_SLUG: string | null = null;
  const featuredIdx = FEATURED_SLUG
    ? Math.max(0, articles.findIndex((a) => a.slug === FEATURED_SLUG))
    : 0;
  const featured = articles[featuredIdx] ?? null;
  const remainingArticles = featured ? articles.filter((_, i) => i !== featuredIdx) : articles;

  const now = Date.now();
  const isNew = (date: string) => now - new Date(date).getTime() < 14 * 24 * 60 * 60 * 1000;

  // Sibling subcategories — siblings of current subcat (max 4, excluding self)
  const siblingSubcategories = cat.subcategories.filter((s) => s.slug !== subslug).slice(0, 4);

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Головна", item: "https://comfortshop.com.ua" },
      { "@type": "ListItem", position: 2, name: "Категорії", item: "https://comfortshop.com.ua/kategoriyi" },
      { "@type": "ListItem", position: 3, name: cat.name, item: `https://comfortshop.com.ua/kategoriyi/${slug}` },
      { "@type": "ListItem", position: 4, name: sub.name, item: `https://comfortshop.com.ua/kategoriyi/${slug}/${subslug}` },
    ],
  };

  const collectionPageLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: sub.name,
    url: `https://comfortshop.com.ua/kategoriyi/${slug}/${subslug}`,
    description: sub.seo_description ?? `Огляди та підбірки товарів у підкатегорії «${sub.name}».`,
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
        <Link href={`/kategoriyi/${cat.slug}/`} className="hover:text-gray-600">{cat.name}</Link>
        <span>›</span>
        <span className="text-gray-700">{sub.name}</span>
      </nav>

      {/* Hero */}
      <div
        className="relative overflow-hidden rounded-2xl p-8 mb-10"
        style={{
          background: `linear-gradient(145deg, ${cat.colorFrom} 0%, ${cat.colorTo} 100%)`,
        }}
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
            <h1 className="text-2xl font-extrabold text-white drop-shadow">
              {sub.name}
            </h1>
            {articles.length > 0 && (
              <p className="mt-1 text-sm text-white/70">{articles.length} статей</p>
            )}
          </div>
        </div>
      </div>

      {/* Subcategory description — shown before articles so it's visible on mobile */}
      {sub.description && (
        <div
          className="category-description prose prose-sm sm:prose-base max-w-none mt-6 mb-10"
          dangerouslySetInnerHTML={{ __html: sub.description }}
        />
      )}

      {/* Articles */}
      {articles.length === 0 ? (
        <div
          className="flex items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-24"
          style={{ backgroundColor: cat.bgLight }}
        >
          <div className="text-center text-gray-400">
            <p className="text-4xl mb-3">{sub.icon}</p>
            <p className="text-lg font-semibold text-gray-500">{sub.name}</p>
            <p className="text-sm mt-2">Статті з'являться тут найближчим часом</p>
            <Link
              href={`/kategoriyi/${cat.slug}/`}
              className="mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
              style={{ background: `linear-gradient(135deg, ${cat.colorFrom}, ${cat.colorTo})` }}
            >
              ← Назад до {cat.name}
            </Link>
          </div>
        </div>
      ) : (
        <>
          <h2 className="mb-4 text-xl font-bold text-gray-900">Огляди та підбірки</h2>
          {!sub.description && (
            <p className="mb-6 text-sm leading-relaxed text-gray-500">
              Актуальні матеріали у підкатегорії «{sub.name}». Регулярно додаємо нові огляди та рейтинги.
            </p>
          )}
          {/* Featured article — виділена стаття над основною сіткою */}
          {featured && (
            <article className="group mb-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md md:flex">
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
                  {sub.icon}
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

          {/* Back-to-category + remaining articles heading */}
          {remainingArticles.length > 0 && (
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Інші статті</h2>
              <Link href={`/kategoriyi/${cat.slug}/`} className="text-sm text-orange-600 hover:text-orange-700">
                ← Усі підкатегорії {cat.name}
              </Link>
            </div>
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
                      {sub.icon}
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

      {/* Sibling subcategories — інші підкатегорії батьківської категорії */}
      {siblingSubcategories.length > 0 && (
        <section className="mt-12 border-t border-gray-100 pt-8">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Інші підкатегорії {cat.name}</h2>
          <div className="flex flex-wrap gap-3">
            {siblingSubcategories.map((s) => (
              <Link
                key={s.slug}
                href={`/kategoriyi/${cat.slug}/${s.slug}/`}
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
