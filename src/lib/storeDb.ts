import type { User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Timestamp,
} from 'firebase/firestore';
import {
  ACTIVE_VOUCHERS,
  BRAND_INFO,
  PRODUCTS,
  type Product,
} from '../data/products';
import { DEFAULT_VENDORS, splitCartIntoSubOrders } from '../data/vendors';
import type {
  AccountingEntryRecord,
  AdminNotificationRecord,
  AdminRoleName,
  AdminUserRecord,
  AuditLogRecord,
  ChatMessageRecord,
  CmsPageRecord,
  CourierParcelRecord,
  CourierProvider,
  CustomerCrmRecord,
  EmployeeRecord,
  HeaderStyleId,
  LoyaltyWalletRecord,
  OrderReceipt,
  OrderStatus,
  ProductQuestionRecord,
  ProductReviewRecord,
  PurchaseOrderRecord,
  RbacPermission,
  RegisteredUserProfile,
  SellerPayoutRecord,
  StockMovementRecord,
  StoreSettings,
  SubOrderRecord,
  SubscriberRecord,
  SupplierRecord,
  ThemePresetId,
  UserAccount,
  VendorStoreRecord,
  VoucherRecord,
  WarehouseRecord,
} from '../types';
import {
  db,
  handleFirestoreError,
  OperationType,
} from './firebase';

export const ADMIN_ROLE_LIST: AdminRoleName[] = [
  'Super Admin',
  'Admin',
  'Manager',
  'Accountant',
  'Order Manager',
  'Inventory Manager',
  'Product Manager',
  'Marketing Manager',
  'Customer Support',
  'Delivery Manager',
];

export const RBAC_PERMISSIONS_LIST: RbacPermission[] = [
  'view',
  'create',
  'edit',
  'delete',
  'approve',
  'refund',
  'export',
  'settings',
];

export const DEFAULT_ROLE_PERMISSIONS: Record<AdminRoleName, RbacPermission[]> = {
  'Super Admin': ['view', 'create', 'edit', 'delete', 'approve', 'refund', 'export', 'settings'],
  Admin: ['view', 'create', 'edit', 'delete', 'approve', 'refund', 'export', 'settings'],
  Manager: ['view', 'create', 'edit', 'approve', 'export'],
  Accountant: ['view', 'create', 'edit', 'export'],
  'Order Manager': ['view', 'create', 'edit', 'approve', 'refund', 'export'],
  'Inventory Manager': ['view', 'create', 'edit', 'export'],
  'Product Manager': ['view', 'create', 'edit', 'delete'],
  'Marketing Manager': ['view', 'create', 'edit', 'export'],
  'Customer Support': ['view', 'edit', 'refund'],
  'Delivery Manager': ['view', 'edit', 'export'],
};

export const DEFAULT_CMS_PAGES: CmsPageRecord[] = [
  {
    slug: 'about',
    title: 'আমাদের সম্পর্কে (About Khidmatul Ummah Shop)',
    type: 'page',
    published: true,
    metaTitle: 'আমাদের সম্পর্কে | খিদমাতুল উম্মাহ শপ বিডি',
    metaDescription: 'খিদমাতুল উম্মাহ শপ বিডি — চুয়াডাঙ্গার খাঁটি খেজুরের গুড়, সুন্দরবনের মধু ও সুন্নাহ অর্গানিক পণ্যের বিশ্বস্ত ঠিকানা।',
    content:
      `খিদমাতুল উম্মাহ শপ বিডি (Khidmatul Ummah Shop BD) বাংলাদেশের একটি বিশ্বস্ত অর্গানিক ও সুন্নাহ ভিত্তিক মাল্টি-ভেন্ডর ই-কমার্স মার্কেটপ্লেস।\n\nআমরা সরাসরি সরোজগঞ্জ ও চুয়াডাঙ্গার ঐতিহ্যবাহী গাছিদের তৈরি পাটালি, দানাদার ও ঝোলা খেজুরের গুড়, সুন্দরবনের প্রাকৃতিক মধু, সিরাজগঞ্জের দেশি গাওয়া ঘি, ঘানি ভাঙা সরিষার তেল, মদিনার আজওয়া খেজুর এবং শতভাগ কেমিক্যালমুক্ত সুপারফুড সংগ্রহ করে মিরপুর-১০ (ঢাকা) ও চুয়াডাঙ্গা কালেকশন হাবের মাধ্যমে সারাদেশে হোম ডেলিভারি দিচ্ছি।\n\nঅফিসিয়াল পোর্টাল: ${BRAND_INFO.appUrl}\nহটলাইন: ${BRAND_INFO.phone} · সাপোর্ট ইমেইল: ${BRAND_INFO.supportEmail}`,
  },
  {
    slug: 'contact',
    title: 'যোগাযোগ করুন (Contact & Support)',
    type: 'page',
    published: true,
    metaTitle: 'যোগাযোগ | খিদমাতুল উম্মাহ শপ বিডি',
    metaDescription: 'অর্ডার, পাইকারি ক্রয় বা যেকোনো সহায়তার জন্য সরাসরি কল বা মেসেজ করুন।',
    content:
      `হটলাইন ও হোয়াটসঅ্যাপ: ${BRAND_INFO.phone}\nকাস্টমার সাপোর্ট ইমেইল: ${BRAND_INFO.supportEmail}\nঅফিসিয়াল সেলস ইমেইল: ${BRAND_INFO.email}\nঅফিস ও ডিসপ্যাচ হাব: ${BRAND_INFO.hubAddress}\nওয়েব পোর্টাল: ${BRAND_INFO.appUrl}\nসাপোর্ট সময়: ${BRAND_INFO.supportHours}`,
  },
  {
    slug: 'privacy',
    title: 'গোপনীয়তা নীতি (Privacy Policy)',
    type: 'page',
    published: true,
    metaTitle: 'Privacy Policy | Khidmatul Ummah Shop BD',
    metaDescription: 'গ্রাহকের ব্যক্তিগত তথ্য সুরক্ষা ও গোপনীয়তা নীতিমালা।',
    content:
      'গ্রাহকের নাম, মোবাইল নম্বর এবং ডেলিভারি ঠিকানা কেবল অর্ডার প্রক্রিয়াকরণ, কুরিয়ার ডেলিভারি ও গ্রাহক সেবার কাজে ব্যবহার করা হয়। কোনো তৃতীয় পক্ষের সাথে অননুমোদিতভাবে তথ্য শেয়ার করা হয় না। পেমেন্ট ট্রানজেকশন সম্পূর্ণ এনক্রিপ্টেড ও নিরাপদ।',
  },
  {
    slug: 'terms',
    title: 'শর্তাবলী (Terms & Conditions)',
    type: 'page',
    published: true,
    metaTitle: 'Terms & Conditions | Khidmatul Ummah Shop BD',
    metaDescription: 'খিদমাতুল উম্মাহ শপ বিডি ব্যবহারের শর্তাবলী।',
    content:
      '১. অর্ডার কনফার্ম করার আগে পণ্যের পরিমাণ ও ওজন যাচাই করে নিন।\n২. কুরিয়ার ডেলিভারির সময় পণ্য দেখে বুঝে নেওয়ার সুযোগ রয়েছে।\n৩. পাইকারি অর্ডারের ক্ষেত্রে ন্যূনতম পরিমাণ (MOQ) প্রযোজ্য হবে।',
  },
  {
    slug: 'shipping',
    title: 'ডেলিভারি নীতিমালা (Shipping Policy)',
    type: 'page',
    published: true,
    metaTitle: 'Shipping Policy | Khidmatul Ummah Shop BD',
    metaDescription: 'ঢাকা ও সারাদেশে দ্রুত হোম ডেলিভারি তথ্য।',
    content:
      'ঢাকা সিটির ভেতরে ডেলিভারি সময়: ২৪–৪৮ ঘণ্টা (চার্জ ৳৫০)।\nঢাকার বাইরে ৬৪ জেলায় ডেলিভারি সময়: ২–৪ কার্যদিবস (চার্জ ৳১২০)।\nনির্দিষ্ট অর্ডার মূল্যের ওপর ফ্রি ডেলিভারি অফার প্রযোজ্য হয়। কুরিয়ার পার্টনার: Steadfast, Pathao, RedX ও eCourier।',
  },
  {
    slug: 'returns',
    title: 'রিটার্ন ও রিফান্ড নীতি (Return & Refund Policy)',
    type: 'page',
    published: true,
    metaTitle: 'Return & Refund Policy | Khidmatul Ummah Shop BD',
    metaDescription: 'ত্রুটিপূর্ণ বা ক্ষতিগ্রস্ত পণ্য রিটার্ন ও রিফান্ড গাইডলাইন।',
    content:
      'পণ্য গ্রহণের সময় প্যাকেট ক্ষতিগ্রস্ত হলে বা ভুল পণ্য পৌঁছালে ডেলিভারি ম্যানের সামনেই রিটার্ন করতে পারবেন। কোনো কারণে অর্ডার প্রদানের ৭ দিনের মধ্যে মানসম্মত সমস্যা প্রমাণিত হলে সম্পূর্ণ রিফান্ড অথবা ফ্রি রিপ্লেসমেন্ট প্রদান করা হয়।',
  },
  {
    slug: 'blog',
    title: 'খাঁটি অর্গানিক গুড় ও সুন্নাহ খাবার চেনার উপায় (Organic Blog)',
    type: 'blog',
    published: true,
    metaTitle: 'Organic Food Guide & Blog | Khidmatul Ummah Shop BD',
    metaDescription: 'খাঁটি খেজুরের গুড়, সুন্দরবনের মধু ও গাওয়া ঘি চেনার সহজ ঘরোয়া পরীক্ষা।',
    content:
      '১. খাঁটি পাটালি গুড়ের রঙ খুব বেশি উজ্জ্বল সাদা বা চকচকে হয় না; বরং প্রাকৃতিক গাঢ় বাদামী হয় ও মুখে দিলে নরমভাবে গলে যায়।\n২. চুয়াডাঙ্গার আদি গাছিদের রস থেকে তৈরি গুড়ে কোনো ফিটকিরি বা হাইড্রোজ মেশানো হয় না।\n৩. খাঁটি সুন্দরবনের মধুতে প্রাকৃতিক পরাগ ও হালকা ফেনা থাকে যা একে কৃত্রিম চিনির সিরা থেকে আলাদা করে।',
  },
];

export const THEME_PRESETS: Record<
  ThemePresetId,
  {
    label: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    backgroundColor: string;
    headerStyle: HeaderStyleId;
  }
