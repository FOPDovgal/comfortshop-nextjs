import Link from "next/link";
import { getAllGuidesAsync, getAllTopsAsync } from "@/lib/mdx";
import { getActiveBanners } from "@/lib/banners";
import HeroBanner from "@/components/HeroBanner";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ComfortShop — корисні товари для дому та офісу",
  description:
    "Огляди та топ-списки корисних товарів для дому та офісу: гаджети, техніка, аксесуари. Кращі ціни на AliExpress та Temu.",
  alternates: { canonical: "https://comfortshop.com.ua" },
};

export default async function HomePage() {
  const [guides, tops] = await Promise.all([getAllGuidesAsync(), getAllTopsAsync()]);
  const articles = [...guides, ...tops]
    .sort((a, b) => new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime())
    .slice(0, 12);
  let bannerSlides: Awaited<ReturnType<typeof getActiveBanners>> = [];
  try {
    bannerSlides = await getActiveBanners();
  } catch {
    // DB unavailable — show banner without slides
  }

  return (
    <div>
      {/* Hero */}
      <section className="mb-10">
        <HeroBanner
          slides={bannerSlides}
          title="Корисні товари для дому та офісу"
          subtitle="Чесні огляди та добірки найкращих товарів з AliExpress та Temu. Обирайте розумно — купуйте вигідно."
        />
      </section>

      {/* Latest articles */}
      <section>
        <h2 className="mb-6 text-2xl font-semibold text-gray-900">
          Останні статті
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => {
            const href =
              article.frontmatter.type === "top"
                ? `/top/${article.slug}`
                : `/oglyady/${article.slug}`;
            return (
              <article
                key={article.slug}
                className="rounded-xl border border-gray-200 p-6 transition-shadow hover:shadow-md"
              >
                <span className="mb-2 inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                  {article.frontmatter.type === "top" ? "Топ-список" : "Огляд"}
                </span>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">
                  <Link href={href} className="hover:text-orange-600">
                    {article.frontmatter.title}
                  </Link>
                </h3>
                <p className="text-sm text-gray-600">
                  {article.frontmatter.excerpt}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <time className="text-xs text-gray-400" dateTime={new Date(article.frontmatter.date).toISOString()}>
                    {new Date(article.frontmatter.date).toLocaleDateString(
                      "uk-UA",
                      { day: "numeric", month: "long", year: "numeric" }
                    )}
                  </time>
                  <Link
                    href={href}
                    className="text-sm font-medium text-orange-600 hover:text-orange-700"
                  >
                    Читати →
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
