import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/admin-auth";

async function auth(req: NextRequest) {
  const token = req.cookies.get("admin_session")?.value ?? "";
  return validateSession(token);
}

async function callDeepSeek(system: string, user: string): Promise<string> {
  const key = process.env.DEEPSEEK_KEY ?? "sk-520a1fd1e52b45e4b9edeb91a46b8b42";
  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.3,
      max_tokens: 200,
    }),
  });
  const data = await res.json();
  return data?.choices?.[0]?.message?.content?.trim() ?? "";
}

export async function POST(req: NextRequest) {
  if (!(await auth(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, type, parentName } = await req.json();
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

  const isSubcat = type === "subcategory";
  const context = isSubcat && parentName ? ` (підкатегорія розділу «${parentName}»)` : "";

  const system =
    "Ти SEO-спеціаліст для українського сайту ComfortShop — блогу про корисні товари. " +
    "Генеруй SEO-метадані українською мовою. " +
    "Відповідь ТІЛЬКИ у форматі JSON: {\"seo_title\":\"...\",\"seo_description\":\"...\"}. " +
    "seo_title — максимум 60 символів. seo_description — максимум 160 символів. " +
    "Без пояснень, тільки JSON.";

  const user = isSubcat
    ? `Згенеруй seo_title і seo_description для підкатегорії «${name}»${context} на сайті ComfortShop.`
    : `Згенеруй seo_title і seo_description для категорії «${name}» на сайті ComfortShop.`;

  try {
    const raw = await callDeepSeek(system, user);
    // Extract JSON from response (might have markdown wrapping)
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");
    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json({
      seo_title: (parsed.seo_title ?? "").slice(0, 60),
      seo_description: (parsed.seo_description ?? "").slice(0, 160),
    });
  } catch (e) {
    return NextResponse.json({ error: "DeepSeek error: " + String(e) }, { status: 500 });
  }
}
