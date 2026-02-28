import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getAllTops, getTopBySlugFull } from "@/lib/mdx";
import AffiliateButton from "@/components/AffiliateButton";
import AffiliateCTABlock from "@/components/AffiliateCTABlock";
import MdxImg from "@/components/MdxImg";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const tops = getAllTops();
  return tops.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getTopBySlugFull(slug);
  if (!article) return {};
  return {
    title: article.frontmatter.seo_title ?? article.frontmatter.title,
    description:
      article.frontmatter.seo_description ?? article.frontmatter.excerpt,
  };
}

export default async function TopPage({ params }: Props) {
  const { slug } = await params;
  const article = await getTopBySlugFull(slug);
  if (!article) notFound();

  const { frontmatter } = article;
  // Strip leading # H1 from content — title is displayed separately below
  const content = article.content.replace(/^#[^\n]*\n+/, "");

  // Article-level links (frontmatter) — shown at top as quick-access buttons
  const topLinks = (frontmatter.affiliate_links ?? []).filter(
    (l) => l.url !== "ВСТАВИТИ_ПОСИЛАННЯ"
  );

  return (
    <div className="mx-auto max-w-3xl">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-gray-500">
        <a href="/" className="hover:text-gray-900">Головна</a>
        {" / "}
        <a href="/top" className="hover:text-gray-900">Топ-списки</a>
        {" / "}
        <span>{frontmatter.title}</span>
      </nav>

      {/* Title */}
      <h1 className="mb-4 text-3xl font-bold leading-tight text-gray-900">
        {frontmatter.title}
      </h1>

      {/* Meta */}
      <div className="mb-6 flex items-center gap-3">
        <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700">
          Топ-список
        </span>
        <time className="text-sm text-gray-400">
          {new Date(frontmatter.date).toLocaleDateString("uk-UA", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </time>
      </div>

      {/* Cover image */}
      {frontmatter.image_url && (
        <div className="mb-8 overflow-hidden rounded-2xl shadow-sm">
          <img
            src={frontmatter.image_url}
            alt={frontmatter.title}
            className="w-full max-h-80 object-cover"
          />
        </div>
      )}

      {/* Quick-access buttons (top) */}
      {topLinks.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-3">
          {topLinks.map((link) => (
            <AffiliateButton
              key={link.platform + link.url}
              href={link.url}
              label={link.label}
              platform={link.platform}
            />
          ))}
        </div>
      )}

      {/* Content */}
      <article className="prose prose-gray max-w-none">
        {frontmatter.isHtml ? (
          <div dangerouslySetInnerHTML={{ __html: content }} />
        ) : (
          <MDXRemote source={content} components={{ Img: MdxImg }} />
        )}
      </article>

      {/* "Де купити" block — article-specific link takes priority over category link */}
      <AffiliateCTABlock category={frontmatter.category} aliUrl={frontmatter.affiliate_url_1} />
    </div>
  );
}
