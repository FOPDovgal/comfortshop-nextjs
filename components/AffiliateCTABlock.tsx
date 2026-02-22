import { getCategoryLinks } from "@/lib/affiliate";

type Props = {
  category: string;
};

export default async function AffiliateCTABlock({ category }: Props) {
  let links: Awaited<ReturnType<typeof getCategoryLinks>> = [];
  try {
    links = await getCategoryLinks(category);
  } catch {
    // DB unavailable — show placeholder
  }

  const aliLink = links.find((l) => l.platform === "aliexpress");
  const temuLink = links.find((l) => l.platform === "temu");

  return (
    <div className="mt-10 overflow-hidden rounded-2xl border border-gray-200">
      <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
        <p className="font-semibold text-gray-900">Де купити</p>
        <p className="mt-0.5 text-sm text-gray-500">
          Перевірені магазини з доставкою в Україну
        </p>
      </div>

      <div className="grid grid-cols-1 divide-y divide-gray-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
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
              Перейти на AliExpress →
            </a>
          ) : (
            <span className="mt-1 w-full cursor-not-allowed rounded-xl bg-gray-200 py-3 text-center text-sm font-semibold text-gray-400">
              Скоро
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
              Перейти на Temu →
            </a>
          ) : (
            <span className="mt-1 w-full cursor-not-allowed rounded-xl bg-gray-200 py-3 text-center text-sm font-semibold text-gray-400">
              Скоро
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
