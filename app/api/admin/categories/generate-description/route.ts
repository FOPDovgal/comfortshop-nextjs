import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/admin-auth";
import crypto from "crypto";

const DEEPSEEK_KEY = process.env.DEEPSEEK_KEY ?? "sk-520a1fd1e52b45e4b9edeb91a46b8b42";
const ALI_KEY    = "528412";
const ALI_SECRET = "F3eFj6n6NDwEqJNmVT3KOnfjxzmml4hs";
const ALI_API    = "https://api-sg.aliexpress.com/sync";

// ── Built-in keyword map (same as fill-categories-sheet.gs) ──────────────────
const CAT_KEYWORDS: Record<string, string> = {
  "tovary-dlya-domu":    "товари для дому, корисні речі для дому, органайзери для дому, побутові аксесуари",
  "kuhonni-gadzhety":    "кухонні гаджети, гаджети для кухні, електроприлади для кухні, корисні кухонні аксесуари",
  "klimat-tehnika":      "зволожувач повітря, очищувач повітря, метеостанція для дому, кліматтехніка",
  "suchasni-gadzhety":   "корисні гаджети, сучасні гаджети 2025, цікаві гаджети для дому, гаджети з аліекспрес",
  "rozumnyy-dim":        "розумний дім, smart home україна, автоматизація дому, розумні розетки wifi",
  "aksesuary-dlya-pk":   "аксесуари для комп'ютера, механічна клавіатура, ігрова миша, навушники для пк",
  "komfort-i-relaks":    "масажер для спини, ароматичний дифузор, товари для релаксу, антистрес",
  "sport-ta-turyzm":     "туристичне спорядження, кемпінг, намет туристичний, термос туристичний",
  "zdorovya-ta-komfort": "масажер тіла, тонометр автоматичний, пульсоксиметр, прилади для здоров'я",
  "dlya-ditej":          "розвивальні іграшки, іграшки для дітей, дитячий самокат, безпека дитини",
  "bezpeka":             "камера відеонагляду wifi, сигналізація для квартири, відеодзвінок, відеонагляд",
  "energozberezhennya":  "сонячна панель портативна, акумуляторна станція, led освітлення, зарядна станція",
  "zootovary":           "аксесуари для собак, іграшки для котів, товари для тварин, нашийник gps",
  "elektrotransport":    "електросамокат дорослий, електровелосипед купити, кикскутер, електросамокат",
};

async function auth(req: NextRequest) {
  const token = req.cookies.get("admin_session")?.value ?? "";
  return validateSession(token);
}

function aliSign(params: Record<string, string>): string {
  const str = Object.keys(params).sort().map((k) => k + params[k]).join("");
  return crypto.createHash("md5").update(ALI_SECRET + str + ALI_SECRET).digest("hex").toUpperCase();
}

