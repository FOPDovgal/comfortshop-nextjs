// Discover / Topic page configuration for Phase 3
// Pure TypeScript config — no DB calls, no async, no imports.
// Sources reference slugs verified against lib/categories.ts CATEGORIES array.
// To add more pages: append to DISCOVER_PAGES and re-deploy (no DB migration needed).

export type DiscoverSource = {
  // category slugs → getAllArticlesForCategory(slug) per entry
  categories?: string[];
  // subcategory pairs → getAllArticlesForSubcategory(cat, sub) per entry
  subcategories?: { cat: string; sub: string }[];
};

export type DiscoverPageConfig = {
  slug: string;
  title: string;         // H1 text
  seo_title: string;     // ≤60 chars — used in <title> and og:title
  seo_description: string; // ≤160 chars — used in <meta description> and og:description
  lead?: string;         // optional editorial paragraph shown above featured article

  sources: DiscoverSource; // which existing category/subcategory data to aggregate

  parent_category?: string;   // category slug — used for back-link and breadcrumb
  related_discover?: string[]; // slugs of sibling discover pages — shown at bottom

  status: "published" | "draft"; // draft → robots: noindex, page still renders
  min_articles?: number;          // default 1 — notFound() rendered if fewer articles found
};

export const DISCOVER_PAGES: DiscoverPageConfig[] = [
  // ── USB gadgets ────────────────────────────────────────────────────────────
  {
    slug: "usb-gadzhety-dlya-domu",
    title: "USB гаджети для дому",
    seo_title: "USB гаджети для дому — огляди та підбірки",
    seo_description:
      "Кращі USB гаджети для дому та офісу: хаби, зарядки та інші корисні пристрої. Чесні огляди та рейтинги.",
    lead: "Зібрали найкорисніші USB-пристрої для дому та робочого столу. Актуальні огляди та підбірки регулярно оновлюються.",
    sources: {
      // "suchasni-gadzhety" has subcats: dlya-ofisu, dlya-domu, dlya-avto, powerbanky-ta-zhyvlennya
      // "aksesuary-dlya-pk" has subcat: usb-khabu-ta-dokstantsiyi
      categories: ["suchasni-gadzhety", "aksesuary-dlya-pk"],
      subcategories: [
        { cat: "aksesuary-dlya-pk", sub: "usb-khabu-ta-dokstantsiyi" },
      ],
    },
    parent_category: "suchasni-gadzhety",
    related_discover: [
      "aksesuary-dlya-robochoho-mistsia",
      "rozumnyy-dim-gadzhety",
    ],
    status: "published",
    min_articles: 1,
  },

  // ── Home organizers ────────────────────────────────────────────────────────
  {
    slug: "organizery-dlya-domu",
    title: "Організери для дому",
    seo_title: "Організери для дому — огляди та підбірки",
    seo_description:
      "Кращі організери та системи зберігання для дому: полиці, ящики, кошики. Огляди та рейтинги корисних товарів.",
    lead: "Підібрали найкращі організери та системи зберігання для дому. Матеріали регулярно доповнюються.",
    sources: {
      // "tovary-dlya-domu" subcat "organajzery" — note: slug is organajzery, not organizery
      categories: ["tovary-dlya-domu"],
      subcategories: [
        { cat: "tovary-dlya-domu", sub: "organajzery" },
      ],
    },
    parent_category: "tovary-dlya-domu",
    related_discover: [
      "kuhonni-gadzhety-dlya-domu",
    ],
    status: "published",
    min_articles: 1,
  },

  // ── Travel gadgets ─────────────────────────────────────────────────────────
  {
    slug: "turystychni-gadzhety-dlya-podorozhey",
    title: "Туристичні гаджети для подорожей",
    seo_title: "Туристичні гаджети для подорожей — підбірки",
    seo_description:
      "Корисні гаджети та спорядження для туризму і подорожей: ліхтарі, намети, термосні набори. Огляди та рейтинги.",
    lead: "Зібрали найкорисніші гаджети та спорядження для туризму і активного відпочинку.",
    sources: {
      // "sport-ta-turyzm" subcats: namety, likhtari, gotuvannya, termoproduktsiya, nabory-vyzhyvannya, sportyvne-sporyadzhennya
      categories: ["sport-ta-turyzm"],
    },
    parent_category: "sport-ta-turyzm",
    related_discover: ["energozberezhennya-vdoma"],
    status: "published",
    min_articles: 1,
  },

  // ── Kitchen gadgets ────────────────────────────────────────────────────────
  {
    slug: "kuhonni-gadzhety-dlya-domu",
    title: "Кухонні гаджети для дому",
    seo_title: "Кухонні гаджети для дому — огляди та підбірки",
    seo_description:
      "Кращі кухонні гаджети та прилади: електроприлади, ваги та органайзери для кухні. Чесні огляди та рейтинги.",
    lead: "Зібрали найкорисніші гаджети та прилади для кухні. Від електроприладів до зручних систем зберігання.",
    sources: {
      // "kuhonni-gadzhety" subcats: elektroprystroyi, pryladdya-ta-aksesuary, vymiryuvannya, zberihannya
      categories: ["kuhonni-gadzhety"],
    },
    parent_category: "kuhonni-gadzhety",
    related_discover: ["organizery-dlya-domu"],
    status: "published",
    min_articles: 1,
  },

  // ── Smart home ────────────────────────────────────────────────────────────
  {
    slug: "rozumnyy-dim-gadzhety",
    title: "Гаджети для розумного дому",
    seo_title: "Гаджети для розумного дому — огляди та підбірки",
    seo_description:
      "Розумне освітлення, розетки, датчики та голосові помічники для дому. Огляди пристроїв для автоматизації.",
    lead: "Підібрали найкращі пристрої для автоматизації дому: від розумних лампочок до голосових помічників.",
    sources: {
      // "rozumnyy-dim" subcats: rozumne-osvitlennya, rozumni-rozetky-ta-vymikachi, golosovi-pomichniky-ta-khabu,
      //   rozumna-bezpeka, rozumna-klimatyzatsiya, datchyky-ta-avtomatyzatsiya, roboty-prybyralnyky
      categories: ["rozumnyy-dim"],
    },
    parent_category: "rozumnyy-dim",
    related_discover: ["usb-gadzhety-dlya-domu", "klimat-tehnika-dlya-domu"],
    status: "published",
    min_articles: 1,
  },

  // ── Climate tech ──────────────────────────────────────────────────────────
  {
    slug: "klimat-tehnika-dlya-domu",
    title: "Кліматехніка для дому",
    seo_title: "Кліматехніка для дому — огляди та рейтинги",
    seo_description:
      "Зволожувачі, очищувачі повітря, метеостанції та термометри для дому. Огляди та рейтинги кращих моделей.",
    lead: "Зібрали найкращі прилади для контролю мікроклімату вдома: зволожувачі, очищувачі та метеостанції.",
    sources: {
      // "klimat-tehnika" subcats: zvolozhuvachi, ochysnyky-povitrya, meteostantsiyi, termometry-hihrometry
      categories: ["klimat-tehnika"],
    },
    parent_category: "klimat-tehnika",
    related_discover: ["rozumnyy-dim-gadzhety", "energozberezhennya-vdoma"],
    status: "published",
    min_articles: 1,
  },

  // ── PC / workspace accessories ────────────────────────────────────────────
  {
    slug: "aksesuary-dlya-robochoho-mistsia",
    title: "Аксесуари для робочого місця",
    seo_title: "Аксесуари для робочого місця — огляди",
    seo_description:
      "Клавіатури, миші, навушники, веб-камери та USB-хаби для комфортної роботи вдома та в офісі. Огляди та рейтинги.",
    lead: "Підібрали найкращі аксесуари для зручного і продуктивного робочого місця вдома або в офісі.",
    sources: {
      // "aksesuary-dlya-pk" subcats: klaviatury, myshi-ta-kilymky, navushnyky-ta-harnituty, veb-kamery,
      //   usb-khabu-ta-dokstantsiyi, kabeli-ta-perekhidnyky, nakopychuvachi, okholodzhennya, ergonomika
      categories: ["aksesuary-dlya-pk"],
    },
    parent_category: "aksesuary-dlya-pk",
    related_discover: ["usb-gadzhety-dlya-domu"],
    status: "published",
    min_articles: 1,
  },

  // ── Energy saving ─────────────────────────────────────────────────────────
  {
    slug: "energozberezhennya-vdoma",
    title: "Енергозбереження вдома",
    seo_title: "Енергозбереження вдома — огляди та підбірки",
    seo_description:
      "Сонячні панелі, портативні станції, акумулятори та LED-освітлення. Огляди рішень для автономності вдома.",
    lead: "Зібрали кращі рішення для енергозбереження та автономного живлення: від сонячних панелей до розумних розеток.",
    sources: {
      // "energozberezhennya" subcats: sonyachni-paneli, stantsiyi-ta-akb, led-osvitlennya, rozumni-rozetky
      categories: ["energozberezhennya"],
    },
    parent_category: "energozberezhennya",
    related_discover: ["rozumnyy-dim-gadzhety"],
    status: "published",
    min_articles: 1,
  },

  // ── Health & relax ────────────────────────────────────────────────────────
  {
    slug: "tovary-dlya-zdorovya-ta-relaksu",
    title: "Товари для здоров'я та релаксу",
    seo_title: "Товари для здоров'я та релаксу — підбірки",
    seo_description:
      "Масажери, прилади для сну, ароматерапія та товари для здорового способу життя. Огляди та рейтинги.",
    lead: "Підібрали кращі прилади та аксесуари для здоров'я, відновлення та повноцінного відпочинку.",
    sources: {
      // "zdorovya-ta-komfort" subcats: masazhery, monitoring-zdorovya, reabilitatsiya, zdorovyi-son
      // "komfort-i-relaks" subcats: masazhni-prystroyi, aromaterapiya, tovary-dlya-snu, hrylky-ta-termoproduktsiya, vanna-ta-spa
      categories: ["zdorovya-ta-komfort", "komfort-i-relaks"],
    },
    parent_category: "zdorovya-ta-komfort",
    related_discover: ["kuhonni-gadzhety-dlya-domu", "organizery-dlya-domu"],
    status: "published",
    min_articles: 1,
  },

  // ── Pet products ──────────────────────────────────────────────────────────
  {
    slug: "gadzhety-dlya-domashnih-tvaryn",
    title: "Гаджети та товари для домашніх тварин",
    seo_title: "Товари для домашніх тварин — огляди",
    seo_description:
      "Амуніція, іграшки, нашийники та аксесуари для котів і собак. Огляди кращих товарів для домашніх улюбленців.",
    lead: "Зібрали найкращі товари та гаджети для догляду за домашніми улюбленцями.",
    sources: {
      // "zootovary" subcats: amunitsiya-dlya-tvaryn, odyah-dlya-tvaryn, povidtsi-dlya-tvaryn, nashyjnyky,
      //   ihrashky-dlya-kotiv, ihrashky-dlya-sobak, interaktyvni-ihrashky
      categories: ["zootovary"],
    },
    parent_category: "zootovary",
    related_discover: [],
    status: "draft",
    min_articles: 1,
  },
];

export function getDiscoverPage(slug: string): DiscoverPageConfig | undefined {
  return DISCOVER_PAGES.find((p) => p.slug === slug);
}
