import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/admin-auth";

async function auth(req: NextRequest) {
  const token = req.cookies.get("admin_session")?.value ?? "";
  return validateSession(token);
}

function trim(s: string, max: number): string {
  s = s.trim();
  if (s.length <= max) return s;
  const cut = s.lastIndexOf(" ", max - 1);
  return (cut > max * 0.7 ? s.slice(0, cut) : s.slice(0, max - 1)) + "…";
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
      max_tokens: 180,
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
    "Ти SEO-спеціаліст. Відповідаєш ТІЛЬКИ JSON: {\"seo_title\":\"...\",\"seo_description\":\"...\"}\n\n" +
    "ЖОРСТКІ ЛІМІТИ (цільові діапазони з буфером):\n" +
    "• seo_title:       48–56 символів  (реальний ліміт: 60)\n" +
    "• seo_description: 138–155 символів (реальний ліміт: 160)\n\n" +
    "ОБОВ'ЯЗКОВИЙ АЛГОРИТМ (виконуй мовчки):\n" +
    "1. Напиши чернетку seo_title\n" +
    "2. Порахуй довжину — скорочуй або доповнюй до 48–56 символів\n" +
    "3. Напиши чернетку seo_description\n" +
    "4. Порахуй довжину — скорочуй або доповнюй до 138–155 символів\n" +
    "5. Виведи JSON — і більше нічого\n\n" +
    "seo_title: головне ключове слово першим, природна мова, без назви сайту.\n" +
    "seo_description: перше речення — що знайде читач; друге — перевага або заклик. Зв'язний текст, не перелік.";

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
      seo_title: trim(parsed.seo_title ?? "", 60),
      seo_description: trim(parsed.seo_description ?? "", 160),
    });
  } catch (e) {
    return NextResponse.json({ error: "DeepSeek error: " + String(e) }, { status: 500 });
  }
}
