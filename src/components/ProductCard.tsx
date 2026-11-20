import { useState } from 'react';
import { Eye, Heart, Flame, Star, ShieldCheck, Truck, PlayCircle, ShoppingBag } from 'lucide-react';
import { Product } from '../data/products';
import { getProductMarketplaceMeta } from '../data/vendors';
import type { ProductCardDesignId, VendorStoreRecord } from '../types';
import { ResilientImage } from './ResilientImage';

interface ProductCardProps {
  product: Product;
  isWishlisted: boolean;
  vendors?: VendorStoreRecord[];
  viewMode?: 'grid' | 'list';
  cardDesign?: ProductCardDesignId;
  onToggleWishlist: (productId: string) => void;
  onOpenDetail: (product: Product) => void;
  onOrderNow: (product: Product, variantId?: string) => void;
  onQuickAdd?: (product: Product, variantId: string) => void;
  onQuickView?: (product: Product) => void;
}

export function ProductCard({
  product,
  isWishlisted,
  vendors,
  viewMode = 'grid',
  cardDesign = 'classic-mall',
  onToggleWishlist,
  onOpenDetail,
  onOrderNow,
  onQuickAdd,
  onQuickView,
}: ProductCardProps) {
  const [selectedVariantId, setSelectedVariantId] = useState(product.variants[0]?.id ?? '');
  const meta = getProductMarketplaceMeta(product, vendors);
  const secondaryImage = product.gallery?.[1];
  const activeVariant =
    product.variants.find((v) => v.id === selectedVariantId) ?? product.variants[0];
  const displayPrice = activeVariant?.price ?? product.price;
  const displayOriginal = activeVariant?.originalPrice ?? product.originalPrice;

  const savingsAmount =
    displayOriginal && displayOriginal > displayPrice ? displayOriginal - displayPrice : 0;

  const fillPercent = product.stockLeft
    ? Math.max(28, Math.min(92, 100 - product.stockLeft * 7))
    : Math.max(42, Math.min(88, Math.round((product.soldCount / 180) * 100)));

  if (viewMode === 'list') {
    return (
      <article className="ot-product-card p-3 sm:p-3.5 flex items-center gap-4 group">
        <button
          type="button"
          onClick={() => onOpenDetail(product)}
          className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-xl overflow-hidden bg-[var(--store-subtle-bg)] border border-[var(--store-card-border)] shrink-0 cursor-pointer"
        >
          <ResilientImage
            src={product.image}
            alt={product.name}
            fallbackTitle={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {meta.isMall && (
            <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-[#081149]/90 text-white text-[9px] font-extrabold uppercase tracking-wider">
              Mall
            </span>
          )}
        </button>

        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
            {product.discountPercent && (
              <span className="px-2 py-0.5 rounded-md ot-gradient-btn text-white text-[10px] font-extrabold tabular-nums">
                -{product.discountPercent}% OFF
              </span>
            )}
            {meta.freeShipping && (
              <span className="inline-flex items-center gap-1 text-[#047857] text-[10px] font-bold">
                <Truck className="w-3 h-3" /> Free Delivery
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => onOpenDetail(product)}
            className="text-left text-sm sm:text-base font-bold text-[var(--store-text-primary)] hover:brand-text line-clamp-2 cursor-pointer"
          >
            {product.name}
          </button>
          <p className="text-xs text-[var(--store-text-muted)] line-clamp-1">
            {product.shortDesc} · {meta.seller.storeName}
          </p>
          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-0.5 text-[#F59E0B]">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span className="font-bold text-[var(--store-text-primary)]">{meta.rating}</span>
            </span>
            <span className="text-[var(--store-text-muted)]">({meta.reviewCount})</span>
            <span className="text-[var(--store-text-muted)]">· {product.soldCount} sold</span>
          </div>
          {product.variants.length > 1 && (
            <div className="flex flex-wrap gap-1 pt-0.5">
              {product.variants.slice(0, 3).map((v) => {
                const active = v.id === activeVariant?.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVariantId(v.id)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-colors cursor-pointer ${
                      active
                        ? 'brand-border brand-tint-bg brand-text'
                        : 'border-[var(--store-card-border)] text-[var(--store-text-muted)] hover:brand-border'
                    }`}
                  >
                    {v.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="text-right shrink-0 space-y-2">
          <p className="font-mono tabular-nums text-lg font-extrabold brand-text">
            ৳{displayPrice.toLocaleString('en-US')}
          </p>
          {displayOriginal && (
            <del className="block font-mono tabular-nums text-xs text-[var(--store-text-muted)] opacity-75">
              ৳{displayOriginal.toLocaleString('en-US')}
            </del>
          )}
          <div className="flex items-center gap-1.5 justify-end">
            {onQuickAdd && activeVariant && (
              <button
                type="button"
                onClick={() => onQuickAdd(product, activeVariant.id)}
                title="কার্টে যোগ করুন"
                aria-label="Add to cart"
                className="w-8 h-8 theme-btn-shape border border-[var(--store-card-border)] bg-[var(--store-subtle-bg)] hover:brand-border brand-text flex items-center justify-center cursor-pointer"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => onOrderNow(product, activeVariant?.id)}
              className="px-4 py-1.5 theme-btn-shape ot-gradient-btn text-xs font-bold cursor-pointer"
            >
              অর্ডার করুন
            </button>
          </div>
        </div>
      </article>
    );
  }

  const cardShellClass =
    cardDesign === 'rounded-glass'
      ? 'ot-product-card backdrop-blur flex flex-col justify-between overflow-hidden group'
      : cardDesign === 'minimal-editorial'
        ? 'theme-surface-card border hover:border-[var(--brand-primary)]/40 hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group'
        : cardDesign === 'bold-promo'
          ? 'ot-product-card border-2 border-[var(--brand-primary)]/30 hover:border-[var(--brand-primary)] flex flex-col justify-between overflow-hidden group'
          : cardDesign === 'compact-quickshop'
            ? 'theme-surface-card border hover:border-[var(--brand-primary)] hover:shadow-sm transition-all duration-150 flex flex-col justify-between overflow-hidden group'
            : cardDesign === 'luxury-framed'
              ? 'theme-surface-card border border-[#663CBC]/35 p-1.5 hover:border-[var(--brand-primary)] hover:shadow-lg transition-all duration-200 flex flex-col justify-between overflow-hidden group'
              : 'ot-product-card flex flex-col justify-between overflow-hidden group';

  const mediaFrameClass =
    cardDesign === 'luxury-framed'
      ? 'relative aspect-[4/4] w-full overflow-hidden bg-[var(--store-subtle-bg)] rounded-lg border border-[var(--store-card-border)]'
      : cardDesign === 'compact-quickshop'
        ? 'relative aspect-[5/4] w-full overflow-hidden bg-[var(--store-subtle-bg)]'
        : 'relative aspect-square w-full overflow-hidden bg-[var(--store-subtle-bg)]';

  const ctaButtonClass =
    cardDesign === 'minimal-editorial'
      ? 'flex-1 py-2 theme-btn-shape border border-[var(--brand-secondary)] text-[var(--store-text-primary)] hover:bg-[var(--brand-primary)] hover:border-[var(--brand-primary)] hover:text-white text-xs font-bold transition-colors whitespace-nowrap cursor-pointer'
      : cardDesign === 'compact-quickshop'
        ? 'flex-1 py-1.5 theme-btn-shape ot-gradient-btn text-[11px] font-bold whitespace-nowrap cursor-pointer'
        : cardDesign === 'luxury-framed' || cardDesign === 'wholesale-tier'
          ? 'flex-1 py-2 theme-btn-shape bg-[#081149] hover:bg-[var(--brand-primary)] text-white text-xs font-bold tracking-wide transition-colors whitespace-nowrap cursor-pointer'
          : 'flex-1 py-2 theme-btn-shape ot-gradient-btn text-xs font-bold whitespace-nowrap cursor-pointer';

  const wholesalePrice = product.wholesalePrice ?? Math.round(displayPrice * 0.85);
  const minWholesaleQty = product.minWholesaleQty ?? 5;

  return (
    <article className={cardShellClass}>
      <div>
        {cardDesign === 'bold-promo' && (
          <div className="h-1 w-full bg-gradient-to-r from-[#663CBC] via-[#7F48CD] to-[#2563EB]" />
        )}
        <div className={mediaFrameClass}>
          {/* Top-left Clean OfferTopUp Discount / Mall Tag */}
          <div className="absolute top-2 left-2 z-10 flex items-center gap-1">
            {product.discountPercent &&
              cardDesign !== 'minimal-editorial' &&
              cardDesign !== 'luxury-framed' && (
                <span className="px-2 py-0.5 rounded-md bg-gradient-to-r from-[#663CBC] to-[#2563EB] text-white text-[10px] font-extrabold tabular-nums shadow-xs">
                  -{product.discountPercent}%
                </span>
              )}
            {meta.isMall &&
              cardDesign !== 'minimal-editorial' &&
              cardDesign !== 'compact-quickshop' &&
              cardDesign !== 'luxury-framed' && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-[#081149]/85 backdrop-blur-xs text-white text-[9px] font-extrabold uppercase tracking-wide shadow-xs">
                  <ShieldCheck className="w-2.5 h-2.5 text-[#A78BFA]" />
                  Mall
                </span>
              )}
            {cardDesign === 'wholesale-tier' && (
              <span className="px-2 py-0.5 rounded-md bg-[#081149] text-white text-[9px] font-extrabold uppercase">
                B2B · Min {minWholesaleQty}
              </span>
            )}
          </div>

          {product.videoUrl && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetail(product);
              }}
              className="absolute bottom-2 right-2 z-10 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#081149]/80 hover:bg-[var(--brand-primary)] text-white text-[9px] font-bold shadow-xs backdrop-blur-xs cursor-pointer transition-colors"
            >
              <PlayCircle className="w-3 h-3 text-[#C4B5FD]" />
              <span>Video</span>
            </button>
          )}

          {meta.freeShipping &&
            cardDesign !== 'minimal-editorial' &&
            cardDesign !== 'compact-quickshop' && (
              <span className="absolute bottom-2 left-2 z-10 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#047857]/90 backdrop-blur-xs text-white text-[9px] font-bold shadow-xs">
                <Truck className="w-2.5 h-2.5" />
                Free Shipping
              </span>
            )}

          <div className="absolute top-2 right-2 z-10 flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => onToggleWishlist(product.id)}
              aria-label={
                isWishlisted
                  ? `Remove ${product.name} from wishlist`
                  : `Add ${product.name} to wishlist`
              }
              className={`w-7 h-7 rounded-full flex items-center justify-center shadow-xs transition-colors cursor-pointer ${
                isWishlisted
                  ? 'ot-gradient-btn text-white'
                  : 'bg-white/92 backdrop-blur-xs text-[#5E6484] hover:text-[var(--brand-primary)]'
              }`}
            >
              <Heart
                className="w-3.5 h-3.5"
                fill={isWishlisted ? 'currentColor' : 'none'}
                strokeWidth={2}
              />
            </button>

            {onQuickView && cardDesign !== 'compact-quickshop' && (
              <button
                type="button"
                onClick={() => onQuickView(product)}
                aria-label={`Quick view ${product.name}`}
                title="কুইক প্রিভিউ"
                className="w-7 h-7 rounded-full bg-white/92 backdrop-blur-xs text-[#081149] hover:bg-[var(--brand-primary)] hover:text-white flex items-center justify-center shadow-xs transition-colors cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => onOpenDetail(product)}
            className="block w-full h-full cursor-pointer relative"
          >
            <ResilientImage
              src={product.image}
              alt={product.name}
              fallbackTitle={product.name}
              className={`w-full h-full object-cover transition-all duration-300 ${
                secondaryImage ? 'group-hover:opacity-0' : 'group-hover:scale-105'
              }`}
            />
            {secondaryImage && (
              <ResilientImage
                src={secondaryImage}
                alt={`${product.name} alternate`}
                fallbackTitle={product.name}
                className="w-full h-full object-cover absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              />
            )}
          </button>
        </div>

        <div
          className={
            cardDesign === 'compact-quickshop'
              ? 'p-2 space-y-1.5'
              : 'p-2.5 sm:p-3.5 space-y-1.5'
          }
        >
          {/* Quiet Origin + Rating Row */}
          <div className="flex items-center justify-between gap-1 text-[10px] text-[var(--store-text-muted)]">
            <span className="truncate font-semibold">{product.origin}</span>
            <span className="inline-flex items-center gap-0.5 shrink-0 font-bold text-[var(--store-text-primary)]">
              <Star className="w-3 h-3 text-[#F59E0B] fill-current" />
              <span>{meta.rating}</span>
            </span>
          </div>

          <h3 className={cardDesign === 'compact-quickshop' ? 'min-h-[30px]' : 'min-h-[36px]'}>
            <button
              type="button"
              onClick={() => onOpenDetail(product)}
              className={`text-left text-xs sm:text-[13px] font-bold text-[var(--store-text-primary)] hover:brand-text transition-colors line-clamp-2 leading-[1.35] cursor-pointer ${
                cardDesign === 'luxury-framed' ? 'font-heading-template' : ''
              }`}
            >
              {product.name}
            </button>
          </h3>

          {/* Interactive Pack/Weight Quick Switcher inside Card */}
          {product.variants.length > 1 && cardDesign !== 'compact-quickshop' && (
            <div className="flex flex-wrap items-center gap-1 pt-0.5">
              {product.variants.slice(0, 3).map((v) => {
                const isSelected = v.id === activeVariant?.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVariantId(v.id)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                      isSelected
                        ? 'brand-border brand-tint-bg brand-text'
                        : 'border-[var(--store-card-border)] bg-[var(--store-subtle-bg)] text-[var(--store-text-muted)] hover:brand-border'
                    }`}
                  >
                    {v.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Tabular Royal Violet Price & Savings */}
          <div className="font-mono tabular-nums pt-0.5">
            <div className="flex items-baseline gap-2 flex-wrap">
              <p className="text-base sm:text-[17px] font-extrabold brand-text leading-tight">
                ৳{displayPrice.toLocaleString('en-US')}
              </p>
              {displayOriginal && (
                <del className="text-[11px] text-[var(--store-text-muted)] opacity-75">
                  ৳{displayOriginal.toLocaleString('en-US')}
                </del>
              )}
              {savingsAmount > 0 && cardDesign !== 'compact-quickshop' && (
                <span className="ml-auto text-[10px] font-bold text-[#047857]">
                  সাশ্রয় ৳{savingsAmount}
                </span>
              )}
            </div>
            {cardDesign === 'wholesale-tier' && (
              <p className="text-[10px] font-bold text-[#2563EB] mt-0.5">
                পাইকারি রেট: ৳{wholesalePrice.toLocaleString('en-US')}
              </p>
            )}
          </div>

          {cardDesign !== 'compact-quickshop' && (
            <p className="text-[10px] text-[var(--store-text-muted)] truncate">
              {meta.seller.storeName} ·{' '}
              {product.soldCount >= 1000
                ? `${(product.soldCount / 1000).toFixed(1)}k`
                : product.soldCount}{' '}
              sold
            </p>
          )}

          {/* Royal Violet + Electric Blue Demand Progress Meter */}
          {cardDesign !== 'minimal-editorial' &&
            cardDesign !== 'luxury-framed' &&
            cardDesign !== 'compact-quickshop' &&
            cardDesign !== 'wholesale-tier' && (
              <div className="pt-0.5">
                <div className="relative h-4 rounded-full bg-[#EDF2FF] border border-[#DDDDEF] overflow-hidden flex items-center pl-5 pr-2">
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-gradient-to-tr from-[#663CBC] to-[#2563EB] text-white flex items-center justify-center z-10 shadow-2xs">
                    <Flame className="w-2.5 h-2.5 fill-current" />
                  </span>
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#663CBC] to-[#2563EB] rounded-full"
                    style={{ width: `${fillPercent}%` }}
                  />
                  <span className="relative z-10 text-[9px] sm:text-[10px] font-bold text-white drop-shadow-[0_1px_1px_rgba(8,17,73,0.45)] truncate">
                    {product.stockLeft
                      ? `${product.stockLeft}টি স্টকে আছে`
                      : `${product.soldCount} বিক্রি হয়েছে`}
                  </span>
                </div>
              </div>
            )}
        </div>
      </div>

      <div
        className={`flex items-center gap-1.5 ${
          cardDesign === 'minimal-editorial' || cardDesign === 'luxury-framed'
            ? 'px-3 pb-3'
            : cardDesign === 'compact-quickshop'
              ? 'px-2 pb-2'
              : 'px-2.5 pb-2.5 sm:px-3.5 sm:pb-3.5'
        }`}
      >
        <button
          type="button"
          onClick={() => onOrderNow(product, activeVariant?.id)}
          className={ctaButtonClass}
        >
          {cardDesign === 'compact-quickshop'
            ? 'কিনুন'
            : cardDesign === 'wholesale-tier'
              ? 'পাইকারি অর্ডার'
              : 'অর্ডার করুন'}
        </button>
        {onQuickAdd && activeVariant && cardDesign !== 'compact-quickshop' && (
          <button
            type="button"
            onClick={() => onQuickAdd(product, activeVariant.id)}
            title="কার্টে যোগ করুন"
            aria-label={`Add ${product.name} to cart`}
            className="w-9 h-[34px] sm:h-[36px] theme-btn-shape border border-[var(--store-card-border)] bg-[var(--store-subtle-bg)] hover:brand-border hover:brand-tint-bg brand-text flex items-center justify-center shrink-0 transition-colors cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
          </button>
        )}
      </div>
    </article>
  );
}
