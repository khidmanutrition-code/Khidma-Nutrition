import { useState, useEffect } from 'react';
import {
  Check,
  Plus,
  Minus,
  ShoppingCart,
  Truck,
  ShieldCheck,
  Star,
  MapPin,
  Award,
  RotateCcw,
} from 'lucide-react';
import {
  BRAND_INFO,
  DISTRICTS,
  PRODUCTS,
  Product,
  SHIPPING_RATES,
} from '../data/products';
import { DeliveryZone, OrderReceipt } from '../types';
import { ResilientImage } from './ResilientImage';

interface SingleProductSystemProps {
  selectedProduct: Product;
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product, variantId: string, qty: number) => void;
  onOrderConfirmed: (receipt: OrderReceipt) => void;
}

export function SingleProductSystem({
  selectedProduct,
  onSelectProduct,
  onAddToCart,
  onOrderConfirmed,
}: SingleProductSystemProps) {
  const [activeImage, setActiveImage] = useState(selectedProduct.image);
  const [selectedVariantId, setSelectedVariantId] = useState(
    selectedProduct.variants[0]?.id ?? ''
  );
  const [quantity, setQuantity] = useState(1);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [district, setDistrict] = useState('ঢাকা');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash on Delivery' | 'bKash / Nagad'>(
    'Cash on Delivery'
  );
  const [trxId, setTrxId] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setActiveImage(selectedProduct.image);
    setSelectedVariantId(selectedProduct.variants[0]?.id ?? '');
    setQuantity(1);
  }, [selectedProduct]);

  const activeVariant =
    selectedProduct.variants.find((v) => v.id === selectedVariantId) ??
    selectedProduct.variants[0];

  const zone: DeliveryZone =
    district === 'ঢাকা' || district === 'চুয়াডাঙ্গা' ? 'dhaka' : 'outside';
  const subtotal = activeVariant.price * quantity;
  const freeShipping = subtotal >= 1500;
  const shippingFee = freeShipping ? 0 : SHIPPING_RATES[zone].fee;
  const total = subtotal + shippingFee;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};

    if (name.trim().length < 2) {
      nextErrors.name = 'আপনার সম্পূর্ণ নাম লিখুন।';
    }
    const cleanPhone = phone.replace(/[\s-]/g, '');
    if (!/^(\+?88)?01[3-9]\d{8}$/.test(cleanPhone)) {
      nextErrors.phone = 'সঠিক ১১ সংখ্যার মোবাইল নম্বর দিন (যেমন: 01770241803)।';
    }
    if (address.trim().length < 6) {
      nextErrors.address = 'বাসা, রোড ও এলাকার পূর্ণ ঠিকানা লিখুন।';
    }
    if (paymentMethod === 'bKash / Nagad' && trxId.trim().length < 4) {
      nextErrors.trxId = 'বিকাশ/নগদ সেন্ড মানির TrxID লিখুন অথবা ক্যাশ অন ডেলিভারি বেছে নিন।';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const newReceipt: OrderReceipt = {
      orderId: `KU-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toLocaleString('en-BD', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
      customerName: name.trim(),
      phone: cleanPhone,
      district,
      address: `${address.trim()}, ${district}`,
      zone,
      paymentMethod,
      trxId: trxId.trim() || undefined,
      items: [
        {
          productId: selectedProduct.id,
          variantId: activeVariant.id,
          name: selectedProduct.name,
          variantLabel: activeVariant.label,
          price: activeVariant.price,
          image: selectedProduct.image,
          quantity,
        },
      ],
      subtotal,
      shippingFee,
      total,
      status: 'Confirmed · Preparing Shipment',
    };

    onOrderConfirmed(newReceipt);
    setName('');
    setPhone('');
    setAddress('');
    setTrxId('');
    setErrors({});
  };

  return (
    <section id="single-product-system" className="max-w-[var(--theme-container-max,1240px)] mx-auto px-3 sm:px-6">
      <div className="theme-surface-card border overflow-hidden">
        {/* Top Switcher Bar */}
        <div className="px-4 sm:px-6 py-3.5 bg-[var(--store-subtle-bg)] border-b border-[var(--store-card-border)] flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <p className="text-[11px] font-semibold text-[var(--store-text-muted)]">
              Direct Harvest Checkout · {BRAND_INFO.hubAddress}
            </p>
            <h2 className="text-sm sm:text-base font-bold text-[var(--store-text-primary)]">
              সিঙ্গেল প্রোডাক্ট ডিরেক্ট অর্ডার (One-Step Order)
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {PRODUCTS.slice(0, 6).map((p) => {
              const active = p.id === selectedProduct.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onSelectProduct(p)}
                  className={`px-3 py-1.5 theme-btn-shape text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                    active
                      ? 'brand-bg text-white border-transparent'
                      : 'bg-[var(--store-card-bg)] border-[var(--store-card-border)] text-[var(--store-text-primary)] hover:brand-border hover:brand-text'
                  }`}
                >
                  {p.categoryLabel}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3-Column Editorial PDP Layout: Gallery (4) + Configurator & Direct Form (5) + Delivery/Warranty Sidebar (3) */}
        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Column 1: Photo Gallery (4 cols) */}
          <div className="lg:col-span-4 p-4 sm:p-5 border-b lg:border-b-0 lg:border-r border-[var(--store-card-border)] space-y-3">
            <div className="relative aspect-square w-full rounded-[var(--theme-card-radius,10px)] overflow-hidden bg-[var(--store-subtle-bg)] border border-[var(--store-card-border)]">
              {selectedProduct.discountPercent && (
                <span className="absolute top-2.5 left-2.5 z-10 brand-bg text-white text-xs font-bold px-2.5 py-0.5 theme-btn-shape">
                  -{selectedProduct.discountPercent}% OFF
                </span>
              )}
              <ResilientImage
                src={activeImage}
                alt={selectedProduct.name}
                fallbackTitle={selectedProduct.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="grid grid-cols-4 gap-2">
              {selectedProduct.gallery.map((imgSrc, idx) => {
                const isCurrent = activeImage === imgSrc;
                return (
                  <button
                    key={`${imgSrc}-${idx}`}
                    type="button"
                    onClick={() => setActiveImage(imgSrc)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                      isCurrent ? 'brand-border' : 'border-[var(--store-card-border)] hover:opacity-85'
                    }`}
                  >
                    <ResilientImage
                      src={imgSrc}
                      alt={`${selectedProduct.name} ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                );
              })}
            </div>

            <ul className="pt-2.5 space-y-1.5 border-t border-[var(--store-card-border)]">
              {selectedProduct.features.map((feat) => (
                <li key={feat} className="flex items-start gap-1.5 text-xs text-[var(--store-text-primary)] opacity-90">
                  <Check className="w-3.5 h-3.5 text-[#047857] shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: Product Configurator & Direct Order Inputs (5 cols) */}
          <div className="lg:col-span-5 p-4 sm:p-5 space-y-4">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-[var(--store-text-primary)] leading-snug">
                {selectedProduct.name}
              </h3>

              <div className="mt-2 flex flex-wrap items-center gap-2.5 text-xs text-[var(--store-text-muted)]">
                <span className="inline-flex items-center gap-1 text-[#FACA51]">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span className="text-[var(--store-text-primary)] ml-1 font-semibold">4.9 · 342 Ratings</span>
                </span>
                <span>·</span>
                <span>
                  Brand: <strong className="brand-text font-semibold">{selectedProduct.brand}</strong>
                </span>
              </div>
            </div>

            <div className="py-3 border-y border-[var(--store-card-border)] flex items-baseline gap-3">
              <span className="font-mono tabular-nums text-2xl sm:text-3xl font-bold brand-text">
                ৳{activeVariant.price.toLocaleString('en-US')}
              </span>
              {activeVariant.originalPrice && (
                <>
                  <del className="font-mono tabular-nums text-sm text-[var(--store-text-muted)]">
                    ৳{activeVariant.originalPrice.toLocaleString('en-US')}
                  </del>
                  {selectedProduct.discountPercent && (
                    <span className="text-xs font-semibold text-[#047857]">
                      Save {selectedProduct.discountPercent}%
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Weight Selector & Qty */}
            <div className="space-y-3">
              <div>
                <span className="block text-xs font-semibold text-[var(--store-text-muted)] mb-1.5">
                  প্যাক সাইজ (Weight / Pack)
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedProduct.variants.map((variant) => {
                    const active = variant.id === activeVariant.id;
                    return (
                      <button
                        key={variant.id}
                        type="button"
                        onClick={() => setSelectedVariantId(variant.id)}
                        className={`px-3 py-1.5 theme-btn-shape border text-xs font-medium transition-colors cursor-pointer ${
                          active
                            ? 'brand-border brand-tint-bg brand-text font-bold'
                            : 'border-[var(--store-card-border)] bg-[var(--store-card-bg)] text-[var(--store-text-primary)] hover:brand-border'
                        }`}
                      >
                        {variant.label} · ৳{variant.price}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-xs font-semibold text-[var(--store-text-muted)]">Quantity</span>
                <div className="inline-flex items-center border border-[var(--store-card-border)] theme-btn-shape bg-[var(--store-subtle-bg)] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label="Decrease quantity"
                    className="w-8 h-8 flex items-center justify-center hover:bg-black/5 cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-9 text-center font-mono text-sm font-bold">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                    aria-label="Increase quantity"
                    className="w-8 h-8 flex items-center justify-center hover:bg-black/5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Direct One-Step Checkout Form */}
            <form
              id="direct-pdp-form"
              onSubmit={handleSubmit}
              noValidate
              className="p-3.5 rounded-[var(--theme-card-radius,10px)] bg-[var(--store-subtle-bg)] border border-[var(--store-card-border)] space-y-2.5"
            >
              <p className="text-xs font-bold text-[var(--store-text-primary)]">
                সরাসরি অর্ডার ফর্ম (Direct Cash on Delivery)
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="আপনার নাম *"
                    aria-label="আপনার নাম"
                    className="w-full h-9 px-3 theme-btn-shape border border-[var(--store-card-border)] bg-[var(--store-card-bg)] text-[var(--store-text-primary)] text-xs focus:outline-none focus:brand-border"
                  />
                  {errors.name && <p className="text-[10px] text-red-500 mt-0.5">{errors.name}</p>}
                </div>

                <div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="মোবাইল নম্বর (01XXXXXXXXX) *"
                    aria-label="মোবাইল নম্বর"
                    className="w-full h-9 px-3 theme-btn-shape border border-[var(--store-card-border)] bg-[var(--store-card-bg)] text-[var(--store-text-primary)] text-xs font-mono focus:outline-none focus:brand-border"
                  />
                  {errors.phone && (
                    <p className="text-[10px] text-red-500 mt-0.5">{errors.phone}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  aria-label="জেলা"
                  className="w-full h-9 px-2.5 theme-btn-shape border border-[var(--store-card-border)] bg-[var(--store-card-bg)] text-[var(--store-text-primary)] text-xs focus:outline-none focus:brand-border"
                >
                  {DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d} ({d === 'ঢাকা' || d === 'চুয়াডাঙ্গা' ? '৳50' : '৳120'})
                    </option>
                  ))}
                </select>

                <div className="grid grid-cols-2 gap-1.5 h-9">
                  {(['Cash on Delivery', 'bKash / Nagad'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`theme-btn-shape border text-[11px] font-semibold cursor-pointer ${
                        paymentMethod === m
                          ? 'brand-border brand-tint-bg brand-text'
                          : 'border-[var(--store-card-border)] bg-[var(--store-card-bg)] text-[var(--store-text-primary)]'
                      }`}
                    >
                      {m === 'Cash on Delivery' ? 'COD' : 'bKash/Nagad'}
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod === 'bKash / Nagad' && (
                <div className="space-y-1">
                  <input
                    type="text"
                    value={trxId}
                    onChange={(e) => setTrxId(e.target.value)}
                    placeholder={`Send ৳${total} to ${BRAND_INFO.phone} & enter TrxID`}
                    className="w-full h-9 px-3 theme-btn-shape border brand-border bg-[var(--store-card-bg)] text-[var(--store-text-primary)] text-xs font-mono"
                  />
                  {errors.trxId && <p className="text-[10px] text-red-500">{errors.trxId}</p>}
                </div>
              )}

              <div>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="সম্পূর্ণ ঠিকানা (বাসা, রোড, এলাকা / থানা) *"
                  aria-label="সম্পূর্ণ ঠিকানা"
                  className="w-full h-9 px-3 theme-btn-shape border border-[var(--store-card-border)] bg-[var(--store-card-bg)] text-[var(--store-text-primary)] text-xs focus:outline-none focus:brand-border"
                />
                {errors.address && (
                  <p className="text-[10px] text-red-500 mt-0.5">{errors.address}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="submit"
                  className="h-11 theme-btn-shape brand-bg text-white text-xs sm:text-sm font-bold transition-colors cursor-pointer"
                >
                  Buy Now · ৳{total.toLocaleString('en-US')}
                </button>
                <button
                  type="button"
                  onClick={() => onAddToCart(selectedProduct, activeVariant.id, quantity)}
                  className="h-11 theme-btn-shape border border-[var(--store-card-border)] bg-[var(--store-card-bg)] hover:brand-border text-[var(--store-text-primary)] text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ShoppingCart className="w-4 h-4 brand-text" />
                  <span>Add to Cart</span>
                </button>
              </div>
            </form>
          </div>

          {/* Column 3: Delivery & Seller Warranty Sidebar (3 cols) */}
          <div className="lg:col-span-3 bg-[var(--store-subtle-bg)] border-t lg:border-t-0 lg:border-l border-[var(--store-card-border)] p-4 sm:p-5 space-y-4 text-xs">
            <div className="space-y-3 pb-4 border-b border-[var(--store-card-border)]">
              <p className="text-[11px] font-bold text-[var(--store-text-muted)]">Delivery Options</p>
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[var(--store-text-muted)] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[var(--store-text-primary)]">{district}, Bangladesh</p>
                  <p className="text-[11px] text-[var(--store-text-muted)]">
                    {zone === 'dhaka' ? '24–48 hours express' : '48–72 hours nationwide'}
                  </p>
                </div>
              </div>

              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <Truck className="w-4 h-4 text-[var(--store-text-muted)] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-[var(--store-text-primary)]">Standard Delivery</p>
                    <p className="text-[11px] text-[var(--store-text-muted)]">Free on orders ৳1,500+</p>
                  </div>
                </div>
                <span className="font-mono font-bold text-[var(--store-text-primary)]">
                  {freeShipping ? 'Free' : `৳${shippingFee}`}
                </span>
              </div>

              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#047857] shrink-0 mt-0.5" />
                <p className="text-[var(--store-text-primary)]">Cash on Delivery Available</p>
              </div>
            </div>

            <div className="space-y-3 pb-4 border-b border-[var(--store-card-border)]">
              <p className="text-[11px] font-bold text-[var(--store-text-muted)]">Return &amp; Warranty</p>
              <div className="flex items-start gap-2.5">
                <RotateCcw className="w-4 h-4 text-[var(--store-text-muted)] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[var(--store-text-primary)]">7 Days Easy Return</p>
                  <p className="text-[11px] text-[var(--store-text-muted)]">Open-box inspection on delivery</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Award className="w-4 h-4 brand-text shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[var(--store-text-primary)]">100% Authentic Harvest</p>
                  <p className="text-[11px] text-[var(--store-text-muted)]">Zero sugar, zero chemical dye</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] text-[var(--store-text-muted)]">Official Mall Hub</p>
              <p className="text-sm font-bold text-[var(--store-text-primary)]">{BRAND_INFO.name}</p>
              <p className="text-[11px] text-[var(--store-text-muted)]">{BRAND_INFO.supportEmail}</p>
              <div className="grid grid-cols-3 gap-2 pt-2 text-center bg-[var(--store-card-bg)] p-2.5 rounded-lg border border-[var(--store-card-border)]">
                <div>
                  <p className="text-[10px] text-[var(--store-text-muted)]">Rating</p>
                  <p className="font-mono text-sm font-bold text-[var(--store-text-primary)] mt-0.5">99%</p>
                </div>
                <div>
                  <p className="text-[10px] text-[var(--store-text-muted)]">On Time</p>
                  <p className="font-mono text-sm font-bold text-[var(--store-text-primary)] mt-0.5">100%</p>
                </div>
                <div>
                  <p className="text-[10px] text-[var(--store-text-muted)]">Support</p>
                  <p className="font-mono text-sm font-bold text-[var(--store-text-primary)] mt-0.5">98%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
