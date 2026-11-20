import type {
  CategoryStyleId,
  CmsPageRecord,
  FontStyleId,
  FooterStyleId,
  HeaderStyleId,
  HeroStyleId,
  ProductCardDesignId,
  ShopifyThemeAdvancedConfig,
  ThemePresetId,
  WebsiteTemplateId,
} from '../types';

export interface MasterTemplateKit {
  id: string;
  name: string;
  bnName: string;
  category: 'Marketplace' | 'Organic' | 'Seasonal' | 'Wholesale' | 'Luxury';
  badge: string;
  description: string;
  websiteTemplate: WebsiteTemplateId;
  heroStyle: HeroStyleId;
  headerStyle: HeaderStyleId;
  categoryStyle: CategoryStyleId;
  productCardDesign: ProductCardDesignId;
  footerStyle: FooterStyleId;
  themePreset: ThemePresetId;
  fontStyle: FontStyleId;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  noticeText: string;
  popupTitle: string;
  popupBody: string;
}

export const MASTER_TEMPLATE_KITS: MasterTemplateKit[] = [
  {
    id: 'kit-offertopup-ecommerce',
    name: 'OfferTopUp Royal Violet Store',
    bnName: 'অফারটপআপ রয়্যাল ভায়োলেট ই-কমার্স',
    category: 'Marketplace',
    badge: 'Active Signature',
    description: 'ফ্রস্টেড গ্লাস হেডার, #663CBC ভায়োলেট কালার গ্রেডিং, নোটিশ পালস ও মসৃণ অ্যানিমেশন।',
    websiteTemplate: 'daraz-mall',
    heroStyle: 'classic-mega',
    headerStyle: 'solid-white',
    categoryStyle: 'grid-cards',
    productCardDesign: 'classic-mall',
    footerStyle: 'daraz-3tier',
    themePreset: 'offertopup-violet',
    fontStyle: 'plus-jakarta',
    primaryColor: '#663CBC',
    secondaryColor: '#081149',
    accentColor: '#2563EB',
    backgroundColor: '#EDF4FF',
    noticeText:
      'চুয়াডাঙ্গার খাঁটি পাটালি গুড়, সুন্দরবনের মধু ও শতভাগ অর্গানিক পণ্য সারাদেশে ক্যাশ অন ডেলিভারিতে অর্ডার করুন!',
    popupTitle: 'চুয়াডাঙ্গার খাঁটি খেজুরের গুড় ও শতভাগ অর্গানিক পণ্য',
    popupBody:
      'খিদমাতুল উম্মাহ শপ বিডি থেকে সরাসরি খাঁটি খেজুরের গুড়, সুন্দরবনের মধু ও গাওয়া ঘি অর্ডার করুন।',
  },
  {
    id: 'kit-daraz-pro',
    name: 'Daraz Marketplace Pro',
    bnName: 'দারাজ মার্কেটপ্লেস প্রো',
    category: 'Marketplace',
    badge: 'Flagship Default',
    description: 'বাম মেগা-মেনু, কমলা ফ্ল্যাশ সেল, স্ক্যানযোগ্য ক্যাটাগরি ও ৩-স্তর মার্কেটপ্লেস ফুটার।',
    websiteTemplate: 'daraz-mall',
    heroStyle: 'classic-mega',
    headerStyle: 'solid-white',
    categoryStyle: 'grid-cards',
    productCardDesign: 'classic-mall',
    footerStyle: 'daraz-3tier',
    themePreset: 'daraz-orange',
    fontStyle: 'plus-jakarta',
    primaryColor: '#F85606',
    secondaryColor: '#212121',
    accentColor: '#047857',
    backgroundColor: '#F5F5F5',
    noticeText:
      'চুয়াডাঙ্গার খাঁটি পাটালি গুড়, সুন্দরবনের মধু ও শতভাগ অর্গানিক পণ্য সারাদেশে ক্যাশ অন ডেলিভারিতে অর্ডার করুন!',
    popupTitle: 'চুয়াডাঙ্গার খাঁটি খেজুরের গুড় ও শতভাগ অর্গানিক পণ্য',
    popupBody:
      'খিদমাতুল উম্মাহ শপ বিডি থেকে সরাসরি খাঁটি খেজুরের গুড়, সুন্দরবনের মধু ও গাওয়া ঘি অর্ডার করুন।',
  },
  {
    id: 'kit-sunnah-organic',
    name: 'Sunnah Organic Sanctuary',
    bnName: 'সুন্নাহ অর্গানিক স্যাংচুয়ারি',
    category: 'Organic',
    badge: 'Artisanal',
    description: 'সবুজ সুন্নাহ এডিটোরিয়াল, পরিচ্ছন্ন ব্যানার ও ন্যাচারাল কার্ড ফ্রেম।',
    websiteTemplate: 'artisan-heritage',
    heroStyle: 'split-spotlight',
    headerStyle: 'clean-editorial',
    categoryStyle: 'grid-cards',
    productCardDesign: 'minimal-editorial',
    footerStyle: 'newsletter-split',
    themePreset: 'emerald-sunnah',
    fontStyle: 'hind-bengali',
    primaryColor: '#047857',
    secondaryColor: '#132A1E',
    accentColor: '#D97706',
    backgroundColor: '#F3F7F4',
    noticeText:
      '১০০% সুন্নাহ ও প্রাকৃতিক সংগ্রহ — সুন্দরবনের মধু, মদিনার আজওয়া খেজুর ও খাঁটি গাওয়া ঘি এখন স্টকে!',
    popupTitle: 'সুন্নাহ ও খাঁটি প্রাকৃতিক সুপারফুড সংগ্রহ',
    popupBody:
      'ল্যাব-টেস্টেড শতভাগ বিশুদ্ধ মধু, কালোজিরা তেল, আজওয়া খেজুর ও পাটালি গুড় — প্রাকৃতিক প্যাকেজিংয়ে হোম ডেলিভারি।',
  },
  {
    id: 'kit-luxury-boutique',
    name: 'Midnight Gold Boutique',
    bnName: 'মিডনাইট গোল্ড বুটিক',
    category: 'Luxury',
    badge: 'Premium Dark',
    description: 'অভিজাত ডার্ক হেডার ও ফুটার, সেরিফ শিরোনাম এবং সোনালী অ্যাকসেন্ট ফ্রেম।',
    websiteTemplate: 'luxury-boutique',
    heroStyle: 'full-bleed',
    headerStyle: 'dark-luxury',
    categoryStyle: 'showcase-tiles',
    productCardDesign: 'luxury-framed',
    footerStyle: 'dark-executive',
    themePreset: 'midnight-gold',
    fontStyle: 'serif-luxury',
    primaryColor: '#D97706',
    secondaryColor: '#0F172A',
    accentColor: '#059669',
    backgroundColor: '#F8FAFC',
    noticeText:
      'প্রিমিয়াম গিফট হ্যাম্পার ও রয়্যাল হার্ভেস্ট কালেকশন — ভিআইপি প্যাকেজিং ও প্রায়োরিটি কুরিয়ার ডেলিভারি।',
    popupTitle: 'প্রিমিয়াম গিফট বক্স ও রয়্যাল হার্ভেস্ট',
    popupBody:
      'কর্পোরেট ও পারিবারিক উপহারের জন্য এক্সক্লুসিভ কাঠের ও প্রিমিয়াম বক্সে খাঁটি গুড়, মধু ও খেজুর।',
  },
  {
    id: 'kit-ramadan-eid',
    name: 'Ramadan & Eid Festive',
    bnName: 'রমজান ও ঈদ ফেস্টিভ মল',
    category: 'Seasonal',
    badge: 'Festive',
    description: 'রমজান ও ঈদের বিশেষ খেজুর, বাদাম, ঘি ও সেমাই/পিঠা কম্বো শোকেস।',
    websiteTemplate: 'festive-ramadan',
    heroStyle: 'bento-promo',
    headerStyle: 'brand-gradient',
    categoryStyle: 'scroll-rail',
    productCardDesign: 'rounded-glass',
    footerStyle: 'newsletter-split',
    themePreset: 'gold-heritage',
    fontStyle: 'serif-luxury',
    primaryColor: '#B45309',
    secondaryColor: '#292018',
    accentColor: '#0F766E',
    backgroundColor: '#FBF7F0',
    noticeText:
      'রমজান ও ঈদ মোবারক অফার! আজওয়া খেজুর, মধুময় বাদাম ও ফ্যামিলি কম্বোতে পাচ্ছেন বিশেষ সাশ্রয় + ফ্রি গিফট।',
    popupTitle: 'রমজান ও ঈদ স্পেশাল ইফতার কালেকশন',
    popupBody:
      'মদিনার খেজুর, সুন্দরবনের কাঁচা মধু ও সিরাজগঞ্জের গাওয়া ঘি — ইফতার ও সেহরির পরিপূর্ণ সুন্নাহ প্যাকেজ।',
  },
  {
    id: 'kit-flash-superstore',
    name: 'Flash Deals Superstore',
    bnName: 'ফ্ল্যাশ ডিলস সুপারস্টোর',
    category: 'Marketplace',
    badge: 'High Conversion',
    description: 'হাই-কনট্রাস্ট লাল প্রোমো, বোল্ড ডিল ব্যাজ, কাউন্টডাউন হিরো ও দ্রুত শপ লেআউট।',
    websiteTemplate: 'flash-superstore',
    heroStyle: 'bento-promo',
    headerStyle: 'brand-gradient',
    categoryStyle: 'scroll-rail',
    productCardDesign: 'bold-promo',
    footerStyle: 'daraz-3tier',
    themePreset: 'crimson-mart',
    fontStyle: 'plus-jakarta',
    primaryColor: '#DC2626',
    secondaryColor: '#1F2937',
    accentColor: '#059669',
    backgroundColor: '#F8F9FA',
    noticeText:
      'মেগা ফ্ল্যাশ সেল লাইভ! প্রতি ঘণ্টায় নির্বাচিত অর্গানিক পণ্যে সর্বোচ্চ ৩৫% পর্যন্ত ছাড় — সীমিত স্টক!',
    popupTitle: 'আজকের সুপার ফ্ল্যাশ সেল ৩৫% পর্যন্ত ছাড়!',
    popupBody:
      'স্টক শেষ হওয়ার আগেই কম্বো ও সিঙ্গেল প্যাক অর্ডার করুন। ৳১৫০০+ অর্ডারে সম্পূর্ণ ফ্রি ডেলিভারি!',
  },
  {
    id: 'kit-wholesale-b2b',
    name: 'B2B Wholesale Express',
    bnName: 'পাইকারি ও ডিলার এক্সপ্রেস',
    category: 'Wholesale',
    badge: '5-Column Grid',
    description: 'দোকান, সুপারশপ ও ডিলারদের জন্য ৫-কলাম ক্যাটালগ, MOQ মূল্য ও দ্রুত অর্ডার টেবিল।',
    websiteTemplate: 'compact-wholesale',
    heroStyle: 'split-spotlight',
    headerStyle: 'compact-centered',
    categoryStyle: 'compact-tabs',
    productCardDesign: 'wholesale-tier',
    footerStyle: 'minimal-clean',
    themePreset: 'royal-indigo',
    fontStyle: 'compact-commerce',
    primaryColor: '#4338CA',
    secondaryColor: '#1E1B4B',
    accentColor: '#F59E0B',
    backgroundColor: '#F4F6FB',
    noticeText:
      'পাইকারি ও কর্পোরেট ডিলার পোর্টাল চালু! ন্যূনতম ৫ কেজি/পিস অর্ডারে সরাসরি কারখানা রেট ও কুরিয়ার বুকিং।',
    popupTitle: 'B2B পাইকারি ও ডিলার বিশেষ রেট',
    popupBody:
      'সুপারশপ, মুদি দোকান ও অনলাইন রিসেলারদের জন্য বিশেষ পাইকারি মূল্য তালিকা ও কাস্টম ব্র্যান্ডিং সুবিধা।',
  },
  {
    id: 'kit-single-landing',
    name: 'Direct Conversion Landing',
    bnName: 'ডিরেক্ট ল্যান্ডিং ফানেল',
    category: 'Organic',
    badge: 'One-Page Funnel',
    description: 'এক পাতায় সরাসরি অর্ডার ফরম, ভিডিও শোকেস ও কাস্টমার রিভিউ-ভিত্তিক কনভার্সন ফানেল।',
    websiteTemplate: 'single-product-funnel',
    heroStyle: 'full-bleed',
    headerStyle: 'floating-glass',
    categoryStyle: 'compact-tabs',
    productCardDesign: 'video-spotlight',
    footerStyle: 'minimal-clean',
    themePreset: 'sundarban-honey',
    fontStyle: 'hind-bengali',
    primaryColor: '#C2410C',
    secondaryColor: '#431407',
    accentColor: '#15803D',
    backgroundColor: '#FFFBF5',
    noticeText:
      'ভিডিও দেখে নিশ্চিত হয়ে অর্ডার করুন — চুয়াডাঙ্গার খাঁটি পাটালি গুড় এখন সরাসরি কুরিয়ারে!',
    popupTitle: 'এক ক্লিকে সরাসরি ক্যাশ অন ডেলিভারি অর্ডার',
    popupBody:
      'কোনো অগ্রিম টাকা ছাড়াই অর্ডার করুন। ডেলিভারি ম্যানের সামনে পণ্য দেখে টাকা পরিশোধের সুবিধা।',
  },
  {
    id: 'kit-modern-tea',
    name: 'Modern Tea & Nature',
    bnName: 'মডার্ন গার্ডেন ও ন্যাচার',
    category: 'Organic',
    badge: 'Modern Minimal',
    description: 'মিনিমাল খোলামেলা স্পেস, ফ্লোটিং গ্লাস হেডার ও টিল-সবুজ প্রশান্ত পরিবেশ।',
    websiteTemplate: 'modern-minimal',
    heroStyle: 'full-bleed',
    headerStyle: 'floating-glass',
    categoryStyle: 'grid-cards',
    productCardDesign: 'rounded-glass',
    footerStyle: 'minimal-clean',
    themePreset: 'ocean-teal',
    fontStyle: 'compact-commerce',
    primaryColor: '#0F766E',
    secondaryColor: '#134E4A',
    accentColor: '#D97706',
    backgroundColor: '#F0FDFA',
    noticeText:
      'প্রাকৃতিক ও নির্ভেজাল খাদ্যের নতুন ঠিকানা — প্রতিদিন ফ্রেশ ব্যাচ সরাসরি খামার থেকে আপনার ঘরে।',
    popupTitle: 'ফ্রেশ হার্ভেস্ট উইকলি ড্রপ',
    popupBody:
      'প্রতি সপ্তাহে তাজা খেজুরের গুড়, চাক ভাঙা মধু ও কোল্ড-প্রেসড তেল সংগ্রহ করুন।',
  },
];

