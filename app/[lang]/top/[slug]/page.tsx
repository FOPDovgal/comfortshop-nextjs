import { notFound } from "next/navigation";
import { processDbContent } from "@/lib/html-process";
import { isSupportedLang, getArticleAlternates, buildLanguagesMap, type Lang } from "@/lib/i18n";
import { getArticleBySlugLang, getPublishedArticlesByCategoryLang } from "@/lib/articles";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ArticleBottomBlocks, { type RelatedArticle } from "@/components/ArticleBottomBlocks";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ lang: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isSupportedLang(lang) || lang === "uk") return {};
  const article = await getArticleBySlugLang(slug, lang);
  if (!article) return {};
  const title = article.seo_title ?? article.title;
  const description = article.seo_description ?? article.excerpt ?? "";
  const selfUrl = `https://comfortshop.com.ua/${lang}/top/${slug}`;
  const alts = article.canonical_id != null ? await getArticleAlternates(article.canonical_id) : {};
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
      publishedTime: new Date(article.date).toISOString(),
    },
  };
}

export default async function TranslatedTopPage({ params }: Props) {
  const { lang, slug } = await params;
  if (!isSupportedLang(lang) || lang === "uk") notFound();

  const article = await getArticleBySlugLang(slug, lang);
  if (!article) notFound();

  const content = article.content.replace(/^#[^\n]*\n+/, "");
  const locale = lang === "ru" ? "ru-RU" : "en-US";
  const alts = article.canonical_id != null ? await getArticleAlternates(article.canonical_id) : {};

  const allInCategory = await getPublishedArticlesByCategoryLang(article.category, lang).catch(() => []);
  const relatedArticles: RelatedArticle[] = allInCategory
    .filter((a) => a.slug !== slug)
    .slice(0, 3)
    .map((a) => ({ slug: a.slug, title: a.title, type: a.type, date: a.date }));

  return (
    <div className="mx-auto max-w-3xl">
      <LanguageSwitcher alts={alts} currentLang={lang as Lang} />
      <h1 className="mb-4 text-3xl font-bold leading-tight text-gray-900">
        {article.title}
      </h1>
      <div className="mb-6">
        <time
          className="text-sm text-gray-400"
          dateTime={new Date(article.date).toISOString()}
        >
          {new Date(article.date).toLocaleDateString(locale, {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </time>
      </div>
      <article className="prose prose-gray max-w-none">
        <div dangerouslySetInnerHTML={{ __html: processDbContent(content) }} />
      </article>

      <ArticleBottomBlocks
        lang={lang as "ru" | "en"}
        category={article.category}
        category2={article.category2}
        category3={article.category3}
        subcategory={article.subcategory}
        subcategory2={article.subcategory2}
        subcategory3={article.subcategory3}
        affiliateUrl={article.affiliate_url_1}
        relatedArticles={relatedArticles}
      />
    </div>
  );
}
