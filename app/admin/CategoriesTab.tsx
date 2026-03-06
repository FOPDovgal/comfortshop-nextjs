"use client";

import { useState, useEffect, useCallback, useRef } from "react";

type Sub = {
  id: number;
  category_id: number;
  slug: string;
  name: string;
  icon: string;
  description: string | null;
  seo_title: string | null;
  seo_description: string | null;
  sort_order: number;
};

type Cat = {
  id: number;
  slug: string;
  name: string;
  icon: string;
  color_from: string;
  color_to: string;
  bg_light: string;
  description: string | null;
  seo_title: string | null;
  seo_description: string | null;
  sort_order: number;
  subcategories: Sub[];
};

const EMPTY_CAT: Cat = {
  id: 0, slug: "", name: "", icon: "📦",
  color_from: "#6366f1", color_to: "#8b5cf6", bg_light: "#f5f3ff",
  description: null, seo_title: null, seo_description: null, sort_order: 0, subcategories: [],
};

const EMPTY_SUB: Sub = {
  id: 0, category_id: 0, slug: "", name: "", icon: "📌",
  description: null, seo_title: null, seo_description: null, sort_order: 0,
};

// ── HTML Editor with toolbar ───────────────────────────────────────────────
type ToolbarItem =
  | { label: string; title: string; before: string; after: string; placeholder?: string }
  | { label: string; title: string; line: string };

const TOOLBAR_ITEMS: ToolbarItem[] = [
  { label: "H2",  title: "Заголовок 2", before: "<h2>",         after: "</h2>",         placeholder: "заголовок" },
  { label: "H3",  title: "Заголовок 3", before: "<h3>",         after: "</h3>",         placeholder: "заголовок" },
  { label: "B",   title: "Жирний",      before: "<strong>",     after: "</strong>",     placeholder: "жирний текст" },
  { label: "I",   title: "Курсив",      before: "<em>",         after: "</em>",         placeholder: "курсив" },
  { label: "🔗",  title: "Посилання",   before: '<a href="URL">', after: "</a>",         placeholder: "текст посилання" },
  { label: "•",   title: "Список",      before: "<li>",         after: "</li>",         placeholder: "пункт списку" },
  { label: "❝",   title: "Цитата",      before: "<blockquote>", after: "</blockquote>", placeholder: "цитата" },
  { label: "—",   title: "Роздільник",  line: "<hr />" },
];

function HtmlEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const [preview, setPreview] = useState(false);

  const applyFormat = useCallback((item: ToolbarItem) => {
    const ta = taRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end   = ta.selectionEnd;
    const text  = value;

    if ("line" in item) {
      const lineStart = text.lastIndexOf("\n", start - 1) + 1;
      const newText = text.slice(0, lineStart) + item.line + "\n" + text.slice(lineStart);
      onChange(newText);
      setTimeout(() => { ta.focus(); ta.setSelectionRange(lineStart + item.line.length + 1, lineStart + item.line.length + 1); }, 0);
      return;
    }

    const selected = text.slice(start, end) || item.placeholder || "";
    const newText = text.slice(0, start) + item.before + selected + item.after + text.slice(end);
    onChange(newText);
    setTimeout(() => {
      ta.focus();
      const cursor = start + item.before.length + selected.length + item.after.length;
      ta.setSelectionRange(cursor, cursor);
    }, 0);
  }, [value, onChange]);

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 bg-gray-50 px-2 py-1.5">
        {TOOLBAR_ITEMS.map((item) => (
          <button
            key={item.label}
            type="button"
            title={item.title}
            onMouseDown={(e) => { e.preventDefault(); applyFormat(item); }}
            className="rounded px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200"
          >
            {item.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => setPreview(false)}
            className={`rounded px-2 py-1 text-xs ${!preview ? "bg-indigo-600 text-white" : "text-gray-500 hover:bg-gray-200"}`}
          >
            HTML
          </button>
          <button
            type="button"
            onClick={() => setPreview(true)}
            className={`rounded px-2 py-1 text-xs ${preview ? "bg-indigo-600 text-white" : "text-gray-500 hover:bg-gray-200"}`}
          >
            Перегляд
          </button>
        </div>
      </div>

      {preview ? (
        <div
          className="prose prose-sm max-w-none min-h-[300px] p-4 text-sm text-gray-800"
          dangerouslySetInnerHTML={{ __html: value || "<p class='text-gray-400'>Опис порожній</p>" }}
        />
      ) : (
        <textarea
          ref={taRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={14}
          className="w-full resize-y px-3 py-2 font-mono text-xs text-gray-800 focus:outline-none"
          placeholder="HTML-опис категорії..."
          spellCheck={false}
        />
      )}
    </div>
  );
}

function Field({
  label, value, onChange, type = "text", hint, rows,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; hint?: string; rows?: number;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-600">{label}</label>
      {rows ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none ${type === "color" ? "h-10 cursor-pointer" : ""}`}
        />
      )}
      {hint && <p className="mt-0.5 text-right text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

export default function CategoriesTab() {
  const [cats, setCats] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(true);
  const [editCat, setEditCat] = useState<Cat | null>(null);
  const [editSub, setEditSub] = useState<{ sub: Sub; catId: number; catName: string } | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [seoLoading, setSeoLoading] = useState(false);
  const [err, setErr] = useState("");

  const loadCats = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/categories");
      if (r.ok) setCats(await r.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCats(); }, [loadCats]);

  async function generateSeoForCat() {
    if (!editCat || !editCat.name) return;
    setSeoLoading(true);
    try {
      const r = await fetch("/api/admin/categories/generate-seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editCat.name, type: "category" }),
      });
      if (r.ok) {
        const { seo_title, seo_description } = await r.json();
        setEditCat((c) => c && { ...c, seo_title, seo_description });
      }
    } finally {
      setSeoLoading(false);
    }
  }

  async function generateSeoForSub() {
    if (!editSub || !editSub.sub.name) return;
    setSeoLoading(true);
    try {
      const r = await fetch("/api/admin/categories/generate-seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editSub.sub.name, type: "subcategory", parentName: editSub.catName }),
      });
      if (r.ok) {
        const { seo_title, seo_description } = await r.json();
        setEditSub((s) => s && { ...s, sub: { ...s.sub, seo_title, seo_description } });
      }
    } finally {
      setSeoLoading(false);
    }
  }

  async function saveCat() {
    if (!editCat) return;
    setSaving(true); setErr("");
    const isNew = editCat.id === 0;
    const url = isNew ? "/api/admin/categories" : `/api/admin/categories/${editCat.id}`;
    try {
      const r = await fetch(url, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editCat),
      });
      if (r.ok) { setEditCat(null); loadCats(); }
      else { const d = await r.json(); setErr(d.error ?? "Помилка збереження"); }
    } finally {
      setSaving(false);
    }
  }

  async function deleteCat(id: number, name: string) {
    if (!confirm(`Видалити категорію «${name}» та всі її підкатегорії?`)) return;
    await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    loadCats();
  }

  async function saveSub() {
    if (!editSub) return;
    setSaving(true); setErr("");
    const isNew = editSub.sub.id === 0;
    const url = isNew
      ? `/api/admin/categories/${editSub.catId}/subcategories`
      : `/api/admin/subcategories/${editSub.sub.id}`;
    const savedCatId = editSub.catId;
    try {
      const r = await fetch(url, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editSub.sub),
      });
      if (r.ok) { setEditSub(null); setExpandedId(savedCatId); loadCats(); }
      else { const d = await r.json(); setErr(d.error ?? "Помилка збереження"); }
    } finally {
      setSaving(false);
    }
  }

  async function deleteSub(id: number, name: string) {
    if (!confirm(`Видалити підкатегорію «${name}»?`)) return;
    await fetch(`/api/admin/subcategories/${id}`, { method: "DELETE" });
    loadCats();
  }

  // ── Edit category form ──────────────────────────────────────────────────
  if (editCat) {
    const isNew = editCat.id === 0;
    return (
      <div className="max-w-2xl">
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => { setEditCat(null); setErr(""); }}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
          >
            ← Назад
          </button>
          <h2 className="text-xl font-bold text-gray-900">
            {isNew ? "Нова категорія" : `Редагувати: ${editCat.name}`}
          </h2>
        </div>

        {err && <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{err}</p>}

        {/* Preview */}
        <div
          className="mb-6 flex items-center gap-4 rounded-2xl p-5"
          style={{ background: `linear-gradient(135deg, ${editCat.color_from}, ${editCat.color_to})` }}
        >
          <span className="text-4xl">{editCat.icon || "📦"}</span>
          <div>
            <p className="font-bold text-white text-lg">{editCat.name || "Назва категорії"}</p>
            <p className="text-white/70 text-sm">{editCat.subcategories.length} підкатегорій</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Slug (URL)" value={editCat.slug} onChange={(v) => setEditCat({ ...editCat, slug: v })} />
            <Field label="Назва" value={editCat.name} onChange={(v) => setEditCat({ ...editCat, name: v })} />
          </div>

          <div className="grid grid-cols-4 gap-4">
            <Field label="Іконка (emoji)" value={editCat.icon} onChange={(v) => setEditCat({ ...editCat, icon: v })} />
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Колір від</label>
              <div className="flex gap-1">
                <input type="color" value={editCat.color_from}
                  onChange={(e) => setEditCat({ ...editCat, color_from: e.target.value })}
                  className="h-10 w-12 cursor-pointer rounded border border-gray-200" />
                <input type="text" value={editCat.color_from}
                  onChange={(e) => setEditCat({ ...editCat, color_from: e.target.value })}
                  className="flex-1 rounded-lg border border-gray-200 px-2 py-1 text-xs focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Колір до</label>
              <div className="flex gap-1">
                <input type="color" value={editCat.color_to}
                  onChange={(e) => setEditCat({ ...editCat, color_to: e.target.value })}
                  className="h-10 w-12 cursor-pointer rounded border border-gray-200" />
                <input type="text" value={editCat.color_to}
                  onChange={(e) => setEditCat({ ...editCat, color_to: e.target.value })}
                  className="flex-1 rounded-lg border border-gray-200 px-2 py-1 text-xs focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Фон (світлий)</label>
              <div className="flex gap-1">
                <input type="color" value={editCat.bg_light}
                  onChange={(e) => setEditCat({ ...editCat, bg_light: e.target.value })}
                  className="h-10 w-12 cursor-pointer rounded border border-gray-200" />
                <input type="text" value={editCat.bg_light}
                  onChange={(e) => setEditCat({ ...editCat, bg_light: e.target.value })}
                  className="flex-1 rounded-lg border border-gray-200 px-2 py-1 text-xs focus:outline-none" />
              </div>
            </div>
          </div>

          <Field label="Порядок сортування" value={String(editCat.sort_order)}
            onChange={(v) => setEditCat({ ...editCat, sort_order: Number(v) || 0 })} type="number" />

          {/* Description */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Опис категорії (HTML)</label>
            <HtmlEditor
              value={editCat.description ?? ""}
              onChange={(v) => setEditCat({ ...editCat, description: v || null })}
            />
          </div>

          {/* SEO */}
          <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-indigo-800">SEO налаштування</p>
              <button
                onClick={generateSeoForCat}
                disabled={seoLoading || !editCat.name}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {seoLoading ? "Генерація..." : "✨ Генерувати SEO"}
              </button>
            </div>
            <div className="space-y-3">
              <Field
                label="SEO title"
                value={editCat.seo_title ?? ""}
                onChange={(v) => setEditCat({ ...editCat, seo_title: v || null })}
                hint={`${(editCat.seo_title ?? "").length}/60`}
              />
              <Field
                label="SEO description"
                value={editCat.seo_description ?? ""}
                onChange={(v) => setEditCat({ ...editCat, seo_description: v || null })}
                rows={2}
                hint={`${(editCat.seo_description ?? "").length}/160`}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={saveCat}
              disabled={saving || !editCat.slug || !editCat.name}
              className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? "Збереження..." : "Зберегти"}
            </button>
            <button
              onClick={() => { setEditCat(null); setErr(""); }}
              className="rounded-xl border border-gray-200 px-6 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
            >
              Скасувати
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Edit subcategory form ───────────────────────────────────────────────
  if (editSub) {
    const isNew = editSub.sub.id === 0;
    return (
      <div className="max-w-xl">
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => { setEditSub(null); setErr(""); }}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
          >
            ← Назад
          </button>
          <h2 className="text-xl font-bold text-gray-900">
            {isNew ? "Нова підкатегорія" : `Редагувати: ${editSub.sub.name}`}
          </h2>
        </div>
        <p className="mb-4 text-sm text-gray-500">Категорія: <strong>{editSub.catName}</strong></p>

        {err && <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{err}</p>}

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Slug (URL)" value={editSub.sub.slug}
              onChange={(v) => setEditSub({ ...editSub, sub: { ...editSub.sub, slug: v } })} />
            <Field label="Назва" value={editSub.sub.name}
              onChange={(v) => setEditSub({ ...editSub, sub: { ...editSub.sub, name: v } })} />
          </div>
          <Field label="Іконка (emoji)" value={editSub.sub.icon}
            onChange={(v) => setEditSub({ ...editSub, sub: { ...editSub.sub, icon: v } })} />
          <Field label="Порядок сортування" value={String(editSub.sub.sort_order)}
            onChange={(v) => setEditSub({ ...editSub, sub: { ...editSub.sub, sort_order: Number(v) || 0 } })}
            type="number" />

          {/* Description */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Опис підкатегорії (HTML)</label>
            <HtmlEditor
              value={editSub.sub.description ?? ""}
              onChange={(v) => setEditSub({ ...editSub, sub: { ...editSub.sub, description: v || null } })}
            />
          </div>

          {/* SEO */}
          <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-indigo-800">SEO налаштування</p>
              <button
                onClick={generateSeoForSub}
                disabled={seoLoading || !editSub.sub.name}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {seoLoading ? "Генерація..." : "✨ Генерувати SEO"}
              </button>
            </div>
            <div className="space-y-3">
              <Field
                label="SEO title"
                value={editSub.sub.seo_title ?? ""}
                onChange={(v) => setEditSub({ ...editSub, sub: { ...editSub.sub, seo_title: v || null } })}
                hint={`${(editSub.sub.seo_title ?? "").length}/60`}
              />
              <Field
                label="SEO description"
                value={editSub.sub.seo_description ?? ""}
                onChange={(v) => setEditSub({ ...editSub, sub: { ...editSub.sub, seo_description: v || null } })}
                rows={2}
                hint={`${(editSub.sub.seo_description ?? "").length}/160`}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={saveSub}
              disabled={saving || !editSub.sub.slug || !editSub.sub.name}
              className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? "Збереження..." : "Зберегти"}
            </button>
            <button
              onClick={() => { setEditSub(null); setErr(""); }}
              className="rounded-xl border border-gray-200 px-6 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
            >
              Скасувати
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── List view ───────────────────────────────────────────────────────────
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Категорії</h2>
          <p className="mt-1 text-sm text-gray-500">
            {cats.length} категорій, {cats.reduce((s, c) => s + c.subcategories.length, 0)} підкатегорій
          </p>
        </div>
        <button
          onClick={() => {
            setEditCat({ ...EMPTY_CAT, sort_order: cats.length + 1 });
            setErr("");
          }}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          + Нова категорія
        </button>
      </div>

      {loading ? (
        <p className="py-8 text-center text-gray-400">Завантаження...</p>
      ) : (
        <div className="space-y-2">
          {cats.map((cat) => (
            <div key={cat.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              {/* Category row */}
              <div className="flex items-center gap-3 px-4 py-3">
                {/* Color strip */}
                <div
                  className="h-8 w-1.5 flex-shrink-0 rounded-full"
                  style={{ background: `linear-gradient(to bottom, ${cat.color_from}, ${cat.color_to})` }}
                />
                <span className="text-xl">{cat.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 truncate">{cat.name}</p>
                  <p className="text-xs text-gray-400">{cat.slug} · {cat.subcategories.length} підкатегорій</p>
                </div>

                {/* indicators */}
                {cat.description && (
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">Опис ✓</span>
                )}
                {cat.seo_title && (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">SEO ✓</span>
                )}

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setExpandedId(expandedId === cat.id ? null : cat.id)}
                    className="rounded-lg px-2 py-1.5 text-xs text-gray-500 hover:bg-gray-100"
                    title="Показати підкатегорії"
                  >
                    {expandedId === cat.id ? "▲" : "▼"} підкат.
                  </button>
                  <button
                    onClick={() => {
                      setEditSub({ sub: { ...EMPTY_SUB, category_id: cat.id, sort_order: cat.subcategories.length + 1 }, catId: cat.id, catName: cat.name });
                      setErr("");
                    }}
                    className="rounded-lg px-2 py-1.5 text-xs text-indigo-600 hover:bg-indigo-50"
                    title="Додати підкатегорію"
                  >
                    + Підкат.
                  </button>
                  <button
                    onClick={() => { setEditCat(cat); setErr(""); }}
                    className="rounded-lg px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-100"
                  >
                    ✏️ Редагувати
                  </button>
                  <button
                    onClick={() => deleteCat(cat.id, cat.name)}
                    className="rounded-lg px-2 py-1.5 text-xs text-red-500 hover:bg-red-50"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* Subcategories */}
              {expandedId === cat.id && (
                <div className="border-t border-gray-100 px-4 py-3" style={{ backgroundColor: cat.bg_light }}>
                  <div className="space-y-1">
                    {cat.subcategories.map((sub) => (
                      <div key={sub.id} className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 shadow-sm">
                        <span>{sub.icon}</span>
                        <span className="flex-1 text-sm text-gray-700">{sub.name}</span>
                        <span className="text-xs text-gray-400">{sub.slug}</span>
                        {sub.seo_title && (
                          <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-xs text-green-700">SEO</span>
                        )}
                        <button
                          onClick={() => { setEditSub({ sub, catId: cat.id, catName: cat.name }); setErr(""); }}
                          className="rounded px-1.5 py-0.5 text-xs text-gray-500 hover:bg-gray-100"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => deleteSub(sub.id, sub.name)}
                          className="rounded px-1.5 py-0.5 text-xs text-red-400 hover:bg-red-50"
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      setEditSub({ sub: { ...EMPTY_SUB, category_id: cat.id, sort_order: cat.subcategories.length + 1 }, catId: cat.id, catName: cat.name });
                      setErr("");
                    }}
                    className="mt-2 flex items-center gap-1 rounded-lg border border-dashed border-gray-300 px-3 py-1.5 text-xs text-gray-500 hover:border-indigo-400 hover:text-indigo-600"
                  >
                    + Додати підкатегорію
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
