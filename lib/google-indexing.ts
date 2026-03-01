import { createSign } from "crypto";

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

export async function notifyGoogleIndexing(url: string): Promise<void> {
  if (!process.env.GOOGLE_INDEXING_CLIENT_EMAIL) return; // not configured — skip silently

  try {
    const token = await getAccessToken();
    await fetch("https://indexing.googleapis.com/v3/urlNotifications:publish", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ url, type: "URL_UPDATED" }),
    });
  } catch {
    // Fail silently — indexing is non-critical
  }
}
