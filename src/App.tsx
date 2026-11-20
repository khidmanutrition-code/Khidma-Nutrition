import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Phone,
  ShieldCheck,
  Truck,
  Home,
  LayoutGrid,
  Heart,
  ShoppingCart,
  MessageCircle,
  Leaf,
  Check,
  Star,
  Award,
  RotateCcw,
  User,
  Zap,
  Gift,
  Percent,
  Sparkles,
  PackageCheck,
  BellRing,
  Mail,
  Clock,
  Wrench,
  BadgeCheck,
  Camera,
  Coins,
  Grid,
  List,
  MapPin,
  QrCode,
  SlidersHorizontal,
  Store,
  X,
} from 'lucide-react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import {
  BRAND_INFO,
  CATEGORIES,
  CategorySlug,
  FAQS,
  GALLERY_PHOTOS,
  GUR_IMAGES,
  ORGANIC_IMAGES,
  GalleryPhoto,
  PRODUCTS,
  Product,
  REVIEWS,
} from './data/products';
import { DEFAULT_VENDORS, getProductMarketplaceMeta } from './data/vendors';
import { DEFAULT_THEME_ADVANCED, FONT_TEMPLATES } from './data/templates';
import {
  AccountingEntryRecord,
  AdminNotificationRecord,
  AdminUserRecord,
  AuditLogRecord,
  CartItem,
  CmsPageRecord,
  CourierParcelRecord,
  CustomerCrmRecord,
  EmployeeRecord,
  HeroBannerConfig,
  HomepageSectionId,
  LoyaltyWalletRecord,
  MarketplaceLanguage,
  OrderReceipt,
  ProductQuestionRecord,
  ProductReviewRecord,
  PurchaseOrderRecord,
  RegisteredUserProfile,
  SavedAddress,
  SellerPayoutRecord,
  ShopifyThemeAdvancedConfig,
  ShopifyWorkspaceState,
  StockMovementRecord,
  StoreSettings,
  SubOrderRecord,
  SubscriberRecord,
  SupplierRecord,
  UserAccount,
  VendorStoreRecord,
  VoucherRecord,
  WarehouseRecord,
} from './types';
import {
  auth,
  BOOTSTRAPPED_ADMIN_EMAIL,
  db,
  googleAuthProvider,
} from './lib/firebase';
import {
  cancelPendingOrderByCustomer,
  createProductQuestionInFirestore,
  DEFAULT_CMS_PAGES,
  DEFAULT_STORE_SETTINGS,
  getStoreCollectionRefs,
  mapFirestoreAccountingEntry,
  mapFirestoreAdmin,
  mapFirestoreAuditLog,
  mapFirestoreCmsPage,
  mapFirestoreCustomerCrm,
  mapFirestoreEmployee,
  mapFirestoreLoyaltyWallet,
  mapFirestoreNotification,
  mapFirestoreOrderToReceipt,
  mapFirestoreProductQuestion,
  mapFirestorePurchase,
  mapFirestoreReview,
  mapFirestoreSellerPayout,
  mapFirestoreStockMovement,
  mapFirestoreSubOrder,
  mapFirestoreSubscriber,
  mapFirestoreSupplier,
  mapFirestoreUserProfile,
  mapFirestoreVendor,
  mapFirestoreWarehouse,
  markPhoneVerifiedInProfile,
  requestOrderRefundByCustomer,
  saveLoyaltyWalletToFirestore,
  saveOrderToFirestore,
  saveReviewToFirestore,
  saveUserProfileDetailsToFirestore,
  subscribeNewsletterToFirestore,
  upsertUserProfile,
} from './lib/storeDb';
import { HeaderBar } from './components/HeaderBar';
import { FalaqCategoryMarquee } from './components/FalaqCategoryMarquee';
import { ProductCard } from './components/ProductCard';
import { SingleProductSystem } from './components/SingleProductSystem';
import { FullScreenOrderPage } from './components/FullScreenOrderPage';
import { ProductDetailView } from './components/ProductDetailView';
import { AccountPage } from './components/AccountPage';
import { AddAddressPage } from './components/AddAddressPage';
import { AdminPage } from './components/AdminPage';
import { SellerCenterPage } from './components/SellerCenterPage';
import { LiveChatWidget } from './components/LiveChatWidget';
import { LoyaltyGamesModal } from './components/LoyaltyGamesModal';
import { VisualSearchModal } from './components/VisualSearchModal';
import { OfflineIndicator, PWAInstallButton } from './hooks/usePWA';
import { ResilientImage } from './components/ResilientImage';
import { ProductModal } from './components/ProductModal';
import { CheckoutDrawer } from './components/CheckoutDrawer';
import {
  GalleryLightboxModal,
  OrderTrackModal,
  WishlistModal,
} from './components/TrackAndBlogModals';
import {
  FloatingSupportWidget,
  NotificationCenterModal,
  OfferTopUpPopupModal,
} from './components/OfferTopUpWidgets';
import { FooterCmsModal } from './components/FooterCmsModal';
import { useSwipeDrag } from './hooks/useSwipeDrag';

const CART_KEY = 'ku_gur_cart_v2';
const WISHLIST_KEY = 'ku_gur_wishlist_v2';
const ORDERS_KEY = 'ku_gur_orders_v2';
const ADDRESS_KEY = 'ku_gur_addresses_v1';
const ACCOUNT_KEY = 'ku_gur_account_v1';
const RECENT_KEY = 'ku_recently_viewed_v1';
const LOYALTY_KEY = 'ku_loyalty_wallet_v1';
const LANG_KEY = 'ku_marketplace_lang_v1';

const MEGA_SUBCATEGORIES: Record<string, string[]> = {
  patali: ['চুয়াডাঙ্গা খাঁটি পাটালি', 'হাজারী পাটালি গুড়', 'ফয়েল প্যাক পাটালি'],
  danadar: ['দানাদার খেজুর গুড়', 'নলেন দানাদার গুড়', 'হাঁড়ি প্যাক ১ কেজি'],
  jhola: ['তাজা ঝোলা / নলেন গুড়', 'পিঠা স্পেশাল লিকুইড গুড়', 'বোতলজাত ঝোলা গুড়'],
  combo: ['শীতের ট্রিপল গুড় কম্বো', 'ফ্যামিলি অর্গানিক বক্স', 'উপহার সুপারফুড কম্বো'],
  honey: ['সুন্দরবনের খলিশা মধু', 'কালোজিরা ফুলের মধু', 'সরিষা ও লিচু ফুলের মধু'],
  'ghee-oil': ['সিরাজগঞ্জের গাওয়া ঘি', 'ঘানি ভাঙা সরিষার তেল', 'এক্সট্রা ভার্জিন নারিকেল তেল'],
  'dates-nuts': ['মদিনার আজওয়া খেজুর', 'মরিয়ম ও মেডজুল খেজুর', 'মধুময় বাদাম ও কাজু'],
  'spices-seeds': ['অর্গানিক চিয়া সিড', 'কালোজিরা ও তোকমা', 'খাঁটি হলুদ ও মরিচ গুঁড়া'],
};

const HERO_SLIDES: HeroBannerConfig[] = [
  {
    id: 'slide-1',
    image: ORGANIC_IMAGES.sliderGurWinter,
    alt: 'চুয়াডাঙ্গার খাঁটি পাটালি, দানাদার ও ঝোলা খেজুরের গুড়',
    targetProductId: 'patali-gur',
  },
  {
    id: 'slide-2',
    image: ORGANIC_IMAGES.sliderOrganicSuperfoods,
    alt: 'সুন্দরবনের মধু, গাওয়া ঘি, সরিষার তেল ও মধুময় বাদাম',
    targetProductId: 'sundarban-raw-honey',
  },
  {
    id: 'slide-3',
    image: ORGANIC_IMAGES.heroHarvest,
    alt: 'খাঁটি অর্গানিক সুপারফুড সংগ্রহ',
    targetProductId: 'desi-gawa-ghee',
  },
  {
    id: 'slide-4',
    image: ORGANIC_IMAGES.bannerOil,
    alt: 'ঘানি ভাঙা খাঁটি সরিষা ও কালোজিরার তেল',
    targetProductId: 'ghani-mustard-oil',
  },
  {
    id: 'slide-5',
    image: ORGANIC_IMAGES.bannerHoney,
    alt: 'প্রাকৃতিক মধু ও মধুময় বাদাম বিশেষ অফার',
    targetProductId: 'honey-nuts-modhumoy',
  },
  {
    id: 'slide-6',
    image: GUR_IMAGES.heroGur,
    alt: 'শীতের ট্রিপল খেজুরের গুড় কম্বো প্যাক',
    targetProductId: 'triple-combo',
  },
];

const HERO_SLIDE_META: Record<string, { origin: string; headline: string }> = {
  'slide-1': {
    origin: 'সরোজগঞ্জ, চুয়াডাঙ্গা · শীতের তাজা সংগ্রহ',
    headline: 'চুয়াডাঙ্গার খাঁটি পাটালি, দানাদার ও ঝোলা খেজুরের গুড়',
  },
  'slide-2': {
    origin: 'সুন্দরবন ও মদিনা · প্রাকৃতিক সুপারফুড',
    headline: 'সুন্দরবনের মধু, গাওয়া ঘি ও ৭ পদের মধুময় বাদাম',
  },
  'slide-3': {
    origin: 'সিরাজগঞ্জ ও পাবনা · বাথান সংগ্রহ',
    headline: 'শতভাগ খাঁটি ও প্রিজারভেটিভমুক্ত অর্গানিক খাদ্যভাণ্ডার',
  },
  'slide-4': {
    origin: 'নিজস্ব ঘানি · কোল্ড-প্রেসড তেল',
    headline: 'দেশি মাঘী সরিষা ও মিশরীয় কালোজিরার খাঁটি তেল',
  },
  'slide-5': {
    origin: 'স্পেশাল হারভেস্ট প্যাক · ফ্রি ডেলিভারিযোগ্য',
    headline: 'প্রাকৃতিক চাক ও কালোজিরা ফুলের মধুর সাথে মধুময় বাদাম',
  },
  'slide-6': {
    origin: 'চুয়াডাঙ্গা হাব · ফ্যামিলি সেভিংস',
    headline: 'একই অর্ডারে পাটালি, দানাদার ও নলেন ঝোলা গুড় কম্বো',
  },
};

type ActiveScreen = 'home' | 'pdp' | 'checkout' | 'account' | 'add-address' | 'admin' | 'seller';

function isAdminUrlRequested(): boolean {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname.replace(/\/+$/, '').toLowerCase();
  const hash = window.location.hash.toLowerCase();
  const params = new URLSearchParams(window.location.search);
  return path === '/admin' || hash === '#admin' || params.get('admin') === '1';
}

function isSellerUrlRequested(): boolean {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname.replace(/\/+$/, '').toLowerCase();
  const hash = window.location.hash.toLowerCase();
  const params = new URLSearchParams(window.location.search);
  return path === '/seller' || hash === '#seller' || params.get('seller') === '1';
}