async function toEnglish(text: string): Promise<string> {
  try {
    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${DEEPSEEK_KEY}` },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "Return ONLY 2-4 English words for AliExpress product search. No punctuation, no explanations." },
          { role: "user", content: `Translate to English for AliExpress search: "${text}"` },
        ],
        temperature: 0.1,
        max_tokens: 20,
      }),
    });
    const d = await res.json();
    return ((d?.choices?.[0]?.message?.content ?? "") as string).replace(/[^a-zA-Z0-9 ]/g, "").trim();
  } catch {
    return text.split(" ").slice(0, 3).join(" ");
  }
}

async function searchAliImages(keywords: string): Promise<string[]> {
  const now = new Date().toISOString().replace("T", " ").slice(0, 19);
  const params: Record<string, string> = {
    method: "aliexpress.affiliate.product.query",
    app_key: ALI_KEY,
    timestamp: now,
    format: "json",
    v: "2.0",
    sign_method: "md5",
    keywords,
    page_no: "1",
    page_size: "6",
    tracking_id: "comfohran",
    target_currency: "UAH",
    target_language: "EN",
    fields: "product_id,product_title,product_main_image_url,detail_url",
  };
  params.sign = aliSign(params);
  const qs = Object.entries(params).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&");
  try {
    const res = await fetch(`${ALI_API}?${qs}`, { signal: AbortSignal.timeout(8000) });
    const d = await res.json();
    const products = d?.aliexpress_affiliate_product_query_response?.resp_result?.result?.products?.product;
    if (!Array.isArray(products)) return [];
    return products
      .map((p: Record<string, string>) => p.product_main_image_url)
      .filter(Boolean)
      .slice(0, 5);
  } catch {
    return [];
  }
}

async function generateDescriptionHtml(opts: {
  name: string;
  slug: string;
  type: "category" | "subcategory";
  parentName?: string;
  parentSlug?: string;
  keywords: string;
  subcategories: Array<{ slug: string; name: string }>;
  heroImageUrl: string;
  extraImages: string[];
}): Promise<string> {
  const { name, slug, type, parentName, parentSlug, keywords, subcategories, heroImageUrl, extraImages } = opts;
  const isCategory = type === "category";
  const wordCount = isCategory ? "1200–2200" : "900–1800";

  const heroHtml = heroImageUrl
    ? `<figure class="category-hero">\n  <img\n    src="${heroImageUrl}"\n    alt="${name} — огляд кращих товарів"\n    title="${name} — фото товарів категорії"\n    width="1200" height="628"\n    loading="eager" decoding="async" fetchpriority="high"\n    style="width:100%;height:auto;border-radius:12px;display:block;"\n  />\n</figure>`
    : `<!-- hero-image: додай реальне зображення (1200×628) -->`;

  const extraImgsHtml = extraImages.length > 0
    ? `\n<div class="category-image-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;margin:24px 0;">\n${
        extraImages.map((u, i) =>
          `  <figure style="margin:0;">\n    <img src="${u}" alt="${name} — товар ${i + 1}" width="400" height="400" loading="lazy" decoding="async" style="width:100%;height:auto;border-radius:8px;display:block;" />\n  </figure>`
        ).join("\n")
      }\n</div>`
    : "";

  let linkingHint = "";
  if (isCategory && subcategories.length > 0) {
    linkingHint = "Перелінкуй на такі підкатегорії:\n" +
      subcategories.slice(0, 6).map((s) => `- /kategoriyi/${slug}/${s.slug}/ — ${s.name}`).join("\n");
  } else if (!isCategory && parentSlug) {
    linkingHint = `Перелінкуй на батьківську категорію:\n- /kategoriyi/${parentSlug}/ — ${parentName}`;
  }

  const system = [
    `Ти Senior SEO Content Architect для comfortshop.com.ua.`,
    `Генеруй HTML-опис для сторінки ${isCategory ? "категорії" : "підкатегорії"} товарів.`,
    ``,
    `ОБОВ'ЯЗКОВА СТРУКТУРА:`,
    `<section class="category-description">`,
    `  <h1>Назва з головним ключовим словом</h1>`,
    `  [HERO_IMAGE — вже надано, вставляй дослівно]`,
    `  <p>Вступ 1</p><p>Вступ 2</p>`,
    `  <h2>Чому товари цієї категорії популярні</h2>`,
    `  <p>...</p><ul><li>...</li>...</ul>`,
    `  <h2>Що входить до категорії</h2>`,
    `  <p>...</p><ul>...</ul>`,
    `  <h2>Як вибрати</h2><p>...</p>`,
    `  <h2>Переваги</h2><ul>...</ul>`,
    `  [якщо надано extra-images — вставити як category-image-grid]`,
    `  <h2>Популярні рішення та тренди 2026 року</h2><p>...</p>`,
    `  <h2>Дивіться також</h2>`,
    `  <ul><li><a href="URL">Назва</a></li>...</ul>`,
    `  <p>Висновок...</p>`,
    `</section>`,
    ``,
    `ПРАВИЛА:`,
    `- Мова: українська, редакційний стиль, без води і keyword stuffing`,
    `- Обсяг: ${wordCount} слів`,
    `- ТІЛЬКИ HTML-фрагмент без <html>/<head>/<body>`,
    `- Повертай ТІЛЬКИ HTML без markdown-обгортки \`\`\``,
    `- Hero image і extra-images вставляй дослівно із запиту`,
    `- Не змінюй SEO title/description`,
    `- Не перевантажуй таблицями`,
    `- Перелінковка тільки на реально споріднені сторінки`,
    `- Для вузьких підкатегорій не роздувай текст штучно`,
  ].join("\n");

  const user = [
    `Назва: ${name}`,
    `Slug: ${slug}`,
    `Тип: ${isCategory ? "Категорія" : "Підкатегорія"}`,
    parentName ? `Батьківська категорія: ${parentName}` : "",
    `Ключові слова: ${keywords || name}`,
    ``,
    `Hero image block (вставити дослівно після <h1>):`,
    heroHtml,
    ``,
    extraImages.length > 0 ? `Extra images grid (вставити після другої h2 або посередині):` : "",
    extraImages.length > 0 ? extraImgsHtml : "",
    ``,
    linkingHint,
    ``,
    `Напиши повний SEO HTML-опис для цієї сторінки категорії.`,
  ].filter((l) => l !== undefined).join("\n");

  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${DEEPSEEK_KEY}` },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.4,
        max_tokens: 4500,
      }),
    });
    const d = await res.json();
    let html = ((d?.choices?.[0]?.message?.content ?? "") as string).trim();
    html = html.replace(/^```html?\n?/i, "").replace(/\n?```$/i, "").trim();
    if (!html.includes("\uFFFD")) return html;
    if (attempt < 3) await new Promise(r => setTimeout(r, 3000));
  }
  // Last resort: strip replacement chars
  const res2 = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${DEEPSEEK_KEY}` },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
      temperature: 0.4, max_tokens: 4500,
    }),
  });
  const d2 = await res2.json();
  let html2 = ((d2?.choices?.[0]?.message?.content ?? "") as string).trim();
  html2 = html2.replace(/^```html?\n?/i, "").replace(/\n?```$/i, "").trim();
  return html2.replace(/\uFFFD/g, "");
}

export async function POST(req: NextRequest) {
  if (!(await auth(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, slug, type, parentName, parentSlug, subcategories = [] } = await req.json();
  if (!name || !slug) return NextResponse.json({ error: "name and slug required" }, { status: 400 });

  // Look up keywords from built-in map, or fall back to name
  const keywords = type === "category"
    ? (CAT_KEYWORDS[slug] ?? name)
    : (CAT_KEYWORDS[parentSlug ?? ""] ? `${name}, ${CAT_KEYWORDS[parentSlug ?? ""]}` : name);

  try {
    // Parallel: translate for AliExpress + prepare
    const engQuery = await toEnglish(name);
    const images = engQuery ? await searchAliImages(engQuery) : [];
    const heroImageUrl = images[0] ?? "";
    const extraImages = images.slice(1, 4);

    const description = await generateDescriptionHtml({
      name, slug,
      type: (type as "category" | "subcategory") ?? "category",
      parentName, parentSlug,
      keywords,
      subcategories,
      heroImageUrl,
      extraImages,
    });

    return NextResponse.json({ description });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
