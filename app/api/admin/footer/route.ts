import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/admin-auth";
import { getSettings, setSettings, type SettingKey } from "@/lib/site-settings";

const FOOTER_KEYS: SettingKey[] = [
  "social_youtube",
  "social_tiktok",
  "social_facebook",
  "social_instagram",
  "terms_html",
];

async function auth(req: NextRequest) {
  const token = req.cookies.get("admin_session")?.value ?? "";
  return validateSession(token);
}

export async function GET(req: NextRequest) {
  if (!(await auth(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const settings = await getSettings(FOOTER_KEYS);
  return NextResponse.json(settings);
}

export async function PUT(req: NextRequest) {
  if (!(await auth(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const allowed = new Set<string>(FOOTER_KEYS);
  const filtered: Partial<Record<SettingKey, string>> = {};
  for (const [k, v] of Object.entries(body)) {
    if (allowed.has(k)) filtered[k as SettingKey] = String(v ?? "");
  }
  await setSettings(filtered);
  return NextResponse.json({ ok: true });
}
