import Link from "next/link";
import type { Lang } from "@/lib/i18n";

const LANG_LABELS: Record<Lang, string> = {
  uk: "UA",
  ru: "RU",
  en: "EN",
};

const LANGS: Lang[] = ["uk", "ru", "en"];

interface Props {
  alts: Partial<Record<Lang, string>>;
  currentLang: Lang;
}

/**
 * Shows UA / RU / EN pills on article pages.
 * - Current lang: highlighted, not a link.
 * - Available translation: clickable link.
 * - Missing translation: grayed out, not a link.
 * Renders nothing when no other language exists for this article.
 */
export default function LanguageSwitcher({ alts, currentLang }: Props) {
  const hasOtherLang = LANGS.some((l) => l !== currentLang && alts[l]);
  if (!hasOtherLang) return null;

  return (
    <div className="mb-4 flex items-center gap-2">
      <span className="text-xs text-gray-400">Мова:</span>
      <div className="flex items-center gap-1">
        {LANGS.map((lang) => {
          const url = alts[lang];
          const isCurrent = lang === currentLang;

          if (isCurrent) {
            return (
              <span
                key={lang}
                className="rounded-md bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white"
              >
                {LANG_LABELS[lang]}
              </span>
            );
          }

          if (!url) {
            return (
              <span
                key={lang}
                className="cursor-not-allowed rounded-md px-2.5 py-1 text-xs font-medium text-gray-300"
                title="Переклад недоступний"
              >
                {LANG_LABELS[lang]}
              </span>
            );
          }

          return (
            <Link
              key={lang}
              href={url}
              className="rounded-md border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            >
              {LANG_LABELS[lang]}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