> = {
  'offertopup-violet': {
    label: 'OfferTopUp Royal Violet',
    primaryColor: '#663CBC',
    secondaryColor: '#081149',
    accentColor: '#2563EB',
    backgroundColor: '#EDF4FF',
    headerStyle: 'solid-white',
  },
  'daraz-orange': {
    label: 'Daraz Classic Orange',
    primaryColor: '#F85606',
    secondaryColor: '#212121',
    accentColor: '#047857',
    backgroundColor: '#F5F5F5',
    headerStyle: 'solid-white',
  },
  'emerald-sunnah': {
    label: 'Sunnah Emerald Organic',
    primaryColor: '#047857',
    secondaryColor: '#132A1E',
    accentColor: '#D97706',
    backgroundColor: '#F3F7F4',
    headerStyle: 'clean-editorial',
  },
  'royal-indigo': {
    label: 'Royal Sapphire Mall',
    primaryColor: '#4338CA',
    secondaryColor: '#1E1B4B',
    accentColor: '#F59E0B',
    backgroundColor: '#F4F6FB',
    headerStyle: 'brand-gradient',
  },
  'gold-heritage': {
    label: 'Heritage Date Palm Gold',
    primaryColor: '#B45309',
    secondaryColor: '#292018',
    accentColor: '#0F766E',
    backgroundColor: '#FBF7F0',
    headerStyle: 'clean-editorial',
  },
  'crimson-mart': {
    label: 'Ruby Mega Mart',
    primaryColor: '#DC2626',
    secondaryColor: '#1F2937',
    accentColor: '#059669',
    backgroundColor: '#F8F9FA',
    headerStyle: 'brand-gradient',
  },
  'midnight-gold': {
    label: 'Midnight Luxury Gold',
    primaryColor: '#D97706',
    secondaryColor: '#0F172A',
    accentColor: '#059669',
    backgroundColor: '#F8FAFC',
    headerStyle: 'dark-luxury',
  },
  'tea-garden': {
    label: 'Sylhet Tea Garden',
    primaryColor: '#15803D',
    secondaryColor: '#14532D',
    accentColor: '#CA8A04',
    backgroundColor: '#F2F9F4',
    headerStyle: 'floating-glass',
  },
  'sundarban-honey': {
    label: 'Sundarban Wild Honey',
    primaryColor: '#C2410C',
    secondaryColor: '#431407',
    accentColor: '#15803D',
    backgroundColor: '#FFFBF5',
    headerStyle: 'clean-editorial',
  },
  'ocean-teal': {
    label: 'Ocean Botanical Teal',
    primaryColor: '#0F766E',
    secondaryColor: '#134E4A',
    accentColor: '#D97706',
    backgroundColor: '#F0FDFA',
    headerStyle: 'floating-glass',
  },
  'plum-bazaar': {
    label: 'Plum Royal Bazaar',
    primaryColor: '#7E22CE',
    secondaryColor: '#3B0764',
    accentColor: '#059669',
    backgroundColor: '#FAF5FF',
    headerStyle: 'compact-centered',
  },
};

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  noticeText:
    'চুয়াডাঙ্গার খাঁটি পাটালি গুড়, সুন্দরবনের মধু ও শতভাগ অর্গানিক পণ্য সারাদেশে ক্যাশ অন ডেলিভারিতে অর্ডার করুন!',
  popupTitle: 'চুয়াডাঙ্গার খাঁটি খেজুরের গুড় ও শতভাগ অর্গানিক পণ্য',
  popupBody:
    'খিদমাতুল উম্মাহ শপ বিডি থেকে সরাসরি খাঁটি খেজুরের গুড়, সুন্দরবনের মধু ও গাওয়া ঘি অর্ডার করতে নিচের বাটনে ক্লিক করুন।',
  popupEnabled: true,
  dhakaDeliveryFee: 50,
  outsideDeliveryFee: 120,
  freeShippingMin: 1500,
  freeDeliveryCampaignActive: false,
  bkashMerchant: BRAND_INFO.rawPhone,
  nagadMerchant: BRAND_INFO.rawPhone,
  rocketMerchant: BRAND_INFO.rawPhone,
  sslcommerzEnabled: true,
  steadfastEnabled: true,
  pathaoEnabled: true,
  redxEnabled: true,
  ecourierEnabled: true,
  fbPixelId: '',
  ga4MeasurementId: '',
  gtmContainerId: '',
  metaCapiEnabled: false,
  gmcFeedEnabled: true,
  smsGatewayEnabled: true,
  emailCampaignEnabled: true,
  storeName: 'খিদমাতুল উম্মাহ শপ বিডি (Khidmatul Ummah Shop BD)',
  storePhone: BRAND_INFO.phone,
  storeEmail: BRAND_INFO.supportEmail,
  storeAddress: `${BRAND_INFO.hubAddress}, বাংলাদেশ`,
  taxRatePercent: 0,
  packagingCostPerOrder: 25,
  gatewayFeePercent: 1.5,
  seoTitle: 'চুয়াডাঙ্গার খাঁটি খেজুরের গুড় ও অর্গানিক ফুড | খিদমাতুল উম্মাহ শপ বিডি',
  seoDescription:
    'চুয়াডাঙ্গার ঐতিহ্যবাহী পাটালি, দানাদার ও ঝোলা খেজুরের গুড়, সুন্দরবনের মধু, গাওয়া ঘি ও সুন্নাহ পণ্য। সারাদেশে দ্রুত ডেলিভারি।',
  seoKeywords: 'খেজুরের গুড়, পাটালি গুড়, সুন্দরবনের মধু, গাওয়া ঘি, Khidmatul Ummah Shop',
  maintenanceMode: false,
  heroBanners: [],
  websiteTemplate: 'daraz-mall',
  productCardDesign: 'classic-mall',
  themePreset: 'offertopup-violet',
  primaryColor: '#663CBC',
  secondaryColor: '#081149',
  accentColor: '#2563EB',
  backgroundColor: '#EDF4FF',
  headerStyle: 'solid-white',
  heroStyle: 'classic-mega',
  categoryStyle: 'grid-cards',
  footerStyle: 'daraz-3tier',
  fontStyle: 'plus-jakarta',
};

function clampStr(value: string | undefined, maxLen: number, fallback = ''): string {
  const trimmed = (value ?? '').trim();
  if (!trimmed) return fallback.slice(0, maxLen);
  return trimmed.slice(0, maxLen);
}

function buildProductUpdatePayload(product: Product, isUpdate: boolean) {
  const safeImage = clampStr(product.image, 500, '/src/assets/images/gur/patali_gur.jpg');
  const cleanGallery = (product.gallery ?? [])
    .map((u) => (typeof u === 'string' ? u.trim().slice(0, 500) : ''))
    .filter(Boolean)
    .slice(0, 8);
  const safeGallery = cleanGallery.length > 0 ? cleanGallery : [safeImage];

  const payload: Record<string, unknown> = {
    sku: clampStr(product.sku, 64, 'KU-SKU'),
    name: clampStr(product.name, 160, 'Organic Product'),
    englishName: clampStr(product.englishName, 160, 'Organic Product'),
    shortDesc: clampStr(product.shortDesc, 300, '100% Pure Organic'),
    category: product.category,
    categoryLabel: clampStr(product.categoryLabel, 100, 'Organic'),
    brand: clampStr(product.brand, 120, 'Khidmatul Ummah'),
    price: Math.max(0, Number(product.price) || 0),
    soldCount: Math.max(0, Number(product.soldCount) || 0),
    tag: clampStr(product.tag, 80, 'Organic'),
    badge: clampStr(product.badge, 80, '100% Pure'),
    inStock: Boolean(product.inStock),
    image: safeImage,
    gallery: safeGallery,
    origin: clampStr(product.origin, 160, 'Bangladesh'),
    description: clampStr(product.description, 2000, 'Pure natural organic food.'),
    features: (product.features ?? [])
      .map((f) => String(f ?? '').trim().slice(0, 200))
      .filter(Boolean)
      .slice(0, 12),
    variants: (product.variants?.length
      ? product.variants
      : [
          {
            id: `${product.id}-default`,
            label: '১ কেজি প্যাক',
            weightKg: 1,
            price: Math.max(0, Number(product.price) || 0),
          },
        ]
    ).slice(0, 10),
    updatedAt: serverTimestamp(),
  };

  if (product.barcode && product.barcode.trim()) {
    payload.barcode = clampStr(product.barcode, 64);
  }
  if (typeof product.originalPrice === 'number' && product.originalPrice > 0) {
    payload.originalPrice = product.originalPrice;
  }
  if (typeof product.wholesalePrice === 'number' && product.wholesalePrice > 0) {
    payload.wholesalePrice = product.wholesalePrice;
  }
  if (typeof product.minWholesaleQty === 'number' && product.minWholesaleQty >= 1) {
    payload.minWholesaleQty = Math.round(product.minWholesaleQty);
  }
  if (typeof product.costPrice === 'number' && product.costPrice >= 0) {
    payload.costPrice = product.costPrice;
  }
  if (typeof product.discountPercent === 'number' && product.discountPercent > 0) {
    payload.discountPercent = Math.min(99, Math.max(0, Math.round(product.discountPercent)));
  }
  if (typeof product.stockLeft === 'number' && product.stockLeft >= 0) {
    payload.stockLeft = product.stockLeft;
  }
  if (product.promoLabel && product.promoLabel.trim()) {
    payload.promoLabel = clampStr(product.promoLabel, 100);
  }
  if (typeof product.isHotDeal === 'boolean') {
    payload.isHotDeal = product.isHotDeal;
  }
  if (typeof product.isFeatured === 'boolean') {
    payload.isFeatured = product.isFeatured;
  }
  if (typeof product.isBestSeller === 'boolean') {
    payload.isBestSeller = product.isBestSeller;
  }
  if (typeof product.isNewArrival === 'boolean') {
    payload.isNewArrival = product.isNewArrival;
  }
  if (product.videoUrl && product.videoUrl.trim()) {
    payload.videoUrl = clampStr(product.videoUrl, 500);
  } else if (isUpdate) {
    payload.videoUrl = deleteField();
  }
  if (Array.isArray(product.specifications) && product.specifications.length > 0) {
    payload.specifications = product.specifications.slice(0, 15);
  }
  if (product.sellerId && product.sellerId.trim()) {
    payload.sellerId = clampStr(product.sellerId, 100);
  }
  if (product.sellerName && product.sellerName.trim()) {
    payload.sellerName = clampStr(product.sellerName, 140);
  }
  if (typeof product.isMall === 'boolean') {
    payload.isMall = product.isMall;
  }
  if (typeof product.freeShipping === 'boolean') {
    payload.freeShipping = product.freeShipping;
  }
  if (product.warrantyLabel && product.warrantyLabel.trim()) {
    payload.warrantyLabel = clampStr(product.warrantyLabel, 140);
  }
  if (product.colorLabel && product.colorLabel.trim()) {
    payload.colorLabel = clampStr(product.colorLabel, 60);
  }

  return payload;
}

