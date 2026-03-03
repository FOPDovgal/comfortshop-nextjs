"use client";

import { useState, useEffect, useMemo } from "react";
import type { DBArticle } from "@/lib/articles";
import ArticleEditor from "./ArticleEditor";

export interface ArticleMeta {
  id?: number;
  slug: string;
  title: string;
  type: string;
  category: string;
  date: string;
  status?: string;
  indexing_sent_at?: string | null;
}

const TYPE_LABEL: Record<string, { label: string; color: string }> = {
  guide:  { label: "Огляд",      color: "bg-blue-100 text-blue-700" },
  top:    { label: "Топ-список", color: "bg-orange-100 text-orange-700" },
  review: { label: "Рев'ю",      color: "bg-purple-100 text-purple-700" },
};

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  published: { label: "Опубліковано", color: "bg-green-100 text-green-700" },
  draft:     { label: "Чернетка",     color: "bg-gray-100 text-gray-500" },
};

function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}`;
}

type CatOption = {
  slug: string;
  name: string;
  subcategories: { slug: string; name: string }[];
};

type View = "list" | "editor";

const PAGE_SIZES = [10, 25, 50, 100];

export default function ArticlesTab({ articles: initialArticles }: { articles: ArticleMeta[] }) {
  const [articles, setArticles] = useState<ArticleMeta[]>(initialArticles);
  const [view, setView] = useState<View>("list");
  const [editingArticle, setEditingArticle] = useState<DBArticle | null>(null);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [loadingMdxSlug, setLoadingMdxSlug] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [indexingId, setIndexingId] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  // Filter / pagination state
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterSubcategory, setFilterSubcategory] = useState("");
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);
  const [cats, setCats] = useState<CatOption[]>([]);

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((data: CatOption[]) => { if (Array.isArray(data) && data.length > 0) setCats(data); })
      .catch(() => {});
  }, []);

  // Reset to page 1 whenever filters change
  useEffect(() => { setPage(1); }, [search, filterStatus, filterCategory, filterSubcategory, pageSize]);

  const subcats = useMemo(
    () => cats.find((c) => c.slug === filterCategory)?.subcategories ?? [],
    [cats, filterCategory]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const catObj = cats.find((c) => c.slug === filterCategory);
    const subSlugs = new Set(catObj?.subcategories.map((s) => s.slug) ?? []);

    return articles.filter((a) => {
      if (q && !a.title.toLowerCase().includes(q) && !a.slug.toLowerCase().includes(q)) return false;
      if (filterStatus && (a.status ?? "draft") !== filterStatus) return false;
      if (filterCategory) {
        const articleCats = a.category.split(",").map((s) => s.trim());
        const match = articleCats.includes(filterCategory) || articleCats.some((s) => subSlugs.has(s));
        if (!match) return false;
      }
      if (filterSubcategory) {
        const articleCats = a.category.split(",").map((s) => s.trim());
        if (!articleCats.includes(filterSubcategory)) return false;
      }
      return true;
    });
  }, [articles, search, filterStatus, filterCategory, filterSubcategory, cats]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  function showMsg(text: string) {
    setMessage(text);
    setTimeout(() => setMessage(""), 4000);
  }

  function startNew() {
    setEditingArticle(null);
    setView("editor");
  }

  async function startEditMdx(slug: string, type: string) {
    setLoadingMdxSlug(slug);
    const res = await fetch(`/api/admin/articles/from-mdx?slug=${encodeURIComponent(slug)}&type=${encodeURIComponent(type)}`);
    if (res.ok) {
      const article = await res.json();
      setEditingArticle(article);
      setView("editor");
    }
    setLoadingMdxSlug(null);
  }

  async function startEdit(id: number) {
    setLoadingId(id);
    const res = await fetch(`/api/admin/articles/${id}`);
    if (res.ok) {
      const article = await res.json();
      setEditingArticle(article);
      setView("editor");
    }
    setLoadingId(null);
  }

  async function handleDelete(id: number) {
    if (!confirm("Видалити статтю? Цю дію не можна скасувати.")) return;
    setDeleteId(id);
    const res = await fetch(`/api/admin/articles/${id}`, { method: "DELETE" });
    if (res.ok) {
      setArticles((prev) => prev.filter((a) => a.id !== id));
      showMsg("Статтю видалено");
    }
    setDeleteId(null);
  }

  async function handleIndex(id: number) {
    setIndexingId(id);
    const res = await fetch(`/api/admin/articles/${id}/index`, { method: "POST" });
    if (res.ok) {
      const data = await res.json() as { sentAt: string };
      setArticles((prev) =>
        prev.map((a) => (a.id === id ? { ...a, indexing_sent_at: data.sentAt } : a))
      );
      showMsg("✓ Відправлено в Google Indexing");
    } else {
      showMsg("⚠ Помилка відправки в Google");
    }
    setIndexingId(null);
  }

  function handleSaved(saved: DBArticle) {
    const meta: ArticleMeta = {
      id: saved.id,
      slug: saved.slug,
      title: saved.title,
      type: saved.type,
      category: saved.category,
      date: saved.date.toString().slice(0, 10),
      status: saved.status,
      indexing_sent_at: saved.indexing_sent_at ?? null,
    };
    setArticles((prev) => {
      const exists = prev.find((a) => a.id === saved.id);
      if (exists) return prev.map((a) => (a.id === saved.id ? meta : a));
      return [meta, ...prev];
    });
    setView("list");
    showMsg(editingArticle ? "Статтю збережено" : "Статтю створено");
  }

  // ── Editor view ──────────────────────────────────────────────────────────────
  if (view === "editor") {
    return (
      <ArticleEditor
        article={editingArticle}
        onSaved={handleSaved}
        onCancel={() => setView("list")}
      />
    );
  }

  // ── List view ────────────────────────────────────────────────────────────────
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Статті</h2>
          <p className="mt-1 text-sm text-gray-500">
            {filtered.length === articles.length
              ? `${articles.length} статей`
              : `${filtered.length} з ${articles.length} статей`}
          </p>
        </div>
        <button
          onClick={startNew}
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          + Нова стаття
        </button>
      </div>

      {message && (
        <div className="mb-4 rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">
          {message}
        </div>
      )}

      {/* ── Filter toolbar ── */}
      <div className="mb-4 flex flex-wrap gap-3">
        {/* Search */}
        <input
          type="search"
          placeholder="Пошук за назвою або slug..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-48 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
        />

        {/* Status filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
        >
          <option value="">Всі статуси</option>
          <option value="published">Опубліковано</option>
          <option value="draft">Чернетки</option>
        </select>

        {/* Category filter */}
        <select
          value={filterCategory}
          onChange={(e) => { setFilterCategory(e.target.value); setFilterSubcategory(""); }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
        >
          <option value="">Всі категорії</option>
          {cats.map((c) => (
            <option key={c.slug} value={c.slug}>{c.name}</option>
          ))}
        </select>

        {/* Subcategory filter (only when category selected) */}
        {filterCategory && subcats.length > 0 && (
          <select
            value={filterSubcategory}
            onChange={(e) => setFilterSubcategory(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
          >
            <option value="">Всі підкатегорії</option>
            {subcats.map((s) => (
              <option key={s.slug} value={s.slug}>{s.name}</option>
            ))}
          </select>
        )}

        {/* Page size */}
        <select
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
        >
          {PAGE_SIZES.map((n) => (
            <option key={n} value={n}>{n} на сторінці</option>
          ))}
        </select>

        {/* Reset filters */}
        {(search || filterStatus || filterCategory || filterSubcategory) && (
          <button
            onClick={() => { setSearch(""); setFilterStatus(""); setFilterCategory(""); setFilterSubcategory(""); }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50"
          >
            ✕ Скинути
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Назва</th>
              <th className="px-4 py-3">Тип</th>
              <th className="px-4 py-3">Категорія</th>
              <th className="px-4 py-3">Статус</th>
              <th className="px-4 py-3">Дата</th>
              <th className="px-4 py-3" title="Google Indexing">G</th>
              <th className="px-4 py-3">Дії</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginated.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  {articles.length === 0 ? "Немає статей. Створіть першу!" : "Нічого не знайдено"}
                </td>
              </tr>
            )}
            {paginated.map((a) => {
              const typeInfo = TYPE_LABEL[a.type] ?? { label: a.type, color: "bg-gray-100 text-gray-600" };
              const statusInfo = STATUS_LABEL[a.status ?? "draft"] ?? STATUS_LABEL.draft;
              const urlPrefix = a.type === "top" ? "/top" : "/oglyady";
              const isPublished = a.status === "published" && !!a.id;
              const sent = a.indexing_sent_at;
              return (
                <tr key={a.slug} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900 max-w-xs">
                    <span className="line-clamp-1">{a.title}</span>
                    <span className="mt-0.5 block font-mono text-xs text-gray-400">{a.slug}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${typeInfo.color}`}>
                      {typeInfo.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{a.category}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {new Date(a.date).toLocaleDateString("uk-UA", { day: "numeric", month: "short", year: "numeric" })}
                  </td>

                  {/* Google Indexing column */}
                  <td className="px-4 py-3">
                    {isPublished ? (
                      <div className="flex flex-col items-start gap-0.5">
                        {sent ? (
                          <span
                            className="text-xs font-medium text-green-600"
                            title={`Відправлено ${new Date(sent).toLocaleString("uk-UA")}`}
                          >
                            ✓ {fmtDate(sent)}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">не надіслано</span>
                        )}
                        <button
                          onClick={() => handleIndex(a.id!)}
                          disabled={indexingId === a.id}
                          title={sent ? "Надіслати повторно" : "Надіслати в Google"}
                          className="rounded px-1.5 py-0.5 text-xs font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-40"
                        >
                          {indexingId === a.id ? "⏳" : "📤"}
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {a.id ? (
                        <button
                          onClick={() => startEdit(a.id!)}
                          disabled={loadingId === a.id}
                          className="rounded bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
                        >
                          {loadingId === a.id ? "..." : "Редагувати"}
                        </button>
                      ) : (
                        <button
                          onClick={() => startEditMdx(a.slug, a.type)}
                          disabled={loadingMdxSlug === a.slug}
                          className="rounded bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
                        >
                          {loadingMdxSlug === a.slug ? "..." : "Редагувати"}
                        </button>
                      )}
                      <a
                        href={`${urlPrefix}/${a.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-100"
                      >
                        ↗
                      </a>
                      {a.id && (
                        <button
                          onClick={() => handleDelete(a.id!)}
                          disabled={deleteId === a.id}
                          className="rounded bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
                        >
                          {deleteId === a.id ? "..." : "✕"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-gray-500">
            Сторінка {safePage} з {totalPages}
            {" · "}статті {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filtered.length)} з {filtered.length}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(1)}
              disabled={safePage === 1}
              className="rounded border border-gray-300 px-3 py-1.5 text-xs hover:bg-gray-50 disabled:opacity-40"
            >
              «
            </button>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="rounded border border-gray-300 px-3 py-1.5 text-xs hover:bg-gray-50 disabled:opacity-40"
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((n) => n === 1 || n === totalPages || Math.abs(n - safePage) <= 2)
              .reduce<(number | "…")[]>((acc, n, i, arr) => {
                if (i > 0 && (arr[i - 1] as number) + 1 < n) acc.push("…");
                acc.push(n);
                return acc;
              }, [])
              .map((n, i) =>
                n === "…" ? (
                  <span key={`ellipsis-${i}`} className="px-2 py-1.5 text-xs text-gray-400">…</span>
                ) : (
                  <button
                    key={n}
                    onClick={() => setPage(n as number)}
                    className={`rounded border px-3 py-1.5 text-xs ${
                      n === safePage
                        ? "border-indigo-500 bg-indigo-50 font-semibold text-indigo-700"
                        : "border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {n}
                  </button>
                )
              )}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="rounded border border-gray-300 px-3 py-1.5 text-xs hover:bg-gray-50 disabled:opacity-40"
            >
              ›
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={safePage === totalPages}
              className="rounded border border-gray-300 px-3 py-1.5 text-xs hover:bg-gray-50 disabled:opacity-40"
            >
              »
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 rounded-xl bg-blue-50 p-4 text-sm text-blue-700">
        <p className="font-semibold">MDX-файли та редагування</p>
        <p className="mt-1 text-blue-600">
          При редагуванні MDX-статті вміст файлу завантажується в редактор. Після збереження
          створюється запис у базі даних, який матиме пріоритет над файлом. MDX-файл у{" "}
          <code className="rounded bg-blue-100 px-1">content/</code> залишається як резервна копія.
        </p>
      </div>
    </div>
  );
}
