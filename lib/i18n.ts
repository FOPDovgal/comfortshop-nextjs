// lib/i18n.ts — Phase 6 M2: language plumbing helpers
// Pure utilities + two DB helpers for alternates / translations.
// No routes are created or changed here.
// All URL helpers return relative paths (no base URL) — caller prepends base when needed.

import pool from "./db";
import type { DBArticle } from "./articles";

// ── Language constants ────────────────────────────────────────────────────────

export const SUPPORTED_LANGS = ["uk", "ru", "en"] as const;
export type Lang = (typeof SUPPORTED_LANGS)[number];

export function isSupportedLang(value: unknown): value is Lang {
  return SUPPORTED_LANGS.includes(value as Lang);
}

// ── URL prefix ────────────────────────────────────────────────────────────────

/** Returns '' for 'uk' (root), '/ru' for 'ru', '/en' for 'en'. */
export function langPrefix(lang: Lang): string {
  return lang === "uk" ? "" : `/${lang}`;
}

// ── Lang detection from pathname ──────────────────────────────────────────────

/**
 * Extracts the language from a URL pathname.
 * '/ru/oglyady/slug' → 'ru'
 * '/oglyady/slug'    → 'uk'
 */
export function getLangFromPathname(pathname: string): Lang {
  const first = pathname.split("/").filter(Boolean)[0];
  if (first && isSupportedLang(first) && first !== "uk") return first as Lang;
  return "uk";
}

// ── URL helpers ───────────────────────────────────────────────────────────────

/**
 * Article URL.
 * type='top'               → /top/[slug]
 * type='guide'|'review'    → /oglyady/[slug]
 * With lang prefix for non-uk: /ru/oglyady/[slug]
 */
export function articleUrl(
  type: "guide" | "top" | "review",
  slug: string,
  lang: Lang = "uk"
): string {
  const prefix = langPrefix(lang);
  const segment = type === "top" ? "top" : "oglyady";
  return `${prefix}/${segment}/${slug}`;
}

/** Category listing URL: /kategoriyi/[slug] */
export function categoryUrl(slug: string, lang: Lang = "uk"): string {
  return `${langPrefix(lang)}/kategoriyi/${slug}`;
}

/** Subcategory URL: /kategoriyi/[categorySlug]/[subSlug] */
export function subcategoryUrl(
  categorySlug: string,
  subSlug: string,
  lang: Lang = "uk"
): string {
  return `${langPrefix(lang)}/kategoriyi/${categorySlug}/${subSlug}`;
}

/** Discover page URL: /discover/[slug] */
export function discoverUrl(slug: string, lang: Lang = "uk"): string {
  return `${langPrefix(lang)}/discover/${slug}`;
}

/** Gift entity page URL: /podarunky/[slug] */
export function entityUrl(slug: string, lang: Lang = "uk"): string {
  return `${langPrefix(lang)}/podarunky/${slug}`;
}

// ── Alternates builder ────────────────────────────────────────────────────────

const BASE = "https://comfortshop.com.ua";

/**
 * Converts a getArticleAlternates() result (relative paths) into a
 * Next.js Metadata.alternates.languages map (absolute URLs).
 *
 * Returns undefined when fewer than 2 language variants exist — nothing to emit.
 * x-default always points to the Ukrainian (root) URL.
 */
export function buildLanguagesMap(
  alts: Partial<Record<Lang, string>>
): Record<string, string> | undefined {
  if (Object.keys(alts).length < 2) return undefined;
  const map: Record<string, string> = {};
  for (const [lang, path] of Object.entries(alts)) {
    map[lang] = BASE + path;
  }
  if (alts.uk) map["x-default"] = BASE + alts.uk;
  return map;
}

// ── DB helpers ────────────────────────────────────────────────────────────────

/**
 * Returns a map of lang → relative URL for all published translations of an article.
 * Pass the canonical (uk) article id.
 *
 * Example result: { uk: '/oglyady/mashinka', ru: '/ru/oglyady/mashinka' }
 *
 * Used in generateMetadata() alternates.languages (prepend BASE before passing to Next.js).
 */
export async function getArticleAlternates(
  canonicalId: number
): Promise<Partial<Record<Lang, string>>> {
  const [rows] = (await pool.execute(
    `SELECT id, lang, slug, type FROM articles
     WHERE (id = ? OR canonical_id = ?) AND status = 'published'`,
    [canonicalId, canonicalId]
  )) as [Array<Pick<DBArticle, "id" | "lang" | "slug" | "type">>, unknown];

  const result: Partial<Record<Lang, string>> = {};
  for (const row of rows) {
    const lang = isSupportedLang(row.lang) ? row.lang : "uk";
    result[lang] = articleUrl(row.type, row.slug, lang);
  }
  return result;
}

/**
 * Returns a single published translation for a given canonical_id and target lang.
 * For lang='uk', returns the canonical row itself (id = canonicalId).
 * Returns null if no published translation exists.
 */
export async function getTranslationForCanonical(
  canonicalId: number,
  lang: Lang
): Promise<DBArticle | null> {
  if (lang === "uk") {
    const [rows] = (await pool.execute(
      `SELECT * FROM articles WHERE id = ? AND status = 'published'`,
      [canonicalId]
    )) as [DBArticle[], unknown];
    return rows[0] ?? null;
  }
  const [rows] = (await pool.execute(
    `SELECT * FROM articles WHERE canonical_id = ? AND lang = ? AND status = 'published'`,
    [canonicalId, lang]
  )) as [DBArticle[], unknown];
  return rows[0] ?? null;
}
