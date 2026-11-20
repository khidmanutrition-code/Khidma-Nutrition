import { useEffect, useState } from 'react';
import {
  Bell,
  Headphones,
  MessageCircle,
  Phone,
  PackageSearch,
  ShoppingBag,
  X,
  Sparkles,
  Copy,
  Check,
  Tag,
  Truck,
  Zap,
} from 'lucide-react';
import { BRAND_INFO, ORGANIC_IMAGES } from '../data/products';
import type { OrderReceipt } from '../types';
import { ResilientImage } from './ResilientImage';

export interface StoreNotificationItem {
  id: string;
  title: string;
  message: string;
  timeLabel: string;
  type: 'notice' | 'promo' | 'order' | 'delivery';
  couponCode?: string;
}

interface NotificationCenterModalProps {
  isOpen: boolean;
  noticeText: string;
  popupTitle?: string;
  orders: OrderReceipt[];
  freeShippingMin: number;
  unreadIds: string[];
  onMarkAllRead: () => void;
  onClose: () => void;
  onOpenFlashSale: () => void;
  onOpenTrackOrder: () => void;
}

export function NotificationCenterModal({
  isOpen,
  noticeText,
  popupTitle,
  orders,
  freeShippingMin,
  unreadIds,
  onMarkAllRead,
  onClose,
  onOpenFlashSale,
  onOpenTrackOrder,
}: NotificationCenterModalProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const latestOrder = orders[0];
  const notifications: StoreNotificationItem[] = [
    {
      id: 'notif-live-notice',
      title: popupTitle || 'গুরুত্বপূর্ণ স্টোর নোটিশ ও অফার',
      message:
        noticeText ||
        'চুয়াডাঙ্গার খাঁটি পাটালি গুড়, সুন্দরবনের মধু ও শতভাগ অর্গানিক পণ্য সারাদেশে ক্যাশ অন ডেলিভারিতে অর্ডার করুন।',
      timeLabel: 'এখনই',
      type: 'notice',
    },
    {
      id: 'notif-promo-code',
      title: 'স্পেশাল ডিসকাউন্ট ভাউচার — GUR100',
      message: 'চেকআউটে GUR100 কোড ব্যবহার করলে ৳১০০ তাৎক্ষণিক ডিসকাউন্ট পাবেন।',
      timeLabel: 'আজকের অফার',
      type: 'promo',
      couponCode: 'GUR100',
    },
    {
      id: 'notif-free-shipping',
      title: `৳${freeShippingMin.toLocaleString('en-US')}+ অর্ডারে ফ্রি ডেলিভারি`,
      message: 'ঢাকা সিটিতে ২৪–৪৮ ঘণ্টায় এবং সারাদেশে ৬৪ জেলায় কুরিয়ার হোম ডেলিভারি চালু রয়েছে।',
      timeLabel: '২৪/৭ সার্ভিস',
      type: 'delivery',
    },
    ...(latestOrder
      ? [
          {
            id: `notif-order-${latestOrder.orderId}`,
            title: `অর্ডার #${latestOrder.orderId} (${latestOrder.status ?? 'Pending'})`,
            message: `মোট ৳${latestOrder.total.toLocaleString('en-US')} · ${latestOrder.customerName} — অর্ডার ট্র্যাকিং দেখতে ক্লিক করুন।`,
            timeLabel: latestOrder.createdAt || 'সাম্প্রতিক',
            type: 'order' as const,
          },
        ]
      : []),
  ];

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // ignore clipboard errors
    }
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1600);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="নোটিফিকেশন প্যানেল"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] flex items-start justify-center sm:justify-end p-3 sm:p-5 pt-16 sm:pt-20"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[400px] bg-white rounded-2xl shadow-2xl border border-[#DDDDEF] overflow-hidden ot-dropdown-enter"
      >
        {/* Top OfferTopUp Style Header */}
        <div className="px-4 py-3.5 bg-white border-b border-[#F1F3F5] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-[#081149] text-white flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-extrabold text-[#081149] leading-tight">
                Notifications
              </h3>
              <p className="text-[11px] text-[#5E6484]">
                {unreadIds.length > 0 ? `${unreadIds.length}টি নতুন নোটিশ` : 'সব আপডেট পড়া হয়েছে'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadIds.length > 0 && (
              <button
                type="button"
                onClick={onMarkAllRead}
                className="text-[11px] font-bold text-[#2563EB] hover:underline cursor-pointer"
              >
                Mark read
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close notifications"
              className="w-8 h-8 rounded-full hover:bg-[#F3F4F6] text-[#4B5563] flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notifications Feed */}
        <div className="p-3 space-y-2.5 max-h-[62vh] overflow-y-auto bg-[#F4F7FF]">
          {notifications.map((item) => {
            const isUnread = unreadIds.includes(item.id);
            return (
              <div
                key={item.id}
                className={`rounded-xl border p-3 bg-white transition-colors ${
                  isUnread ? 'border-[#663CBC]/35 shadow-xs' : 'border-[#DDDDEF]'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      item.type === 'promo'
                        ? 'bg-[#F5F3FF] text-[#663CBC]'
                        : item.type === 'delivery'
                          ? 'bg-[#ECFDF5] text-[#047857]'
                          : item.type === 'order'
                            ? 'bg-[#EFF6FF] text-[#2563EB]'
                            : 'bg-[#F5F3FF] text-[#663CBC]'
                    }`}
                  >
                    {item.type === 'promo' ? (
                      <Tag className="w-4 h-4" />
                    ) : item.type === 'delivery' ? (
                      <Truck className="w-4 h-4" />
                    ) : item.type === 'order' ? (
                      <PackageSearch className="w-4 h-4" />
                    ) : (
                      <Zap className="w-4 h-4" />
                    )}
                  </span>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-extrabold text-[#111827] leading-snug">
                        {item.title}
                      </p>
                      <span className="text-[10px] text-[#6B7280] shrink-0">{item.timeLabel}</span>
                    </div>
                    <p className="text-[11px] text-[#4B5563] leading-relaxed">{item.message}</p>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {item.couponCode && (
                        <button
                          type="button"
                          onClick={() => handleCopy(item.couponCode!)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#111827] text-white text-[10px] font-bold cursor-pointer hover:bg-[#374151]"
                        >
                          {copiedCode === item.couponCode ? (
                            <>
                              <Check className="w-3 h-3 text-[#34D399]" />
                              <span>কপি হয়েছে</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>কোড কপি: {item.couponCode}</span>
                            </>
                          )}
                        </button>
                      )}
                      {item.type === 'order' ? (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenTrackOrder();
                          }}
                          className="text-[11px] font-bold text-[#1D4ED8] hover:underline cursor-pointer"
                        >
                          অর্ডার ট্র্যাক করুন →
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenFlashSale();
                          }}
                          className="text-[11px] font-bold brand-text hover:underline cursor-pointer"
                        >
                          অফার দেখুন →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Clean Footer with Tech Team credit */}
        <div className="px-4 py-2.5 bg-white border-t border-[#F1F3F5] flex items-center justify-between text-[11px] text-[#6B7280]">
          <span>{BRAND_INFO.name}</span>
          <span className="font-semibold text-[#111827]">Developed by Tech Team</span>
        </div>
      </div>
    </div>
  );
}

interface OfferTopUpPopupModalProps {
  isOpen: boolean;
  popupTitle?: string;
  popupBody?: string;
  onClose: (dontShowToday?: boolean) => void;
  onActionClick: () => void;
}

export function OfferTopUpPopupModal({
  isOpen,
  popupTitle,
  popupBody,
  onClose,
  onActionClick,
}: OfferTopUpPopupModalProps) {
  const [dontShowToday, setDontShowToday] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose(dontShowToday);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, dontShowToday, onClose]);

  if (!isOpen) return null;

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // ignore clipboard restrictions
    }
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1800);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="স্বাগতম অফার পপআপ"
      onClick={() => onClose(dontShowToday)}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[430px] bg-white rounded-2xl overflow-hidden shadow-2xl border border-[#DDDDEF] ot-dropdown-enter"
      >
        {/* Top Promotional Graphic Banner */}
        <div className="relative bg-gradient-to-br from-[#081149] via-[#663CBC] to-[#7F48CD] text-white overflow-hidden">
          <div className="relative aspect-[16/10] w-full overflow-hidden">
            <ResilientImage
              src={ORGANIC_IMAGES.sliderGurWinter}
              alt="খিদমাতুল উম্মাহ শপ বিডি স্পেশাল অফার"
              className="w-full h-full object-cover opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#081149]/90 via-[#081149]/35 to-transparent" />

            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-[#4C1D95]/90 border border-white/20 text-[10px] font-extrabold tracking-wider uppercase flex items-center gap-1 shadow">
              <Sparkles className="w-3 h-3 text-[#FDE047]" />
              <span>KHIDMATUL UMMAH</span>
            </div>

            <div className="absolute bottom-3 left-4 right-4">
              <span className="inline-block px-2 py-0.5 rounded bg-[#008916] text-white text-[10px] font-extrabold mb-1.5">
                WINTER HARVEST · UP TO 35% OFF
              </span>
              <h3 className="text-lg sm:text-xl font-black leading-snug text-white drop-shadow">
                {popupTitle || 'চুয়াডাঙ্গার খাঁটি খেজুরের গুড় ও শতভাগ অর্গানিক পণ্য'}
              </h3>
            </div>
          </div>
        </div>

        {/* White Bottom Area matching OfferTopUp Popup */}
        <div className="p-5 sm:p-6 bg-white space-y-4">
          <p className="text-[15px] sm:text-base font-semibold text-[#1F2937] leading-relaxed">
            {popupBody ||
              `${BRAND_INFO.name} থেকে সরাসরি খাঁটি খেজুরের গুড়, সুন্দরবনের মধু ও গাওয়া ঘি অর্ডার করতে নিচের বাটনে ক্লিক করুন।`}
          </p>

          {/* Interactive Promo Code Chips */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleCopy('GUR100')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#EFF6FF] border border-dashed border-[#2563EB] text-xs font-bold text-[#1D4ED8] cursor-pointer hover:bg-[#DBEAFE] transition-colors"
            >
              <span>কোড: GUR100 (৳১০০ ছাড়)</span>
              {copiedCode === 'GUR100' ? (
                <Check className="w-3.5 h-3.5 text-[#008916]" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>

            <button
              type="button"
              onClick={() => handleCopy('WINTER50')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#F5F3FF] border border-dashed border-[#7C3AED] text-xs font-bold text-[#5B21B6] cursor-pointer hover:bg-[#EDE9FE] transition-colors"
            >
              <span>WINTER50 (৳৫০ ছাড়)</span>
              {copiedCode === 'WINTER50' ? (
                <Check className="w-3.5 h-3.5 text-[#008916]" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={onActionClick}
              className="px-6 py-2.5 rounded-md bg-[#3B82F6] hover:bg-[#2563EB] text-white text-sm font-bold shadow-sm transition-colors cursor-pointer"
            >
              ক্লিক করুন
            </button>

            <label className="inline-flex items-center gap-1.5 text-xs text-[#6B7280] font-medium cursor-pointer select-none">
              <input
                type="checkbox"
                checked={dontShowToday}
                onChange={(e) => setDontShowToday(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-[#D1D5DB] accent-[#6C3CE9] cursor-pointer"
              />
              <span>আজ আর দেখাবেন না</span>
            </label>
          </div>

          <p className="text-[10px] text-center text-[#6B7280] pt-1 border-t border-[#F3F4F6]">
            Developed by <span className="font-bold text-[#111827]">Tech Team</span>
          </p>
        </div>
      </div>

      {/* Bottom Centered Purple Pill Close Button */}
      <button
        type="button"
        onClick={() => onClose(dontShowToday)}
        className="mt-4 px-8 py-2.5 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#6C3CE9] hover:from-[#6D28D9] hover:to-[#5B21B6] text-white text-sm font-extrabold tracking-wide shadow-xl inline-flex items-center gap-2 cursor-pointer transition-transform active:scale-95"
      >
        <X className="w-4 h-4 stroke-[3]" />
        <span>CLOSE</span>
      </button>
    </div>
  );
}

interface FloatingSupportWidgetProps {
  onOpenTrackOrder: () => void;
  onOpenOrderPage: () => void;
}

export function FloatingSupportWidget({
  onOpenTrackOrder,
  onOpenOrderPage,
}: FloatingSupportWidgetProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-16 lg:bottom-6 right-4 z-40 flex flex-col items-end gap-2.5">
      {open && (
        <div className="w-72 bg-white rounded-2xl border border-[#DDDDEF] shadow-2xl overflow-hidden ot-dropdown-enter">
          <div className="px-4 py-3 ot-gradient-btn flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Headphones className="w-4 h-4" />
              <div>
                <p className="text-xs font-extrabold leading-tight">কাস্টমার সাপোর্ট</p>
                <p className="text-[10px] text-white/85">সকাল ৯টা – রাত ১১টা</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close support menu"
              className="p-1 rounded-full hover:bg-white/15 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3 space-y-2 text-xs">
            <a
              href={BRAND_INFO.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl ot-emerald-btn font-bold shadow-xs hover:brightness-105 transition-all"
            >
              <MessageCircle className="w-4 h-4 shrink-0" />
              <span>WhatsApp লাইভ চ্যাট</span>
            </a>

            <a
              href={`tel:${BRAND_INFO.rawPhone}`}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl ot-blue-btn font-bold hover:brightness-105 transition-all"
            >
              <Phone className="w-4 h-4 shrink-0" />
              <span>কল করুন: {BRAND_INFO.phone}</span>
            </a>

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onOpenTrackOrder();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-white font-bold shadow-xs hover:brightness-105 transition-all cursor-pointer text-left"
              style={{ backgroundImage: 'linear-gradient(90deg, #FE6E18, #E41659)' }}
            >
              <PackageSearch className="w-4 h-4 shrink-0" />
              <span>অর্ডার ট্র্যাক করুন</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onOpenOrderPage();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-[#F4F7FF] hover:bg-[#E7EEFF] border border-[#DDDDEF] text-[#081149] font-bold transition-colors cursor-pointer text-left"
            >
              <ShoppingBag className="w-4 h-4 text-[#663CBC] shrink-0" />
              <span>সরাসরি অর্ডার পেজ</span>
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2.5">
        {!open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="hidden sm:flex px-3.5 py-2 rounded-full bg-white border border-[#DDDDEF] shadow-lg text-xs font-bold text-[#081149] items-center gap-1.5 hover:border-[#663CBC] transition-colors cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5 text-[#663CBC] fill-[#663CBC]/15" />
            <span>সাহায্য লাগবে ?</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-label="সাহায্য লাগবে? সাপোর্ট খুলুন"
          className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full ot-gradient-btn border-[3px] border-white flex items-center justify-center cursor-pointer active:scale-95"
        >
          <span
            aria-hidden="true"
            className="absolute -inset-2 rounded-full bg-[#663CBC]/30 ot-support-ring-1 pointer-events-none"
          />
          <span
            aria-hidden="true"
            className="absolute -inset-3 rounded-full bg-[#7F48CD]/20 ot-support-ring-2 pointer-events-none"
          />
          <Headphones className="w-6 h-6 relative z-10" />
        </button>
      </div>
    </div>
  );
}
