"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import CategoryNav from "./CategoryNav";
import { type Category } from "@/lib/categories";

const nav = [
  { label: "Огляди", href: "/oglyady" },
  { label: "Топ-списки", href: "/top" },
  { label: "Категорії", href: "/kategoriyi" },
];

export default function Header() {
  const [active, setActive] = useState<Category | null>(null);
  const pathname = usePathname();

  // Reset submenu when navigating away from category pages
  useEffect(() => {
    if (!pathname.startsWith("/kategoriyi")) {
      setActive(null);
    }
  }, [pathname]);

  return (
    <header className="md:sticky md:top-0 z-50 bg-white shadow-sm">
      {/* Logo + main nav — hidden on mobile when category submenu is open */}
      <div className={`border-b border-gray-200 ${active ? "hidden md:block" : ""}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/images/logo-cropped.jpg"
              alt="ComfortShop"
              width={40}
              height={40}
              className="rounded"
            />
            <span className="text-lg font-bold text-gray-900">ComfortShop</span>
          </Link>
          <nav className="flex gap-6">
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
        </div>
      </div>
      <CategoryNav active={active} onActive={setActive} />
    </header>
  );
}