export const WEBSITE_TEMPLATES: Array<{
  id: WebsiteTemplateId;
  name: string;
  badge: string;
  desc: string;
  previewTag: string;
}> = [
  {
    id: 'daraz-mall',
    name: 'Daraz Marketplace Pro',
    badge: 'Default',
    desc: 'বাম পাশে মেগা-মেনু + হিরো স্লাইডার + ফ্ল্যাশ সেল + পূর্ণাঙ্গ PLP ফিল্টার সাইডবার',
    previewTag: 'Mega Rail + Multi-Vendor',
  },
  {
    id: 'modern-minimal',
    name: 'Modern Full-Width Hero',
    badge: 'Clean',
    desc: 'চওড়া ফুল-উইডথ ব্যানার স্লাইডার + আধুনিক ক্যাটাগরি গ্রিড ও খোলামেলা ডিজাইন',
    previewTag: 'Full-Width Minimal',
  },
  {
    id: 'artisan-heritage',
    name: 'Artisan Sunnah Heritage',
    badge: 'Organic',
    desc: 'এডিটোরিয়াল স্টোরি ব্যানার, ফোকাসড সার্টিফায়েড ব্যাজ ও গ্রামবাংলার ঐতিহ্য শোকেস',
    previewTag: 'Editorial Story First',
  },
  {
    id: 'compact-wholesale',
    name: 'B2B Wholesale Express',
    badge: '5-Column',
    desc: 'পাইকারি ও দ্রুত অর্ডারের জন্য কমপ্যাক্ট ৫-কলাম ক্যাটালগ ও B2B হাইলাইট',
    previewTag: 'High Density B2B',
  },
  {
    id: 'festive-ramadan',
    name: 'Eid & Ramadan Festive',
    badge: 'Seasonal',
    desc: 'উৎসবের স্পেশাল গিফট কম্বো স্ট্রিপ, খেজুর-মধু হাইলাইট ও গোল্ডেন ব্যানার',
    previewTag: 'Festive Campaign',
  },
  {
    id: 'flash-superstore',
    name: 'Flash Deals Superstore',
    badge: 'Promo',
    desc: 'সর্বোচ্চ কনভার্সন ডিল সেকশন সবার উপরে + হাইলাইটেড ডিসকাউন্ট শোকেস',
    previewTag: 'Deals First Layout',
  },
  {
    id: 'single-product-funnel',
    name: 'One-Page Order Funnel',
    badge: 'Landing',
    desc: 'সরাসরি ওয়ান-স্টেপ অর্ডার সেকশন সবার উপরে নিয়ে আসে দ্রুত কনভার্সনের জন্য',
    previewTag: 'Direct Checkout Top',
  },
  {
    id: 'luxury-boutique',
    name: 'Luxury Organic Boutique',
    badge: 'Boutique',
    desc: 'প্রশস্ত ৩-কলাম আর্টিসান গ্রিড, ফ্রেমড প্রোডাক্ট প্রদর্শনী ও প্রিমিয়াম স্পেসিং',
    previewTag: '3-Col Luxury Space',
  },
];

