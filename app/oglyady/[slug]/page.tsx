import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getAllGuides, getGuideBySlugFull, getAllArticlesForCategory } from "@/lib/mdx";
import { processDbContent } from "@/lib/html-process";
import MdxImg from "@/components/MdxImg";
import ArticleBottomBlocks, { type RelatedArticle } from "@/components/ArticleBottomBlocks";
import { resolveImage } from "@/lib/images";
import { getArticleAlternates, buildLanguagesMap } from "@/lib/i18n";
import LanguageSwitcher from "@/components/LanguageSwitcher";
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
  if (!article || article.frontmatter.lang !== "uk") notFound();

  const { frontmatter } = article;
  // Strip leading # H1 from content — title is displayed separately below
  const content = article.content.replace(/^#[^\n]*\n+/, "");
  const resolvedImage = await resolveImage("article", frontmatter.id != null ? String(frontmatter.id) : null, frontmatter.image_url ?? null);

  const alts = frontmatter.id != null ? await getArticleAlternates(frontmatter.id) : {};
  const allInCategory = await getAllArticlesForCategory(frontmatter.category).catch(() => []);
  const relatedArticles: RelatedArticle[] = allInCategory
    .filter((a) => a.slug !== slug)
    .slice(0, 3)
    .map((a) => ({ slug: a.slug, title: a.frontmatter.title, type: a.frontmatter.type as RelatedArticle["type"], date: a.frontmatter.date }));

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

      <LanguageSwitcher alts={alts} currentLang="uk" />

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

      <ArticleBottomBlocks
        lang="uk"
        category={frontmatter.category}
        category2={frontmatter.category2}
        category3={frontmatter.category3}
        subcategory={frontmatter.subcategory}
        subcategory2={frontmatter.subcategory2}
        subcategory3={frontmatter.subcategory3}
        affiliateUrl={frontmatter.affiliate_url_1}
        relatedArticles={relatedArticles}
      />
    </div>
  );
}
