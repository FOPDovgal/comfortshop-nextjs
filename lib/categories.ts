export interface Subcategory {
  slug: string;
  name: string;
  icon: string;
}

export interface Category {
  slug: string;
  name: string;
  icon: string;
  colorFrom: string;
  colorTo: string;
  bgLight: string;
  subcategories: Subcategory[];
}

export const CATEGORIES: Category[] = [
  {
    slug: "tovary-dlya-domu",
    name: "Товари для дому",
    icon: "🏠",
    colorFrom: "#6366f1",
    colorTo: "#818cf8",
    bgLight: "#eef2ff",
    subcategories: [
      { slug: "organajzery", name: "Органайзери", icon: "📦" },
      { slug: "prybyrannya", name: "Прибирання", icon: "🧹" },
      { slug: "osvitlennya", name: "Освітлення", icon: "💡" },
      { slug: "tekstyl-ta-dekor", name: "Текстиль та декор", icon: "🛋️" },
    ],
  },
  {
    slug: "kuhonni-gadzhety",
    name: "Кухонні гаджети",
    icon: "🍳",
    colorFrom: "#d97706",
    colorTo: "#f59e0b",
    bgLight: "#fffbeb",
    subcategories: [
      { slug: "elektroprystroyi", name: "Електроприлади", icon: "⚡" },
      { slug: "pryladdya-ta-aksesuary", name: "Приладдя та аксесуари", icon: "🔧" },
      { slug: "vymiryuvannya", name: "Вимірювання", icon: "⚖️" },
      { slug: "zberihannya", name: "Зберігання", icon: "🫙" },
    ],
  },
  {
    slug: "klimat-tehnika",
    name: "Кліматтехніка",
    icon: "🌡️",
    colorFrom: "#0284c7",
    colorTo: "#38bdf8",
    bgLight: "#e0f2fe",
    subcategories: [
      { slug: "zvolozhuvachi", name: "Зволожувачі", icon: "💧" },
      { slug: "ochysnyky-povitrya", name: "Очищувачі повітря", icon: "🌬️" },
      { slug: "meteostantsiyi", name: "Метеостанції", icon: "🌤️" },
      { slug: "termometry-hihrometry", name: "Термометри та гігрометри", icon: "🌡️" },
    ],
  },
  {
    slug: "suchasni-gadzhety",
    name: "Сучасні гаджети",
    icon: "📱",
    colorFrom: "#7c3aed",
    colorTo: "#a78bfa",
    bgLight: "#f5f3ff",
    subcategories: [
      { slug: "dlya-ofisu", name: "Для офісу", icon: "🏢" },
      { slug: "dlya-domu", name: "Для дому", icon: "🏡" },
      { slug: "dlya-avto", name: "Для авто", icon: "🚗" },
      { slug: "powerbanky-ta-zhyvlennya", name: "Павербанки та живлення", icon: "🔋" },
    ],
  },
  {
    slug: "rozumnyy-dim",
    name: "Розумний дім",
    icon: "🏡",
    colorFrom: "#059669",
    colorTo: "#34d399",
    bgLight: "#ecfdf5",
    subcategories: [
      { slug: "rozumne-osvitlennya", name: "Розумне освітлення", icon: "💡" },
      { slug: "rozumni-rozetky-ta-vymikachi", name: "Розумні розетки та вимикачі", icon: "🔌" },
      { slug: "golosovi-pomichnyki-ta-khabu", name: "Голосові помічники та хаби", icon: "🎙️" },
      { slug: "rozumna-bezpeka", name: "Розумна безпека", icon: "🔐" },
      { slug: "rozumna-klimatyzatsiya", name: "Розумна кліматизація", icon: "🌡️" },
      { slug: "datchyky-ta-avtomatyzatsiya", name: "Датчики та автоматизація", icon: "📡" },
      { slug: "roboty-prybyralnyky", name: "Роботи-прибиральники", icon: "🤖" },
    ],
  },
  {
    slug: "aksesuary-dlya-pk",
    name: "Аксесуари для ПК",
    icon: "💻",
    colorFrom: "#1d4ed8",
    colorTo: "#60a5fa",
    bgLight: "#eff6ff",
    subcategories: [
      { slug: "klaviatury", name: "Клавіатури", icon: "⌨️" },
      { slug: "myshi-ta-kilymky", name: "Миші та килимки", icon: "🖱️" },
      { slug: "navushnyky-ta-harnituty", name: "Навушники та гарнітури", icon: "🎧" },
      { slug: "veb-kamery", name: "Веб-камери", icon: "📸" },
      { slug: "usb-khabu-ta-dokstantsiyi", name: "USB-хаби та докстанції", icon: "🔌" },
      { slug: "kabeli-ta-perekhidnyky", name: "Кабелі та перехідники", icon: "🔗" },
      { slug: "nakopychuvachi", name: "Накопичувачі", icon: "💾" },
      { slug: "okholodzhennya", name: "Охолодження", icon: "❄️" },
      { slug: "stryminhovoe-obladnannya", name: "Стримінгове обладнання", icon: "🎬" },
      { slug: "ergonomika", name: "Ергономіка", icon: "🪑" },
    ],
  },
  {
    slug: "komfort-i-relaks",
    name: "Комфорт і релакс",
    icon: "🛁",
    colorFrom: "#be185d",
    colorTo: "#f472b6",
    bgLight: "#fdf2f8",
    subcategories: [
      { slug: "masazhni-prystroyi", name: "Масажні прилади", icon: "💆" },
      { slug: "aromaterapiya", name: "Ароматерапія", icon: "🕯️" },
      { slug: "tovary-dlya-snu", name: "Товари для сну", icon: "😴" },
      { slug: "hrylky-ta-termoproduktsiya", name: "Грілки та термопродукція", icon: "🔥" },
      { slug: "vanna-ta-spa", name: "Ванна та СПА", icon: "🛁" },
      { slug: "antystres-ta-produktyvnist", name: "Антистрес та продуктивність", icon: "🧘" },
    ],
  },
  {
    slug: "sport-ta-turyzm",
    name: "Спорт та туризм",
    icon: "⛺",
    colorFrom: "#15803d",
    colorTo: "#4ade80",
    bgLight: "#f0fdf4",
    subcategories: [
      { slug: "namety", name: "Намети", icon: "⛺" },
      { slug: "likhtari", name: "Ліхтарі", icon: "🔦" },
      { slug: "gotuvannya", name: "Готування на природі", icon: "🔥" },
      { slug: "termoproduktsiya", name: "Термопродукція", icon: "♨️" },
      { slug: "nabory-vyzhyvannya", name: "Набори виживання", icon: "🪓" },
      { slug: "sportyvne-sporyadzhennya", name: "Спортивне спорядження", icon: "🏃" },
    ],
  },
  {
    slug: "zdorovya-ta-komfort",
    name: "Здоров'я та комфорт",
    icon: "❤️",
    colorFrom: "#dc2626",
    colorTo: "#f87171",
    bgLight: "#fff1f2",
    subcategories: [
      { slug: "masazhery", name: "Масажери", icon: "💆" },
      { slug: "monitoring-zdorovya", name: "Моніторинг здоров'я", icon: "📊" },
      { slug: "reabilitatsiya", name: "Реабілітація", icon: "🏥" },
      { slug: "zdorovyi-son", name: "Здоровий сон", icon: "😴" },
    ],
  },
  {
    slug: "dlya-ditej",
    name: "Дитячі товари",
    icon: "🧸",
    colorFrom: "#b45309",
    colorTo: "#fbbf24",
    bgLight: "#fefce8",
    subcategories: [
      { slug: "rozvyvalni-igrashky", name: "Розвивальні іграшки", icon: "🎮" },
      { slug: "bezpeka-dytyny", name: "Безпека дитини", icon: "🛡️" },
      { slug: "transport", name: "Дитячий транспорт", icon: "🛴" },
    ],
  },
  {
    slug: "bezpeka",
    name: "Безпека та відеонагляд",
    icon: "🔒",
    colorFrom: "#374151",
    colorTo: "#6b7280",
    bgLight: "#f9fafb",
    subcategories: [
      { slug: "wifi-kamery", name: "Wi-Fi камери", icon: "📹" },
      { slug: "avtonomni-kamery-solar", name: "Автономні камери (Solar)", icon: "☀️" },
      { slug: "videodzvinky", name: "Відеодзвінки", icon: "🔔" },
      { slug: "syhnalizatsiyi", name: "Сигналізації", icon: "🚨" },
    ],
  },
  {
    slug: "energozberezhennya",
    name: "Енергозбереження",
    icon: "⚡",
    colorFrom: "#4d7c0f",
    colorTo: "#a3e635",
    bgLight: "#f7fee7",
    subcategories: [
      { slug: "sonyachni-paneli", name: "Сонячні панелі", icon: "☀️" },
      { slug: "stantsiyi-ta-akb", name: "Станції та АКБ", icon: "🔋" },
      { slug: "led-osvitlennya", name: "LED освітлення", icon: "💡" },
      { slug: "rozumni-rozetky", name: "Розумні розетки", icon: "🔌" },
    ],
  },
  {
    slug: "zootovary",
    name: "Зоотовари",
    icon: "🐾",
    colorFrom: "#92400e",
    colorTo: "#d97706",
    bgLight: "#fef3c7",
    subcategories: [
      { slug: "amunitsiya-dlya-tvaryn", name: "Амуніція для тварин", icon: "🎒" },
      { slug: "odyah-dlya-tvaryn", name: "Одяг для тварин", icon: "👕" },
      { slug: "povidtsi-dlya-tvaryn", name: "Повідці для тварин", icon: "🦮" },
      { slug: "nashyjnyky", name: "Нашийники", icon: "🏷️" },
      { slug: "ihrashky-dlya-kotiv", name: "Іграшки для котів", icon: "🐱" },
      { slug: "ihrashky-dlya-sobak", name: "Іграшки для собак", icon: "🐶" },
      { slug: "interaktyvni-ihrashky", name: "Інтерактивні іграшки", icon: "🎯" },
    ],
  },
  {
    slug: "elektrotransport",
    name: "Електротранспорт",
    icon: "🛴",
    colorFrom: "#0e7490",
    colorTo: "#22d3ee",
    bgLight: "#ecfeff",
    subcategories: [
      { slug: "elektrosamokaty", name: "Електросамокати", icon: "🛴" },
      { slug: "elektrovelosypedy", name: "Електровелосипеди", icon: "🚲" },
      { slug: "elektromototsykly", name: "Електромотоцикли", icon: "🏍️" },
      { slug: "elektroavto", name: "Електроавто", icon: "🚗" },
      { slug: "aksesuary", name: "Аксесуари", icon: "🔧" },
    ],
  },
];

export function getCategoryBySlug(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}
