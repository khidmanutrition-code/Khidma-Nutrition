export type CategorySlug =
  | 'all'
  | 'patali'
  | 'danadar'
  | 'jhola'
  | 'combo'
  | 'honey'
  | 'ghee-oil'
  | 'dates-nuts'
  | 'spices-seeds';

export interface CategoryItem {
  slug: Exclude<CategorySlug, 'all'>;
  name: string;
  subLabel: string;
  image: string;
}

export interface ProductVariant {
  id: string;
  label: string;
  weightKg: number;
  price: number;
  originalPrice?: number;
}

export interface ProductSpec {
  label: string;
  value: string;
}

export interface Product {
  id: string;
  sku: string;
  barcode?: string;
  sellerId?: string;
  sellerName?: string;
  isMall?: boolean;
  freeShipping?: boolean;
  warrantyLabel?: string;
  colorLabel?: string;
  name: string;
  englishName: string;
  shortDesc: string;
  category: Exclude<CategorySlug, 'all'>;
  categoryLabel: string;
  brand: string;
  price: number;
  originalPrice?: number;
  wholesalePrice?: number;
  minWholesaleQty?: number;
  costPrice?: number;
  discountPercent?: number;
  soldCount: number;
  stockLeft?: number;
  promoLabel?: string;
  tag: string;
  badge: string;
  inStock: boolean;
  isHotDeal?: boolean;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  image: string;
  videoUrl?: string;
  gallery: string[];
  origin: string;
  description: string;
  features: string[];
  specifications?: ProductSpec[];
  variants: ProductVariant[];
}

export interface GalleryPhoto {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  category: string;
}

