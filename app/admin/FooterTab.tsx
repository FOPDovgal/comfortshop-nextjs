"use client";

import { useEffect, useState } from "react";

type SocialFields = {
  social_youtube: string;
  social_tiktok: string;
  social_facebook: string;
  social_instagram: string;
  terms_html: string;
};

const SOCIALS: { key: keyof SocialFields; label: string; placeholder: string; color: string }[] = [
  {
    key: "social_youtube",
    label: "YouTube",
    placeholder: "https://www.youtube.com/@yourChannel",
    color: "#ff0000",
  },
  {
    key: "social_tiktok",
    label: "TikTok",
    placeholder: "https://www.tiktok.com/@yourProfile",
    color: "#010101",
  },
  {
    key: "social_facebook",
    label: "Facebook",
    placeholder: "https://www.facebook.com/yourPage",
    color: "#1877f2",
  },
  {
    key: "social_instagram",
    label: "Instagram",
    placeholder: "https://www.instagram.com/yourProfile",
    color: "#e1306c",
  },
];

const EMPTY: SocialFields = {
  social_youtube: "",
  social_tiktok: "",
  social_facebook: "",
  social_instagram: "",
  terms_html: "",
};

export default function FooterTab() {
  const [fields, setFields] = useState<SocialFields>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    fetch("/api/admin/footer")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) setFields({ ...EMPTY, ...data });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function set(key: keyof SocialFields, value: string) {
    setFields((f) => ({ ...f, [key]: value }));
    setMsg(null);
  }

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const r = await fetch("/api/admin/footer", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      setMsg(r.ok ? { text: "Збережено", ok: true } : { text: "Помилка збереження", ok: false });
    } catch {
      setMsg({ text: "Помилка з'єднання", ok: false });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-400">Завантаження…</p>;
  }

  return (
    <div className="space-y-8 max-w-2xl">

      {/* ── Соціальні мережі ───────────────────────────────────────── */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Соціальні мережі</h2>
        <p className="text-sm text-gray-500 mb-5">
          Іконки з посиланнями відображаються в підвалі сайту. Залиште поле порожнім, щоб приховати іконку.
        </p>
        <div className="space-y-4">
          {SOCIALS.map(({ key, label, placeholder, color }) => (
            <div key={key} className="flex items-center gap-3">
              {/* Color dot */}
              <span
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-white text-xs font-bold shadow-sm"
                style={{ backgroundColor: color }}
              >
                {label[0]}
              </span>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                  {label}
                </label>
                <input
                  type="url"
                  value={fields[key]}
                  onChange={(e) => set(key, e.target.value)}
                  placeholder={placeholder}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-300"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Умови використання ─────────────────────────────────────── */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Умови використання</h2>
        <p className="text-sm text-gray-500 mb-3">
          HTML-текст сторінки <a href="/umovy-vykorystannya" target="_blank" className="text-indigo-500 underline">/umovy-vykorystannya</a>.
        </p>
        <textarea
          value={fields.terms_html}
          onChange={(e) => set("terms_html", e.target.value)}
          rows={10}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-300"
          placeholder="<p>Вставте HTML-текст умов використання…</p>"
        />
      </section>

      {/* ── Save button ────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60 transition-colors"
        >
          {saving ? "Збереження…" : "Зберегти"}
        </button>
        {msg && (
          <span className={`text-sm font-medium ${msg.ok ? "text-green-600" : "text-red-600"}`}>
            {msg.ok ? "✓ " : "✗ "}{msg.text}
          </span>
        )}
      </div>
    </div>
  );
}
