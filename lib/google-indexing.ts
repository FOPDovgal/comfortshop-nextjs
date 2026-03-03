import { createSign } from "crypto";
import pool from "./db";

const TOKEN_URI = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/indexing";
const BASE = "https://comfortshop.com.ua";

function base64url(input: string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

async function getAccessToken(): Promise<string> {
  const clientEmail = process.env.GOOGLE_INDEXING_CLIENT_EMAIL;
  const privateKey = (process.env.GOOGLE_INDEXING_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey) throw new Error("Google Indexing credentials not configured");

  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64url(
    JSON.stringify({ iss: clientEmail, scope: SCOPE, aud: TOKEN_URI, iat: now, exp: now + 3600 })
  );

  const signingInput = `${header}.${payload}`;
  const sign = createSign("RSA-SHA256");
  sign.update(signingInput);
  const sig = sign
    .sign(privateKey, "base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  const res = await fetch(TOKEN_URI, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${signingInput}.${sig}`,
    }),
  });

  const data = (await res.json()) as { access_token?: string; error?: string };
  if (!data.access_token) throw new Error(`Token error: ${data.error}`);
  return data.access_token;
}

export function articleUrl(type: string, slug: string): string {
  if (type === "top") return `${BASE}/top/${slug}`;
  return `${BASE}/oglyady/${slug}`;
}

export function categoryUrl(slug: string): string {
  return `${BASE}/kategoriyi/${slug}`;
}

/**
 * Checks if any of the given category slugs has >= 2 published articles.
 * If so, notifies Google Indexing for that category page.
 * Fire-and-forget — never throws.
 */
export async function checkAndNotifyCategoryIndexing(
  categorySlugs: (string | null | undefined)[]
): Promise<void> {
  if (!process.env.GOOGLE_INDEXING_CLIENT_EMAIL) return;

  const unique = [...new Set(categorySlugs.filter(Boolean))] as string[];
  if (unique.length === 0) return;

  try {
    for (const slug of unique) {
      const [rows] = await pool.execute<import("mysql2").RowDataPacket[]>(
        `SELECT COUNT(*) AS cnt FROM articles
         WHERE status = 'published'
         AND (category = ? OR category2 = ? OR category3 = ?)`,
        [slug, slug, slug]
      );
      const cnt = (rows[0]?.cnt as number) ?? 0;
      if (cnt >= 2) {
        notifyGoogleIndexing(categoryUrl(slug)); // fire-and-forget
      }
    }
  } catch {
    // silent fail
  }
}

/**
 * Sends URL to Google Indexing API.
 * If articleId is provided, records indexing_sent_at in DB on success.
 * Returns true on success, false on failure. Never throws.
 */
export async function notifyGoogleIndexing(url: string, articleId?: number): Promise<boolean> {
  if (!process.env.GOOGLE_INDEXING_CLIENT_EMAIL) return false; // not configured

  try {
    const token = await getAccessToken();
    const res = await fetch("https://indexing.googleapis.com/v3/urlNotifications:publish", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ url, type: "URL_UPDATED" }),
    });

    if (res.ok && articleId) {
      await pool.execute(
        "UPDATE articles SET indexing_sent_at = NOW() WHERE id = ?",
        [articleId]
      );
    }

    return res.ok;
  } catch {
    return false;
  }
}
