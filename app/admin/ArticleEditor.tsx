"use client";

import { useState, useRef, useCallback } from "react";
import { CATEGORIES } from "@/lib/categories";
import type { DBArticle } from "@/lib/articles";

// ── Ukrainian transliteration (KMU 2010) ─────────────────────────────────────
const UK_MAP: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "h", ґ: "g", д: "d", е: "e", є: "ye",
  ж: "zh", з: "z", и: "y", і: "i", ї: "yi", й: "y", к: "k", л: "l",
  м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u",
  ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "shch", ь: "", ю: "yu",
  я: "ya", " ": "-", "'": "", "'": "", "`": "",
};

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .split("")
    .map((c) => UK_MAP[c] ?? (c.match(/[a-z0-9-]/) ? c : ""))
    .join("")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// ── Simple markdown → HTML preview ───────────────────────────────────────────
function mdToHtml(md: string): string {
  return md
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 underline">$1</a>')
    .replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")
    .replace(/^---$/gm, "<hr />")
    .replace(/^[-*] (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/^(?!<[h|u|b|l|p])(.+)$/gm, "<p>$1</p>")
    .replace(/<p><\/p>/g, "");
}

// ── Toolbar helper ────────────────────────────────────────────────────────────
type Wrap = { before: string; after: string; placeholder?: string };

const TOOLBAR: Array<{ label: string; title: string; wrap: Wrap } | { label: string; title: string; line: string }> = [
  { label: "H2", title: "Заголовок 2", line: "## " },
  { label: "H3", title: "Заголовок 3", line: "### " },
  { label: "B", title: "Жирний", wrap: { before: "**", after: "**", placeholder: "жирний текст" } },
  { label: "I", title: "Курсив", wrap: { before: "*", after: "*", placeholder: "курсив" } },
  { label: "</>", title: "Код", wrap: { before: "`", after: "`", placeholder: "код" } },
  { label: "🔗", title: "Посилання", wrap: { before: "[", after: "](url)", placeholder: "текст посилання" } },
  { label: "•", title: "Список", line: "- " },
  { label: "❝", title: "Цитата", line: "> " },
  { label: "—", title: "Роздільник", line: "---" },
];

// ── Types ─────────────────────────────────────────────────────────────────────
interface FormData {
  title: string;
  slug: string;
  type: "guide" | "top" | "review";
  status: "draft" | "published";
  date: string;
  category: string;
  subcategory: string;
  lang: string;
  excerpt: string;
  seo_title: string;
  seo_description: string;
  content: string;
}

const EMPTY: FormData = {
  title: "", slug: "", type: "guide", status: "draft",
  date: new Date().toISOString().slice(0, 10),
  category: "", subcategory: "", lang: "uk",
  excerpt: "", seo_title: "", seo_description: "", content: "",
};

interface Props {
  article?: DBArticle | null;
  onSaved: (article: DBArticle) => void;
  onCancel: () => void;
}

export default function ArticleEditor({ article, onSaved, onCancel }: Props) {
  const isNew = !article;
  const [form, setForm] = useState<FormData>(
    article
      ? {
          title: article.title,
          slug: article.slug,
          type: article.type,
          status: article.status,
          date: article.date.toString().slice(0, 10),
          category: article.category,
          subcategory: article.subcategory ?? "",
          lang: article.lang,
          excerpt: article.excerpt ?? "",
          seo_title: article.seo_title ?? "",
          seo_description: article.seo_description ?? "",
          content: article.content,
        }
      : { ...EMPTY }
  );

  const [tab, setTab] = useState<"write" | "preview">("write");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [slugManual, setSlugManual] = useState(!isNew);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const set = (key: keyof FormData, val: string) =>
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
    const end = ta.selectionEnd;
    const text = form.content;
    const selected = text.slice(start, end);

    let insert: string;
    if ("line" in item) {
      // Line prefix: insert at start of line
      const lineStart = text.lastIndexOf("\n", start - 1) + 1;
      const newText = text.slice(0, lineStart) + item.line + text.slice(lineStart);
      set("content", newText);
      setTimeout(() => {
        ta.focus();
        ta.setSelectionRange(lineStart + item.line.length, lineStart + item.line.length);
      }, 0);
      return;
    } else {
      const { before, after, placeholder = "текст" } = item.wrap;
      insert = before + (selected || placeholder) + after;
    }

    const newText = text.slice(0, start) + insert + text.slice(end);
    set("content", newText);
    setTimeout(() => {
      ta.focus();
      const cur = start + insert.length;
      ta.setSelectionRange(cur, cur);
    }, 0);
  }, [form.content]);

  // Save
  async function handleSave() {
    if (!form.title || !form.slug || !form.content || !form.category || !form.date) {
      setError("Заповніть: Назва, Slug, Категорія, Дата, Контент");
      return;
    }
    setSaving(true);
    setError("");

    const url = isNew ? "/api/admin/articles" : `/api/admin/articles/${article!.id}`;
    const method = isNew ? "POST" : "PUT";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        subcategory: form.subcategory || undefined,
        excerpt: form.excerpt || undefined,
        seo_title: form.seo_title || undefined,
        seo_description: form.seo_description || undefined,
      }),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error ?? "Помилка збереження");
      return;
    }

    // Fetch the saved article to pass back
    const articleId = isNew ? data.id : article!.id;
    const fetchRes = await fetch(`/api/admin/articles/${articleId}`);
    const saved = await fetchRes.json();
    onSaved(saved);
  }

  const selectedCat = CATEGORIES.find((c) => c.slug === form.category);

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
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "Збереження..." : isNew ? "Створити" : "Зберегти"}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
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

          {/* Write / Preview tabs */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            {/* Tab bar + toolbar */}
            <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-3 py-2">
              <div className="flex gap-1">
                {(["write", "preview"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                      tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {t === "write" ? "✏️ Редактор" : "👁 Перегляд"}
                  </button>
                ))}
              </div>
              {tab === "write" && (
                <div className="flex flex-wrap gap-1">
                  {TOOLBAR.map((item) => (
                    <button
                      key={item.label}
                      title={item.title}
                      onClick={() => applyFormat(item)}
                      className="rounded px-2 py-1 text-xs font-mono font-semibold text-gray-600 hover:bg-gray-200"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {tab === "write" ? (
              <textarea
                ref={textareaRef}
                value={form.content}
                onChange={(e) => set("content", e.target.value)}
                placeholder="# Введіть текст статті у форматі Markdown / MDX..."
                rows={28}
                className="w-full resize-y px-4 py-4 font-mono text-sm text-gray-800 focus:outline-none"
              />
            ) : (
              <div
                className="prose prose-sm max-w-none px-6 py-5"
                dangerouslySetInnerHTML={{ __html: mdToHtml(form.content) }}
              />
            )}
          </div>

          {/* Excerpt */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600 uppercase tracking-wide">Анотація (excerpt)</label>
            <textarea
              value={form.excerpt}
              onChange={(e) => set("excerpt", e.target.value)}
              rows={3}
              placeholder="Короткий опис для карток і SEO..."
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 focus:border-indigo-400 focus:outline-none"
            />
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div className="flex flex-col gap-5">

          {/* Status */}
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Публікація</p>
            <div className="grid grid-cols-2 gap-2">
              {(["draft", "published"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => set("status", s)}
                  className={`rounded-lg border py-2 text-xs font-semibold transition-colors ${
                    form.status === s
                      ? s === "published"
                        ? "border-green-400 bg-green-50 text-green-700"
                        : "border-gray-400 bg-gray-100 text-gray-700"
                      : "border-gray-200 text-gray-400 hover:border-gray-300"
                  }`}
                >
                  {s === "draft" ? "Чернетка" : "Опубліковано"}
                </button>
              ))}
            </div>
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
              onChange={(e) => set("type", e.target.value as FormData["type"])}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
            >
              <option value="guide">Огляд (guide)</option>
              <option value="top">Топ-список (top)</option>
              <option value="review">Рев'ю (review)</option>
            </select>
            <p className="mt-2 text-xs text-gray-400">
              {form.type === "top" ? "URL: /top/slug" : "URL: /oglyady/slug"}
            </p>
          </div>

          {/* Category */}
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Категорія</p>
            <select
              value={form.category}
              onChange={(e) => { set("category", e.target.value); set("subcategory", ""); }}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
            >
              <option value="">— Оберіть категорію —</option>
              {CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>{c.icon} {c.name}</option>
              ))}
            </select>
            {selectedCat && selectedCat.subcategories.length > 0 && (
              <select
                value={form.subcategory}
                onChange={(e) => set("subcategory", e.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
              >
                <option value="">— Підкатегорія (опційно) —</option>
                {selectedCat.subcategories.map((s) => (
                  <option key={s.slug} value={s.slug}>{s.icon} {s.name}</option>
                ))}
              </select>
            )}
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
