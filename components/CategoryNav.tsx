"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { CATEGORIES, type Category } from "@/lib/categories";

export default function CategoryNav() {
  const [active, setActive] = useState<Category | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

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

  function toggle(cat: Category) {
    setActive((prev) => (prev?.slug === cat.slug ? null : cat));
  }

  return (
    <div ref={navRef} className="relative z-40 bg-white border-b border-gray-100 shadow-sm">
      {/* ── Category pill buttons ── */}
      <div>
        <div className="flex flex-wrap items-center gap-2 px-4 py-2">
          {CATEGORIES.map((cat) => {
            const isActive = active?.slug === cat.slug;
            return (
              <button
                key={cat.slug}
                onClick={() => toggle(cat)}
                style={
                  isActive
                    ? { background: `linear-gradient(135deg, ${cat.colorFrom}, ${cat.colorTo})` }
                    : {}
                }
                className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? "text-white shadow-md scale-[1.03]"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <span className="text-base leading-none">{cat.icon}</span>
                <span>{cat.name}</span>
                <span
                  className={`ml-0.5 text-xs transition-transform duration-200 ${
                    isActive ? "rotate-180" : ""
                  }`}
                >
                  ▾
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Dropdown panel ── */}
      {active && (
        <div className="absolute left-0 right-0 top-full border-b border-gray-200 bg-white shadow-2xl">
          <div className="flex" style={{ minHeight: "220px", maxHeight: "320px" }}>

            {/* Left — hero block */}
            <div
              className="relative flex w-72 flex-shrink-0 flex-col justify-end overflow-hidden p-8"
              style={{
                background: `linear-gradient(145deg, ${active.colorFrom} 0%, ${active.colorTo} 100%)`,
              }}
            >
              {/* Blurred-edge overlay */}
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "radial-gradient(ellipse at 85% 50%, rgba(255,255,255,0.12) 0%, transparent 65%), " +
                    "linear-gradient(to right, transparent 60%, rgba(255,255,255,0.18) 100%)",
                }}
              />
              {/* Large emoji "image" */}
              <div
                className="pointer-events-none absolute inset-0 flex items-center justify-center"
                style={{ fontSize: "9rem", opacity: 0.15, userSelect: "none" }}
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
                  onClick={() => setActive(null)}
                  className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/20 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/30"
                >
                  Переглянути всі →
                </Link>
              </div>
            </div>

            {/* Right — subcategory grid */}
            <div
              className="flex-1 overflow-y-auto p-5"
              style={{ backgroundColor: active.bgLight }}
            >
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
                Підкатегорії
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
                {active.subcategories.map((sub) => (
                  <Link
                    key={sub.slug}
                    href={`/kategoriyi/${active.slug}/${sub.slug}/`}
                    onClick={() => setActive(null)}
                    className="group flex items-center gap-2.5 rounded-xl bg-white px-3 py-2.5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
                  >
                    <span
                      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-xl"
                      style={{ backgroundColor: active.bgLight }}
                    >
                      {sub.icon}
                    </span>
                    <span className="text-xs font-medium leading-snug text-gray-700 group-hover:text-gray-900">
                      {sub.name}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
