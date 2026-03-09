import pool from "./db";

export type ImageEntityType =
  | "article"
  | "category"
  | "subcategory"
  | "discover"
  | "entity";

/**
 * Resolve the best available image URL for an entity.
 *
 * Resolution order:
 *   1. image_targets → current image_asset → local_path  (/uploads/images/…, nginx-served)
 *   2. image_targets → current image_asset → source_url  (external CDN URL)
 *   3. fallbackUrl   (existing articles.image_url or equivalent field)
 *   4. null
 *
 * Silently returns fallbackUrl on any DB error so existing rendering is never broken.
 * entity_key conventions:
 *   article     → slug  (e.g. "usb-gadzhety-dlya-ofisu")
 *   category    → category slug  (e.g. "suchasni-gadzhety")
 *   subcategory → "cat_slug/sub_slug"  (e.g. "suchasni-gadzhety/rozumni-kolonky")
 *   discover    → discover page slug
 *   entity      → entity page slug
 */
export async function resolveImage(
  entityType: ImageEntityType,
  entityKey: string | null,
  fallbackUrl: string | null | undefined
): Promise<string | null> {
  if (!entityKey) return fallbackUrl ?? null;
  try {
    const [rows] = await pool.execute(
      `SELECT a.local_path, a.source_url
       FROM image_targets t
       INNER JOIN image_assets a ON a.id = t.current_asset_id
       WHERE t.entity_type = ?
         AND t.entity_key  = ?
         AND t.role        = 'hero'
         AND a.governance_status = 'approved'
         AND a.lifecycle_status  = 'active'
       LIMIT 1`,
      [entityType, entityKey]
    );
    const result = rows as Array<{ local_path: string | null; source_url: string | null }>;
    if (result.length > 0) {
      const { local_path, source_url } = result[0];
      if (local_path) return `/uploads/images/${local_path}`;
      if (source_url) return source_url;
    }
  } catch {
    // DB unavailable or schema mismatch — fall through to fallback
  }
  return fallbackUrl ?? null;
}
