// Entity page configuration for Phase 4
// Pure TypeScript config — no DB calls, no async, no imports from DB layer.
// Reuses DiscoverSource type from lib/discover-pages.ts.
// To add more pages: append to ENTITY_PAGES and re-deploy (no DB migration needed).

import type { DiscoverSource } from "./discover-pages";

export type EntityType = "gift";

export type EntityPageConfig = {
  slug: string;
  entity_type: EntityType;
  title: string;          // H1 text
  seo_title: string;      // ≤60 chars — used in <title> and og:title
  seo_description: string; // ≤160 chars — used in <meta description> and og:description
  lead?: string;          // optional editorial paragraph shown above featured article

  sources: DiscoverSource; // which existing category/subcategory data to aggregate

  parent_category?: string;   // category slug — used for back-link and breadcrumb
  related_discover?: string[]; // slugs of discover pages — shown at bottom

  status: "published" | "draft"; // draft → robots: noindex, page still renders
  min_articles?: number;          // default 3 — notFound() rendered if fewer articles found
};

export const ENTITY_PAGES: EntityPageConfig[] = [
  // ── Gift: tech lovers ────────────────────────────────────────────────────
  {
    slug: "podarunky-tekhnolubam",
    entity_type: "gift",
    title: "Подарунки технолюбам",
    seo_title: "Подарунки технолюбам — ідеї та огляди",
    seo_description:
      "Кращі ідеї подарунків для любителів технологій: гаджети, аксесуари для ПК, розумний дім. Огляди та рейтинги.",
    lead: "Підібрали найкращі технологічні подарунки — від корисних USB-гаджетів до пристроїв розумного дому.",
    sources: {
      categories: ["suchasni-gadzhety", "aksesuary-dlya-pk", "rozumnyy-dim"],
    },
    parent_category: "suchasni-gadzhety",
    related_discover: [
      "usb-gadzhety-dlya-domu",
      "aksesuary-dlya-robochoho-mistsia",
      "rozumnyy-dim-gadzhety",
    ],
    status: "published",
    min_articles: 3,
  },

  // ── Gift: home ────────────────────────────────────────────────────────────
  {
    slug: "podarunky-dlya-domu",
    entity_type: "gift",
    title: "Подарунки для дому",
    seo_title: "Подарунки для дому — ідеї та огляди",
    seo_description:
      "Ідеї подарунків для дому: кухонні гаджети, організери, системи зберігання. Чесні огляди та підбірки.",
    lead: "Зібрали найкращі подарунки для дому — від зручних кухонних приладів до систем організації простору.",
    sources: {
      categories: ["tovary-dlya-domu", "kuhonni-gadzhety"],
    },
    parent_category: "tovary-dlya-domu",
    related_discover: [
      "kuhonni-gadzhety-dlya-domu",
      "organizery-dlya-domu",
    ],
    status: "published",
    min_articles: 3,
  },

  // ── Gift: traveler ────────────────────────────────────────────────────────
  {
    slug: "podarunky-turystu",
    entity_type: "gift",
    title: "Подарунки туристу",
    seo_title: "Подарунки туристу — ідеї та огляди",
    seo_description:
      "Кращі подарунки для туристів і мандрівників: спорядження, портативні зарядки, ліхтарі. Огляди та рейтинги.",
    lead: "Підібрали найкращі подарунки для активних мандрівників: від туристичного спорядження до портативних джерел живлення.",
    sources: {
      categories: ["sport-ta-turyzm", "energozberezhennya"],
    },
    parent_category: "sport-ta-turyzm",
    related_discover: [
      "turystychni-gadzhety-dlya-podorozhey",
      "energozberezhennya-vdoma",
    ],
    status: "published",
    min_articles: 3,
  },

  // ── Gift: woman ───────────────────────────────────────────────────────────
  {
    slug: "podarunok-zhintsi",
    entity_type: "gift",
    title: "Подарунок жінці",
    seo_title: "Подарунок жінці — ідеї та огляди",
    seo_description:
      "Ідеї подарунків для жінки: масажери, аромадифузори, товари для релаксу та краси. Огляди та рейтинги.",
    lead: "Зібрали найкращі ідеї подарунків для жінки: від масажерів і аромадифузорів до товарів для здоров'я та краси.",
    sources: {
      categories: ["komfort-i-relaks", "zdorovya-ta-komfort"],
    },
    parent_category: "komfort-i-relaks",
    related_discover: [
      "tovary-dlya-zdorovya-ta-relaksu",
    ],
    status: "published",
    min_articles: 3,
  },
];

export function getEntityPage(slug: string): EntityPageConfig | undefined {
  return ENTITY_PAGES.find((p) => p.slug === slug);
}
