import { useState } from 'react';
import { X, Truck, Heart, BookOpen, ShoppingBag } from 'lucide-react';
import { GalleryPhoto, Product } from '../data/products';
import { OrderReceipt } from '../types';
import { ResilientImage } from './ResilientImage';

interface OrderTrackModalProps {
  isOpen: boolean;
  orders: OrderReceipt[];
  onClose: () => void;
  onViewOrderInfo: (order: OrderReceipt) => void;
}

export function OrderTrackModal({
  isOpen,
  orders,
  onClose,
  onViewOrderInfo,
}: OrderTrackModalProps) {
  const [queryId, setQueryId] = useState('');

  if (!isOpen) return null;

  const matched =
    queryId.trim() === ''
      ? orders
      : orders.filter(
          (o) =>
            o.orderId.toLowerCase().includes(queryId.trim().toLowerCase()) ||
            o.phone.includes(queryId.trim())
        );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Track Your Order"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-xl border border-[#E5E7EB] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 bg-gradient-to-r from-[#081149] via-[#4C2A9B] to-[#663CBC] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-white" />
            <h2 className="text-base font-bold">Track Your Order</h2>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-white/15 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          <input
            type="text"
            value={queryId}
            onChange={(e) => setQueryId(e.target.value)}
            placeholder="Order ID (KU-2026-...) অথবা মোবাইল নম্বর লিখুন"
            className="w-full h-10 px-3.5 rounded-lg border border-[#DDDDEF] text-sm text-[#081149] focus:outline-none focus:border-[#663CBC]"
          />

          {matched.length === 0 ? (
            <p className="text-sm text-[#5E6484] text-center py-6">
              কোনো অর্ডার পাওয়া যায়নি। অর্ডার কনফার্ম করার পর এখানে লাইভ স্ট্যাটাস দেখতে পারবেন।
            </p>
          ) : (
            <div className="space-y-3">
              {matched.map((order) => (
                <div
                  key={order.orderId}
                  className="p-4 rounded-xl border border-[#DDDDEF] bg-[#F4F7FF] space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[#081149]">{order.orderId}</span>
                    <span className="font-semibold text-[#008916]">{order.status}</span>
                  </div>
                  <p className="text-[#3C4266]">
                    {order.customerName} · <span className="font-mono">{order.phone}</span>
                  </p>
                  <p className="text-[#5E6484]">{order.address}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-[#DDDDEF]">
                    <span className="font-mono font-bold text-[#663CBC]">
                      ৳{order.total.toLocaleString('en-US')} ({order.paymentMethod})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onViewOrderInfo(order);
                      }}
                      className="px-3 py-1.5 rounded-lg ot-gradient-btn text-white text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      অর্ডার ইনফরমেশন দেখুন →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface WishlistModalProps {
  isOpen: boolean;
  products: Product[];
  onClose: () => void;
  onRemove: (id: string) => void;
  onOrderNow: (product: Product) => void;
}

export function WishlistModal({
  isOpen,
  products,
  onClose,
  onRemove,
  onOrderNow,
}: WishlistModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Your Wishlist"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-xl border border-[#E5E7EB] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 bg-gradient-to-r from-[#081149] via-[#4C2A9B] to-[#663CBC] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-white" />
            <h2 className="text-base font-bold">Saved Wishlist ({products.length})</h2>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-white/15 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
          {products.length === 0 ? (
            <p className="text-sm text-[#5E6484] text-center py-6">
              উইশলিস্টে কোনো পণ্য নেই। পছন্দের পণ্যের হার্ট আইকনে ক্লিক করুন।
            </p>
          ) : (
            products.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-[#DDDDEF] hover:border-[#663CBC]/50 transition-colors"
              >
                <div className="w-14 h-14 rounded-lg overflow-hidden bg-[#F4F7FF] shrink-0">
                  <ResilientImage
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#081149] truncate">{item.name}</p>
                  <p className="font-mono text-xs font-bold text-[#663CBC]">
                    ৳ {item.price.toLocaleString('en-US')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onOrderNow(item);
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-lg ot-gradient-btn text-white text-xs font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>অর্ডার করুন</span>
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(item.id)}
                  aria-label="Remove from wishlist"
                  className="p-1.5 text-[#5E6484] hover:text-red-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

interface GalleryLightboxModalProps {
  photo: GalleryPhoto | null;
  onClose: () => void;
}

export function GalleryLightboxModal({ photo, onClose }: GalleryLightboxModalProps) {
  if (!photo) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label={photo.title}
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white rounded-xl overflow-hidden shadow-2xl border border-[#E5E7EB]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative aspect-[4/3] bg-[#F4F5F7]">
          <ResilientImage
            src={photo.image}
            alt={photo.title}
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close photo"
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white text-[#212529] shadow flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-2 text-xs text-[#5E6484]">
            <BookOpen className="w-3.5 h-3.5 text-[#663CBC]" />
            <span>{photo.category}</span>
          </div>
          <h3 className="text-lg font-bold text-[#081149] mt-1">{photo.title}</h3>
          <p className="text-sm text-[#495057] mt-1">{photo.subtitle}</p>
        </div>
      </div>
    </div>
  );
}