export const HERO_TEMPLATES: Array<{
  id: HeroStyleId;
  title: string;
  desc: string;
  badge: string;
}> = [
  {
    id: 'classic-mega',
    title: 'Mega Menu + Slider',
    desc: 'বামে ৮-ক্যাটাগরি ফ্লাইআউট মেনু ও ডানে অটো-স্লাইডার',
    badge: 'Marketplace',
  },
  {
    id: 'full-bleed',
    title: 'Full-Width Cinema Hero',
    desc: 'পুরো ১২-কলাম চওড়া ব্যানার স্লাইডার ও কুইক অ্যাকশন ওভারলে',
    badge: 'Clean Wide',
  },
  {
    id: 'split-spotlight',
    title: 'Slider + 2 Spotlight Cards',
    desc: '৮-কলাম মেইন স্লাইডার ও ডানে ২টি ডিল স্পটলাইট প্রোডাক্ট কার্ড',
    badge: 'Dual Promo',
  },
  {
    id: 'bento-promo',
    title: 'Bento Collage Hero',
    desc: 'স্লাইডার + টপ ডিল + ফ্রি শিপিং + কয়েন গেম বেন্টো টাইলস',
    badge: 'Interactive',
  },
];

export const HEADER_TEMPLATES: Array<{
  id: HeaderStyleId;
  title: string;
  desc: string;
}> = [
  { id: 'solid-white', title: 'Daraz Classic White', desc: 'সাদা হেডার + কালার টপ ইউটিলিটি বার' },
  { id: 'brand-gradient', title: 'Full Brand Gradient', desc: 'প্রাইমারি ও সেকেন্ডারি গ্রেডিয়েন্ট বার' },
  { id: 'clean-editorial', title: 'Warm Paper Editorial', desc: 'হালকা ক্রিম কাগজের এলিগ্যান্ট বর্ডার' },
  { id: 'dark-luxury', title: 'Midnight Dark Luxury', desc: 'গাঢ় স্লেট-ব্ল্যাক প্রিমিয়াম নেভবার' },
  { id: 'floating-glass', title: 'Floating Glass Pill', desc: 'স্বচ্ছ গ্লাস ইফেক্ট ও রাউন্ডেড নেভিগেশন' },
  { id: 'compact-centered', title: 'Compact Slim Store', desc: 'স্লিম সিঙ্গেল-লাইন দ্রুতগতির হেডার' },
];

