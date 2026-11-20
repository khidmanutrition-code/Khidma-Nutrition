import { useState, useRef, useEffect } from 'react';
import {
  Search,
  Phone,
  Truck,
  Heart,
  ShoppingCart,
  Menu,
  X,
  Leaf,
  User,
  ArrowUpLeft,
  ShieldCheck,
  Store,
  QrCode,
  Coins,
  Globe,
  Clock,
  TrendingUp,
  PlayCircle,
  ArrowRight,
  Bell,
  ChevronRight,
} from 'lucide-react';
import { BRAND_INFO, CATEGORIES, CategorySlug, PRODUCTS, Product } from '../data/products';
import type { HeaderStyleId, MarketplaceLanguage } from '../types';
import { PWAInstallButton } from '../hooks/usePWA';
import { GoogleLensIcon } from './GoogleLensIcon';
import { ResilientImage } from './ResilientImage';

interface HeaderBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  cartCount: number;
  cartTotal: number;
  wishlistCount: number;
  activeCategory: CategorySlug;
  isLoggedIn: boolean;
  username: string;
  products?: Product[];
  lang?: MarketplaceLanguage;
  loyaltyCoins?: number;
  headerStyle?: HeaderStyleId;
  storeName?: string;
  onToggleLang?: () => void;
  onSelectCategory: (slug: CategorySlug) => void;
  onSelectProduct: (product: Product) => void;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  onOpenTrackOrder: () => void;
  onOpenOrderPage: () => void;
  onOpenAccount: () => void;
  onOpenAdmin: () => void;
  onOpenSellerCenter?: () => void;
  onOpenVisualSearch?: () => void;
  onOpenLoyalty?: () => void;
  onOpenAppQr?: () => void;
  onOpenHelp?: () => void;
  unreadNotificationCount?: number;
  onOpenNotifications?: () => void;
}

const SUGGESTION_KEYWORDS = [
  'চুয়াডাঙ্গার খাঁটি পাটালি গুড়',
  'সুন্দরবনের প্রাকৃতিক মধু',
  'সিরাজগঞ্জের গাওয়া ঘি',
  'ঘানি ভাঙা সরিষার তেল',
  'মদিনার আজওয়া খেজুর ও বাদাম',
];

