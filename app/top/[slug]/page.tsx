import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getAllTops, getTopBySlug } from "@/lib/mdx";
import AffiliateButton from "@/components/AffiliateButton";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const tops = getAllTops();
  return tops.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getTopBySlug(slug);
  if (!article) return {};
  return {
    title: article.frontmatter.seo_title ?? article.frontmatter.title,
    description: article.frontmatter.seo_description ?? article.frontmatter.excerpt,
  };
}

export default async function TopPage({ params }: Props) {
  const { slug } = await params;
  const article = getTopBySlug(slug);
  if (!article) notFound();

  const { frontmatter, content } = article;

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

      {/* Meta */}
      <div className="mb-4 flex items-center gap-3">
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

      {/* Affiliate buttons */}
      {frontmatter.affiliate_links && frontmatter.affiliate_links.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-3">
          {frontmatter.affiliate_links
            .filter((link) => link.url !== "ВСТАВИТИ_ПОСИЛАННЯ")
            .map((link) => (
              <AffiliateButton
                key={link.platform}
                href={link.url}
                label={link.label}
                platform={link.platform}
              />
            ))}
        </div>
      )}

      {/* MDX content */}
      <article className="prose prose-gray max-w-none">
        <MDXRemote source={content} />
      </article>

      {/* Affiliate buttons (bottom) */}
      {frontmatter.affiliate_links && frontmatter.affiliate_links.length > 0 && (
        <div className="mt-10 rounded-xl border border-orange-100 bg-orange-50 p-6">
          <p className="mb-4 font-semibold text-gray-900">Де купити:</p>
          <div className="flex flex-wrap gap-3">
            {frontmatter.affiliate_links
              .filter((link) => link.url !== "ВСТАВИТИ_ПОСИЛАННЯ")
              .map((link) => (
                <AffiliateButton
                  key={link.platform}
                  href={link.url}
                  label={link.label}
                  platform={link.platform}
                />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
