"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import CategoryNav from "./CategoryNav";
import { type Category } from "@/lib/categories";
import { logoFont } from "@/lib/fonts";

const nav = [
  { label: "Огляди", href: "/oglyady" },
  { label: "Топ-списки", href: "/top" },
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
        <div className="header-inner mx-auto flex max-w-7xl items-center justify-between px-4 py-2">
          <Link href="/" className="flex items-center gap-3">
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
