"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef, type FormEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import CategoryNav from "./CategoryNav";
import { type Category } from "@/lib/categories";
import { logoFont } from "@/lib/fonts";

const nav = [
  { label: "Огляди", href: "/oglyady" },
  { label: "Топ-списки", href: "/top" },
];

export default function Header() {
  const [active, setActive] = useState<Category | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const pathname = usePathname();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!pathname.startsWith("/kategoriyi")) setActive(null);
  }, [pathname]);

  // Close search on route change
  useEffect(() => {
    setSearchOpen(false);
    setQuery("");
  }, [pathname]);

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <header className="z-50 bg-white shadow-sm">
      <div className={`border-b border-gray-200 ${active ? "hidden md:block" : ""}`}>
        <div className="header-inner mx-auto flex max-w-7xl items-center justify-between px-4 py-2">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <Image
              src="/images/logo-cropped.jpg"
              alt="ComfortShop"
              width={80}
              height={80}
              className="rounded-xl"
            />
            <span
              className={`${logoFont.className} text-2xl`}
              style={{
                background: "linear-gradient(135deg, #059669 0%, #6366f1 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              ComfortShop
            </span>
          </Link>

          {/* Right side: nav + search */}
          <div className="flex items-center gap-4">
            <nav className="hidden sm:flex gap-6">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Search */}
            <div className="flex items-center">
              {searchOpen ? (
                <form onSubmit={handleSearch} className="flex items-center gap-1">
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Пошук статей..."
                    className="w-44 sm:w-56 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-orange-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-orange-600"
                  >
                    →
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSearchOpen(false); setQuery(""); }}
                    className="ml-1 text-gray-400 hover:text-gray-600"
                    aria-label="Закрити пошук"
                  >
                    ✕
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-500 hover:border-orange-400 hover:text-orange-600 transition-colors"
                  aria-label="Пошук"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                  </svg>
                  <span className="hidden sm:inline">Пошук</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <CategoryNav active={active} onActive={setActive} />
    </header>
  );
}
