// GET /api/lang-alts?pathname=/oglyady/slug
// Returns a map of lang → relative URL for all published translations of the
// article at the given pathname. Used by HeaderLanguageSwitcher (client) so
// the header can show language pills without a server-side DB query.
//
// Returns {} for non-article paths (homepage, categories, etc.)

import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { isSupportedLang, articleUrl, type Lang } from "@/lib/i18n";

export const dynamic = "force-dynamic";

function parsePath(pathname: string): { lang: Lang; segment: string; slug: string } | null {
  const parts = pathname.split("/").filter(Boolean);
  // /ru/oglyady/slug  → ["ru", "oglyady", "slug"]
  // /oglyady/slug     → ["oglyady", "slug"]
  let lang: Lang = "uk";
  let segIdx = 0;

  if (parts.length >= 1 && isSupportedLang(parts[0]) && parts[0] !== "uk") {
    lang = parts[0] as Lang;
    segIdx = 1;
  }

  const segment = parts[segIdx];
  const slug = parts[segIdx + 1];

  if (!segment || !slug) return null;
  if (!["oglyady", "top"].includes(segment)) return null;

  return { lang, segment, slug };
}

export async function GET(req: NextRequest) {
  const pathname = req.nextUrl.searchParams.get("pathname") ?? "";
  const parsed = parsePath(pathname);
  if (!parsed) return NextResponse.json({});

  const { lang, slug } = parsed;

  try {
    // Find the article
    const [rows] = (await pool.execute(
      `SELECT id, canonical_id FROM articles WHERE slug = ? AND lang = ? AND status = 'published' LIMIT 1`,
      [slug, lang]
    )) as [Array<{ id: number; canonical_id: number | null }>, unknown];

    if (!rows.length) return NextResponse.json({});

    const { id, canonical_id } = rows[0];
    const canonicalId = canonical_id ?? id;

    // Get all published translations of this canonical article
    const [alts] = (await pool.execute(
      `SELECT lang, slug, type FROM articles WHERE (id = ? OR canonical_id = ?) AND status = 'published'`,
      [canonicalId, canonicalId]
    )) as [Array<{ lang: string; slug: string; type: string }>, unknown];

    const result: Partial<Record<Lang, string>> = {};
    for (const alt of alts) {
      if (!isSupportedLang(alt.lang)) continue;
      const altLang = alt.lang as Lang;
      const artType: "guide" | "top" | "review" =
        alt.type === "top" ? "top" : alt.type === "review" ? "review" : "guide";
      result[altLang] = articleUrl(artType, alt.slug, altLang);
    }

    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, max-age=300" }, // cache 5 min
    });
  } catch {
    return NextResponse.json({});
  }
}
