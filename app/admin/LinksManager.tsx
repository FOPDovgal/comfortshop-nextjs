"use client";

import { useState } from "react";
import type { AffiliateLink } from "@/lib/affiliate";

type Props = { initialLinks: AffiliateLink[] };

const statusBadge: Record<string, string> = {
  ok: "bg-green-100 text-green-700",
  dead: "bg-red-100 text-red-700",
  unchecked: "bg-gray-100 text-gray-600",
};

const statusLabel: Record<string, string> = {
  ok: "✓ Активне",
  dead: "✗ Недійсне",
  unchecked: "? Не перевірено",
};

export default function LinksManager({ initialLinks }: Props) {
  const [links, setLinks] = useState<AffiliateLink[]>(initialLinks);
  const [editId, setEditId] = useState<number | null>(null);
  const [editUrl, setEditUrl] = useState("");
  const [editLabel, setEditLabel] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newForm, setNewForm] = useState({
    category: "",
    platform: "aliexpress" as "aliexpress" | "temu",
    url: "",
    label: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function saveEdit(id: number) {
    setSaving(true);
    const res = await fetch(`/api/admin/links/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: editUrl, label: editLabel }),
    });
    if (res.ok) {
      setLinks(links.map((l) => l.id === id ? { ...l, url: editUrl, label: editLabel, check_status: "unchecked" } : l));
      setEditId(null);
      setMessage("Збережено");
      setTimeout(() => setMessage(""), 3000);
    }
    setSaving(false);
  }

  async function deleteLink(id: number) {
    if (!confirm("Видалити це посилання?")) return;
    const res = await fetch(`/api/admin/links/${id}`, { method: "DELETE" });
    if (res.ok) setLinks(links.filter((l) => l.id !== id));
  }

  async function addLink() {
    setSaving(true);
    const res = await fetch("/api/admin/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newForm),
    });
    if (res.ok) {
      const refreshRes = await fetch("/api/admin/links");
      const refreshed = await refreshRes.json();
      setLinks(refreshed);
      setShowAddForm(false);
      setNewForm({ category: "", platform: "aliexpress", url: "", label: "" });
      setMessage("Посилання додано");
      setTimeout(() => setMessage(""), 3000);
    }
    setSaving(false);
  }

  return (
    <div>
      {message && (
        <div className="mb-4 rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">
          {message}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Категорія</th>
              <th className="px-4 py-3">Платформа</th>
              <th className="px-4 py-3">Назва кнопки</th>
              <th className="px-4 py-3">Посилання</th>
              <th className="px-4 py-3">Статус</th>
              <th className="px-4 py-3">Дії</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {links.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  Немає посилань
                </td>
              </tr>
            )}
            {links.map((link) => (
              <tr key={link.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-gray-600">
                  {link.category}
                </td>
                <td className="px-4 py-3">
                  <span
                    className="rounded px-2 py-0.5 text-xs font-semibold text-white"
                    style={{ backgroundColor: link.platform === "aliexpress" ? "#FF4500" : "#FA5120" }}
                  >
                    {link.platform === "aliexpress" ? "AliExpress" : "Temu"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {editId === link.id ? (
                    <input
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                    />
                  ) : (
                    link.label
                  )}
                </td>
                <td className="px-4 py-3">
                  {editId === link.id ? (
                    <input
                      value={editUrl}
                      onChange={(e) => setEditUrl(e.target.value)}
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm font-mono"
                    />
                  ) : (
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="max-w-xs truncate text-blue-600 hover:underline"
                      title={link.url}
                    >
                      {link.url.length > 40 ? link.url.slice(0, 40) + "…" : link.url}
                    </a>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge[link.check_status]}`}>
                    {statusLabel[link.check_status]}
                  </span>
                  {link.last_checked && (
                    <div className="mt-0.5 text-xs text-gray-400">
                      {new Date(link.last_checked).toLocaleDateString("uk-UA")}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  {editId === link.id ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(link.id)}
                        disabled={saving}
                        className="rounded bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        Зберегти
                      </button>
                      <button
                        onClick={() => setEditId(null)}
                        className="rounded bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-300"
                      >
                        Скасувати
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditId(link.id);
                          setEditUrl(link.url);
                          setEditLabel(link.label);
                        }}
                        className="rounded bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                      >
                        Редагувати
                      </button>
                      <button
                        onClick={() => deleteLink(link.id)}
                        className="rounded bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-100"
                      >
                        Видалити
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add form */}
      <div className="mt-6">
        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
          >
            + Додати посилання
          </button>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="mb-4 font-semibold text-gray-900">Нове посилання</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Категорія (slug)
                </label>
                <input
                  value={newForm.category}
                  onChange={(e) => setNewForm({ ...newForm, category: e.target.value })}
                  placeholder="usb-gadzhety"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Платформа
                </label>
                <select
                  value={newForm.platform}
                  onChange={(e) => setNewForm({ ...newForm, platform: e.target.value as "aliexpress" | "temu" })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="aliexpress">AliExpress</option>
                  <option value="temu">Temu</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Назва кнопки
                </label>
                <input
                  value={newForm.label}
                  onChange={(e) => setNewForm({ ...newForm, label: e.target.value })}
                  placeholder="USB-гаджети на AliExpress"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  URL посилання
                </label>
                <input
                  value={newForm.url}
                  onChange={(e) => setNewForm({ ...newForm, url: e.target.value })}
                  placeholder="https://s.click.aliexpress.com/e/..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono"
                />
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <button
                onClick={addLink}
                disabled={saving || !newForm.category || !newForm.url || !newForm.label}
                className="rounded-lg bg-orange-500 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
              >
                {saving ? "Збереження..." : "Додати"}
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="rounded-lg bg-gray-100 px-5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
              >
                Скасувати
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 rounded-xl bg-blue-50 p-4 text-sm text-blue-700">
        <p className="font-semibold">Автоматична перевірка посилань</p>
        <p className="mt-1 text-blue-600">
          Скрипт <code className="rounded bg-blue-100 px-1">check-links.mjs</code> перевіряє всі посилання щопонеділка о 09:00.
          Якщо посилання недійсне — система автоматично підставляє альтернативне з цієї ж категорії.
        </p>
      </div>
    </div>
  );
}
