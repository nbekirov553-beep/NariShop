import type { Localized } from "@/lib/i18n/config";

// Demo-данные для проверки интерфейса (T-021). Бренды, цены и остатки вымышлены.
// После подключения Neon этот файл заменяется сидом в БД, контракт репозитория не меняется.

export type CategoryIcon =
  | "smartphone"
  | "laptop"
  | "tablet"
  | "tv"
  | "audio"
  | "appliance";

export type SpecGroupKey =
  | "display"
  | "performance"
  | "memory"
  | "battery"
  | "camera"
  | "sound"
  | "connectivity"
  | "general";

export type SpecKey =
  | "screenSize"
  | "screenType"
  | "resolution"
  | "refreshRate"
  | "processor"
  | "ram"
  | "storage"
  | "battery"
  | "playtime"
  | "mainCamera"
  | "os"
  | "weight"
  | "noiseCancelling"
  | "bluetooth"
  | "wifi"
  | "capacity"
  | "energyClass"
  | "power"
  | "smartTv";

export type SpecValue = string | Localized;

export interface DemoCategory {
  id: string;
  slug: string;
  parentId: string | null;
  name: Localized;
  description: Localized;
  icon: CategoryIcon;
  image: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface DemoProduct {
  id: string;
  sku: string;
  slug: string;
  brand: string;
  name: Localized;
  description: Localized;
  priceUzs: number;
  compareAtPriceUzs: number | null;
  stockQuantity: number;
  isActive: boolean;
  warrantyMonths: number;
  categoryIds: string[];
  specifications: Array<{
    group: SpecGroupKey;
    items: Array<{ key: SpecKey; value: SpecValue }>;
  }>;
  images: Array<{ url: string; alt: Localized; isPrimary: boolean }>;
  createdAt: string;
  popularity: number;
}

const yes: Localized = { uz: "Ha", ru: "Есть", en: "Yes" };

export const demoCategories: DemoCategory[] = [
  {
    id: "cat-smartphones",
    slug: "smartphones",
    parentId: null,
    name: { uz: "Smartfonlar", ru: "Смартфоны", en: "Smartphones" },
    description: {
      uz: "Har kungi ish va suratga olish uchun telefonlar",
      ru: "Телефоны для работы, связи и съёмки",
      en: "Phones for work, calls and photos",
    },
    icon: "smartphone",
    image: "/products/lumo-s12-pro-256gb.webp",
    sortOrder: 1,
    isActive: true,
  },
  {
    id: "cat-laptops",
    slug: "laptops",
    parentId: null,
    name: { uz: "Noutbuklar", ru: "Ноутбуки", en: "Laptops" },
    description: {
      uz: "O‘qish, ish va dizayn uchun noutbuklar",
      ru: "Ноутбуки для учёбы, работы и дизайна",
      en: "Laptops for study, work and design",
    },
    icon: "laptop",
    image: "/products/orion-book-14.webp",
    sortOrder: 2,
    isActive: true,
  },
  {
    id: "cat-tablets",
    slug: "tablets",
    parentId: null,
    name: { uz: "Planshetlar", ru: "Планшеты", en: "Tablets" },
    description: {
      uz: "Kino, o‘qish va bolalar uchun planshetlar",
      ru: "Планшеты для кино, чтения и детей",
      en: "Tablets for films, reading and kids",
    },
    icon: "tablet",
    image: "/products/lumo-tab-11.webp",
    sortOrder: 3,
    isActive: true,
  },
  {
    id: "cat-tv",
    slug: "tv",
    parentId: null,
    name: { uz: "Televizorlar", ru: "Телевизоры", en: "TVs" },
    description: {
      uz: "Smart TV va katta ekranli televizorlar",
      ru: "Smart TV и телевизоры с большой диагональю",
      en: "Smart TVs and large screens",
    },
    icon: "tv",
    image: "/products/nordis-vision-55.webp",
    sortOrder: 4,
    isActive: true,
  },
  {
    id: "cat-audio",
    slug: "audio",
    parentId: null,
    name: { uz: "Quloqchin va kolonkalar", ru: "Наушники и колонки", en: "Headphones & speakers" },
    description: {
      uz: "Simsiz quloqchinlar va portativ kolonkalar",
      ru: "Беспроводные наушники и портативные колонки",
      en: "Wireless headphones and portable speakers",
    },
    icon: "audio",
    image: "/products/sonora-studio.webp",
    sortOrder: 5,
    isActive: true,
  },
  {
    id: "cat-appliances",
    slug: "appliances",
    parentId: null,
    name: { uz: "Maishiy texnika", ru: "Бытовая техника", en: "Home appliances" },
    description: {
      uz: "Kir yuvish mashinalari, muzlatkichlar va uy uchun texnika",
      ru: "Стиральные машины, холодильники и техника для дома",
      en: "Washers, fridges and appliances for home",
    },
    icon: "appliance",
    image: "/products/kumush-brew.webp",
    sortOrder: 6,
    isActive: true,
  },
];

const baseProducts: Array<Omit<DemoProduct, "images">> = [
  {
    id: "p-001",
    sku: "LUM-S12-128-BLK",
    slug: "lumo-s12-128gb",
    brand: "Lumo",
    name: { uz: "Lumo S12, 128 GB", ru: "Lumo S12, 128 ГБ", en: "Lumo S12, 128 GB" },
    description: {
      uz: "AMOLED ekranli va kun bo‘yi ishlaydigan batareyali ixcham smartfon.",
      ru: "Компактный смартфон с AMOLED-экраном и батареей на полный день.",
      en: "Compact smartphone with an AMOLED screen and all-day battery.",
    },
    priceUzs: 3_290_000,
    compareAtPriceUzs: 3_690_000,
    stockQuantity: 14,
    isActive: true,
    warrantyMonths: 12,
    categoryIds: ["cat-smartphones"],
    specifications: [
      {
        group: "display",
        items: [
          { key: "screenSize", value: "6.4\"" },
          { key: "screenType", value: "AMOLED" },
          { key: "refreshRate", value: "120 Hz" },
        ],
      },
      {
        group: "memory",
        items: [
          { key: "ram", value: { uz: "8 GB", ru: "8 ГБ", en: "8 GB" } },
          { key: "storage", value: { uz: "128 GB", ru: "128 ГБ", en: "128 GB" } },
        ],
      },
      {
        group: "battery",
        items: [{ key: "battery", value: { uz: "5000 mA·soat", ru: "5000 мА·ч", en: "5000 mAh" } }],
      },
      { group: "camera", items: [{ key: "mainCamera", value: { uz: "50 Mp", ru: "50 Мп", en: "50 MP" } }] },
      { group: "general", items: [{ key: "os", value: "Android 15" }] },
    ],
    createdAt: "2026-09-02",
    popularity: 98,
  },
  {
    id: "p-002",
    sku: "LUM-S12P-256-SLV",
    slug: "lumo-s12-pro-256gb",
    brand: "Lumo",
    name: { uz: "Lumo S12 Pro, 256 GB", ru: "Lumo S12 Pro, 256 ГБ", en: "Lumo S12 Pro, 256 GB" },
    description: {
      uz: "Optik zumli uch kamerali va katta xotirali flagman.",
      ru: "Флагман с тройной камерой, оптическим зумом и увеличенной памятью.",
      en: "Flagship with a triple camera, optical zoom and more storage.",
    },
    priceUzs: 5_490_000,
    compareAtPriceUzs: null,
    stockQuantity: 6,
    isActive: true,
    warrantyMonths: 12,
    categoryIds: ["cat-smartphones"],
    specifications: [
      {
        group: "display",
        items: [
          { key: "screenSize", value: "6.7\"" },
          { key: "screenType", value: "AMOLED LTPO" },
          { key: "refreshRate", value: "120 Hz" },
        ],
      },
      {
        group: "memory",
        items: [
          { key: "ram", value: { uz: "12 GB", ru: "12 ГБ", en: "12 GB" } },
          { key: "storage", value: { uz: "256 GB", ru: "256 ГБ", en: "256 GB" } },
        ],
      },
      {
        group: "battery",
        items: [{ key: "battery", value: { uz: "5200 mA·soat", ru: "5200 мА·ч", en: "5200 mAh" } }],
      },
      { group: "camera", items: [{ key: "mainCamera", value: { uz: "50 Mp", ru: "50 Мп", en: "50 MP" } }] },
      { group: "general", items: [{ key: "os", value: "Android 15" }] },
    ],
    createdAt: "2026-10-01",
    popularity: 91,
  },
  {
    id: "p-003",
    sku: "TER-NOVA5G-128",
    slug: "tera-nova-5g-128gb",
    brand: "Tera",
    name: { uz: "Tera Nova 5G, 128 GB", ru: "Tera Nova 5G, 128 ГБ", en: "Tera Nova 5G, 128 GB" },
    description: {
      uz: "5G qo‘llab-quvvatlaydigan arzon smartfon.",
      ru: "Недорогой смартфон с поддержкой 5G.",
      en: "Affordable smartphone with 5G support.",
    },
    priceUzs: 2_450_000,
    compareAtPriceUzs: null,
    stockQuantity: 0,
    isActive: true,
    warrantyMonths: 12,
    categoryIds: ["cat-smartphones"],
    specifications: [
      {
        group: "display",
        items: [
          { key: "screenSize", value: "6.6\"" },
          { key: "screenType", value: "IPS" },
          { key: "refreshRate", value: "90 Hz" },
        ],
      },
      {
        group: "memory",
        items: [
          { key: "ram", value: { uz: "6 GB", ru: "6 ГБ", en: "6 GB" } },
          { key: "storage", value: { uz: "128 GB", ru: "128 ГБ", en: "128 GB" } },
        ],
      },
      {
        group: "battery",
        items: [{ key: "battery", value: { uz: "5000 mA·soat", ru: "5000 мА·ч", en: "5000 mAh" } }],
      },
      { group: "general", items: [{ key: "os", value: "Android 14" }] },
    ],
    createdAt: "2026-06-14",
    popularity: 74,
  },
  {
    id: "p-004",
    sku: "ORI-BOOK14-I5-512",
    slug: "orion-book-14",
    brand: "Orion",
    name: { uz: "Orion Book 14", ru: "Ноутбук Orion Book 14", en: "Orion Book 14 laptop" },
    description: {
      uz: "Ish va o‘qish uchun 14 dyuymli yengil noutbuk.",
      ru: "Лёгкий 14-дюймовый ноутбук для работы и учёбы.",
      en: "Lightweight 14-inch laptop for work and study.",
    },
    priceUzs: 8_900_000,
    compareAtPriceUzs: 9_750_000,
    stockQuantity: 5,
    isActive: true,
    warrantyMonths: 24,
    categoryIds: ["cat-laptops"],
    specifications: [
      {
        group: "display",
        items: [
          { key: "screenSize", value: "14\"" },
          { key: "resolution", value: "1920 × 1200" },
        ],
      },
      {
        group: "performance",
        items: [{ key: "processor", value: "Intel Core i5" }],
      },
      {
        group: "memory",
        items: [
          { key: "ram", value: { uz: "16 GB", ru: "16 ГБ", en: "16 GB" } },
          { key: "storage", value: { uz: "512 GB SSD", ru: "512 ГБ SSD", en: "512 GB SSD" } },
        ],
      },
      {
        group: "general",
        items: [
          { key: "os", value: "Windows 11" },
          { key: "weight", value: { uz: "1,35 kg", ru: "1,35 кг", en: "1.35 kg" } },
        ],
      },
    ],
    createdAt: "2026-08-20",
    popularity: 88,
  },
  {
    id: "p-005",
    sku: "ORI-BOOK16P-R7-1TB",
    slug: "orion-book-16-pro",
    brand: "Orion",
    name: { uz: "Orion Book 16 Pro", ru: "Ноутбук Orion Book 16 Pro", en: "Orion Book 16 Pro laptop" },
    description: {
      uz: "Montaj va dizayn uchun katta ekranli kuchli noutbuk.",
      ru: "Мощный ноутбук с большим экраном для монтажа и дизайна.",
      en: "Powerful large-screen laptop for editing and design.",
    },
    priceUzs: 13_400_000,
    compareAtPriceUzs: null,
    stockQuantity: 3,
    isActive: true,
    warrantyMonths: 24,
    categoryIds: ["cat-laptops"],
    specifications: [
      {
        group: "display",
        items: [
          { key: "screenSize", value: "16\"" },
          { key: "resolution", value: "2560 × 1600" },
          { key: "refreshRate", value: "165 Hz" },
        ],
      },
      { group: "performance", items: [{ key: "processor", value: "AMD Ryzen 7" }] },
      {
        group: "memory",
        items: [
          { key: "ram", value: { uz: "32 GB", ru: "32 ГБ", en: "32 GB" } },
          { key: "storage", value: { uz: "1 TB SSD", ru: "1 ТБ SSD", en: "1 TB SSD" } },
        ],
      },
      {
        group: "general",
        items: [
          { key: "os", value: "Windows 11" },
          { key: "weight", value: { uz: "2,1 kg", ru: "2,1 кг", en: "2.1 kg" } },
        ],
      },
    ],
    createdAt: "2026-09-25",
    popularity: 79,
  },
  {
    id: "p-006",
    sku: "TER-AIR13-256",
    slug: "tera-air-13",
    brand: "Tera",
    name: { uz: "Tera Air 13", ru: "Ноутбук Tera Air 13", en: "Tera Air 13 laptop" },
    description: {
      uz: "Talabalar uchun ixcham noutbuk.",
      ru: "Компактный ноутбук для студентов.",
      en: "Compact laptop for students.",
    },
    priceUzs: 6_750_000,
    compareAtPriceUzs: null,
    stockQuantity: 9,
    isActive: true,
    warrantyMonths: 12,
    categoryIds: ["cat-laptops"],
    specifications: [
      { group: "display", items: [{ key: "screenSize", value: "13.3\"" }] },
      { group: "performance", items: [{ key: "processor", value: "Intel Core i3" }] },
      {
        group: "memory",
        items: [
          { key: "ram", value: { uz: "8 GB", ru: "8 ГБ", en: "8 GB" } },
          { key: "storage", value: { uz: "256 GB SSD", ru: "256 ГБ SSD", en: "256 GB SSD" } },
        ],
      },
      {
        group: "general",
        items: [{ key: "weight", value: { uz: "1,2 kg", ru: "1,2 кг", en: "1.2 kg" } }],
      },
    ],
    createdAt: "2026-05-11",
    popularity: 70,
  },
  {
    id: "p-007",
    sku: "LUM-TAB11-128",
    slug: "lumo-tab-11",
    brand: "Lumo",
    name: { uz: "Lumo Tab 11", ru: "Планшет Lumo Tab 11", en: "Lumo Tab 11 tablet" },
    description: {
      uz: "Kino va o‘qish uchun 11 dyuymli planshet.",
      ru: "11-дюймовый планшет для фильмов и чтения.",
      en: "11-inch tablet for films and reading.",
    },
    priceUzs: 3_950_000,
    compareAtPriceUzs: null,
    stockQuantity: 7,
    isActive: true,
    warrantyMonths: 12,
    categoryIds: ["cat-tablets"],
    specifications: [
      {
        group: "display",
        items: [
          { key: "screenSize", value: "11\"" },
          { key: "resolution", value: "2560 × 1600" },
        ],
      },
      {
        group: "memory",
        items: [{ key: "storage", value: { uz: "128 GB", ru: "128 ГБ", en: "128 GB" } }],
      },
      {
        group: "battery",
        items: [{ key: "battery", value: { uz: "8000 mA·soat", ru: "8000 мА·ч", en: "8000 mAh" } }],
      },
    ],
    createdAt: "2026-07-03",
    popularity: 66,
  },
  {
    id: "p-008",
    sku: "TER-PAD10K-64",
    slug: "tera-pad-10-kids",
    brand: "Tera",
    name: { uz: "Tera Pad 10 Kids", ru: "Детский планшет Tera Pad 10 Kids", en: "Tera Pad 10 Kids tablet" },
    description: {
      uz: "Himoya g‘ilofi va ota-ona nazorati bilan bolalar planshet.",
      ru: "Детский планшет с защитным чехлом и родительским контролем.",
      en: "Kids tablet with a protective case and parental controls.",
    },
    priceUzs: 1_890_000,
    compareAtPriceUzs: 2_190_000,
    stockQuantity: 12,
    isActive: true,
    warrantyMonths: 12,
    categoryIds: ["cat-tablets"],
    specifications: [
      { group: "display", items: [{ key: "screenSize", value: "10.1\"" }] },
      {
        group: "memory",
        items: [{ key: "storage", value: { uz: "64 GB", ru: "64 ГБ", en: "64 GB" } }],
      },
    ],
    createdAt: "2026-04-18",
    popularity: 62,
  },
  {
    id: "p-009",
    sku: "NOR-VIS55-4K",
    slug: "nordis-vision-55",
    brand: "Nordis",
    name: { uz: "Nordis Vision 55\" 4K", ru: "Телевизор Nordis Vision 55\" 4K", en: "Nordis Vision 55\" 4K TV" },
    description: {
      uz: "Smart TV funksiyali 55 dyuymli 4K televizor.",
      ru: "4K-телевизор 55 дюймов со Smart TV.",
      en: "55-inch 4K TV with Smart TV features.",
    },
    priceUzs: 6_990_000,
    compareAtPriceUzs: 7_800_000,
    stockQuantity: 4,
    isActive: true,
    warrantyMonths: 24,
    categoryIds: ["cat-tv"],
    specifications: [
      {
        group: "display",
        items: [
          { key: "screenSize", value: "55\"" },
          { key: "resolution", value: "3840 × 2160" },
          { key: "refreshRate", value: "60 Hz" },
        ],
      },
      {
        group: "connectivity",
        items: [
          { key: "smartTv", value: yes },
          { key: "wifi", value: "Wi-Fi 5" },
        ],
      },
    ],
    createdAt: "2026-08-02",
    popularity: 85,
  },
  {
    id: "p-010",
    sku: "NOR-VIS43-FHD",
    slug: "nordis-vision-43",
    brand: "Nordis",
    name: { uz: "Nordis Vision 43\"", ru: "Телевизор Nordis Vision 43\"", en: "Nordis Vision 43\" TV" },
    description: {
      uz: "Oshxona va yotoqxona uchun ixcham televizor.",
      ru: "Компактный телевизор для кухни или спальни.",
      en: "Compact TV for a kitchen or bedroom.",
    },
    priceUzs: 4_290_000,
    compareAtPriceUzs: null,
    stockQuantity: 8,
    isActive: true,
    warrantyMonths: 24,
    categoryIds: ["cat-tv"],
    specifications: [
      {
        group: "display",
        items: [
          { key: "screenSize", value: "43\"" },
          { key: "resolution", value: "1920 × 1080" },
        ],
      },
      { group: "connectivity", items: [{ key: "smartTv", value: yes }] },
    ],
    createdAt: "2026-03-09",
    popularity: 60,
  },
  {
    id: "p-011",
    sku: "ORI-OLED65",
    slug: "orion-oled-65",
    brand: "Orion",
    name: { uz: "Orion OLED 65\"", ru: "Телевизор Orion OLED 65\"", en: "Orion OLED 65\" TV" },
    description: {
      uz: "Chuqur qora rang va 120 Hz chastotali OLED televizor.",
      ru: "OLED-телевизор с глубоким чёрным и частотой 120 Гц.",
      en: "OLED TV with deep blacks and a 120 Hz refresh rate.",
    },
    priceUzs: 18_900_000,
    compareAtPriceUzs: null,
    stockQuantity: 2,
    isActive: true,
    warrantyMonths: 24,
    categoryIds: ["cat-tv"],
    specifications: [
      {
        group: "display",
        items: [
          { key: "screenSize", value: "65\"" },
          { key: "screenType", value: "OLED" },
          { key: "resolution", value: "3840 × 2160" },
          { key: "refreshRate", value: "120 Hz" },
        ],
      },
      { group: "connectivity", items: [{ key: "smartTv", value: yes }] },
    ],
    createdAt: "2026-10-10",
    popularity: 72,
  },
  {
    id: "p-012",
    sku: "SON-PODS2-WHT",
    slug: "sonora-pods-2",
    brand: "Sonora",
    name: { uz: "Sonora Pods 2 quloqchinlari", ru: "Наушники Sonora Pods 2", en: "Sonora Pods 2 earbuds" },
    description: {
      uz: "Zaryadlovchi g‘ilofli simsiz quloqchinlar.",
      ru: "Беспроводные наушники с зарядным кейсом.",
      en: "Wireless earbuds with a charging case.",
    },
    priceUzs: 690_000,
    compareAtPriceUzs: 850_000,
    stockQuantity: 30,
    isActive: true,
    warrantyMonths: 6,
    categoryIds: ["cat-audio"],
    specifications: [
      {
        group: "sound",
        items: [{ key: "playtime", value: { uz: "24 soatgacha", ru: "до 24 ч", en: "up to 24 h" } }],
      },
      { group: "connectivity", items: [{ key: "bluetooth", value: "5.3" }] },
    ],
    createdAt: "2026-07-22",
    popularity: 95,
  },
  {
    id: "p-013",
    sku: "SON-STUDIO-ANC",
    slug: "sonora-studio",
    brand: "Sonora",
    name: { uz: "Sonora Studio quloqchinlari", ru: "Наушники Sonora Studio", en: "Sonora Studio headphones" },
    description: {
      uz: "Faol shovqinni bostirishli to‘liq o‘lchamli quloqchinlar.",
      ru: "Полноразмерные наушники с активным шумоподавлением.",
      en: "Over-ear headphones with active noise cancelling.",
    },
    priceUzs: 1_590_000,
    compareAtPriceUzs: null,
    stockQuantity: 11,
    isActive: true,
    warrantyMonths: 12,
    categoryIds: ["cat-audio"],
    specifications: [
      {
        group: "sound",
        items: [
          { key: "noiseCancelling", value: yes },
          { key: "playtime", value: { uz: "40 soatgacha", ru: "до 40 ч", en: "up to 40 h" } },
        ],
      },
      { group: "connectivity", items: [{ key: "bluetooth", value: "5.3" }] },
    ],
    createdAt: "2026-09-12",
    popularity: 81,
  },
  {
    id: "p-014",
    sku: "SON-BOXMINI",
    slug: "sonora-box-mini",
    brand: "Sonora",
    name: { uz: "Sonora Box Mini kolonkasi", ru: "Колонка Sonora Box Mini", en: "Sonora Box Mini speaker" },
    description: {
      uz: "Suvdan himoyalangan portativ kolonka.",
      ru: "Портативная колонка с защитой от воды.",
      en: "Portable speaker with water protection.",
    },
    priceUzs: 520_000,
    compareAtPriceUzs: null,
    stockQuantity: 0,
    isActive: true,
    warrantyMonths: 6,
    categoryIds: ["cat-audio"],
    specifications: [
      {
        group: "sound",
        items: [{ key: "playtime", value: { uz: "12 soatgacha", ru: "до 12 ч", en: "up to 12 h" } }],
      },
      { group: "connectivity", items: [{ key: "bluetooth", value: "5.1" }] },
    ],
    createdAt: "2026-02-27",
    popularity: 58,
  },
  {
    id: "p-015",
    sku: "KUM-WASH8",
    slug: "kumush-washpro-8",
    brand: "Kumush",
    name: { uz: "Kumush WashPro kir yuvish mashinasi, 8 kg", ru: "Стиральная машина Kumush WashPro, 8 кг", en: "Kumush WashPro washer, 8 kg" },
    description: {
      uz: "Bug‘ bilan yuvish rejimli invertorli kir yuvish mashinasi.",
      ru: "Инверторная стиральная машина с режимом обработки паром.",
      en: "Inverter washing machine with a steam mode.",
    },
    priceUzs: 5_200_000,
    compareAtPriceUzs: null,
    stockQuantity: 3,
    isActive: true,
    warrantyMonths: 36,
    categoryIds: ["cat-appliances"],
    specifications: [
      {
        group: "general",
        items: [
          { key: "capacity", value: { uz: "8 kg", ru: "8 кг", en: "8 kg" } },
          { key: "energyClass", value: "A+++" },
        ],
      },
    ],
    createdAt: "2026-06-30",
    popularity: 69,
  },
  {
    id: "p-016",
    sku: "KUM-FRESH340",
    slug: "kumush-fresh-340",
    brand: "Kumush",
    name: { uz: "Kumush Fresh muzlatkichi, 340 l", ru: "Холодильник Kumush Fresh, 340 л", en: "Kumush Fresh fridge, 340 L" },
    description: {
      uz: "No Frost tizimli ikki kamerali muzlatkich.",
      ru: "Двухкамерный холодильник с системой No Frost.",
      en: "Two-door fridge with No Frost.",
    },
    priceUzs: 7_400_000,
    compareAtPriceUzs: 8_100_000,
    stockQuantity: 2,
    isActive: true,
    warrantyMonths: 36,
    categoryIds: ["cat-appliances"],
    specifications: [
      {
        group: "general",
        items: [
          { key: "capacity", value: { uz: "340 l", ru: "340 л", en: "340 L" } },
          { key: "energyClass", value: "A++" },
        ],
      },
    ],
    createdAt: "2026-09-05",
    popularity: 76,
  },
  {
    id: "p-017",
    sku: "KUM-AIRCLEAN",
    slug: "kumush-airclean",
    brand: "Kumush",
    name: { uz: "Kumush AirClean havo tozalagichi", ru: "Очиститель воздуха Kumush AirClean", en: "Kumush AirClean air purifier" },
    description: {
      uz: "40 m² gacha xonalar uchun HEPA filtrli havo tozalagich.",
      ru: "Очиститель воздуха с HEPA-фильтром для комнат до 40 м².",
      en: "HEPA air purifier for rooms up to 40 m².",
    },
    priceUzs: 1_750_000,
    compareAtPriceUzs: null,
    stockQuantity: 6,
    isActive: true,
    warrantyMonths: 12,
    categoryIds: ["cat-appliances"],
    specifications: [
      {
        group: "general",
        items: [
          { key: "power", value: { uz: "45 Vt", ru: "45 Вт", en: "45 W" } },
          { key: "wifi", value: yes },
        ],
      },
    ],
    createdAt: "2026-10-05",
    popularity: 64,
  },
  {
    id: "p-018",
    sku: "KUM-BREW",
    slug: "kumush-brew",
    brand: "Kumush",
    name: { uz: "Kumush Brew qahva mashinasi", ru: "Кофемашина Kumush Brew", en: "Kumush Brew coffee machine" },
    description: {
      uz: "Kapuchinator bilan avtomatik qahva mashinasi.",
      ru: "Автоматическая кофемашина с капучинатором.",
      en: "Automatic coffee machine with a milk frother.",
    },
    priceUzs: 2_300_000,
    compareAtPriceUzs: null,
    stockQuantity: 5,
    isActive: true,
    warrantyMonths: 12,
    categoryIds: ["cat-appliances"],
    specifications: [
      {
        group: "general",
        items: [{ key: "power", value: { uz: "1450 Vt", ru: "1450 Вт", en: "1450 W" } }],
      },
    ],
    createdAt: "2026-08-28",
    popularity: 67,
  },
];

// Фото сгенерированы для demo-витрины и лежат в public/products/{slug}.webp.
export const demoProducts: DemoProduct[] = baseProducts.map((product) => ({
  ...product,
  images: [{ url: `/products/${product.slug}.webp`, alt: product.name, isPrimary: true }],
}));
