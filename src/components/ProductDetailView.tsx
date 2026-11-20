import { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Home,
  ShoppingCart,
  Heart,
  Share2,
  Star,
  Store,
  MessageCircle,
  Plus,
  Minus,
  X,
  Check,
  ShieldCheck,
  Truck,
  MapPin,
  Barcode,
  PlayCircle,
  RotateCcw,
  BadgeCheck,
  Image as ImageIcon,
} from 'lucide-react';
import type { User as FirebaseUser } from 'firebase/auth';
import { DISTRICTS, PRODUCTS, Product, REVIEWS } from '../data/products';
import { getUpazilasByDistrict } from '../data/bangladeshLocations';
import { DEFAULT_VENDORS, getProductMarketplaceMeta } from '../data/vendors';
import type {
  ProductQuestionRecord,
  ProductReviewRecord,
  VendorStoreRecord,
} from '../types';
import { ResilientImage } from './ResilientImage';
import { isPlayableDirectVideoUrl } from './MediaUploaderControl';

function getYoutubeEmbedUrl(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
  return match ? `https://www.youtube.com/embed/${match[1]}?rel=0` : null;
}

interface ProductDetailViewProps {
  product: Product;
  products?: Product[];
  reviews?: ProductReviewRecord[];
  productQuestions?: ProductQuestionRecord[];
  vendors?: VendorStoreRecord[];
  recentlyViewed?: Product[];
  firebaseUser?: FirebaseUser | null;
  cartCount: number;
  isWishlisted: boolean;
  countdownText: string;
  onBack: () => void;
  onGoHome: () => void;
  onOpenCart: () => void;
  onToggleWishlist: (id: string) => void;
  onAddToCart: (product: Product, variantId: string, qty: number) => void;
  onBuyNow: (product: Product, variantId: string, qty: number) => void;
  onSelectProduct: (product: Product) => void;
  onSubmitReview?: (rating: number, comment: string, authorName: string) => Promise<void>;
  onSubmitQuestion?: (product: Product, question: string) => Promise<void>;
  onVisitStore?: (vendorId: string) => void;
  onChatWithVendor?: (vendor: VendorStoreRecord, product: Product) => void;
  onGoogleLogin?: () => Promise<void>;
  onNotify: (msg: string) => void;
}