function darkenHex(hex: string, factor = 0.85): string {
  const clean = hex.replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return '#562EA8';
  const r = Math.max(0, Math.min(255, Math.round(parseInt(clean.slice(0, 2), 16) * factor)));
  const g = Math.max(0, Math.min(255, Math.round(parseInt(clean.slice(2, 4), 16) * factor)));
  const b = Math.max(0, Math.min(255, Math.round(parseInt(clean.slice(4, 6), 16) * factor)));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function lightenHex(hex: string, ratio = 0.16): string {
  const clean = hex.replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return '#7F48CD';
  const r = Math.min(255, Math.round(parseInt(clean.slice(0, 2), 16) + (255 - parseInt(clean.slice(0, 2), 16)) * ratio));
  const g = Math.min(255, Math.round(parseInt(clean.slice(2, 4), 16) + (255 - parseInt(clean.slice(2, 4), 16)) * ratio));
  const b = Math.min(255, Math.round(parseInt(clean.slice(4, 6), 16) + (255 - parseInt(clean.slice(4, 6), 16)) * ratio));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export default function App() {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  });
  const [wishlistIds, setWishlistIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(WISHLIST_KEY);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });
  const [orders, setOrders] = useState<OrderReceipt[]>(() => {
    try {
      const raw = localStorage.getItem(ORDERS_KEY);
      return raw ? (JSON.parse(raw) as OrderReceipt[]) : [];
    } catch {
      return [];
    }
  });
  const [addresses, setAddresses] = useState<SavedAddress[]>(() => {
    try {
      const raw = localStorage.getItem(ADDRESS_KEY);
      return raw ? (JSON.parse(raw) as SavedAddress[]) : [];
    } catch {
      return [];
    }
  });
  const [account, setAccount] = useState<UserAccount>(() => {
    try {
      const raw = localStorage.getItem(ACCOUNT_KEY);
      return raw
        ? (JSON.parse(raw) as UserAccount)
        : {
            isLoggedIn: true,
            username: 'khidmatulummahshopbd',
            phone: BRAND_INFO.rawPhone,
            email: BRAND_INFO.email,
          };
    } catch {
      return {
        isLoggedIn: true,
        username: 'khidmatulummahshopbd',
        phone: BRAND_INFO.rawPhone,
        email: BRAND_INFO.email,
      };
    }
  });

  const [activeScreen, setActiveScreen] = useState<ActiveScreen>(() =>
    isAdminUrlRequested() ? 'admin' : isSellerUrlRequested() ? 'seller' : 'home'
  );
  const [previousScreen, setPreviousScreen] = useState<ActiveScreen>('home');
  const [activeCategory, setActiveCategory] = useState<CategorySlug>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [catalogCollectionTab, setCatalogCollectionTab] = useState<
    'all' | 'featured' | 'bestseller' | 'new'
  >('all');
  const [catalogSort, setCatalogSort] = useState<
    'default' | 'price-asc' | 'price-desc' | 'best-selling' | 'newest'
  >('default');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterBusy, setNewsletterBusy] = useState(false);

  // Daraz-style Multi-Vendor, Language, PLP Filters, Loyalty & Modals
  const [lang, setLang] = useState<MarketplaceLanguage>(() => {
    try {
      return localStorage.getItem(LANG_KEY) === 'en' ? 'en' : 'bn';
    } catch {
      return 'bn';
    }
  });
  const [vendors, setVendors] = useState<VendorStoreRecord[]>(DEFAULT_VENDORS);
  const [subOrders, setSubOrders] = useState<SubOrderRecord[]>([]);
  const [productQuestions, setProductQuestions] = useState<ProductQuestionRecord[]>([]);
  const [sellerPayouts, setSellerPayouts] = useState<SellerPayoutRecord[]>([]);
  const [loyaltyWallet, setLoyaltyWallet] = useState<LoyaltyWalletRecord>(() => {
    try {
      const raw = localStorage.getItem(LOYALTY_KEY);
      if (raw) return JSON.parse(raw) as LoyaltyWalletRecord;
    } catch {
      // ignore
    }
    return {
      userId: 'guest',
      coins: 120,
      streakDays: 1,
      lastCheckInDate: '',
      lastSpinDate: '',
      referralCode: 'KUS-BD100',
      collectedVouchers: [],
    };
  });

  const [activeVendorId, setActiveVendorId] = useState<string | null>(null);
  const [followedVendorIds, setFollowedVendorIds] = useState<string[]>([]);
  const [hoveredMegaCat, setHoveredMegaCat] = useState<CategorySlug | null>(null);
  const [visualSearchOpen, setVisualSearchOpen] = useState(false);
  const [loyaltyOpen, setLoyaltyOpen] = useState(false);
  const [appQrOpen, setAppQrOpen] = useState(false);
  const [chatVendor, setChatVendor] = useState<VendorStoreRecord | null>(null);
  const [chatProduct, setChatProduct] = useState<Product | null>(null);

  // PLP Advanced Sidebar Filters & Grid/List View
  const [plpFiltersOpen, setPlpFiltersOpen] = useState(false);
  const [selectedVendorFilterIds, setSelectedVendorFilterIds] = useState<string[]>([]);
  const [minPriceFilter, setMinPriceFilter] = useState('');
  const [maxPriceFilter, setMaxPriceFilter] = useState('');
  const [minRatingFilter, setMinRatingFilter] = useState<0 | 4>(0);
  const [filterMallOnly, setFilterMallOnly] = useState(false);
  const [filterFreeShippingOnly, setFilterFreeShippingOnly] = useState(false);
  const [filterCodOnly, setFilterCodOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [justForYouCount, setJustForYouCount] = useState(12);
  const justForYouSentinelRef = useRef<HTMLDivElement | null>(null);

  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });

  // Firebase Auth & Firestore Live State
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [firestoreProducts, setFirestoreProducts] = useState<Product[]>([]);
  const [firestoreVouchers, setFirestoreVouchers] = useState<VoucherRecord[]>([]);
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [themeAdvanced, setThemeAdvanced] = useState<ShopifyThemeAdvancedConfig>(DEFAULT_THEME_ADVANCED);
  const [cloudOrders, setCloudOrders] = useState<OrderReceipt[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUserRecord[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUserProfile[]>([]);
  const [reviews, setReviews] = useState<ProductReviewRecord[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);
  const [subscribers, setSubscribers] = useState<SubscriberRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
  const [courierParcels, setCourierParcels] = useState<CourierParcelRecord[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseRecord[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovementRecord[]>([]);
  const [purchases, setPurchases] = useState<PurchaseOrderRecord[]>([]);
  const [accountingEntries, setAccountingEntries] = useState<AccountingEntryRecord[]>([]);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [cmsPages, setCmsPages] = useState<CmsPageRecord[]>(DEFAULT_CMS_PAGES);
  const [customersCrm, setCustomersCrm] = useState<CustomerCrmRecord[]>([]);
  const [myCustomerCrm, setMyCustomerCrm] = useState<CustomerCrmRecord | null>(null);
  const [adminNotifications, setAdminNotifications] = useState<AdminNotificationRecord[]>([]);
  const [cmsModalSlug, setCmsModalSlug] = useState<string | null>(null);

  const activeProducts = useMemo(() => {
    if (firestoreProducts.length === 0) return PRODUCTS;
    const byId = new Map<string, Product>();
    for (const p of firestoreProducts) {
      byId.set(p.id, p);
    }
    // Keep default catalog items visible if only a few products have been saved/edited in Firestore
    if (firestoreProducts.length < 4) {
      for (const p of PRODUCTS) {
        if (!byId.has(p.id)) byId.set(p.id, p);
      }
    }
    return Array.from(byId.values());
  }, [firestoreProducts]);

  const recentlyViewedProducts = useMemo(
    () =>
      recentlyViewedIds
        .map((id) => activeProducts.find((p) => p.id === id))
        .filter((p): p is Product => Boolean(p)),
    [recentlyViewedIds, activeProducts]
  );

  const activeHeroSlides = useMemo(
    () =>
      storeSettings.heroBanners && storeSettings.heroBanners.length > 0
        ? storeSettings.heroBanners
        : HERO_SLIDES,
    [storeSettings.heroBanners]
  );

  const extendedHeroSlides = useMemo(() => {
    if (activeHeroSlides.length === 0) return [];
    return [
      activeHeroSlides[activeHeroSlides.length - 1],
      ...activeHeroSlides,
      activeHeroSlides[0],
    ];
  }, [activeHeroSlides]);

  const slideCloneCount = useMemo(
    () => Math.min(6, activeProducts.length),
    [activeProducts.length]
  );

  const extendedSlideProducts = useMemo(() => {
    if (activeProducts.length === 0) return [];
    const n = Math.min(6, activeProducts.length);
    return [
      ...activeProducts.slice(-n),
      ...activeProducts,
      ...activeProducts.slice(0, n),
    ];
  }, [activeProducts]);

  const [activeOrderReceipt, setActiveOrderReceipt] = useState<OrderReceipt | null>(null);
  const [pdpProduct, setPdpProduct] = useState<Product>(PRODUCTS[0]);
  const [singleProduct, setSingleProduct] = useState<Product>(PRODUCTS[0]);
  const [modalProduct, setModalProduct] = useState<Product | null>(null);

  const resolvedPdpProduct = useMemo(
    () => activeProducts.find((p) => p.id === pdpProduct.id) ?? pdpProduct,
    [activeProducts, pdpProduct]
  );
  const resolvedSingleProduct = useMemo(
    () => activeProducts.find((p) => p.id === singleProduct.id) ?? singleProduct,
    [activeProducts, singleProduct]
  );
  const resolvedModalProduct = useMemo(
    () =>
      modalProduct ? activeProducts.find((p) => p.id === modalProduct.id) ?? modalProduct : null,
    [activeProducts, modalProduct]
  );
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [trackOpen, setTrackOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<GalleryPhoto | null>(null);
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);
  const [toast, setToast] = useState<string | null>(null);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('ku_read_notifs_v1');
      return saved ? (JSON.parse(saved) as string[]) : [];
    } catch {
      return [];
    }
  });
  const [promoPopupOpen, setPromoPopupOpen] = useState<boolean>(false);
  const [mobileCategorySheetOpen, setMobileCategorySheetOpen] = useState<boolean>(false);

  useEffect(() => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      if (localStorage.getItem('ku_popup_hide_date') === today) return;
    } catch {
      // ignore storage errors
    }
    let hasScrolled = false;
    let dwellReady = false;
    let triggered = false;
    const maybeOpen = () => {
      if (triggered || !hasScrolled || !dwellReady || activeScreen !== 'home') return;
      triggered = true;
      setPromoPopupOpen(true);
    };
    const onScroll = () => {
      if (window.scrollY > 180) {
        hasScrolled = true;
        maybeOpen();
      }
    };
    const timer = window.setTimeout(() => {
      dwellReady = true;
      maybeOpen();
    }, 12000);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('scroll', onScroll);
    };
  }, [activeScreen]);

  const [isNoticeStickyScrolled, setIsNoticeStickyScrolled] = useState(false);

  useEffect(() => {
    const syncNoticeScroll = () => {
      setIsNoticeStickyScrolled(window.scrollY > 12);
    };
    syncNoticeScroll();
    window.addEventListener('scroll', syncNoticeScroll, { passive: true });
    return () => window.removeEventListener('scroll', syncNoticeScroll);
  }, []);

  const [secondsLeft, setSecondsLeft] = useState(5 * 86400 + 3 * 3600 + 13 * 60 + 53);

  const [heroSlideIdx, setHeroSlideIdx] = useState(1);
  const [heroTransition, setHeroTransition] = useState(true);
  const [isHeroPaused, setIsHeroPaused] = useState(false);

  const [productSlideIdx, setProductSlideIdx] = useState(6);
  const [productTransition, setProductTransition] = useState(true);
  const [isProductPaused, setIsProductPaused] = useState(false);

  const heroSwipe = useSwipeDrag({
    thresholdPx: 25,
    onPauseChange: setIsHeroPaused,
    onNext: () => {
      setHeroTransition(true);
      setHeroSlideIdx((prev) => (prev >= activeHeroSlides.length + 1 ? 1 : prev + 1));
    },
    onPrev: () => {
      setHeroTransition(true);
      setHeroSlideIdx((prev) => (prev <= 0 ? activeHeroSlides.length : prev - 1));
    },
  });

  const productSwipe = useSwipeDrag({
    thresholdPx: 22,
    multiStepPx: 185,
    onPauseChange: setIsProductPaused,
    onNext: (steps = 1) => {
      setProductTransition(true);
      setProductSlideIdx((prev) =>
        Math.min(activeProducts.length + slideCloneCount, prev + steps)
      );
    },
    onPrev: (steps = 1) => {
      setProductTransition(true);
      setProductSlideIdx((prev) => Math.max(0, prev - steps));
    },
  });

  // Sync URL (#admin / /admin / #seller / /seller) navigation
  useEffect(() => {
    const handleLocationSync = () => {
      if (isAdminUrlRequested()) {
        setActiveScreen('admin');
      } else if (isSellerUrlRequested()) {
        setActiveScreen('seller');
      }
    };
    window.addEventListener('hashchange', handleLocationSync);
    window.addEventListener('popstate', handleLocationSync);
    return () => {
      window.removeEventListener('hashchange', handleLocationSync);
      window.removeEventListener('popstate', handleLocationSync);
    };
  }, []);

  // Firebase Authentication Listener & Role Check
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (!user || !user.emailVerified) {
        setIsAdminUser(false);
        setCloudOrders([]);
        setAdminUsers([]);
        return;
      }

      void upsertUserProfile(user).catch(() => undefined);

      if (user.email === BOOTSTRAPPED_ADMIN_EMAIL) {
        setIsAdminUser(true);
        return;
      }

      try {
        const adminDoc = await getDoc(doc(db, 'admins', user.uid));
        setIsAdminUser(adminDoc.exists());
      } catch {
        setIsAdminUser(false);
      }
    });
    return () => unsub();
  }, []);

  // Dynamic SEO <title> and <meta name="description"> sync
  useEffect(() => {
    if (storeSettings.seoTitle) {
      document.title = storeSettings.seoTitle;
    }
    if (storeSettings.seoDescription) {
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', storeSettings.seoDescription);
      }
    }
  }, [storeSettings.seoTitle, storeSettings.seoDescription]);

  // Hydrate & sync Online Store 2.0 Advanced Theme Config
  useEffect(() => {
    fetch('/api/shopify/workspace')
      .then((r) => r.json())
      .then((data: { workspace?: ShopifyWorkspaceState }) => {
        if (data?.workspace?.themeAdvanced) {
          setThemeAdvanced({
            ...DEFAULT_THEME_ADVANCED,
            ...data.workspace.themeAdvanced,
            sections:
              Array.isArray(data.workspace.themeAdvanced.sections) &&
              data.workspace.themeAdvanced.sections.length > 0
                ? data.workspace.themeAdvanced.sections
                : DEFAULT_THEME_ADVANCED.sections,
          });
        }
      })
      .catch(() => undefined);

    const onUpdated = (evt: Event) => {
      const detail = (evt as CustomEvent<ShopifyThemeAdvancedConfig>).detail;
      if (detail) {
        setThemeAdvanced({
          ...DEFAULT_THEME_ADVANCED,
          ...detail,
          sections:
            Array.isArray(detail.sections) && detail.sections.length > 0
              ? detail.sections
              : DEFAULT_THEME_ADVANCED.sections,
        });
      }
    };
    window.addEventListener('ku-theme-advanced-updated', onUpdated);
    return () => window.removeEventListener('ku-theme-advanced-updated', onUpdated);
  }, []);

  // Dynamic Brand Colors, Typography, Design Tokens & Website Canvas CSS Variables
  useEffect(() => {
    const root = document.documentElement;
    const primary = storeSettings.primaryColor || '#663CBC';
    const primaryLight =
      primary.toUpperCase() === '#663CBC' ? '#7F48CD' : lightenHex(primary, 0.16);
    const secondary = storeSettings.secondaryColor || '#081149';
    const accent = storeSettings.accentColor || '#2563EB';
    const rawBg = storeSettings.backgroundColor || '#EDF4FF';
    const isDefaultCanvas =
      rawBg.toUpperCase() === '#EDF4FF' || rawBg.toUpperCase() === '#F5F5F5';
    const siteBg =
      themeAdvanced.surfaceMode === 'dark-slate' && isDefaultCanvas
        ? '#0B0F19'
        : themeAdvanced.surfaceMode === 'warm-ivory' && isDefaultCanvas
          ? '#FAF6EE'
          : rawBg;
    const fontTpl =
      FONT_TEMPLATES.find((f) => f.id === (storeSettings.fontStyle ?? 'plus-jakarta')) ??
      FONT_TEMPLATES[0];

    const btnRadius =
      themeAdvanced.buttonRadius === 'pill'
        ? '9999px'
        : themeAdvanced.buttonRadius === 'sharp'
          ? '4px'
          : '10px';
    const cardRadius =
      themeAdvanced.cardRadius === 'curvy'
        ? '20px'
        : themeAdvanced.cardRadius === 'sharp'
          ? '6px'
          : '12px';
    const cardShadow =
      themeAdvanced.cardElevation === 'flat'
        ? 'none'
        : themeAdvanced.cardElevation === 'elevated'
          ? '0.5px 2.5px 0 -1px var(--brand-primary), 0 12px 28px -6px rgba(8, 17, 73, 0.1)'
          : '0.5px 2.5px 0 -1px var(--brand-primary), 0 4px 14px rgba(15, 23, 42, 0.04)';
    const containerMax =
      themeAdvanced.containerWidth === 'full'
        ? '1520px'
        : themeAdvanced.containerWidth === 'wide'
          ? '1380px'
          : '1240px';
    const fontScale =
      themeAdvanced.bodyFontScale === 'compact'
        ? '0.94'
        : themeAdvanced.bodyFontScale === 'large'
          ? '1.06'
          : '1';

    root.style.setProperty('--brand-primary', primary);
    root.style.setProperty('--brand-primary-light', primaryLight);
    root.style.setProperty('--brand-primary-hover', darkenHex(primary, 0.86));
    root.style.setProperty('--brand-secondary', secondary);
    root.style.setProperty('--brand-accent', accent);
    root.style.setProperty('--site-bg', siteBg);
    root.style.setProperty('--brand-tint', `${primary}14`);
    root.style.setProperty('--site-font-body', fontTpl.cssFamily);
    root.style.setProperty('--site-font-heading', fontTpl.headingFamily);
    root.style.setProperty('--theme-btn-radius', btnRadius);
    root.style.setProperty('--theme-card-radius', cardRadius);
    root.style.setProperty('--theme-card-shadow', cardShadow);
    root.style.setProperty('--theme-container-max', containerMax);
    root.style.setProperty('--theme-heading-weight', themeAdvanced.headingWeight || '800');
    root.style.setProperty('--site-font-scale', fontScale);
  }, [
    storeSettings.primaryColor,
    storeSettings.secondaryColor,
    storeSettings.accentColor,
    storeSettings.backgroundColor,
    storeSettings.fontStyle,
    themeAdvanced,
  ]);

  // Public Firestore Catalog, Vouchers, Reviews, Vendors, Q&A, CMS Pages & Store Settings Sync
  useEffect(() => {
    const {
      productsRef,
      vouchersRef,
      reviewsRef,
      cmsPagesRef,
      vendorsRef,
      productQuestionsRef,
      settingsDocRef,
    } = getStoreCollectionRefs();

    const unsubProducts = onSnapshot(
      productsRef,
      (snap) => {
        const list = snap.docs.map((d) => d.data() as Product);
        if (list.length > 0) {
          setFirestoreProducts(list);
        } else {
          setFirestoreProducts([]);
        }
      },
      () => undefined
    );

    const unsubVouchers = onSnapshot(
      vouchersRef,
      (snap) => {
        const list = snap.docs.map((d) => d.data() as VoucherRecord);
        setFirestoreVouchers(list);
      },
      () => undefined
    );

    const unsubReviews = onSnapshot(
      reviewsRef,
      (snap) => {
        const list = snap.docs.map((d) =>
          mapFirestoreReview(d.data() as Record<string, unknown>, d.id)
        );
        setReviews(list);
      },
      () => undefined
    );

    const unsubVendors = onSnapshot(
      vendorsRef,
      (snap) => {
        const live = snap.docs.map((d) =>
          mapFirestoreVendor(d.data() as Record<string, unknown>, d.id)
        );
        const merged = new Map<string, VendorStoreRecord>();
        for (const dv of DEFAULT_VENDORS) merged.set(dv.id, dv);
        for (const lv of live) merged.set(lv.id, lv);
        setVendors(Array.from(merged.values()));
      },
      () => undefined
    );

    const unsubQuestions = onSnapshot(
      productQuestionsRef,
      (snap) => {
        const list = snap.docs.map((d) =>
          mapFirestoreProductQuestion(d.data() as Record<string, unknown>, d.id)
        );
        list.sort((a, b) => (b.id > a.id ? 1 : -1));
        setProductQuestions(list);
      },
      () => undefined
    );

    const unsubCmsPages = onSnapshot(
      cmsPagesRef,
      (snap) => {
        const list = snap.docs.map((d) =>
          mapFirestoreCmsPage(d.data() as Record<string, unknown>, d.id)
        );
        if (list.length > 0) {
          setCmsPages(list);
        } else {
          setCmsPages(DEFAULT_CMS_PAGES);
        }
      },
      () => undefined
    );

    const unsubSettings = onSnapshot(
      settingsDocRef,
      (snap) => {
        if (snap.exists()) {
          const d = snap.data() as Partial<StoreSettings>;
          const isLegacyOrangeDefault =
            (!d.themePreset || d.themePreset === 'daraz-orange') &&
            (!d.primaryColor || d.primaryColor.toUpperCase() === '#F85606');
          setStoreSettings({
            ...DEFAULT_STORE_SETTINGS,
            ...d,
            ...(isLegacyOrangeDefault
              ? {
                  themePreset: DEFAULT_STORE_SETTINGS.themePreset,
                  primaryColor: DEFAULT_STORE_SETTINGS.primaryColor,
                  secondaryColor: DEFAULT_STORE_SETTINGS.secondaryColor,
                  accentColor: DEFAULT_STORE_SETTINGS.accentColor,
                  backgroundColor: DEFAULT_STORE_SETTINGS.backgroundColor,
                }
              : {}),
            noticeText: d.noticeText || DEFAULT_STORE_SETTINGS.noticeText,
            popupTitle: d.popupTitle || DEFAULT_STORE_SETTINGS.popupTitle,
            popupBody: d.popupBody || DEFAULT_STORE_SETTINGS.popupBody,
            popupEnabled:
              typeof d.popupEnabled === 'boolean'
                ? d.popupEnabled
                : DEFAULT_STORE_SETTINGS.popupEnabled,
            dhakaDeliveryFee: Number(d.dhakaDeliveryFee ?? DEFAULT_STORE_SETTINGS.dhakaDeliveryFee),
            outsideDeliveryFee: Number(
              d.outsideDeliveryFee ?? DEFAULT_STORE_SETTINGS.outsideDeliveryFee
            ),
            freeShippingMin: Number(d.freeShippingMin ?? DEFAULT_STORE_SETTINGS.freeShippingMin),
          });
        }
      },
      () => undefined
    );

    return () => {
      unsubProducts();
      unsubVouchers();
      unsubReviews();
      unsubVendors();
      unsubQuestions();
      unsubCmsPages();
      unsubSettings();
    };
  }, []);

  // Authenticated Orders, Sub-Orders, Payouts, User Profile & Admin ERP Registry Listeners
  useEffect(() => {
    if (!firebaseUser || !firebaseUser.emailVerified) {
      setCloudOrders([]);
      setAdminUsers([]);
      setRegisteredUsers([]);
      setSuppliers([]);
      setSubscribers([]);
      setAuditLogs([]);
      setCourierParcels([]);
      setWarehouses([]);
      setStockMovements([]);
      setPurchases([]);
      setAccountingEntries([]);
      setEmployees([]);
      setCustomersCrm([]);
      setMyCustomerCrm(null);
      setAdminNotifications([]);
      setSubOrders([]);
      setSellerPayouts([]);
      return;
    }

    const {
      ordersRef,
      adminsRef,
      usersRef,
      suppliersRef,
      subscribersRef,
      auditLogsRef,
      courierParcelsRef,
      warehousesRef,
      stockMovementsRef,
      purchasesRef,
      accountingEntriesRef,
      employeesRef,
      customersCrmRef,
      adminNotificationsRef,
      subOrdersRef,
      sellerPayoutsRef,
    } = getStoreCollectionRefs();
    const isBootstrapped = firebaseUser.email === BOOTSTRAPPED_ADMIN_EMAIL;
    const hasAdminAccess = isAdminUser || isBootstrapped;

    const unsubUserProfile = onSnapshot(
      doc(db, 'users', firebaseUser.uid),
      (snap) => {
        if (snap.exists()) {
          const profile = mapFirestoreUserProfile(
            snap.data() as Record<string, unknown>,
            firebaseUser.uid
          );
          setAccount((prev) => ({
            ...prev,
            isLoggedIn: true,
            username: profile.displayName || prev.username,
            email: profile.email || prev.email,
            phone: profile.phone || prev.phone,
            phoneVerified: profile.phoneVerified ?? prev.phoneVerified,
            avatarUrl: profile.avatarUrl ?? prev.avatarUrl,
            division: profile.division ?? prev.division,
            district: profile.district ?? prev.district,
            upazila: profile.upazila ?? prev.upazila,
            address: profile.address ?? prev.address,
            gender: (profile.gender as UserAccount['gender']) ?? prev.gender,
            dateOfBirth: profile.dateOfBirth ?? prev.dateOfBirth,
            bio: profile.bio ?? prev.bio,
          }));
        }
      },
      () => undefined
    );

    const ordersQuery = hasAdminAccess
      ? ordersRef
      : query(ordersRef, where('userId', '==', firebaseUser.uid));

    const unsubOrders = onSnapshot(
      ordersQuery,
      (snap) => {
        const list = snap.docs.map((d) =>
          mapFirestoreOrderToReceipt(d.data() as Record<string, unknown>, d.id)
        );
        list.sort((a, b) => (b.orderId > a.orderId ? 1 : -1));
        setCloudOrders(list);
      },
      () => undefined
    );

    let unsubAdmins: () => void = () => undefined;
    let unsubRegisteredUsers: () => void = () => undefined;
    let unsubSuppliers: () => void = () => undefined;
    let unsubSubscribers: () => void = () => undefined;
    let unsubAuditLogs: () => void = () => undefined;
    let unsubParcels: () => void = () => undefined;
    let unsubWarehouses: () => void = () => undefined;
    let unsubStockMovements: () => void = () => undefined;
    let unsubPurchases: () => void = () => undefined;
    let unsubAccounting: () => void = () => undefined;
    let unsubEmployees: () => void = () => undefined;
    let unsubCustomersCrm: () => void = () => undefined;
    let unsubMyCrm: () => void = () => undefined;
    let unsubNotifications: () => void = () => undefined;

    if (hasAdminAccess) {
      unsubAdmins = onSnapshot(
        adminsRef,
        (snap) => {
          const list = snap.docs.map((d) =>
            mapFirestoreAdmin(d.data() as Record<string, unknown>, d.id)
          );
          setAdminUsers(list);
        },
        () => undefined
      );
      unsubRegisteredUsers = onSnapshot(
        usersRef,
        (snap) => {
          const list = snap.docs.map((d) =>
            mapFirestoreUserProfile(d.data() as Record<string, unknown>, d.id)
          );
          setRegisteredUsers(list);
        },
        () => undefined
      );
      unsubSuppliers = onSnapshot(
        suppliersRef,
        (snap) => {
          setSuppliers(
            snap.docs.map((d) => mapFirestoreSupplier(d.data() as Record<string, unknown>, d.id))
          );
        },
        () => undefined
      );
      unsubSubscribers = onSnapshot(
        subscribersRef,
        (snap) => {
          setSubscribers(
            snap.docs.map((d) => mapFirestoreSubscriber(d.data() as Record<string, unknown>, d.id))
          );
        },
        () => undefined
      );
      unsubAuditLogs = onSnapshot(
        auditLogsRef,
        (snap) => {
          const logs = snap.docs.map((d) =>
            mapFirestoreAuditLog(d.data() as Record<string, unknown>, d.id)
          );
          logs.sort((a, b) => (b.id > a.id ? 1 : -1));
          setAuditLogs(logs);
        },
        () => undefined
      );
      unsubParcels = onSnapshot(
        courierParcelsRef,
        (snap) => {
          setCourierParcels(snap.docs.map((d) => d.data() as CourierParcelRecord));
        },
        () => undefined
      );
      unsubWarehouses = onSnapshot(
        warehousesRef,
        (snap) => {
          setWarehouses(
            snap.docs.map((d) => mapFirestoreWarehouse(d.data() as Record<string, unknown>, d.id))
          );
        },
        () => undefined
      );
      unsubStockMovements = onSnapshot(
        stockMovementsRef,
        (snap) => {
          const list = snap.docs.map((d) =>
            mapFirestoreStockMovement(d.data() as Record<string, unknown>, d.id)
          );
          list.sort((a, b) => (b.id > a.id ? 1 : -1));
          setStockMovements(list);
        },
        () => undefined
      );
      unsubPurchases = onSnapshot(
        purchasesRef,
        (snap) => {
          setPurchases(
            snap.docs.map((d) => mapFirestorePurchase(d.data() as Record<string, unknown>, d.id))
          );
        },
        () => undefined
      );
      unsubAccounting = onSnapshot(
        accountingEntriesRef,
        (snap) => {
          const list = snap.docs.map((d) =>
            mapFirestoreAccountingEntry(d.data() as Record<string, unknown>, d.id)
          );
          list.sort((a, b) => (b.dateText > a.dateText ? 1 : -1));
          setAccountingEntries(list);
        },
        () => undefined
      );
      unsubEmployees = onSnapshot(
        employeesRef,
        (snap) => {
          setEmployees(
            snap.docs.map((d) => mapFirestoreEmployee(d.data() as Record<string, unknown>, d.id))
          );
        },
        () => undefined
      );
      unsubCustomersCrm = onSnapshot(
        customersCrmRef,
        (snap) => {
          setCustomersCrm(
            snap.docs.map((d) =>
              mapFirestoreCustomerCrm(d.data() as Record<string, unknown>, d.id)
            )
          );
        },
        () => undefined
      );
      unsubNotifications = onSnapshot(
        adminNotificationsRef,
        (snap) => {
          const list = snap.docs.map((d) =>
            mapFirestoreNotification(d.data() as Record<string, unknown>, d.id)
          );
          list.sort((a, b) => (b.id > a.id ? 1 : -1));
          setAdminNotifications(list);
        },
        () => undefined
      );
    } else {
      const myCrmQuery = query(customersCrmRef, where('userId', '==', firebaseUser.uid));
      unsubMyCrm = onSnapshot(
        myCrmQuery,
        (snap) => {
          if (snap.docs.length > 0) {
            const first = snap.docs[0];
            setMyCustomerCrm(
              mapFirestoreCustomerCrm(first.data() as Record<string, unknown>, first.id)
            );
          } else {
            setMyCustomerCrm(null);
          }
        },
        () => undefined
      );
    }

    const subOrdersQ = hasAdminAccess
      ? subOrdersRef
      : query(subOrdersRef, where('userId', '==', firebaseUser.uid));
    const unsubSubOrders = onSnapshot(
      subOrdersQ,
      (snap) => {
        const list = snap.docs.map((d) =>
          mapFirestoreSubOrder(d.data() as Record<string, unknown>, d.id)
        );
        list.sort((a, b) => (b.subOrderId > a.subOrderId ? 1 : -1));
        setSubOrders(list);
      },
      () => undefined
    );

    const payoutsQ = hasAdminAccess
      ? sellerPayoutsRef
      : query(sellerPayoutsRef, where('ownerUid', '==', firebaseUser.uid));
    const unsubPayouts = onSnapshot(
      payoutsQ,
      (snap) => {
        const list = snap.docs.map((d) =>
          mapFirestoreSellerPayout(d.data() as Record<string, unknown>, d.id)
        );
        setSellerPayouts(list);
      },
      () => undefined
    );

    const unsubLoyalty = onSnapshot(
      doc(db, 'loyalty_wallets', firebaseUser.uid),
      (snap) => {
        if (snap.exists()) {
          setLoyaltyWallet(
            mapFirestoreLoyaltyWallet(snap.data() as Record<string, unknown>, firebaseUser.uid)
          );
        }
      },
      () => undefined
    );

    return () => {
      unsubUserProfile();
      unsubOrders();
      unsubAdmins();
      unsubRegisteredUsers();
      unsubSuppliers();
      unsubSubscribers();
      unsubAuditLogs();
      unsubParcels();
      unsubWarehouses();
      unsubStockMovements();
      unsubPurchases();
      unsubAccounting();
      unsubEmployees();
      unsubCustomersCrm();
      unsubMyCrm();
      unsubNotifications();
      unsubSubOrders();
      unsubPayouts();
      unsubLoyalty();
    };
  }, [firebaseUser, isAdminUser]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev > 1 ? prev - 1 : 5 * 86400));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isHeroPaused || activeScreen !== 'home') return;
    const timer = setInterval(() => {
      setHeroTransition(true);
      setHeroSlideIdx((prev) => (prev >= activeHeroSlides.length + 1 ? 1 : prev + 1));
    }, 3000);
    return () => clearInterval(timer);
  }, [isHeroPaused, activeScreen, activeHeroSlides.length]);

  useEffect(() => {
    if (isProductPaused || activeScreen !== 'home' || activeProducts.length === 0) return;
    const timer = setInterval(() => {
      setProductTransition(true);
      setProductSlideIdx((prev) =>
        prev >= activeProducts.length + slideCloneCount ? slideCloneCount : prev + 1
      );
    }, 3000);
    return () => clearInterval(timer);
  }, [isProductPaused, activeScreen, activeProducts.length, slideCloneCount]);

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cartItems));
    } catch {
      // ignore
    }
  }, [cartItems]);

  useEffect(() => {
    try {
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlistIds));
    } catch {
      // ignore
    }
  }, [wishlistIds]);

  useEffect(() => {
    try {
      localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    } catch {
      // ignore
    }
  }, [orders]);

  useEffect(() => {
    try {
      localStorage.setItem(ADDRESS_KEY, JSON.stringify(addresses));
    } catch {
      // ignore
    }
  }, [addresses]);

  useEffect(() => {
    try {
      localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
    } catch {
      // ignore
    }
  }, [account]);

  useEffect(() => {
    try {
      localStorage.setItem(LOYALTY_KEY, JSON.stringify(loyaltyWallet));
    } catch {
      // ignore
    }
  }, [loyaltyWallet]);

  useEffect(() => {
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch {
      // ignore
    }
  }, [lang]);

  useEffect(() => {
    const sentinel = justForYouSentinelRef.current;
    if (!sentinel || activeScreen !== 'home') return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setJustForYouCount((prev) =>
            prev < Math.max(activeProducts.length, 24) ? prev + 6 : prev
          );
        }
      },
      { rootMargin: '180px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [activeScreen, activeProducts.length]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const countdown = useMemo(() => {
    const d = Math.floor(secondsLeft / 86400);
    const h = Math.floor((secondsLeft % 86400) / 3600);
    const m = Math.floor((secondsLeft % 3600) / 60);
    const s = secondsLeft % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    return {
      d: pad(d),
      h: pad(h),
      m: pad(m),
      s: pad(s),
      label: `${d} days ${pad(h)}:${pad(m)}:${pad(s)}`,
    };
  }, [secondsLeft]);

  const cartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );
  const cartTotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems]
  );

  const wishlistProducts = useMemo(
    () => activeProducts.filter((p) => wishlistIds.includes(p.id)),
    [activeProducts, wishlistIds]
  );

  const mergedOrders = useMemo(() => {
    const map = new Map<string, OrderReceipt>();
    for (const o of orders) {
      map.set(o.orderId, o);
    }
    for (const c of cloudOrders) {
      map.set(c.orderId, c);
    }
    return Array.from(map.values());
  }, [orders, cloudOrders]);

  const allNotificationIds = useMemo(() => {
    const ids = ['notif-live-notice', 'notif-promo-code', 'notif-free-shipping'];
    if (mergedOrders[0]?.orderId) {
      ids.push(`notif-order-${mergedOrders[0].orderId}`);
    }
    return ids;
  }, [mergedOrders]);

  const unreadNotificationIds = useMemo(
    () => allNotificationIds.filter((id) => !readNotificationIds.includes(id)),
    [allNotificationIds, readNotificationIds]
  );

  const handleMarkAllNotificationsRead = () => {
    setReadNotificationIds(allNotificationIds);
    try {
      localStorage.setItem('ku_read_notifs_v1', JSON.stringify(allNotificationIds));
    } catch {
      // ignore storage errors
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleAuthProvider);
      setToast('Google সাইন-ইন সফল হয়েছে!');
    } catch {
      setToast('Google লগইন বাতিল হয়েছে বা সমস্যা হয়েছে।');
    }
  };

  const handleGoogleLogout = async () => {
    try {
      await signOut(auth);
      setToast('লগআউট সম্পন্ন হয়েছে।');
    } catch {
      setToast('লগআউট করতে সমস্যা হয়েছে।');
    }
  };

  const navigateScreen = (next: ActiveScreen) => {
    setPreviousScreen(activeScreen);
    setActiveScreen(next);
    if (typeof window !== 'undefined') {
      if (next === 'admin') {
        window.history.replaceState(null, '', '#admin');
      } else if (next === 'seller') {
        window.history.replaceState(null, '', '#seller');
      } else if (
        window.location.hash.toLowerCase() === '#admin' ||
        window.location.hash.toLowerCase() === '#seller' ||
        window.location.pathname.toLowerCase() === '/admin' ||
        window.location.pathname.toLowerCase() === '/seller'
      ) {
        window.history.replaceState(null, '', '/');
      }
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  };

  const toggleWishlist = (productId: string) => {
    setWishlistIds((prev) => {
      const exists = prev.includes(productId);
      const next = exists ? prev.filter((id) => id !== productId) : [...prev, productId];
      setToast(exists ? 'উইশলিস্ট থেকে সরানো হয়েছে' : 'উইশলিস্টে সেভ হয়েছে');
      return next;
    });
  };

  const addProductItemToCart = (product: Product, variantId: string, qty = 1) => {
    const variant = product.variants.find((v) => v.id === variantId) ?? product.variants[0];
    const meta = getProductMarketplaceMeta(product, vendors);
    setCartItems((prev) => {
      const idx = prev.findIndex((i) => i.variantId === variant.id);
      if (idx > -1) {
        const copy = [...prev];
        copy[idx] = {
          ...copy[idx],
          quantity: Math.min(20, copy[idx].quantity + qty),
          sellerId: copy[idx].sellerId || meta.seller.id,
          sellerName: copy[idx].sellerName || meta.seller.storeName,
        };
        return copy;
      }
      return [
        ...prev,
        {
          productId: product.id,
          variantId: variant.id,
          name: product.name,
          variantLabel: variant.label,
          price: variant.price,
          image: product.image,
          quantity: qty,
          sellerId: meta.seller.id,
          sellerName: meta.seller.storeName,
        },
      ];
    });
  };

  const handleAddToCart = (
    product: Product,
    variantId: string,
    qty = 1,
    openFullOrderPage = false
  ) => {
    addProductItemToCart(product, variantId, qty);
    if (openFullOrderPage) {
      setActiveOrderReceipt(null);
      navigateScreen('checkout');
    } else {
      setToast(`${product.name} কার্টে যোগ করা হয়েছে`);
    }
  };

  const handleOpenProductDetail = (product: Product) => {
    setPdpProduct(product);
    setRecentlyViewedIds((prev) => {
      const next = [product.id, ...prev.filter((id) => id !== product.id)].slice(0, 6);
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
    navigateScreen('pdp');
  };

  const handleOpenProductOrderPage = (product: Product, variantId?: string) => {
    setSingleProduct(product);
    addProductItemToCart(product, variantId ?? product.variants[0].id, 1);
    setActiveOrderReceipt(null);
    navigateScreen('checkout');
  };

  const handleOpenOrderPageDirect = () => {
    setActiveOrderReceipt(null);
    navigateScreen('checkout');
  };

  const handleUpdateQty = (variantId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.variantId === variantId ? { ...item, quantity: item.quantity + delta } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveItem = (variantId: string) => {
    setCartItems((prev) => prev.filter((item) => item.variantId !== variantId));
  };

  const handleOrderConfirmed = (receipt: OrderReceipt) => {
    setOrders((prev) => [receipt, ...prev.filter((o) => o.orderId !== receipt.orderId)]);
    if (receipt.subOrders && receipt.subOrders.length > 0) {
      setSubOrders((prev) => [...receipt.subOrders!, ...prev]);
    }
    setCartItems([]);
    setActiveOrderReceipt(receipt);
    navigateScreen('checkout');
    setToast(`অর্ডার #${receipt.orderId} কনফার্ম হয়েছে!`);

    const currentUser = auth.currentUser;
    if (currentUser?.emailVerified) {
      void saveOrderToFirestore(receipt, currentUser)
        .then((savedReceipt) => {
          setActiveOrderReceipt(savedReceipt);
        })
        .catch(() => undefined);
    }
  };

  const handleSaveAddress = (newAddr: SavedAddress) => {
    setAddresses((prev) => {
      const mapped = prev.map((a) => ({
        ...a,
        isDefaultShipping: newAddr.isDefaultShipping ? false : a.isDefaultShipping,
        isDefaultBilling: newAddr.isDefaultBilling ? false : a.isDefaultBilling,
      }));
      return [newAddr, ...mapped.filter((a) => a.id !== newAddr.id)];
    });
    setToast('নতুন ডেলিভারি ঠিকানা সেভ হয়েছে!');
    navigateScreen(previousScreen === 'checkout' ? 'checkout' : 'account');
  };

  const handleSelectDefaultAddress = (id: string) => {
    setAddresses((prev) =>
      prev.map((a) => ({
        ...a,
        isDefaultShipping: a.id === id,
      }))
    );
  };

  const handleCancelOrder = async (orderId: string, reason: string) => {
    try {
      await cancelPendingOrderByCustomer(orderId, reason);
      setToast(`অর্ডার #${orderId} বাতিল করা হয়েছে।`);
    } catch {
      setToast('শুধুমাত্র Pending ক্লাউড অর্ডার বাতিল করা যাবে।');
    }
  };

  const handleRequestRefund = async (orderId: string, reason: string) => {
    try {
      await requestOrderRefundByCustomer(orderId, reason);
      setToast(`অর্ডার #${orderId}-এর রিফান্ড অনুরোধ পাঠানো হয়েছে!`);
    } catch {
      setToast('রিফান্ড অনুরোধ পাঠাতে সমস্যা হয়েছে।');
    }
  };

  const handleSubmitProductReview = async (
    rating: number,
    comment: string,
    authorName: string
  ) => {
    const user = auth.currentUser;
    if (!user || !user.emailVerified) {
      setToast('রিভিউ দিতে প্রথমে Google সাইন-ইন করুন।');
      return;
    }
    try {
      await saveReviewToFirestore(
        {
          productId: pdpProduct.id,
          author: authorName || user.displayName || 'Verified Buyer',
          location: 'Bangladesh',
          rating,
          comment,
        },
        user
      );
      setToast('আপনার মূল্যবান রিভিউ যুক্ত হয়েছে!');
    } catch {
      setToast('রিভিউ সাবমিট করতে সমস্যা হয়েছে।');
    }
  };

  const handleSubmitProductQuestion = async (product: Product, question: string) => {
    const meta = getProductMarketplaceMeta(product, vendors);
    const user = auth.currentUser;
    if (!user || !user.emailVerified) {
      setToast('প্রশ্ন করতে প্রথমে Google সাইন-ইন করুন।');
      return;
    }
    try {
      await createProductQuestionInFirestore(
        {
          productId: product.id,
          sellerId: meta.seller.id,
          authorName: user.displayName || account.username || 'Verified Buyer',
          question,
        },
        user
      );
      setToast('আপনার প্রশ্ন বিক্রেতার কাছে পাঠানো হয়েছে!');
    } catch {
      setToast('প্রশ্ন পাঠাতে সমস্যা হয়েছে।');
    }
  };

  const handleUpdateLoyaltyWallet = (next: LoyaltyWalletRecord) => {
    setLoyaltyWallet(next);
    if (auth.currentUser?.emailVerified) {
      void saveLoyaltyWalletToFirestore(next, auth.currentUser).catch(() => undefined);
    }
  };

  const handlePhoneVerified = async (verifiedPhone: string) => {
    if (auth.currentUser) {
      await markPhoneVerifiedInProfile(auth.currentUser, verifiedPhone).catch(() => undefined);
    }
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newsletterEmail.trim().toLowerCase();
    if (!clean || !clean.includes('@')) {
      setToast('সঠিক ইমেইল ঠিকানা লিখুন।');
      return;
    }
    setNewsletterBusy(true);
    try {
      await subscribeNewsletterToFirestore(clean);
      setNewsletterEmail('');
      setToast('নিউজলেটারে সফলভাবে সাবস্ক্রাইব করেছেন!');
    } catch {
      setToast('সাবস্ক্রাইব করতে সমস্যা হয়েছে।');
    } finally {
      setNewsletterBusy(false);
    }
  };

  const handleResetAllFilters = () => {
    setActiveCategory('all');
    setActiveVendorId(null);
    setSelectedVendorFilterIds([]);
    setSearchQuery('');
    setCatalogCollectionTab('all');
    setInStockOnly(false);
    setMinPriceFilter('');
    setMaxPriceFilter('');
    setMinRatingFilter(0);
    setFilterMallOnly(false);
    setFilterFreeShippingOnly(false);
    setFilterCodOnly(false);
    setCatalogSort('default');
  };

  const displayedProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const minP = minPriceFilter.trim() ? Number(minPriceFilter) : 0;
    const maxP = maxPriceFilter.trim() ? Number(maxPriceFilter) : Infinity;

    const filtered = activeProducts.filter((p) => {
      const meta = getProductMarketplaceMeta(p, vendors);
      const matchCat = activeCategory === 'all' || p.category === activeCategory;
      const matchSearch =
        q === '' ||
        p.name.toLowerCase().includes(q) ||
        p.englishName.toLowerCase().includes(q) ||
        p.categoryLabel.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q);
      const matchStock = !inStockOnly || p.inStock;
      const matchCollection =
        catalogCollectionTab === 'all' ||
        (catalogCollectionTab === 'featured' && Boolean(p.isFeatured ?? p.isHotDeal)) ||
        (catalogCollectionTab === 'bestseller' &&
          Boolean(p.isBestSeller ?? p.soldCount >= 100)) ||
        (catalogCollectionTab === 'new' && Boolean(p.isNewArrival ?? true));

      const matchActiveVendor = !activeVendorId || meta.seller.id === activeVendorId;
      const matchVendorCheckboxes =
        selectedVendorFilterIds.length === 0 || selectedVendorFilterIds.includes(meta.seller.id);
      const matchMinPrice = Number.isNaN(minP) || p.price >= minP;
      const matchMaxPrice = Number.isNaN(maxP) || p.price <= maxP;
      const matchRating = minRatingFilter === 0 || meta.rating >= minRatingFilter;
      const matchMall = !filterMallOnly || meta.isMall;
      const matchFreeShip = !filterFreeShippingOnly || meta.freeShipping;
      const matchCod = !filterCodOnly || p.inStock;

      return (
        matchCat &&
        matchSearch &&
        matchStock &&
        matchCollection &&
        matchActiveVendor &&
        matchVendorCheckboxes &&
        matchMinPrice &&
        matchMaxPrice &&
        matchRating &&
        matchMall &&
        matchFreeShip &&
        matchCod
      );
    });

    if (catalogSort === 'price-asc') {
      return [...filtered].sort((a, b) => a.price - b.price);
    }
    if (catalogSort === 'price-desc') {
      return [...filtered].sort((a, b) => b.price - a.price);
    }
    if (catalogSort === 'best-selling') {
      return [...filtered].sort((a, b) => b.soldCount - a.soldCount);
    }
    if (catalogSort === 'newest') {
      return [...filtered].reverse();
    }
    return filtered;
  }, [
    activeProducts,
    vendors,
    activeCategory,
    searchQuery,
    inStockOnly,
    catalogCollectionTab,
    catalogSort,
    activeVendorId,
    selectedVendorFilterIds,
    minPriceFilter,
    maxPriceFilter,
    minRatingFilter,
    filterMallOnly,
    filterFreeShippingOnly,
    filterCodOnly,
  ]);

  const justForYouProducts = useMemo(() => {
    const preferredCategories = new Set(recentlyViewedProducts.map((p) => p.category));
    const prioritized = [...activeProducts].sort((a, b) => {
      const aPref = preferredCategories.has(a.category) ? 1 : 0;
      const bPref = preferredCategories.has(b.category) ? 1 : 0;
      if (aPref !== bPref) return bPref - aPref;
      return b.soldCount - a.soldCount;
    });
    return prioritized.slice(0, justForYouCount);
  }, [activeProducts, recentlyViewedProducts, justForYouCount]);

  const orderedHomepageSections = useMemo(() => {
    const raw =
      themeAdvanced.sections && themeAdvanced.sections.length > 0
        ? themeAdvanced.sections
        : DEFAULT_THEME_ADVANCED.sections;
    const catIdx = raw.findIndex((s) => s.id === 'categories');
    const heroIdx = raw.findIndex((s) => s.id === 'hero');
    const shortcutsIdx = raw.findIndex((s) => s.id === 'shortcuts');
    // Ensure Categories sits right below Hero (matching falaqfood.com homepage flow)
    if (catIdx > heroIdx + 1 && shortcutsIdx === heroIdx + 1) {
      const next = [...raw];
      const [catItem] = next.splice(catIdx, 1);
      next.splice(heroIdx + 1, 0, catItem);
      return next;
    }
    return raw;
  }, [themeAdvanced.sections]);

  // Seller Center Full-Screen View (#seller / /seller)
  if (activeScreen === 'seller') {
    return (
      <>
        <SellerCenterPage
          firebaseUser={firebaseUser}
          vendors={vendors}
          products={activeProducts}
          subOrders={subOrders}
          questions={productQuestions}
          payouts={sellerPayouts}
          vouchers={firestoreVouchers}
          lang={lang}
          onBackToStore={() => navigateScreen('home')}
          onRequireLogin={handleGoogleLogin}
          onLocalVendorUpdate={(updated) => {
            setVendors((prev) => {
              const exists = prev.some((v) => v.id === updated.id);
              return exists
                ? prev.map((v) => (v.id === updated.id ? updated : v))
                : [updated, ...prev];
            });
          }}
          onLocalSubOrderUpdate={(subOrderId, status) => {
            setSubOrders((prev) =>
              prev.map((s) => (s.subOrderId === subOrderId ? { ...s, status } : s))
            );
          }}
        />
        <OfflineIndicator />
        {toast && (
          <div
            role="status"
            aria-live="polite"
            className="fixed bottom-6 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#081149] text-white text-xs font-semibold shadow-xl border brand-border"
          >
            <Check className="w-4 h-4 brand-text" />
            <span>{toast}</span>
          </div>
        )}
      </>
    );
  }

  // Admin Dashboard Full-Screen View
  if (activeScreen === 'admin') {
    return (
      <>
        <AdminPage
          firebaseUser={firebaseUser}
          isAdmin={isAdminUser}
          products={activeProducts}
          firestoreProductsCount={firestoreProducts.length}
          orders={mergedOrders}
          vouchers={firestoreVouchers}
          storeSettings={storeSettings}
          adminUsers={adminUsers}
          registeredUsers={registeredUsers}
          reviews={reviews}
          suppliers={suppliers}
          subscribers={subscribers}
          auditLogs={auditLogs}
          courierParcels={courierParcels}
          warehouses={warehouses}
          stockMovements={stockMovements}
          purchases={purchases}
          accountingEntries={accountingEntries}
          employees={employees}
          cmsPages={cmsPages}
          customersCrm={customersCrm}
          adminNotifications={adminNotifications}
          vendors={vendors}
          subOrders={subOrders}
          payouts={sellerPayouts}
          productQuestions={productQuestions}
          onLocalVendorPatch={(vendorId, patch) => {
            setVendors((prev) => prev.map((v) => (v.id === vendorId ? { ...v, ...patch } : v)));
          }}
          onLocalPayoutPatch={(payoutId, status) => {
            setSellerPayouts((prev) =>
              prev.map((p) => (p.id === payoutId ? { ...p, status } : p))
            );
          }}
          onThemeAdvancedChange={setThemeAdvanced}
          onBackToStore={() => navigateScreen('home')}
          onGoogleLogin={handleGoogleLogin}
          onGoogleLogout={handleGoogleLogout}
          onViewInvoice={(order) => {
            setActiveOrderReceipt(order);
            navigateScreen('checkout');
          }}
          onNotify={setToast}
        />
        <OfflineIndicator />
        {toast && (
          <div
            role="status"
            aria-live="polite"
            className="fixed bottom-6 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#081149] text-white text-xs font-semibold shadow-xl border brand-border"
          >
            <Check className="w-4 h-4 brand-text" />
            <span>{toast}</span>
          </div>
        )}
      </>
    );
  }

  // Screenshot 4 & 6: Add New Address Full-Screen View
  if (activeScreen === 'add-address') {
    return (
      <>
        <AddAddressPage
          onBack={() =>
            navigateScreen(previousScreen === 'checkout' ? 'checkout' : 'account')
          }
          onSaveAddress={handleSaveAddress}
        />
        {toast && (
          <div
            role="status"
            aria-live="polite"
            className="fixed bottom-16 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#081149] text-white text-xs font-semibold shadow-xl border brand-border"
          >
            <Check className="w-4 h-4 brand-text" />
            <span>{toast}</span>
          </div>
        )}
      </>
    );
  }

  // Screenshot 1 & 2: My Account Full-Screen View
  if (activeScreen === 'account') {
    const resolvedCustomerCrm =
      myCustomerCrm ||
      (firebaseUser ? customersCrm.find((c) => c.userId === firebaseUser.uid) ?? null : null);

    return (
      <>
        <AccountPage
          account={account}
          orders={mergedOrders}
          addresses={addresses}
          wishlistCount={wishlistIds.length}
          firebaseUser={firebaseUser}
          vouchers={firestoreVouchers}
          customerCrmRecord={resolvedCustomerCrm}
          loyaltyCoins={loyaltyWallet.coins}
          onBack={() => navigateScreen('home')}
          onUpdateAccount={setAccount}
          onOpenOrderInfo={(order) => {
            setActiveOrderReceipt(order);
            navigateScreen('checkout');
          }}
          onOpenWishlist={() => setWishlistOpen(true)}
          onOpenAddAddress={() => navigateScreen('add-address')}
          onSelectDefaultAddress={handleSelectDefaultAddress}
          onOpenAdmin={() => navigateScreen('admin')}
          onOpenLoyalty={() => setLoyaltyOpen(true)}
          onOpenSellerCenter={() => navigateScreen('seller')}
          onGoogleLogin={handleGoogleLogin}
          onGoogleLogout={handleGoogleLogout}
          onCancelOrder={handleCancelOrder}
          onRequestRefund={handleRequestRefund}
          onPhoneVerified={handlePhoneVerified}
          onSaveUserDetails={(next) =>
            firebaseUser ? saveUserProfileDetailsToFirestore(firebaseUser, next) : Promise.resolve()
          }
          onNotify={setToast}
        />
        <WishlistModal
          isOpen={wishlistOpen}
          products={wishlistProducts}
          onClose={() => setWishlistOpen(false)}
          onRemove={toggleWishlist}
          onOrderNow={handleOpenProductOrderPage}
        />
        <LoyaltyGamesModal
          open={loyaltyOpen}
          onClose={() => setLoyaltyOpen(false)}
          wallet={loyaltyWallet}
          onUpdateWallet={handleUpdateLoyaltyWallet}
          onApplyVoucherCode={(code) => {
            navigator.clipboard?.writeText(code).catch(() => undefined);
            setToast(`ভাউচার ${code} আপনার ওয়ালেটে সেভ হয়েছে!`);
          }}
          lang={lang}
        />
        {toast && (
          <div
            role="status"
            aria-live="polite"
            className="fixed bottom-6 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#081149] text-white text-xs font-semibold shadow-xl border brand-border"
          >
            <Check className="w-4 h-4 brand-text" />
            <span>{toast}</span>
          </div>
        )}
      </>
    );
  }

  // Screenshot 5 & 3: Product Detail View + Bottom Sheet Variant Picker
  if (activeScreen === 'pdp') {
    return (
      <>
        <ProductDetailView
          product={resolvedPdpProduct}
          products={activeProducts}
          reviews={reviews}
          productQuestions={productQuestions}
          vendors={vendors}
          recentlyViewed={recentlyViewedProducts}
          firebaseUser={firebaseUser}
          cartCount={cartCount}
          isWishlisted={wishlistIds.includes(resolvedPdpProduct.id)}
          countdownText={countdown.label}
          onBack={() => navigateScreen('home')}
          onGoHome={() => navigateScreen('home')}
          onOpenCart={() => setCheckoutOpen(true)}
          onToggleWishlist={toggleWishlist}
          onAddToCart={(p, vId, qty) => handleAddToCart(p, vId, qty, false)}
          onBuyNow={(p, vId, qty) => handleAddToCart(p, vId, qty, true)}
          onSelectProduct={handleOpenProductDetail}
          onSubmitReview={handleSubmitProductReview}
          onSubmitQuestion={handleSubmitProductQuestion}
          onVisitStore={(vendorId) => {
            setActiveVendorId(vendorId);
            navigateScreen('home');
            setTimeout(() => {
              document
                .getElementById('vendor-storefront-banner')
                ?.scrollIntoView({ behavior: 'smooth' });
            }, 150);
          }}
          onChatWithVendor={(vendor, product) => {
            setChatVendor(vendor);
            setChatProduct(product);
          }}
          onGoogleLogin={handleGoogleLogin}
          onNotify={setToast}
        />
        <CheckoutDrawer
          isOpen={checkoutOpen}
          items={cartItems}
          vendors={vendors}
          onClose={() => setCheckoutOpen(false)}
          onUpdateQty={handleUpdateQty}
          onRemoveItem={handleRemoveItem}
          onConfirmOrder={handleOrderConfirmed}
          onOpenFullOrderPage={handleOpenOrderPageDirect}
        />
        {chatVendor && (
          <LiveChatWidget
            open={Boolean(chatVendor)}
            onClose={() => setChatVendor(null)}
            vendor={chatVendor}
            productAttachment={chatProduct}
            buyerUid={firebaseUser?.uid}
            buyerName={firebaseUser?.displayName || account.username || 'Guest Buyer'}
            firebaseUser={firebaseUser}
            lang={lang}
            onOpenProduct={handleOpenProductDetail}
          />
        )}
        {toast && (
          <div
            role="status"
            aria-live="polite"
            className="fixed bottom-16 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#081149] text-white text-xs font-semibold shadow-xl border brand-border"
          >
            <Check className="w-4 h-4 brand-text" />
            <span>{toast}</span>
          </div>
        )}
      </>
    );
  }

  // Screenshot 8 + Full-Screen Order Information / Invoice Page
  if (activeScreen === 'checkout') {
    return (
      <>
        <FullScreenOrderPage
          items={cartItems}
          activeReceipt={activeOrderReceipt}
          savedAddresses={addresses}
          products={activeProducts}
          vouchers={firestoreVouchers}
          storeSettings={storeSettings}
          onBackToShop={() => {
            setActiveOrderReceipt(null);
            navigateScreen('home');
          }}
          onOpenAddAddress={() => navigateScreen('add-address')}
          onAddProduct={(p, vId, qty) => addProductItemToCart(p, vId, qty)}
          onUpdateQty={handleUpdateQty}
          onRemoveItem={handleRemoveItem}
          onConfirmOrder={handleOrderConfirmed}
          onClearReceipt={() => setActiveOrderReceipt(null)}
        />
        {toast && (
          <div
            role="status"
            aria-live="polite"
            className="fixed bottom-20 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#081149] text-white text-xs font-semibold shadow-xl border brand-border"
          >
            <Check className="w-4 h-4 brand-text" />
            <span>{toast}</span>
          </div>
        )}
      </>
    );
  }

  const shortcutTiles = [
    {
      label: 'খাঁটি পাটালি',
      sub: 'GUR',
      bg: 'from-[#FF9800] to-[#F57C00]',
      icon: Sparkles,
      action: () => handleOpenProductDetail(PRODUCTS[0]),
    },
    {
      label: 'প্রাকৃতিক মধু',
      sub: 'HONEY',
      bg: 'from-[#FBC02D] to-[#F57F17]',
      icon: Award,
      action: () => handleOpenProductDetail(PRODUCTS[1]),
    },
    {
      label: 'গাওয়া ঘি',
      sub: 'GHEE',
      bg: 'from-[#EC407A] to-[#D81B60]',
      icon: Gift,
      action: () => handleOpenProductDetail(PRODUCTS[3]),
    },
    {
      label: 'সরিষার তেল',
      sub: 'OIL',
      bg: 'from-[#00C853] to-[#008916]',
      icon: Truck,
      action: () => handleOpenProductDetail(PRODUCTS[4]),
    },
    {
      label: 'মধুময় বাদাম',
      sub: 'NUTS',
      bg: 'from-[#7B1FA2] to-[#4A148C]',
      icon: PackageCheck,
      action: () => handleOpenProductDetail(PRODUCTS[5]),
    },
    {
      label: 'কালোজিরা মধু',
      sub: 'BLACK',
      bg: 'from-[#FF5722] to-[#E64A19]',
      icon: Zap,
      action: () => handleOpenProductDetail(PRODUCTS[2]),
    },
    {
      label: 'চিয়া ও সিডস',
      sub: 'SEEDS',
      bg: 'from-[#5C6BC0] to-[#3949AB]',
      icon: Star,
      action: () => handleOpenProductDetail(PRODUCTS[10]),
    },
    {
      label: 'মদিনার খেজুর',
      sub: 'DATES',
      bg: 'from-[#26A69A] to-[#00796B]',
      icon: Leaf,
      action: () => handleOpenProductDetail(PRODUCTS[11]),
    },
    {
      label: 'নারিকেল তেল',
      sub: 'COCO',
      bg: 'from-[#FF6F00] to-[#E65100]',
      icon: Percent,
      action: () => handleOpenProductDetail(PRODUCTS[9]),
    },
    {
      label: 'কম্বো ও মসলা',
      sub: 'MALL',
      bg: 'from-[#512DA8] to-[#311B92]',
      icon: ShieldCheck,
      action: () => {
        setActiveCategory('all');
        document.getElementById('all-organic-catalog')?.scrollIntoView({ behavior: 'smooth' });
      },
    },
  ];

  const websiteTemplate = storeSettings.websiteTemplate ?? 'daraz-mall';
  const cardDesign = storeSettings.productCardDesign ?? 'classic-mall';
  const heroStyle =
    storeSettings.heroStyle ??
    (websiteTemplate === 'modern-minimal' ? 'full-bleed' : 'classic-mega');
  const categoryStyle = storeSettings.categoryStyle ?? 'grid-cards';
  const footerStyle = storeSettings.footerStyle ?? 'daraz-3tier';

  const catalogGridGapCls =
    themeAdvanced.gridGap === 'compact'
      ? 'gap-2'
      : themeAdvanced.gridGap === 'airy'
        ? 'gap-4'
        : 'gap-2.5 sm:gap-3';

  const catalogGridColsCls =
    themeAdvanced.gridColsDesktop === 5
      ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5'
      : themeAdvanced.gridColsDesktop === 3
        ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
        : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4';

  const renderHomepageSection = (sectionId: HomepageSectionId) => {
    switch (sectionId) {
      case 'hero':
        return (
          <section key="sec-hero" className="max-w-[var(--theme-container-max,1240px)] mx-auto px-3 sm:px-6">
            <div
              className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch relative"
              onMouseLeave={() => setHoveredMegaCat(null)}
            >
              {/* Desktop Left Category Mega-Menu Sidebar (only in classic-mega) */}
              {heroStyle === 'classic-mega' && (
              <aside className="hidden lg:flex lg:col-span-3 flex-col justify-between theme-surface-card border py-2 relative z-20">
                <div>
                  <div className="px-4 py-2 border-b border-[var(--store-card-border)] flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--store-text-primary)] tracking-wide">
                      {lang === 'en' ? 'CATEGORIES' : 'ক্যাটাগরি মেনু'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveCategory('all')}
                      className="text-[11px] font-semibold brand-text hover:underline cursor-pointer"
                    >
                      All
                    </button>
                  </div>
                  <ul className="py-1">
                    {CATEGORIES.map((cat) => {
                      const isCatActive = activeCategory === cat.slug || hoveredMegaCat === cat.slug;
                      return (
                        <li key={cat.slug} onMouseEnter={() => setHoveredMegaCat(cat.slug)}>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveCategory(cat.slug);
                              setHoveredMegaCat(null);
                              const matched = activeProducts.find((p) => p.category === cat.slug);
                              if (matched) setSingleProduct(matched);
                              document
                                .getElementById('all-organic-catalog')
                                ?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className={`w-full px-3.5 py-1.5 text-left text-xs flex items-center justify-between hover:bg-[var(--brand-tint)] hover:text-[var(--brand-primary)] transition-colors cursor-pointer ${
                              isCatActive
                                ? 'brand-text font-bold brand-tint-bg'
                                : 'text-[var(--store-text-primary)]'
                            }`}
                          >
                            <span className="flex items-center gap-2.5 min-w-0 pr-2">
                              <img
                                src={cat.image}
                                alt=""
                                className="w-6 h-6 rounded-[6px] object-cover shrink-0 border border-[#EEF2F6]"
                              />
                              <span className="truncate">{cat.name}</span>
                            </span>
                            <ChevronRight className="w-3.5 h-3.5 text-[var(--store-text-muted)] shrink-0" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className="mx-3 mt-2 p-3 rounded-xl brand-tint-bg border border-[var(--brand-primary)]/20 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-bold brand-text">100% Pure Organic Mall</p>
                    <p className="text-[10px] text-[var(--store-text-muted)] mt-0.5">
                      {vendors.length} Verified Partner Stores
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigateScreen('seller')}
                    className="px-2.5 py-1 theme-btn-shape ot-gradient-btn text-[10px] font-bold cursor-pointer shrink-0"
                  >
                    Sell
                  </button>
                </div>
              </aside>
              )}

              {/* Hover Mega-Menu Flyout Panel */}
              {heroStyle === 'classic-mega' && hoveredMegaCat && (
                <div className="hidden lg:block absolute left-[25%] top-0 bottom-0 w-[440px] z-30 theme-surface-card border rounded-r-xl shadow-2xl p-4 overflow-y-auto ot-dropdown-enter">
                  {(() => {
                    const cat = CATEGORIES.find((c) => c.slug === hoveredMegaCat);
                    if (!cat) return null;
                    const subItems = MEGA_SUBCATEGORIES[cat.slug] ?? [cat.subLabel];
                    const catProds = activeProducts
                      .filter((p) => p.category === cat.slug)
                      .slice(0, 4);
                    return (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-[var(--store-card-border)] pb-2">
                          <div>
                            <h3 className="text-sm font-extrabold text-[var(--store-text-primary)]">{cat.name}</h3>
                            <p className="text-[11px] text-[var(--store-text-muted)]">{cat.subLabel}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveCategory(cat.slug);
                              setHoveredMegaCat(null);
                              document
                                .getElementById('all-organic-catalog')
                                ?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="text-xs font-bold brand-text hover:underline cursor-pointer"
                          >
                            View All →
                          </button>
                        </div>

                        <div>
                          <p className="text-[11px] font-bold uppercase text-[var(--store-text-muted)] mb-1.5">
                            Popular Sub-Categories
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {subItems.map((sub) => (
                              <button
                                key={sub}
                                type="button"
                                onClick={() => {
                                  setActiveCategory(cat.slug);
                                  setHoveredMegaCat(null);
                                  document
                                    .getElementById('all-organic-catalog')
                                    ?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="px-2.5 py-1 rounded-md bg-[var(--store-subtle-bg)] hover:bg-[var(--brand-tint)] border border-[var(--store-card-border)] hover:brand-border text-xs font-medium text-[var(--store-text-primary)] hover:text-[var(--brand-primary)] cursor-pointer"
                              >
                                {sub}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="text-[11px] font-bold uppercase text-[var(--store-text-muted)] mb-2">
                            Top Picks in {cat.name}
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            {catProds.map((cp) => (
                              <button
                                key={cp.id}
                                type="button"
                                onClick={() => {
                                  setHoveredMegaCat(null);
                                  handleOpenProductDetail(cp);
                                }}
                                className="p-2 rounded-lg border border-[var(--store-card-border)] hover:brand-border flex items-center gap-2 text-left cursor-pointer"
                              >
                                <div className="w-11 h-11 rounded overflow-hidden bg-[var(--store-subtle-bg)] shrink-0">
                                  <ResilientImage
                                    src={cp.image}
                                    alt={cp.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[11px] font-bold text-[var(--store-text-primary)] line-clamp-1">
                                    {cp.name}
                                  </p>
                                  <p className="text-xs font-extrabold brand-text font-mono">
                                    ৳{cp.price}
                                  </p>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Swipeable & Draggable 3-Second Auto-Sliding Banner + Compact Bottom Dots */}
              <div
                className={
                  heroStyle === 'full-bleed'
                    ? 'lg:col-span-12 flex flex-col'
                    : heroStyle === 'split-spotlight' || heroStyle === 'bento-promo'
                      ? 'lg:col-span-8 flex flex-col'
                      : 'lg:col-span-9 flex flex-col'
                }
              >
                <div
                  ref={heroSwipe.containerRef}
                  onMouseEnter={() => setIsHeroPaused(true)}
                  onMouseLeave={() => {
                    if (!heroSwipe.isDragging) setIsHeroPaused(false);
                  }}
                  onClickCapture={heroSwipe.onClickCapture}
                  className={`relative rounded-[var(--theme-card-radius,16px)] overflow-hidden bg-[#EAEAEA] shadow-sm border border-[var(--store-card-border)] touch-pan-y select-none cursor-grab active:cursor-grabbing [&_img]:pointer-events-none ${
                    heroStyle === 'full-bleed'
                      ? 'h-[220px] sm:h-[340px] lg:h-[400px]'
                      : 'h-[205px] sm:h-[300px] lg:h-[348px]'
                  }`}
                >
                  <div
                    onTransitionEnd={(e) => {
                      if (e.target !== e.currentTarget) return;
                      if (heroSlideIdx >= activeHeroSlides.length + 1) {
                        setHeroTransition(false);
                        setHeroSlideIdx(1);
                        requestAnimationFrame(() => {
                          requestAnimationFrame(() => {
                            setHeroTransition(true);
                          });
                        });
                      } else if (heroSlideIdx <= 0) {
                        setHeroTransition(false);
                        setHeroSlideIdx(activeHeroSlides.length);
                        requestAnimationFrame(() => {
                          requestAnimationFrame(() => {
                            setHeroTransition(true);
                          });
                        });
                      }
                    }}
                    style={{
                      transform: `translate3d(calc(-${heroSlideIdx * 100}% + ${heroSwipe.dragX}px), 0, 0)`,
                    }}
                    className={`flex h-full ${
                      heroTransition && !heroSwipe.isDragging
                        ? 'transition-transform duration-300 ease-out'
                        : ''
                    }`}
                  >
                    {extendedHeroSlides.map((slide, idx) => {
                      const slideMeta = HERO_SLIDE_META[slide.id];
                      return (
                        <button
                          key={`${slide.id}-${idx}`}
                          type="button"
                          onClick={() => {
                            const target =
                              activeProducts.find((p) => p.id === slide.targetProductId) ??
                              activeProducts[0];
                            if (target) handleOpenProductDetail(target);
                          }}
                          aria-label={slide.alt}
                          className="relative w-full h-full shrink-0 block text-left cursor-pointer focus:outline-none group/slide"
                        >
                          <ResilientImage
                            src={slide.image}
                            alt={slide.alt}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent pointer-events-none" />
                          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6 flex items-end justify-between gap-4 pointer-events-none">
                            <div className="max-w-xl space-y-1">
                              <p className="text-[11px] font-semibold tracking-wide text-white/85">
                                {slideMeta?.origin || `${BRAND_INFO.hubAddress} · খাঁটি অর্গানিক`}
                              </p>
                              <h2 className="text-base sm:text-xl lg:text-2xl font-extrabold text-white leading-snug text-balance drop-shadow-xs">
                                {slideMeta?.headline || slide.alt}
                              </h2>
                            </div>
                            <span className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 theme-btn-shape bg-white text-[#081149] group-hover/slide:bg-[#F4F7FF] text-xs font-extrabold shrink-0 shadow-sm">
                              <span>{lang === 'en' ? 'Shop Harvest' : 'অর্ডার করুন'}</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Compact Small Indicator Dots with Crisp Prev/Next Controls */}
                <div
                  aria-label="Slider progress indicators"
                  className="flex items-center justify-between gap-3 mt-2 px-1"
                >
                  <span className="hidden sm:inline text-[11px] font-medium text-[var(--store-text-muted)]">
                    {BRAND_INFO.hubAddress}
                  </span>
                  <div className="flex items-center justify-center gap-1.5 mx-auto sm:mx-0">
                    {activeHeroSlides.map((slide, idx) => {
                      const activeDot =
                        (((heroSlideIdx - 1) % activeHeroSlides.length) + activeHeroSlides.length) %
                        activeHeroSlides.length;
                      const isActive = activeDot === idx;
                      return (
                        <button
                          key={slide.id}
                          type="button"
                          onClick={() => {
                            setHeroTransition(true);
                            setHeroSlideIdx(idx + 1);
                          }}
                          aria-label={`Slide ${idx + 1}`}
                          className={`h-1 rounded-full transition-all duration-300 cursor-pointer ${
                            isActive
                              ? 'w-5 bg-[var(--brand-primary)]'
                              : 'w-1.5 bg-[#94A3B8]/65 hover:bg-[#64748B]'
                          }`}
                        />
                      );
                    })}
                  </div>
                  <div className="hidden sm:flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setHeroTransition(true);
                        setHeroSlideIdx((prev) => (prev <= 0 ? activeHeroSlides.length : prev - 1));
                      }}
                      aria-label="Previous slide"
                      className="w-6 h-6 rounded-md border border-[var(--store-card-border)] bg-[var(--store-card-bg)] text-[var(--store-text-primary)] hover:brand-border flex items-center justify-center cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setHeroTransition(true);
                        setHeroSlideIdx((prev) =>
                          prev >= activeHeroSlides.length + 1 ? 1 : prev + 1
                        );
                      }}
                      aria-label="Next slide"
                      className="w-6 h-6 rounded-md border border-[var(--store-card-border)] bg-[var(--store-card-bg)] text-[var(--store-text-primary)] hover:brand-border flex items-center justify-center cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Hero Variant: Split Spotlight Cards (2 Featured Product Promos) */}
              {heroStyle === 'split-spotlight' && (
                <div className="lg:col-span-4 grid grid-cols-2 lg:grid-cols-1 gap-3">
                  {activeProducts.slice(0, 2).map((sp) => (
                    <div
                      key={`spotlight-${sp.id}`}
                      className="ot-product-card p-3 flex items-center gap-3"
                    >
                      <button
                        type="button"
                        onClick={() => handleOpenProductDetail(sp)}
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-[var(--store-subtle-bg)] shrink-0 cursor-pointer"
                      >
                        <ResilientImage src={sp.image} alt={sp.name} className="w-full h-full object-cover" />
                      </button>
                      <div className="min-w-0 flex-1 space-y-1">
                        <span className="inline-block px-1.5 py-0.5 rounded brand-tint-bg brand-text text-[10px] font-extrabold">
                          -{sp.discountPercent}% SPOTLIGHT
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenProductDetail(sp)}
                          className="block text-left text-xs font-extrabold text-[var(--store-text-primary)] hover:brand-text line-clamp-2 cursor-pointer"
                        >
                          {sp.name}
                        </button>
                        <div className="flex items-baseline gap-1.5 tabular-nums">
                          <span className="text-sm font-black brand-text">৳{sp.price}</span>
                          <span className="text-[11px] text-[var(--store-text-muted)] line-through">৳{sp.originalPrice}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleOpenProductOrderPage(sp)}
                          className="px-2.5 py-1 theme-btn-shape ot-gradient-btn text-[10px] font-bold cursor-pointer"
                        >
                          অর্ডার করুন
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Hero Variant: Bento Promo 2x2 Action Collage */}
              {heroStyle === 'bento-promo' && (
                <div className="lg:col-span-4 grid grid-cols-2 gap-2.5">
                  {[
                    {
                      title: 'Flash Deals',
                      sub: 'Up to 35% OFF',
                      cls: 'from-[#663CBC] to-[#2563EB] text-white',
                      icon: Zap,
                      onClick: () =>
                        document.getElementById('hotdeal_section')?.scrollIntoView({ behavior: 'smooth' }),
                    },
                    {
                      title: 'Free Delivery',
                      sub: `৳${storeSettings.freeShippingMin}+ Orders`,
                      cls: 'from-[#047857] to-[#065F46] text-white',
                      icon: Truck,
                      onClick: () => {
                        setFilterFreeShippingOnly(true);
                        document.getElementById('all-organic-catalog')?.scrollIntoView({ behavior: 'smooth' });
                      },
                    },
                    {
                      title: 'Coins & Spin',
                      sub: `${loyaltyWallet.coins} Coins Ready`,
                      cls: 'from-[#B45309] to-[#D97706] text-white',
                      icon: Coins,
                      onClick: () => setLoyaltyOpen(true),
                    },
                    {
                      title: 'Official Mall',
                      sub: `${vendors.length} Verified Stores`,
                      cls: 'from-[#1E293B] to-[#0F172A] text-white',
                      icon: BadgeCheck,
                      onClick: () => {
                        setFilterMallOnly(true);
                        document.getElementById('all-organic-catalog')?.scrollIntoView({ behavior: 'smooth' });
                      },
                    },
                  ].map((tile) => {
                    const Icon = tile.icon;
                    return (
                      <button
                        key={tile.title}
                        type="button"
                        onClick={tile.onClick}
                        className={`rounded-2xl bg-gradient-to-br ${tile.cls} p-3.5 text-left flex flex-col justify-between min-h-[115px] shadow-xs hover:scale-[1.01] transition-transform cursor-pointer`}
                      >
                        <span className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                          <Icon className="w-4 h-4" />
                        </span>
                        <div>
                          <p className="text-xs font-extrabold leading-tight">{tile.title}</p>
                          <p className="text-[10px] opacity-85 mt-0.5">{tile.sub}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {(websiteTemplate === 'modern-minimal' || heroStyle === 'full-bleed') && (
              <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => setActiveCategory('all')}
                  className={`px-3.5 py-1.5 theme-btn-shape text-xs font-bold shrink-0 border cursor-pointer transition-colors whitespace-nowrap ${
                    activeCategory === 'all'
                      ? 'brand-bg text-white border-transparent'
                      : 'theme-surface-card border hover:brand-border'
                  }`}
                >
                  All Categories
                </button>
                {CATEGORIES.map((cat) => (
                  <button
                    key={`minimal-cat-${cat.slug}`}
                    type="button"
                    onClick={() => {
                      setActiveCategory(cat.slug);
                      document.getElementById('all-organic-catalog')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`px-3.5 py-1.5 theme-btn-shape text-xs font-bold shrink-0 border cursor-pointer transition-colors whitespace-nowrap ${
                      activeCategory === cat.slug
                        ? 'brand-bg text-white border-transparent'
                        : 'theme-surface-card border hover:brand-border'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}

            {/* Architectural 1px Hairline Store Utility & Trust Dock */}
            <div className="mt-3 theme-surface-card border grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-y sm:divide-y-0 sm:divide-x divide-[var(--store-card-border)] overflow-hidden">
              {[
                {
                  label: lang === 'en' ? 'Official Mall' : 'অফিসিয়াল মল',
                  sub: `${vendors.length} Verified Hubs`,
                  icon: BadgeCheck,
                  action: () => {
                    setFilterMallOnly(true);
                    document
                      .getElementById('all-organic-catalog')
                      ?.scrollIntoView({ behavior: 'smooth' });
                  },
                },
                {
                  label: lang === 'en' ? 'Free Delivery' : 'ফ্রি ডেলিভারি',
                  sub: `৳${storeSettings.freeShippingMin}+ Orders`,
                  icon: Truck,
                  action: () => {
                    setFilterFreeShippingOnly(true);
                    document
                      .getElementById('all-organic-catalog')
                      ?.scrollIntoView({ behavior: 'smooth' });
                  },
                },
                {
                  label: lang === 'en' ? 'Flash Sale' : 'ফ্ল্যাশ সেল',
                  sub: 'Up to 35% OFF',
                  icon: Zap,
                  action: () => {
                    document.getElementById('hotdeal_section')?.scrollIntoView({ behavior: 'smooth' });
                  },
                },
                {
                  label: lang === 'en' ? 'Coins & Spin' : 'কয়েন ও স্পিন',
                  sub: `${loyaltyWallet.coins} Coins Ready`,
                  icon: Coins,
                  action: () => setLoyaltyOpen(true),
                },
                {
                  label: lang === 'en' ? 'Visual Search' : 'ছবি দিয়ে খুঁজুন',
                  sub: 'Google Lens AI',
                  icon: Camera,
                  action: () => setVisualSearchOpen(true),
                },
                {
                  label: lang === 'en' ? 'Become a Seller' : 'সেলার হোন',
                  sub: 'Open Shop Portal',
                  icon: Store,
                  action: () => navigateScreen('seller'),
                },
              ].map((ch) => {
                const Icon = ch.icon;
                return (
                  <button
                    key={ch.label}
                    type="button"
                    onClick={ch.action}
                    className="px-3.5 py-2.5 text-left flex items-center gap-2.5 hover:bg-[var(--store-subtle-bg)] transition-colors cursor-pointer group"
                  >
                    <Icon className="w-4 h-4 brand-text shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[var(--store-text-primary)] group-hover:brand-text truncate">
                        {ch.label}
                      </p>
                      <p className="text-[10px] text-[var(--store-text-muted)] truncate">
                        {ch.sub}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        );

      case 'shortcuts':
        if (websiteTemplate === 'luxury-boutique') return null;
        return (
          <section key="sec-shortcuts" className="max-w-[var(--theme-container-max,1240px)] mx-auto px-3 sm:px-6 space-y-3">
            <div className="theme-surface-card border p-3.5 sm:p-5">
              <div className="grid grid-cols-5 lg:grid-cols-10 gap-y-4 gap-x-2">
                {shortcutTiles.map((tile) => {
                  const Icon = tile.icon;
                  return (
                    <button
                      key={tile.label}
                      type="button"
                      onClick={tile.action}
                      className="flex flex-col items-center text-center group cursor-pointer"
                    >
                      <div
                        className={`w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-gradient-to-br ${tile.bg} text-white flex flex-col items-center justify-center shadow-xs group-hover:scale-105 transition-transform`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-[8px] font-extrabold tracking-tight leading-none mt-0.5">
                          {tile.sub}
                        </span>
                      </div>
                      <span className="mt-1.5 text-[11px] font-medium text-[var(--store-text-primary)] group-hover:brand-text leading-tight line-clamp-2">
                        {tile.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="relative rounded-[var(--theme-card-radius,12px)] overflow-hidden bg-gradient-to-r from-[#081149] via-[#663CBC] to-[#2563EB] text-white px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3 shadow-md">
              <span aria-hidden="true" className="absolute inset-0 ot-shimmer-banner pointer-events-none" />
              <div className="relative space-y-0.5">
                <p className="text-[11px] font-semibold text-[#C4B5FD]">
                  সরোজগঞ্জ, চুয়াডাঙ্গা হার্ভেস্ট ডিসপ্যাচ · মিরপুর-১০, ঢাকা হাব
                </p>
                <p className="text-sm sm:text-lg font-extrabold tracking-tight">
                  নতুন মৌসুমের খাঁটি সংগ্রহ · ৩৫% পর্যন্ত ছাড় ও ৳{storeSettings.freeShippingMin}+ অর্ডারে ফ্রি ডেলিভারি
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenOrderPageDirect}
                className="relative inline-flex items-center gap-1 px-4 py-2 theme-btn-shape bg-white text-[#081149] text-xs font-extrabold hover:bg-[#EDF4FF] transition-colors cursor-pointer whitespace-nowrap shadow-sm"
              >
                <span>অর্ডার করুন</span>
                <ChevronRight className="w-3.5 h-3.5 ot-arrow-animated" />
              </button>
            </div>
          </section>
        );

      case 'flashSale':
        return (
          <section key="sec-flash" id="hotdeal_section" className="max-w-[var(--theme-container-max,1240px)] mx-auto px-3 sm:px-6">
            <div id="shop-catalog" className="theme-surface-card border overflow-hidden">
              <div className="px-4 sm:px-5 py-3 border-b border-[var(--store-card-border)] flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                  <h2 className="text-base sm:text-xl font-extrabold text-[var(--store-text-primary)] inline-flex items-center">
                    <span>Fla</span>
                    <Zap className="w-5 h-5 brand-text fill-current -mx-0.5" />
                    <span>h Sale</span>
                  </h2>

                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-[var(--store-text-muted)] font-medium">Ending in</span>
                    <div className="flex items-center gap-1 font-mono tabular-nums font-bold text-white">
                      <span className="px-1.5 py-0.5 rounded brand-bg">{countdown.d}</span>
                      <span className="brand-text">:</span>
                      <span className="px-1.5 py-0.5 rounded brand-bg">{countdown.h}</span>
                      <span className="brand-text">:</span>
                      <span className="px-1.5 py-0.5 rounded brand-bg">{countdown.m}</span>
                      <span className="brand-text">:</span>
                      <span className="px-1.5 py-0.5 rounded bg-[#E11D48]">{countdown.s}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (activeCategory !== 'all' || searchQuery !== '') {
                      setActiveCategory('all');
                      setSearchQuery('');
                    } else {
                      handleOpenOrderPageDirect();
                    }
                  }}
                  className="inline-flex items-center gap-0.5 text-xs sm:text-sm font-bold brand-text hover:opacity-80 cursor-pointer whitespace-nowrap"
                >
                  <span>
                    {activeCategory !== 'all' || searchQuery !== ''
                      ? 'Show All'
                      : 'Shop More'}
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div
                ref={productSwipe.containerRef}
                onMouseEnter={() => setIsProductPaused(true)}
                onMouseLeave={() => {
                  if (!productSwipe.isDragging) setIsProductPaused(false);
                }}
                onClickCapture={productSwipe.onClickCapture}
                className="py-3 sm:py-4 px-1.5 overflow-hidden [--step:50%] sm:[--step:33.3333%] md:[--step:25%] lg:[--step:16.6667%] touch-pan-y select-none cursor-grab active:cursor-grabbing [&_img]:pointer-events-none"
              >
                <div
                  onTransitionEnd={(e) => {
                    if (e.target !== e.currentTarget || activeProducts.length === 0) return;
                    if (productSlideIdx >= activeProducts.length + slideCloneCount) {
                      setProductTransition(false);
                      setProductSlideIdx(productSlideIdx - activeProducts.length);
                      requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                          setProductTransition(true);
                        });
                      });
                    } else if (productSlideIdx <= slideCloneCount - 1) {
                      setProductTransition(false);
                      setProductSlideIdx(productSlideIdx + activeProducts.length);
                      requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                          setProductTransition(true);
                        });
                      });
                    }
                  }}
                  style={{
                    transform: `translate3d(calc(-${productSlideIdx} * var(--step) + ${productSwipe.dragX}px), 0, 0)`,
                  }}
                  className={`flex ${
                    productTransition && !productSwipe.isDragging
                      ? 'transition-transform duration-300 ease-out'
                      : ''
                  }`}
                >
                  {extendedSlideProducts.map((product, idx) => (
                    <div
                      key={`slide-prod-${product.id}-${idx}`}
                      className="w-1/2 sm:w-1/3 md:w-1/4 lg:w-1/6 shrink-0 px-1.5"
                    >
                      <ProductCard
                        product={product}
                        isWishlisted={wishlistIds.includes(product.id)}
                        vendors={vendors}
                        cardDesign={cardDesign}
                        onToggleWishlist={toggleWishlist}
                        onOpenDetail={handleOpenProductDetail}
                        onOrderNow={handleOpenProductOrderPage}
                        onQuickAdd={(p, vId) => handleAddToCart(p, vId, 1, false)}
                        onQuickView={setModalProduct}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        );

      case 'categories':
        return (
          <section key="sec-categories" id="categories-section" className="max-w-[var(--theme-container-max,1240px)] mx-auto px-3 sm:px-6 py-1">
            <div className="mb-2 md:mb-3 flex items-center justify-between gap-2">
              <h2 className="m-0 text-[17px] leading-[26px] font-semibold text-[#212B36] md:text-[22px] md:leading-[34px]">
                Shop by Category
              </h2>
              {activeCategory !== 'all' ? (
                <button
                  type="button"
                  onClick={() => setActiveCategory('all')}
                  className="text-xs font-bold text-[#159758] hover:underline cursor-pointer"
                >
                  {lang === 'en' ? 'Show All' : 'সব দেখুন'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    document.getElementById('all-organic-catalog')?.scrollIntoView({ behavior: 'smooth' })
                  }
                  className="inline-flex items-center gap-0.5 text-xs font-bold text-[#159758] hover:underline cursor-pointer"
                >
                  <span>{lang === 'en' ? 'View All' : 'সব পণ্য'}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {categoryStyle === 'compact-tabs' ? (
              <div className="theme-surface-card border p-2.5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setActiveCategory('all')}
                  className={`px-3.5 py-2 rounded-full text-xs font-bold border transition-colors cursor-pointer whitespace-nowrap ${
                    activeCategory === 'all'
                      ? 'bg-[#159758] text-white border-transparent'
                      : 'bg-white text-[#454F5B] border-[#EEF2F6] hover:border-[#159758]/50'
                  }`}
                >
                  সকল ক্যাটাগরি
                </button>
                {CATEGORIES.map((cat) => {
                  const active = activeCategory === cat.slug;
                  return (
                    <button
                      key={cat.slug}
                      type="button"
                      onClick={() => {
                        setActiveCategory(cat.slug);
                        document.getElementById('all-organic-catalog')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className={`px-3 py-2 rounded-full text-xs font-bold border flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
                        active
                          ? 'bg-[#159758] text-white border-transparent'
                          : 'bg-white text-[#454F5B] border-[#EEF2F6] hover:border-[#159758]/50'
                      }`}
                    >
                      <img src={cat.image} alt="" className="w-5 h-5 rounded-full object-cover" />
                      <span>{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              /* Exact falaqfood.com Horizontal Category Card Rail — Auto-scrolls Right-to-Left until touched */
              <FalaqCategoryMarquee
                activeCategory={activeCategory}
                activeProducts={activeProducts}
                lang={lang}
                onSelectCategory={setActiveCategory}
                onSyncSingleProduct={setSingleProduct}
              />
            )}
          </section>
        );

      case 'catalog':
        return (
          <section key="sec-catalog" id="all-organic-catalog" className="max-w-[var(--theme-container-max,1240px)] mx-auto px-3 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="flex flex-wrap items-baseline gap-2.5">
                <h2 className="text-lg sm:text-[22px] font-bold text-[var(--store-text-primary)]">
                  {lang === 'en' ? 'All Marketplace Products' : 'সকল খাঁটি অর্গানিক পণ্য'}
                </h2>
                <span className="text-xs font-semibold text-[var(--store-text-muted)] font-mono tabular-nums">
                  · {displayedProducts.length}টি পণ্য
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPlpFiltersOpen((o) => !o)}
                  className="lg:hidden inline-flex items-center gap-1.5 h-8 px-3 theme-surface-card border text-xs font-bold cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 brand-text" />
                  <span>Filters</span>
                </button>

                <div className="inline-flex theme-surface-card border p-0.5 text-[11px] font-bold">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'featured', label: 'Featured' },
                    { id: 'bestseller', label: 'Best Sellers' },
                    { id: 'new', label: 'New Arrivals' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() =>
                        setCatalogCollectionTab(
                          tab.id as 'all' | 'featured' | 'bestseller' | 'new'
                        )
                      }
                      className={`px-2.5 py-1 theme-btn-shape cursor-pointer transition-colors ${
                        catalogCollectionTab === tab.id
                          ? 'brand-bg text-white'
                          : 'text-[var(--store-text-muted)] hover:text-[var(--store-text-primary)]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <select
                  value={catalogSort}
                  onChange={(e) =>
                    setCatalogSort(
                      e.target.value as 'default' | 'price-asc' | 'price-desc' | 'best-selling' | 'newest'
                    )
                  }
                  aria-label="Sort products"
                  className="h-8 px-2.5 border theme-surface-card text-[11px] font-bold outline-none"
                >
                  <option value="default">Best Match</option>
                  <option value="best-selling">Top Sales</option>
                  <option value="price-asc">Price: Low → High</option>
                  <option value="price-desc">Price: High → Low</option>
                  <option value="newest">Newest Arrivals</option>
                </select>

                <div className="inline-flex theme-surface-card border p-0.5">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    aria-label="Grid view"
                    className={`p-1.5 rounded cursor-pointer ${
                      viewMode === 'grid' ? 'brand-bg text-white' : 'text-[var(--store-text-muted)]'
                    }`}
                  >
                    <Grid className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    aria-label="List view"
                    className={`p-1.5 rounded cursor-pointer ${
                      viewMode === 'list' ? 'brand-bg text-white' : 'text-[var(--store-text-muted)]'
                    }`}
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              {/* PLP Left Sidebar Filters */}
              <aside
                className={`${
                  plpFiltersOpen ? 'block' : 'hidden'
                } lg:block lg:col-span-3 theme-surface-card border p-4 space-y-4 text-xs`}
              >
                <div className="flex items-center justify-between border-b border-[var(--store-card-border)] pb-2">
                  <span className="font-extrabold text-[var(--store-text-primary)] flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 brand-text" />
                    <span>Filter Products</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleResetAllFilters}
                    className="text-[11px] font-bold brand-text hover:underline cursor-pointer"
                  >
                    Reset All
                  </button>
                </div>

                <div className="space-y-1.5">
                  <p className="font-bold text-[var(--store-text-primary)]">Category</p>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => setActiveCategory('all')}
                      className={`block w-full text-left px-2 py-1 rounded cursor-pointer ${
                        activeCategory === 'all'
                          ? 'brand-tint-bg brand-text font-bold'
                          : 'text-[var(--store-text-muted)] hover:bg-[var(--store-subtle-bg)]'
                      }`}
                    >
                      All Categories ({activeProducts.length})
                    </button>
                    {CATEGORIES.map((cat) => (
                      <button
                        key={`plp-cat-${cat.slug}`}
                        type="button"
                        onClick={() => setActiveCategory(cat.slug)}
                        className={`block w-full text-left px-2 py-1 rounded cursor-pointer ${
                          activeCategory === cat.slug
                            ? 'brand-tint-bg brand-text font-bold'
                            : 'text-[var(--store-text-muted)] hover:bg-[var(--store-subtle-bg)]'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5 border-t border-[var(--store-card-border)] pt-3">
                  <p className="font-bold text-[var(--store-text-primary)]">Verified Sellers &amp; Mall</p>
                  <div className="space-y-1.5">
                    {vendors.map((v) => {
                      const checked = selectedVendorFilterIds.includes(v.id);
                      return (
                        <label key={v.id} className="flex items-center gap-2 cursor-pointer text-[var(--store-text-primary)]">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              setSelectedVendorFilterIds((prev) =>
                                prev.includes(v.id)
                                  ? prev.filter((id) => id !== v.id)
                                  : [...prev, v.id]
                              )
                            }
                            className="accent-[var(--brand-primary)]"
                          />
                          <span className="truncate flex-1">{v.storeName}</span>
                          {v.tier === 'Official Mall' && (
                            <BadgeCheck className="w-3.5 h-3.5 text-[#C2185B] shrink-0" />
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5 border-t border-[var(--store-card-border)] pt-3">
                  <p className="font-bold text-[var(--store-text-primary)]">Price Range (৳ BDT)</p>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      min={0}
                      value={minPriceFilter}
                      onChange={(e) => setMinPriceFilter(e.target.value)}
                      placeholder="Min ৳"
                      className="h-8 px-2 rounded border border-[var(--store-card-border)] bg-[var(--store-subtle-bg)] text-[var(--store-text-primary)] outline-none focus:brand-border"
                    />
                    <input
                      type="number"
                      min={0}
                      value={maxPriceFilter}
                      onChange={(e) => setMaxPriceFilter(e.target.value)}
                      placeholder="Max ৳"
                      className="h-8 px-2 rounded border border-[var(--store-card-border)] bg-[var(--store-subtle-bg)] text-[var(--store-text-primary)] outline-none focus:brand-border"
                    />
                  </div>
                </div>

                <div className="space-y-2 border-t border-[var(--store-card-border)] pt-3">
                  <p className="font-bold text-[var(--store-text-primary)]">Service &amp; Rating</p>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={minRatingFilter === 4}
                      onChange={(e) => setMinRatingFilter(e.target.checked ? 4 : 0)}
                      className="accent-[var(--brand-primary)]"
                    />
                    <span>4★ &amp; Up Only</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filterMallOnly}
                      onChange={(e) => setFilterMallOnly(e.target.checked)}
                      className="accent-[#C2185B]"
                    />
                    <span>Official Mall</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filterFreeShippingOnly}
                      onChange={(e) => setFilterFreeShippingOnly(e.target.checked)}
                      className="accent-[#008916]"
                    />
                    <span>Free Shipping Eligible</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filterCodOnly}
                      onChange={(e) => setFilterCodOnly(e.target.checked)}
                      className="accent-[var(--brand-primary)]"
                    />
                    <span>Cash on Delivery</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={inStockOnly}
                      onChange={(e) => setInStockOnly(e.target.checked)}
                      className="accent-[#008916]"
                    />
                    <span>In Stock Only</span>
                  </label>
                </div>
              </aside>

              <div className="lg:col-span-9">
                {displayedProducts.length === 0 ? (
                  <div className="theme-surface-card border py-12 text-center">
                    <p className="text-sm font-bold text-[var(--store-text-primary)]">কোনো পণ্য পাওয়া যায়নি</p>
                    <button
                      type="button"
                      onClick={handleResetAllFilters}
                      className="mt-3 px-4 py-2 theme-btn-shape brand-bg text-white text-xs font-bold cursor-pointer"
                    >
                      সব ফিল্টার রিসেট করুন
                    </button>
                  </div>
                ) : viewMode === 'list' ? (
                  <div className="space-y-2.5">
                    {displayedProducts.map((product) => (
                      <ProductCard
                        key={`all-list-${product.id}`}
                        product={product}
                        isWishlisted={wishlistIds.includes(product.id)}
                        vendors={vendors}
                        viewMode="list"
                        cardDesign={cardDesign}
                        onToggleWishlist={toggleWishlist}
                        onOpenDetail={handleOpenProductDetail}
                        onOrderNow={handleOpenProductOrderPage}
                        onQuickAdd={(p, vId) => handleAddToCart(p, vId, 1, false)}
                        onQuickView={setModalProduct}
                      />
                    ))}
                  </div>
                ) : (
                  <div className={`grid ${catalogGridGapCls} ${catalogGridColsCls}`}>
                    {displayedProducts.map((product) => (
                      <ProductCard
                        key={`all-${product.id}`}
                        product={product}
                        isWishlisted={wishlistIds.includes(product.id)}
                        vendors={vendors}
                        viewMode="grid"
                        cardDesign={cardDesign}
                        onToggleWishlist={toggleWishlist}
                        onOpenDetail={handleOpenProductDetail}
                        onOrderNow={handleOpenProductOrderPage}
                        onQuickAdd={(p, vId) => handleAddToCart(p, vId, 1, false)}
                        onQuickView={setModalProduct}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        );

      case 'justForYou':
        return (
          <div key="sec-jfy" className="space-y-4">
            <section id="just-for-you-feed" className="max-w-[var(--theme-container-max,1240px)] mx-auto px-3 sm:px-6">
              <div className="flex items-center justify-between mb-2.5">
                <h2 className="text-lg sm:text-[22px] font-bold text-[var(--store-text-primary)] flex items-center gap-2">
                  <Sparkles className="w-5 h-5 brand-text" />
                  <span>Just For You · আপনার পছন্দের সেরা সংগ্রহ</span>
                </h2>
                <span className="text-xs font-bold text-[var(--store-text-muted)]">
                  Showing {justForYouProducts.length} of {activeProducts.length}
                </span>
              </div>

              <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 ${catalogGridGapCls}`}>
                {justForYouProducts.map((product) => (
                  <ProductCard
                    key={`jfy-${product.id}`}
                    product={product}
                    isWishlisted={wishlistIds.includes(product.id)}
                    vendors={vendors}
                    cardDesign={cardDesign}
                    onToggleWishlist={toggleWishlist}
                    onOpenDetail={handleOpenProductDetail}
                    onOrderNow={handleOpenProductOrderPage}
                    onQuickAdd={(p, vId) => handleAddToCart(p, vId, 1, false)}
                    onQuickView={setModalProduct}
                  />
                ))}
              </div>

              <div ref={justForYouSentinelRef} className="mt-4 flex justify-center">
                {justForYouCount < activeProducts.length && (
                  <button
                    type="button"
                    onClick={() => setJustForYouCount((c) => c + 6)}
                    className="px-6 py-2 theme-btn-shape border-2 brand-border brand-text hover:bg-[var(--brand-primary)] hover:text-white text-xs font-extrabold transition-colors cursor-pointer"
                  >
                    LOAD MORE PRODUCTS
                  </button>
                )}
              </div>
            </section>

            {recentlyViewedProducts.length > 0 && (
              <section className="max-w-[var(--theme-container-max,1240px)] mx-auto px-3 sm:px-6">
                <div className="flex items-center gap-2 mb-2.5">
                  <Clock className="w-4 h-4 brand-text" />
                  <h2 className="text-base sm:text-lg font-bold text-[var(--store-text-primary)]">
                    Recently Viewed · সম্প্রতি দেখা পণ্য
                  </h2>
                </div>
                <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 ${catalogGridGapCls}`}>
                  {recentlyViewedProducts.map((product) => (
                    <ProductCard
                      key={`recent-${product.id}`}
                      product={product}
                      isWishlisted={wishlistIds.includes(product.id)}
                      vendors={vendors}
                      cardDesign={cardDesign}
                      onToggleWishlist={toggleWishlist}
                      onOpenDetail={handleOpenProductDetail}
                      onOrderNow={handleOpenProductOrderPage}
                      onQuickAdd={(p, vId) => handleAddToCart(p, vId, 1, false)}
                      onQuickView={setModalProduct}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        );

      case 'singleProduct':
        if (websiteTemplate === 'single-product-funnel') return null;
        return (
          <SingleProductSystem
            key="sec-single-prod"
            selectedProduct={resolvedSingleProduct}
            onSelectProduct={setSingleProduct}
            onAddToCart={(p, vId, q) => handleAddToCart(p, vId, q, false)}
            onOrderConfirmed={handleOrderConfirmed}
          />
        );

      case 'gallery':
        return (
          <section key="sec-gallery" id="gallery-section" className="max-w-[var(--theme-container-max,1240px)] mx-auto px-3 sm:px-6">
            <div className="flex items-end justify-between gap-3 mb-3">
              <div>
                <p className="text-[11px] font-semibold text-[var(--store-text-muted)]">
                  সরোজগঞ্জ, চুয়াডাঙ্গা · সুন্দরবন · সিরাজগঞ্জ
                </p>
                <h2 className="text-lg sm:text-[22px] font-bold text-[var(--store-text-primary)]">
                  আমাদের খাঁটি সংগ্রহ ও বাস্তব গ্যালারি
                </h2>
              </div>
              <button
                type="button"
                onClick={handleOpenOrderPageDirect}
                className="text-xs font-bold brand-text hover:underline cursor-pointer shrink-0"
              >
                অর্ডার করুন →
              </button>
            </div>

            <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 ${catalogGridGapCls}`}>
              {GALLERY_PHOTOS.map((photo) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => setLightboxPhoto(photo)}
                  className="group relative aspect-[4/5] w-full rounded-[var(--theme-card-radius,12px)] border border-[var(--store-card-border)] hover:brand-border overflow-hidden text-left transition-all cursor-pointer"
                >
                  <ResilientImage
                    src={photo.image}
                    alt={photo.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent p-3 flex flex-col justify-end">
                    <span className="text-[10px] font-semibold text-[#FDE68A]">
                      {photo.category}
                    </span>
                    <p className="text-xs font-bold text-white line-clamp-2 mt-0.5 leading-snug">
                      {photo.title}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        );

      case 'reviewsFaq':
        return (
          <section key="sec-reviews-faq" id="reviews-section" className="max-w-[var(--theme-container-max,1240px)] mx-auto px-3 sm:px-6 pb-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-7 theme-surface-card border p-4 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-[var(--store-card-border)]">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-[var(--store-text-primary)]">
                      Ratings &amp; Reviews of Chuadanga Khejur Gur
                    </h2>
                    <p className="text-xs text-[var(--store-text-muted)] mt-0.5">Verified Buyers across Bangladesh</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-2xl font-extrabold text-[var(--store-text-primary)]">4.9</span>
                    <span className="text-xs text-[var(--store-text-muted)]">/ 5</span>
                    <div className="flex items-center gap-0.5 text-[#FACA51]">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {reviews.slice(0, 3).map((rev) => (
                    <div
                      key={rev.id}
                      className="p-3.5 rounded-md border border-[#A7F3D0] bg-[#ECFDF5]/60 space-y-1.5 text-[#212121]"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1 text-[#FACA51]">
                          {Array.from({ length: rev.rating }).map((_, idx) => (
                            <Star key={idx} className="w-3.5 h-3.5 fill-current" />
                          ))}
                          <span className="text-xs font-bold text-[#212121] ml-1.5">
                            {rev.author}
                          </span>
                          <span className="text-[11px] text-[#757575]">· {rev.location}</span>
                        </div>
                        <span className="text-[11px] text-[#047857] font-semibold">
                          {rev.createdAtText || 'নতুন রিভিউ'}
                        </span>
                      </div>
                      <p className="text-xs sm:text-[13px] text-[#424242] leading-relaxed">
                        “{rev.comment}”
                      </p>
                    </div>
                  ))}
                  {REVIEWS.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-3.5 rounded-md border border-[var(--store-card-border)] bg-[var(--store-subtle-bg)] space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1 text-[#FACA51]">
                          {Array.from({ length: rev.rating }).map((_, idx) => (
                            <Star key={idx} className="w-3.5 h-3.5 fill-current" />
                          ))}
                          <span className="text-xs font-bold text-[var(--store-text-primary)] ml-1.5">
                            {rev.author}
                          </span>
                          <span className="text-[11px] text-[var(--store-text-muted)]">· {rev.location}</span>
                        </div>
                        <span className="text-[11px] text-[var(--store-text-muted)]">{rev.date}</span>
                      </div>

                      <p className="text-xs sm:text-[13px] text-[var(--store-text-primary)] leading-relaxed opacity-90">
                        “{rev.comment}”
                      </p>

                      <p className="text-[11px] font-semibold text-[#008916]">
                        Verified Purchase · {rev.productName}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-5 theme-surface-card border p-4 sm:p-6">
                <h2 className="text-base sm:text-lg font-bold text-[var(--store-text-primary)] pb-4 mb-4 border-b border-[var(--store-card-border)]">
                  Questions About This Product (FAQ)
                </h2>

                <div className="space-y-2.5">
                  {FAQS.map((faq, idx) => {
                    const isOpen = openFaqIdx === idx;
                    return (
                      <div
                        key={faq.question}
                        className="rounded-md border border-[var(--store-card-border)] overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                          className="w-full px-3.5 py-3 text-left flex items-center justify-between gap-3 bg-[var(--store-subtle-bg)] hover:bg-[var(--brand-tint)] transition-colors cursor-pointer"
                        >
                          <span className="text-xs sm:text-sm font-bold text-[var(--store-text-primary)]">
                            {faq.question}
                          </span>
                          <ChevronDown
                            className={`w-4 h-4 brand-text shrink-0 transition-transform ${
                              isOpen ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                        {isOpen && (
                          <div className="px-3.5 py-3 text-xs sm:text-[13px] text-[var(--store-text-primary)] leading-relaxed bg-[var(--store-card-bg)] border-t border-[var(--store-card-border)] opacity-90">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        );

      case 'newsletter':
        return (
          <section key="sec-newsletter" className="max-w-[var(--theme-container-max,1240px)] mx-auto px-3 sm:px-6 pb-8">
            <div className="rounded-[var(--theme-card-radius,16px)] bg-gradient-to-r from-[#081149] via-[#1E296B] to-[#663CBC] text-white p-5 sm:p-7 flex flex-wrap items-center justify-between gap-4 shadow-md">
              <div className="space-y-1 max-w-lg">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#C4B5FD]">
                  <Mail className="w-4 h-4" />
                  <span>অর্গানিক অফার ও হার্ভেস্ট আপডেট</span>
                </div>
                <h3 className="text-base sm:text-xl font-extrabold">
                  নতুন শীতের খেজুরের গুড় ও প্রোমো ভাউচারের খবর সবার আগে পান!
                </h3>
              </div>

              <form
                onSubmit={handleNewsletterSubmit}
                className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto"
              >
                <input
                  type="email"
                  required
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="আপনার ইমেইল ঠিকানা লিখুন..."
                  className="h-10 px-3.5 theme-btn-shape bg-white text-[#081149] text-xs sm:min-w-[260px] flex-1 outline-none"
                />
                <button
                  type="submit"
                  disabled={newsletterBusy}
                  className="h-10 px-5 theme-btn-shape ot-blue-btn text-xs font-extrabold cursor-pointer shrink-0"
                >
                  {newsletterBusy ? 'Subscribing...' : 'Subscribe'}
                </button>
              </form>
            </div>
          </section>
        );
    }
  };

  return (
    <div
      id="top"
      data-store-surface={themeAdvanced.surfaceMode}
      className="min-h-screen flex flex-col site-canvas pb-16 lg:pb-0"
      style={{
        backgroundColor: 'var(--site-bg)',
        color: 'var(--store-text-primary)',
        fontSize:
          themeAdvanced.bodyFontScale === 'compact'
            ? '15px'
            : themeAdvanced.bodyFontScale === 'large'
              ? '17px'
              : undefined,
      }}
    >
      {themeAdvanced.customCss.trim() && (
        <style id="ku-custom-theme-css">{themeAdvanced.customCss}</style>
      )}

      {themeAdvanced.announcementBarEnabled && (
        <div
          className={`w-full px-3 py-1.5 text-center text-[11px] sm:text-xs font-bold text-white ${
            themeAdvanced.announcementBarStyle === 'dark'
              ? 'bg-[#0F172A]'
              : themeAdvanced.announcementBarStyle === 'emerald'
                ? 'bg-[#047857]'
                : 'brand-bg'
          }`}
        >
          {themeAdvanced.announcementBarText}
        </div>
      )}

      <div className="sticky top-0 z-40">
        <HeaderBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          cartCount={cartCount}
          cartTotal={cartTotal}
          wishlistCount={wishlistIds.length}
          activeCategory={activeCategory}
          isLoggedIn={account.isLoggedIn}
          username={account.username}
          products={activeProducts}
          lang={lang}
          loyaltyCoins={loyaltyWallet.coins}
          headerStyle={storeSettings.headerStyle}
          storeName={storeSettings.storeName}
          onToggleLang={() => setLang((l) => (l === 'bn' ? 'en' : 'bn'))}
          onSelectCategory={setActiveCategory}
          onSelectProduct={handleOpenProductDetail}
          onOpenCart={() => setCheckoutOpen(true)}
          onOpenWishlist={() => setWishlistOpen(true)}
          onOpenTrackOrder={() => setTrackOpen(true)}
          onOpenOrderPage={handleOpenOrderPageDirect}
          onOpenAccount={() => navigateScreen('account')}
          onOpenAdmin={() => navigateScreen('admin')}
          onOpenSellerCenter={() => navigateScreen('seller')}
          onOpenVisualSearch={() => setVisualSearchOpen(true)}
          onOpenLoyalty={() => setLoyaltyOpen(true)}
          onOpenAppQr={() => setAppQrOpen(true)}
          onOpenHelp={() => {
            document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' });
          }}
          unreadNotificationCount={unreadNotificationIds.length}
          onOpenNotifications={() => setNotificationOpen(true)}
        />

        {/* Live Notice Bar Pinned Right Below the Header Even on Page Scroll */}
        <div className="pt-1.5 sm:pt-2 pb-1 pointer-events-none">
          <div className="max-w-[var(--theme-container-max,1240px)] mx-auto px-3 sm:px-6 pointer-events-auto">
            <div
              className={`ot-notice-bar px-3 sm:px-4 py-1.5 sm:py-2 flex flex-wrap items-center justify-between gap-2 shadow-xs ${
                isNoticeStickyScrolled ? 'ot-notice-bar-scrolled' : ''
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => setNotificationOpen(true)}
                  className="relative inline-flex items-center gap-1.5 px-3 py-1 rounded-full ot-gradient-btn text-white text-[11px] font-extrabold shrink-0 cursor-pointer shadow-xs"
                >
                  <span className="relative flex h-2 w-2 items-center justify-center">
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 rounded-full bg-white/80 ot-notice-pulse"
                    />
                    <span className="relative h-1.5 w-1.5 rounded-full bg-white" />
                  </span>
                  <BellRing className="w-3 h-3" />
                  <span>নোটিশ</span>
                </button>
                <div className="overflow-hidden flex-1 min-w-0 [mask-image:linear-gradient(to_right,black_calc(100%-24px),transparent)]">
                  <p className="ot-notice-slide text-xs sm:text-[13px] font-semibold text-[#081149]">
                    {storeSettings.noticeText} · ২৪/৭ ক্যাশ অন ডেলিভারি ও সারাদেশে ফ্রি হোম ডেলিভারি অফার!
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <a
                  href={`tel:${BRAND_INFO.rawPhone}`}
                  className="hidden md:inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-[#5E6484] hover:brand-text"
                >
                  <Phone className="w-3 h-3" />
                  <span>{BRAND_INFO.phone}</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPromoPopupOpen(true)}
                  className="inline-flex items-center gap-0.5 text-[11px] font-extrabold brand-text hover:underline cursor-pointer"
                >
                  <span>বিশেষ অফার দেখুন</span>
                  <ChevronRight className="w-3.5 h-3.5 ot-arrow-animated" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 space-y-4 pt-1.5 sm:pt-2.5">

        {websiteTemplate === 'artisan-heritage' && (
          <div className="max-w-[var(--theme-container-max,1240px)] mx-auto px-3 sm:px-6">
            <div className="rounded-2xl px-5 py-4 brand-gradient text-white flex flex-wrap items-center justify-between gap-3 shadow-sm">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest opacity-85">
                  Artisan Heritage Collection · Chuadanga &amp; Sundarbans
                </p>
                <h1 className="text-base sm:text-xl font-black tracking-tight mt-0.5">
                  গ্রামবাংলার খাঁটি ঐতিহ্য — ১০০% প্রাকৃতিক গুড়, মধু ও সুন্নাহ খাবার
                </h1>
              </div>
              <button
                type="button"
                onClick={() =>
                  document.getElementById('all-organic-catalog')?.scrollIntoView({ behavior: 'smooth' })
                }
                className="px-4 py-2 rounded-lg bg-white text-[#081149] text-xs font-extrabold hover:bg-[#F4F7FF] cursor-pointer whitespace-nowrap"
              >
                Explore Collection →
              </button>
            </div>
          </div>
        )}

        {websiteTemplate === 'festive-ramadan' && (
          <div className="max-w-[1240px] mx-auto px-3 sm:px-6">
            <div className="rounded-2xl px-5 py-4 bg-gradient-to-r from-[#064E3B] via-[#047857] to-[#B45309] text-white flex flex-wrap items-center justify-between gap-3 shadow-sm">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-[#FDE68A]">
                  Eid &amp; Ramadan Festive Campaign · Sunnah Gifts
                </p>
                <h1 className="text-base sm:text-xl font-black tracking-tight mt-0.5">
                  মদিনার আজওয়া খেজুর, সুন্দরবনের মধু ও ফ্যামিলি কম্বোতে বিশেষ উৎসব ছাড়!
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveCategory('combo');
                    document.getElementById('all-organic-catalog')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-3.5 py-2 rounded-lg bg-[#FDE68A] text-[#451A03] text-xs font-extrabold hover:bg-white cursor-pointer whitespace-nowrap"
                >
                  উৎসব কম্বো দেখুন →
                </button>
              </div>
            </div>
          </div>
        )}

        {websiteTemplate === 'flash-superstore' && (
          <div className="max-w-[1240px] mx-auto px-3 sm:px-6">
            <div className="rounded-xl px-4 py-3 bg-gradient-to-r from-[#081149] via-[#663CBC] to-[#2563EB] text-white flex flex-wrap items-center justify-between gap-2 shadow-xs">
              <div className="flex items-center gap-2.5 text-xs">
                <span className="px-2 py-0.5 rounded bg-white text-[#663CBC] font-black text-[10px] uppercase">
                  Superstore Live Deals
                </span>
                <span className="font-bold">
                  আজকের ফ্ল্যাশ সেলে ৩৫% পর্যন্ত ছাড় + ৳{storeSettings.freeShippingMin}+ অর্ডারে ফ্রি ডেলিভারি!
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  document.getElementById('hotdeal_section')?.scrollIntoView({ behavior: 'smooth' })
                }
                className="px-3 py-1 rounded-md bg-white text-[#663CBC] text-xs font-extrabold cursor-pointer whitespace-nowrap"
              >
                Flash Deals ↓
              </button>
            </div>
          </div>
        )}

        {websiteTemplate === 'luxury-boutique' && (
          <div className="max-w-[1240px] mx-auto px-3 sm:px-6">
            <div className="rounded-2xl px-6 py-4 bg-[#0F172A] text-white border border-[#D97706]/30 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#F59E0B]">
                  Private Harvest Selection · Lab-Certified Purity
                </p>
                <h1 className="text-lg sm:text-2xl font-bold tracking-tight mt-0.5 font-heading-template">
                  {storeSettings.storeName || 'Khidmatul Ummah'} Boutique Reserve
                </h1>
              </div>
              <button
                type="button"
                onClick={() =>
                  document.getElementById('all-organic-catalog')?.scrollIntoView({ behavior: 'smooth' })
                }
                className="px-4 py-2 rounded-lg border border-[#F59E0B] text-[#FDE68A] hover:bg-[#F59E0B] hover:text-[#0F172A] text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
              >
                Browse Curated Catalog
              </button>
            </div>
          </div>
        )}

        {websiteTemplate === 'compact-wholesale' && (
          <div className="max-w-[1240px] mx-auto px-3 sm:px-6">
            <div className="rounded-xl px-4 py-2.5 bg-[#111827] text-white flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded brand-bg font-extrabold text-[10px]">
                  B2B WHOLESALE MODE
                </span>
                <span className="text-white/90 font-medium">
                  দোকান, কর্পোরেট গিফট ও পাইকারি অর্ডারের জন্য বিশেষ ডিসকাউন্ট মূল্য সরাসরি প্রযোজ্য।
                </span>
              </div>
              <button
                type="button"
                onClick={() => navigateScreen('account')}
                className="font-extrabold text-[#FDBA74] hover:underline cursor-pointer"
              >
                Apply Wholesale Account →
              </button>
            </div>
          </div>
        )}
        {storeSettings.maintenanceMode && (
          <div className="max-w-[1240px] mx-auto px-3 sm:px-6">
            <div className="p-3 rounded-xl bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 shrink-0" />
                <span>
                  স্টোর বর্তমানে রক্ষণাবেক্ষণ মোডে (Maintenance Mode) রয়েছে — দ্রুত অর্ডার করতে WhatsApp-এ যোগাযোগ করুন।
                </span>
              </div>
              <a
                href={BRAND_INFO.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-[#B91C1C]"
              >
                WhatsApp Support →
              </a>
            </div>
          </div>
        )}

        {cartCount > 0 && (
          <div className="max-w-[1240px] mx-auto px-3 sm:px-6">
            <div className="px-3.5 py-2.5 rounded-xl brand-tint-bg border border-[var(--brand-primary)]/25 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-[#081149]">
                আপনার কার্টে <strong>{cartCount}টি পণ্য</strong> (৳{cartTotal.toLocaleString('en-US')})
                অর্ডার করার জন্য অপেক্ষমান রয়েছে।
              </span>
              <button
                type="button"
                onClick={handleOpenOrderPageDirect}
                className="px-3.5 py-1.5 rounded-lg ot-gradient-btn font-bold cursor-pointer"
              >
                Complete Checkout →
              </button>
            </div>
          </div>
        )}

        {/* Single-Product-Funnel Template places Direct One-Step Checkout right below Top Banners */}
        {websiteTemplate === 'single-product-funnel' && (
          <SingleProductSystem
            selectedProduct={resolvedSingleProduct}
            onSelectProduct={setSingleProduct}
            onAddToCart={(p, vId, q) => handleAddToCart(p, vId, q, false)}
            onOrderConfirmed={handleOrderConfirmed}
          />
        )}

        {/* Vendor Storefront Banner (Active when visiting a Partner Store) */}
        {activeVendorId && (() => {
          const activeVendor = vendors.find((v) => v.id === activeVendorId);
          if (!activeVendor) return null;
          const isFollowed = followedVendorIds.includes(activeVendor.id);
          return (
            <section id="vendor-storefront-banner" className="max-w-[var(--theme-container-max,1240px)] mx-auto px-3 sm:px-6">
              <div className="bg-gradient-to-r from-[#081149] to-[#663CBC] text-white rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-md">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-white/15 border border-white/25 text-white flex items-center justify-center shrink-0">
                    <Store className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base sm:text-lg font-extrabold">{activeVendor.storeName}</h2>
                      {activeVendor.tier === 'Official Mall' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#C2185B] text-[10px] font-extrabold">
                          <BadgeCheck className="w-3 h-3" /> Official Mall
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/75 mt-0.5">
                      {activeVendor.location} · {activeVendor.positiveRatingPercent}% Positive Seller Rating ·{' '}
                      {activeVendor.shipOnTimePercent}% Ship on Time ·{' '}
                      {(activeVendor.followersCount + (isFollowed ? 1 : 0)).toLocaleString('en-US')} Followers
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setFollowedVendorIds((prev) =>
                        prev.includes(activeVendor.id)
                          ? prev.filter((id) => id !== activeVendor.id)
                          : [...prev, activeVendor.id]
                      )
                    }
                    className={`px-3.5 py-1.5 theme-btn-shape text-xs font-bold cursor-pointer ${
                      isFollowed
                        ? 'bg-white text-[#081149]'
                        : 'bg-white/15 hover:bg-white/25 text-white border border-white/25'
                    }`}
                  >
                    {isFollowed ? 'Following ✓' : '+ Follow Store'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setChatVendor(activeVendor);
                      setChatProduct(null);
                    }}
                    className="px-3.5 py-1.5 theme-btn-shape ot-emerald-btn text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Chat Now</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveVendorId(null)}
                    className="px-3 py-1.5 theme-btn-shape bg-white/15 hover:bg-white/25 border border-white/25 text-white text-xs font-bold cursor-pointer"
                  >
                    All Stores ×
                  </button>
                </div>
              </div>
            </section>
          );
        })()}

        {/* Dynamically Ordered & Toggleable Online Store 2.0 Homepage Sections */}
        {orderedHomepageSections
          .filter((sec) => sec.enabled)
          .map((sec) => renderHomepageSection(sec.id))}
      </main>

      {/* Dynamic Storefront Footer (4 Selectable Templates: daraz-3tier, dark-executive, minimal-clean, newsletter-split) */}
      {footerStyle === 'minimal-clean' ? (
        <footer id="site-footer" className="bg-white border-t border-[#E5E7EB] py-8">
          <div className="max-w-[1240px] mx-auto px-4 sm:px-6 text-center space-y-5">
            <div className="flex flex-col items-center gap-2">
              <span className="w-9 h-9 rounded-xl brand-bg text-white flex items-center justify-center">
                <Leaf className="w-5 h-5" />
              </span>
              <h4 className="text-base font-extrabold text-[#212121]">
                {storeSettings.storeName || BRAND_INFO.name}
              </h4>
              <p className="text-xs text-[#616161] max-w-md">{BRAND_INFO.tagline}</p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-bold text-[#424242]">
              <button type="button" onClick={handleOpenOrderPageDirect} className="hover:brand-text cursor-pointer">
                Checkout
              </button>
              <button type="button" onClick={() => setTrackOpen(true)} className="hover:brand-text cursor-pointer">
                Track Order
              </button>
              <button type="button" onClick={() => navigateScreen('account')} className="hover:brand-text cursor-pointer">
                My Account
              </button>
              <button type="button" onClick={() => navigateScreen('seller')} className="hover:brand-text cursor-pointer">
                Seller Center
              </button>
              {cmsPages
                .filter((p) => p.published)
                .slice(0, 4)
                .map((page) => (
                  <button
                    key={page.slug}
                    type="button"
                    onClick={() => setCmsModalSlug(page.slug)}
                    className="hover:brand-text cursor-pointer"
                  >
                    {page.title.split('(')[0].trim()}
                  </button>
                ))}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-bold text-[#3C4266]">
              <span className="px-2.5 py-1 rounded bg-[#F4F7FF] border border-[#DDDDEF]">COD</span>
              <span className="px-2.5 py-1 rounded bg-[#F4F7FF] border border-[#DDDDEF] text-[#E2136E]">bKash</span>
              <span className="px-2.5 py-1 rounded bg-[#F4F7FF] border border-[#DDDDEF] text-[#F6921E]">Nagad</span>
              <span className="px-2.5 py-1 rounded bg-[#F4F7FF] border border-[#DDDDEF] text-[#1D4ED8]">SSLCommerz</span>
              <span className="px-2.5 py-1 rounded bg-[#ECFDF5] border border-[#10B981]/25 text-[#047857]">
                Steadfast · Pathao · RedX
              </span>
            </div>

            <p className="text-xs text-[#757575] pt-3 border-t border-[#F0F0F0] leading-relaxed">
              © 2026 {storeSettings.storeName || BRAND_INFO.name} · {BRAND_INFO.hubAddress} · Hotline: {BRAND_INFO.phone} ·{' '}
              {BRAND_INFO.supportEmail} ·{' '}
              <span className="font-semibold text-[#111827]">Developed by Tech Team</span>
            </p>
          </div>
        </footer>
      ) : (
        <footer
          id="site-footer"
          className={
            footerStyle === 'dark-executive'
              ? 'border-t border-[#1E293B] bg-[#0F172A] text-white'
              : 'border-t border-[#E0E0E0]'
          }
        >
          {/* Tier 1 */}
          <div
            className={
              footerStyle === 'dark-executive'
                ? 'bg-[#0F172A] text-white py-10'
                : footerStyle === 'newsletter-split'
                  ? 'bg-[#FFFBF7] text-[#212121] py-10'
                  : 'bg-[#F4F4F6] text-[#212121] py-10'
            }
          >
            <div className="max-w-[var(--theme-container-max,1240px)] mx-auto px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-md brand-bg text-white flex items-center justify-center">
                    <Leaf className="w-4 h-4" />
                  </span>
                  <span className="text-base font-extrabold">
                    {storeSettings.storeName || BRAND_INFO.name}
                  </span>
                </div>
                <p
                  className={`text-xs leading-relaxed ${
                    footerStyle === 'dark-executive' ? 'text-slate-300' : 'text-[#616161]'
                  }`}
                >
                  {BRAND_INFO.tagline} — {BRAND_INFO.origin} থেকে সরাসরি সংগৃহীত খাঁটি পাটালি,
                  দানাদার ও ঝোলা খেজুরের গুড়, সুন্দরবনের মধু ও অর্গানিক সুপারফুড।
                </p>
                <p
                  className={`text-xs flex items-start gap-1.5 ${
                    footerStyle === 'dark-executive' ? 'text-slate-300' : 'text-[#424242]'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 brand-text" />
                  <span>{BRAND_INFO.hubAddress}</span>
                </p>
                <div className={`text-xs space-y-0.5 ${footerStyle === 'dark-executive' ? 'text-slate-400' : 'text-[#616161]'}`}>
                  <p>Support: {BRAND_INFO.supportEmail}</p>
                  <p>Sales: {BRAND_INFO.email}</p>
                  <p>সময়: {BRAND_INFO.supportHours}</p>
                </div>
                <a
                  href={`tel:${BRAND_INFO.rawPhone}`}
                  className="inline-flex items-center gap-2 text-sm font-bold brand-text font-mono pt-1"
                >
                  <Phone className="w-4 h-4" />
                  <span>{BRAND_INFO.phone}</span>
                </a>
              </div>

              <div>
                <h4 className="text-sm font-bold mb-3">Customer Care &amp; Mall</h4>
                <ul
                  className={`space-y-2 text-xs ${
                    footerStyle === 'dark-executive' ? 'text-slate-300' : 'text-[#616161]'
                  }`}
                >
                  <li>
                    <button
                      type="button"
                      onClick={handleOpenOrderPageDirect}
                      className="hover:brand-text cursor-pointer"
                    >
                      Full-Screen Checkout Page
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => navigateScreen('account')}
                      className="hover:brand-text cursor-pointer"
                    >
                      My Account, Coins &amp; Vouchers
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => setTrackOpen(true)}
                      className="hover:brand-text cursor-pointer"
                    >
                      Track My Order
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => navigateScreen('seller')}
                      className="font-bold text-[#10B981] hover:brand-text cursor-pointer"
                    >
                      Become a Seller · Seller Center (#seller)
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => navigateScreen('admin')}
                      className="font-bold text-[#A78BFA] hover:brand-text cursor-pointer"
                    >
                      Admin Dashboard (#admin)
                    </button>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-bold mb-3">Policies &amp; Organic Blog</h4>
                <ul
                  className={`space-y-2 text-xs ${
                    footerStyle === 'dark-executive' ? 'text-slate-300' : 'text-[#616161]'
                  }`}
                >
                  {cmsPages
                    .filter((p) => p.published)
                    .slice(0, 7)
                    .map((page) => (
                      <li key={page.slug}>
                        <button
                          type="button"
                          onClick={() => setCmsModalSlug(page.slug)}
                          className="hover:brand-text cursor-pointer text-left"
                        >
                          {page.title}
                        </button>
                      </li>
                    ))}
                </ul>
              </div>

              <div className="space-y-3">
                <div
                  className={
                    footerStyle === 'newsletter-split'
                      ? 'p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-2.5'
                      : 'space-y-3'
                  }
                >
                  <h4 className="text-sm font-bold">Download App &amp; Support</h4>
                  <p
                    className={`text-[11px] ${
                      footerStyle === 'dark-executive' ? 'text-slate-300' : 'text-[#616161]'
                    }`}
                  >
                    ঢাকা ও চুয়াডাঙ্গা: ৳{storeSettings.dhakaDeliveryFee} · সারাদেশ: ৳
                    {storeSettings.outsideDeliveryFee} · ফ্রি ডেলিভারি ৳{storeSettings.freeShippingMin}+
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <PWAInstallButton />
                    <button
                      type="button"
                      onClick={() => setAppQrOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#D1D5DB] hover:brand-border text-xs font-bold text-[#212121] cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5 brand-text" />
                      <span>App QR</span>
                    </button>
                  </div>
                  <a
                    href={BRAND_INFO.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xs bg-[#008916] hover:bg-[#007012] text-white text-xs font-bold transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp Direct Order</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Tier 2: Verified Payment Gateways & Nationwide Logistics */}
          <div
            className={
              footerStyle === 'dark-executive'
                ? 'bg-[#1E293B] border-t border-[#334155] py-5'
                : 'bg-white border-t border-[#E5E7EB] py-5'
            }
          >
            <div className="max-w-[1240px] mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div className="space-y-1.5">
                <p
                  className={`text-[11px] font-extrabold uppercase ${
                    footerStyle === 'dark-executive' ? 'text-slate-300' : 'text-[#424242]'
                  }`}
                >
                  Authorized Payment Methods
                </p>
                <div className="flex flex-wrap gap-2 text-[11px] font-bold text-[#212121]">
                  <span className="px-2.5 py-1 rounded bg-[#FAFAFA] border border-[#DADADA]">
                    Cash on Delivery
                  </span>
                  <span className="px-2.5 py-1 rounded bg-[#FAFAFA] border border-[#DADADA] text-[#E2136E]">
                    bKash
                  </span>
                  <span className="px-2.5 py-1 rounded bg-[#FAFAFA] border border-[#DADADA] text-[#F6921E]">
                    Nagad
                  </span>
                  <span className="px-2.5 py-1 rounded bg-[#FAFAFA] border border-[#DADADA] text-[#8C3494]">
                    Rocket
                  </span>
                  <span className="px-2.5 py-1 rounded bg-[#FAFAFA] border border-[#DADADA] text-[#0056B3]">
                    Upay
                  </span>
                  <span className="px-2.5 py-1 rounded bg-[#FAFAFA] border border-[#DADADA] text-[#1D4ED8]">
                    SSLCommerz
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 md:text-right">
                <p
                  className={`text-[11px] font-extrabold uppercase ${
                    footerStyle === 'dark-executive' ? 'text-slate-300' : 'text-[#424242]'
                  }`}
                >
                  Nationwide 64-District Logistics Partners
                </p>
                <div className="flex flex-wrap md:justify-end gap-2 text-[11px] font-bold text-[#047857]">
                  <span className="px-2.5 py-1 rounded bg-[#ECFDF5] border border-[#A7F3D0]">
                    Steadfast Courier
                  </span>
                  <span className="px-2.5 py-1 rounded bg-[#ECFDF5] border border-[#A7F3D0]">
                    Pathao Courier
                  </span>
                  <span className="px-2.5 py-1 rounded bg-[#ECFDF5] border border-[#A7F3D0]">
                    RedX Express
                  </span>
                  <span className="px-2.5 py-1 rounded bg-[#ECFDF5] border border-[#A7F3D0]">
                    eCourier BD
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tier 3: Copyright & Trust */}
          <div
            className={
              footerStyle === 'dark-executive'
                ? 'bg-[#020617] border-t border-[#1E293B] text-slate-400 text-xs py-3.5 text-center px-4'
                : 'bg-[#F9FAFB] border-t border-[#E5E7EB] text-[#757575] text-xs py-3.5 text-center px-4'
            }
          >
            © 2026 {storeSettings.storeName || BRAND_INFO.name} · {BRAND_INFO.hubAddress} ·{' '}
            <a
              href={BRAND_INFO.appUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              Official Storefront
            </a>{' '}
            · <span className="font-semibold">Developed by Tech Team</span>
          </div>
        </footer>
      )}

      {/* 4-Tab Mobile Bottom Navigation: Home · Categories · Cart · Account */}
      <nav
        aria-label="Mobile quick navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 ot-header-frosted border-t border-[var(--store-card-border)] h-14 grid grid-cols-4 text-[11px] font-medium text-[#5E6484]"
      >
        <a
          href="#top"
          onClick={() => {
            setActiveCategory('all');
            setMobileCategorySheetOpen(false);
          }}
          className="flex flex-col items-center justify-center gap-0.5 brand-text font-bold"
        >
          <Home className="w-5 h-5" />
          <span>Home</span>
        </a>
        <button
          type="button"
          onClick={() => setMobileCategorySheetOpen((prev) => !prev)}
          className={`flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
            mobileCategorySheetOpen ? 'brand-text font-bold' : 'hover:brand-text'
          }`}
        >
          <LayoutGrid className="w-5 h-5" />
          <span>Categories</span>
        </button>
        <button
          type="button"
          onClick={() => setCheckoutOpen(true)}
          className="relative flex flex-col items-center justify-center gap-0.5 hover:brand-text cursor-pointer"
        >
          <span className="relative">
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full brand-bg text-white text-[9px] font-bold flex items-center justify-center font-mono">
                {cartCount}
              </span>
            )}
          </span>
          <span>Cart</span>
        </button>
        <button
          type="button"
          onClick={() => navigateScreen('account')}
          className="flex flex-col items-center justify-center gap-0.5 hover:brand-text cursor-pointer"
        >
          <User className="w-5 h-5" />
          <span>Account</span>
        </button>
      </nav>

      {/* falaqfood.com Exact Mobile Category Bottom Sheet */}
      {mobileCategorySheetOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-[rgba(22,28,36,0.48)] flex items-end"
          onClick={() => setMobileCategorySheetOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Categories"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-h-[80vh] flex flex-col rounded-t-2xl bg-white shadow-[0_-8px_24px_rgba(15,23,42,0.14)] overflow-hidden"
          >
            <div className="flex items-center justify-between gap-4 border-b border-[#f4f6f8] px-4 py-3">
              <h2 className="m-0 text-[18px] font-bold leading-7 text-[#212b36]">Categories</h2>
              <button
                type="button"
                onClick={() => setMobileCategorySheetOpen(false)}
                aria-label="Close categories"
                className="flex w-9 h-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#f4f6f8] text-[#637381] hover:text-[#212b36]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav aria-label="Shop by category" className="overflow-y-auto overscroll-contain px-4 pb-5">
              <ul className="m-0 list-none p-0">
                <li className="border-b border-[#f4f6f8]">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCategory('all');
                      setMobileCategorySheetOpen(false);
                      document.getElementById('all-organic-catalog')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`flex min-h-[52px] w-full items-center justify-between gap-3 text-left text-[15px] cursor-pointer transition-colors ${
                      activeCategory === 'all' ? 'font-bold text-[#159758]' : 'font-normal text-[#212b36] hover:text-[#159758]'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className="w-9 h-9 rounded-lg bg-[#ECFDF5] text-[#159758] flex items-center justify-center shrink-0">
                        <LayoutGrid className="w-5 h-5" />
                      </span>
                      <span>{lang === 'en' ? 'All Products' : 'সব পণ্য (All Categories)'}</span>
                    </span>
                    <ChevronRight className="w-[18px] h-[18px] shrink-0 text-[#919eab]" />
                  </button>
                </li>
                {CATEGORIES.map((cat) => {
                  const active = activeCategory === cat.slug;
                  return (
                    <li key={`sheet-${cat.slug}`} className="border-b border-[#f4f6f8] last:border-b-0">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveCategory(cat.slug);
                          setMobileCategorySheetOpen(false);
                          document.getElementById('all-organic-catalog')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className={`flex min-h-[52px] w-full items-center justify-between gap-3 text-left text-[15px] cursor-pointer transition-colors ${
                          active ? 'font-bold text-[#159758]' : 'font-normal text-[#212b36] hover:text-[#159758]'
                        }`}
                      >
                        <span className="flex items-center gap-3 min-w-0">
                          <span className="w-9 h-9 rounded-lg overflow-hidden bg-[#f4f6f8] shrink-0">
                            <ResilientImage src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                          </span>
                          <span className="truncate">{cat.name}</span>
                        </span>
                        <ChevronRight className="w-[18px] h-[18px] shrink-0 text-[#919eab]" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
        </div>
      )}

      {/* Modals & Drawers */}
      <ProductModal
        product={resolvedModalProduct}
        onClose={() => setModalProduct(null)}
        onAddToCart={handleAddToCart}
      />

      <CheckoutDrawer
        isOpen={checkoutOpen}
        items={cartItems}
        vendors={vendors}
        onClose={() => setCheckoutOpen(false)}
        onUpdateQty={handleUpdateQty}
        onRemoveItem={handleRemoveItem}
        onConfirmOrder={handleOrderConfirmed}
        onOpenFullOrderPage={handleOpenOrderPageDirect}
      />

      <OrderTrackModal
        isOpen={trackOpen}
        orders={mergedOrders}
        onClose={() => setTrackOpen(false)}
        onViewOrderInfo={(order) => {
          setActiveOrderReceipt(order);
          navigateScreen('checkout');
        }}
      />

      <WishlistModal
        isOpen={wishlistOpen}
        products={wishlistProducts}
        onClose={() => setWishlistOpen(false)}
        onRemove={toggleWishlist}
        onOrderNow={handleOpenProductOrderPage}
      />

      <GalleryLightboxModal
        photo={lightboxPhoto}
        onClose={() => setLightboxPhoto(null)}
      />

      <OfferTopUpPopupModal
        isOpen={promoPopupOpen && storeSettings.popupEnabled}
        popupTitle={storeSettings.popupTitle}
        popupBody={storeSettings.popupBody}
        onClose={(dontShowToday) => {
          setPromoPopupOpen(false);
          if (dontShowToday) {
            try {
              localStorage.setItem(
                'ku_popup_hide_date',
                new Date().toISOString().slice(0, 10)
              );
            } catch {
              // ignore
            }
          }
        }}
        onActionClick={() => {
          setPromoPopupOpen(false);
          document.getElementById('hotdeal_section')?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      <NotificationCenterModal
        isOpen={notificationOpen}
        noticeText={storeSettings.noticeText}
        popupTitle={storeSettings.popupTitle}
        orders={mergedOrders}
        freeShippingMin={storeSettings.freeShippingMin}
        unreadIds={unreadNotificationIds}
        onMarkAllRead={handleMarkAllNotificationsRead}
        onClose={() => setNotificationOpen(false)}
        onOpenFlashSale={() => {
          document.getElementById('hotdeal_section')?.scrollIntoView({ behavior: 'smooth' });
        }}
        onOpenTrackOrder={() => setTrackOpen(true)}
      />

      <FloatingSupportWidget
        onOpenTrackOrder={() => setTrackOpen(true)}
        onOpenOrderPage={handleOpenOrderPageDirect}
      />

      <FooterCmsModal
        isOpen={Boolean(cmsModalSlug)}
        activeSlug={cmsModalSlug}
        cmsPages={cmsPages}
        onSelectSlug={(slug) => setCmsModalSlug(slug)}
        onClose={() => setCmsModalSlug(null)}
      />

      <LoyaltyGamesModal
        open={loyaltyOpen}
        onClose={() => setLoyaltyOpen(false)}
        wallet={loyaltyWallet}
        onUpdateWallet={handleUpdateLoyaltyWallet}
        onApplyVoucherCode={(code) => {
          navigator.clipboard?.writeText(code).catch(() => undefined);
          setToast(`ভাউচার কোড ${code} কপি হয়েছে!`);
        }}
        lang={lang}
      />

      <VisualSearchModal
        open={visualSearchOpen}
        onClose={() => setVisualSearchOpen(false)}
        products={activeProducts}
        onSelectProduct={handleOpenProductDetail}
        lang={lang}
      />

      {chatVendor && (
        <LiveChatWidget
          open={Boolean(chatVendor)}
          onClose={() => setChatVendor(null)}
          vendor={chatVendor}
          productAttachment={chatProduct}
          buyerUid={firebaseUser?.uid}
          buyerName={firebaseUser?.displayName || account.username || 'Guest Buyer'}
          firebaseUser={firebaseUser}
          lang={lang}
          onOpenProduct={handleOpenProductDetail}
        />
      )}

      {/* Save More on App QR Modal */}
      {appQrOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setAppQrOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white rounded-2xl overflow-hidden shadow-2xl border border-[#EAEAEA] text-center"
          >
            <div className="px-4 py-3 ot-gradient-btn flex items-center justify-between">
              <span className="text-sm font-extrabold flex items-center gap-1.5">
                <QrCode className="w-4 h-4" />
                <span>Khidmatul Ummah Mobile App</span>
              </span>
              <button
                type="button"
                onClick={() => setAppQrOpen(false)}
                className="p-1 rounded-full hover:bg-white/15 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div className="w-36 h-36 mx-auto rounded-xl border-2 border-dashed brand-border brand-tint-bg flex flex-col items-center justify-center gap-1.5 brand-text">
                <QrCode className="w-16 h-16" />
                <span className="text-[10px] font-mono font-bold">PWA INSTALL READY</span>
              </div>
              <p className="text-xs text-[#424242] leading-relaxed">
                সরাসরি মোবাইল ও ডেস্কটপে ইন্সটল করুন — এক্সক্লুসিভ ফ্ল্যাশ সেল অ্যালার্ট ও দ্রুত অর্ডার ট্র্যাকিং সুবিধা।
              </p>
              <div className="flex justify-center">
                <PWAInstallButton />
              </div>
            </div>
          </div>
        </div>
      )}

      <OfflineIndicator />

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-16 lg:bottom-5 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#081149] text-white text-xs font-semibold shadow-xl border brand-border"
        >
          <Check className="w-4 h-4 brand-text" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
