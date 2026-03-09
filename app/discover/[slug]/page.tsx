import { notFound } from "next/navigation";
import Link from "next/link";
import { getDiscoverPage, DISCOVER_PAGES } from "@/lib/discover-pages";
import { resolveImage } from "@/lib/images";
import { ENTITY_PAGES } from "@/lib/entity-pages";
import { getCategoryBySlug } from "@/lib/categories";
import { getAllArticlesForCategory, getAllArticlesForSubcategory } from "@/lib/mdx";
import type { Article } from "@/lib/mdx";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const config = getDiscoverPage(slug);
  if (!config) return {};

  // OG image: governed image if target exists, else first article image_url
  const articles = await aggregateArticles(config.sources).catch(() => [] as Article[]);
  const articleImageUrl = articles.find((a) => a.frontmatter.image_url)?.frontmatter.image_url ?? null;
  const ogImageUrl = await resolveImage("discover", slug, articleImageUrl);

  return {
    title: config.seo_title,
    description: config.seo_description,
    robots: config.status === "draft" ? { index: false } : undefined,
    alternates: { canonical: `https://comfortshop.com.ua/discover/${slug}` },
    openGraph: {
      type: "website",
      title: config.seo_title,
      description: config.seo_description,
      url: `https://comfortshop.com.ua/discover/${slug}`,
      images: ogImageUrl ? [{ url: ogImageUrl, width: 1200, height: 630, alt: config.title }] : [],
    },
  };
}

// ── helpers ──────────────────────────────────────────────────────────────────

async function aggregateArticles(
  sources: import("@/lib/discover-pages").DiscoverSource
): Promise<Article[]> {
  const results: Article[] = [];

  if (sources.categories) {
    for (const cat of sources.categories) {
      const arts = await getAllArticlesForCategory(cat).catch(() => [] as Article[]);
      results.push(...arts);
    }
  }

  if (sources.subcategories) {
    for (const { cat, sub } of sources.subcategories) {
      const arts = await getAllArticlesForSubcategory(cat, sub).catch(() => [] as Article[]);
      results.push(...arts);
    }
  }

  // Deduplicate by slug, keeping first occurrence (DB articles come first from helpers)
  const seen = new Set<string>();
  const deduped = results.filter((a) => {
    if (seen.has(a.slug)) return false;
    seen.add(a.slug);
    return true;
  });

  return deduped.sort(
    (a, b) => new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime()
  );
}

function articleUrl(type: string, slug: string) {
  return type === "top" ? `/top/${slug}` : `/oglyady/${slug}`;
}

// ── page ─────────────────────────────────────────────────────────────────────