export function ProductDetailView({
  product,
  products = PRODUCTS,
  reviews = [],
  productQuestions = [],
  vendors = DEFAULT_VENDORS,
  recentlyViewed = [],
  firebaseUser,
  cartCount,
  isWishlisted,
  countdownText,
  onBack,
  onGoHome,
  onOpenCart,
  onToggleWishlist,
  onAddToCart,
  onBuyNow,
  onSelectProduct,
  onSubmitReview,
  onSubmitQuestion,
  onVisitStore,
  onChatWithVendor,
  onGoogleLogin,
  onNotify,
}: ProductDetailViewProps) {
  const [imgIndex, setImgIndex] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState(product.variants[0]?.id ?? '');
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState<'details' | 'ratings' | 'qa'>('details');
  const [optionsSheetOpen, setOptionsSheetOpen] = useState(false);
  const [sheetAction, setSheetAction] = useState<'buy' | 'cart'>('buy');
  const [questionText, setQuestionText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [withPhotosOnly, setWithPhotosOnly] = useState(false);
  const [calcDistrict, setCalcDistrict] = useState('ঢাকা');
  const [calcUpazila, setCalcUpazila] = useState(getUpazilasByDistrict('ঢাকা')[0] ?? 'মিরপুর');
  const [zoomPos, setZoomPos] = useState<{ x: number; y: number } | null>(null);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);

  const meta = useMemo(() => getProductMarketplaceMeta(product, vendors), [product, vendors]);

  useEffect(() => {
    setImgIndex(0);
    setSelectedVariantId(product.variants[0]?.id ?? '');
    setQty(1);
    setShowVideoPlayer(false);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [product]);

  const upazilas = useMemo(() => getUpazilasByDistrict(calcDistrict), [calcDistrict]);
  useEffect(() => {
    if (!upazilas.includes(calcUpazila)) {
      setCalcUpazila(upazilas[0] ?? 'সদর');
    }
  }, [calcDistrict, upazilas, calcUpazila]);

  const activeVariant =
    product.variants.find((v) => v.id === selectedVariantId) ?? product.variants[0];
  const savings = activeVariant.originalPrice
    ? activeVariant.originalPrice - activeVariant.price
    : 0;

  const estDeliveryFee =
    meta.freeShipping || activeVariant.price * qty >= 1500
      ? 0
      : calcDistrict === 'ঢাকা' || calcDistrict === 'চুয়াডাঙ্গা'
        ? 50
        : 120;

  const productSpecificReviews = reviews.filter((r) => r.productId === product.id);
  const combinedReviews = [
    ...productSpecificReviews.map((r) => ({
      id: r.id,
      author: r.author,
      rating: r.rating,
      comment: r.comment,
      date: r.createdAtText || 'Verified',
      hasPhoto: false,
    })),
    ...REVIEWS.map((r, idx) => ({
      id: r.id,
      author: r.author,
      rating: 5 - (idx % 2 === 1 ? 1 : 0),
      comment: r.comment,
      date: r.date,
      hasPhoto: idx === 0,
    })),
  ];

  const displayedReviews = withPhotosOnly
    ? combinedReviews.filter((r) => r.hasPhoto)
    : combinedReviews;

  const productQaList = useMemo(() => {
    const live = productQuestions.filter((q) => q.productId === product.id);
    if (live.length > 0) return live;
    return [
      {
        id: 'default-qa-1',
        productId: product.id,
        sellerId: meta.seller.id,
        authorName: 'Tariqul Islam',
        question: 'পণ্যটি কি ১০০% খাঁটি ও কেমিক্যালমুক্ত?',
        answer: `জ্বি, ${meta.seller.storeName} থেকে ল্যাব-পরীক্ষিত ও শতভাগ প্রাকৃতিক ব্যাচ সরবরাহ করা হয়।`,
        answeredBy: meta.seller.storeName,
        createdAtText: 'Verified Seller',
      },
      {
        id: 'default-qa-2',
        productId: product.id,
        sellerId: meta.seller.id,
        authorName: 'Sadia Afrin',
        question: 'ঢাকা ও চুয়াডাঙ্গার বাইরে ডেলিভারি পেতে কতদিন লাগে?',
        answer: '২৪–৭২ ঘণ্টার মধ্যে Steadfast / Pathao / RedX কুরিয়ারে পৌঁছে যাবে।',
        answeredBy: meta.seller.storeName,
        createdAtText: 'Verified Seller',
      },
    ];
  }, [productQuestions, product.id, meta.seller.id, meta.seller.storeName]);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href).catch(() => undefined);
    }
    onNotify('প্রোডাক্টের লিংক কপি হয়েছে!');
  };

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) return;
    if (onSubmitQuestion) {
      await onSubmitQuestion(product, questionText.trim());
    }
    setQuestionText('');
    onNotify('আপনার প্রশ্ন সেলারের কাছে পাঠানো হয়েছে!');
  };

  const ratingBars = [
    { star: 5, pct: 84 },
    { star: 4, pct: 11 },
    { star: 3, pct: 3 },
    { star: 2, pct: 1 },
    { star: 1, pct: 1 },
  ];

  return (
    <div className="min-h-screen site-canvas text-[#081149] pb-24 lg:pb-10">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 ot-header-frosted border-b border-[#DDDDEF]">
        <div className="max-w-[1240px] mx-auto px-3 sm:px-6 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={onBack}
              aria-label="Back"
              className="p-1.5 rounded-full hover:bg-[#EDF4FF] text-[#081149] cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={onGoHome}
              aria-label="Home"
              className="p-1.5 rounded-full hover:bg-[#EDF4FF] text-[#081149] cursor-pointer"
            >
              <Home className="w-5 h-5" />
            </button>
            <nav className="hidden sm:flex items-center gap-1.5 text-xs text-[#5E6484] ml-2 truncate">
              <span>Home</span>
              <span>/</span>
              <span>{product.categoryLabel}</span>
              <span>/</span>
              <span className="text-[#081149] font-semibold truncate">{product.name}</span>
            </nav>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleShare}
              aria-label="Share"
              className="p-1.5 rounded-full hover:bg-[#EDF4FF] text-[#3C4266] cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onOpenCart}
              aria-label="Cart"
              className="relative p-1.5 rounded-full hover:bg-[#EDF4FF] text-[#081149] cursor-pointer"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[#663CBC] text-white text-[10px] font-bold flex items-center justify-center font-mono">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1240px] mx-auto px-0 sm:px-6 pt-3 space-y-4">
        {/* 3-COLUMN ADVANCED ROYAL VIOLET PDP CARD */}
        <section className="bg-white rounded-none sm:rounded-2xl border border-[#DDDDEF] shadow-xs p-3.5 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Column 1: Media Gallery with Hover Zoom Lens & Video Player (lg:col-span-4) */}
            <div className="lg:col-span-4 space-y-2.5">
              {showVideoPlayer && product.videoUrl ? (
                <div className="rounded-xl overflow-hidden bg-black border border-[#DDDDEF]">
                  <div className="px-3 py-2 bg-[#081149] text-white flex items-center justify-between gap-2 border-b border-white/10">
                    <span className="text-[11px] font-bold flex items-center gap-1.5 text-[#C4B5FD]">
                      <PlayCircle className="w-4 h-4" />
                      <span>প্রোডাক্ট ভিডিও</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowVideoPlayer(false)}
                      className="px-2.5 py-1 rounded bg-white/15 hover:bg-white/25 text-white text-[11px] font-bold cursor-pointer"
                    >
                      ← ছবিতে ফিরুন
                    </button>
                  </div>

                  {isPlayableDirectVideoUrl(product.videoUrl) ? (
                    <div className="w-full aspect-video sm:min-h-[300px] max-h-[420px] bg-black flex items-center justify-center">
                      <video
                        key={product.videoUrl}
                        src={product.videoUrl}
                        controls
                        playsInline
                        preload="metadata"
                        poster={product.image}
                        className="w-full h-full object-contain bg-black"
                      />
                    </div>
                  ) : getYoutubeEmbedUrl(product.videoUrl) ? (
                    <div className="w-full aspect-video bg-black">
                      <iframe
                        src={getYoutubeEmbedUrl(product.videoUrl) || ''}
                        title={`${product.name} Video`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full border-0"
                      />
                    </div>
                  ) : (
                    <div className="p-6 text-center text-white space-y-3 aspect-video flex flex-col items-center justify-center">
                      <PlayCircle className="w-10 h-10 mx-auto text-[#A78BFA]" />
                      <p className="text-xs text-gray-300">বাহ্যিক প্রোডাক্ট ভিডিও লিংক</p>
                      <a
                        href={product.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex px-4 py-2 rounded-lg ot-gradient-btn text-white text-xs font-bold"
                      >
                        ভিডিও ওপেন করুন
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = ((e.clientX - rect.left) / rect.width) * 100;
                    const y = ((e.clientY - rect.top) / rect.height) * 100;
                    setZoomPos({ x, y });
                  }}
                  onMouseLeave={() => setZoomPos(null)}
                  className="relative aspect-square rounded-xl overflow-hidden bg-[#F4F7FF] border border-[#DDDDEF] cursor-crosshair"
                >
                  <ResilientImage
                    src={product.gallery[imgIndex] ?? product.image}
                    alt={product.name}
                    fallbackTitle={product.name}
                    className="w-full h-full object-cover transition-transform duration-150"
                    style={
                      zoomPos
                        ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`, transform: 'scale(1.85)' }
                        : undefined
                    }
                  />
                  {product.videoUrl && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowVideoPlayer(true);
                      }}
                      className="absolute bottom-2.5 left-2.5 z-10 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#081149]/85 hover:bg-[#663CBC] text-white text-[11px] font-bold shadow-md transition-colors cursor-pointer"
                    >
                      <PlayCircle className="w-4 h-4 text-[#C4B5FD]" />
                      <span>ভিডিও দেখুন</span>
                    </button>
                  )}
                  <div className="absolute bottom-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-[#081149]/75 text-white text-[11px] font-mono font-bold tabular-nums">
                    {imgIndex + 1}/{product.gallery.length}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {product.gallery.map((img, i) => (
                  <button
                    key={`${img}-${i}`}
                    type="button"
                    onClick={() => {
                      setShowVideoPlayer(false);
                      setImgIndex(i);
                    }}
                    className={`w-14 h-14 rounded-lg overflow-hidden border-2 shrink-0 cursor-pointer transition-all ${
                      !showVideoPlayer && imgIndex === i
                        ? 'border-[#663CBC] ring-2 ring-[#663CBC]/20'
                        : 'border-[#DDDDEF] hover:border-[#663CBC]/50'
                    }`}
                  >
                    <ResilientImage
                      src={img}
                      alt={`${product.name} ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
                {product.videoUrl && (
                  <button
                    type="button"
                    onClick={() => setShowVideoPlayer(true)}
                    className={`w-14 h-14 rounded-lg border-2 flex flex-col items-center justify-center text-[10px] font-bold shrink-0 cursor-pointer ${
                      showVideoPlayer
                        ? 'border-[#663CBC] bg-[#F5F3FF] text-[#663CBC]'
                        : 'border-[#93C5FD] bg-[#EFF6FF] text-[#1D4ED8]'
                    }`}
                  >
                    <PlayCircle className="w-4 h-4" />
                    <span>Video</span>
                  </button>
                )}
              </div>
            </div>

            {/* Column 2: Core Product Purchase Config (lg:col-span-5) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                {meta.isMall && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#081149] text-white text-[10px] font-extrabold uppercase">
                    <BadgeCheck className="w-3 h-3 text-[#C4B5FD]" />
                    Official Mall
                  </span>
                )}
                <span className="px-2 py-0.5 rounded bg-[#F5F3FF] text-[#663CBC] text-[10px] font-bold border border-[#663CBC]/20">
                  {product.tag}
                </span>
                <span className="px-2 py-0.5 rounded bg-[#F4F7FF] font-mono text-[10px] text-[#5E6484]">
                  SKU: {product.sku}
                </span>
              </div>

              <div className="flex items-start justify-between gap-2">
                <h1 className="text-lg sm:text-xl font-extrabold text-[#081149] leading-snug">
                  {product.name} · {product.shortDesc}
                </h1>
                <button
                  type="button"
                  onClick={() => onToggleWishlist(product.id)}
                  aria-label="Toggle Wishlist"
                  className={`p-2 rounded-full border shrink-0 cursor-pointer transition-colors ${
                    isWishlisted
                      ? 'border-[#663CBC] text-[#663CBC] bg-[#F5F3FF]'
                      : 'border-[#DDDDEF] text-[#5E6484] hover:border-[#663CBC]/40'
                  }`}
                >
                  <Heart className="w-4 h-4" fill={isWishlisted ? 'currentColor' : 'none'} />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <div className="flex items-center gap-0.5 text-[#FACA51]">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
                <span className="font-bold text-[#081149]">{meta.rating}</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('ratings')}
                  className="text-[#2563EB] hover:underline cursor-pointer font-medium"
                >
                  {combinedReviews.length + meta.reviewCount} Ratings
                </button>
                <span className="text-[#CBD5E1]">|</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('qa')}
                  className="text-[#2563EB] hover:underline cursor-pointer font-medium"
                >
                  {productQaList.length} Answered Questions
                </button>
              </div>

              {/* Royal Violet Price Showcase */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-[#F4F7FF] via-[#F5F3FF] to-[#EEF2FF] border border-[#663CBC]/25 space-y-1.5">
                <div className="flex items-baseline gap-2.5 font-mono tabular-nums">
                  <span className="text-2xl sm:text-3xl font-black text-[#663CBC]">
                    ৳{activeVariant.price.toLocaleString('en-US')}
                  </span>
                  {activeVariant.originalPrice && (
                    <del className="text-sm text-[#7880A0]">
                      ৳{activeVariant.originalPrice.toLocaleString('en-US')}
                    </del>
                  )}
                  {product.discountPercent && (
                    <span className="px-2 py-0.5 rounded bg-[#663CBC] text-white text-xs font-extrabold">
                      -{product.discountPercent}%
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-semibold text-[#3C4266]">
                  {savings > 0 ? `সাশ্রয় ৳${savings} · ` : ''}
                  অফার শেষ হতে বাকি <span className="font-mono font-bold text-[#081149] tabular-nums">{countdownText}</span>
                </p>
              </div>

              {/* Weight / Pack Variants */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-[#5E6484]">
                  প্যাক সাইজ / ওজন: <span className="text-[#081149]">{activeVariant.label}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => {
                    const active = v.id === activeVariant.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVariantId(v.id)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition-all tabular-nums ${
                          active
                            ? 'border-[#663CBC] bg-[#F5F3FF] text-[#663CBC] ring-1 ring-[#663CBC]/25'
                            : 'border-[#DDDDEF] text-[#081149] bg-white hover:border-[#663CBC]/50'
                        }`}
                      >
                        {v.label} · ৳{v.price}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quantity + Stock Status */}
              <div className="flex flex-wrap items-center gap-4 pt-1">
                <div className="inline-flex items-center border border-[#DDDDEF] rounded-xl bg-[#F4F7FF] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setQty((n) => Math.max(1, n - 1))}
                    aria-label="Decrease quantity"
                    className="w-9 h-9 flex items-center justify-center hover:bg-[#E7EDFF] text-[#081149] cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-9 text-center font-mono tabular-nums text-sm font-bold text-[#081149]">
                    {qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQty((n) => Math.min(20, n + 1))}
                    aria-label="Increase quantity"
                    className="w-9 h-9 flex items-center justify-center hover:bg-[#E7EDFF] text-[#081149] cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <span
                  className={`text-xs font-bold ${
                    product.inStock ? 'text-[#008916]' : 'text-[#DC2626]'
                  }`}
                >
                  {product.inStock ? `In Stock (${product.stockLeft ?? 25} available)` : 'Out of Stock'}
                </span>
              </div>

              {product.wholesalePrice && (
                <div className="px-3 py-2 rounded-xl bg-[#ECFDF5] border border-[#10B981]/30 text-xs font-bold text-[#065F46]">
                  পাইকারি রেট (Wholesale {product.minWholesaleQty ?? 5}+ pcs): ৳{product.wholesalePrice}
                </div>
              )}

              <div className="hidden lg:grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => onBuyNow(product, activeVariant.id, qty)}
                  className="h-11 rounded-xl ot-blue-btn text-white text-sm font-extrabold cursor-pointer tabular-nums"
                >
                  Buy Now · ৳{(activeVariant.price * qty).toLocaleString('en-US')}
                </button>
                <button
                  type="button"
                  onClick={() => onAddToCart(product, activeVariant.id, qty)}
                  className="h-11 rounded-xl ot-gradient-btn text-white text-sm font-extrabold cursor-pointer"
                >
                  Add to Cart
                </button>
              </div>
            </div>

            {/* Column 3: Delivery Calculator + Return/Warranty + Seller Scorecard (lg:col-span-3) */}
            <div className="lg:col-span-3 space-y-3">
              {/* Delivery Estimator Card */}
              <div className="p-3.5 rounded-xl bg-[#F4F7FF] border border-[#DDDDEF] space-y-2.5 text-xs">
                <p className="text-[11px] font-extrabold text-[#5E6484] uppercase tracking-wider">
                  Delivery Options
                </p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[#081149] font-semibold">
                    <MapPin className="w-3.5 h-3.5 text-[#663CBC]" />
                    <span>Select Delivery Zone</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <select
                      value={calcDistrict}
                      onChange={(e) => setCalcDistrict(e.target.value)}
                      className="h-8 px-2 rounded-lg border border-[#DDDDEF] bg-white text-[11px] text-[#081149] focus:outline-none focus:border-[#663CBC]"
                    >
                      {DISTRICTS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                    <select
                      value={calcUpazila}
                      onChange={(e) => setCalcUpazila(e.target.value)}
                      className="h-8 px-2 rounded-lg border border-[#DDDDEF] bg-white text-[11px] text-[#081149] focus:outline-none focus:border-[#663CBC]"
                    >
                      {upazilas.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1.5 border-t border-[#DDDDEF]">
                  <div className="flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-[#2563EB]" />
                    <div>
                      <p className="font-bold text-[#081149]">Standard Delivery</p>
                      <p className="text-[10px] text-[#5E6484]">Est. 24–72 Hours ({calcUpazila})</p>
                    </div>
                  </div>
                  <span className="font-mono font-extrabold text-[#663CBC] tabular-nums">
                    {estDeliveryFee === 0 ? 'Free' : `৳${estDeliveryFee}`}
                  </span>
                </div>

                <div className="pt-2 border-t border-[#DDDDEF] space-y-1.5">
                  <p className="flex items-center gap-1.5 text-[11px] text-[#081149]">
                    <RotateCcw className="w-3.5 h-3.5 text-[#00A859]" />
                    <span>7-Day Easy Return &amp; Replacement</span>
                  </p>
                  <p className="flex items-center gap-1.5 text-[11px] text-[#081149]">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#00A859]" />
                    <span>{meta.warrantyLabel}</span>
                  </p>
                </div>
              </div>

              {/* Seller Scorecard Card */}
              <div className="p-3.5 rounded-xl bg-white border border-[#DDDDEF] space-y-3 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-bold text-[#5E6484] uppercase">Sold By</p>
                    <h3 className="text-sm font-extrabold text-[#081149] flex items-center gap-1 mt-0.5">
                      <span>{meta.seller.storeName}</span>
                      {meta.isMall && <BadgeCheck className="w-4 h-4 text-[#663CBC]" />}
                    </h3>
                    <p className="text-[10px] text-[#5E6484]">{meta.seller.location}</p>
                  </div>
                  {onChatWithVendor && (
                    <button
                      type="button"
                      onClick={() => onChatWithVendor(meta.seller, product)}
                      className="px-2.5 py-1 rounded-lg bg-[#F5F3FF] border border-[#663CBC]/35 text-[#663CBC] text-[11px] font-bold flex items-center gap-1 cursor-pointer hover:bg-[#663CBC] hover:text-white transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Chat</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-[#E7EDFF] text-center">
                  <div className="p-1.5 rounded-lg bg-[#F4F7FF]">
                    <p className="text-[10px] text-[#5E6484]">Positive</p>
                    <p className="text-sm font-extrabold text-[#081149] tabular-nums">
                      {meta.seller.positiveRatingPercent}%
                    </p>
                  </div>
                  <div className="p-1.5 rounded-lg bg-[#F4F7FF]">
                    <p className="text-[10px] text-[#5E6484]">Ship Time</p>
                    <p className="text-sm font-extrabold text-[#081149] tabular-nums">
                      {meta.seller.shipOnTimePercent}%
                    </p>
                  </div>
                  <div className="p-1.5 rounded-lg bg-[#F4F7FF]">
                    <p className="text-[10px] text-[#5E6484]">Response</p>
                    <p className="text-sm font-extrabold text-[#081149] tabular-nums">
                      {meta.seller.chatResponsePercent}%
                    </p>
                  </div>
                </div>

                {onVisitStore && (
                  <button
                    type="button"
                    onClick={() => onVisitStore(meta.seller.id)}
                    className="w-full py-2 rounded-lg border border-[#2563EB] text-[#2563EB] hover:bg-[#2563EB] hover:text-white text-xs font-extrabold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span>VISIT STORE</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Below-the-Fold Tabbed Content: Details | Ratings & Histogram | Q&A */}
        <section className="bg-white rounded-none sm:rounded-2xl border border-[#DDDDEF] overflow-hidden">
          <div className="flex border-b border-[#DDDDEF] bg-[#F4F7FF] px-4 gap-6 overflow-x-auto">
            {[
              { id: 'details', label: 'Product Details & Specs' },
              { id: 'ratings', label: `Ratings & Reviews (${combinedReviews.length})` },
              { id: 'qa', label: `Questions & Answers (${productQaList.length})` },
            ].map((t) => {
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id as typeof activeTab)}
                  className={`py-3 text-xs sm:text-sm font-extrabold border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
                    active ? 'border-[#663CBC] text-[#663CBC]' : 'border-transparent text-[#5E6484] hover:text-[#081149]'
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          <div className="p-4 sm:p-6">
            {activeTab === 'details' && (
              <div className="space-y-4">
                <p className="text-xs sm:text-sm text-[#3C4266] leading-relaxed">{product.description}</p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {product.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2 text-xs text-[#081149]">
                      <Check className="w-3.5 h-3.5 text-[#008916] shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                <table className="w-full text-xs border border-[#DDDDEF] rounded-lg overflow-hidden">
                  <tbody className="divide-y divide-[#E7EDFF]">
                    <tr>
                      <td className="py-2 px-3 bg-[#F4F7FF] font-semibold text-[#5E6484] w-40">Brand / Seller</td>
                      <td className="py-2 px-3 text-[#081149]">
                        {product.brand} ({meta.seller.storeName})
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 bg-[#F4F7FF] font-semibold text-[#5E6484]">Origin</td>
                      <td className="py-2 px-3 text-[#081149]">{product.origin}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 bg-[#F4F7FF] font-semibold text-[#5E6484]">SKU / Barcode</td>
                      <td className="py-2 px-3 font-mono text-[#081149] flex items-center gap-1.5">
                        <Barcode className="w-3.5 h-3.5 text-[#5E6484]" />
                        <span>
                          {product.sku} {product.barcode ? `· ${product.barcode}` : ''}
                        </span>
                      </td>
                    </tr>
                    {product.specifications?.map((sp) => (
                      <tr key={sp.label}>
                        <td className="py-2 px-3 bg-[#F4F7FF] font-semibold text-[#5E6484]">{sp.label}</td>
                        <td className="py-2 px-3 text-[#081149]">{sp.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'ratings' && (
              <div className="space-y-5">
                {/* 5★–1★ Histogram Bar Chart */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4 rounded-xl bg-[#F4F7FF] border border-[#DDDDEF]">
                  <div className="md:col-span-4 text-center md:border-r border-[#DDDDEF] pr-3">
                    <p className="text-3xl font-black text-[#081149] tabular-nums">{meta.rating} / 5</p>
                    <div className="flex justify-center gap-1 text-[#FACA51] my-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                    <p className="text-xs text-[#5E6484]">{combinedReviews.length + meta.reviewCount} Verified Reviews</p>
                  </div>
                  <div className="md:col-span-8 space-y-1.5">
                    {ratingBars.map((bar) => (
                      <div key={bar.star} className="flex items-center gap-2 text-xs">
                        <span className="w-8 font-bold text-[#081149]">{bar.star} ★</span>
                        <div className="flex-1 h-2 rounded-full bg-[#DDDDEF] overflow-hidden">
                          <div className="h-full bg-[#FACA51]" style={{ width: `${bar.pct}%` }} />
                        </div>
                        <span className="w-9 text-right text-[#5E6484] font-mono tabular-nums">{bar.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* With Photos Filter */}
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold uppercase text-[#5E6484]">Customer Reviews</h3>
                  <button
                    type="button"
                    onClick={() => setWithPhotosOnly((v) => !v)}
                    className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 cursor-pointer transition-colors ${
                      withPhotosOnly
                        ? 'border-[#663CBC] bg-[#F5F3FF] text-[#663CBC]'
                        : 'border-[#DDDDEF] text-[#3C4266] hover:border-[#663CBC]/50'
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>With Photos</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {displayedReviews.map((rev) => (
                    <div key={rev.id} className="p-3 rounded-xl bg-[#F4F7FF] border border-[#DDDDEF] text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#081149]">
                          {rev.author} · {'★'.repeat(rev.rating)}
                        </span>
                        <span className="text-[11px] text-[#5E6484]">{rev.date}</span>
                      </div>
                      <p className="text-[#3C4266]">“{rev.comment}”</p>
                    </div>
                  ))}
                </div>

                {onSubmitReview && (
                  <div className="pt-3 border-t border-[#E7EDFF] space-y-2">
                    <p className="text-xs font-extrabold text-[#081149]">আপনার রিভিউ লিখুন</p>
                    {firebaseUser?.emailVerified ? (
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          if (reviewComment.trim().length < 3) return;
                          setReviewSubmitting(true);
                          try {
                            await onSubmitReview(
                              reviewRating,
                              reviewComment.trim(),
                              firebaseUser.displayName || 'Verified Buyer'
                            );
                            setReviewComment('');
                            onNotify('আপনার রিভিউ সেভ হয়েছে!');
                          } finally {
                            setReviewSubmitting(false);
                          }
                        }}
                        className="flex flex-col sm:flex-row gap-2"
                      >
                        <select
                          value={reviewRating}
                          onChange={(e) => setReviewRating(Number(e.target.value))}
                          className="h-9 px-2.5 rounded-lg border border-[#DDDDEF] bg-white text-xs font-bold text-[#081149]"
                        >
                          {[5, 4, 3, 2, 1].map((n) => (
                            <option key={n} value={n}>
                              {n} ★
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          required
                          minLength={3}
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          placeholder="পণ্যের মান সম্পর্কে আপনার মতামত লিখুন..."
                          className="flex-1 h-9 px-3 rounded-lg border border-[#DDDDEF] text-xs focus:outline-none focus:border-[#663CBC]"
                        />
                        <button
                          type="submit"
                          disabled={reviewSubmitting}
                          className="px-4 h-9 rounded-lg bg-[#008916] text-white text-xs font-bold cursor-pointer"
                        >
                          {reviewSubmitting ? 'Saving...' : 'Submit Review'}
                        </button>
                      </form>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void onGoogleLogin?.()}
                        className="text-xs font-bold text-[#663CBC] hover:underline cursor-pointer"
                      >
                        রিভিউ দিতে Google দিয়ে সাইন-ইন করুন →
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'qa' && (
              <div className="space-y-3">
                <form onSubmit={handleAskQuestion} className="flex gap-2">
                  <input
                    type="text"
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    placeholder="সেলারকে পণ্য সম্পর্কে প্রশ্ন করুন..."
                    className="flex-1 h-9 px-3 rounded-lg border border-[#DDDDEF] text-xs focus:outline-none focus:border-[#663CBC]"
                  />
                  <button
                    type="submit"
                    className="px-4 h-9 rounded-lg ot-gradient-btn text-white text-xs font-bold cursor-pointer"
                  >
                    Ask Seller
                  </button>
                </form>

                <div className="space-y-2.5">
                  {productQaList.map((item) => (
                    <div key={item.id} className="text-xs bg-[#F4F7FF] border border-[#DDDDEF] p-3 rounded-xl space-y-1">
                      <p className="font-bold text-[#081149]">Q: {item.question}</p>
                      <p className="text-[11px] text-[#5E6484]">
                        {item.authorName} · {item.createdAtText || 'recent'}
                      </p>
                      {item.answer ? (
                        <p className="text-[#065F46] bg-[#ECFDF5] p-2 rounded-lg mt-1 font-medium">
                          A ({item.answeredBy || meta.seller.storeName}): {item.answer}
                        </p>
                      ) : (
                        <p className="text-[#7880A0] italic">Waiting for seller reply...</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Related Products Grid */}
        <section className="bg-white rounded-none sm:rounded-2xl border border-[#DDDDEF] p-4 space-y-3">
          <h2 className="text-sm font-bold text-[#081149]">Related Products &amp; Recommendations</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {products
              .filter((p) => p.id !== product.id)
              .slice(0, 4)
              .map((rec) => (
                <button
                  key={rec.id}
                  type="button"
                  onClick={() => {
                    onSelectProduct(rec);
                    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
                  }}
                  className="text-left rounded-xl border border-[#DDDDEF] hover:border-[#663CBC] overflow-hidden cursor-pointer bg-white transition-all hover:shadow-sm"
                >
                  <div className="aspect-square bg-[#F4F7FF]">
                    <ResilientImage src={rec.image} alt={rec.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-semibold text-[#081149] line-clamp-2">{rec.name}</p>
                    <p className="font-mono text-xs font-bold text-[#663CBC] mt-1 tabular-nums">৳{rec.price}</p>
                  </div>
                </button>
              ))}
          </div>
        </section>

        {/* Recently Viewed Products */}
        {recentlyViewed.filter((p) => p.id !== product.id).length > 0 && (
          <section className="bg-white rounded-none sm:rounded-2xl border border-[#DDDDEF] p-4 space-y-3">
            <h2 className="text-sm font-bold text-[#081149]">Recently Viewed</h2>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {recentlyViewed
                .filter((p) => p.id !== product.id)
                .slice(0, 6)
                .map((rv) => (
                  <button
                    key={`rv-${rv.id}`}
                    type="button"
                    onClick={() => {
                      onSelectProduct(rv);
                      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
                    }}
                    className="text-left rounded-xl border border-[#DDDDEF] hover:border-[#663CBC] overflow-hidden cursor-pointer bg-white transition-colors"
                  >
                    <div className="aspect-square bg-[#F4F7FF]">
                      <ResilientImage src={rv.image} alt={rv.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-2">
                      <p className="text-[11px] font-semibold text-[#081149] line-clamp-1">{rv.name}</p>
                      <p className="font-mono text-[11px] font-bold text-[#663CBC] tabular-nums">৳{rv.price}</p>
                    </div>
                  </button>
                ))}
            </div>
          </section>
        )}
      </main>

      {/* Mobile Bottom Sticky Action Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 ot-header-frosted border-t border-[#DDDDEF] h-14">
        <div className="max-w-[960px] mx-auto h-full flex items-center">
          <button
            type="button"
            onClick={() => (onVisitStore ? onVisitStore(meta.seller.id) : onGoHome())}
            className="w-16 h-full flex flex-col items-center justify-center gap-0.5 text-[10px] text-[#5E6484] hover:text-[#663CBC] cursor-pointer shrink-0"
          >
            <Store className="w-4 h-4 text-[#2563EB]" />
            <span>Store</span>
          </button>

          <button
            type="button"
            onClick={() => onChatWithVendor?.(meta.seller, product)}
            className="w-16 h-full flex flex-col items-center justify-center gap-0.5 text-[10px] text-[#5E6484] hover:text-[#663CBC] border-r border-[#E7EDFF] shrink-0 cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 text-[#663CBC]" />
            <span>Chat</span>
          </button>

          <div className="flex-1 h-full p-1.5 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setSheetAction('buy');
                setOptionsSheetOpen(true);
              }}
              className="flex-1 h-full rounded-l-xl ot-blue-btn text-white text-xs sm:text-sm font-bold cursor-pointer"
            >
              Buy Now
            </button>
            <button
              type="button"
              onClick={() => {
                setSheetAction('cart');
                setOptionsSheetOpen(true);
              }}
              className="flex-1 h-full rounded-r-xl ot-gradient-btn text-white text-xs sm:text-sm font-bold cursor-pointer"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Sheet Variant Picker */}
      {optionsSheetOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/55 flex items-end justify-center"
          role="dialog"
          aria-modal="true"
          onClick={() => setOptionsSheetOpen(false)}
        >
          <div className="w-full max-w-lg bg-white rounded-t-2xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 flex items-start gap-3 border-b border-[#E7EDFF]">
              <div className="w-16 h-16 rounded-xl overflow-hidden border border-[#DDDDEF] shrink-0">
                <ResilientImage src={product.gallery[imgIndex] ?? product.image} alt={product.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-mono text-xl font-extrabold text-[#663CBC] tabular-nums">৳ {activeVariant.price}</p>
                <p className="text-xs text-[#5E6484] truncate">{meta.seller.storeName}</p>
              </div>
              <button
                type="button"
                onClick={() => setOptionsSheetOpen(false)}
                className="w-7 h-7 rounded-full bg-[#F4F7FF] text-[#081149] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVariantId(v.id)}
                    className={`p-2.5 rounded-xl border text-left text-xs font-bold cursor-pointer transition-colors ${
                      v.id === activeVariant.id
                        ? 'border-[#663CBC] bg-[#F5F3FF] text-[#663CBC]'
                        : 'border-[#DDDDEF] text-[#081149]'
                    }`}
                  >
                    {v.label} · ৳{v.price}
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-bold text-[#081149]">Quantity</span>
                <div className="inline-flex items-center gap-3">
                  <button type="button" onClick={() => setQty((n) => Math.max(1, n - 1))} className="w-8 h-8 rounded-lg bg-[#F4F7FF] text-[#081149] font-bold cursor-pointer">-</button>
                  <span className="font-mono font-bold text-sm text-[#081149] tabular-nums">{qty}</span>
                  <button type="button" onClick={() => setQty((n) => Math.min(20, n + 1))} className="w-8 h-8 rounded-lg bg-[#F4F7FF] text-[#081149] font-bold cursor-pointer">+</button>
                </div>
              </div>
            </div>
            <div className="p-3 border-t border-[#E7EDFF]">
              <button
                type="button"
                onClick={() => {
                  if (sheetAction === 'buy') {
                    setOptionsSheetOpen(false);
                    onBuyNow(product, activeVariant.id, qty);
                  } else {
                    onAddToCart(product, activeVariant.id, qty);
                    setOptionsSheetOpen(false);
                  }
                }}
                className={`w-full h-11 rounded-xl text-white text-sm font-bold cursor-pointer tabular-nums ${
                  sheetAction === 'buy' ? 'ot-blue-btn' : 'ot-gradient-btn'
                }`}
              >
                {sheetAction === 'buy' ? 'Buy Now' : 'Add to Cart'} · ৳{(activeVariant.price * qty).toLocaleString('en-US')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
