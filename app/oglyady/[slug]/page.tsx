import { notFound } from "next/navigation";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getAllGuides, getGuideBySlugFull, getAllArticlesForCategory } from "@/lib/mdx";
import { processDbContent } from "@/lib/html-process";
import AffiliateCTABlock from "@/components/AffiliateCTABlock";
import MdxImg from "@/components/MdxImg";
import { DISCOVER_PAGES } from "@/lib/discover-pages";
import { ENTITY_PAGES } from "@/lib/entity-pages";
import { resolveImage } from "@/lib/images";
import { getArticleAlternates, buildLanguagesMap } from "@/lib/i18n";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const guides = getAllGuides();
  return guides.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getGuideBySlugFull(slug);
  if (!article) return {};
  const { frontmatter } = article;
  const resolvedImage = await resolveImage("article", frontmatter.id != null ? String(frontmatter.id) : null, frontmatter.image_url ?? null);
  const title = frontmatter.seo_title ?? frontmatter.title;
  const description = frontmatter.seo_description ?? frontmatter.excerpt ?? "";
  const images = resolvedImage
    ? [{ url: resolvedImage, width: 1200, height: 630, alt: frontmatter.title }]
    : [];
  const selfUrl = `https://comfortshop.com.ua/oglyady/${slug}`;
  const alts = frontmatter.id != null ? await getArticleAlternates(frontmatter.id) : {};
  const languages = buildLanguagesMap(alts);

  return {
    title,
    description,
    alternates: { canonical: selfUrl, ...(languages ? { languages } : {}) },
    openGraph: {
      type: "article",
      title,
      description,
      url: selfUrl,
      images,
      publishedTime: new Date(frontmatter.date).toISOString(),
      modifiedTime: new Date(frontmatter.date).toISOString(),
    },
  };
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const article = await getGuideBySlugFull(slug);
  if (!article) notFound();

  const { frontmatter } = article;
  // Strip leading # H1 from content — title is displayed separately below
  const content = article.content.replace(/^#[^\n]*\n+/, "");
  const resolvedImage = await resolveImage("article", frontmatter.id != null ? String(frontmatter.id) : null, frontmatter.image_url ?? null);

  const allInCategory = await getAllArticlesForCategory(frontmatter.category).catch(() => []);
  const relatedArticles = allInCategory.filter((a) => a.slug !== slug).slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: frontmatter.title,
    image: resolvedImage ? [resolvedImage] : [],
    datePublished: new Date(frontmatter.date).toISOString(),
    dateModified: new Date(frontmatter.date).toISOString(),
    author: { "@type": "Organization", name: "ComfortShop", url: "https://comfortshop.com.ua" },
    publisher: { "@type": "Organization", name: "ComfortShop", url: "https://comfortshop.com.ua" },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Головна", item: "https://comfortshop.com.ua" },
      { "@type": "ListItem", position: 2, name: "Огляди", item: "https://comfortshop.com.ua/oglyady" },
      { "@type": "ListItem", position: 3, name: frontmatter.title, item: `https://comfortshop.com.ua/oglyady/${slug}` },
    ],
  };

  return (
    <div className="mx-auto max-w-3xl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-gray-500">
        <a href="/" className="hover:text-gray-900">Головна</a>
        {" / "}
        <a href="/oglyady" className="hover:text-gray-900">Огляди</a>
        {" / "}
        <span>{frontmatter.title}</span>
      </nav>

      {/* Title */}
      <h1 className="mb-4 text-3xl font-bold leading-tight text-gray-900">
        {frontmatter.title}
      </h1>

      {/* Meta */}
      <div className="mb-6 flex items-center gap-3">
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
          Огляд
        </span>
        <time className="text-sm text-gray-400" dateTime={new Date(frontmatter.date).toISOString()}>
          {new Date(frontmatter.date).toLocaleDateString("uk-UA", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </time>
      </div>

      {/* Cover image */}
      {resolvedImage && (
        <div className="mb-8 overflow-hidden rounded-2xl shadow-sm">
          <img
            src={resolvedImage}
            alt={frontmatter.title}
            className="w-full max-h-80 object-cover"
          />
        </div>
      )}

      {/* Content */}
      <article className="prose prose-gray max-w-none">
        {frontmatter.isHtml ? (
          <div dangerouslySetInnerHTML={{ __html: processDbContent(content) }} />
        ) : (
          <MDXRemote source={content} components={{ Img: MdxImg }} />
        )}
      </article>

      {/* "Де купити" block — article-specific link takes priority over category link */}
      <AffiliateCTABlock category={frontmatter.category} aliUrl={frontmatter.affiliate_url_1} />

      {/* Related articles */}
      {relatedArticles.length > 0 && (
        <section className="mt-12 border-t border-gray-100 pt-8">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Схожі статті</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {relatedArticles.map((a) => {
              const href = a.frontmatter.type === "top" ? `/top/${a.slug}` : `/oglyady/${a.slug}`;
              return (
                <a
                  key={a.slug}
                  href={href}
                  className="group rounded-xl border border-gray-200 p-4 transition-shadow hover:shadow-md"
                >
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
                    {a.frontmatter.type === "top" ? "Топ-список" : "Огляд"}
                  </p>
                  <h3 className="text-sm font-semibold leading-snug text-gray-900 group-hover:text-orange-600 line-clamp-3">
                    {a.frontmatter.title}
                  </h3>
                  <time
                    className="mt-2 block text-xs text-gray-400"
                    dateTime={new Date(a.frontmatter.date).toISOString()}
                  >
                    {new Date(a.frontmatter.date).toLocaleDateString("uk-UA", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </time>
                </a>
              );
            })}
          </div>
        </section>
      )}

      {/* Related discover pages */}
      {(() => {
        const articleCats = [frontmatter.category, frontmatter.category2, frontmatter.category3].filter((c): c is string => Boolean(c));
        const articleSubcatPairs = (
          [[frontmatter.category, frontmatter.subcategory], [frontmatter.category2, frontmatter.subcategory2], [frontmatter.category3, frontmatter.subcategory3]] as [string | undefined, string | undefined][]
        ).filter((p): p is [string, string] => Boolean(p[0] && p[1]));

        const matched = DISCOVER_PAGES
          .filter((p) => p.status === "published")
          .flatMap((p) => {
            const cats = new Set(p.sources.categories ?? []);
            const hasSubMatch = (p.sources.subcategories ?? []).some(({ cat, sub }) =>
              articleSubcatPairs.some(([ac, as]) => ac === cat && as === sub)
            );
            const hasCatMatch = articleCats.some((c) => cats.has(c));
            if (!hasSubMatch && !hasCatMatch) return [];
            return [{ page: p, score: hasSubMatch ? 2 : 1 }];
          })
          .sort((a, b) => b.score - a.score)
          .slice(0, 3)
          .map((m) => m.page);

        if (matched.length === 0) return null;
        return (
          <section className="mt-10 border-t border-gray-100 pt-8">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Пов&apos;язані добірки</h2>
            <div className="flex flex-col gap-3">
              {matched.map((p) => (
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
        );
      })()}

      {/* Gift entity pages — "Підійде як подарунок" */}
      {(() => {
        const articleCats = [frontmatter.category, frontmatter.category2, frontmatter.category3].filter((c): c is string => Boolean(c));
        const articleSubcatPairs = (
          [[frontmatter.category, frontmatter.subcategory], [frontmatter.category2, frontmatter.subcategory2], [frontmatter.category3, frontmatter.subcategory3]] as [string | undefined, string | undefined][]
        ).filter((p): p is [string, string] => Boolean(p[0] && p[1]));

        const matched = ENTITY_PAGES
          .filter((p) => p.status === "published")
          .flatMap((p) => {
            const cats = new Set(p.sources.categories ?? []);
            const hasSubMatch = (p.sources.subcategories ?? []).some(({ cat, sub }) =>
              articleSubcatPairs.some(([ac, as]) => ac === cat && as === sub)
            );
            const hasCatMatch = articleCats.some((c) => cats.has(c));
            if (!hasSubMatch && !hasCatMatch) return [];
            return [{ page: p, score: hasSubMatch ? 2 : 1 }];
          })
          .sort((a, b) => b.score - a.score)
          .slice(0, 3)
          .map((m) => m.page);

        if (matched.length === 0) return null;
        return (
          <section className="mt-10 border-t border-gray-100 pt-8">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Підійде як подарунок</h2>
            <div className="flex flex-col gap-3">
              {matched.map((p) => (
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
        );
      })()}
    </div>
  );
}