export function HeaderBar({
  searchQuery,
  onSearchChange,
  cartCount,
  cartTotal,
  wishlistCount,
  activeCategory,
  isLoggedIn,
  username,
  products = PRODUCTS,
  lang = 'bn',
  loyaltyCoins = 120,
  headerStyle = 'solid-white',
  storeName,
  onToggleLang,
  onSelectCategory,
  onSelectProduct,
  onOpenCart,
  onOpenWishlist,
  onOpenTrackOrder,
  onOpenOrderPage,
  onOpenAccount,
  onOpenAdmin,
  onOpenSellerCenter,
  onOpenVisualSearch,
  onOpenLoyalty,
  onOpenAppQr,
  onOpenHelp,
  unreadNotificationCount = 0,
  onOpenNotifications,
}: HeaderBarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [isCompactSticky, setIsCompactSticky] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('kus_recent_searches');
      return saved ? (JSON.parse(saved) as string[]) : ['পাটালি গুড়', 'সুন্দরবনের মধু'];
    } catch {
      return ['পাটালি গুড়', 'সুন্দরবনের মধু'];
    }
  });
  const expandedInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsCompactSticky(window.scrollY > 12);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    if (!searchExpanded) return;
    const focusTimer = window.setTimeout(() => {
      expandedInputRef.current?.focus();
    }, 30);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchExpanded(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [searchExpanded]);

  const recordSearch = (term: string) => {
    const clean = term.trim();
    if (!clean) return;
    setRecentSearches((prev) => {
      const next = [clean, ...prev.filter((x) => x !== clean)].slice(0, 6);
      try {
        localStorage.setItem('kus_recent_searches', JSON.stringify(next));
      } catch {
        // ignore storage quota errors
      }
      return next;
    });
  };

  const q = searchQuery.trim().toLowerCase();
  const filteredMatches = products.filter(
    (p) =>
      (activeCategory === 'all' || p.category === activeCategory) &&
      (q === '' ||
        p.name.toLowerCase().includes(q) ||
        p.englishName.toLowerCase().includes(q) ||
        p.categoryLabel.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q))
  );
  const searchMatches = filteredMatches.slice(0, 8);

  const isGradientHeader = headerStyle === 'brand-gradient';
  const isEditorialHeader = headerStyle === 'clean-editorial';
  const isDarkLuxury = headerStyle === 'dark-luxury';
  const isFloatingGlass = headerStyle === 'floating-glass';
  const isCompactCentered = headerStyle === 'compact-centered';
  const isDarkSurface = isGradientHeader || isDarkLuxury;

  const commitCatalogSearch = (queryOverride?: string) => {
    if (typeof queryOverride === 'string') {
      onSearchChange(queryOverride);
      recordSearch(queryOverride);
    } else {
      recordSearch(searchQuery);
    }
    setSearchExpanded(false);
    document.getElementById('all-organic-catalog')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <header
        className={`relative z-20 transition-all ${
          isFloatingGlass
            ? 'bg-transparent pt-1 sm:pt-2 px-2 sm:px-4'
            : isDarkLuxury
              ? 'bg-[#0F172A] shadow-md'
              : 'bg-transparent'
        }`}
      >
        {/* Top Utility Bar (Hides smoothly on scroll so scrolled products peek right behind the top frosted header) */}
        {!isCompactSticky && !isCompactCentered && (
          <div
            className={`hidden md:block text-[11px] ${
              isEditorialHeader
                ? 'bg-[#FAFAFA] text-[#424242] border-b border-[#EAEAEA]'
                : isDarkLuxury
                  ? 'bg-[#020617] text-white/85 border-b border-white/10'
                  : isFloatingGlass
                    ? 'max-w-[var(--theme-container-max,1240px)] mx-auto rounded-t-2xl brand-bg text-white/95'
                    : 'brand-bg text-white/95'
            }`}
          >
            <div className="max-w-[var(--theme-container-max,1240px)] mx-auto px-4 sm:px-6 h-7 flex items-center justify-between gap-2">
              <div className="flex items-center gap-3.5 truncate">
                <button
                  type="button"
                  onClick={onOpenAppQr}
                  className="inline-flex items-center gap-1 hover:underline cursor-pointer font-semibold"
                >
                  <QrCode className="w-3 h-3" />
                  <span>{lang === 'en' ? 'Save More on App' : 'অ্যাপে বেশি সাশ্রয়'}</span>
                </button>
                <PWAInstallButton compact />
                {onOpenSellerCenter && (
                  <button
                    type="button"
                    onClick={onOpenSellerCenter}
                    className="inline-flex items-center gap-1 hover:underline cursor-pointer font-semibold"
                  >
                    <Store className="w-3 h-3" />
                    <span>{lang === 'en' ? 'Become a Seller' : 'বিক্রেতা হোন'}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onOpenHelp}
                  className="hover:underline cursor-pointer"
                >
                  {lang === 'en' ? 'Help & Support' : 'হেল্প ও সাপোর্ট'}
                </button>
              </div>

              <div className="flex items-center gap-3.5 font-medium shrink-0">
                {onOpenLoyalty && (
                  <button
                    type="button"
                    onClick={onOpenLoyalty}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-black/20 hover:bg-black/30 text-[#FEF08A] font-bold cursor-pointer"
                  >
                    <Coins className="w-3 h-3" />
                    <span>{loyaltyCoins} Coins</span>
                  </button>
                )}
                {onOpenSellerCenter && (
                  <button
                    type="button"
                    onClick={onOpenSellerCenter}
                    className="hover:underline cursor-pointer font-bold"
                  >
                    {lang === 'en' ? 'Seller Center' : 'সেলার সেন্টার'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={onOpenAdmin}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/15 hover:bg-white/25 font-bold cursor-pointer"
                >
                  <ShieldCheck className="w-3 h-3" />
                  <span>ADMIN</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenTrackOrder}
                  className="hover:underline cursor-pointer"
                >
                  {lang === 'en' ? 'Track Order' : 'অর্ডার ট্র্যাক'}
                </button>
                <button
                  type="button"
                  onClick={onOpenAccount}
                  className="hover:underline cursor-pointer"
                >
                  {isLoggedIn
                    ? `${username}`
                    : lang === 'en'
                      ? 'Login / Sign Up'
                      : 'লগইন / সাইনআপ'}
                </button>
                {onToggleLang && (
                  <button
                    type="button"
                    onClick={onToggleLang}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/15 hover:bg-white/25 font-bold cursor-pointer"
                  >
                    <Globe className="w-3 h-3" />
                    <span>{lang === 'en' ? 'BN' : 'EN'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main Header: Pure White at Top -> Translucent Frosted Glass on Scroll */}
        <div
          className={`transition-all duration-300 ${
            isGradientHeader
              ? 'brand-gradient text-white border-b border-white/10'
              : isDarkLuxury
                ? 'bg-[#0F172A]/90 backdrop-blur-lg text-white border-b border-white/10'
                : isFloatingGlass
                  ? `max-w-[var(--theme-container-max,1240px)] mx-auto ${
                      isCompactSticky ? 'ot-header-frosted-scrolled' : 'ot-header-frosted'
                    } border border-[var(--store-card-border)] rounded-b-2xl shadow-lg`
                  : isCompactSticky
                    ? 'ot-header-frosted-scrolled'
                    : 'ot-header-frosted'
          }`}
        >
          <div
            className={`max-w-[var(--theme-container-max,1240px)] mx-auto px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 transition-all ${
              isCompactSticky || isCompactCentered ? 'h-14' : 'h-[60px] sm:h-[68px]'
            }`}
          >
            {/* Brand Logo */}
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1 lg:flex-none">
              <button
                type="button"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                aria-label="Toggle menu"
                className={`lg:hidden p-1.5 rounded-lg shrink-0 cursor-pointer ${
                  isDarkSurface ? 'text-white hover:bg-white/15' : 'text-[#081149] hover:bg-black/5'
                }`}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              <a
                href="#top"
                onClick={() => onSelectCategory('all')}
                className="flex items-center gap-2 sm:gap-2.5 min-w-0 whitespace-nowrap group"
              >
                <span
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-[13px] shrink-0 flex items-center justify-center shadow-xs transition-transform group-hover:scale-105 ${
                    isGradientHeader
                      ? 'bg-white text-[var(--brand-primary)]'
                      : isDarkLuxury
                        ? 'ot-gradient-btn ring-1 ring-white/25'
                        : 'ot-gradient-btn'
                  }`}
                >
                  <Leaf className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.2} />
                </span>
                <span
                  className={`text-[15px] sm:text-xl font-extrabold tracking-tight truncate ${
                    isDarkSurface ? 'text-white' : 'text-[#081149]'
                  }`}
                >
                  {lang === 'en'
                    ? 'Khidmatul Mall'
                    : storeName
                      ? storeName.split('(')[0].trim()
                      : 'খিদমাতুল উম্মাহ শপ বিডি'}
                </span>
              </a>
            </div>

            {/* Clean Desktop Center Navigation Links */}
            {!isCompactCentered && (
              <nav
                aria-label="Primary Store Navigation"
                className="hidden lg:flex items-center gap-5 text-[13px] font-bold"
              >
                <a
                  href="#top"
                  onClick={() => onSelectCategory('all')}
                  className={`whitespace-nowrap shrink-0 transition-colors ${
                    isDarkSurface
                      ? 'text-white/95 hover:text-white'
                      : 'text-[#081149] hover:text-[var(--brand-primary)]'
                  }`}
                >
                  {lang === 'en' ? 'Home' : 'হোম'}
                </a>
                <a
                  href="#categories-section"
                  className={`whitespace-nowrap shrink-0 transition-colors ${
                    isDarkSurface
                      ? 'text-white/95 hover:text-white'
                      : 'text-[#081149] hover:text-[var(--brand-primary)]'
                  }`}
                >
                  {lang === 'en' ? 'Categories' : 'ক্যাটাগরি'}
                </a>
                <a
                  href="#all-organic-catalog"
                  className={`whitespace-nowrap shrink-0 transition-colors ${
                    isDarkSurface
                      ? 'text-white/95 hover:text-white'
                      : 'text-[#081149] hover:text-[var(--brand-primary)]'
                  }`}
                >
                  {lang === 'en' ? 'Products' : 'সব পণ্য'}
                </a>
                <a
                  href="#hotdeal_section"
                  className={`whitespace-nowrap shrink-0 transition-colors ${
                    isDarkSurface
                      ? 'text-white/95 hover:text-white'
                      : 'text-[#081149] hover:text-[var(--brand-primary)]'
                  }`}
                >
                  {lang === 'en' ? 'Flash Deals' : 'ফ্ল্যাশ সেল'}
                </a>
                <button
                  type="button"
                  onClick={onOpenTrackOrder}
                  className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    isDarkSurface
                      ? 'text-white/95 hover:text-white'
                      : 'text-[#081149] hover:text-[var(--brand-primary)]'
                  }`}
                >
                  {lang === 'en' ? 'Track Order' : 'অর্ডার ট্র্যাক'}
                </button>
                {onOpenSellerCenter && (
                  <button
                    type="button"
                    onClick={onOpenSellerCenter}
                    className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                      isDarkSurface
                        ? 'text-white/95 hover:text-white'
                        : 'text-[#081149] hover:text-[var(--brand-primary)]'
                    }`}
                  >
                    {lang === 'en' ? 'Sellers' : 'সেলার শপ'}
                  </button>
                )}
              </nav>
            )}

            {/* Right Action Cluster — Screenshot Green Menu Bar Actions */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0 pr-0.5">
              {/* Search Icon */}
              <button
                type="button"
                onClick={() => setSearchExpanded(true)}
                title={lang === 'en' ? 'Search Products' : 'পণ্য খুঁজুন'}
                aria-label={lang === 'en' ? 'Open full search bar' : 'সার্চ বার খুলুন'}
                className={`relative w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                  isDarkSurface
                    ? 'text-white hover:bg-white/15'
                    : 'text-[#081149] hover:bg-black/5'
                }`}
              >
                <Search className="w-[18px] h-[18px] sm:w-[19px] sm:h-[19px] stroke-[2.2]" />
                {searchQuery.trim() && (
                  <span
                    aria-hidden="true"
                    className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#EF4444] ring-2 ring-white"
                  />
                )}
              </button>

              {/* Circular White Google Lens Button */}
              {onOpenVisualSearch && (
                <button
                  type="button"
                  onClick={onOpenVisualSearch}
                  title={lang === 'en' ? 'Search by image (Google Lens)' : 'ছবি দিয়ে খুঁজুন (Google Lens)'}
                  aria-label="Visual Search (Google Lens)"
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-transform hover:scale-105 cursor-pointer shadow-xs ${
                    isDarkSurface
                      ? 'bg-white text-[#111827] hover:bg-white/95'
                      : 'bg-white border border-[#DDDDEF] text-[#111827] hover:bg-black/5'
                  }`}
                >
                  <GoogleLensIcon className="w-[18px] h-[18px] sm:w-[19px] sm:h-[19px] text-[#111827]" />
                </button>
              )}

              {/* Notification Bell with Red Badge */}
              {onOpenNotifications && (
                <button
                  type="button"
                  onClick={onOpenNotifications}
                  title={lang === 'en' ? 'Notifications' : 'নোটিফিকেশন'}
                  aria-label="Notifications"
                  className={`relative w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                    isDarkSurface
                      ? 'text-white hover:bg-white/15'
                      : 'text-[#081149] hover:bg-black/5'
                  }`}
                >
                  <Bell className="w-[18px] h-[18px] sm:w-[19px] sm:h-[19px] stroke-[2.1]" />
                  {unreadNotificationCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center">
                      <span
                        aria-hidden="true"
                        className="absolute inset-0 rounded-full bg-[#EF4444]/60 ot-notice-pulse pointer-events-none"
                      />
                      <span className="relative min-w-[16px] h-4 px-1 rounded-full bg-[#EF4444] text-white text-[9px] font-extrabold flex items-center justify-center font-mono tabular-nums ring-2 ring-white">
                        {unreadNotificationCount}
                      </span>
                    </span>
                  )}
                </button>
              )}

              {/* Mobile Quick Cart Trigger */}
              <button
                type="button"
                onClick={onOpenCart}
                aria-label="Open Cart"
                className={`md:hidden relative w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                  isDarkSurface ? 'text-white hover:bg-white/15' : 'text-[#081149] hover:bg-black/5'
                }`}
              >
                <ShoppingCart className="w-[18px] h-[18px]" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full brand-bg text-white text-[9px] font-extrabold flex items-center justify-center font-mono tabular-nums ring-2 ring-white">
                    {cartCount}
                  </span>
                )}
              </button>

              <div className="hidden md:flex items-center gap-1.5 lg:gap-2 shrink-0">
              <button
                type="button"
                onClick={onOpenTrackOrder}
                title="Track Order"
                aria-label="Track Order"
                className={`lg:hidden flex items-center gap-1 px-2 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  isDarkSurface
                    ? 'text-white/95 hover:bg-white/15'
                    : 'text-[#081149] hover:bg-[var(--brand-tint)] hover:text-[var(--brand-primary)]'
                }`}
              >
                <Truck className="w-4 h-4" />
              </button>

              {isCompactCentered && (
                <button
                  type="button"
                  onClick={onOpenAdmin}
                  title="Admin Studio"
                  className="flex items-center gap-1 px-2 py-1.5 rounded text-xs font-bold bg-[#F3F4F6] text-[#081149] hover:bg-[var(--brand-tint)] cursor-pointer whitespace-nowrap"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
                  <span>Admin</span>
                </button>
              )}

              <button
                type="button"
                onClick={onOpenWishlist}
                title="Wishlist"
                aria-label="Wishlist"
                className={`relative p-2 rounded-full transition-colors cursor-pointer ${
                  isDarkSurface
                    ? 'text-white/95 hover:bg-white/15'
                    : 'text-[#081149] hover:bg-[var(--brand-tint)] hover:text-[var(--brand-primary)]'
                }`}
              >
                <Heart className="w-[18px] h-[18px]" />
                {wishlistCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-[#EF4444] text-white text-[10px] font-bold flex items-center justify-center font-mono tabular-nums ring-1 ring-white">
                    {wishlistCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={onOpenAccount}
                className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  isDarkSurface
                    ? 'text-white/95 hover:bg-white/15'
                    : 'text-[#081149] hover:bg-[var(--brand-tint)] hover:text-[var(--brand-primary)]'
                }`}
              >
                <User className="w-4 h-4" />
                <span>{isLoggedIn ? (lang === 'en' ? 'Account' : 'অ্যাকাউন্ট') : lang === 'en' ? 'Login' : 'লগইন'}</span>
              </button>

              <button
                type="button"
                onClick={onOpenCart}
                aria-label="Open Cart"
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  isDarkSurface ? 'text-white hover:bg-white/15' : 'text-[#081149] hover:bg-[var(--brand-tint)]'
                }`}
              >
                <span className="relative">
                  <ShoppingCart className={`w-5 h-5 ${isDarkSurface ? 'text-white' : 'brand-text'}`} />
                  <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full brand-bg text-white text-[10px] font-extrabold flex items-center justify-center font-mono tabular-nums ring-2 ring-white">
                    {cartCount}
                  </span>
                </span>
                <span className="text-left text-[11px] leading-tight whitespace-nowrap ml-1">
                  <span className={`block ${isDarkSurface ? 'text-white/85' : 'text-[#5E6484]'}`}>
                    {lang === 'en' ? 'Cart' : 'কার্ট'}
                  </span>
                  <span className={`font-mono tabular-nums font-bold ${isDarkSurface ? 'text-white' : 'text-[#081149]'}`}>
                    ৳{cartTotal.toLocaleString('en-US')}
                  </span>
                </span>
              </button>

              <button
                type="button"
                onClick={onOpenOrderPage}
                className={`inline-flex items-center gap-1 px-4 py-2 theme-btn-shape text-xs font-extrabold whitespace-nowrap cursor-pointer ${
                  isGradientHeader
                    ? 'bg-white text-[var(--brand-primary)] hover:bg-white/95 shadow-sm'
                    : 'ot-gradient-btn'
                }`}
              >
                <span>{lang === 'en' ? 'Checkout' : 'অর্ডার করুন'}</span>
                <ChevronRight className="w-3.5 h-3.5 ot-arrow-animated" />
              </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Drawer Menu — Falaq Food Style Category Pills */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white/98 backdrop-blur-lg border-b border-[#E5E7EB] px-4 py-3.5 space-y-3 shadow-xl text-[#081149] ot-dropdown-enter">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-[#212B36] uppercase tracking-wide">
                {lang === 'en' ? 'Shop by Category' : 'ক্যাটাগরি সমূহ'}
              </span>
              <button
                type="button"
                onClick={() => {
                  onSelectCategory('all');
                  setMobileMenuOpen(false);
                }}
                className="text-[11px] font-bold brand-text hover:underline cursor-pointer"
              >
                {lang === 'en' ? 'Show All' : 'সব পণ্য'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => {
                    onSelectCategory(cat.slug);
                    setMobileMenuOpen(false);
                    document.getElementById('all-organic-catalog')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`px-2.5 py-2 rounded-xl text-xs font-bold border flex items-center gap-2 text-left cursor-pointer transition-colors ${
                    activeCategory === cat.slug
                      ? 'brand-border brand-tint-bg brand-text'
                      : 'border-[#EEF2F6] bg-[#F8FAFC] text-[#081149] hover:brand-border'
                  }`}
                >
                  <img src={cat.image} alt="" className="w-7 h-7 rounded-md object-cover shrink-0" />
                  <span className="line-clamp-1">{cat.name}</span>
                </button>
              ))}
            </div>
            <div className="pt-2 border-t border-[#F1F3F5] flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
              <a href={`tel:${BRAND_INFO.rawPhone}`} className="inline-flex items-center gap-1 brand-text">
                <Phone className="w-3.5 h-3.5" />
                <span>{BRAND_INFO.phone}</span>
              </a>
              <div className="flex flex-wrap items-center gap-2">
                {onOpenSellerCenter && (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenSellerCenter();
                    }}
                    className="px-3 py-1.5 rounded-full bg-[#081149] text-white inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Store className="w-3.5 h-3.5 text-[#A78BFA]" />
                    <span>Seller Center</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAdmin();
                  }}
                  className="px-3 py-1.5 rounded-full ot-gradient-btn inline-flex items-center gap-1 cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </button>
                {onOpenLoyalty && (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenLoyalty();
                    }}
                    className="px-3 py-1.5 rounded-full brand-tint-bg border brand-border/40 brand-text cursor-pointer"
                  >
                    Coins ({loyaltyCoins})
                  </button>
                )}
                {onToggleLang && (
                  <button
                    type="button"
                    onClick={onToggleLang}
                    className="px-2.5 py-1.5 rounded-full border border-[#D1D5DB] text-[#081149] cursor-pointer"
                  >
                    {lang === 'en' ? 'বাংলা' : 'EN'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Expandable Full-Width Search Overlay (Opens when header search bar is clicked) */}
      {searchExpanded && (
        <div
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-[2px] flex flex-col items-stretch"
          role="dialog"
          aria-modal="true"
          aria-label={lang === 'en' ? 'Expanded Marketplace Search' : 'সম্পূর্ণ সার্চ প্যানেল'}
          onClick={() => setSearchExpanded(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full bg-white/95 backdrop-blur-xl shadow-2xl border-b border-[var(--store-card-border)] ot-dropdown-enter"
          >
            <div className="max-w-[1240px] mx-auto px-3 sm:px-6 py-4 space-y-3.5">
              {/* Top Search Input Row */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  commitCatalogSearch();
                }}
                className="flex items-center gap-2 sm:gap-3"
              >
                <div className="flex-1 flex items-center h-12 sm:h-14 rounded-full border-2 brand-border bg-[#F8FAFC] focus-within:bg-white pl-4 pr-1.5 shadow-sm transition-colors">
                  <Search className="w-5 h-5 brand-text shrink-0 mr-2.5" />
                  <input
                    ref={expandedInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder={
                      lang === 'en'
                        ? 'Type product name, category, SKU, or tap Google Lens...'
                        : 'পণ্যের নাম, ক্যাটাগরি, SKU লিখুন অথবা গুগল লেন্স ব্যবহার করুন...'
                    }
                    className="flex-1 h-full bg-transparent text-sm sm:text-base text-[#081149] placeholder:text-[#94A3B8] focus:outline-none min-w-0"
                  />

                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => onSearchChange('')}
                      aria-label="Clear search query"
                      className="w-7 h-7 rounded-full bg-[#E5E7EB] hover:bg-[#D1D5DB] text-[#374151] flex items-center justify-center mr-1.5 cursor-pointer shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}

                  {onOpenVisualSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchExpanded(false);
                        onOpenVisualSearch();
                      }}
                      title="Google Lens Visual Search"
                      className="h-9 sm:h-10 px-3 mr-1.5 rounded-full bg-white border border-[#E5E7EB] hover:border-[#111827] hover:shadow-xs inline-flex items-center gap-1.5 text-xs font-bold text-[#111827] cursor-pointer shrink-0"
                    >
                      <GoogleLensIcon className="w-5 h-5 text-[#111827]" />
                      <span className="hidden sm:inline">Lens</span>
                    </button>
                  )}

                  <button
                    type="submit"
                    className="h-9 sm:h-11 px-4 sm:px-7 rounded-full ot-gradient-btn text-xs sm:text-sm font-extrabold cursor-pointer shrink-0"
                  >
                    {lang === 'en' ? 'Search' : 'খুঁজুন'}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setSearchExpanded(false)}
                  aria-label="Close search bar"
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#374151] flex items-center justify-center cursor-pointer shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </form>

              {/* Category Filter Strip */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => onSelectCategory('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap border cursor-pointer transition-colors ${
                    activeCategory === 'all'
                      ? 'ot-gradient-btn border-transparent'
                      : 'bg-white border-[var(--store-card-border)] text-[#081149] hover:brand-border'
                  }`}
                >
                  {lang === 'en' ? 'All Categories' : 'সব ক্যাটাগরি'}
                </button>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.slug}
                    type="button"
                    onClick={() => onSelectCategory(cat.slug)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap border cursor-pointer transition-colors ${
                      activeCategory === cat.slug
                        ? 'ot-gradient-btn border-transparent'
                        : 'bg-white border-[var(--store-card-border)] text-[#081149] hover:brand-border'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Search Content Area */}
            <div className="border-t border-[var(--store-card-border)] bg-[#F4F7FF] max-h-[68vh] overflow-y-auto">
              <div className="max-w-[1240px] mx-auto px-3 sm:px-6 py-4 space-y-4">
                {/* Recent & Trending Suggestions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recentSearches.length > 0 && (
                    <div className="bg-white rounded-xl border border-[var(--store-card-border)] p-3.5">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[11px] font-extrabold text-[#5E6484] uppercase flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{lang === 'en' ? 'Recent Searches' : 'সাম্প্রতিক সার্চ'}</span>
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setRecentSearches([]);
                            try {
                              localStorage.removeItem('kus_recent_searches');
                            } catch {
                              // ignore
                            }
                          }}
                          className="text-[10px] font-bold text-[#94A3B8] hover:text-[#DC2626] cursor-pointer"
                        >
                          {lang === 'en' ? 'Clear' : 'মুছুন'}
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {recentSearches.map((kw) => (
                          <button
                            key={kw}
                            type="button"
                            onClick={() => commitCatalogSearch(kw)}
                            className="px-3 py-1.5 rounded-lg bg-[#F8FAFC] border border-[var(--store-card-border)] hover:brand-border hover:brand-text text-xs font-semibold text-[#081149] cursor-pointer"
                          >
                            {kw}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-white rounded-xl border border-[var(--store-card-border)] p-3.5">
                    <p className="text-[11px] font-extrabold brand-text uppercase flex items-center gap-1.5 mb-2">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>{lang === 'en' ? 'Popular Searches' : 'জনপ্রিয় সার্চ'}</span>
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {SUGGESTION_KEYWORDS.map((kw) => (
                        <button
                          key={kw}
                          type="button"
                          onClick={() => commitCatalogSearch(kw)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg brand-tint-bg border brand-border/25 hover:bg-[var(--brand-primary)] hover:text-white text-xs font-semibold text-[#081149] transition-colors cursor-pointer"
                        >
                          <span>{kw}</span>
                          <ArrowUpLeft className="w-3 h-3 opacity-70" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Live Product Grid Matches */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-extrabold text-[#081149]">
                      {q
                        ? `${lang === 'en' ? 'Search Results' : 'খুঁজে পাওয়া পণ্য'} (${filteredMatches.length})`
                        : lang === 'en'
                          ? 'Recommended Products'
                          : 'জনপ্রিয় ও প্রস্তাবিত পণ্য'}
                    </p>
                    {filteredMatches.length > 0 && (
                      <button
                        type="button"
                        onClick={() => commitCatalogSearch()}
                        className="inline-flex items-center gap-1 text-xs font-bold brand-text hover:underline cursor-pointer"
                      >
                        <span>
                          {lang === 'en'
                            ? `View all (${filteredMatches.length})`
                            : `ক্যাটালগে সব দেখুন (${filteredMatches.length})`}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 ot-arrow-animated" />
                      </button>
                    )}
                  </div>

                  {searchMatches.length === 0 ? (
                    <div className="bg-white rounded-xl border border-[var(--store-card-border)] p-6 text-center space-y-2">
                      <p className="text-sm font-bold text-[#081149]">
                        “{searchQuery}” এর সাথে কোনো পণ্য পাওয়া যায়নি।
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          onSearchChange('');
                          onSelectCategory('all');
                        }}
                        className="px-4 py-1.5 rounded-lg ot-gradient-btn text-xs font-bold cursor-pointer"
                      >
                        সব পণ্য দেখুন
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                      {searchMatches.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            recordSearch(item.name);
                            onSelectProduct(item);
                            setSearchExpanded(false);
                          }}
                          className="ot-product-card p-2.5 flex items-center gap-3 text-left cursor-pointer"
                        >
                          <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-[#F1F6FF] shrink-0">
                            <ResilientImage
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                            {item.videoUrl && (
                              <span className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-black/80 text-white flex items-center justify-center">
                                <PlayCircle className="w-3 h-3 text-[#A78BFA]" />
                              </span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-bold text-[#5E6484] truncate">
                              {item.categoryLabel}
                            </p>
                            <p className="text-xs font-bold text-[#081149] line-clamp-2 leading-snug">
                              {item.name}
                            </p>
                            <div className="flex items-baseline gap-1.5 mt-0.5 font-mono">
                              <span className="text-xs font-extrabold brand-text">
                                ৳{item.price.toLocaleString('en-US')}
                              </span>
                              {item.originalPrice && (
                                <del className="text-[10px] text-[#94A3B8]">
                                  ৳{item.originalPrice.toLocaleString('en-US')}
                                </del>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
