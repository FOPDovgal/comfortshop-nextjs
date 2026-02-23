"use client";

import { useState, useEffect } from "react";

interface Slide {
  id: number;
  emoji: string;
  text: string;
  order_num: number;
  active: boolean;
}

const emptyForm = { emoji: "✨", text: "", order_num: 0 };

export default function BannerManager() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/banners");
    if (res.ok) setSlides(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function save() {
    if (!form.text.trim()) return;
    setSaving(true);
    if (editId !== null) {
      await fetch(`/api/admin/banners/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } else {
      await fetch("/api/admin/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }
    setForm(emptyForm);
    setEditId(null);
    setSaving(false);
    await load();
  }

  async function toggleActive(slide: Slide) {
    await fetch(`/api/admin/banners/${slide.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !slide.active }),
    });
    await load();
  }

  async function remove(id: number) {
    if (!confirm("Видалити цей слайд?")) return;
    await fetch(`/api/admin/banners/${id}`, { method: "DELETE" });
    await load();
  }

  function startEdit(slide: Slide) {
    setEditId(slide.id);
    setForm({ emoji: slide.emoji, text: slide.text, order_num: slide.order_num });
  }

  function cancelEdit() {
    setEditId(null);
    setForm(emptyForm);
  }

  return (
    <div className="mt-10">
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Банер на головній сторінці</h2>
      <p className="text-sm text-gray-500 mb-6">
        Слайди з анімованим текстом (typewriter) у hero-секції. Порядок — за полем «Порядок».
      </p>

      {/* Form */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 mb-8">
        <h3 className="font-semibold text-gray-800 mb-4">
          {editId !== null ? "✏️ Редагувати слайд" : "➕ Новий слайд"}
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[80px_1fr_80px]">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Емодзі</label>
            <input
              type="text"
              value={form.emoji}
              onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-center text-2xl focus:outline-none focus:ring-2 focus:ring-indigo-400"
              maxLength={10}
              placeholder="✨"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Текст слайду</label>
            <textarea
              value={form.text}
              onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
              rows={2}
              maxLength={500}
              placeholder="Введіть текст, який буде анімовано надруковано..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Порядок</label>
            <input
              type="number"
              value={form.order_num}
              onChange={e => setForm(f => ({ ...f, order_num: Number(e.target.value) }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-center focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <button
            onClick={save}
            disabled={saving || !form.text.trim()}
            className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "Збереження…" : editId !== null ? "Зберегти" : "Додати слайд"}
          </button>
          {editId !== null && (
            <button onClick={cancelEdit} className="rounded-lg border border-gray-300 px-5 py-2 text-sm text-gray-600 hover:bg-gray-100">
              Скасувати
            </button>
          )}
        </div>
      </div>

      {/* Slides list */}
      {loading ? (
        <p className="text-sm text-gray-400">Завантаження…</p>
      ) : slides.length === 0 ? (
        <p className="text-sm text-gray-400">Немає слайдів. Додайте перший.</p>
      ) : (
        <div className="space-y-3">
          {slides.map((slide) => (
            <div
              key={slide.id}
              className={`flex items-start gap-4 rounded-xl border p-4 transition-all ${
                slide.active ? "border-indigo-200 bg-white" : "border-gray-200 bg-gray-50 opacity-60"
              }`}
            >
              <span className="text-3xl leading-none pt-0.5">{slide.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${slide.active ? "text-gray-800" : "text-gray-400 line-through"}`}>
                  {slide.text}
                </p>
                <p className="mt-1 text-xs text-gray-400">Порядок: {slide.order_num}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => toggleActive(slide)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    slide.active
                      ? "bg-green-100 text-green-700 hover:bg-green-200"
                      : "bg-gray-200 text-gray-500 hover:bg-gray-300"
                  }`}
                >
                  {slide.active ? "Активний" : "Вимкнений"}
                </button>
                <button
                  onClick={() => startEdit(slide)}
                  className="rounded-lg border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:bg-gray-100"
                >
                  Ред.
                </button>
                <button
                  onClick={() => remove(slide.id)}
                  className="rounded-lg border border-red-200 px-3 py-1 text-xs text-red-500 hover:bg-red-50"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
