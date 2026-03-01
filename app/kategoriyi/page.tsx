import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";
import { getAllCategoriesDB } from "@/lib/categories-db";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Категорії товарів — ComfortShop",
  description:
    "Огляди, топ-підбірки та гайди по всіх категоріях: від кухонних гаджетів до розумного дому.",
};

type CatItem = {
  slug: string;
  name: string;
  icon: string;
  colorFrom: string;
  colorTo: string;
  bgLight: string;
  subcategories: { slug: string; name: string; icon: string }[];
};

export default async function CategoriesPage() {
  let cats: CatItem[] = CATEGORIES.map((c) => ({
    slug: c.slug,
    name: c.name,
    icon: c.icon,
    colorFrom: c.colorFrom,
    colorTo: c.colorTo,
    bgLight: c.bgLight,
    subcategories: c.subcategories,
  }));

  try {
    const dbCats = await getAllCategoriesDB();
    if (dbCats.length > 0) {
      cats = dbCats.map((c) => ({
        slug: c.slug,
        name: c.name,
        icon: c.icon,
        colorFrom: c.color_from,
        colorTo: c.color_to,
        bgLight: c.bg_light,
        subcategories: c.subcategories,
      }));
    }
  } catch {}

  return (
    <main className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-gray-900">Всі категорії</h1>
        <p className="mt-2 text-gray-500">
          Оберіть категорію, щоб переглянути огляди, рейтинги та підбірки товарів.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cats.map((cat) => (
          <Link
            key={cat.slug}
            href={`/kategoriyi/${cat.slug}/`}
            className="group relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 transition-all hover:shadow-lg hover:-translate-y-1"
          >
            {/* Gradient header */}
            <div
              className="flex h-28 items-end justify-between overflow-hidden px-5 pb-4"
              style={{
                background: `linear-gradient(145deg, ${cat.colorFrom} 0%, ${cat.colorTo} 100%)`,
              }}
            >
              {/* Faint bg emoji */}
              <span
                className="pointer-events-none absolute right-3 top-2 text-8xl opacity-15 select-none"
                aria-hidden
              >
                {cat.icon}
              </span>
              <div>
                <p className="text-3xl drop-shadow">{cat.icon}</p>
              </div>
              <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">
                {cat.subcategories.length} підкатегорій
              </span>
            </div>

            {/* Body */}
            <div className="p-5">
              <h2 className="font-bold text-gray-900 group-hover:text-gray-700">
                {cat.name}
              </h2>
              <ul className="mt-2 space-y-1">
                {cat.subcategories.slice(0, 3).map((sub) => (
                  <li key={sub.slug} className="flex items-center gap-1.5 text-sm text-gray-500">
                    <span>{sub.icon}</span>
                    <span>{sub.name}</span>
                  </li>
                ))}
                {cat.subcategories.length > 3 && (
                  <li className="text-xs text-gray-400">
                    +{cat.subcategories.length - 3} підкатегорій
                  </li>
                )}
              </ul>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
