"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { CATEGORIES } from "@/lib/categories";

type CatOption = { slug: string; name: string; icon: string; subcategories: { slug: string; name: string; icon: string }[] };
import type { DBArticle } from "@/lib/articles";

// ── Ukrainian transliteration (KMU 2010) ─────────────────────────────────────
const UK_MAP: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "h", ґ: "g", д: "d", е: "e", є: "ye",
  ж: "zh", з: "z", и: "y", і: "i", ї: "yi", й: "y", к: "k", л: "l",
  м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u",
  ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "shch", ь: "", ю: "yu",
  я: "ya", " ": "-",
};

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/['''`]/g, "")
    .split("")
    .map((c) => UK_MAP[c] ?? (c.match(/[a-z0-9-]/) ? c : ""))
    .join("")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// ── Markdown → HTML preview ───────────────────────────────────────────────────
// <Img> custom MDX component → rendered to plain <figure><img> for the preview.
function renderMdxImgLine(line: string): string {
  const get = (prop: string) => {
    const m = line.match(new RegExp(`\\b${prop}="([^"]*)"`));
    return m ? m[1] : "";
  };
  const src   = get("src");
  const alt   = get("alt");
  const float = get("float");
  const width = get("width");
  const href  = get("href");

  const widthVal = width
    ? (width.match(/^\d+$/) ? `${width}px` : width)
    : float ? "240px" : "100%";

  const figStyle =
    float === "left"  ? `float:left;width:${widthVal};margin:0 20px 16px 0;` :
    float === "right" ? `float:right;width:${widthVal};margin:0 0 16px 20px;` :
                        `display:block;max-width:${widthVal};margin:0 0 16px;`;

  const imgTag = `<img src="${src}" alt="${alt}" style="width:100%;border-radius:6px;display:block;margin:0;" />`;
  const inner  = href
    ? `<a href="${href}" target="_blank" rel="nofollow noopener noreferrer">${imgTag}</a>`
    : imgTag;
  return `<figure style="${figStyle}">${inner}</figure>`;
}

function convertMdSegment(md: string): string {
  return md
    // No HTML escaping — we support inline HTML (e.g. <strong>bold</strong> in paragraphs)
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full rounded my-2" />')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 underline">$1</a>')
    .replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")
    .replace(/^---$/gm, "<hr />")
    .replace(/^[-*] (.+)$/gm, "<li>$1</li>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/^(?!<[h|u|b|l|p])(.+)$/gm, "<p>$1</p>")
    .replace(/<p><\/p>/g, "");
}

function mdToHtml(md: string): string {
  const segments: string[] = [];
  const mdBuffer: string[] = [];

  for (const line of md.split("\n")) {
    if (/^[ \t]*<Img\s/.test(line)) {
      // Custom MDX <Img> component — convert to HTML for preview
      if (mdBuffer.length > 0) { segments.push(convertMdSegment(mdBuffer.join("\n"))); mdBuffer.length = 0; }
      segments.push(renderMdxImgLine(line));
    } else if (/^[ \t]*</.test(line)) {
      // Other HTML line — pass through raw
      if (mdBuffer.length > 0) { segments.push(convertMdSegment(mdBuffer.join("\n"))); mdBuffer.length = 0; }
      segments.push(line);
    } else {
      mdBuffer.push(line);
    }
  }
  if (mdBuffer.length > 0) {
    segments.push(convertMdSegment(mdBuffer.join("\n")));
  }
  return segments.join("\n");
}

// ── Toolbar ───────────────────────────────────────────────────────────────────
type Wrap = { before: string; after: string; placeholder?: string };

const TOOLBAR: Array<
  { label: string; title: string; wrap: Wrap } |
  { label: string; title: string; line: string }
> = [
  { label: "H2",  title: "Заголовок 2", wrap: { before: "<h2>",         after: "</h2>",         placeholder: "заголовок" } },
  { label: "H3",  title: "Заголовок 3", wrap: { before: "<h3>",         after: "</h3>",         placeholder: "заголовок" } },
  { label: "B",   title: "Жирний",      wrap: { before: "<strong>",     after: "</strong>",     placeholder: "жирний текст" } },
  { label: "I",   title: "Курсив",      wrap: { before: "<em>",         after: "</em>",         placeholder: "курсив" } },
  { label: "</>", title: "Код",         wrap: { before: "<code>",       after: "</code>",       placeholder: "код" } },
  { label: "🔗",  title: "Посилання",   wrap: { before: '<a href="URL">', after: "</a>",         placeholder: "текст посилання" } },
  { label: "•",   title: "Список",      wrap: { before: "<li>",         after: "</li>",         placeholder: "пункт списку" } },
  { label: "❝",   title: "Цитата",      wrap: { before: "<blockquote>", after: "</blockquote>", placeholder: "цитата" } },
  { label: "—",   title: "Роздільник",  line: "<hr />" },
];

// ── AliExpress types ───────────────────────────────────────────────────────────
interface AliProduct {
  productId: string;
  title: string;
  imageUrl: string;
  price: string;
  affiliateUrl: string;
}
type AliStatus = "unchecked" | "checking" | "affiliate" | "non-affiliate";
interface AliLinkState {
  status: AliStatus;
  affiliateUrl: string;
  suggestions: AliProduct[];
  finding: boolean;
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface ArticleForm {
  title: string;
  slug: string;
  type: "guide" | "top" | "review";
  status: "draft" | "published";
  date: string;
  category: string;
  subcategory: string;
  category2: string;
  subcategory2: string;
  category3: string;
  subcategory3: string;
  lang: string;
  excerpt: string;
  seo_title: string;
  seo_description: string;
  content: string;
  affiliate_url_1: string;
  affiliate_url_2: string;
  affiliate_url_3: string;
}

const EMPTY: ArticleForm = {
  title: "", slug: "", type: "guide", status: "draft",
  date: new Date().toISOString().slice(0, 10),
  category: "", subcategory: "",
  category2: "", subcategory2: "",
  category3: "", subcategory3: "",
  lang: "uk",
  excerpt: "", seo_title: "", seo_description: "", content: "",
  affiliate_url_1: "", affiliate_url_2: "", affiliate_url_3: "",
};

interface Props {
  article?: DBArticle | null;
  onSaved: (article: DBArticle) => void;
  onCancel: () => void;
}

export default function ArticleEditor({ article, onSaved, onCancel }: Props) {
  const isNew = !article || article.id === 0;
  const [form, setForm] = useState<ArticleForm>(
    article
      ? {
          title: article.title,
          slug: article.slug,
          type: article.type,
          status: article.status,
          date: article.date.toString().slice(0, 10),
          category: article.category,
          subcategory: article.subcategory ?? "",
          category2: article.category2 ?? "",
          subcategory2: article.subcategory2 ?? "",
          category3: article.category3 ?? "",
          subcategory3: article.subcategory3 ?? "",
          lang: article.lang,
          excerpt: article.excerpt ?? "",
          seo_title: article.seo_title ?? "",
          seo_description: article.seo_description ?? "",
          content: article.content,
          affiliate_url_1: article.affiliate_url_1 ?? "",
          affiliate_url_2: article.affiliate_url_2 ?? "",
          affiliate_url_3: article.affiliate_url_3 ?? "",
        }
      : { ...EMPTY }
  );

  // Load categories from DB (falls back to static CATEGORIES while loading)
  const [cats, setCats] = useState<CatOption[]>(CATEGORIES);
  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((data: CatOption[]) => { if (Array.isArray(data) && data.length > 0) setCats(data); })
      .catch(() => {});
  }, []);

  const [tab, setTab] = useState<"write" | "split" | "preview">("split");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [slugManual, setSlugManual] = useState(!isNew);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AliExpress link states
  const [aliStates, setAliStates] = useState<AliLinkState[]>([
    { status: "unchecked", affiliateUrl: "", suggestions: [], finding: false },
    { status: "unchecked", affiliateUrl: "", suggestions: [], finding: false },
    { status: "unchecked", affiliateUrl: "", suggestions: [], finding: false },
  ]);

  // Image panel state
  const [imgPanel, setImgPanel]       = useState(false);
  const [imgUrl, setImgUrl]           = useState("");
  const [imgAlt, setImgAlt]           = useState("");
  const [imgFloat, setImgFloat]       = useState<"none" | "left" | "right">("none");
  const [imgWidth, setImgWidth]       = useState("240");
  const [imgLink, setImgLink]         = useState("");
  const [imgUploading, setImgUploading] = useState(false);
  const [imgError, setImgError]       = useState("");

  const set = (key: keyof ArticleForm, val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const handleTitle = (val: string) => {
    set("title", val);
    if (!slugManual) set("slug", toSlug(val));
  };

  // Toolbar insert
  const applyFormat = useCallback((item: (typeof TOOLBAR)[number]) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end   = ta.selectionEnd;
    const text  = form.content;

    if ("line" in item) {
      const lineStart = text.lastIndexOf("\n", start - 1) + 1;
      const newText = text.slice(0, lineStart) + item.line + text.slice(lineStart);
      set("content", newText);
      setTimeout(() => {
        ta.focus();
        ta.setSelectionRange(lineStart + item.line.length, lineStart + item.line.length);
      }, 0);
      return;
    }

    const { before, after, placeholder = "текст" } = item.wrap;
    const selected = text.slice(start, end);
    const insert = before + (selected || placeholder) + after;
    const newText = text.slice(0, start) + insert + text.slice(end);
    set("content", newText);
    setTimeout(() => {
      ta.focus();
      const cur = start + insert.length;
      ta.setSelectionRange(cur, cur);
    }, 0);
  }, [form.content]);

  // Image upload
  async function uploadImage(file: File) {
    setImgUploading(true);
    setImgError("");
    setImgUrl("");
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (res.ok) {
      setImgUrl(data.url);
    } else {
      setImgError(data.error ?? "Помилка завантаження");
    }
    setImgUploading(false);
  }

  // AliExpress helpers
  const ALI_URL_KEYS = ["affiliate_url_1", "affiliate_url_2", "affiliate_url_3"] as const;

  async function checkAffiliateLink(idx: number) {
    const urlKey = ALI_URL_KEYS[idx];
    const url = form[urlKey];
    if (!url) return;
    setAliStates((prev) => prev.map((s, i) => i === idx ? { ...s, status: "checking" } : s));
    try {
      const res  = await fetch("/api/admin/check-affiliate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      setAliStates((prev) => prev.map((s, i) =>
        i === idx ? { ...s, status: data.isAffiliate ? "affiliate" : "non-affiliate", affiliateUrl: data.affiliateUrl ?? "" } : s
      ));
    } catch {
      setAliStates((prev) => prev.map((s, i) => i === idx ? { ...s, status: "unchecked" } : s));
    }
  }

  async function findAlternative(idx: number) {
    setAliStates((prev) => prev.map((s, i) => i === idx ? { ...s, finding: true, suggestions: [] } : s));
    try {
      const query = form.title || "USB gadget";
      const res   = await fetch("/api/admin/find-affiliate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      setAliStates((prev) => prev.map((s, i) =>
        i === idx ? { ...s, finding: false, suggestions: data.products ?? [] } : s
      ));
    } catch {
      setAliStates((prev) => prev.map((s, i) => i === idx ? { ...s, finding: false } : s));
    }
  }

  function approveAlternative(idx: number, product: AliProduct) {
    const urlKey = ALI_URL_KEYS[idx];
    const oldUrl = form[urlKey];
    // Replace old URL in content
    if (oldUrl) {
      set("content", form.content.split(oldUrl).join(product.affiliateUrl));
    }
    set(urlKey, product.affiliateUrl);
    setAliStates((prev) => prev.map((s, i) =>
      i === idx ? { ...s, status: "affiliate", affiliateUrl: product.affiliateUrl, suggestions: [] } : s
    ));
  }

  function rejectAlternative(idx: number, productId: string) {
    setAliStates((prev) => prev.map((s, i) =>
      i === idx ? { ...s, suggestions: s.suggestions.filter((p) => p.productId !== productId) } : s
    ));
  }

  function resetImgPanel() {
    setImgPanel(false);
    setImgUrl("");
    setImgAlt("");
    setImgFloat("none");
    setImgLink("");
    setImgError("");
  }

  function insertImage() {
    if (!imgUrl) return;

    let md: string;

    if (imgFloat === "none" && !imgLink) {
      // Standard HTML img tag — valid MDX, no style attribute needed
      md = `\n<img src="${imgUrl}"${imgAlt ? ` alt="${imgAlt}"` : ""} />\n`;
    } else {
      // Custom MDX <Img> component (handles float, width, link safely in JSX)
      const parts: string[] = [`src="${imgUrl}"`];
      if (imgAlt)             parts.push(`alt="${imgAlt}"`);
      if (imgFloat !== "none") parts.push(`float="${imgFloat}"`);
      if (imgWidth)           parts.push(`width="${imgWidth}"`);
      if (imgLink)            parts.push(`href="${imgLink}"`);
      md = `\n<Img ${parts.join(" ")} />\n`;
    }

    const ta = textareaRef.current;
    if (ta) {
      const start = ta.selectionStart;
      const newText = form.content.slice(0, start) + md + form.content.slice(start);
      set("content", newText);
      setTimeout(() => {
        ta.focus();
        ta.setSelectionRange(start + md.length, start + md.length);
      }, 0);
    }
    resetImgPanel();
  }

  // Save (з опціональним override статусу)
  async function handleSave(statusOverride?: "draft" | "published") {
    if (!form.title || !form.slug || !form.content || !form.category || !form.date) {
      setError("Заповніть: Назва, Slug, Категорія, Дата, Контент");
      return;
    }
    setSaving(true);
    setError("");

    const url    = isNew ? "/api/admin/articles" : `/api/admin/articles/${article!.id}`;
    const method = isNew ? "POST" : "PUT";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        status:          statusOverride      ?? form.status,
        subcategory:     form.subcategory     || undefined,
        category2:       form.category2       || undefined,
        subcategory2:    form.subcategory2    || undefined,
        category3:       form.category3       || undefined,
        subcategory3:    form.subcategory3    || undefined,
        excerpt:         form.excerpt         || undefined,
        seo_title:       form.seo_title       || undefined,
        seo_description: form.seo_description || undefined,
        affiliate_url_1: form.affiliate_url_1 || undefined,
        affiliate_url_2: form.affiliate_url_2 || undefined,
        affiliate_url_3: form.affiliate_url_3 || undefined,
      }),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error ?? "Помилка збереження");
      return;
    }

    const articleId = isNew ? data.id : article!.id;
    const fetchRes  = await fetch(`/api/admin/articles/${articleId}`);
    const saved     = await fetchRes.json();
    onSaved(saved);
  }

  const selectedCat  = cats.find((c) => c.slug === form.category);
  const selectedCat2 = cats.find((c) => c.slug === form.category2);
  const selectedCat3 = cats.find((c) => c.slug === form.category3);

  // Derived value for float preview width
  const previewWidth = imgWidth
    ? (imgWidth.match(/^\d+$/) ? `${imgWidth}px` : imgWidth)
    : "240px";

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">
          {isNew ? "Нова стаття" : "Редагування статті"}
        </h2>
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Скасувати
          </button>
          <button
            onClick={() => handleSave()}
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "Збереження..." : isNew ? "Створити" : "Зберегти"}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        {/* ── Main editor ── */}
        <div className="flex flex-col gap-4">
          {/* Title */}
          <input
            type="text"
            value={form.title}
            onChange={(e) => handleTitle(e.target.value)}
            placeholder="Назва статті..."
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-2xl font-bold text-gray-900 placeholder-gray-300 focus:border-indigo-400 focus:outline-none"
          />

          {/* Slug */}
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
            <span className="text-gray-400">comfortshop.com.ua/oglyady/</span>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => { setSlugManual(true); set("slug", e.target.value.toLowerCase().replace(/\s+/g, "-")); }}
              className="flex-1 bg-transparent font-mono text-gray-700 focus:outline-none"
              placeholder="avto-slug-z-nazvy"
            />
          </div>

          {/* Editor tabs */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            {/* Tab bar + toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 bg-gray-50 px-3 py-2">
              {/* Mode tabs */}
              <div className="flex gap-0.5 rounded-lg border border-gray-200 bg-gray-100 p-0.5">
                {([
                  { id: "write",   label: "✏️ Редактор" },
                  { id: "split",   label: "⬜ Поруч" },
                  { id: "preview", label: "👁 Перегляд" },
                ] as const).map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => setTab(id)}
                    className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                      tab === id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Toolbar — visible when editor is shown */}
              {tab !== "preview" && (
                <div className="flex flex-wrap items-center gap-0.5">
                  {TOOLBAR.map((item) => (
                    <button
                      key={item.label}
                      title={item.title}
                      onMouseDown={(e) => {
                        e.preventDefault(); // keep textarea focus & selection
                        applyFormat(item);
                      }}
                      className="rounded px-2 py-1 text-xs font-mono font-semibold text-gray-600 hover:bg-gray-200 active:bg-gray-300"
                    >
                      {item.label}
                    </button>
                  ))}
                  <div className="mx-1 h-4 w-px bg-gray-300" />
                  <button
                    title="Вставити зображення"
                    onMouseDown={(e) => { e.preventDefault(); setImgPanel((v) => !v); setImgError(""); }}
                    className={`rounded px-2 py-1 text-xs font-semibold ${imgPanel ? "bg-indigo-100 text-indigo-700" : "text-gray-600 hover:bg-gray-200"}`}
                  >
                    🖼 Фото
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f); e.target.value = ""; }}
                  />
                </div>
              )}
            </div>

            {/* ── Image panel ── */}
            {tab !== "preview" && imgPanel && (
              <div className="border-b border-indigo-100 bg-indigo-50 px-4 py-3 space-y-3">
                <p className="text-xs font-semibold text-indigo-700">Вставити зображення</p>

                {/* Row 1: File upload + URL */}
                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-500">Файл (JPG/PNG/GIF/WebP, до 5 МБ)</label>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={imgUploading}
                      className="rounded-lg border border-dashed border-indigo-300 bg-white px-4 py-2 text-xs font-medium text-indigo-600 hover:border-indigo-500 hover:bg-indigo-50 disabled:opacity-50"
                    >
                      {imgUploading ? "Завантаження..." : imgUrl ? "✓ Завантажено — обрати інший" : "⬆ Обрати файл"}
                    </button>
                  </div>
                  <div className="flex flex-1 flex-col gap-1">
                    <label className="text-xs text-gray-500">або URL зображення</label>
                    <input
                      type="text"
                      value={imgUrl}
                      onChange={(e) => setImgUrl(e.target.value)}
                      placeholder="https://... або /uploads/..."
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-mono focus:border-indigo-400 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Row 2: Alt + Float + Width */}
                <div className="flex flex-wrap items-end gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-500">Alt-текст</label>
                    <input
                      type="text"
                      value={imgAlt}
                      onChange={(e) => setImgAlt(e.target.value)}
                      placeholder="опис зображення"
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs focus:border-indigo-400 focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-500">Обтікання текстом</label>
                    <div className="flex overflow-hidden rounded-lg border border-gray-200 bg-white text-xs font-medium">
                      {(["none", "left", "right"] as const).map((f) => (
                        <button
                          key={f}
                          onClick={() => setImgFloat(f)}
                          className={`border-r border-gray-200 px-3 py-2 last:border-r-0 transition-colors ${
                            imgFloat === f ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {f === "none" ? "Без обтікання" : f === "left" ? "◧ Зліва" : "◨ Справа"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {imgFloat !== "none" && (
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-gray-500">Ширина</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={imgWidth}
                          onChange={(e) => setImgWidth(e.target.value)}
                          placeholder="240"
                          className="w-20 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-mono focus:border-indigo-400 focus:outline-none"
                        />
                        <span className="text-xs text-gray-400">px / %</span>
                      </div>
                      <div className="flex gap-1">
                        {["160", "240", "320", "50%"].map((w) => (
                          <button
                            key={w}
                            onClick={() => setImgWidth(w)}
                            className={`rounded px-1.5 py-0.5 text-xs ${
                              imgWidth === w
                                ? "bg-indigo-100 font-semibold text-indigo-700"
                                : "border border-gray-200 bg-white text-gray-500 hover:border-indigo-300"
                            }`}
                          >
                            {w}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Row 3: Product link */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-500">
                    Посилання на товар (AliExpress, Rozetka тощо — необов&apos;язково)
                  </label>
                  <input
                    type="text"
                    value={imgLink}
                    onChange={(e) => setImgLink(e.target.value)}
                    placeholder="https://aliexpress.com/item/..."
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-mono focus:border-indigo-400 focus:outline-none"
                  />
                  {imgLink && (
                    <p className="text-xs text-gray-400">
                      rel=&quot;nofollow&quot; додається автоматично
                    </p>
                  )}
                </div>

                {/* Actions row */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={insertImage}
                    disabled={!imgUrl || imgUploading}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-40"
                  >
                    Вставити
                  </button>
                  <button
                    onClick={resetImgPanel}
                    className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100"
                  >
                    ✕
                  </button>
                  {imgUrl && !imgUploading && (
                    <div className="ml-2 flex items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imgUrl}
                        alt={imgAlt}
                        className="h-10 w-10 rounded border border-gray-200 object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                      <span className="max-w-[180px] truncate font-mono text-xs text-gray-400">{imgUrl}</span>
                    </div>
                  )}
                </div>

                {/* Float preview */}
                {imgUrl && !imgUploading && imgFloat !== "none" && (
                  <div className="rounded-lg border border-indigo-200 bg-white p-3">
                    <p className="mb-2 text-xs font-semibold text-indigo-600">Попередній перегляд обтікання:</p>
                    <div style={{ overflow: "auto" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imgUrl}
                        alt={imgAlt}
                        style={{
                          float: imgFloat,
                          width: previewWidth,
                          margin: imgFloat === "left" ? "0 16px 8px 0" : "0 0 8px 16px",
                          borderRadius: "6px",
                          display: "block",
                        }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                      <p className="text-xs leading-5 text-gray-500">
                        Текст статті буде обтікати зображення ось так. Речення продовжуються
                        поруч із зображенням, поки вистачає місця. Після того, як текст
                        перевищить висоту зображення, він продовжується нижче на всю ширину
                        колонки.
                      </p>
                      <div style={{ clear: "both" }} />
                    </div>
                  </div>
                )}

                {imgError && <p className="text-xs text-red-600">{imgError}</p>}
              </div>
            )}

            <div className={tab === "split" ? "flex divide-x divide-gray-200" : ""}>
              {/* Markdown textarea — hidden in preview-only mode */}
              {tab !== "preview" && (
                <textarea
                  ref={textareaRef}
                  value={form.content}
                  onChange={(e) => set("content", e.target.value)}
                  placeholder="# Введіть текст статті у форматі Markdown / MDX..."
                  rows={28}
                  className={`${
                    tab === "split" ? "w-1/2 resize-none" : "w-full resize-y"
                  } px-4 py-4 font-mono text-sm text-gray-800 focus:outline-none`}
                />
              )}
              {/* Live preview — hidden in write-only mode */}
              {tab !== "write" && (
                <div
                  className={`${
                    tab === "split" ? "w-1/2" : "w-full"
                  } overflow-auto prose prose-sm max-w-none px-6 py-5`}
                  dangerouslySetInnerHTML={{ __html: mdToHtml(form.content) }}
                />
              )}
            </div>
          </div>

          {/* Excerpt */}
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600">
              Анотація (excerpt)
            </label>
            <textarea
              value={form.excerpt}
              onChange={(e) => set("excerpt", e.target.value)}
              rows={3}
              placeholder="Короткий опис для карток і SEO..."
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 focus:border-indigo-400 focus:outline-none"
            />
          </div>

          {/* Bottom save bar */}
          <div className="flex items-center justify-end gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
            <button
              onClick={onCancel}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Скасувати
            </button>
            <button
              onClick={() => handleSave()}
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? "Збереження..." : isNew ? "✓ Створити статтю" : "✓ Зберегти зміни"}
            </button>
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div className="flex flex-col gap-5">

          {/* Status */}
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Публікація</p>
            {form.status === "draft" ? (
              <button
                onClick={() => handleSave("published")}
                disabled={saving}
                className="w-full rounded-lg bg-green-600 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? "Публікація..." : "✓ Опублікувати"}
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="rounded-lg border border-green-300 bg-green-50 py-2 text-center text-sm font-semibold text-green-700">
                  ✓ Опубліковано
                </div>
                <button
                  onClick={() => handleSave("draft")}
                  disabled={saving}
                  className="w-full rounded-lg border border-gray-300 py-2 text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Повернути в чернетку
                </button>
              </div>
            )}
            <div className="mt-3">
              <label className="mb-1 block text-xs text-gray-500">Дата публікації</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Type */}
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Тип</p>
            <select
              value={form.type}
              onChange={(e) => set("type", e.target.value as ArticleForm["type"])}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
            >
              <option value="guide">Огляд (guide)</option>
              <option value="top">Топ-список (top)</option>
              <option value="review">Рев&apos;ю (review)</option>
            </select>
            <p className="mt-2 text-xs text-gray-400">
              {form.type === "top" ? "URL: /top/slug" : "URL: /oglyady/slug"}
            </p>
          </div>

          {/* Categories */}
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Категорії (до 3)</p>
            <div className="flex flex-col gap-3">
              {/* Category 1 — обов'язкова */}
              <div>
                <label className="mb-1 block text-xs text-gray-500">1. Основна *</label>
                <select
                  value={form.category}
                  onChange={(e) => { set("category", e.target.value); set("subcategory", ""); }}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                >
                  <option value="">— Оберіть категорію —</option>
                  {cats.map((c) => (
                    <option key={c.slug} value={c.slug}>{c.icon} {c.name}</option>
                  ))}
                </select>
                {selectedCat && selectedCat.subcategories.length > 0 && (
                  <select
                    value={form.subcategory}
                    onChange={(e) => set("subcategory", e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                  >
                    <option value="">— Підкатегорія —</option>
                    {selectedCat.subcategories.map((s) => (
                      <option key={s.slug} value={s.slug}>{s.icon} {s.name}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Category 2 — опційна */}
              <div>
                <label className="mb-1 block text-xs text-gray-500">2. Додаткова</label>
                <select
                  value={form.category2}
                  onChange={(e) => { set("category2", e.target.value); set("subcategory2", ""); }}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                >
                  <option value="">— Не обрано —</option>
                  {cats.map((c) => (
                    <option key={c.slug} value={c.slug}>{c.icon} {c.name}</option>
                  ))}
                </select>
                {selectedCat2 && selectedCat2.subcategories.length > 0 && (
                  <select
                    value={form.subcategory2}
                    onChange={(e) => set("subcategory2", e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                  >
                    <option value="">— Підкатегорія —</option>
                    {selectedCat2.subcategories.map((s) => (
                      <option key={s.slug} value={s.slug}>{s.icon} {s.name}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Category 3 — опційна */}
              <div>
                <label className="mb-1 block text-xs text-gray-500">3. Додаткова</label>
                <select
                  value={form.category3}
                  onChange={(e) => { set("category3", e.target.value); set("subcategory3", ""); }}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                >
                  <option value="">— Не обрано —</option>
                  {cats.map((c) => (
                    <option key={c.slug} value={c.slug}>{c.icon} {c.name}</option>
                  ))}
                </select>
                {selectedCat3 && selectedCat3.subcategories.length > 0 && (
                  <select
                    value={form.subcategory3}
                    onChange={(e) => set("subcategory3", e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                  >
                    <option value="">— Підкатегорія —</option>
                    {selectedCat3.subcategories.map((s) => (
                      <option key={s.slug} value={s.slug}>{s.icon} {s.name}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* SEO */}
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">SEO</p>
            <div className="flex flex-col gap-3">
              <div>
                <label className="mb-1 block text-xs text-gray-500">
                  Title тег
                  <span className={`ml-1 ${form.seo_title.length > 60 ? "text-red-500" : "text-gray-400"}`}>
                    ({form.seo_title.length}/60)
                  </span>
                </label>
                <input
                  type="text"
                  value={form.seo_title}
                  onChange={(e) => set("seo_title", e.target.value)}
                  placeholder={form.title}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:border-indigo-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">
                  Meta description
                  <span className={`ml-1 ${form.seo_description.length > 160 ? "text-red-500" : "text-gray-400"}`}>
                    ({form.seo_description.length}/160)
                  </span>
                </label>
                <textarea
                  value={form.seo_description}
                  onChange={(e) => set("seo_description", e.target.value)}
                  rows={3}
                  placeholder={form.excerpt}
                  className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-xs focus:border-indigo-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* AliExpress Links */}
          <div className="rounded-xl border border-orange-200 bg-white p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-orange-600">🛍 AliExpress</p>
            <div className="flex flex-col gap-4">
              {([
                { key: "affiliate_url_1" as const, label: "1. Головний (кнопка «Де купити»)" },
                { key: "affiliate_url_2" as const, label: "2. В тексті (виділений блок)" },
                { key: "affiliate_url_3" as const, label: "3. Додаткове посилання" },
              ]).map(({ key, label }, idx) => {
                const ali = aliStates[idx];
                const statusColor =
                  ali.status === "affiliate"     ? "bg-green-100 text-green-700" :
                  ali.status === "non-affiliate" ? "bg-red-100 text-red-700" :
                  ali.status === "checking"      ? "bg-blue-100 text-blue-600" :
                                                   "bg-gray-100 text-gray-500";
                const statusLabel =
                  ali.status === "affiliate"     ? "✅ Affiliate" :
                  ali.status === "non-affiliate" ? "⚠️ Non-affiliate" :
                  ali.status === "checking"      ? "⏳ Перевірка..." :
                                                   "? Не перевірено";
                return (
                  <div key={key} className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-gray-600">{label}</label>
                    <input
                      type="text"
                      value={form[key]}
                      onChange={(e) => {
                        set(key, e.target.value);
                        setAliStates((prev) => prev.map((s, i) =>
                          i === idx ? { ...s, status: "unchecked", affiliateUrl: "", suggestions: [] } : s
                        ));
                      }}
                      placeholder="https://aliexpress.com/item/..."
                      className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs font-mono focus:border-orange-400 focus:outline-none"
                    />
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor}`}>
                        {statusLabel}
                      </span>
                      {form[key] && ali.status !== "checking" && (
                        <button
                          onClick={() => checkAffiliateLink(idx)}
                          className="rounded-lg border border-gray-200 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-50"
                        >
                          Перевірити
                        </button>
                      )}
                      {ali.status === "non-affiliate" && (
                        <button
                          onClick={() => findAlternative(idx)}
                          disabled={ali.finding}
                          className="rounded-lg bg-orange-500 px-2 py-0.5 text-xs font-medium text-white hover:bg-orange-600 disabled:opacity-50"
                        >
                          {ali.finding ? "Шукаємо..." : "🔍 Знайти аналог"}
                        </button>
                      )}
                    </div>
                    {/* Affiliate URL (read-only) */}
                    {ali.status === "affiliate" && ali.affiliateUrl && (
                      <div className="rounded bg-green-50 px-2 py-1 font-mono text-xs text-green-700 break-all">
                        {ali.affiliateUrl}
                      </div>
                    )}
                    {/* Suggestions */}
                    {ali.suggestions.length > 0 && (
                      <div className="flex flex-col gap-2 rounded-lg border border-orange-200 bg-orange-50 p-2">
                        <p className="text-xs font-semibold text-orange-700">Знайдено аналоги:</p>
                        {ali.suggestions.map((product) => (
                          <div key={product.productId} className="flex items-start gap-2 rounded bg-white p-2 text-xs">
                            {product.imageUrl && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={product.imageUrl} alt={product.title} className="h-10 w-10 rounded object-cover flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="line-clamp-2 text-gray-700">{product.title}</p>
                              {product.price && <p className="text-orange-600 font-medium">{product.price}</p>}
                            </div>
                            <div className="flex flex-col gap-1 flex-shrink-0">
                              <button
                                onClick={() => approveAlternative(idx, product)}
                                className="rounded bg-green-600 px-2 py-0.5 text-xs font-medium text-white hover:bg-green-700"
                              >
                                ✓ Прийняти
                              </button>
                              <button
                                onClick={() => rejectAlternative(idx, product.productId)}
                                className="rounded border border-gray-300 px-2 py-0.5 text-xs text-gray-500 hover:bg-gray-100"
                              >
                                ✗ Відхилити
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Language */}
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Мова</p>
            <select
              value={form.lang}
              onChange={(e) => set("lang", e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
            >
              <option value="uk">🇺🇦 Українська</option>
              <option value="ru">🇷🇺 Російська</option>
              <option value="en">🇬🇧 English</option>
            </select>
          </div>

          {!isNew && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-xs text-gray-500">
              <p>ID: {article!.id}</p>
              <p className="mt-1">Ревізій: {article!.revision_count}</p>
              <p className="mt-1">Оновлено: {new Date(article!.updated_at).toLocaleString("uk-UA")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