export const CATEGORY_TEMPLATES: Array<{
  id: CategoryStyleId;
  title: string;
  desc: string;
}> = [
  { id: 'grid-cards', title: '8-Column Classic Grid', desc: 'বর্গাকার ফটো ও ডাবল লেবেল বক্স গ্রিড' },
  { id: 'scroll-rail', title: 'Horizontal Capsule Rail', desc: 'মোবাইল ও ডেস্কটপে মসৃণ স্ক্রলিং রিং আইকন' },
  { id: 'compact-tabs', title: 'Compact Clean Tabs', desc: 'দ্রুত ফিল্টারের জন্য স্লিম বাটন ট্যাব স্ট্রিপ' },
  { id: 'showcase-tiles', title: 'Editorial Image Tiles', desc: 'বড় ছবির ওপরে গাঢ় গ্র্যাডিয়েন্ট ক্যাপশন কার্ড' },
];

export const PRODUCT_CARD_TEMPLATES: Array<{
  id: ProductCardDesignId;
  title: string;
  desc: string;
  tag: string;
}> = [
  {
    id: 'classic-mall',
    title: 'Daraz Classic Mall',
    desc: 'ডিসকাউন্ট ব্যাজ, Mall ট্যাগ ও লাল ফ্লেম স্টক প্রগ্রেস বার',
    tag: 'Popular',
  },
  {
    id: 'rounded-glass',
    title: 'Rounded Soft Modern',
    desc: 'নরম রাউন্ডেড কোণা, এলিভেটেড শ্যাডো ও আধুনিক পিল বাটন',
    tag: 'Modern',
  },
  {
    id: 'minimal-editorial',
    title: 'Minimal Editorial',
    desc: 'উৎপাদন অঞ্চল লেবেল, পরিচ্ছন্ন ফ্রেম ও আউটলাইন বাটন',
    tag: 'Clean',
  },
  {
    id: 'bold-promo',
    title: 'Bold Promo Flash',
    desc: 'টপ ব্র্যান্ড স্ট্রিপ, সাশ্রয় টাকার ব্যাজ ও হাই-কনট্রাস্ট CTA',
    tag: 'Conversion',
  },
  {
    id: 'compact-quickshop',
    title: 'Compact Express Grid',
    desc: 'কম প্যাডিংয়ে বেশি পণ্য, দ্রুত প্রাইস + রেটিং ও স্লিম বাটন',
    tag: 'Dense',
  },
  {
    id: 'luxury-framed',
    title: 'Luxury Gold Framed',
    desc: 'উষ্ণ আইভরি ফ্রেম, পরিমিত সেরিফ-স্টাইল শিরোনাম ও রয়্যাল বর্ডার',
    tag: 'Boutique',
  },
  {
    id: 'wholesale-tier',
    title: 'B2B Wholesale Tier',
    desc: 'রিটেইল মূল্যের পাশাপাশি পাইকারি দাম ও ন্যূনতম পরিমাণ প্রদর্শন',
    tag: 'B2B',
  },
  {
    id: 'video-spotlight',
    title: 'Video & Media Spotlight',
    desc: 'প্রোডাক্ট ভিডিও ব্যাজ হাইলাইট ও গ্যালারি হোভার ট্রানজিশন',
    tag: 'Media',
  },
];

