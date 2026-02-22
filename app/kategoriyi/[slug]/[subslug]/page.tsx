import { notFound } from "next/navigation";
import Link from "next/link";
import { getCategoryBySlug, CATEGORIES } from "@/lib/categories";
import type { Metadata } from "next";

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

export default async function SubcategoryPage({
  params,
}: {
  params: Promise<{ slug: string; subslug: string }>;
}) {
  const { slug, subslug } = await params;
  const cat = getCategoryBySlug(slug);
  const sub = cat?.subcategories.find((s) => s.slug === subslug);
  if (!cat || !sub) notFound();

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

      {/* Placeholder for future articles */}
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
    </main>
  );
}
