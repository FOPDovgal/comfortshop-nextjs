"use client";

import { useState } from "react";
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

type View = "list" | "editor";

export default function ArticlesTab({ articles: initialArticles }: { articles: ArticleMeta[] }) {
  const [articles, setArticles] = useState<ArticleMeta[]>(initialArticles);
  const [view, setView] = useState<View>("list");
  const [editingArticle, setEditingArticle] = useState<DBArticle | null>(null);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [loadingMdxSlug, setLoadingMdxSlug] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [message, setMessage] = useState("");

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

  function handleSaved(saved: DBArticle) {
    const meta: ArticleMeta = {
      id: saved.id,
      slug: saved.slug,
      title: saved.title,
      type: saved.type,
      category: saved.category,
      date: saved.date.toString().slice(0, 10),
      status: saved.status,
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
          <p className="mt-1 text-sm text-gray-500">{articles.length} статей</p>
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

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Назва</th>
              <th className="px-4 py-3">Тип</th>
              <th className="px-4 py-3">Категорія</th>
              <th className="px-4 py-3">Статус</th>
              <th className="px-4 py-3">Дата</th>
              <th className="px-4 py-3">Дії</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {articles.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  Немає статей. Створіть першу!
                </td>
              </tr>
            )}
            {articles.map((a) => {
              const typeInfo = TYPE_LABEL[a.type] ?? { label: a.type, color: "bg-gray-100 text-gray-600" };
              const statusInfo = STATUS_LABEL[a.status ?? "draft"] ?? STATUS_LABEL.draft;
              const urlPrefix = a.type === "top" ? "/top" : "/oglyady";
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