export const FOOTER_TEMPLATES: Array<{
  id: FooterStyleId;
  title: string;
  desc: string;
}> = [
  { id: 'daraz-3tier', title: 'Daraz 3-Tier Mall', desc: 'তথ্য + পেমেন্ট গেটওয়ে বার + কপিরাইট স্তর' },
  { id: 'dark-executive', title: 'Dark Executive Slate', desc: 'গাঢ় চারকোল প্রিমিয়াম ফুটার ও উজ্জ্বল লিংক' },
  { id: 'minimal-clean', title: 'Minimal Clean Centered', desc: 'সংক্ষিপ্ত পরিচ্ছন্ন ব্র্যান্ড ও পলিসি ফুটার' },
  { id: 'newsletter-split', title: 'Care & Courier Split', desc: 'হাইলাইটেড ডেলিভারি রেট ও সাপোর্ট বক্স সহ ফুটার' },
];

export const FONT_TEMPLATES: Array<{
  id: FontStyleId;
  title: string;
  desc: string;
  cssFamily: string;
  headingFamily: string;
}> = [
  {
    id: 'plus-jakarta',
    title: 'Plus Jakarta + Hind Siliguri',
    desc: 'আধুনিক ও ভারসাম্যপূর্ণ বাংলা-ইংরেজি মার্কেটপ্লেস ফন্ট',
    cssFamily: '"Plus Jakarta Sans", "Hind Siliguri", system-ui, sans-serif',
    headingFamily: '"Plus Jakarta Sans", "Hind Siliguri", system-ui, sans-serif',
  },
  {
    id: 'hind-bengali',
    title: 'Hind Siliguri Focus (বাংলা)',
    desc: 'বাংলা শিরোনাম ও পণ্যের বিবরণের জন্য অত্যন্ত স্পষ্ট',
    cssFamily: '"Hind Siliguri", "Plus Jakarta Sans", system-ui, sans-serif',
    headingFamily: '"Hind Siliguri", "Plus Jakarta Sans", system-ui, sans-serif',
  },
  {
    id: 'serif-luxury',
    title: 'Playfair Display Boutique',
    desc: 'অভিজাত সেরিফ ইংরেজি শিরোনাম + পরিচ্ছন্ন বাংলা টেক্সট',
    cssFamily: '"DM Sans", "Hind Siliguri", system-ui, sans-serif',
    headingFamily: '"Playfair Display", "Hind Siliguri", Georgia, serif',
  },
  {
    id: 'compact-commerce',
    title: 'DM Sans Crisp Commerce',
    desc: 'সংখ্যা, মূল্য ও দ্রুত কেনাকাটার জন্য কমপ্যাক্ট জিওমেট্রিক ফন্ট',
    cssFamily: '"DM Sans", "Hind Siliguri", system-ui, sans-serif',
    headingFamily: '"DM Sans", "Hind Siliguri", system-ui, sans-serif',
  },
];

export const PROMO_NOTICE_TEMPLATES: Array<{
  id: string;
  name: string;
  noticeText: string;
  popupTitle: string;
  popupBody: string;
}> = [
  {
    id: 'promo-winter-gur',
    name: 'শীতের পাটালি গুড় উৎসব',
    noticeText:
      'শীতের নতুন ব্যাচের খাঁটি চুয়াডাঙ্গা পাটালি ও নলেন ঝোলা গুড় এখন স্টকে! সারাদেশে ক্যাশ অন ডেলিভারি।',
    popupTitle: 'নতুন শীতের খাঁটি খেজুরের গুড়ের ব্যাচ এসেছে!',
    popupBody:
      'গাছ থেকে নামানো তাজা রস থেকে তৈরি পাটালি ও দানাদার গুড় — সরাসরি আপনার দরজায় ২৪-৭২ ঘণ্টায়।',
  },
  {
    id: 'promo-free-delivery',
    name: 'ফ্রি ডেলিভারি মেগা অফার',
    noticeText:
      'বিশেষ অফার! মাত্র ৳১,৫০০+ অর্ডারে ঢাকা ও সারাদেশে সম্পূর্ণ ফ্রি হোম ডেলিভারি সুবিধা উপভোগ করুন।',
    popupTitle: 'সারাদেশে ফ্রি হোম ডেলিভারি ক্যাম্পেইন!',
    popupBody:
      'যেকোনো অর্গানিক কম্বো বা ৳১,৫০০ টাকার বেশি পণ্যে ডেলিভারি চার্জ সম্পূর্ণ ফ্রি!',
  },
  {
    id: 'promo-eid-ramadan',
    name: 'রমজান ও ঈদ সুন্নাহ প্যাক',
    noticeText:
      'রমজান স্পেশাল! মদিনার আজওয়া খেজুর, সুন্দরবনের মধু ও দেশি ঘি প্যাকেজে পাচ্ছেন ১৫% পর্যন্ত বিশেষ ছাড়।',
    popupTitle: 'রমজান ও সুন্নাহ ইফতার কালেকশন',
    popupBody:
      'ইফতার ও সেহরিতে খাঁটি পুষ্টি নিশ্চিত করতে আমাদের বিশেষ সুন্নাহ কম্বো প্যাক বেছে নিন।',
  },
  {
    id: 'promo-flash-weekend',
    name: 'উইকএন্ড ফ্ল্যাশ সেল',
    noticeText:
      '৪৮ ঘণ্টার উইকএন্ড ফ্ল্যাশ সেল! কুপন কোড KHIDMATUL100 ব্যবহার করে পান সাথে সাথে ৳১০০ অতিরিক্ত ছাড়।',
    popupTitle: 'উইকএন্ড ফ্ল্যাশ ডিল — ৳১০০ ফ্ল্যাট ছাড়!',
    popupBody:
      'চেকআউটে KHIDMATUL100 ভাউচার কোড প্রয়োগ করুন আর প্রতিটি অর্ডারে নিশ্চিত সাশ্রয় পান।',
  },
  {
    id: 'promo-b2b-wholesale',
    name: 'পাইকারি ও ডিলার বিজ্ঞপ্তি',
    noticeText:
      'দোকানদার, সুপারশপ ও রিসেলারদের জন্য বিশেষ পাইকারি রেট — ৫+ কেজি/পিস অর্ডারে সরাসরি ফ্যাক্টরি মূল্য।',
    popupTitle: 'হোলসেল ও বিজনেস পার্টনার প্রোগ্রাম',
    popupBody:
      'অ্যাকাউন্ট থেকে Wholesale রেজিস্ট্রেশন করুন অথবা সরাসরি হটলাইনে কল করে পাইকারি রেট নিন।',
  },
  {
    id: 'promo-sundarban-honey',
    name: 'সুন্দরবনের তাজা মধু কালেকশন',
    noticeText:
      'ল্যাব-পরীক্ষিত সুন্দরবনের খলিশা ও কালোজিরা ফুলের খাঁটি মধু — ১০০% বিশুদ্ধতার মানি-ব্যাক গ্যারান্টি।',
    popupTitle: '১০০% খাঁটি সুন্দরবনের র’ মধু এখন স্টকে',
    popupBody:
      'কোনো হিটিং বা প্রসেসিং ছাড়াই সরাসরি মৌচাক থেকে সংগৃহীত কাঁচা মধু এখন সারাদেশে ডেলিভারি হচ্ছে।',
  },
];

