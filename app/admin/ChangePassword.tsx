"use client";

import { useState } from "react";

export default function ChangePassword() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [status, setStatus] = useState<{ ok?: boolean; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.next !== form.confirm) {
      setStatus({ msg: "Нові паролі не збігаються" });
      return;
    }
    if (form.next.length < 8) {
      setStatus({ msg: "Мінімум 8 символів" });
      return;
    }
    setLoading(true);
    setStatus(null);
    const res = await fetch("/api/admin/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: form.current, newPassword: form.next }),
    });
    const data = await res.json();
    if (res.ok) {
      setStatus({ ok: true, msg: "Пароль змінено. Збережіть його у надійному місці." });
      setForm({ current: "", next: "", confirm: "" });
    } else {
      setStatus({ msg: data.error ?? "Помилка" });
    }
    setLoading(false);
  }

  return (
    <div className="mt-10 rounded-xl border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">Зміна пароля</h3>
          <p className="text-sm text-gray-500">Змініть пароль адміністратора</p>
        </div>
        <button
          onClick={() => { setOpen(!open); setStatus(null); }}
          className="text-sm font-medium text-orange-600 hover:text-orange-700"
        >
          {open ? "Скасувати" : "Змінити пароль"}
        </button>
      </div>

      {open && (
        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3">
          <input
            type="password"
            placeholder="Поточний пароль"
            value={form.current}
            onChange={(e) => setForm({ ...form, current: e.target.value })}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-orange-400 focus:outline-none"
            required
            autoComplete="current-password"
          />
          <input
            type="password"
            placeholder="Новий пароль (мін. 8 символів)"
            value={form.next}
            onChange={(e) => setForm({ ...form, next: e.target.value })}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-orange-400 focus:outline-none"
            required
            autoComplete="new-password"
          />
          <input
            type="password"
            placeholder="Підтвердіть новий пароль"
            value={form.confirm}
            onChange={(e) => setForm({ ...form, confirm: e.target.value })}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-orange-400 focus:outline-none"
            required
            autoComplete="new-password"
          />
          {status && (
            <p className={`text-sm ${status.ok ? "text-green-600" : "text-red-500"}`}>
              {status.msg}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="self-start rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Збереження..." : "Зберегти пароль"}
          </button>
        </form>
      )}
    </div>
  );
}