export async function saveProductToFirestore(product: Product): Promise<void> {
  const safeId = product.id.replace(/[^a-zA-Z0-9_\-]/g, '-').slice(0, 100);
  const path = `products/${safeId}`;
  try {
    const ref = doc(db, 'products', safeId);
    const snap = await getDoc(ref);
    const exists = snap.exists();
    const updateData = buildProductUpdatePayload({ ...product, id: safeId }, exists);
    if (exists) {
      await updateDoc(ref, updateData);
    } else {
      await setDoc(ref, {
        ...updateData,
        id: safeId,
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteProductFromFirestore(productId: string): Promise<void> {
  const path = `products/${productId}`;
  try {
    await deleteDoc(doc(db, 'products', productId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

function mapPaymentMethodKey(label: OrderReceipt['paymentMethod']): string {
  switch (label) {
    case 'Cash on Delivery':
      return 'cod';
    case 'Nagad':
      return 'nagad';
    case 'Rocket':
      return 'rocket';
    case 'Upay':
      return 'upay';
    case 'SSLCommerz':
      return 'sslcommerz';
    default:
      return 'bkash';
  }
}

export async function saveOrderToFirestore(
  receipt: OrderReceipt,
  user: User
): Promise<OrderReceipt> {
  const safeOrderId = receipt.orderId.replace(/[^a-zA-Z0-9_\-]/g, '-').slice(0, 64);
  const path = `orders/${safeOrderId}`;
  try {
    const paymentKey = mapPaymentMethodKey(receipt.paymentMethod);
    const payload: Record<string, unknown> = {
      orderId: safeOrderId,
      userId: user.uid,
      customerName: clampStr(receipt.customerName, 120, 'Customer'),
      phone: clampStr(receipt.phone, 30, '01700000000'),
      address: clampStr(receipt.address, 400, 'Bangladesh'),
      zone: receipt.zone,
      zoneLabel: clampStr(receipt.district || (receipt.zone === 'dhaka' ? 'Dhaka' : 'Outside Dhaka'), 120),
      paymentMethod: paymentKey,
      paymentLabel: clampStr(receipt.paymentMethod, 80, 'Cash on Delivery'),
      paymentVerified: Boolean(receipt.paymentVerified),
      items: receipt.items.slice(0, 30).map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        name: item.name,
        variantLabel: item.variantLabel,
        price: item.price,
        image: item.image,
        quantity: item.quantity,
        ...(item.sellerId ? { sellerId: item.sellerId } : {}),
        ...(item.sellerName ? { sellerName: item.sellerName } : {}),
      })),
      subtotal: Math.max(0, receipt.subtotal),
      discount: Math.max(0, receipt.discountAmount ?? 0),
      deliveryFee: Math.max(0, receipt.shippingFee),
      total: Math.max(0, receipt.total),
      status: 'Pending',
      dateText: clampStr(receipt.createdAt, 80, new Date().toLocaleDateString('en-GB')),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    if (receipt.upazila && receipt.upazila.trim()) {
      payload.upazila = clampStr(receipt.upazila, 120);
    }
    if (user.email) {
      payload.customerEmail = clampStr(user.email, 160);
    }
    if (receipt.trxId && receipt.trxId.trim()) {
      payload.trxId = clampStr(receipt.trxId, 80);
    }
    if (receipt.notes && receipt.notes.trim()) {
      payload.note = clampStr(receipt.notes, 400);
    }
    if (receipt.voucherCode && receipt.voucherCode.trim()) {
      payload.voucherCode = clampStr(receipt.voucherCode, 40);
    }

    await setDoc(doc(db, 'orders', safeOrderId), payload);

    // Non-blocking multi-vendor Sub-Order split persistence
    const computedSubOrders =
      receipt.subOrders && receipt.subOrders.length > 0
        ? receipt.subOrders
        : splitCartIntoSubOrders(
            safeOrderId,
            receipt.items,
            {
              userId: user.uid,
              customerName: receipt.customerName,
              phone: receipt.phone,
              address: receipt.address,
              district: receipt.district,
              shippingFee: receipt.shippingFee,
              status: 'Pending',
            },
            DEFAULT_VENDORS
          );

    for (const sub of computedSubOrders) {
      const safeSubId = sub.subOrderId.replace(/[^a-zA-Z0-9_\-]/g, '-').slice(0, 80);
      await setDoc(doc(db, 'sub_orders', safeSubId), {
        subOrderId: safeSubId,
        parentOrderId: safeOrderId,
        sellerId: clampStr(sub.sellerId, 100, 'khidmatul-mall'),
        sellerName: clampStr(sub.sellerName, 140, 'Khidmatul Organic Mall'),
        userId: user.uid,
        customerName: clampStr(sub.customerName, 120, 'Customer'),
        phone: clampStr(sub.phone, 30, '01700000000'),
        address: clampStr(sub.address, 400, 'Bangladesh'),
        district: clampStr(sub.district, 120, 'Dhaka'),
        items: sub.items.slice(0, 30).map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          name: item.name,
          variantLabel: item.variantLabel,
          price: item.price,
          image: item.image,
          quantity: item.quantity,
        })),
        subtotal: Math.max(0, sub.subtotal),
        shippingFee: Math.max(0, sub.shippingFee),
        commissionRate: Math.max(0, Math.min(50, sub.commissionRate)),
        commissionAmount: Math.max(0, sub.commissionAmount),
        sellerNetPayout: Math.max(0, sub.sellerNetPayout),
        status: 'Pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }).catch(() => undefined);
    }

    // Non-blocking admin alert notification
    const notifId = `notif-ord-${safeOrderId}`.replace(/[^a-zA-Z0-9_\-]/g, '-').slice(0, 100);
    await setDoc(doc(db, 'admin_notifications', notifId), {
      id: notifId,
      type: 'order',
      title: `নতুন অর্ডার #${safeOrderId}`,
      message: clampStr(`${receipt.customerName} (৳${receipt.total}) — ${receipt.district}`, 300),
      read: false,
      createdAt: serverTimestamp(),
    }).catch(() => undefined);

    // Record duplicate-protected transaction ledger entry for digital payments
    if (paymentKey !== 'cod' && receipt.trxId && receipt.trxId.trim().length >= 4) {
      const safeTrx = receipt.trxId.trim().toUpperCase().replace(/[^a-zA-Z0-9_\-]/g, '').slice(0, 80);
      if (safeTrx.length >= 4) {
        await setDoc(doc(db, 'payment_transactions', safeTrx), {
          trxId: safeTrx,
          orderId: safeOrderId,
          userId: user.uid,
          provider: paymentKey,
          amount: Math.max(1, receipt.total),
          verified: Boolean(receipt.paymentVerified),
          createdAt: serverTimestamp(),
        }).catch(() => undefined);
      }
    }

    return {
      ...receipt,
      orderId: safeOrderId,
      userId: user.uid,
      customerEmail: user.email ?? undefined,
      subOrders: computedSubOrders,
      status: 'Pending',
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateOrderStatusInFirestore(
  orderId: string,
  status: OrderStatus,
  adminNote = '',
  courierMeta?: {
    courierProvider?: string;
    consignmentId?: string;
    trackingCode?: string;
    paymentVerified?: boolean;
  }
): Promise<void> {
  const path = `orders/${orderId}`;
  try {
    const updateData: Record<string, unknown> = {
      status,
      adminNote: clampStr(adminNote, 400),
      updatedAt: serverTimestamp(),
    };
    if (courierMeta?.courierProvider) {
      updateData.courierProvider = clampStr(courierMeta.courierProvider, 40);
    }
    if (courierMeta?.consignmentId) {
      updateData.consignmentId = clampStr(courierMeta.consignmentId, 80);
    }
    if (courierMeta?.trackingCode) {
      updateData.trackingCode = clampStr(courierMeta.trackingCode, 80);
    }
    if (typeof courierMeta?.paymentVerified === 'boolean') {
      updateData.paymentVerified = courierMeta.paymentVerified;
    }
    await updateDoc(doc(db, 'orders', orderId), updateData);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function cancelPendingOrderByCustomer(
  orderId: string,
  reason: string
): Promise<void> {
  const path = `orders/${orderId}`;
  try {
    await updateDoc(doc(db, 'orders', orderId), {
      status: 'Cancelled',
      customerCancelReason: clampStr(reason, 300, 'Cancelled by customer'),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function requestOrderRefundByCustomer(
  orderId: string,
  reason: string
): Promise<void> {
  const path = `orders/${orderId}`;
  try {
    await updateDoc(doc(db, 'orders', orderId), {
      refundRequested: true,
      refundReason: clampStr(reason, 300, 'Customer refund request'),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteOrderFromFirestore(orderId: string): Promise<void> {
  const path = `orders/${orderId}`;
  try {
    await deleteDoc(doc(db, 'orders', orderId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveCourierParcelToFirestore(parcel: CourierParcelRecord): Promise<void> {
  const safeId = parcel.consignmentId.replace(/[^a-zA-Z0-9_\-]/g, '').slice(0, 80);
  const path = `courier_parcels/${safeId}`;
  try {
    await setDoc(doc(db, 'courier_parcels', safeId), {
      consignmentId: safeId,
      orderId: clampStr(parcel.orderId, 64),
      provider: parcel.provider as CourierProvider,
      trackingCode: clampStr(parcel.trackingCode, 80),
      status: clampStr(parcel.status, 60, 'Pickup Requested'),
      codAmount: Math.max(0, Number(parcel.codAmount) || 0),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function saveVoucherToFirestore(voucher: VoucherRecord): Promise<void> {
  const safeCode = voucher.code.toUpperCase().replace(/[^a-zA-Z0-9_\-]/g, '').slice(0, 32);
  const path = `vouchers/${safeCode}`;
  try {
    const ref = doc(db, 'vouchers', safeCode);
    const snap = await getDoc(ref);
    const baseData = {
      code: safeCode,
      title: clampStr(voucher.title, 140, safeCode),
      discount: Math.max(0, Number(voucher.discount) || 0),
      minSpend: Math.max(0, Number(voucher.minSpend) || 0),
      expiry: clampStr(voucher.expiry, 60, '31 Dec 2026'),
      active: Boolean(voucher.active),
      updatedAt: serverTimestamp(),
    };
    if (snap.exists()) {
      await updateDoc(ref, baseData);
    } else {
      await setDoc(ref, {
        ...baseData,
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteVoucherFromFirestore(code: string): Promise<void> {
  const safeCode = code.toUpperCase().replace(/[^a-zA-Z0-9_\-]/g, '').slice(0, 32);
  const path = `vouchers/${safeCode}`;
  try {
    await deleteDoc(doc(db, 'vouchers', safeCode));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveStoreSettingsToFirestore(
  settings: StoreSettings,
  adminUid: string
): Promise<void> {
  const path = 'store_settings/main';
  try {
    const payload: Record<string, unknown> = {
      noticeText: clampStr(settings.noticeText, 300, DEFAULT_STORE_SETTINGS.noticeText),
      popupTitle: clampStr(settings.popupTitle, 180, DEFAULT_STORE_SETTINGS.popupTitle),
      popupBody: clampStr(settings.popupBody, 400, DEFAULT_STORE_SETTINGS.popupBody),
      popupEnabled: Boolean(settings.popupEnabled),
      dhakaDeliveryFee: Math.max(0, Number(settings.dhakaDeliveryFee) || 50),
      outsideDeliveryFee: Math.max(0, Number(settings.outsideDeliveryFee) || 120),
      freeShippingMin: Math.max(0, Number(settings.freeShippingMin) || 1500),
      freeDeliveryCampaignActive: Boolean(settings.freeDeliveryCampaignActive),
      bkashMerchant: clampStr(settings.bkashMerchant, 30, BRAND_INFO.rawPhone),
      nagadMerchant: clampStr(settings.nagadMerchant, 30, BRAND_INFO.rawPhone),
      rocketMerchant: clampStr(settings.rocketMerchant, 30, BRAND_INFO.rawPhone),
      sslcommerzEnabled: settings.sslcommerzEnabled ?? true,
      steadfastEnabled: settings.steadfastEnabled ?? true,
      pathaoEnabled: settings.pathaoEnabled ?? true,
      redxEnabled: settings.redxEnabled ?? true,
      ecourierEnabled: settings.ecourierEnabled ?? true,
      fbPixelId: clampStr(settings.fbPixelId, 64),
      ga4MeasurementId: clampStr(settings.ga4MeasurementId, 64),
      gtmContainerId: clampStr(settings.gtmContainerId, 64),
      metaCapiEnabled: Boolean(settings.metaCapiEnabled),
      gmcFeedEnabled: settings.gmcFeedEnabled ?? true,
      smsGatewayEnabled: settings.smsGatewayEnabled ?? true,
      emailCampaignEnabled: settings.emailCampaignEnabled ?? true,
      storeName: clampStr(settings.storeName, 140, DEFAULT_STORE_SETTINGS.storeName),
      storePhone: clampStr(settings.storePhone, 40, BRAND_INFO.phone),
      storeEmail: clampStr(settings.storeEmail, 160, BRAND_INFO.email),
      storeAddress: clampStr(settings.storeAddress, 300, DEFAULT_STORE_SETTINGS.storeAddress),
      taxRatePercent: Math.min(50, Math.max(0, Number(settings.taxRatePercent ?? 0))),
      packagingCostPerOrder: Math.min(5000, Math.max(0, Number(settings.packagingCostPerOrder ?? 25))),
      gatewayFeePercent: Math.min(20, Math.max(0, Number(settings.gatewayFeePercent ?? 1.5))),
      seoTitle: clampStr(settings.seoTitle, 160, DEFAULT_STORE_SETTINGS.seoTitle),
      seoDescription: clampStr(settings.seoDescription, 300, DEFAULT_STORE_SETTINGS.seoDescription),
      seoKeywords: clampStr(settings.seoKeywords, 300, DEFAULT_STORE_SETTINGS.seoKeywords),
      maintenanceMode: Boolean(settings.maintenanceMode),
      websiteTemplate: settings.websiteTemplate || 'daraz-mall',
      productCardDesign: settings.productCardDesign || 'classic-mall',
      themePreset: settings.themePreset || 'offertopup-violet',
      primaryColor: clampStr(settings.primaryColor, 20, '#663CBC'),
      secondaryColor: clampStr(settings.secondaryColor, 20, '#081149'),
      accentColor: clampStr(settings.accentColor, 20, '#2563EB'),
      backgroundColor: clampStr(settings.backgroundColor, 20, '#EDF4FF'),
      headerStyle: settings.headerStyle || 'solid-white',
      heroStyle: settings.heroStyle || 'classic-mega',
      categoryStyle: settings.categoryStyle || 'grid-cards',
      footerStyle: settings.footerStyle || 'daraz-3tier',
      fontStyle: settings.fontStyle || 'plus-jakarta',
      updatedBy: adminUid,
      updatedAt: serverTimestamp(),
    };
    if (Array.isArray(settings.heroBanners)) {
      payload.heroBanners = settings.heroBanners.slice(0, 10);
    }
    await setDoc(doc(db, 'store_settings', 'main'), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveReviewToFirestore(
  review: Omit<ProductReviewRecord, 'id' | 'userId'>,
  user: User
): Promise<void> {
  const safeId = `rev-${Date.now()}-${Math.floor(Math.random() * 999)}`.replace(/[^a-zA-Z0-9_\-]/g, '');
  const path = `reviews/${safeId}`;
  try {
    await setDoc(doc(db, 'reviews', safeId), {
      id: safeId,
      productId: clampStr(review.productId, 100),
      userId: user.uid,
      author: clampStr(review.author, 120, user.displayName ?? 'Verified Buyer'),
      location: clampStr(review.location, 100, 'Bangladesh'),
      rating: Math.min(5, Math.max(1, Math.round(review.rating))),
      comment: clampStr(review.comment, 800),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteReviewFromFirestore(reviewId: string): Promise<void> {
  const path = `reviews/${reviewId}`;
  try {
    await deleteDoc(doc(db, 'reviews', reviewId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveSupplierToFirestore(supplier: SupplierRecord): Promise<void> {
  const safeId = supplier.id.replace(/[^a-zA-Z0-9_\-]/g, '-').slice(0, 100);
  const path = `suppliers/${safeId}`;
  try {
    const ref = doc(db, 'suppliers', safeId);
    const snap = await getDoc(ref);
    const data = {
      id: safeId,
      name: clampStr(supplier.name, 140),
      phone: clampStr(supplier.phone, 30),
      location: clampStr(supplier.location, 160),
      suppliedItems: clampStr(supplier.suppliedItems, 240),
      lastBatchDate: clampStr(supplier.lastBatchDate, 60, new Date().toISOString().slice(0, 10)),
      active: Boolean(supplier.active),
      updatedAt: serverTimestamp(),
    };
    if (snap.exists()) {
      await updateDoc(ref, data);
    } else {
      await setDoc(ref, { ...data, createdAt: serverTimestamp() });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteSupplierFromFirestore(supplierId: string): Promise<void> {
  const path = `suppliers/${supplierId}`;
  try {
    await deleteDoc(doc(db, 'suppliers', supplierId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function subscribeNewsletterToFirestore(email: string): Promise<void> {
  const cleanEmail = clampStr(email.toLowerCase(), 160);
  const safeId = cleanEmail.replace(/[^a-zA-Z0-9_\-]/g, '-').slice(0, 120);
  const path = `subscribers/${safeId}`;
  try {
    await setDoc(doc(db, 'subscribers', safeId), {
      id: safeId,
      email: cleanEmail,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function recordAdminAuditLog(
  actor: User,
  action: string,
  target: string,
  details = ''
): Promise<void> {
  const safeId = `log-${Date.now()}-${Math.floor(Math.random() * 999)}`;
  const path = `audit_logs/${safeId}`;
  try {
    await setDoc(doc(db, 'audit_logs', safeId), {
      id: safeId,
      actorUid: actor.uid,
      actorEmail: clampStr(actor.email ?? 'admin', 160),
      action: clampStr(action, 120),
      target: clampStr(target, 160),
      details: clampStr(details, 400),
      createdAt: serverTimestamp(),
    });
  } catch {
    // Non-blocking audit trail write
  }
}

export async function upsertUserProfile(user: User): Promise<void> {
  const path = `users/${user.uid}`;
  try {
    const ref = doc(db, 'users', user.uid);
    const snap = await getDoc(ref);
    const baseData = {
      uid: user.uid,
      email: clampStr(user.email ?? 'user@khidmatulummah.shop', 160),
      displayName: clampStr(user.displayName ?? user.email?.split('@')[0] ?? 'Customer', 120),
      updatedAt: serverTimestamp(),
    };
    if (snap.exists()) {
      await updateDoc(ref, {
        displayName: baseData.displayName,
        email: baseData.email,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(ref, {
        ...baseData,
        ...(user.photoURL ? { avatarUrl: clampStr(user.photoURL, 500) } : {}),
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveUserProfileDetailsToFirestore(
  user: User,
  details: Partial<UserAccount>
): Promise<void> {
  const path = `users/${user.uid}`;
  try {
    const ref = doc(db, 'users', user.uid);
    const snap = await getDoc(ref);
    const updatePayload: Record<string, unknown> = {
      displayName: clampStr(details.username ?? user.displayName ?? 'Customer', 120),
      email: clampStr(details.email ?? user.email ?? 'user@khidmatulummah.shop', 160),
      updatedAt: serverTimestamp(),
    };
    if (details.phone !== undefined) updatePayload.phone = clampStr(details.phone, 30);
    if (details.phoneVerified !== undefined) updatePayload.phoneVerified = Boolean(details.phoneVerified);
    if (details.avatarUrl !== undefined) updatePayload.avatarUrl = clampStr(details.avatarUrl, 500);
    if (details.division !== undefined) updatePayload.division = clampStr(details.division, 80);
    if (details.district !== undefined) updatePayload.district = clampStr(details.district, 80);
    if (details.upazila !== undefined) updatePayload.upazila = clampStr(details.upazila, 100);
    if (details.address !== undefined) updatePayload.address = clampStr(details.address, 300);
    if (details.gender !== undefined) updatePayload.gender = clampStr(details.gender, 30);
    if (details.dateOfBirth !== undefined) updatePayload.dateOfBirth = clampStr(details.dateOfBirth, 30);
    if (details.bio !== undefined) updatePayload.bio = clampStr(details.bio, 300);

    if (snap.exists()) {
      await updateDoc(ref, updatePayload);
    } else {
      await setDoc(ref, {
        uid: user.uid,
        ...updatePayload,
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function markPhoneVerifiedInProfile(user: User, phone: string): Promise<void> {
  const path = `users/${user.uid}`;
  try {
    await updateDoc(doc(db, 'users', user.uid), {
      phone: clampStr(phone, 30),
      phoneVerified: true,
      updatedAt: serverTimestamp(),
    });
  } catch {
    await upsertUserProfile(user);
  }
}

export async function addAdminUserToFirestore(
  uid: string,
  email: string,
  name: string,
  addedBy: string,
  role: AdminRoleName | string = 'Manager',
  permissions?: RbacPermission[],
  branchId?: string
): Promise<void> {
  const safeUid = uid.trim().replace(/[^a-zA-Z0-9_\-]/g, '').slice(0, 128);
  const path = `admins/${safeUid}`;
  const validRole = ADMIN_ROLE_LIST.includes(role as AdminRoleName) ? (role as AdminRoleName) : 'Manager';
  const payload: Record<string, unknown> = {
    uid: safeUid,
    email: clampStr(email, 160),
    name: clampStr(name, 120),
    role: validRole,
    permissions: (permissions?.length ? permissions : DEFAULT_ROLE_PERMISSIONS[validRole]).slice(0, 20),
    addedBy,
    createdAt: serverTimestamp(),
  };
  if (branchId && branchId.trim()) {
    payload.branchId = clampStr(branchId, 80);
  }
  try {
    await setDoc(doc(db, 'admins', safeUid), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateAdminUserRbacInFirestore(
  uid: string,
  role: AdminRoleName,
  permissions: RbacPermission[],
  name?: string,
  branchId?: string
): Promise<void> {
  const safeUid = uid.trim().replace(/[^a-zA-Z0-9_\-]/g, '').slice(0, 128);
  const path = `admins/${safeUid}`;
  try {
    const updateData: Record<string, unknown> = {
      role,
      permissions: permissions.slice(0, 20),
    };
    if (name && name.trim()) updateData.name = clampStr(name, 120);
    if (branchId !== undefined) updateData.branchId = clampStr(branchId, 80);
    await updateDoc(doc(db, 'admins', safeUid), updateData);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function removeAdminUserFromFirestore(uid: string): Promise<void> {
  const path = `admins/${uid}`;
  try {
    await deleteDoc(doc(db, 'admins', uid));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ---------- Enterprise ERP Collections CRUD ----------

export async function saveWarehouseToFirestore(wh: WarehouseRecord): Promise<void> {
  const safeId = wh.id.replace(/[^a-zA-Z0-9_\-]/g, '-').slice(0, 80);
  const path = `warehouses/${safeId}`;
  try {
    const ref = doc(db, 'warehouses', safeId);
    const snap = await getDoc(ref);
    const baseData: Record<string, unknown> = {
      id: safeId,
      name: clampStr(wh.name, 140),
      branchCode: clampStr(wh.branchCode, 40),
      location: clampStr(wh.location, 200),
      isDefault: Boolean(wh.isDefault),
      active: Boolean(wh.active),
      updatedAt: serverTimestamp(),
    };
    if (wh.managerName && wh.managerName.trim()) {
      baseData.managerName = clampStr(wh.managerName, 120);
    }
    if (snap.exists()) {
      await updateDoc(ref, baseData);
    } else {
      await setDoc(ref, { ...baseData, createdAt: serverTimestamp() });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteWarehouseFromFirestore(warehouseId: string): Promise<void> {
  const path = `warehouses/${warehouseId}`;
  try {
    await deleteDoc(doc(db, 'warehouses', warehouseId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function recordStockMovementAndAdjustProduct(
  movement: Omit<StockMovementRecord, 'id' | 'createdAtText'>,
  productToAdjust?: Product
): Promise<void> {
  const safeId = `stk-${Date.now()}-${Math.floor(Math.random() * 999)}`;
  const path = `stock_movements/${safeId}`;
  try {
    const payload: Record<string, unknown> = {
      id: safeId,
      productId: clampStr(movement.productId, 100),
      productName: clampStr(movement.productName, 160),
      warehouseId: clampStr(movement.warehouseId, 80, 'main-dhaka'),
      type: movement.type,
      qtyChange: Number(movement.qtyChange) || 0,
      reason: clampStr(movement.reason, 240, 'Inventory update'),
      actorEmail: clampStr(movement.actorEmail, 160, 'admin'),
      createdAt: serverTimestamp(),
    };
    if (movement.batchNo && movement.batchNo.trim()) {
      payload.batchNo = clampStr(movement.batchNo, 80);
    }
    if (movement.expiryDate && movement.expiryDate.trim()) {
      payload.expiryDate = clampStr(movement.expiryDate, 40);
    }
    await setDoc(doc(db, 'stock_movements', safeId), payload);

    if (productToAdjust) {
      const currentStock = Number(productToAdjust.stockLeft ?? 0);
      const nextStock = Math.max(0, currentStock + (Number(movement.qtyChange) || 0));
      await saveProductToFirestore({
        ...productToAdjust,
        stockLeft: nextStock,
        inStock: nextStock > 0,
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function savePurchaseOrderToFirestore(po: PurchaseOrderRecord): Promise<void> {
  const safeId = po.id.replace(/[^a-zA-Z0-9_\-]/g, '-').slice(0, 100);
  const path = `purchases/${safeId}`;
  try {
    const ref = doc(db, 'purchases', safeId);
    const snap = await getDoc(ref);
    const totalCost = Math.max(0, Number(po.totalCost) || 0);
    const paidAmount = Math.max(0, Number(po.paidAmount) || 0);
    const dueAmount = Math.max(0, totalCost - paidAmount);
    const data = {
      id: safeId,
      poNumber: clampStr(po.poNumber, 64),
      supplierId: clampStr(po.supplierId, 100),
      supplierName: clampStr(po.supplierName, 140),
      itemsSummary: clampStr(po.itemsSummary, 300),
      totalCost,
      paidAmount,
      dueAmount,
      status: po.status,
      dateText: clampStr(po.dateText, 60, new Date().toISOString().slice(0, 10)),
      updatedAt: serverTimestamp(),
    };
    if (snap.exists()) {
      await updateDoc(ref, data);
    } else {
      await setDoc(ref, { ...data, createdAt: serverTimestamp() });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deletePurchaseOrderFromFirestore(purchaseId: string): Promise<void> {
  const path = `purchases/${purchaseId}`;
  try {
    await deleteDoc(doc(db, 'purchases', purchaseId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveAccountingEntryToFirestore(
  entry: AccountingEntryRecord
): Promise<boolean> {
  const safeId = entry.id.replace(/[^a-zA-Z0-9_\-]/g, '-').slice(0, 100);
  const path = `accounting_entries/${safeId}`;
  try {
    const ref = doc(db, 'accounting_entries', safeId);
    const existingSnap = await getDoc(ref);
    if (existingSnap.exists()) {
      return false; // Duplicate guard
    }
    const payload: Record<string, unknown> = {
      id: safeId,
      type: entry.type,
      category: clampStr(entry.category, 100),
      amount: Math.max(0, Number(entry.amount) || 0),
      accountName: clampStr(entry.accountName, 80, 'Main Cashbook'),
      description: clampStr(entry.description, 300),
      dateText: clampStr(entry.dateText, 60, new Date().toISOString().slice(0, 10)),
      createdBy: clampStr(entry.createdBy, 160, 'admin'),
      createdAt: serverTimestamp(),
    };
    if (entry.orderId && entry.orderId.trim()) {
      payload.orderId = clampStr(entry.orderId, 64);
    }
    await setDoc(ref, payload);
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    return false;
  }
}

export async function deleteAccountingEntryFromFirestore(entryId: string): Promise<void> {
  const path = `accounting_entries/${entryId}`;
  try {
    await deleteDoc(doc(db, 'accounting_entries', entryId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function syncOrderProfitToAccounting(
  orderId: string,
  netProfitAmount: number,
  actorEmail: string,
  summaryText: string
): Promise<boolean> {
  const safeOrderId = orderId.replace(/[^a-zA-Z0-9_\-]/g, '-').slice(0, 64);
  const id = `pnl-order-${safeOrderId}`;
  return saveAccountingEntryToFirestore({
    id,
    type: netProfitAmount >= 0 ? 'income' : 'expense',
    category: 'Order Net Profit Sync',
    orderId: safeOrderId,
    amount: Math.abs(Math.round(netProfitAmount)),
    accountName: 'Automated P&L Ledger',
    description: clampStr(summaryText, 300),
    dateText: new Date().toISOString().slice(0, 10),
    createdBy: actorEmail,
  });
}

export async function saveEmployeeToFirestore(emp: EmployeeRecord): Promise<void> {
  const safeId = emp.id.replace(/[^a-zA-Z0-9_\-]/g, '-').slice(0, 100);
  const path = `employees/${safeId}`;
  try {
    const ref = doc(db, 'employees', safeId);
    const snap = await getDoc(ref);
    const data = {
      id: safeId,
      name: clampStr(emp.name, 140),
      email: clampStr(emp.email, 160),
      phone: clampStr(emp.phone, 30),
      department: clampStr(emp.department, 80),
      designation: clampStr(emp.designation, 80),
      salary: Math.max(0, Number(emp.salary) || 0),
      attendanceDays: Math.min(366, Math.max(0, Math.round(Number(emp.attendanceDays) || 0))),
      leaveDays: Math.min(366, Math.max(0, Math.round(Number(emp.leaveDays) || 0))),
      status: emp.status,
      updatedAt: serverTimestamp(),
    };
    if (snap.exists()) {
      await updateDoc(ref, data);
    } else {
      await setDoc(ref, { ...data, createdAt: serverTimestamp() });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteEmployeeFromFirestore(empId: string): Promise<void> {
  const path = `employees/${empId}`;
  try {
    await deleteDoc(doc(db, 'employees', empId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveCmsPageToFirestore(page: CmsPageRecord): Promise<void> {
  const safeSlug = page.slug.toLowerCase().replace(/[^a-zA-Z0-9_\-]/g, '-').slice(0, 80);
  const path = `cms_pages/${safeSlug}`;
  try {
    const payload: Record<string, unknown> = {
      slug: safeSlug,
      title: clampStr(page.title, 180),
      type: page.type,
      content: clampStr(page.content, 8000),
      published: Boolean(page.published),
      updatedAt: serverTimestamp(),
    };
    if (page.metaTitle && page.metaTitle.trim()) {
      payload.metaTitle = clampStr(page.metaTitle, 160);
    }
    if (page.metaDescription && page.metaDescription.trim()) {
      payload.metaDescription = clampStr(page.metaDescription, 300);
    }
    await setDoc(doc(db, 'cms_pages', safeSlug), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCmsPageFromFirestore(slug: string): Promise<void> {
  const path = `cms_pages/${slug}`;
  try {
    await deleteDoc(doc(db, 'cms_pages', slug));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveCustomerCrmToFirestore(customer: CustomerCrmRecord): Promise<void> {
  const safeId = customer.id.replace(/[^a-zA-Z0-9_\-]/g, '-').slice(0, 120);
  const path = `customers_crm/${safeId}`;
  try {
    const ref = doc(db, 'customers_crm', safeId);
    const snap = await getDoc(ref);
    const data: Record<string, unknown> = {
      id: safeId,
      name: clampStr(customer.name, 140),
      phone: clampStr(customer.phone, 30),
      group: customer.group,
      wholesaleApproved: Boolean(customer.wholesaleApproved),
      creditDue: Math.max(0, Number(customer.creditDue) || 0),
      blocked: Boolean(customer.blocked),
      updatedAt: serverTimestamp(),
    };
    if (customer.userId && customer.userId.trim()) data.userId = clampStr(customer.userId, 128);
    if (customer.email && customer.email.trim()) data.email = clampStr(customer.email, 160);
    if (customer.businessName && customer.businessName.trim()) {
      data.businessName = clampStr(customer.businessName, 160);
    }
    if (typeof customer.wholesaleRequested === 'boolean') {
      data.wholesaleRequested = customer.wholesaleRequested;
    }
    if (customer.notes && customer.notes.trim()) data.notes = clampStr(customer.notes, 400);

    if (snap.exists()) {
      await updateDoc(ref, data);
    } else {
      await setDoc(ref, { ...data, createdAt: serverTimestamp() });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function submitWholesaleApplicationByCustomer(
  user: User,
  name: string,
  phone: string,
  businessName: string,
  notes: string
): Promise<void> {
  const safeId = `crm-${user.uid}`.replace(/[^a-zA-Z0-9_\-]/g, '-').slice(0, 120);
  const path = `customers_crm/${safeId}`;
  try {
    await setDoc(doc(db, 'customers_crm', safeId), {
      id: safeId,
      userId: user.uid,
      name: clampStr(name, 140),
      phone: clampStr(phone, 30),
      email: clampStr(user.email ?? '', 160),
      businessName: clampStr(businessName, 160),
      group: 'Wholesale',
      wholesaleRequested: true,
      wholesaleApproved: false,
      creditDue: 0,
      notes: clampStr(notes, 400, 'Wholesale registration request'),
      blocked: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteCustomerCrmFromFirestore(customerId: string): Promise<void> {
  const path = `customers_crm/${customerId}`;
  try {
    await deleteDoc(doc(db, 'customers_crm', customerId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function markAdminNotificationRead(notifId: string): Promise<void> {
  const path = `admin_notifications/${notifId}`;
  try {
    await updateDoc(doc(db, 'admin_notifications', notifId), { read: true });
  } catch {
    // non-blocking
  }
}

export async function deleteAdminNotification(notifId: string): Promise<void> {
  const path = `admin_notifications/${notifId}`;
  try {
    await deleteDoc(doc(db, 'admin_notifications', notifId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function seedInitialStorefrontToFirestore(adminUid: string): Promise<number> {
  let count = 0;
  for (const product of PRODUCTS) {
    await saveProductToFirestore({
      ...product,
      barcode: product.barcode ?? `890${product.sku.replace(/[^0-9]/g, '').padStart(6, '0')}`,
      costPrice: product.costPrice ?? Math.round(product.price * 0.72),
      wholesalePrice: product.wholesalePrice ?? Math.round(product.price * 0.85),
      minWholesaleQty: product.minWholesaleQty ?? 5,
      isFeatured: count < 6,
      isBestSeller: product.soldCount >= 100,
      isNewArrival: count >= 6,
    });
    count += 1;
  }
  for (const v of ACTIVE_VOUCHERS) {
    await saveVoucherToFirestore({
      code: v.code,
      title: v.title,
      discount: v.discount,
      minSpend: v.minSpend,
      expiry: v.expiry,
      active: true,
    });
  }
  await saveWarehouseToFirestore({
    id: 'main-dhaka',
    name: 'ঢাকা কেন্দ্রীয় ওয়ারহাউস (Main Dhaka Hub)',
    branchCode: 'DHK-01',
    location: 'মিরপুর ১০, ঢাকা-১২১৬',
    managerName: 'Main Operations',
    isDefault: true,
    active: true,
  });
  await saveWarehouseToFirestore({
    id: 'chuadanga-hub',
    name: 'চুয়াডাঙ্গা উৎপাদন ও সংগ্রহ হাব (Chuadanga Origin)',
    branchCode: 'CHD-02',
    location: 'সরোজগঞ্জ, চুয়াডাঙ্গা',
    managerName: 'Origin Quality Lead',
    isDefault: false,
    active: true,
  });
  for (const page of DEFAULT_CMS_PAGES) {
    await saveCmsPageToFirestore(page);
  }
  await saveStoreSettingsToFirestore(DEFAULT_STORE_SETTINGS, adminUid);
  return count;
}

// ---------- Mappers ----------

export function mapFirestoreOrderToReceipt(
  data: Record<string, unknown>,
  fallbackId: string
): OrderReceipt {
  const ts = data.createdAt as Timestamp | undefined;
  const dateText =
    typeof data.dateText === 'string' && data.dateText
      ? data.dateText
      : ts?.toDate
        ? ts.toDate().toLocaleString('en-GB')
        : new Date().toLocaleDateString('en-GB');

  const labelRaw = typeof data.paymentLabel === 'string' ? data.paymentLabel : '';
  const paymentLabel: OrderReceipt['paymentMethod'] =
    labelRaw === 'Cash on Delivery' ||
    labelRaw === 'bKash' ||
    labelRaw === 'Nagad' ||
    labelRaw === 'Rocket' ||
    labelRaw === 'Upay' ||
    labelRaw === 'SSLCommerz' ||
    labelRaw === 'bKash / Nagad'
      ? labelRaw
      : data.paymentMethod === 'cod'
        ? 'Cash on Delivery'
        : data.paymentMethod === 'nagad'
          ? 'Nagad'
          : data.paymentMethod === 'rocket'
            ? 'Rocket'
            : data.paymentMethod === 'upay'
              ? 'Upay'
              : data.paymentMethod === 'sslcommerz'
                ? 'SSLCommerz'
                : 'bKash';

  return {
    orderId: String(data.orderId ?? fallbackId),
    userId: typeof data.userId === 'string' ? data.userId : undefined,
    customerEmail: typeof data.customerEmail === 'string' ? data.customerEmail : undefined,
    createdAt: dateText,
    customerName: String(data.customerName ?? 'Customer'),
    phone: String(data.phone ?? ''),
    district: String(data.zoneLabel ?? ''),
    upazila: typeof data.upazila === 'string' ? data.upazila : undefined,
    address: String(data.address ?? ''),
    zone: data.zone === 'dhaka' ? 'dhaka' : 'outside',
    notes: typeof data.note === 'string' ? data.note : undefined,
    adminNote: typeof data.adminNote === 'string' ? data.adminNote : undefined,
    paymentMethod: paymentLabel,
    paymentVerified: Boolean(data.paymentVerified),
    trxId: typeof data.trxId === 'string' ? data.trxId : undefined,
    voucherCode: typeof data.voucherCode === 'string' ? data.voucherCode : undefined,
    discountAmount: typeof data.discount === 'number' ? data.discount : 0,
    courierProvider: typeof data.courierProvider === 'string' ? data.courierProvider : undefined,
    consignmentId: typeof data.consignmentId === 'string' ? data.consignmentId : undefined,
    trackingCode: typeof data.trackingCode === 'string' ? data.trackingCode : undefined,
    customerCancelReason:
      typeof data.customerCancelReason === 'string' ? data.customerCancelReason : undefined,
    refundRequested: Boolean(data.refundRequested),
    refundReason: typeof data.refundReason === 'string' ? data.refundReason : undefined,
    items: Array.isArray(data.items) ? (data.items as OrderReceipt['items']) : [],
    subtotal: Number(data.subtotal ?? 0),
    shippingFee: Number(data.deliveryFee ?? 0),
    total: Number(data.total ?? 0),
    status: (data.status as OrderStatus) ?? 'Pending',
  };
}

export function mapFirestoreAdmin(data: Record<string, unknown>, id: string): AdminUserRecord {
  const role = typeof data.role === 'string' ? data.role : 'Admin';
  return {
    uid: String(data.uid ?? id),
    email: String(data.email ?? ''),
    name: String(data.name ?? 'Admin'),
    role,
    permissions: Array.isArray(data.permissions)
      ? (data.permissions as RbacPermission[])
      : DEFAULT_ROLE_PERMISSIONS[role as AdminRoleName] ?? ['view'],
    branchId: typeof data.branchId === 'string' ? data.branchId : undefined,
    addedBy: String(data.addedBy ?? ''),
  };
}

export function mapFirestoreReview(data: Record<string, unknown>, id: string): ProductReviewRecord {
  const ts = data.createdAt as Timestamp | undefined;
  return {
    id: String(data.id ?? id),
    productId: String(data.productId ?? ''),
    userId: String(data.userId ?? ''),
    author: String(data.author ?? 'Verified Buyer'),
    location: typeof data.location === 'string' ? data.location : 'Bangladesh',
    rating: Number(data.rating ?? 5),
    comment: String(data.comment ?? ''),
    createdAtText: ts?.toDate ? ts.toDate().toLocaleDateString('en-GB') : 'সম্প্রতি',
  };
}

export function mapFirestoreSupplier(data: Record<string, unknown>, id: string): SupplierRecord {
  return {
    id: String(data.id ?? id),
    name: String(data.name ?? ''),
    phone: String(data.phone ?? ''),
    location: String(data.location ?? ''),
    suppliedItems: String(data.suppliedItems ?? ''),
    lastBatchDate: typeof data.lastBatchDate === 'string' ? data.lastBatchDate : undefined,
    active: Boolean(data.active ?? true),
  };
}

export function mapFirestoreSubscriber(data: Record<string, unknown>, id: string): SubscriberRecord {
  const ts = data.createdAt as Timestamp | undefined;
  return {
    id: String(data.id ?? id),
    email: String(data.email ?? ''),
    createdAtText: ts?.toDate ? ts.toDate().toLocaleDateString('en-GB') : '',
  };
}

export function mapFirestoreAuditLog(data: Record<string, unknown>, id: string): AuditLogRecord {
  const ts = data.createdAt as Timestamp | undefined;
  return {
    id: String(data.id ?? id),
    actorUid: String(data.actorUid ?? ''),
    actorEmail: String(data.actorEmail ?? ''),
    action: String(data.action ?? ''),
    target: String(data.target ?? ''),
    details: typeof data.details === 'string' ? data.details : undefined,
    createdAtText: ts?.toDate ? ts.toDate().toLocaleString('en-GB') : '',
  };
}

export function mapFirestoreWarehouse(data: Record<string, unknown>, id: string): WarehouseRecord {
  return {
    id: String(data.id ?? id),
    name: String(data.name ?? ''),
    branchCode: String(data.branchCode ?? ''),
    location: String(data.location ?? ''),
    managerName: typeof data.managerName === 'string' ? data.managerName : undefined,
    isDefault: Boolean(data.isDefault),
    active: Boolean(data.active ?? true),
  };
}

export function mapFirestoreStockMovement(data: Record<string, unknown>, id: string): StockMovementRecord {
  const ts = data.createdAt as Timestamp | undefined;
  return {
    id: String(data.id ?? id),
    productId: String(data.productId ?? ''),
    productName: String(data.productName ?? ''),
    warehouseId: String(data.warehouseId ?? ''),
    type: (data.type as StockMovementRecord['type']) ?? 'adjustment',
    qtyChange: Number(data.qtyChange ?? 0),
    batchNo: typeof data.batchNo === 'string' ? data.batchNo : undefined,
    expiryDate: typeof data.expiryDate === 'string' ? data.expiryDate : undefined,
    reason: String(data.reason ?? ''),
    actorEmail: String(data.actorEmail ?? ''),
    createdAtText: ts?.toDate ? ts.toDate().toLocaleString('en-GB') : '',
  };
}

export function mapFirestorePurchase(data: Record<string, unknown>, id: string): PurchaseOrderRecord {
  return {
    id: String(data.id ?? id),
    poNumber: String(data.poNumber ?? ''),
    supplierId: String(data.supplierId ?? ''),
    supplierName: String(data.supplierName ?? ''),
    itemsSummary: String(data.itemsSummary ?? ''),
    totalCost: Number(data.totalCost ?? 0),
    paidAmount: Number(data.paidAmount ?? 0),
    dueAmount: Number(data.dueAmount ?? 0),
    status: (data.status as PurchaseOrderRecord['status']) ?? 'Ordered',
    dateText: String(data.dateText ?? ''),
  };
}

export function mapFirestoreAccountingEntry(data: Record<string, unknown>, id: string): AccountingEntryRecord {
  return {
    id: String(data.id ?? id),
    type: data.type === 'expense' ? 'expense' : 'income',
    category: String(data.category ?? 'General'),
    orderId: typeof data.orderId === 'string' ? data.orderId : undefined,
    amount: Number(data.amount ?? 0),
    accountName: String(data.accountName ?? 'Main Cashbook'),
    description: String(data.description ?? ''),
    dateText: String(data.dateText ?? ''),
    createdBy: String(data.createdBy ?? ''),
  };
}

export function mapFirestoreEmployee(data: Record<string, unknown>, id: string): EmployeeRecord {
  return {
    id: String(data.id ?? id),
    name: String(data.name ?? ''),
    email: String(data.email ?? ''),
    phone: String(data.phone ?? ''),
    department: String(data.department ?? ''),
    designation: String(data.designation ?? ''),
    salary: Number(data.salary ?? 0),
    attendanceDays: Number(data.attendanceDays ?? 0),
    leaveDays: Number(data.leaveDays ?? 0),
    status: (data.status as EmployeeRecord['status']) ?? 'Active',
  };
}

export function mapFirestoreCmsPage(data: Record<string, unknown>, id: string): CmsPageRecord {
  const ts = data.updatedAt as Timestamp | undefined;
  return {
    slug: String(data.slug ?? id),
    title: String(data.title ?? ''),
    type: data.type === 'blog' ? 'blog' : 'page',
    content: String(data.content ?? ''),
    metaTitle: typeof data.metaTitle === 'string' ? data.metaTitle : undefined,
    metaDescription: typeof data.metaDescription === 'string' ? data.metaDescription : undefined,
    published: Boolean(data.published ?? true),
    updatedAtText: ts?.toDate ? ts.toDate().toLocaleDateString('en-GB') : '',
  };
}

export function mapFirestoreCustomerCrm(data: Record<string, unknown>, id: string): CustomerCrmRecord {
  return {
    id: String(data.id ?? id),
    userId: typeof data.userId === 'string' ? data.userId : undefined,
    name: String(data.name ?? ''),
    phone: String(data.phone ?? ''),
    email: typeof data.email === 'string' ? data.email : undefined,
    businessName: typeof data.businessName === 'string' ? data.businessName : undefined,
    group: (data.group as CustomerCrmRecord['group']) ?? 'Regular',
    wholesaleRequested: Boolean(data.wholesaleRequested),
    wholesaleApproved: Boolean(data.wholesaleApproved),
    creditDue: Number(data.creditDue ?? 0),
    notes: typeof data.notes === 'string' ? data.notes : undefined,
    blocked: Boolean(data.blocked),
  };
}

export function mapFirestoreNotification(data: Record<string, unknown>, id: string): AdminNotificationRecord {
  const ts = data.createdAt as Timestamp | undefined;
  return {
    id: String(data.id ?? id),
    type: (data.type as AdminNotificationRecord['type']) ?? 'system',
    title: String(data.title ?? ''),
    message: String(data.message ?? ''),
    read: Boolean(data.read),
    createdAtText: ts?.toDate ? ts.toDate().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '',
  };
}

export async function saveVendorStoreAndKycToFirestore(
  vendor: VendorStoreRecord,
  user: User,
  isAdminActor = false
): Promise<void> {
  const safeId = vendor.id.replace(/[^a-zA-Z0-9_\-]/g, '-').slice(0, 100);
  const path = `vendors/${safeId}`;
  try {
    const vendorRef = doc(db, 'vendors', safeId);
    const kycRef = doc(db, 'vendor_kyc', safeId);
    const snap = await getDoc(vendorRef);
    const slug = clampStr(vendor.slug || safeId, 100, safeId).toLowerCase().replace(/[^a-z0-9\-]/g, '-');

    if (snap.exists()) {
      await updateDoc(vendorRef, {
        storeName: clampStr(vendor.storeName, 140, 'Partner Store'),
        slug,
        location: clampStr(vendor.location, 160, 'Bangladesh'),
        ...(isAdminActor
          ? {
              tier: vendor.tier,
              kycStatus: vendor.kycStatus,
              commissionRate: Math.max(0, Math.min(50, vendor.commissionRate)),
              active: vendor.active,
            }
          : {}),
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(vendorRef, {
        id: safeId,
        ownerUid: vendor.ownerUid || user.uid,
        storeName: clampStr(vendor.storeName, 140, 'Partner Store'),
        slug,
        tier: isAdminActor ? vendor.tier : 'Standard',
        kycStatus: isAdminActor ? vendor.kycStatus : 'Pending',
        location: clampStr(vendor.location, 160, 'Bangladesh'),
        commissionRate: isAdminActor ? Math.max(0, Math.min(50, vendor.commissionRate)) : 8,
        positiveRatingPercent: vendor.positiveRatingPercent ?? 96,
        shipOnTimePercent: vendor.shipOnTimePercent ?? 95,
        chatResponsePercent: vendor.chatResponsePercent ?? 94,
        walletBalance: isAdminActor ? Math.max(0, vendor.walletBalance) : 0,
        totalSales: isAdminActor ? Math.max(0, vendor.totalSales) : 0,
        followersCount: vendor.followersCount ?? 1,
        active: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    const kycSnap = await getDoc(kycRef);
    if (kycSnap.exists()) {
      await updateDoc(kycRef, {
        nidNumber: clampStr(vendor.nidNumber, 40, '0000000000'),
        tradeLicense: clampStr(vendor.tradeLicense, 80, 'TL-PENDING'),
        ...(vendor.tinBin ? { tinBin: clampStr(vendor.tinBin, 80) } : {}),
        phone: clampStr(vendor.phone, 30, '01700000000'),
        ...(vendor.ownerEmail || user.email
          ? { ownerEmail: clampStr(vendor.ownerEmail || user.email || '', 160) }
          : {}),
        kycStatus: isAdminActor ? vendor.kycStatus : 'Pending',
        updatedAt: serverTimestamp(),
      }).catch(() => undefined);
    } else {
      await setDoc(kycRef, {
        vendorId: safeId,
        ownerUid: vendor.ownerUid || user.uid,
        ...(vendor.ownerEmail || user.email
          ? { ownerEmail: clampStr(vendor.ownerEmail || user.email || '', 160) }
          : {}),
        nidNumber: clampStr(vendor.nidNumber, 40, '0000000000'),
        tradeLicense: clampStr(vendor.tradeLicense, 80, 'TL-PENDING'),
        ...(vendor.tinBin ? { tinBin: clampStr(vendor.tinBin, 80) } : {}),
        phone: clampStr(vendor.phone, 30, '01700000000'),
        kycStatus: isAdminActor ? vendor.kycStatus : 'Pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }).catch(() => undefined);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateVendorAdminMetaInFirestore(
  vendorId: string,
  updates: Partial<Pick<VendorStoreRecord, 'kycStatus' | 'tier' | 'commissionRate' | 'active'>>
): Promise<void> {
  const safeId = vendorId.replace(/[^a-zA-Z0-9_\-]/g, '-').slice(0, 100);
  const path = `vendors/${safeId}`;
  try {
    await updateDoc(doc(db, 'vendors', safeId), {
      ...(updates.kycStatus ? { kycStatus: updates.kycStatus } : {}),
      ...(updates.tier ? { tier: updates.tier } : {}),
      ...(typeof updates.commissionRate === 'number'
        ? { commissionRate: Math.max(0, Math.min(50, updates.commissionRate)) }
        : {}),
      ...(typeof updates.active === 'boolean' ? { active: updates.active } : {}),
      updatedAt: serverTimestamp(),
    });
    if (updates.kycStatus) {
      await updateDoc(doc(db, 'vendor_kyc', safeId), {
        kycStatus: updates.kycStatus,
        updatedAt: serverTimestamp(),
      }).catch(() => undefined);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateSubOrderStatusInFirestore(
  subOrderId: string,
  status: OrderStatus,
  courierMeta?: {
    courierProvider?: string;
    consignmentId?: string;
    trackingCode?: string;
  }
): Promise<void> {
  const safeId = subOrderId.replace(/[^a-zA-Z0-9_\-]/g, '-').slice(0, 80);
  const path = `sub_orders/${safeId}`;
  try {
    await updateDoc(doc(db, 'sub_orders', safeId), {
      status,
      ...(courierMeta?.courierProvider
        ? { courierProvider: clampStr(courierMeta.courierProvider, 40) }
        : {}),
      ...(courierMeta?.consignmentId
        ? { consignmentId: clampStr(courierMeta.consignmentId, 80) }
        : {}),
      ...(courierMeta?.trackingCode
        ? { trackingCode: clampStr(courierMeta.trackingCode, 80) }
        : {}),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function createProductQuestionInFirestore(
  question: Omit<ProductQuestionRecord, 'id' | 'createdAtText'>,
  user: User
): Promise<void> {
  const safeId = `qa-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`.slice(0, 100);
  const path = `product_questions/${safeId}`;
  try {
    await setDoc(doc(db, 'product_questions', safeId), {
      id: safeId,
      productId: clampStr(question.productId, 100),
      sellerId: clampStr(question.sellerId, 100, 'khidmatul-mall'),
      authorName: clampStr(question.authorName, 120, 'Customer'),
      userId: user.uid,
      question: clampStr(question.question, 400),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function answerProductQuestionInFirestore(
  questionId: string,
  answer: string,
  answeredBy: string
): Promise<void> {
  const safeId = questionId.replace(/[^a-zA-Z0-9_\-]/g, '-').slice(0, 100);
  const path = `product_questions/${safeId}`;
  try {
    await updateDoc(doc(db, 'product_questions', safeId), {
      answer: clampStr(answer, 600),
      answeredBy: clampStr(answeredBy, 120, 'Seller'),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function requestSellerPayoutInFirestore(
  payout: Omit<SellerPayoutRecord, 'id' | 'createdAtText' | 'status'>,
  user: User
): Promise<void> {
  const safeId = `pay-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`.slice(0, 100);
  const path = `seller_payouts/${safeId}`;
  try {
    await setDoc(doc(db, 'seller_payouts', safeId), {
      id: safeId,
      sellerId: clampStr(payout.sellerId, 100),
      ownerUid: user.uid,
      sellerName: clampStr(payout.sellerName, 140),
      amount: Math.max(100, Number(payout.amount) || 100),
      method: payout.method,
      accountNumber: clampStr(payout.accountNumber, 60, '01700000000'),
      status: 'Requested',
      periodLabel: clampStr(payout.periodLabel, 80, 'Current Cycle'),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateSellerPayoutStatusInFirestore(
  payoutId: string,
  status: SellerPayoutRecord['status']
): Promise<void> {
  const safeId = payoutId.replace(/[^a-zA-Z0-9_\-]/g, '-').slice(0, 100);
  const path = `seller_payouts/${safeId}`;
  try {
    await updateDoc(doc(db, 'seller_payouts', safeId), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function saveChatMessageToFirestore(
  msg: ChatMessageRecord,
  buyerUid: string,
  sellerOwnerUid?: string
): Promise<void> {
  const safeId = msg.id.replace(/[^a-zA-Z0-9_\-]/g, '-').slice(0, 100);
  const path = `chat_messages/${safeId}`;
  try {
    await setDoc(doc(db, 'chat_messages', safeId), {
      id: safeId,
      roomId: clampStr(msg.roomId, 160),
      buyerUid: clampStr(buyerUid, 128),
      sellerId: clampStr(msg.sellerId, 100),
      ...(sellerOwnerUid ? { sellerOwnerUid: clampStr(sellerOwnerUid, 128) } : {}),
      sellerName: clampStr(msg.sellerName, 140),
      senderRole: msg.senderRole,
      senderName: clampStr(msg.senderName, 120),
      text: clampStr(msg.text, 1000),
      createdAtMs: Number(msg.createdAtMs) || Date.now(),
      createdAt: serverTimestamp(),
    });
  } catch {
    // non-blocking so socket.io real-time chat stays fluid
  }
}

export async function saveLoyaltyWalletToFirestore(wallet: LoyaltyWalletRecord, user: User): Promise<void> {
  const path = `loyalty_wallets/${user.uid}`;
  try {
    await setDoc(doc(db, 'loyalty_wallets', user.uid), {
      userId: user.uid,
      coins: Math.max(0, Math.round(wallet.coins)),
      streakDays: Math.max(0, Math.round(wallet.streakDays)),
      lastCheckInDate: clampStr(wallet.lastCheckInDate, 30),
      lastSpinDate: clampStr(wallet.lastSpinDate, 30),
      referralCode: clampStr(wallet.referralCode, 40, `KUS-${user.uid.slice(0, 5).toUpperCase()}`),
      collectedVouchers: (wallet.collectedVouchers ?? []).slice(0, 50),
      updatedAt: serverTimestamp(),
    });
  } catch {
    // non-blocking fallback to localStorage
  }
}

export function mapFirestoreVendor(data: Record<string, unknown>, id: string): VendorStoreRecord {
  const ts = data.createdAt as Timestamp | undefined;
  return {
    id: String(data.id ?? id),
    ownerUid: typeof data.ownerUid === 'string' ? data.ownerUid : undefined,
    storeName: String(data.storeName ?? 'Partner Store'),
    slug: String(data.slug ?? id),
    tier: data.tier === 'Official Mall' ? 'Official Mall' : 'Standard',
    kycStatus:
      data.kycStatus === 'Verified' || data.kycStatus === 'Rejected' ? data.kycStatus : 'Pending',
    nidNumber: String(data.nidNumber ?? ''),
    tradeLicense: String(data.tradeLicense ?? ''),
    tinBin: typeof data.tinBin === 'string' ? data.tinBin : undefined,
    phone: String(data.phone ?? ''),
    location: String(data.location ?? 'Bangladesh'),
    commissionRate: Number(data.commissionRate ?? 8),
    positiveRatingPercent: Number(data.positiveRatingPercent ?? 96),
    shipOnTimePercent: Number(data.shipOnTimePercent ?? 95),
    chatResponsePercent: Number(data.chatResponsePercent ?? 94),
    walletBalance: Number(data.walletBalance ?? 0),
    totalSales: Number(data.totalSales ?? 0),
    followersCount: Number(data.followersCount ?? 0),
    active: Boolean(data.active ?? true),
    createdAtText: ts?.toDate ? ts.toDate().toLocaleDateString('en-GB') : undefined,
  };
}

export function mapFirestoreSubOrder(data: Record<string, unknown>, id: string): SubOrderRecord {
  const ts = data.createdAt as Timestamp | undefined;
  return {
    subOrderId: String(data.subOrderId ?? id),
    parentOrderId: String(data.parentOrderId ?? ''),
    sellerId: String(data.sellerId ?? 'khidmatul-mall'),
    sellerName: String(data.sellerName ?? 'Khidmatul Organic Mall'),
    userId: typeof data.userId === 'string' ? data.userId : undefined,
    customerName: String(data.customerName ?? 'Customer'),
    phone: String(data.phone ?? ''),
    address: String(data.address ?? ''),
    district: String(data.district ?? ''),
    items: Array.isArray(data.items) ? (data.items as SubOrderRecord['items']) : [],
    subtotal: Number(data.subtotal ?? 0),
    shippingFee: Number(data.shippingFee ?? 0),
    commissionRate: Number(data.commissionRate ?? 8),
    commissionAmount: Number(data.commissionAmount ?? 0),
    sellerNetPayout: Number(data.sellerNetPayout ?? 0),
    status: (data.status as OrderStatus) ?? 'Pending',
    courierProvider: typeof data.courierProvider === 'string' ? data.courierProvider : undefined,
    consignmentId: typeof data.consignmentId === 'string' ? data.consignmentId : undefined,
    trackingCode: typeof data.trackingCode === 'string' ? data.trackingCode : undefined,
    createdAtText: ts?.toDate ? ts.toDate().toLocaleString('en-GB') : undefined,
  };
}

export function mapFirestoreProductQuestion(
  data: Record<string, unknown>,
  id: string
): ProductQuestionRecord {
  const ts = data.createdAt as Timestamp | undefined;
  return {
    id: String(data.id ?? id),
    productId: String(data.productId ?? ''),
    sellerId: String(data.sellerId ?? 'khidmatul-mall'),
    authorName: String(data.authorName ?? 'Verified Buyer'),
    userId: typeof data.userId === 'string' ? data.userId : undefined,
    question: String(data.question ?? ''),
    answer: typeof data.answer === 'string' ? data.answer : undefined,
    answeredBy: typeof data.answeredBy === 'string' ? data.answeredBy : undefined,
    createdAtText: ts?.toDate ? ts.toDate().toLocaleDateString('en-GB') : 'সম্প্রতি',
  };
}

export function mapFirestoreSellerPayout(data: Record<string, unknown>, id: string): SellerPayoutRecord {
  const ts = data.createdAt as Timestamp | undefined;
  return {
    id: String(data.id ?? id),
    sellerId: String(data.sellerId ?? ''),
    sellerName: String(data.sellerName ?? ''),
    amount: Number(data.amount ?? 0),
    method:
      data.method === 'Nagad' || data.method === 'Bank Transfer' ? data.method : 'bKash',
    accountNumber: String(data.accountNumber ?? ''),
    status:
      data.status === 'Processing' || data.status === 'Paid' ? data.status : 'Requested',
    periodLabel: String(data.periodLabel ?? 'Current Cycle'),
    createdAtText: ts?.toDate ? ts.toDate().toLocaleDateString('en-GB') : '',
  };
}

export function mapFirestoreChatMessage(data: Record<string, unknown>, id: string): ChatMessageRecord {
  return {
    id: String(data.id ?? id),
    roomId: String(data.roomId ?? ''),
    sellerId: String(data.sellerId ?? ''),
    sellerName: String(data.sellerName ?? ''),
    senderRole: data.senderRole === 'seller' ? 'seller' : 'buyer',
    senderName: String(data.senderName ?? 'User'),
    text: String(data.text ?? ''),
    createdAtMs: Number(data.createdAtMs ?? Date.now()),
  };
}

export function mapFirestoreLoyaltyWallet(data: Record<string, unknown>, id: string): LoyaltyWalletRecord {
  return {
    userId: String(data.userId ?? id),
    coins: Number(data.coins ?? 0),
    streakDays: Number(data.streakDays ?? 0),
    lastCheckInDate: String(data.lastCheckInDate ?? ''),
    lastSpinDate: String(data.lastSpinDate ?? ''),
    referralCode: String(data.referralCode ?? 'KUS-BD'),
    collectedVouchers: Array.isArray(data.collectedVouchers)
      ? (data.collectedVouchers as string[])
      : [],
  };
}

export function mapFirestoreUserProfile(
  data: Record<string, unknown>,
  id: string
): RegisteredUserProfile {
  const ts = data.updatedAt as Timestamp | undefined;
  return {
    uid: String(data.uid ?? id),
    email: String(data.email ?? ''),
    displayName: String(data.displayName ?? 'Customer'),
    phone: typeof data.phone === 'string' ? data.phone : undefined,
    phoneVerified: Boolean(data.phoneVerified),
    avatarUrl: typeof data.avatarUrl === 'string' ? data.avatarUrl : undefined,
    division: typeof data.division === 'string' ? data.division : undefined,
    district: typeof data.district === 'string' ? data.district : undefined,
    upazila: typeof data.upazila === 'string' ? data.upazila : undefined,
    address: typeof data.address === 'string' ? data.address : undefined,
    gender: typeof data.gender === 'string' ? data.gender : undefined,
    dateOfBirth: typeof data.dateOfBirth === 'string' ? data.dateOfBirth : undefined,
    bio: typeof data.bio === 'string' ? data.bio : undefined,
    updatedAtText: ts?.toDate ? ts.toDate().toLocaleDateString('en-GB') : '',
  };
}

export function getStoreCollectionRefs() {
  return {
    productsRef: collection(db, 'products'),
    ordersRef: collection(db, 'orders'),
    vouchersRef: collection(db, 'vouchers'),
    adminsRef: collection(db, 'admins'),
    usersRef: collection(db, 'users'),
    reviewsRef: collection(db, 'reviews'),
    suppliersRef: collection(db, 'suppliers'),
    subscribersRef: collection(db, 'subscribers'),
    auditLogsRef: collection(db, 'audit_logs'),
    courierParcelsRef: collection(db, 'courier_parcels'),
    warehousesRef: collection(db, 'warehouses'),
    stockMovementsRef: collection(db, 'stock_movements'),
    purchasesRef: collection(db, 'purchases'),
    accountingEntriesRef: collection(db, 'accounting_entries'),
    employeesRef: collection(db, 'employees'),
    cmsPagesRef: collection(db, 'cms_pages'),
    customersCrmRef: collection(db, 'customers_crm'),
    adminNotificationsRef: collection(db, 'admin_notifications'),
    vendorsRef: collection(db, 'vendors'),
    vendorKycRef: collection(db, 'vendor_kyc'),
    subOrdersRef: collection(db, 'sub_orders'),
    productQuestionsRef: collection(db, 'product_questions'),
    sellerPayoutsRef: collection(db, 'seller_payouts'),
    chatMessagesRef: collection(db, 'chat_messages'),
    loyaltyWalletsRef: collection(db, 'loyalty_wallets'),
    settingsDocRef: doc(db, 'store_settings', 'main'),
  };
}
