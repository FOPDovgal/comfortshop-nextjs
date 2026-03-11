"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type Lang = "uk" | "ru" | "en";
type PageType = "article" | "listing" | "category" | "unknown";

const LANG_LABELS: Record<Lang, string> = { uk: "UA", ru: "RU", en: "EN" };
const LANGS: Lang[] = ["uk", "ru", "en"];

// Which langs have listing pages at (lang)/oglyady and (lang)/top
// Add "ru" / "en" here when those listing routes are created
const LISTING_ROUTE_LANGS: Lang[] = ["uk"];

// Which langs have category pages at (lang)/kategoriyi/...
// Add "ru" / "en" here when those routes are created
const CATEGORY_ROUTE_LANGS: Lang[] = ["uk"];

function getPageInfo(pathname: string): { type: PageType; lang: Lang; basePath: string } {
  const parts = pathname.split("/").filter(Boolean);
  const hasLangPrefix = parts.length > 0 && ["ru", "en"].includes(parts[0]);
  const lang: Lang = hasLangPrefix ? (parts[0] as Lang) : "uk";
  const segIdx = hasLangPrefix ? 1 : 0;
  const seg0 = parts[segIdx] ?? "";
  const seg1 = parts[segIdx + 1];
  const seg2 = parts[segIdx + 2];

  if (["oglyady", "top"].includes(seg0)) {
    if (seg1) return { type: "article", lang, basePath: pathname };
    return { type: "listing", lang, basePath: `/${seg0}` };
  }

  if (seg0 === "kategoriyi" && seg1) {
    const catBase = seg2
      ? `/${seg0}/${seg1}/${seg2}`
      : `/${seg0}/${seg1}`;
    return { type: "category", lang, basePath: catBase };
  }

  return { type: "unknown", lang, basePath: pathname };
}

function getStaticAlts(
  type: "listing" | "category",
  basePath: string
): Partial<Record<Lang, string | null>> {
  const routeLangs = type === "listing" ? LISTING_ROUTE_LANGS : CATEGORY_ROUTE_LANGS;
  const result: Partial<Record<Lang, string | null>> = {};
  for (const lang of LANGS) {
    const url = lang === "uk" ? basePath : `/${lang}${basePath}`;
    result[lang] = routeLangs.includes(lang) ? url : null;
  }
  return result;
}

export default function HeaderLanguageSwitcher() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [apiAlts, setApiAlts] = useState<Partial<Record<Lang, string>>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const info = getPageInfo(pathname);
    if (info.type !== "article") {
      setApiAlts({});
      return;
    }
    fetch(`/api/lang-alts?pathname=${encodeURIComponent(pathname)}`)
      .then((r) => (r.ok ? r.json() : {}))
      .then((data: Partial<Record<Lang, string>>) => setApiAlts(data))
      .catch(() => {});
  }, [pathname]);

  const pageInfo = getPageInfo(pathname);

  if (!mounted || pageInfo.type === "unknown") return null;

  const currentLang = pageInfo.lang;
  const effectiveAlts: Partial<Record<Lang, string | null>> =
    pageInfo.type === "article"
      ? apiAlts
      : getStaticAlts(pageInfo.type, pageInfo.basePath);

  return (
    <div
      className="flex items-center gap-0.5"
      aria-label="Вибір мови"
      role="navigation"
    >
      {LANGS.map((lang) => {
        const url = effectiveAlts[lang];
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