export default async function DiscoverPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const config = getDiscoverPage(slug);
  if (!config) notFound();

  const articles = await aggregateArticles(config.sources);
  const minArticles = config.min_articles ?? 1;
  if (articles.length < minArticles) notFound();

  const featured = articles[0] ?? null;
  const remainingArticles = featured ? articles.slice(1) : articles;

  const now = Date.now();
  const isNew = (date: string) => now - new Date(date).getTime() < 14 * 24 * 60 * 60 * 1000;

  // Parent category for colors/icon (optional)
  const parentCat = config.parent_category ? getCategoryBySlug(config.parent_category) : null;
  const colorFrom = parentCat?.colorFrom ?? "#6366f1";
  const colorTo = parentCat?.colorTo ?? "#818cf8";
  const bgLight = parentCat?.bgLight ?? "#eef2ff";
  const icon = parentCat?.icon ?? "📄";

  // Related discover pages — only render if slug actually exists in config
  const relatedPages = (config.related_discover ?? [])
    .map((s) => DISCOVER_PAGES.find((p) => p.slug === s))
    .filter((p): p is NonNullable<typeof p> => p !== undefined);

  // Gift entity pages whose sources overlap with this discover page's sources
  const discoverCats = new Set(config.sources.categories ?? []);
  const discoverSubcats = config.sources.subcategories ?? [];
  const matchedGift = ENTITY_PAGES
    .filter((p) => p.status === "published")
    .flatMap((p) => {
      const hasSubMatch = discoverSubcats.some(({ cat: dc, sub: ds }) =>
        (p.sources.subcategories ?? []).some(({ cat: ec, sub: es }) => dc === ec && ds === es)
      );
      const hasCatMatch = (p.sources.categories ?? []).some((c) => discoverCats.has(c));
      if (!hasSubMatch && !hasCatMatch) return [];
      return [{ page: p, score: hasSubMatch ? 2 : 1 }];
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((m) => m.page);

  // JSON-LD
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Головна", item: "https://comfortshop.com.ua" },
      { "@type": "ListItem", position: 2, name: "Discover", item: "https://comfortshop.com.ua/discover" },
      { "@type": "ListItem", position: 3, name: config.title, item: `https://comfortshop.com.ua/discover/${slug}` },
    ],
  };

  const collectionPageLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: config.title,
    url: `https://comfortshop.com.ua/discover/${slug}`,
    description: config.seo_description,
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
        <Link href="/discover" className="hover:text-gray-600">Discover</Link>
        <span>›</span>
        <span className="text-gray-700">{config.title}</span>
      </nav>

      {/* Hero */}
      <div
        className="relative overflow-hidden rounded-2xl p-10 mb-10"
        style={{ background: `linear-gradient(145deg, ${colorFrom} 0%, ${colorTo} 100%)` }}
      >
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-end pr-10"
          style={{ fontSize: "12rem", opacity: 0.12, userSelect: "none" }}
          aria-hidden
        >
          {icon}
        </div>
        <div className="relative z-10">
          <p className="mb-3 text-5xl drop-shadow-md">{icon}</p>
          <h1 className="text-3xl font-extrabold text-white drop-shadow">{config.title}</h1>
          <div className="mt-2 flex items-center gap-4 text-sm text-white/70">
            {articles.length > 0 && <span>{articles.length} статей</span>}
          </div>
          {config.lead && (
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/80">{config.lead}</p>
          )}
        </div>
      </div>

      {/* Articles */}
      <div className="mt-4">
        <h2 className="mb-5 text-xl font-bold text-gray-900">Статті та огляди</h2>

        {/* Featured article */}
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
                style={{ background: `linear-gradient(135deg, ${colorFrom}33, ${colorTo}55)` }}
              >
                {icon}
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
                className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                {a.frontmatter.image_url ? (
                  <Link href={articleUrl(a.frontmatter.type, a.slug)}>
                    <img
                      src={a.frontmatter.image_url}
                      alt={a.frontmatter.title}
                      className="h-44 w-full object-cover"
                    />
                  </Link>
                ) : (
                  <div
                    className="flex h-44 w-full items-center justify-center text-5xl"
                    style={{ background: `linear-gradient(135deg, ${colorFrom}33, ${colorTo}55)` }}
                  >
                    {icon}
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
                      {new Date(a.frontmatter.date).toLocaleDateString("uk-UA", { day: "numeric", month: "long", year: "numeric" })}
                    </time>
                    <Link href={articleUrl(a.frontmatter.type, a.slug)} className="text-sm font-medium text-orange-600 hover:text-orange-700">
                      Читати →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Related discover pages */}
      {relatedPages.length > 0 && (
        <div className="mt-14">
          <h2 className="mb-5 text-xl font-bold text-gray-900">Схожі підбірки</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {relatedPages.map((p) => {
              const relCat = p.parent_category ? getCategoryBySlug(p.parent_category) : null;
              return (
                <Link
                  key={p.slug}
                  href={`/discover/${p.slug}`}
                  className="group flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
                >
                  <span
                    className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-2xl"
                    style={{ backgroundColor: relCat?.bgLight ?? "#f3f4f6" }}
                  >
                    {relCat?.icon ?? "📄"}
                  </span>
                  <div>
                    <p className="font-semibold text-gray-900 group-hover:text-orange-600 leading-snug">{p.title}</p>
                    {p.lead && <p className="mt-0.5 text-xs text-gray-400 line-clamp-1">{p.lead}</p>}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Gift entity pages — "Підійде як подарунок" */}
      {matchedGift.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Підійде як подарунок</h2>
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
        </div>
      )}

      {/* Back-link to parent category */}
      {config.parent_category && (
        <div className="mt-10 border-t border-gray-100 pt-8">
          <Link
            href={`/kategoriyi/${config.parent_category}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-orange-600"
          >
            ← Усі статті категорії «{parentCat?.name ?? config.parent_category}»
          </Link>
        </div>
      )}
    </main>
  );
}
