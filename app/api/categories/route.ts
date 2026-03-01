import { NextResponse } from "next/server";
import { getAllCategoriesDB } from "@/lib/categories-db";
import { CATEGORIES } from "@/lib/categories";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const dbCats = await getAllCategoriesDB();
    if (dbCats.length > 0) {
      return NextResponse.json(
        dbCats.map((c) => ({
          slug: c.slug,
          name: c.name,
          icon: c.icon,
          colorFrom: c.color_from,
          colorTo: c.color_to,
          bgLight: c.bg_light,
          subcategories: c.subcategories.map((s) => ({
            slug: s.slug,
            name: s.name,
            icon: s.icon,
          })),
        }))
      );
    }
  } catch {}
  // Fallback to hardcoded
  return NextResponse.json(
    CATEGORIES.map((c) => ({
      slug: c.slug,
      name: c.name,
      icon: c.icon,
      colorFrom: c.colorFrom,
      colorTo: c.colorTo,
      bgLight: c.bgLight,
      subcategories: c.subcategories.map((s) => ({
        slug: s.slug,
        name: s.name,
        icon: s.icon,
      })),
    }))
  );
}
