"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type Lang = "uk" | "ru" | "en";

const LANG_LABELS: Record<Lang, string> = { uk: "UA", ru: "RU", en: "EN" };
const LANGS: Lang[] = ["uk", "ru", "en"];

function detectLang(pathname: string): Lang {
  const first = pathname.split("/").filter(Boolean)[0];
  if (first === "ru" || first === "en") return first as Lang;
  return "uk";
}

function isArticlePath(pathname: string): boolean {
  const parts = pathname.split("/").filter(Boolean);
  const segIdx = parts.length >= 1 && ["ru", "en"].includes(parts[0]) ? 1 : 0;
  const segment = parts[segIdx];
  const slug = parts[segIdx + 1];
  return !!segment && !!slug && ["oglyady", "top"].includes(segment);
}

export default function HeaderLanguageSwitcher() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [alts, setAlts] = useState<Partial<Record<Lang, string>>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setAlts({});
    if (!isArticlePath(pathname)) return;
    fetch(`/api/lang-alts?pathname=${encodeURIComponent(pathname)}`)
      .then((r) => (r.ok ? r.json() : {}))
      .then((data: Partial<Record<Lang, string>>) => setAlts(data))
      .catch(() => {});
  }, [pathname]);

  if (!mounted || !isArticlePath(pathname)) return null;

  const currentLang = detectLang(pathname);

  return (
    <div
      className="flex items-center gap-0.5"
      aria-label="Вибір мови"
      role="navigation"
    >
      {LANGS.map((lang) => {
        const url = alts[lang];
        const isCurrent = lang === currentLang;

        if (isCurrent) {
          return (
            <span
              key={lang}
              aria-current="true"
              className="rounded px-2 py-0.5 text-xs font-bold text-white bg-indigo-600"
            >
              {LANG_LABELS[lang]}
            </span>
          );
        }

        if (!url) {
          return (
            <span
              key={lang}
              aria-disabled="true"
              title="Переклад недоступний"
              className="rounded px-2 py-0.5 text-xs font-medium text-gray-300 cursor-not-allowed select-none"
            >
              {LANG_LABELS[lang]}
            </span>
          );
        }

        return (
          <Link
            key={lang}
            href={url}
            className="rounded px-2 py-0.5 text-xs font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            {LANG_LABELS[lang]}
          </Link>
        );
      })}
    </div>
  );
}