export const CMS_STARTER_TEMPLATES: Array<{
  id: string;
  label: string;
  page: Omit<CmsPageRecord, 'updatedAtText'>;
}> = [
  {
    id: 'tpl-story',
    label: 'ব্র্যান্ড স্টোরি ও মিশন',
    page: {
      slug: 'our-story',
      title: 'খিদমাতুল উম্মাহর যাত্রা: গ্রাম থেকে আপনার টেবিলে',
      type: 'page',
      published: true,
      metaTitle: 'আমাদের গল্প | খিদমাতুল উম্মাহ শপ বিডি',
      metaDescription: 'চুয়াডাঙ্গার গাছি ও সুন্দরবনের মৌয়ালদের সাথে আমাদের সরাসরি কাজের গল্প।',
      content:
        'আমাদের লক্ষ্য বাংলাদেশের প্রতিটি পরিবারে শতভাগ ভেজালমুক্ত ও সুন্নাহসম্মত খাঁটি খাদ্য পৌঁছে দেওয়া।\n\n১. সরাসরি উৎস থেকে সংগ্রহ: কোনো মধ্যস্বত্বভোগী ছাড়াই চুয়াডাঙ্গার গাছি, সুন্দরবনের মৌয়াল ও সিরাজগঞ্জের খামারিদের কাছ থেকে পণ্য সংগ্রহ করা হয়।\n২. ব্যাচ-বাই-ব্যাচ মান যাচাই: প্রতিটি চালান প্যাকেজিংয়ের আগে বিশুদ্ধতা পরীক্ষা করা হয়।\n৩. ফুড-গ্রেড হাইজিন: আধুনিক সিল্ড জারে নিরাপদে প্যাকিং করে ৬৪ জেলায় পাঠানো হয়।',
    },
  },
  {
    id: 'tpl-wholesale',
    label: 'পাইকারি ও ডিলার গাইড',
    page: {
      slug: 'wholesale-guide',
      title: 'পাইকারি ও কর্পোরেট ক্রয় নির্দেশিকা (B2B Wholesale)',
      type: 'page',
      published: true,
      metaTitle: 'পাইকারি অর্ডার নীতিমালা | খিদমাতুল উম্মাহ শপ',
      metaDescription: 'সুপারশপ, দোকান ও কর্পোরেট গিফটের জন্য পাইকারি অর্ডার করার নিয়মাবলী।',
      content:
        'দোকান, রেস্টুরেন্ট, সুপারশপ ও কর্পোরেট প্রতিষ্ঠানের জন্য খিদমাতুল উম্মাহ দিচ্ছে সরাসরি হোলসেল সুবিধা।\n\n• ন্যূনতম অর্ডার (MOQ): পণ্যভেদে ৫ কেজি বা ৫ পিস থেকে পাইকারি রেট প্রযোজ্য।\n• ডিসকাউন্ট স্তর: নিয়মিত রিটেইল মূল্যের চেয়ে ১২%–২২% পর্যন্ত সাশ্রয়।\n• কাস্টম প্যাকেজিং: কর্পোরেট গিফট বক্সের জন্য কাস্টম ব্র্যান্ডিং করা যায়।',
    },
  },
  {
    id: 'tpl-gur-test',
    label: 'ব্লগ: খাঁটি গুড় চেনার উপায়',
    page: {
      slug: 'how-to-test-pure-gur',
      title: 'খাঁটি খেজুরের গুড় চেনার ৫টি বৈজ্ঞানিক ও ঘরোয়া পরীক্ষা',
      type: 'blog',
      published: true,
      metaTitle: 'খাঁটি খেজুরের গুড় চেনার উপায় | অর্গানিক ব্লগ',
      metaDescription: 'পাটালি ও ঝোলা গুড়ে চিনি বা হাইড্রোজ আছে কিনা তা ঘরে বসেই পরীক্ষা করুন।',
      content:
        'শীত এলেই বাজারে ভেজাল গুড়ের ছড়াছড়ি দেখা যায়। খাঁটি গুড় চিনতে নিচের ৫টি বিষয় খেয়াল করুন:\n\n১. রঙ ও চকচকে ভাব: অতিরিক্ত উজ্জ্বল সাদা বা সোনালী গুড়ে ফিটকিরি/হাইড্রোজ থাকে। খাঁটি গুড় গাঢ় খয়েরি বা চকোলেট রঙের হয়।\n২. আঙুলের চাপ: খাঁটি পাটালি মুখে বা আঙুলে চাপ দিলে নরমভাবে গলে যায়; চিনির ভেজাল থাকলে কাঁচের মতো শক্ত ও ধারালো হয়।\n৩. ঘ্রাণ: খাঁটি নলেন বা পাটালি গুড় থেকে খেজুর রসের মিষ্টি প্রাকৃতিক সুবাস আসে।',
    },
  },
  {
    id: 'tpl-honey-guide',
    label: 'ব্লগ: সুন্দরবনের মধুর উপকারিতা',
    page: {
      slug: 'sundarban-honey-benefits',
      title: 'সুন্দরবনের প্রাকৃতিক কাঁচা মধু ও কালোজিরার সুন্নাহ উপকারিতা',
      type: 'blog',
      published: true,
      metaTitle: 'সুন্দরবনের মধুর উপকারিতা | সুন্নাহ ব্লগ',
      metaDescription: 'রোগ প্রতিরোধ ক্ষমতা বাড়াতে খাঁটি মধু ও কালোজিরার ব্যবহার।',
      content:
        'প্রাকৃতিক মধুকে বলা হয় প্রকৃতির শ্রেষ্ঠ শিফা। সুন্দরবনের খলিশা ও গরান ফুলের কাঁচা মধুতে থাকে প্রচুর অ্যান্টিঅক্সিডেন্ট ও এনজাইম।\n\n• প্রতিদিন সকালে কুসুম গরম পানিতে ১ চামচ মধু হজমশক্তি ও এনার্জি বাড়ায়।\n• কালোজিরার সাথে মধু মিশিয়ে খেলে মৌসুমি সর্দি-কাশি থেকে সুরক্ষা মেলে।',
    },
  },
  {
    id: 'tpl-privacy-pro',
    label: 'প্রাইভেসি ও পেমেন্ট সুরক্ষা',
    page: {
      slug: 'privacy',
      title: 'গ্রাহক তথ্য সুরক্ষা ও পেমেন্ট প্রাইভেসি পলিসি',
      type: 'page',
      published: true,
      metaTitle: 'Privacy & Security | Khidmatul Ummah Shop BD',
      metaDescription: 'গ্রাহকের ব্যক্তিগত তথ্য ও পেমেন্ট নিরাপত্তার সম্পূর্ণ নীতিমালা।',
      content:
        'আমরা গ্রাহকের তথ্যের সর্বোচ্চ গোপনীয়তা রক্ষা করি:\n\n• অর্ডার ডেলিভারির জন্য সংগৃহীত নাম, ফোন নম্বর ও ঠিকানা কেবল অনুমোদিত কুরিয়ার পার্টনারের সাথে শেয়ার করা হয়।\n• বিকাশ, নগদ, রকেট ও SSLCommerz পেমেন্ট সম্পূর্ণ যাচাইকৃত ও এনক্রিপ্টেড।',
    },
  },
  {
    id: 'tpl-return-pro',
    label: '৭ দিনের রিটার্ন গ্যারান্টি',
    page: {
      slug: 'returns',
      title: '৭ দিনের সহজ রিটার্ন ও ১০০% বিশুদ্ধতা গ্যারান্টি',
      type: 'page',
      published: true,
      metaTitle: '7-Day Return & Purity Guarantee',
      metaDescription: 'পণ্য পছন্দ না হলে বা ত্রুটি থাকলে সহজ রিটার্ন ও রিফান্ড সুবিধা।',
      content:
        'আমাদের প্রতিটি অর্ডারে থাকছে কাস্টমার প্রোটেকশন গ্যারান্টি:\n\n১. ডেলিভারি ম্যানের সামনে পার্সেল খুলে দেখে নেওয়ার সুযোগ।\n২. পণ্যে কোনো ফিজিক্যাল ড্যামেজ বা মানের ত্রুটি থাকলে কোনো চার্জ ছাড়াই ফ্রি রিপ্লেসমেন্ট।\n৩. রিফান্ড অনুমোদিত হলে ২–৩ কার্যদিবসের মধ্যে বিকাশ/নগদে টাকা ফেরত।',
    },
  },
];