export interface ReviewItem {
  id: string;
  author: string;
  location: string;
  rating: number;
  date: string;
  productName: string;
  comment: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface VoucherItem {
  code: string;
  title: string;
  discount: number;
  minSpend: number;
  expiry: string;
}

export const GUR_IMAGES = {
  heroGur: '/src/assets/images/gur/hero_gur.jpg',
  pataliGur: '/src/assets/images/gur/patali_gur.jpg',
  danadarGur: '/src/assets/images/gur/danadar_gur.jpg',
  jholaGur: '/src/assets/images/gur/jhola_gur.jpg',
  kholaPatali: '/src/assets/images/gur/khola_patali.jpg',
  vangaPatali: '/src/assets/images/gur/vanga_patali.jpg',
  packLabel: '/src/assets/images/gur/pack_label.jpg',
};

export const ORGANIC_IMAGES = {
  heroHarvest: '/src/assets/images/hero_organic_harvest_1794838207437.jpg',
  sliderGurWinter: '/src/assets/images/slider_gur_winter_1794841641969.jpg',
  sliderOrganicSuperfoods: '/src/assets/images/slider_organic_superfoods_1794841642582.jpg',
  rawHoney: '/src/assets/images/product_raw_honey_1794838206473.jpg',
  kalojiraHoney: '/src/assets/images/kalojira_honey_jar_1794841396850.jpg',
  honeyNuts: '/src/assets/images/honey_nuts_jar_1794841378889.jpg',
  desiGhee: '/src/assets/images/product_desi_ghee_1794838206797.jpg',
  mustardOil: '/src/assets/images/product_mustard_oil_1794838545033.jpg',
  blackSeedOil: '/src/assets/images/product_black_seed_oil_1794838207880.jpg',
  coconutOil: '/src/assets/images/virgin_coconut_oil_1794841408523.jpg',
  datesSuperfoods: '/src/assets/images/product_dates_superfoods_1794838208014.jpg',
  chiaSeeds: '/src/assets/images/chia_mixed_seeds_1794841379754.jpg',
  spicesCombo: '/src/assets/images/product_spices_combo_1794838545414.jpg',
  bannerOil: '/src/assets/images/banner_green_organic_oil_1794838544335.jpg',
  bannerHoney: '/src/assets/images/banner_honey_offer_1794838545895.jpg',
};

export const BRAND_INFO = {
  name: 'খিদমাতুল উম্মাহ শপ বিডি',
  englishName: 'Khidmatul Ummah Shop BD',
  tagline: 'বিশুদ্ধতা ও স্বাদের নিশ্চয়তা',
  subtitle: 'বিশুদ্ধ অর্গানিক পণ্য, সবার জন্য',
  phone: '01770-241803',
  rawPhone: '01770241803',
  whatsappUrl:
    'https://wa.me/8801770241803?text=%E0%A6%86%E0%A6%B8%E0%A6%B8%E0%A6%BE%E0%A6%B2%E0%A6%BE%E0%A6%AE%E0%A7%81%20%E0%A6%86%E0%A6%B2%E0%A6%BE%E0%A6%87%E0%A6%95%E0%A7%81%E0%A6%AE%2C%20%E0%A6%86%E0%A6%AE%E0%A6%BF%20%E0%A6%85%E0%A6%B0%E0%A7%8D%E0%A6%97%E0%A6%BE%E0%A6%A8%E0%A6%BF%E0%A6%95%20%E0%A6%AA%E0%A6%A3%E0%A7%8D%E0%A6%AF%20%E0%A6%B8%E0%A6%AE%E0%A7%8D%E0%A6%AA%E0%A6%B0%E0%A7%8D%E0%A6%95%E0%A7%87%20%E0%A6%9C%E0%A6%BE%E0%A6%A8%E0%A6%A4%E0%A7%87%20%E0%A6%9A%E0%A6%BE%E0%A6%87',
  email: 'khidmatulummahshopbd@gmail.com',
  supportEmail: 'khidmanutrition@gmail.com',
  appUrl: 'https://ais-pre-5hlnx34wrphcdtpfit2xmm-475033072063.asia-northeast1.run.app',
  devAppUrl: 'https://ais-dev-5hlnx34wrphcdtpfit2xmm-475033072063.asia-northeast1.run.app',
  origin: 'সরোজগঞ্জ বাজার, চুয়াডাঙ্গা সদর, বাংলাদেশ',
  hubAddress: 'মিরপুর-১০, ঢাকা ও সরোজগঞ্জ বাজার, চুয়াডাঙ্গা',
  supportHours: 'প্রতিদিন সকাল ৯টা – রাত ১০টা',
  developerTeam: 'Tech Team',
};

export const CATEGORIES: CategoryItem[] = [
  {
    slug: 'patali',
    name: 'পাটালি গুড়',
    subLabel: 'Patali Gur',
    image: GUR_IMAGES.pataliGur,
  },
  {
    slug: 'danadar',
    name: 'দানাদার গুড়',
    subLabel: 'Danadar Gur',
    image: GUR_IMAGES.danadarGur,
  },
  {
    slug: 'jhola',
    name: 'ঝোলা গুড়',
    subLabel: 'Jhola Gur',
    image: GUR_IMAGES.jholaGur,
  },
  {
    slug: 'honey',
    name: 'প্রাকৃতিক মধু',
    subLabel: 'Raw Honey',
    image: ORGANIC_IMAGES.kalojiraHoney,
  },
  {
    slug: 'ghee-oil',
    name: 'ঘি ও তেল',
    subLabel: 'Ghee & Oils',
    image: ORGANIC_IMAGES.desiGhee,
  },
  {
    slug: 'dates-nuts',
    name: 'খেজুর ও বাদাম',
    subLabel: 'Dates & Nuts',
    image: ORGANIC_IMAGES.honeyNuts,
  },
  {
    slug: 'spices-seeds',
    name: 'মসলা ও সিডস',
    subLabel: 'Spices & Seeds',
    image: ORGANIC_IMAGES.chiaSeeds,
  },
  {
    slug: 'combo',
    name: 'কম্বো প্যাক',
    subLabel: 'Combo Savers',
    image: GUR_IMAGES.heroGur,
  },
];

export const ACTIVE_VOUCHERS: VoucherItem[] = [
  {
    code: 'WINTER50',
    title: 'শীতের স্পেশাল ৫০ টাকা ছাড়',
    discount: 50,
    minSpend: 500,
    expiry: '৩০ নভেম্বর পর্যন্ত',
  },
  {
    code: 'GUR100',
    title: 'অর্গানিক ও কম্বো অর্ডারে ১০০ টাকা ছাড়',
    discount: 100,
    minSpend: 1200,
    expiry: '১৫ ডিসেম্বর পর্যন্ত',
  },
];

export const DIVISIONS_CITIES: Record<string, string[]> = {
  ঢাকা: ['ঢাকা', 'গাজীপুর', 'নারায়ণগঞ্জ', 'টাঙ্গাইল', 'ফরিদপুর'],
  খুলনা: ['চুয়াডাঙ্গা', 'খুলনা', 'যশোর', 'কুষ্টিয়া', 'ঝিনাইদহ', 'মেহেরপুর'],
  চট্টগ্রাম: ['চট্টগ্রাম', 'কুমিল্লা'],
  রাজশাহী: ['রাজশাহী', 'বগুড়া'],
  সিলেট: ['সিলেট'],
  রংপুর: ['রংপুর'],
  বরিশাল: ['বরিশাল'],
  ময়মনসিংহ: ['ময়মনসিংহ'],
};

export const PRODUCTS: Product[] = [
  {
    id: 'patali-gur',
    sku: 'KU-GUR-01',
    name: 'চুয়াডাঙ্গার খাঁটি পাটালি গুড়',
    englishName: 'Chuadanga Pure Patali Gur',
    shortDesc: 'ফয়েল প্যাকে শক্ত পাটালি',
    category: 'patali',
    categoryLabel: 'পাটালি গুড়',
    brand: 'চুয়াডাঙ্গা গাছি সংগ্রহ',
    price: 600,
    originalPrice: 680,
    discountPercent: 12,
    soldCount: 150,
    promoLabel: '৳ 80 off with Promo',
    tag: 'সবচেয়ে জনপ্রিয়',
    badge: '১০০% দানাদার পাটালি',
    inStock: true,
    isHotDeal: true,
    image: GUR_IMAGES.pataliGur,
    gallery: [
      GUR_IMAGES.pataliGur,
      GUR_IMAGES.kholaPatali,
      GUR_IMAGES.vangaPatali,
      GUR_IMAGES.packLabel,
    ],
    origin: 'চুয়াডাঙ্গা সদর · গাছিদের নিজস্ব রস',
    description:
      'চুয়াডাঙ্গার গাছিদের নিজস্ব রস থেকে মাটির চুলায় নিখুঁত জ্বাল দিয়ে তৈরি। উপরে মসৃণ ও ভাঙলে ভেতরে সোনালী দানার অপূর্ব টেক্সচার।',
    features: [
      'কোনো চিনি, হাইড্রোজ বা কৃত্রিম রং নেই',
      'ফুড গ্রেড প্রিমিয়াম ফয়েল প্যাকেজিং',
      'মুখে দিলেই গলে যাবে, প্রকৃত মিষ্টি সুবাস',
    ],
    variants: [
      { id: 'patali-1kg', label: '১ কেজি ফয়েল প্যাক', weightKg: 1, price: 600, originalPrice: 680 },
      { id: 'patali-2kg', label: '২ কেজি ফয়েল প্যাক', weightKg: 2, price: 1200, originalPrice: 1360 },
      { id: 'patali-3kg', label: '৩ কেজি ফ্যামিলি প্যাক', weightKg: 3, price: 1800, originalPrice: 2040 },
    ],
  },
  {
    id: 'sundarban-raw-honey',
    sku: 'KU-HNY-01',
    name: 'সুন্দরবনের প্রাকৃতিক খাঁটি মধু (Raw Honey)',
    englishName: 'Sundarban Pure Raw Forest Honey',
    shortDesc: 'বনের চাক থেকে সরাসরি সংগৃহীত',
    category: 'honey',
    categoryLabel: 'প্রাকৃতিক মধু',
    brand: 'খিদমাতুল উম্মাহ অর্গানিক',
    price: 750,
    originalPrice: 900,
    discountPercent: 17,
    soldCount: 132,
    promoLabel: '৳ 150 off with Promo',
    tag: 'বেস্ট সেলার মধু',
    badge: '১০০% র-হানি',
    inStock: true,
    isHotDeal: true,
    image: ORGANIC_IMAGES.rawHoney,
    gallery: [
      ORGANIC_IMAGES.rawHoney,
      ORGANIC_IMAGES.kalojiraHoney,
      ORGANIC_IMAGES.bannerHoney,
      ORGANIC_IMAGES.honeyNuts,
    ],
    origin: 'সুন্দরবন · মৌয়ালদের সরাসরি সংগ্রহ',
    description:
      'সুন্দরবনের গহীন অরণ্য থেকে মৌয়ালদের মাধ্যমে সংগৃহীত সম্পূর্ণ প্রাকৃতিক ও আন-প্রসেসড খাঁটি মধু। কোনো চিনি বা সিরাপ মিশ্রিত নয়।',
    features: [
      'কোনো হিটিং বা প্রসেসিং ছাড়াই সরাসরি বোতলজাত',
      'রোগ প্রতিরোধ ক্ষমতা বাড়াতে প্রতিদিন ১ চামচ আদর্শ',
      'ল্যাব টেস্টেড ও বিশুদ্ধতার শতভাগ গ্যারান্টি',
    ],
    variants: [
      { id: 'raw-honey-500g', label: '৫০০ গ্রাম গ্লাস জার', weightKg: 0.5, price: 750, originalPrice: 900 },
      { id: 'raw-honey-1kg', label: '১ কেজি ফ্যামিলি জার', weightKg: 1, price: 1450, originalPrice: 1750 },
    ],
  },
  {
    id: 'kalojira-honey',
    sku: 'KU-HNY-02',
    name: 'খাঁটি কালোজিরা ফুলের মধু (Black Seed Honey)',
    englishName: 'Organic Black Seed Flower Honey',
    shortDesc: 'ভেষজ গুণে ভরপুর খাঁটি মধু',
    category: 'honey',
    categoryLabel: 'প্রাকৃতিক মধু',
    brand: 'খিদমাতুল উম্মাহ অর্গানিক',
    price: 820,
    originalPrice: 980,
    discountPercent: 16,
    soldCount: 94,
    stockLeft: 5,
    promoLabel: '৳ 160 off with Promo',
    tag: 'রোগ প্রতিরোধক',
    badge: 'কালোজিরা ফ্লেভার',
    inStock: true,
    isHotDeal: true,
    image: ORGANIC_IMAGES.kalojiraHoney,
    gallery: [
      ORGANIC_IMAGES.kalojiraHoney,
      ORGANIC_IMAGES.rawHoney,
      ORGANIC_IMAGES.blackSeedOil,
      ORGANIC_IMAGES.bannerHoney,
    ],
    origin: 'শরীয়তপুর ও মাদারীপুর · কালোজিরা ক্ষেত',
    description:
      'মৌমাছির খামারে কালোজিরা ফুলের মৌসুমে সংগৃহীত বিশুদ্ধ কালোজিরা মধু। গাঢ় রঙ ও অসাধারণ সুবাসের সাথে প্রাকৃতিক অ্যান্টিঅক্সিডেন্টে ভরপুর।',
    features: [
      'শীতকালে সর্দি-কাশি ও রোগ প্রতিরোধে অত্যন্ত কার্যকর',
      'গাঢ় টেক্সচার ও আসল কালোজিরা ফুলের ঘ্রাণ',
      'নিরাপদ ফুড-গ্রেড গ্লাস জারে ডেলিভারি',
    ],
    variants: [
      { id: 'kalojira-honey-500g', label: '৫০০ গ্রাম জার', weightKg: 0.5, price: 820, originalPrice: 980 },
      { id: 'kalojira-honey-1kg', label: '১ কেজি জার', weightKg: 1, price: 1550, originalPrice: 1850 },
    ],
  },
  {
    id: 'desi-gawa-ghee',
    sku: 'KU-GHE-01',
    name: 'সিরাজগঞ্জের খাঁটি দেশি গাওয়া ঘি (Desi Ghee)',
    englishName: 'Pure Sirajganj Desi Cow Gawa Ghee',
    shortDesc: 'দানাদার ও অতুলনীয় ঘ্রাণযুক্ত ঘি',
    category: 'ghee-oil',
    categoryLabel: 'ঘি ও তেল',
    brand: 'খিদমাতুল উম্মাহ অর্গানিক',
    price: 780,
    originalPrice: 890,
    discountPercent: 12,
    soldCount: 118,
    promoLabel: '৳ 110 off with Promo',
    tag: 'খাঁটি গরুর দুধের ঘি',
    badge: 'সোনালী দানাদার ঘি',
    inStock: true,
    isHotDeal: true,
    image: ORGANIC_IMAGES.desiGhee,
    gallery: [
      ORGANIC_IMAGES.desiGhee,
      ORGANIC_IMAGES.heroHarvest,
      ORGANIC_IMAGES.mustardOil,
    ],
    origin: 'সিরাজগঞ্জ ও পাবনা · বাথানের গরুর দুধ',
    description:
      'বাথানের সুস্থ দেশি গরুর খাঁটি দুধ থেকে মাখন তুলে ঐতিহ্যবাহী পদ্ধতিতে জ্বাল দিয়ে তৈরি দানাদার গাওয়া ঘি। গরম ভাতে বা পোলাও-বিরিয়ানিতে অতুলনীয়।',
    features: [
      'কোনো ডালডা, পাম অয়েল বা কৃত্রিম ফ্লেভার নেই',
      'দানাদার সোনালী রঙ ও মন মাতানো খাঁটি সুবাস',
      'শিশু ও বড়দের প্রতিদিনের স্বাস্থ্যকর ফ্যাটের সেরা উৎস',
    ],
    variants: [
      { id: 'ghee-250g', label: '২৫০ গ্রাম গ্লাস জার', weightKg: 0.25, price: 410, originalPrice: 460 },
      { id: 'ghee-500g', label: '৫০০ গ্রাম গ্লাস জার', weightKg: 0.5, price: 780, originalPrice: 890 },
      { id: 'ghee-1kg', label: '১ কেজি ফ্যামিলি জার', weightKg: 1, price: 1500, originalPrice: 1720 },
    ],
  },
  {
    id: 'ghani-mustard-oil',
    sku: 'KU-OIL-01',
    name: 'কাঠের ঘানি ভাঙা খাঁটি সরিষার তেল',
    englishName: 'Wooden Ghani Cold-Pressed Mustard Oil',
    shortDesc: 'প্রাকৃতিক ঝাঁঝ ও বিশুদ্ধতায় সেরা',
    category: 'ghee-oil',
    categoryLabel: 'ঘি ও তেল',
    brand: 'খিদমাতুল উম্মাহ অর্গানিক',
    price: 310,
    originalPrice: 360,
    discountPercent: 14,
    soldCount: 185,
    promoLabel: '৳ 50 off with Promo',
    tag: 'ঘানি ভাঙা তেল',
    badge: '১০০% কোল্ড-প্রেসড',
    inStock: true,
    isHotDeal: true,
    image: ORGANIC_IMAGES.mustardOil,
    gallery: [
      ORGANIC_IMAGES.mustardOil,
      ORGANIC_IMAGES.bannerOil,
      ORGANIC_IMAGES.blackSeedOil,
      ORGANIC_IMAGES.coconutOil,
    ],
    origin: 'চুয়াডাঙ্গা ও রাজশাহী · দেশি মাঘী সরিষা',
    description:
      'বাছাইকৃত দেশি মাঘী সরিষা রোদে শুকিয়ে তেঁতুল কাঠের ঘানিতে ভাঙানো সম্পূর্ণ খাঁটি সরিষার তেল। প্রতিদিনের রান্না, ভর্তা ও শরীরে মালিশের জন্য আদর্শ।',
    features: [
      'কোনো পাম অয়েল বা আর্টিফিশিয়াল এসেন্স নেই',
      'চোখ ও নাকে লাগা খাঁটি প্রাকৃতিক ঝাঁঝ',
      'ফুড-গ্রেড লিক-প্রুফ বোতলে নিরাপদ ডেলিভারি',
    ],
    variants: [
      { id: 'mustard-1l', label: '১ লিটার বোতল', weightKg: 1, price: 310, originalPrice: 360 },
      { id: 'mustard-2l', label: '২ লিটার বোতল', weightKg: 2, price: 610, originalPrice: 720 },
      { id: 'mustard-5l', label: '৫ লিটার ফ্যামিলি জার', weightKg: 5, price: 1490, originalPrice: 1750 },
    ],
  },
  {
    id: 'honey-nuts-modhumoy',
    sku: 'KU-NUT-01',
    name: 'মধুময় বাদাম (Honey Mixed Premium Nuts)',
    englishName: 'Organic Honey Nuts Power Booster Jar',
    shortDesc: 'খাঁটি মধু ও ৭ পদের প্রিমিয়াম বাদাম',
    category: 'dates-nuts',
    categoryLabel: 'খেজুর ও বাদাম',
    brand: 'খিদমাতুল উম্মাহ স্পেশাল',
    price: 690,
    originalPrice: 850,
    discountPercent: 19,
    soldCount: 140,
    stockLeft: 3,
    promoLabel: '৳ 160 off with Promo',
    tag: 'সুপার এনার্জি বুস্টার',
    badge: '৭ পদের বাদাম + মধু',
    inStock: true,
    isHotDeal: true,
    image: ORGANIC_IMAGES.honeyNuts,
    gallery: [
      ORGANIC_IMAGES.honeyNuts,
      ORGANIC_IMAGES.datesSuperfoods,
      ORGANIC_IMAGES.rawHoney,
    ],
    origin: 'প্রিমিয়াম ইমপোর্টেড বাদাম + সুন্দরবন মধু',
    description:
      'কাঠবাদাম, কাজুবাদাম, পেস্তাবাদাম, আখরোট, চিনা বাদাম, কিসমিস এবং ত্বীন/খেজুর একসাথে সুন্দরবনের খাঁটি মধুতে ডুবিয়ে তৈরি পুষ্টিকর মধুময় বাদাম।',
    features: [
      'দৈনন্দিন ক্লান্তি দূর করে ও শারীরিক শক্তি জোগায়',
      '৮০% রোস্টেড প্রিমিয়াম বাদাম ও ২০% বিশুদ্ধ মধু',
      'বয়স্ক, শিক্ষার্থী ও জিম-প্রেমীদের জন্য দারুণ কার্যকর',
    ],
    variants: [
      { id: 'honeynut-400g', label: '৪০০ গ্রাম গ্লাস জার', weightKg: 0.4, price: 690, originalPrice: 850 },
      { id: 'honeynut-800g', label: '৮০০ গ্রাম ফ্যামিলি জার', weightKg: 0.8, price: 1320, originalPrice: 1650 },
    ],
  },
  {
    id: 'danadar-gur',
    sku: 'KU-GUR-02',
    name: 'সোনালী দানাদার খেজুরের গুড়',
    englishName: 'Golden Danadar Khejur Gur',
    shortDesc: 'বয়ামে সোনালী দানাদার',
    category: 'danadar',
    categoryLabel: 'দানাদার গুড়',
    brand: 'চুয়াডাঙ্গা গাছি সংগ্রহ',
    price: 450,
    originalPrice: 520,
    discountPercent: 13,
    soldCount: 89,
    stockLeft: 4,
    promoLabel: '৳ 70 off with Promo',
    tag: 'শীতের আসল ঘ্রাণ',
    badge: 'দানাদার টেক্সচার',
    inStock: true,
    image: GUR_IMAGES.danadarGur,
    gallery: [
      GUR_IMAGES.danadarGur,
      GUR_IMAGES.packLabel,
      GUR_IMAGES.heroGur,
      GUR_IMAGES.vangaPatali,
    ],
    origin: 'চুয়াডাঙ্গা · সকালের তাজা ঘন রস',
    description:
      'সকালের তাজা ঘন রস থেকে তৈরি অপরূপ সুবাসিত সোনালী দানাদার গুড়। পিঠা, পায়েস ও চা-কফির জন্য অসাধারণ উপাদেয়।',
    features: [
      'চামচে তুললেই মন মাতানো সোনালী দানার ঝলক',
      'বায়ুরোধী নিরাপদ ফুডগ্রেড বয়ামে প্যাক করা',
      'প্রাকৃতিক মিষ্টি ও স্বাস্থ্যসম্মত পুষ্টিগুণে ভরপুর',
    ],
    variants: [
      { id: 'danadar-1kg', label: '১ কেজি বয়াম', weightKg: 1, price: 450, originalPrice: 520 },
      { id: 'danadar-2kg', label: '২ কেজি বয়াম', weightKg: 2, price: 900, originalPrice: 1040 },
      { id: 'danadar-3kg', label: '৩ কেজি ফ্যামিলি প্যাক', weightKg: 3, price: 1350, originalPrice: 1560 },
    ],
  },
  {
    id: 'jhola-gur',
    sku: 'KU-GUR-03',
    name: 'খাঁটি ঝোলা / লিকুইড গুড়',
    englishName: 'Pure Jhola Liquid Gur',
    shortDesc: 'ঘন পাতলা খাঁটি রস',
    category: 'jhola',
    categoryLabel: 'ঝোলা গুড়',
    brand: 'চুয়াডাঙ্গা গাছি সংগ্রহ',
    price: 450,
    originalPrice: 500,
    discountPercent: 10,
    soldCount: 64,
    promoLabel: '৳ 50 off with Promo',
    tag: 'পিঠার সেরা সঙ্গী',
    badge: 'ঘন লিকুইড রস',
    inStock: true,
    image: GUR_IMAGES.jholaGur,
    gallery: [
      GUR_IMAGES.jholaGur,
      GUR_IMAGES.heroGur,
      GUR_IMAGES.packLabel,
      GUR_IMAGES.danadarGur,
    ],
    origin: 'চুয়াডাঙ্গা · সরাসরি রস জ্বাল',
    description:
      'শীতের সকালে ভাপা পিঠা, চিতই পিঠা ও ক্ষীরের সাথে পরিবেশনের সেরা খাঁটি ঝোলা গুড়। অপূর্ব সোনালী লালচে রঙ ও অতুলনীয় স্বাদ।',
    features: [
      'সরাসরি রস জ্বাল দিয়ে তৈরি প্রাকৃতিক ঘনত্ব',
      'লিক প্রুফ বোতলে সম্পূর্ণ নিরাপদ ডেলিভারি',
      'চিতই ও ভাপা পিঠার ঐতিহ্যবাহী সঙ্গী',
    ],
    variants: [
      { id: 'jhola-1kg', label: '১ কেজি লিক-প্রুফ বোতল', weightKg: 1, price: 450, originalPrice: 500 },
      { id: 'jhola-2kg', label: '২ কেজি (২ বোতল)', weightKg: 2, price: 900, originalPrice: 1000 },
    ],
  },
  {
    id: 'black-seed-oil',
    sku: 'KU-OIL-02',
    name: 'খাঁটি কালোজিরার তেল (Cold-Pressed Black Seed Oil)',
    englishName: '100% Pure Cold-Pressed Kalojira Oil',
    shortDesc: 'একবার ভাঙানো বিশুদ্ধ কালোজিরা তেল',
    category: 'ghee-oil',
    categoryLabel: 'ঘি ও তেল',
    brand: 'খিদমাতুল উম্মাহ অর্গানিক',
    price: 550,
    originalPrice: 650,
    discountPercent: 15,
    soldCount: 78,
    promoLabel: '৳ 100 off with Promo',
    tag: 'সর্বরোগের মহৌষধ',
    badge: '১ম প্রেস ভার্জিন',
    inStock: true,
    image: ORGANIC_IMAGES.blackSeedOil,
    gallery: [
      ORGANIC_IMAGES.blackSeedOil,
      ORGANIC_IMAGES.kalojiraHoney,
      ORGANIC_IMAGES.mustardOil,
    ],
    origin: 'দেশি কালোজিরা · কোল্ড-প্রেসড নিষ্কাশন',
    description:
      'উন্নত মানের দেশি কালোজিরা পরিষ্কার করে কোল্ড-প্রেস মেশিনে প্রথম প্রেস থেকে সংগৃহীত সম্পূর্ণ খাঁটি ও ভেজালমুক্ত তেল।',
    features: [
      'খাবার ও চুলের যত্ন উভয়ের জন্যই শতভাগ নিরাপদ',
      'কোনো সলভেন্ট বা রাসায়নিক রিফাইনিং নেই',
      'মধু ও কালোজিরা তেল একসাথে খাওয়ায় দ্বিগুণ উপকার',
    ],
    variants: [
      { id: 'kalojira-oil-250ml', label: '২৫০ মিলি গ্লাস বোতল', weightKg: 0.25, price: 550, originalPrice: 650 },
      { id: 'kalojira-oil-500ml', label: '৫০০ মিলি বোতল', weightKg: 0.5, price: 1050, originalPrice: 1250 },
    ],
  },
  {
    id: 'virgin-coconut-oil',
    sku: 'KU-OIL-03',
    name: 'এক্সট্রা ভার্জিন নারিকেল তেল (Virgin Coconut Oil)',
    englishName: 'Cold-Pressed Extra Virgin Coconut Oil',
    shortDesc: 'খাওয়া ও স্কিন-হেয়ার কেয়ারের সেরা তেল',
    category: 'ghee-oil',
    categoryLabel: 'ঘি ও তেল',
    brand: 'খিদমাতুল উম্মাহ অর্গানিক',
    price: 490,
    originalPrice: 580,
    discountPercent: 16,
    soldCount: 62,
    promoLabel: '৳ 90 off with Promo',
    tag: 'কেটো ডায়েট ও চুলের যত্ন',
    badge: '১০০% ভার্জিন অয়েল',
    inStock: true,
    image: ORGANIC_IMAGES.coconutOil,
    gallery: [
      ORGANIC_IMAGES.coconutOil,
      ORGANIC_IMAGES.mustardOil,
      ORGANIC_IMAGES.blackSeedOil,
    ],
    origin: 'দক্ষিণবঙ্গের তাজা নারিকেল · সেন্ট্রিফিউজ এক্সট্রাক্টেড',
    description:
      'কাঁচা নারিকেলের দুধ থেকে কোনো তাপ ছাড়া তৈরি ক্রিস্টাল-ক্লিয়ার এক্সট্রা ভার্জিন নারিকেল তেল। কিটো ডায়েট কুকিং, শিশুর ত্বক ও চুলের যত্নে দারুণ কার্যকর।',
    features: [
      'সম্পূর্ণ এডিবল (খাওয়ার উপযোগী) ও প্রাকৃতিক সুবাসযুক্ত',
      'শীতকালে জমে সাদা ক্রিমের মতো হয়ে যাওয়াই খাঁটিত্বের প্রমাণ',
      'কোনো মিনারেল অয়েল বা প্যারাফিন নেই',
    ],
    variants: [
      { id: 'coco-300ml', label: '৩০০ মিলি গ্লাস জার', weightKg: 0.3, price: 490, originalPrice: 580 },
      { id: 'coco-500ml', label: '৫০০ মিলি গ্লাস জার', weightKg: 0.5, price: 780, originalPrice: 920 },
    ],
  },
  {
    id: 'chia-mixed-seeds',
    sku: 'KU-SED-01',
    name: 'অর্গানিক চিয়া সিড ও সুপারফুড মিক্সড সিডস',
    englishName: 'Organic Chia Seeds & Superfood Seed Mix',
    shortDesc: 'চিয়া, কুমড়া, সূর্যমুখী ও তিসি বীজ',
    category: 'spices-seeds',
    categoryLabel: 'মসলা ও সিডস',
    brand: 'খিদমাতুল উম্মাহ অর্গানিক',
    price: 340,
    originalPrice: 420,
    discountPercent: 19,
    soldCount: 109,
    promoLabel: '৳ 80 off with Promo',
    tag: 'ওয়েট লস ও ফাইবার সমৃদ্ধ',
    badge: 'USDA অর্গানিক গ্রেড',
    inStock: true,
    image: ORGANIC_IMAGES.chiaSeeds,
    gallery: [
      ORGANIC_IMAGES.chiaSeeds,
      ORGANIC_IMAGES.datesSuperfoods,
      ORGANIC_IMAGES.honeyNuts,
    ],
    origin: 'ইমপোর্টেড অর্গানিক সিডস · এয়ার-টাইট জিপলক প্যাক',
    description:
      'ওজন নিয়ন্ত্রণ, হজমশক্তি বৃদ্ধি ও প্রাকৃতিক ওমেগা-৩ পেতে সেরা অর্গানিক চিয়া সিড এবং কুমড়া, সূর্যমুখী ও তিসি বীজের প্রিমিয়াম সুপারফুড।',
    features: [
      'ধুলোবালিমুক্ত ক্লিন-সর্টেড ১০০% বিশুদ্ধ বীজ',
      'সকালে লেবু-পানি বা দই-ওটসের সাথে খাওয়ার জন্য উপযুক্ত',
      'প্রচুর ফাইবার, প্রোটিন ও ক্যালসিয়াম সমৃদ্ধ',
    ],
    variants: [
      { id: 'chia-250g', label: '২৫০ গ্রাম চিয়া ও সিডস প্যাক', weightKg: 0.25, price: 280, originalPrice: 340 },
      { id: 'chia-500g', label: '৫০০ গ্রাম ফ্যামিলি প্যাক', weightKg: 0.5, price: 520, originalPrice: 640 },
    ],
  },
  {
    id: 'medjool-ajwa-dates',
    sku: 'KU-DAT-01',
    name: 'মদিনার প্রিমিয়াম আজওয়া ও মেদজুল খেজুর কম্বো',
    englishName: 'Madina Ajwa & Medjool Organic Dates Pack',
    shortDesc: 'তাজা নরম ও সুমিষ্ট মদিনার খেজুর',
    category: 'dates-nuts',
    categoryLabel: 'খেজুর ও বাদাম',
    brand: 'খিদমাতুল উম্মাহ অর্গানিক',
    price: 850,
    originalPrice: 990,
    discountPercent: 14,
    soldCount: 73,
    promoLabel: '৳ 140 off with Promo',
    tag: 'মদিনার সুন্নতি খেজুর',
    badge: 'ভিআইপি ফ্রেশ স্টক',
    inStock: true,
    image: ORGANIC_IMAGES.datesSuperfoods,
    gallery: [
      ORGANIC_IMAGES.datesSuperfoods,
      ORGANIC_IMAGES.honeyNuts,
      ORGANIC_IMAGES.chiaSeeds,
    ],
    origin: 'আল-মদিনা, সৌদি আরব · কোল্ড চেইন স্টোরেজ',
    description:
      'সরাসরি মদিনা থেকে আমদানিকৃত ফ্রেশ, নরম এবং প্রাকৃতিক মিষ্টিযুক্ত আজওয়া ও মেদজুল খেজুর। ইফতার বা প্রতিদিনের পুষ্টিকর নাস্তায় সেরা।',
    features: [
      'কোনো কৃত্রিম গ্লুকোজ সিরাপ বা চিনি স্প্রে করা নয়',
      'নরম ও রসালো টেক্সচার, কোল্ড স্টোরেজে সংরক্ষিত',
      'হৃদরোগ ও আয়রনের ঘাটতি পূরণে অত্যন্ত উপকারী',
    ],
    variants: [
      { id: 'dates-500g', label: '৫০০ গ্রাম প্রিমিয়াম বক্স', weightKg: 0.5, price: 850, originalPrice: 990 },
      { id: 'dates-1kg', label: '১ কেজি ফ্যামিলি বক্স', weightKg: 1, price: 1650, originalPrice: 1950 },
    ],
  },
  {
    id: 'organic-spices-combo',
    sku: 'KU-SPC-01',
    name: 'দেশি খাঁটি হলুদ-মরিচ-ধনিয়া মসলা কম্বো',
    englishName: 'Pure Stone-Ground Deshi Spices Combo',
    shortDesc: 'নিজস্ব মিলে ভাঙানো খাঁটি মসলা',
    category: 'spices-seeds',
    categoryLabel: 'মসলা ও সিডস',
    brand: 'খিদমাতুল উম্মাহ অর্গানিক',
    price: 490,
    originalPrice: 580,
    discountPercent: 16,
    soldCount: 84,
    promoLabel: '৳ 90 off with Promo',
    tag: 'ভেজাল ও রংমুক্ত মসলা',
    badge: 'খাঁটি হোমমেড',
    inStock: true,
    image: ORGANIC_IMAGES.spicesCombo,
    gallery: [
      ORGANIC_IMAGES.spicesCombo,
      ORGANIC_IMAGES.mustardOil,
      ORGANIC_IMAGES.heroHarvest,
    ],
    origin: 'পাবনা ও বগুড়া · বাছাইকৃত গোটা মসলা থেকে ভাঙানো',
    description:
      'আস্ত দেশি হলুদ, মরিচ, ধনিয়া ও জিরা ভালোভাবে ধুয়ে রোদে শুকিয়ে নিজস্ব মিলে ভাঙানো খাঁটি গুঁড়া মসলা। কোনো ইটের গুঁড়া বা কৃত্রিম রং নেই।',
    features: [
      'রান্নায় অসাধারণ প্রাকৃতিক রঙ ও খাঁটি ঘ্রাণ',
      'হলুদ ২৫০গ + মরিচ ২৫০গ + ধনিয়া ২৫০গ একসাথে কম্বো',
      'জীবাণুমুক্ত এয়ার-টাইট পাউচে সরবরাহ',
    ],
    variants: [
      { id: 'spice-750g', label: '৭৫০ গ্রাম ৩ পদের কম্বো', weightKg: 0.75, price: 490, originalPrice: 580 },
      { id: 'spice-1500g', label: '১.৫ কেজি ফ্যামিলি কম্বো', weightKg: 1.5, price: 950, originalPrice: 1120 },
    ],
  },
  {
    id: 'triple-combo',
    sku: 'KU-CMB-04',
    name: 'শীতের ট্রিপল গুড় কম্বো প্যাক (৩ কেজি)',
    englishName: 'Winter Triple Khejur Gur Combo 3kg',
    shortDesc: 'পাটালি ১ কেজি + দানাদার ১ কেজি + ঝোলা ১ কেজি',
    category: 'combo',
    categoryLabel: 'কম্বো প্যাক',
    brand: 'খিদমাতুল উম্মাহ স্পেশাল',
    price: 1400,
    originalPrice: 1500,
    discountPercent: 7,
    soldCount: 112,
    stockLeft: 2,
    promoLabel: '৳ 100 Combo Savings',
    tag: 'সেরা অফার · সাশ্রয়ী',
    badge: 'কম্বো সেভার',
    inStock: true,
    image: GUR_IMAGES.heroGur,
    gallery: [
      GUR_IMAGES.heroGur,
      GUR_IMAGES.pataliGur,
      GUR_IMAGES.danadarGur,
      GUR_IMAGES.jholaGur,
      GUR_IMAGES.packLabel,
    ],
    origin: 'চুয়াডাঙ্গা · সম্পূর্ণ ফ্যামিলি কম্বো',
    description:
      'তিনটি গুড়ের স্বাদ একসাথে পেতে আমাদের স্পেশাল ফ্যামিলি কম্বো। পাটালি, দানাদার এবং ঝোলা গুড় প্রতিটি ১ কেজি করে মোট ৩ কেজি।',
    features: [
      'একসাথে ৩টি ভিন্ন স্বাদের আসল অভিজ্ঞতা',
      'রেগুলার দাম ১৫০০ টাকার বদলে মাত্র ১৪০০ টাকা',
      'সারা দেশে যেকোনো জেলায় স্পেশাল ফ্রি ডেলিভারি',
    ],
    variants: [
      {
        id: 'combo-3kg',
        label: '৩ কেজি ট্রিপল কম্বো (পাটালি + দানাদার + ঝোলা)',
        weightKg: 3,
        price: 1400,
        originalPrice: 1500,
      },
      {
        id: 'combo-6kg',
        label: '৬ কেজি মেগা ফ্যামিলি কম্বো (২× সব আইটেম)',
        weightKg: 6,
        price: 2700,
        originalPrice: 3000,
      },
    ],
  },
];

export const GALLERY_PHOTOS: GalleryPhoto[] = [
  {
    id: 'photo-1',
    title: 'লেবেলসহ প্রিমিয়াম ফয়েল প্যাক',
    subtitle: 'বায়ুরোধী প্যাকেজিংয়ে প্রতিটি গুড়ের আসল সুবাস অক্ষুণ্ণ থাকে',
    image: GUR_IMAGES.packLabel,
    category: 'Packaging',
  },
  {
    id: 'photo-2',
    title: 'সুন্দরবনের মধু ও কালোজিরা ফুলের মধু',
    subtitle: 'ল্যাব-টেস্টেড সম্পূর্ণ আন-প্রসেসড খাঁটি র-হানি ও গ্লাস জার',
    image: ORGANIC_IMAGES.kalojiraHoney,
    category: 'Pure Honey',
  },
  {
    id: 'photo-3',
    title: 'মধুময় বাদাম ও মদিনার খেজুর',
    subtitle: '৭ পদের প্রিমিয়াম বাদাম খাঁটি মধুতে মিশিয়ে তৈরি এনার্জি জার',
    image: ORGANIC_IMAGES.honeyNuts,
    category: 'Superfoods',
  },
  {
    id: 'photo-4',
    title: 'সিরাজগঞ্জের খাঁটি দানাদার গাওয়া ঘি',
    subtitle: 'বাথানের দেশি গরুর দুধ থেকে তৈরি আসল সোনালী দানাদার ঘি',
    image: ORGANIC_IMAGES.desiGhee,
    category: 'Desi Ghee',
  },
  {
    id: 'photo-5',
    title: 'ঘানি ভাঙা সরিষা ও এক্সট্রা ভার্জিন নারিকেল তেল',
    subtitle: 'কোনো রাসায়নিক বা পাম অয়েল মুক্ত ১০০% কোল্ড-প্রেসড তেল',
    image: ORGANIC_IMAGES.coconutOil,
    category: 'Cold-Pressed Oils',
  },
  {
    id: 'photo-6',
    title: 'অর্গানিক চিয়া ও সুপারফুড মিক্সড সিডস',
    subtitle: 'প্রতিদিনের ডায়েট, ওমেগা-৩ ও ফাইবারের প্রাকৃতিক উৎস',
    image: ORGANIC_IMAGES.chiaSeeds,
    category: 'Organic Seeds',
  },
];

export const REVIEWS: ReviewItem[] = [
  {
    id: 'rev-1',
    author: 'মোহাম্মদ রফিকুল ইসলাম',
    location: 'উত্তরা সেক্টর ৭, ঢাকা',
    rating: 5,
    date: '২ দিন আগে',
    productName: 'পাটালি গুড় (২ কেজি) ও গাওয়া ঘি',
    comment:
      'আলহামদুলিল্লাহ! ঢাকা শহরে এমন খাঁটি খেজুরের গুড় ও সিরাজগঞ্জের গাওয়া ঘি মেলা সত্যিই ভাগ্যের ব্যাপার। প্যাকেট খুলতেই পুরো ঘরে মিষ্টি সুবাস ছড়িয়ে পড়েছিল।',
  },
  {
    id: 'rev-2',
    author: 'মাহমুদুল হাসান তারেক',
    location: 'পাঁচলাইশ, চট্টগ্রাম',
    rating: 5,
    date: '৪ দিন আগে',
    productName: 'মধুময় বাদাম ও সুন্দরবনের মধু',
    comment:
      'মধুময় বাদাম এবং সুন্দরবনের মধু নিয়েছিলাম। প্রতিটি বাদাম ছিল একদম মচমচে ও ফ্রেশ, আর মধুর স্বাদ সত্যিই অসাধারণ। কুরিয়ারে একদম অক্ষত পেয়েছি।',
  },
  {
    id: 'rev-3',
    author: 'ড. ফারহানা আক্তার',
    location: 'ধানমন্ডি, ঢাকা',
    rating: 5,
    date: '১ সপ্তাহ আগে',
    productName: 'চিয়া সিডস ও ঘানি ভাঙা সরিষার তেল',
    comment:
      'আমি ডাক্তার হিসেবে কেমিক্যালযুক্ত খাবার এড়িয়ে চলি। খিদমাতুল উম্মাহ শপের সরিষার তেল ও চিয়া সিডস শতভাগ পরিচ্ছন্ন ও খাঁটি। নিয়মিত নিচ্ছি।',
  },
];

export const FAQS: FaqItem[] = [
  {
    question: 'ডেলিভারি কতদিনে পাব?',
    answer:
      'ঢাকা ও চুয়াডাঙ্গার ভেতরে সাধারণত ২৪ থেকে ৪৮ ঘণ্টার (১-২ দিন) মধ্যে এবং দেশের বাইরে যেকোনো জেলা শহরে ৪৮ থেকে ৭২ ঘণ্টার (২-৩ দিন) মধ্যে নির্ভরযোগ্য কুরিয়ারে হোম ডেলিভারি পৌঁছে যাবে।',
  },
  {
    question: 'সব অর্গানিক পণ্যের খাঁটিত্বের নিশ্চয়তা কী?',
    answer:
      'আমাদের গুড়, মধু, গাওয়া ঘি, সরিষার তেল এবং মসলা সরাসরি কৃষক, মৌয়াল ও নিজস্ব ঘানি থেকে সংগৃহীত। ডেলিভারির সময় আপনি প্যাকেট খুলে ঘ্রাণ ও মান যাচাই করে পেমেন্ট করতে পারবেন।',
  },
  {
    question: 'পণ্য কতদিন পর্যন্ত ভালো থাকে?',
    answer:
      'প্রতিটি পণ্য সম্পূর্ণ প্রিজারভেটিভমুক্ত। শুকনো ও ঠান্ডা জায়গায় মুখ বন্ধ করে রাখলে মধু, ঘি, তেল ও চিয়া সিডস ৬ থেকে ১২ মাস এবং গুড় নরমাল ফ্রিজে ১ বছর পর্যন্ত ভালো থাকে।',
  },
  {
    question: 'পেমেন্ট কীভাবে পরিশোধ করব?',
    answer:
      'আপনি সম্পূর্ণ ক্যাশ অন ডেলিভারিতে পণ্য হাতে পেয়ে দেখে টাকা পরিশোধ করতে পারবেন অথবা বিকাশ/নগদ (০১৭৭০-২৪১৮০৩) এর মাধ্যমে অগ্রিম পেমেন্ট করতে পারবেন।',
  },
];

export const DISTRICTS = [
  'ঢাকা',
  'চুয়াডাঙ্গা',
  'চট্টগ্রাম',
  'গাজীপুর',
  'নারায়ণগঞ্জ',
  'সিলেট',
  'রাজশাহী',
  'খুলনা',
  'রংপুর',
  'বরিশাল',
  'ময়মনসিংহ',
  'কুমিল্লা',
  'বগুড়া',
  'যশোর',
  'কুষ্টিয়া',
  'ঝিনাইদহ',
  'মেহেরপুর',
  'ফরিদপুর',
  'টাঙ্গাইল',
  'অন্যান্য জেলা',
];

export const SHIPPING_RATES = {
  dhaka: { label: 'ঢাকা / চুয়াডাঙ্গা (২৪–৪৮ ঘণ্টা)', fee: 50 },
  outside: { label: 'সারা বাংলাদেশ অন্যান্য জেলা (৪৮–৭২ ঘণ্টা)', fee: 120 },
} as const;
