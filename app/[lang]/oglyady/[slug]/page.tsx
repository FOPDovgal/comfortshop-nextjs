import { notFound } from "next/navigation";
import { processDbContent } from "@/lib/html-process";
import { isSupportedLang } from "@/lib/i18n";
import { getArticleBySlugLang } from "@/lib/articles";
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
  return {
    title,
    description,
    alternates: { canonical: `https://comfortshop.com.ua/${lang}/oglyady/${slug}` },
    openGraph: {
      type: "article",
      title,
      description,
      url: `https://comfortshop.com.ua/${lang}/oglyady/${slug}`,
      publishedTime: new Date(article.date).toISOString(),
    },
  };
}

export default async function TranslatedGuidePage({ params }: Props) {
  const { lang, slug } = await params;
  if (!isSupportedLang(lang) || lang === "uk") notFound();

  const article = await getArticleBySlugLang(slug, lang);
  if (!article) notFound();

  const content = article.content.replace(/^#[^\n]*\n+/, "");
  const locale = lang === "ru" ? "ru-RU" : "en-US";

  return (
    <div className="mx-auto max-w-3xl">
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
    </div>
  );
}
