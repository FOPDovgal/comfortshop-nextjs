import { notFound } from "next/navigation";
import Link from "next/link";
import { getCategoryBySlug, CATEGORIES } from "@/lib/categories";
import { getAllArticlesForCategory } from "@/lib/mdx";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const cat = getCategoryBySlug(slug);
  if (!cat) return {};
  return {
    title: `${cat.name} — ComfortShop`,
    description: `Огляди, рейтинги та підбірки у категорії «${cat.name}». Підкатегорії: ${cat.subcategories.map((s) => s.name).join(", ")}.`,
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
  const cat = getCategoryBySlug(slug);
  if (!cat) notFound();

  const articles = await getAllArticlesForCategory(slug);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
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
          <p className="mt-2 text-white/70 text-sm">{cat.subcategories.length} підкатегорій</p>
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

      {/* Articles */}
      <div className="mt-14">
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
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((a) => (
              <article
                key={a.slug}
                className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  {a.frontmatter.type === "top" ? "Топ-підбірка" : "Огляд"}
                </p>
                <h3 className="mb-2 text-base font-semibold leading-snug text-gray-900 group-hover:text-orange-600">
                  <Link href={articleUrl(a.frontmatter.type, a.slug)}>
                    {a.frontmatter.title}
                  </Link>
                </h3>
                {a.frontmatter.excerpt && (
                  <p className="mb-4 text-sm text-gray-500 line-clamp-2">{a.frontmatter.excerpt}</p>
                )}
                <div className="flex items-center justify-between">
                  <time className="text-xs text-gray-400">
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
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
