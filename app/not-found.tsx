"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { CATEGORIES, type Category } from "@/lib/categories";

// ── Smart slug → category matching ────────────────────────────────────────
// Maps keyword fragments (Ukrainian transliteration + Russian transliteration)
// to category slugs. Covers both old WordPress and new slugs.
const KEYWORD_MAP: Array<[string[], string]> = [
  [["meteo", "stantsiy", "termometr", "hihrometr", "klimat", "povitrya", "zvolozhuvach", "ochysnyk", "temperatura", "pogoda", "weather", "vlazhn", "chisty", "stantsii", "temperatury", "gigrometr"], "klimat-tehnika"],
  [["kuhon", "kukhon", "kyhn", "blyud", "stravy", "prygotov", "multyvark", "blender", "kastrulya", "patelnya", "nozh", "doshk", "elektroprystriy", "elektroprilad"], "kuhonni-gadzhety"],
  [["smart", "rozumnyy", "rozumni", "iot", "avtomatyzatsiya", "goloso", "alexa", "google home", "датчик", "datchy", "sensornyy", "dimmer", "rozetk", "vymykach", "osvitlennya", "light"], "rozumnyy-dim"],
  [["pk", "kompyuter", "noutbuk", "klaviatura", "mysh", "navushny", "vebkamer", "usb", "hub", "port", "ssd", "hdd", "nakopychuvach", "oklodzhen", "kooler", "monitor", "geymer", "streym", "kompyutern", "klavier", "noutbk", "kamera", "headset", "ustroistv"], "aksesuary-dlya-pk"],
  [["sport", "turyzm", "pohid", "namet", "likhtar", "aktyvnyy", "vydzhyvannya", "termokruzhka", "termoprod", "spryadzhen", "rybolov", "polyvann", "nabir", "survival", "camping", "tourizm"], "sport-ta-turyzm"],
  [["zdorovya", "zdorov", "masazher", "masazh", "reabilitatsiya", "son", "monitoring", "davleniy", "davlen", "puls", "glukomet", "tonometr", "termometr", "fitnеs", "spа", "spa", "relaks"], "zdorovya-ta-komfort"],
  [["malyuk", "dityna", "dytyna", "dity", "ditey", "ditej", "ihrashky", "regrash", "rozvyvalni", "bezpeka dyt", "kolyaska", "samokat"], "dlya-ditej"],
  [["kamera", "videonaglyad", "signal", "ohoran", "bezpeka", "camera", "wifi cam", "solar cam", "video dzvin", "videodzvin", "sygnalizat"], "bezpeka"],
  [["energo", "solar", "sonyachni", "panel", "akumulyator", "akb", "batareya", "battery", "led", "osvitlennya", "rozetka", "smart plug", "ekonom"], "energozberezhennya"],
  [["tvaryny", "sobak", "kot", "koty", "zoo", "zviryat", "animali", "nasynnyk", "amunitsiya", "povid", "noshyr", "ihrashka dlya"], "zootovary"],
  [["elektrosamokat", "elektrovelo", "elektro", "samokat", "velosyped", "moped", "elektromobil", "elektromotos", "elektroscoot", "elektrobike", "scooter", "hoverboard"], "elektrotransport"],
  [["komfort", "relaks", "masazh", "aromater", "svichy", "ether", "grylka", "vanna", "antystres", "podushka", "kovdra", "matrats", "podolok"], "komfort-i-relaks"],
  [["domu", "doma", "kvartyra", "dom ", "organajzer", "prybyrannya", "osvitlennya", "tekstyl", "dekor", "shtory", "kilym", "budynok"], "tovary-dlya-domu"],
  [["gadzhety", "gadget", "prylad", "tekhnoloh", "innovative", "ofis", "avto", "mashyn", "powerbank", "zaryadka", "zaryadny"], "suchasni-gadzhety"],
  // Russian transliteration (old WP URLs)
  [["meteostantsii", "termometr", "gigrometr", "vlazhnost", "osvezhitel", "ochystitel", "ochistiteli", "uvlazhnit"], "klimat-tehnika"],
  [["kukhn", "kukhni", "blyud", "prigotor", "multivark", "blender", "kastrul", "skovorod"], "kuhonni-gadzhety"],
  [["mashinka", "strijki", "breevy", "breetv", "triemer", "trimer", "strizhk", "volos"], "zdorovya-ta-komfort"],
  [["komp", "klaviat", "mysh", "naushnik", "usb-ustroi", "ustroist", "gadzhety-dlya-pk"], "aksesuary-dlya-pk"],
  [["sobak", "koshk", "zhivotn", "pitat", "povodok", "osheynik", "igrushk dlya"], "zootovary"],
];

function getSmartSuggestions(pathname: string): Category[] {
  const slug = pathname.toLowerCase().replace(/\//g, "-");
  const scores = new Map<string, number>();

  for (const [keywords, catSlug] of KEYWORD_MAP) {
    for (const kw of keywords) {
      if (slug.includes(kw)) {
        scores.set(catSlug, (scores.get(catSlug) ?? 0) + 1);
      }
    }
  }

  if (scores.size === 0) return [];

  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([s]) => CATEGORIES.find((c) => c.slug === s))
    .filter(Boolean) as Category[];
}

// ── Component ──────────────────────────────────────────────────────────────
export default function NotFound() {
  const pathname = usePathname();
  const suggestions = getSmartSuggestions(pathname ?? "");

  return (
    <div className="min-h-[70vh] py-12">
      {/* Header */}
      <div className="mb-10 text-center">
        <p className="mb-2 text-6xl">🔍</p>
        <h1 className="mb-3 text-3xl font-bold text-gray-900">
          Сторінку не знайдено
        </h1>
        <p className="mx-auto max-w-md text-gray-500">
          Схоже, це посилання вже не працює. Але у нас є багато корисного —
          оберіть категорію нижче або{" "}
          <Link href="/" className="text-indigo-600 hover:underline">
            поверніться на головну
          </Link>
          .
        </p>
      </div>

      {/* Smart suggestions */}
      {suggestions.length > 0 && (
        <div className="mb-10">
          <h2 className="mb-4 text-center text-sm font-semibold uppercase tracking-wide text-gray-400">
            Можливо, вас цікавить
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {suggestions.map((cat) => (
              <Link
                key={cat.slug}
                href={`/kategoriyi/${cat.slug}`}
                className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:border-indigo-300 hover:text-indigo-700 hover:shadow"
                style={{ borderColor: cat.colorFrom + "44" }}
              >
                <span>{cat.icon}</span>
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="mb-8 text-center">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
          Всі категорії
        </h2>
      </div>

      {/* Categories grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.slug}
            href={`/kategoriyi/${cat.slug}`}
            className="group flex flex-col items-center gap-2 rounded-xl border border-gray-100 bg-white p-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
          >
            <span
              className="flex h-12 w-12 items-center justify-center rounded-full text-2xl"
              style={{ background: `linear-gradient(135deg, ${cat.colorFrom}, ${cat.colorTo})` }}
            >
              {cat.icon}
            </span>
            <span className="text-xs font-medium leading-tight text-gray-700 group-hover:text-indigo-700">
              {cat.name}
            </span>
          </Link>
        ))}
      </div>

      {/* Back button */}
      <div className="mt-10 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white shadow transition hover:bg-indigo-700"
        >
          ← На головну
        </Link>
      </div>
    </div>
  );
}