export const DEFAULT_THEME_ADVANCED: ShopifyThemeAdvancedConfig = {
  surfaceMode: 'light',
  buttonRadius: 'rounded',
  cardRadius: 'soft',
  cardElevation: 'hairline',
  containerWidth: 'standard',
  gridGap: 'comfortable',
  gridColsDesktop: 4,
  bodyFontScale: 'standard',
  headingWeight: '800',
  announcementBarEnabled: false,
  announcementBarText:
    '১০০% খাঁটি চুয়াডাঙ্গা পাটালি গুড় ও সুন্দরবনের মধু — সারাদেশে ২৪-৭২ ঘণ্টায় ক্যাশ অন ডেলিভারি!',
  announcementBarStyle: 'brand',
  sections: [
    { id: 'hero', label: 'Hero Banner & Mega-Menu', enabled: true },
    { id: 'categories', label: 'Shop by Category (Falaq Style)', enabled: true },
    { id: 'shortcuts', label: 'Quick Shortcuts & Promo Strip', enabled: true },
    { id: 'flashSale', label: 'Flash Sale Countdown Slider', enabled: true },
    { id: 'catalog', label: 'Full Marketplace Catalog (PLP)', enabled: true },
    { id: 'justForYou', label: 'Just For You Feed', enabled: true },
    { id: 'singleProduct', label: 'One-Step Direct Order System', enabled: true },
    { id: 'gallery', label: 'Real Harvest & Texture Gallery', enabled: true },
    { id: 'reviewsFaq', label: 'Ratings, Reviews & FAQ', enabled: true },
    { id: 'newsletter', label: 'Newsletter Subscription', enabled: true },
  ],
  customCss: '',
};

