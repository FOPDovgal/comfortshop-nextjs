"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { CATEGORIES, type Category } from "@/lib/categories";

export default function CategoryNav() {
  const [active, setActive] = useState<Category | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  // Close desktop dropdown on click outside
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setActive(null);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setActive(null);
    }
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  // Lock body scroll when mobile overlay is open
  useEffect(() => {
    document.body.style.overflow = active ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [active]);

  function toggle(cat: Category) {
    setActive((prev) => (prev?.slug === cat.slug ? null : cat));
  }

  function close() {
    setActive(null);
  }

  return (
    <div ref={navRef} className="relative z-40 bg-white border-b border-gray-100 shadow-sm">

      {/* ── Category buttons (both mobile & desktop) ── */}
      <div className="flex flex-wrap items-center justify-center gap-2 px-4 py-2">
        {CATEGORIES.map((cat) => {
          const isActive = active?.slug === cat.slug;
          return (
            <button
              key={cat.slug}
              onClick={() => toggle(cat)}
              style={isActive
                ? { background: `linear-gradient(135deg, ${cat.colorFrom}, ${cat.colorTo})` }
                : {}
              }
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                isActive
                  ? "text-white shadow-md scale-[1.03]"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <span className="text-base leading-none">{cat.icon}</span>
              <span>{cat.name}</span>
              <span className={`ml-0.5 text-xs transition-transform duration-200 ${isActive ? "rotate-180" : ""}`}>
                ▾
              </span>
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════
          DESKTOP dropdown (md+)
      ══════════════════════════════════════════ */}
      {active && (
        <div className="hidden md:block absolute left-0 right-0 top-full border-b border-gray-200 bg-white shadow-2xl">
          <div className="flex" style={{ minHeight: "220px", maxHeight: "320px" }}>

            {/* Left — gradient hero */}
            <div
              className="relative flex w-72 flex-shrink-0 flex-col justify-end overflow-hidden p-8"
              style={{ background: `linear-gradient(145deg, ${active.colorFrom} 0%, ${active.colorTo} 100%)` }}
            >
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "radial-gradient(ellipse at 85% 50%, rgba(255,255,255,0.12) 0%, transparent 65%), " +
                    "linear-gradient(to right, transparent 60%, rgba(255,255,255,0.18) 100%)",
                }}
              />
              <div
                className="pointer-events-none absolute inset-0 flex items-center justify-center select-none"
                style={{ fontSize: "9rem", opacity: 0.15 }}
                aria-hidden
              >
                {active.icon}
              </div>
              <div className="relative z-10">
                <p className="mb-2 text-4xl drop-shadow-md">{active.icon}</p>
                <h2 className="text-2xl font-extrabold leading-tight text-white drop-shadow">
                  {active.name}
                </h2>
                <Link
                  href={`/kategoriyi/${active.slug}/`}
                  onClick={close}
                  className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/20 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/30"
                >
                  Переглянути всі →
                </Link>
              </div>
            </div>

            {/* Right — subcategory grid */}
            <div className="flex-1 overflow-y-auto p-5" style={{ backgroundColor: active.bgLight }}>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
                Підкатегорії
              </p>
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-3 xl:grid-cols-4">
                {active.subcategories.map((sub) => (
                  <Link
                    key={sub.slug}
                    href={`/kategoriyi/${active.slug}/${sub.slug}/`}
                    onClick={close}
                    className="group flex items-center gap-3 rounded-xl bg-white px-3 py-3 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
                  >
                    <span
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-xl"
                      style={{ backgroundColor: active.bgLight }}
                    >
                      {sub.icon}
                    </span>
                    {/* ↑ font-size збільшено для зручності читання */}
                    <span className="text-sm font-medium leading-snug text-gray-700 group-hover:text-gray-900">
                      {sub.name}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          MOBILE full-screen overlay (< md)
      ══════════════════════════════════════════ */}
      {active && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col bg-white">

          {/* Top — gradient hero */}
          <div
            className="relative flex flex-shrink-0 flex-col justify-end overflow-hidden px-5 pb-5 pt-12"
            style={{
              background: `linear-gradient(145deg, ${active.colorFrom} 0%, ${active.colorTo} 100%)`,
              minHeight: "150px",
            }}
          >
            {/* Close ✕ */}
            <button
              onClick={close}
              aria-label="Закрити"
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/25 text-white text-lg backdrop-blur-sm"
            >
              ✕
            </button>
            {/* Faint background icon */}
            <div
              className="pointer-events-none absolute inset-0 flex items-center justify-end pr-6 select-none"
              style={{ fontSize: "7rem", opacity: 0.15 }}
              aria-hidden
            >
              {active.icon}
            </div>
            <div className="relative z-10 flex items-end gap-3">
              <span className="text-4xl drop-shadow">{active.icon}</span>
              <div>
                <h2 className="text-xl font-extrabold leading-tight text-white drop-shadow">
                  {active.name}
                </h2>
                <Link
                  href={`/kategoriyi/${active.slug}/`}
                  onClick={close}
                  className="mt-1 inline-flex items-center text-sm text-white/80 hover:text-white"
                >
                  Переглянути всі →
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom — scrollable subcategory list */}
          <div className="flex-1 overflow-y-auto p-4" style={{ backgroundColor: active.bgLight }}>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
              Підкатегорії
            </p>
            <div className="space-y-2 pb-8">
              {active.subcategories.map((sub) => (
                <Link
                  key={sub.slug}
                  href={`/kategoriyi/${active.slug}/${sub.slug}/`}
                  onClick={close}
                  className="flex items-center gap-4 rounded-xl bg-white px-4 py-4 shadow-sm active:bg-gray-50"
                >
                  <span
                    className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-2xl"
                    style={{ backgroundColor: active.bgLight }}
                  >
                    {sub.icon}
                  </span>
                  <span className="text-base font-medium text-gray-800">
                    {sub.name}
                  </span>
                  <span className="ml-auto text-xl text-gray-400">›</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
