import { useEffect, useState } from 'react';
import { X, Plus, Minus, ShoppingBag, ShieldCheck, Check, PlayCircle } from 'lucide-react';
import { Product } from '../data/products';
import { ResilientImage } from './ResilientImage';
import { isPlayableDirectVideoUrl } from './MediaUploaderControl';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, variantId: string, qty: number, openCheckout: boolean) => void;
}

export function ProductModal({ product, onClose, onAddToCart }: ProductModalProps) {
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [activeImage, setActiveImage] = useState('');
  const [showVideo, setShowVideo] = useState(false);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (product) {
      setSelectedVariantId(product.variants[0]?.id ?? '');
      setActiveImage(product.image);
      setShowVideo(false);
      setQty(1);
    }
  }, [product]);

  useEffect(() => {
    if (!product) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [product, onClose]);

  if (!product) return null;

  const variant = product.variants.find((v) => v.id === selectedVariantId) ?? product.variants[0];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label={product.name}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-white rounded-2xl overflow-hidden shadow-2xl border border-[#DDDDEF] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close product modal"
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-[#F4F7FF] text-[#081149] hover:bg-[#E7EDFF] flex items-center justify-center cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="bg-[#F4F7FF] p-5 space-y-3">
            {showVideo && product.videoUrl ? (
              <div className="rounded-xl overflow-hidden bg-black border border-[#DDDDEF]">
                <div className="px-3 py-2 bg-[#081149] text-white flex items-center justify-between text-[11px] font-bold">
                  <span className="flex items-center gap-1 text-[#C4B5FD]">
                    <PlayCircle className="w-4 h-4" /> প্রোডাক্ট ভিডিও
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowVideo(false)}
                    className="px-2 py-0.5 rounded bg-white/15 hover:bg-white/25 cursor-pointer"
                  >
                    ← ছবিতে ফিরুন
                  </button>
                </div>
                {isPlayableDirectVideoUrl(product.videoUrl) ? (
                  <div className="w-full aspect-video max-h-72 bg-black flex items-center justify-center">
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
                ) : (
                  <div className="p-6 text-center text-white space-y-2 aspect-video flex flex-col items-center justify-center">
                    <PlayCircle className="w-8 h-8 text-[#A78BFA]" />
                    <a
                      href={product.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg ot-gradient-btn text-white text-xs font-bold"
                    >
                      ভিডিও ওপেন করুন
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-white border border-[#DDDDEF]">
                <ResilientImage
                  src={activeImage || product.image}
                  alt={product.name}
                  fallbackTitle={product.name}
                  className="w-full h-full object-cover"
                />
                {product.videoUrl && (
                  <button
                    type="button"
                    onClick={() => setShowVideo(true)}
                    className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#081149]/85 hover:bg-[#663CBC] text-white text-[11px] font-bold shadow cursor-pointer"
                  >
                    <PlayCircle className="w-4 h-4 text-[#C4B5FD]" />
                    <span>ভিডিও দেখুন</span>
                  </button>
                )}
              </div>
            )}

            <div className="grid grid-cols-4 gap-2">
              {product.gallery.map((img, i) => (
                <button
                  key={`${img}-${i}`}
                  type="button"
                  onClick={() => {
                    setShowVideo(false);
                    setActiveImage(img);
                  }}
                  className={`aspect-square rounded-lg overflow-hidden border-2 cursor-pointer ${
                    !showVideo && activeImage === img ? 'border-[#663CBC]' : 'border-[#DDDDEF]'
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
                  onClick={() => setShowVideo(true)}
                  className={`aspect-square rounded-lg border-2 flex flex-col items-center justify-center text-[10px] font-bold cursor-pointer ${
                    showVideo
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

          <div className="p-6 flex flex-col justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-[#5E6484]">
                {product.categoryLabel} · {product.brand}
              </p>
              <h2 className="text-xl font-bold text-[#081149] mt-1">{product.name}</h2>

              <div className="mt-3 flex items-baseline gap-2.5">
                <span className="font-mono tabular-nums text-2xl font-black text-[#663CBC]">
                  ৳ {variant.price.toLocaleString('en-US')}
                </span>
                {variant.originalPrice && (
                  <del className="font-mono tabular-nums text-sm text-[#7880A0]">
                    ৳ {variant.originalPrice.toLocaleString('en-US')}
                  </del>
                )}
                <span className="ml-auto text-[11px] font-mono text-[#5E6484]">
                  SKU: {product.sku}
                </span>
              </div>

              <p className="text-xs font-medium text-[#008916] mt-1">{product.origin}</p>
              <p className="text-sm text-[#3C4266] mt-2.5 leading-relaxed">{product.description}</p>

              <ul className="mt-3 space-y-1">
                {product.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-1.5 text-xs text-[#081149]">
                    <Check className="w-3.5 h-3.5 text-[#008916] shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-4">
                <p className="text-xs font-bold text-[#081149] mb-2">প্যাক সাইজ / ওজন</p>
                <div className="space-y-2">
                  {product.variants.map((v) => {
                    const active = v.id === variant.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVariantId(v.id)}
                        className={`w-full px-3 py-2 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-colors ${
                          active
                            ? 'border-[#663CBC] bg-[#F5F3FF] text-[#663CBC] font-bold'
                            : 'border-[#DDDDEF] text-[#3C4266] hover:border-[#663CBC]'
                        }`}
                      >
                        <span>{v.label}</span>
                        <span className="font-mono tabular-nums">৳ {v.price.toLocaleString('en-US')}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-2.5 pt-3 border-t border-[#E7EDFF]">
              <div className="flex items-center gap-2.5">
                <div className="inline-flex items-center border border-[#DDDDEF] rounded-xl h-10 bg-[#F4F7FF]">
                  <button
                    type="button"
                    onClick={() => setQty((n) => Math.max(1, n - 1))}
                    aria-label="Decrease"
                    className="w-9 h-full flex items-center justify-center hover:bg-[#E7EDFF] text-[#081149] cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center font-mono text-sm font-bold text-[#081149] tabular-nums">{qty}</span>
                  <button
                    type="button"
                    onClick={() => setQty((n) => Math.min(20, n + 1))}
                    aria-label="Increase"
                    className="w-9 h-full flex items-center justify-center hover:bg-[#E7EDFF] text-[#081149] cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onAddToCart(product, variant.id, qty, false);
                    onClose();
                  }}
                  className="flex-1 h-10 px-4 rounded-xl ot-blue-btn text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>কার্টে যোগ করুন</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  onAddToCart(product, variant.id, qty, true);
                  onClose();
                }}
                className="w-full h-10 rounded-xl ot-gradient-btn text-white text-sm font-bold cursor-pointer tabular-nums"
              >
                অর্ডার করুন · ৳ {(variant.price * qty).toLocaleString('en-US')}
              </button>

              <p className="flex items-center justify-center gap-1.5 text-[11px] text-[#5E6484]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#008916]" />
                <span>Cash on Delivery available · 100% Pure Chuadanga Gur</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
