import { notFound } from "next/navigation";
import Link from "next/link";
import { getCategoryBySlug, CATEGORIES } from "@/lib/categories";
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; subslug: string }>;
}): Promise<Metadata> {
  const { slug, subslug } = await params;
  const cat = getCategoryBySlug(slug);
  const sub = cat?.subcategories.find((s) => s.slug === subslug);
  if (!cat || !sub) return {};
  return {
    title: `${sub.name} — ${cat.name} — ComfortShop`,
    description: `Огляди та підбірки товарів у підкатегорії «${sub.name}» розділу «${cat.name}».`,
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
  const cat = getCategoryBySlug(slug);
  const sub = cat?.subcategories.find((s) => s.slug === subslug);
  if (!cat || !sub) notFound();

  const articles = await getAllArticlesForSubcategory(slug, subslug);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
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
          </div>
        </div>
      </div>

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
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => (
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
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
