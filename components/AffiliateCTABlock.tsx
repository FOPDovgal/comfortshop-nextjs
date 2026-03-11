import { getCategoryLinks } from "@/lib/affiliate";

type Props = {
  category: string;
  aliUrl?: string; // article-specific AliExpress link; overrides category-level link
  lang?: "uk" | "ru" | "en";
};

const CTA_STRINGS = {
  uk: {
    title: "Де купити",
    subtitle: "Перевірені магазини з доставкою в Україну",
    aliMobile: "Купити на Aliexpress",
    temuMobile: "Купити на TEMU",
    aliDesktop: "Перейти на AliExpress →",
    temuDesktop: "Перейти на Temu →",
    soon: "Скоро",
  },
  ru: {
    title: "Где купить",
    subtitle: "Проверенные магазины с доставкой в Украину",
    aliMobile: "Купить на Aliexpress",
    temuMobile: "Купить на TEMU",
    aliDesktop: "Перейти на AliExpress →",
    temuDesktop: "Перейти на Temu →",
    soon: "Скоро",
  },
  en: {
    title: "Where to buy",
    subtitle: "Verified stores with delivery to Ukraine",
    aliMobile: "Buy on Aliexpress",
    temuMobile: "Buy on TEMU",
    aliDesktop: "Go to AliExpress →",
    temuDesktop: "Go to Temu →",
    soon: "Coming soon",
  },
} as const;

export default async function AffiliateCTABlock({ category, aliUrl, lang = "uk" }: Props) {
  const s = CTA_STRINGS[lang] ?? CTA_STRINGS.uk;
  let links: Awaited<ReturnType<typeof getCategoryLinks>> = [];
  try {
    links = await getCategoryLinks(category);
  } catch {
    // DB unavailable — show placeholder
  }

  // Article-specific link takes priority over category-level link
  const aliLink = aliUrl
    ? { url: aliUrl, platform: "aliexpress" }
    : links.find((l) => l.platform === "aliexpress");
  const temuLink = links.find((l) => l.platform === "temu");

  return (
    <div className="mt-10">
      {/* ── Mobile: 2 compact buttons ── */}
      <div className="flex gap-3 sm:hidden">
        {aliLink ? (
          <a
            href={aliLink.url}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#FF4500" }}
          >
            <span className="text-base leading-none font-black">AE</span>
            {s.aliMobile}
          </a>
        ) : (
          <span className="flex flex-1 cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-gray-200 py-3 text-sm font-semibold text-gray-400">
            <span className="text-base leading-none font-black">AE</span>
            {s.aliMobile}
          </span>
        )}

        {temuLink ? (
          <a
            href={temuLink.url}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#FA5120" }}
          >
            <span className="text-base leading-none font-black">T</span>
            {s.temuMobile}
          </a>
        ) : (
          <span className="flex flex-1 cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-gray-200 py-3 text-sm font-semibold text-gray-400">
            <span className="text-base leading-none font-black">T</span>
            {s.temuMobile}
          </span>
        )}
      </div>

      {/* ── Desktop: full "Де купити" block ── */}
      <div className="hidden overflow-hidden rounded-2xl border border-gray-200 sm:block">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
          <p className="font-semibold text-gray-900">{s.title}</p>
          <p className="mt-0.5 text-sm text-gray-500">{s.subtitle}</p>
        </div>

        <div className="grid grid-cols-2 divide-x divide-gray-100">
          {/* AliExpress */}
          <div className="flex flex-col items-center gap-3 p-6 text-center">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl text-lg font-black text-white"
              style={{ backgroundColor: "#FF4500" }}
            >
              AE
            </div>
            <div>
              <p className="font-semibold text-gray-900">AliExpress</p>
              <p className="text-xs text-gray-500">Низькі ціни, доставка від $0</p>
            </div>
            {aliLink ? (
              <a
                href={aliLink.url}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="mt-1 w-full rounded-xl py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#FF4500" }}
              >
                {s.aliDesktop}
              </a>
            ) : (
              <span className="mt-1 w-full cursor-not-allowed rounded-xl bg-gray-200 py-3 text-center text-sm font-semibold text-gray-400">
                {s.soon}
              </span>
            )}
          </div>

          {/* Temu */}
          <div className="flex flex-col items-center gap-3 p-6 text-center">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl text-lg font-black text-white"
              style={{ backgroundColor: "#FA5120" }}
            >
              T
            </div>
            <div>
              <p className="font-semibold text-gray-900">Temu</p>
              <p className="text-xs text-gray-500">Вигідні ціни, купони</p>
            </div>
            {temuLink ? (
              <a
                href={temuLink.url}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="mt-1 w-full rounded-xl py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#FA5120" }}
              >
                {s.temuDesktop}
              </a>
            ) : (
              <span className="mt-1 w-full cursor-not-allowed rounded-xl bg-gray-200 py-3 text-center text-sm font-semibold text-gray-400">
                {s.soon}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