export interface AdvancedProThemeSystem {
  id: string;
  name: string;
  subtitle: string;
  badge: string;
  websiteTemplate: WebsiteTemplateId;
  heroStyle: HeroStyleId;
  headerStyle: HeaderStyleId;
  categoryStyle: CategoryStyleId;
  productCardDesign: ProductCardDesignId;
  footerStyle: FooterStyleId;
  themePreset: ThemePresetId;
  fontStyle: FontStyleId;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  advanced: Partial<ShopifyThemeAdvancedConfig>;
}

export const ADVANCED_PRO_THEMES: AdvancedProThemeSystem[] = [
  {
    id: 'pro-nordic-dawn',
    name: 'Nordic Pure Minimal (Dawn 2.0)',
    subtitle: 'প্রশস্ত ফুল-উইডথ, শার্প এডিটোরিয়াল কার্ড ও পরিচ্ছন্ন স্পেসিং',
    badge: 'Editorial Pro',
    websiteTemplate: 'modern-minimal',
    heroStyle: 'full-bleed',
    headerStyle: 'clean-editorial',
    categoryStyle: 'showcase-tiles',
    productCardDesign: 'minimal-editorial',
    footerStyle: 'minimal-clean',
    themePreset: 'emerald-sunnah',
    fontStyle: 'compact-commerce',
    primaryColor: '#047857',
    secondaryColor: '#111827',
    accentColor: '#0F766E',
    backgroundColor: '#FAFAFA',
    advanced: {
      surfaceMode: 'light',
      buttonRadius: 'sharp',
      cardRadius: 'sharp',
      cardElevation: 'hairline',
      containerWidth: 'wide',
      gridGap: 'airy',
      gridColsDesktop: 3,
      bodyFontScale: 'standard',
      headingWeight: '700',
      announcementBarEnabled: true,
      announcementBarStyle: 'dark',
    },
  },
  {
    id: 'pro-obsidian-luxury',
    name: 'Obsidian Midnight Boutique',
    subtitle: 'গাঢ় স্লেট ডার্ক স্টোরফ্রন্ট, সেরিফ শিরোনাম ও সোনালী ফ্রেম',
    badge: 'Dark Luxury',
    websiteTemplate: 'luxury-boutique',
    heroStyle: 'split-spotlight',
    headerStyle: 'dark-luxury',
    categoryStyle: 'showcase-tiles',
    productCardDesign: 'luxury-framed',
    footerStyle: 'dark-executive',
    themePreset: 'midnight-gold',
    fontStyle: 'serif-luxury',
    primaryColor: '#D97706',
    secondaryColor: '#F8FAFC',
    accentColor: '#10B981',
    backgroundColor: '#0F172A',
    advanced: {
      surfaceMode: 'dark-slate',
      buttonRadius: 'rounded',
      cardRadius: 'soft',
      cardElevation: 'elevated',
      containerWidth: 'standard',
      gridGap: 'airy',
      gridColsDesktop: 3,
      bodyFontScale: 'large',
      headingWeight: '800',
      announcementBarEnabled: true,
      announcementBarStyle: 'emerald',
    },
  },
  {
    id: 'pro-botanical-paper',
    name: 'Sunnah Botanical Paper Craft',
    subtitle: 'উষ্ণ অর্গানিক আইভরি পেপার, পিল বাটন ও নরম রাউন্ডেড কার্ড',
    badge: 'Artisanal Organic',
    websiteTemplate: 'artisan-heritage',
    heroStyle: 'split-spotlight',
    headerStyle: 'floating-glass',
    categoryStyle: 'scroll-rail',
    productCardDesign: 'rounded-glass',
    footerStyle: 'newsletter-split',
    themePreset: 'gold-heritage',
    fontStyle: 'hind-bengali',
    primaryColor: '#B45309',
    secondaryColor: '#292018',
    accentColor: '#047857',
    backgroundColor: '#FBF7F0',
    advanced: {
      surfaceMode: 'warm-ivory',
      buttonRadius: 'pill',
      cardRadius: 'curvy',
      cardElevation: 'elevated',
      containerWidth: 'standard',
      gridGap: 'comfortable',
      gridColsDesktop: 4,
      bodyFontScale: 'standard',
      headingWeight: '800',
      announcementBarEnabled: true,
      announcementBarStyle: 'brand',
    },
  },
  {
    id: 'pro-velocity-mall',
    name: 'High-Velocity 5-Col Flash Mall',
    subtitle: 'সর্বোচ্চ প্রোডাক্ট ডেনসিটি, ৫-কলাম ক্যাটালগ ও দ্রুত কনভার্সন',
    badge: 'High Velocity',
    websiteTemplate: 'flash-superstore',
    heroStyle: 'bento-promo',
    headerStyle: 'brand-gradient',
    categoryStyle: 'compact-tabs',
    productCardDesign: 'bold-promo',
    footerStyle: 'daraz-3tier',
    themePreset: 'daraz-orange',
    fontStyle: 'plus-jakarta',
    primaryColor: '#F85606',
    secondaryColor: '#212121',
    accentColor: '#047857',
    backgroundColor: '#F5F5F5',
    advanced: {
      surfaceMode: 'light',
      buttonRadius: 'rounded',
      cardRadius: 'soft',
      cardElevation: 'hairline',
      containerWidth: 'full',
      gridGap: 'compact',
      gridColsDesktop: 5,
      bodyFontScale: 'compact',
      headingWeight: '900',
      announcementBarEnabled: false,
      announcementBarStyle: 'brand',
    },
  },
];

