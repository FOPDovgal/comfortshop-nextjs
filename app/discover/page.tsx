import Link from "next/link";
import { DISCOVER_PAGES } from "@/lib/discover-pages";
import { getCategoryBySlug } from "@/lib/categories";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Discover — тематичні підбірки ComfortShop",
  description:
    "Тематичні підбірки та огляди товарів: USB гаджети, організери, туристичне спорядження та інше. Актуальні матеріали з різних категорій.",
  alternates: { canonical: "https://comfortshop.com.ua/discover" },
  openGraph: {
    type: "website",
    title: "Discover — тематичні підбірки ComfortShop",
    description:
      "Тематичні підбірки та огляди товарів: USB гаджети, організери, туристичне спорядження та інше.",
    url: "https://comfortshop.com.ua/discover",
  },
};

const BASE = "https://comfortshop.com.ua";

export default function DiscoverIndexPage() {
  const published = DISCOVER_PAGES.filter((p) => p.status === "published");

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Головна", item: BASE },
      { "@type": "ListItem", position: 2, name: "Discover", item: `${BASE}/discover` },
    ],
  };

  const collectionPageLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Discover — тематичні підбірки",
    url: `${BASE}/discover`,
    description:
      "Тематичні підбірки та огляди товарів з різних категорій ComfortShop.",
    hasPart: published.map((p) => ({
      "@type": "WebPage",
      name: p.title,
      url: `${BASE}/discover/${p.slug}`,
      description: p.seo_description,
    })),
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPageLd) }}
      />

      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-gray-400">
        <Link href="/" className="hover:text-gray-600">
          Головна
        </Link>
        <span>›</span>
        <span className="text-gray-700">Discover</span>
      </nav>

      {/* Hero */}
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-gray-900">Discover</h1>
        <p className="mt-2 max-w-2xl text-gray-500">
          Тематичні підбірки та огляди товарів — зібрані за темами, а не лише за категоріями.
          Актуальні матеріали регулярно доповнюються.
        </p>
        {published.length > 0 && (
          <p className="mt-1 text-sm text-gray-400">{published.length} підбірок</p>
        )}
      </div>

      {/* Grid */}
      {published.length === 0 ? (
        <div className="flex items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-20 text-gray-400">
          <div className="text-center">
            <p className="text-3xl mb-2">📄</p>
            <p className="font-medium">Підбірки з'являться тут</p>
            <p className="text-sm mt-1">Скоро додамо тематичні огляди</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {published.map((p) => {
            const cat = p.parent_category ? getCategoryBySlug(p.parent_category) : null;
            return (
              <Link
                key={p.slug}
                href={`/discover/${p.slug}`}
                className="group flex flex-col rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md hover:-translate-y-1 overflow-hidden"
              >
                {/* Colour bar using parent category gradient */}
                <div
                  className="h-2 w-full flex-shrink-0"
                  style={{
                    background: cat
                      ? `linear-gradient(90deg, ${cat.colorFrom} 0%, ${cat.colorTo} 100%)`
                      : "linear-gradient(90deg, #6366f1 0%, #818cf8 100%)",
                  }}
                />
                <div className="flex flex-col flex-1 p-5">
                  <div className="mb-3 flex items-center gap-3">
                    <span
                      className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-2xl"
                      style={{ backgroundColor: cat?.bgLight ?? "#eef2ff" }}
                    >
                      {cat?.icon ?? "📄"}
                    </span>
                    <div>
                      <h2 className="font-bold text-gray-900 group-hover:text-orange-600 leading-snug">
                        {p.title}
                      </h2>
                      {cat && (
                        <p className="text-xs text-gray-400 mt-0.5">{cat.name}</p>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2 flex-1">{p.seo_description}</p>
                  <p className="mt-4 text-sm font-medium text-orange-600 group-hover:text-orange-700">
                    Переглянути →
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
