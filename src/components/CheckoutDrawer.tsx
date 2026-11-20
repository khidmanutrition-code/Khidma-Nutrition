import { useEffect, useMemo, useState } from 'react';
import {
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  CheckCircle2,
  Truck,
  Copy,
  Check,
  Store,
  Ticket,
} from 'lucide-react';
import { CartItem, DeliveryZone, OrderReceipt, PaymentMethodLabel, VendorStoreRecord } from '../types';
import { BRAND_INFO, DISTRICTS, SHIPPING_RATES } from '../data/products';
import { DEFAULT_VENDORS, splitCartIntoSubOrders } from '../data/vendors';
import { ResilientImage } from './ResilientImage';

interface CheckoutDrawerProps {
  isOpen: boolean;
  items: CartItem[];
  vendors?: VendorStoreRecord[];
  onClose: () => void;
  onUpdateQty: (variantId: string, delta: number) => void;
  onRemoveItem: (variantId: string) => void;
  onConfirmOrder: (receipt: OrderReceipt) => void;
  onOpenFullOrderPage: () => void;
}

export function CheckoutDrawer({
  isOpen,
  items,
  vendors = DEFAULT_VENDORS,
  onClose,
  onUpdateQty,
  onRemoveItem,
  onConfirmOrder,
  onOpenFullOrderPage,
}: CheckoutDrawerProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [district, setDistrict] = useState('ঢাকা');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodLabel>('Cash on Delivery');
  const [trxId, setTrxId] = useState('');
  const [notes, setNotes] = useState('');
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmedReceipt, setConfirmedReceipt] = useState<OrderReceipt | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    setSelectedIds(items.map((i) => i.variantId));
  }, [items]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const activeItems = useMemo(
    () => items.filter((i) => selectedIds.includes(i.variantId)),
    [items, selectedIds]
  );

  const groupedBySeller = useMemo(() => {
    const map = new Map<string, { sellerName: string; items: CartItem[] }>();
    for (const item of items) {
      const sid = item.sellerId || 'khidmatul-mall';
      const vendor = vendors.find((v) => v.id === sid) ?? DEFAULT_VENDORS[0];
      const existing = map.get(sid) ?? {
        sellerName: item.sellerName || vendor.storeName,
        items: [],
      };
      existing.items.push(item);
      map.set(sid, existing);
    }
    return Array.from(map.entries());
  }, [items, vendors]);

  if (!isOpen) return null;

  const subtotal = activeItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const zone: DeliveryZone =
    district === 'ঢাকা' || district === 'চুয়াডাঙ্গা' ? 'dhaka' : 'outside';
  const freeShippingThreshold = 1500;
  const freeShipping = subtotal >= freeShippingThreshold;
  const progressPct = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));
  const shippingFee = activeItems.length === 0 ? 0 : freeShipping ? 0 : SHIPPING_RATES[zone].fee;
  const total = Math.max(0, subtotal + shippingFee - appliedDiscount);

  const handleApplyQuickVoucher = () => {
    const c = voucherCode.trim().toUpperCase();
    if (c === 'WINTER50' || c === 'LUCKY50') {
      setAppliedDiscount(50);
    } else if (c === 'GUR100') {
      setAppliedDiscount(100);
    } else if (c === 'SPIN30') {
      setAppliedDiscount(30);
    } else {
      setAppliedDiscount(0);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (activeItems.length === 0) {
      nextErrors.items = 'অর্ডার করতে অন্তত একটি পণ্য সিলেক্ট করুন।';
    }
    if (name.trim().length < 2) {
      nextErrors.name = 'আপনার নাম লিখুন।';
    }
    const cleanPhone = phone.replace(/[\s-]/g, '');
    if (!/^(\+?88)?01[3-9]\d{8}$/.test(cleanPhone)) {
      nextErrors.phone = 'সঠিক ১১ সংখ্যার মোবাইল নম্বর দিন (e.g. 01770241803)।';
    }
    if (address.trim().length < 6) {
      nextErrors.address = 'সম্পূর্ণ ঠিকানা লিখুন (বাসা, রোড, এলাকা)।';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const orderId = `KU-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const subOrders = splitCartIntoSubOrders(
      orderId,
      activeItems,
      {
        customerName: name.trim(),
        phone: cleanPhone,
        address: `${address.trim()}, ${district}`,
        district,
        shippingFee,
        status: 'Pending',
      },
      vendors
    );

    const receipt: OrderReceipt = {
      orderId,
      createdAt: new Date().toLocaleString('en-BD', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
      customerName: name.trim(),
      phone: cleanPhone,
      district,
      address: `${address.trim()}, ${district}`,
      zone,
      notes: notes.trim() || undefined,
      paymentMethod,
      trxId: trxId.trim() || undefined,
      voucherCode: appliedDiscount > 0 ? voucherCode.trim().toUpperCase() : undefined,
      discountAmount: appliedDiscount,
      items: [...activeItems],
      subOrders,
      subtotal,
      shippingFee,
      total,
      status: 'Confirmed · Preparing Shipment',
    };

    // Non-blocking server sub-order split + socket order alert
    void fetch('/api/orders/split-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId,
        customerName: receipt.customerName,
        phone: receipt.phone,
        address: receipt.address,
        district,
        shippingFee,
        items: activeItems,
      }),
    }).catch(() => undefined);

    setConfirmedReceipt(receipt);
    onConfirmOrder(receipt);
    setName('');
    setPhone('');
    setAddress('');
    setTrxId('');
    setNotes('');
  };

  const handleCopy = (id: string) => {
    navigator.clipboard?.writeText(id).catch(() => undefined);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 1800);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/55 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Multi-Vendor Cart and Checkout"
      onClick={() => {
        setConfirmedReceipt(null);
        onClose();
      }}
    >
      <div
        className="w-full max-w-lg site-canvas h-full flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 bg-gradient-to-r from-[#081149] via-[#4C2A9B] to-[#663CBC] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-white" />
            <h2 className="text-base font-bold">
              {confirmedReceipt
                ? 'অর্ডার সম্পন্ন হয়েছে (Order Confirmed)'
                : `মাল্টি-ভেন্ডর কার্ট (${activeItems.length} সিলেক্টেড)`}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              setConfirmedReceipt(null);
              onClose();
            }}
            aria-label="Close Checkout"
            className="p-1.5 rounded text-white/80 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {confirmedReceipt ? (
            <div className="bg-white rounded-xl border border-[#DDDDEF] p-5 space-y-4">
              <div className="flex items-start gap-3 pb-4 border-b border-[#E7EDFF]">
                <CheckCircle2 className="w-8 h-8 text-[#008916] shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-[#008916]">
                    {confirmedReceipt.status}
                  </p>
                  <h3 className="text-lg font-bold text-[#081149] mt-0.5">
                    ধন্যবাদ, {confirmedReceipt.customerName}
                  </h3>
                  <button
                    type="button"
                    onClick={() => handleCopy(confirmedReceipt.orderId)}
                    className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F5F3FF] border border-[#663CBC]/35 text-xs font-mono font-bold text-[#663CBC] cursor-pointer"
                  >
                    <span>Order #{confirmedReceipt.orderId}</span>
                    {copiedId ? <Check className="w-3.5 h-3.5 text-[#008916]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {confirmedReceipt.subOrders && confirmedReceipt.subOrders.length > 0 && (
                <div className="p-3 rounded-xl bg-[#F4F7FF] border border-[#663CBC]/25 space-y-1.5 text-xs">
                  <p className="font-extrabold text-[#081149]">
                    Store Sub-Order Breakdown ({confirmedReceipt.subOrders.length} Shipments):
                  </p>
                  {confirmedReceipt.subOrders.map((so) => (
                    <div key={so.subOrderId} className="flex justify-between">
                      <span className="text-[#5E6484]">
                        #{so.subOrderId} · {so.sellerName}
                      </span>
                      <span className="font-mono font-bold text-[#663CBC] tabular-nums">৳{so.subtotal}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between text-base font-bold text-[#081149]">
                <span>সর্বমোট বিল (Total Payable)</span>
                <span className="font-mono text-[#663CBC] tabular-nums">
                  ৳{confirmedReceipt.total.toLocaleString('en-US')}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setConfirmedReceipt(null);
                  onClose();
                }}
                className="w-full py-2.5 rounded-xl ot-gradient-btn text-white text-sm font-semibold cursor-pointer"
              >
                Continue Shopping
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#DDDDEF] p-8 text-center">
              <ShoppingBag className="w-10 h-10 text-[#7880A0] mx-auto mb-3" />
              <p className="text-base font-bold text-[#081149]">আপনার কার্ট খালি</p>
              <p className="text-xs text-[#5E6484] mt-1">
                যেকোনো পণ্যের নিচে &ldquo;অর্ডার করুন&rdquo; বাটনে ক্লিক করে অর্ডার শুরু করুন।
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-4 px-5 py-2 rounded-xl ot-gradient-btn text-white text-xs font-bold cursor-pointer"
              >
                Browse Products
              </button>
            </div>
          ) : (
            <>
              {/* Free Shipping Progress Bar */}
              <div className="bg-white rounded-xl border border-[#DDDDEF] p-3.5 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-[#081149] flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-[#008916]" />
                    <span>
                      {freeShipping
                        ? 'ফ্রি হোম ডেলিভারি আনলক হয়েছে!'
                        : `ফ্রি ডেলিভারির জন্য আরও ৳${freeShippingThreshold - subtotal} যোগ করুন`}
                    </span>
                  </span>
                  <span className="text-[#008916] font-mono tabular-nums">{progressPct}%</span>
                </div>
                <div className="h-2 rounded-full bg-[#EDF2FF] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#663CBC] to-[#2563EB] transition-all"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              {/* Seller-Grouped Cart Packages */}
              {groupedBySeller.map(([sellerId, group]) => {
                const allChecked = group.items.every((it) => selectedIds.includes(it.variantId));
                return (
                  <div key={sellerId} className="bg-white rounded-xl border border-[#DDDDEF] p-4 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-[#E7EDFF]">
                      <label className="flex items-center gap-2 text-xs font-extrabold text-[#081149] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={allChecked}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            const ids = group.items.map((it) => it.variantId);
                            setSelectedIds((prev) =>
                              checked
                                ? Array.from(new Set([...prev, ...ids]))
                                : prev.filter((id) => !ids.includes(id))
                            );
                          }}
                          className="accent-[#663CBC] w-4 h-4"
                        />
                        <Store className="w-3.5 h-3.5 text-[#663CBC]" />
                        <span>{group.sellerName}</span>
                      </label>
                      <span className="text-[10px] font-bold text-[#5E6484]">
                        {group.items.length} Package Item(s)
                      </span>
                    </div>

                    {group.items.map((item) => {
                      const isChecked = selectedIds.includes(item.variantId);
                      return (
                        <div
                          key={item.variantId}
                          className="flex items-center gap-2.5 pb-3 border-b border-[#F4F7FF] last:border-0 last:pb-0"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setSelectedIds((prev) =>
                                checked
                                  ? Array.from(new Set([...prev, item.variantId]))
                                  : prev.filter((id) => id !== item.variantId)
                              );
                            }}
                            aria-label={`Select ${item.name}`}
                            className="accent-[#663CBC] w-4 h-4 shrink-0"
                          />
                          <div className="w-14 h-14 rounded-lg overflow-hidden bg-[#F4F7FF] shrink-0">
                            <ResilientImage
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-[#081149] truncate">{item.name}</p>
                            <p className="text-[11px] text-[#5E6484] truncate">{item.variantLabel}</p>
                            <div className="flex items-center gap-3 mt-1.5">
                              <div className="inline-flex items-center border border-[#DDDDEF] rounded-lg bg-[#F4F7FF]">
                                <button
                                  type="button"
                                  onClick={() => onUpdateQty(item.variantId, -1)}
                                  aria-label="Decrease"
                                  className="w-6 h-6 flex items-center justify-center hover:bg-[#E7EDFF] cursor-pointer"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-6 text-center text-xs font-mono font-bold tabular-nums">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => onUpdateQty(item.variantId, 1)}
                                  aria-label="Increase"
                                  className="w-6 h-6 flex items-center justify-center hover:bg-[#E7EDFF] cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>

                              <span className="font-mono tabular-nums text-xs font-bold text-[#663CBC]">
                                ৳{(item.price * item.quantity).toLocaleString('en-US')}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => onRemoveItem(item.variantId)}
                            aria-label={`Remove ${item.name}`}
                            className="p-1.5 text-[#8A929A] hover:text-red-600 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                );
              })}

              {errors.items && <p className="text-xs font-bold text-red-600">{errors.items}</p>}

              {/* Voucher Input */}
              <div className="bg-white rounded-xl border border-[#DDDDEF] p-3.5 flex items-center gap-2">
                <Ticket className="w-4 h-4 text-[#663CBC] shrink-0" />
                <input
                  type="text"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value)}
                  placeholder="Voucher (WINTER50 / GUR100 / SPIN30)"
                  className="flex-1 h-8 px-2.5 rounded-lg border border-[#DDDDEF] text-xs font-mono uppercase focus:outline-none focus:border-[#663CBC]"
                />
                <button
                  type="button"
                  onClick={handleApplyQuickVoucher}
                  className="h-8 px-3 rounded-lg bg-[#081149] text-white text-xs font-bold cursor-pointer"
                >
                  Apply
                </button>
              </div>

              {/* Delivery & Payment Form */}
              <form
                onSubmit={handleSubmit}
                noValidate
                className="bg-white rounded-xl border border-[#DDDDEF] p-4 space-y-3"
              >
                <h3 className="text-sm font-bold text-[#081149] pb-2 border-b border-[#E7EDFF]">
                  ডেলিভারি তথ্য ও পেমেন্ট
                </h3>

                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="আপনার সম্পূর্ণ নাম *"
                  className="w-full h-9 px-3 rounded-lg border border-[#DDDDEF] text-xs focus:outline-none focus:border-[#663CBC]"
                />
                {errors.name && <p className="text-[11px] text-red-600">{errors.name}</p>}

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01XXXXXXXXX *"
                    className="h-9 px-3 rounded-lg border border-[#DDDDEF] text-xs font-mono focus:outline-none focus:border-[#663CBC]"
                  />
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="h-9 px-2.5 rounded-lg border border-[#DDDDEF] bg-white text-xs focus:outline-none focus:border-[#663CBC]"
                  >
                    {DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.phone && <p className="text-[11px] text-red-600">{errors.phone}</p>}

                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="সম্পূর্ণ ঠিকানা (বাসা, রোড, এলাকা ও থানা) *"
                  className="w-full px-3 py-2 rounded-lg border border-[#DDDDEF] text-xs focus:outline-none focus:border-[#663CBC] resize-none"
                />
                {errors.address && <p className="text-[11px] text-red-600">{errors.address}</p>}

                <div>
                  <span className="block text-xs font-semibold text-[#081149] mb-1.5">Payment Method</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['Cash on Delivery', 'bKash', 'Nagad', 'Rocket', 'Upay', 'SSLCommerz'] as const).map(
                      (method) => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setPaymentMethod(method)}
                          className={`py-1.5 px-2 rounded-lg border text-[11px] font-bold cursor-pointer transition-colors ${
                            paymentMethod === method
                              ? 'border-[#663CBC] bg-[#F5F3FF] text-[#663CBC]'
                              : 'border-[#DDDDEF] bg-white text-[#3C4266]'
                          }`}
                        >
                          {method === 'Cash on Delivery' ? 'COD' : method}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {paymentMethod !== 'Cash on Delivery' && paymentMethod !== 'SSLCommerz' && (
                  <div className="p-2.5 rounded-lg bg-[#F5F3FF] border border-[#663CBC]/30 space-y-1">
                    <p className="text-[11px] text-[#081149]">
                      Send Money to <strong className="font-mono">{BRAND_INFO.phone}</strong> ({paymentMethod}):
                    </p>
                    <input
                      type="text"
                      value={trxId}
                      onChange={(e) => setTrxId(e.target.value)}
                      placeholder="Transaction ID (TrxID)"
                      className="w-full h-8 px-3 rounded border border-[#DDDDEF] bg-white text-xs font-mono"
                    />
                  </div>
                )}

                <div className="pt-2 border-t border-[#E7EDFF] space-y-1 text-xs">
                  <div className="flex justify-between text-[#5E6484]">
                    <span>Subtotal ({activeItems.length} items)</span>
                    <span className="font-mono tabular-nums">৳{subtotal.toLocaleString('en-US')}</span>
                  </div>
                  <div className="flex justify-between text-[#5E6484]">
                    <span>Delivery ({district})</span>
                    <span className="font-mono tabular-nums">{freeShipping ? 'Free (৳0)' : `৳${shippingFee}`}</span>
                  </div>
                  {appliedDiscount > 0 && (
                    <div className="flex justify-between text-[#008916] font-bold">
                      <span>Voucher Discount</span>
                      <span className="font-mono tabular-nums">-৳{appliedDiscount}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold text-[#081149] pt-1">
                    <span>Total Payable</span>
                    <span className="font-mono text-[#663CBC] tabular-nums">৳{total.toLocaleString('en-US')}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl ot-gradient-btn text-white text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Truck className="w-4 h-4" />
                  <span>অর্ডার কনফার্ম করুন (৳{total.toLocaleString('en-US')})</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenFullOrderPage();
                  }}
                  className="w-full py-2 rounded-xl border border-[#2563EB] text-[#2563EB] hover:bg-[#2563EB] hover:text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  ফুল স্ক্রিন মাল্টি-স্টেপ চেকআউট →
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
