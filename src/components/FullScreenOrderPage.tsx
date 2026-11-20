import { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronRight,
  Copy,
  CreditCard,
  FileText,
  MapPin,
  MessageCircle,
  Minus,
  Phone,
  Plus,
  Printer,
  ShieldCheck,
  Ticket,
  Trash2,
  Truck,
  Wallet,
} from 'lucide-react';
import {
  ACTIVE_VOUCHERS,
  BRAND_INFO,
  PRODUCTS,
  Product,
  SHIPPING_RATES,
} from '../data/products';
import { BANGLADESH_LOCATIONS, getUpazilasByDistrict } from '../data/bangladeshLocations';
import { DEFAULT_VENDORS, splitCartIntoSubOrders } from '../data/vendors';
import {
  CartItem,
  DeliveryZone,
  OrderReceipt,
  PaymentMethodLabel,
  SavedAddress,
  StoreSettings,
  VoucherRecord,
} from '../types';
import { ResilientImage } from './ResilientImage';

interface FullScreenOrderPageProps {
  items: CartItem[];
  activeReceipt: OrderReceipt | null;
  savedAddresses: SavedAddress[];
  products?: Product[];
  vouchers?: VoucherRecord[];
  storeSettings?: StoreSettings;
  onBackToShop: () => void;
  onOpenAddAddress: () => void;
  onAddProduct: (product: Product, variantId: string, qty: number) => void;
  onUpdateQty: (variantId: string, delta: number) => void;
  onRemoveItem: (variantId: string) => void;
  onConfirmOrder: (receipt: OrderReceipt) => void;
  onClearReceipt: () => void;
}

export function FullScreenOrderPage({
  items,
  activeReceipt,
  savedAddresses,
  products = PRODUCTS,
  vouchers,
  storeSettings,
  onBackToShop,
  onOpenAddAddress,
  onAddProduct,
  onUpdateQty,
  onRemoveItem,
  onConfirmOrder,
  onClearReceipt,
}: FullScreenOrderPageProps) {
  const defaultAddr =
    savedAddresses.find((a) => a.isDefaultShipping) ?? savedAddresses[0] ?? null;

  const [name, setName] = useState(defaultAddr?.fullName ?? '');
  const [phone, setPhone] = useState(defaultAddr?.phone ?? '');
  const [district, setDistrict] = useState(defaultAddr?.city ?? 'ঢাকা');
  const [upazila, setUpazila] = useState(
    defaultAddr?.zone ?? getUpazilasByDistrict(defaultAddr?.city ?? 'ঢাকা')[0]
  );
  const [address, setAddress] = useState(
    defaultAddr ? `${defaultAddr.address}, ${defaultAddr.zone}` : ''
  );
  const [deliveryMode, setDeliveryMode] = useState<'Standard Delivery' | 'Self-Pickup'>(
    'Standard Delivery'
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodLabel>('Cash on Delivery');
  const [trxId, setTrxId] = useState('');
  const [notes, setNotes] = useState('');
  const [voucherInput, setVoucherInput] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<{ code: string; discount: number } | null>(
    null
  );
  const [voucherMsg, setVoucherMsg] = useState<string | null>(null);
  const [showContactEditor, setShowContactEditor] = useState(!defaultAddr);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [printMode, setPrintMode] = useState<'invoice' | 'packing'>('invoice');

  useEffect(() => {
    if (defaultAddr) {
      setName(defaultAddr.fullName);
      setPhone(defaultAddr.phone);
      setDistrict(defaultAddr.city);
      setUpazila(defaultAddr.zone || getUpazilasByDistrict(defaultAddr.city)[0]);
      setAddress(`${defaultAddr.address}, ${defaultAddr.zone}`);
    }
  }, [defaultAddr]);

  const upazilas = useMemo(() => getUpazilasByDistrict(district), [district]);

  useEffect(() => {
    if (!upazilas.includes(upazila)) {
      setUpazila(upazilas[0] ?? 'সদর এলাকা');
    }
  }, [district, upazilas, upazila]);

  const locationMeta = BANGLADESH_LOCATIONS.find((l) => l.district === district);
  const zone: DeliveryZone =
    locationMeta?.zone ?? (district === 'ঢাকা' || district === 'চুয়াডাঙ্গা' ? 'dhaka' : 'outside');

  const dhakaFee = storeSettings?.dhakaDeliveryFee ?? SHIPPING_RATES.dhaka.fee;
  const outsideFee = storeSettings?.outsideDeliveryFee ?? SHIPPING_RATES.outside.fee;
  const freeMin = storeSettings?.freeShippingMin ?? 1500;
  const freeCampaign = Boolean(storeSettings?.freeDeliveryCampaignActive);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
  const freeShipping = freeCampaign || subtotal >= freeMin || deliveryMode === 'Self-Pickup';
  const shippingFee =
    items.length === 0 ? 0 : freeShipping ? 0 : zone === 'dhaka' ? dhakaFee : outsideFee;
  const discountAmount = appliedVoucher && subtotal >= 200 ? appliedVoucher.discount : 0;
  const grandTotal = Math.max(0, subtotal + shippingFee - discountAmount);

  const activeVoucherList = useMemo(() => {
    if (vouchers && vouchers.length > 0) {
      return vouchers.filter((v) => v.active);
    }
    return ACTIVE_VOUCHERS.map((v) => ({ ...v, active: true }));
  }, [vouchers]);

  const handleApplyVoucher = () => {
    const code = voucherInput.trim().toUpperCase();
    const matched = activeVoucherList.find((v) => v.code.toUpperCase() === code);
    if (!matched) {
      setAppliedVoucher(null);
      setVoucherMsg('সঠিক ভাউচার কোড দিন (যেমন: WINTER50 বা GUR100)');
      return;
    }
    if (subtotal < matched.minSpend) {
      setAppliedVoucher(null);
      setVoucherMsg(`এই কোডের জন্য ন্যূনতম ৳${matched.minSpend} অর্ডার করতে হবে`);
      return;
    }
    setAppliedVoucher({ code: matched.code, discount: matched.discount });
    setVoucherMsg(`${matched.code} প্রয়োগ হয়েছে (-৳${matched.discount})`);
  };

  useEffect(() => {
    const cleanPhone = phone.replace(/[\s-]/g, '');
    if (activeReceipt || items.length === 0 || cleanPhone.length < 8) return;
    const timer = setTimeout(() => {
      void fetch('/api/shopify/abandoned-checkouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: `AB-${cleanPhone.slice(-6)}`,
          customerName: name.trim() || 'Shopper',
          phone: cleanPhone,
          district,
          itemsSummary: items.map((it) => `${it.name}×${it.quantity}`).join(', '),
          total: grandTotal,
          abandonedAt: 'Just now',
          recovered: false,
        }),
      }).catch(() => undefined);
    }, 1500);
    return () => clearTimeout(timer);
  }, [phone, name, district, items, grandTotal, activeReceipt]);

  const handleCopyId = (orderId: string) => {
    navigator.clipboard?.writeText(orderId).catch(() => undefined);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};

    if (items.length === 0) {
      nextErrors.items = 'অর্ডার করার জন্য অন্তত একটি পণ্য নির্বাচন করুন।';
    }
    if (name.trim().length < 2) {
      nextErrors.name = 'আপনার সম্পূর্ণ নাম লিখুন।';
      setShowContactEditor(true);
    }
    const cleanPhone = phone.replace(/[\s-]/g, '');
    if (!/^(\+?88)?01[3-9]\d{8}$/.test(cleanPhone)) {
      nextErrors.phone = 'সঠিক ১১ সংখ্যার মোবাইল নম্বর দিন (যেমন: 01770241803)।';
      setShowContactEditor(true);
    }
    if (deliveryMode === 'Standard Delivery' && address.trim().length < 5) {
      nextErrors.address = 'বাসা, রোড, এলাকা ও থানার পূর্ণ ঠিকানা লিখুন।';
      setShowContactEditor(true);
    }
    const isManualMobileWallet =
      paymentMethod === 'bKash' ||
      paymentMethod === 'Nagad' ||
      paymentMethod === 'Rocket' ||
      paymentMethod === 'Upay' ||
      paymentMethod === 'bKash / Nagad';
    if (isManualMobileWallet && trxId.trim().length < 4) {
      nextErrors.trxId = 'Transaction ID (TrxID) দিন অথবা Cash on Delivery বেছে নিন।';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const orderId = `KU-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    setSubmitting(true);
    let finalTrxId = trxId.trim() || undefined;
    let paymentVerified = false;

    try {
      if (isManualMobileWallet && finalTrxId) {
        const provider = paymentMethod.toLowerCase().includes('nagad')
          ? 'nagad'
          : paymentMethod.toLowerCase().includes('rocket')
            ? 'rocket'
            : paymentMethod.toLowerCase().includes('upay')
              ? 'upay'
              : 'bkash';
        const res = await fetch('/api/payments/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider,
            trxId: finalTrxId,
            orderId,
            amount: grandTotal,
          }),
        });
        const data = (await res.json()) as { ok?: boolean; error?: string; verified?: boolean };
        if (!res.ok || !data.ok) {
          setErrors({ trxId: data.error || 'Transaction ID যাচাই করা যায়নি।' });
          setSubmitting(false);
          return;
        }
        paymentVerified = Boolean(data.verified);
      } else if (paymentMethod === 'SSLCommerz') {
        const res = await fetch('/api/payments/sslcommerz/init', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId,
            total: grandTotal,
            customerName: name.trim(),
            phone: cleanPhone,
            district,
            address: address.trim(),
          }),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          trxId?: string;
          verified?: boolean;
          error?: string;
        };
        if (!res.ok || !data.ok) {
          setErrors({ trxId: data.error || 'SSLCommerz সেশন শুরু করা যায়নি।' });
          setSubmitting(false);
          return;
        }
        finalTrxId = data.trxId;
        paymentVerified = Boolean(data.verified);
      }

      // Non-blocking Meta Conversion API Purchase event
      void fetch('/api/marketing/capi-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventName: 'Purchase', value: grandTotal, orderId }),
      }).catch(() => undefined);

      const formattedAddress =
        deliveryMode === 'Self-Pickup'
          ? `Self-Pickup · ${BRAND_INFO.origin}`
          : `${address.trim()}, ${upazila}, ${district}`;

      const subOrders = splitCartIntoSubOrders(
        orderId,
        items,
        {
          customerName: name.trim(),
          phone: cleanPhone,
          address: formattedAddress,
          district,
          shippingFee,
          status: 'Pending',
        },
        DEFAULT_VENDORS
      );

      void fetch('/api/orders/split-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          customerName: name.trim(),
          phone: cleanPhone,
          address: formattedAddress,
          district,
          shippingFee,
          items,
        }),
      }).catch(() => undefined);

      const receipt: OrderReceipt = {
        orderId,
        createdAt: new Date().toLocaleString('en-BD', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }),
        customerName: name.trim(),
        phone: cleanPhone,
        district,
        upazila,
        address: formattedAddress,
        zone,
        deliveryMode,
        notes: notes.trim() || undefined,
        paymentMethod,
        paymentVerified,
        trxId: finalTrxId,
        voucherCode: appliedVoucher?.code,
        discountAmount,
        items: [...items],
        subOrders,
        subtotal,
        shippingFee,
        total: grandTotal,
        status: 'Pending',
      };

      onConfirmOrder(receipt);
      void fetch(`/api/shopify/abandoned-checkouts/AB-${encodeURIComponent(cleanPhone.slice(-6))}`, {
        method: 'DELETE',
      }).catch(() => undefined);
      setTrxId('');
      setNotes('');
      setErrors({});
    } catch {
      setErrors({ trxId: 'নেটওয়ার্ক সমস্যা। আবার চেষ্টা করুন।' });
    } finally {
      setSubmitting(false);
    }
  };

  const merchantNumber =
    paymentMethod === 'Nagad'
      ? storeSettings?.nagadMerchant || BRAND_INFO.phone
      : paymentMethod === 'Rocket'
        ? storeSettings?.rocketMerchant || BRAND_INFO.phone
        : storeSettings?.bkashMerchant || BRAND_INFO.phone;

  return (
    <div className="min-h-screen site-canvas text-[#081149] flex flex-col">
      <header className="sticky top-0 z-40 ot-header-frosted border-b border-[#DDDDEF] print:hidden">
        <div className="max-w-[960px] mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToShop}
              aria-label="Back to store"
              className="p-1.5 rounded-full hover:bg-[#EDF4FF] text-[#081149] cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-base sm:text-lg font-bold text-[#081149]">
              {activeReceipt
                ? printMode === 'packing'
                  ? 'Courier Packing Slip'
                  : 'Order Information & Invoice'
                : 'Multi-Step Checkout'}
            </h1>
          </div>

          <a
            href={`tel:${BRAND_INFO.rawPhone}`}
            className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#663CBC]"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>{BRAND_INFO.phone}</span>
          </a>
        </div>
      </header>

      {activeReceipt ? (
        <main className="flex-1 max-w-[960px] w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="mb-4 flex items-center justify-between gap-2 print:hidden">
            <div className="inline-flex rounded-xl border border-[#DDDDEF] bg-white p-1">
              <button
                type="button"
                onClick={() => setPrintMode('invoice')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                  printMode === 'invoice' ? 'bg-[#663CBC] text-white' : 'text-[#5E6484]'
                }`}
              >
                Customer Invoice
              </button>
              <button
                type="button"
                onClick={() => setPrintMode('packing')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                  printMode === 'packing' ? 'bg-[#081149] text-white' : 'text-[#5E6484]'
                }`}
              >
                Packing Slip (Courier)
              </button>
            </div>
          </div>

          {printMode === 'packing' ? (
            <div className="bg-white rounded-lg border-2 border-[#212121] p-6 space-y-5">
              <div className="flex items-start justify-between border-b-2 border-[#212121] pb-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#757575]">
                    PACKING SLIP &amp; SHIPPING LABEL
                  </p>
                  <h2 className="text-xl font-black text-[#212121] mt-1">{BRAND_INFO.name}</h2>
                  <p className="text-xs text-[#616161]">
                    {BRAND_INFO.origin} · Hotline: {BRAND_INFO.phone}
                  </p>
                </div>
                <div className="text-right font-mono">
                  <p className="text-sm font-black">ORDER #{activeReceipt.orderId}</p>
                  <p className="text-xs text-[#616161]">{activeReceipt.createdAt}</p>
                  {activeReceipt.consignmentId && (
                    <p className="text-xs font-bold text-[#008916] mt-1">
                      {activeReceipt.courierProvider}: {activeReceipt.consignmentId}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded border border-[#D4D8DD] bg-[#FAFAFA]">
                  <p className="font-bold text-[#757575]">SHIP TO (RECIPIENT)</p>
                  <p className="text-sm font-black mt-1">{activeReceipt.customerName}</p>
                  <p className="font-mono font-bold mt-0.5">{activeReceipt.phone}</p>
                  <p className="mt-1">{activeReceipt.address}</p>
                </div>
                <div className="p-3.5 rounded border border-[#DDDDEF] bg-[#F4F7FF]">
                  <p className="font-bold text-[#5E6484]">COD / PAYMENT COLLECTION</p>
                  <p className="text-lg font-mono font-black text-[#663CBC] mt-1">
                    {activeReceipt.paymentMethod === 'Cash on Delivery'
                      ? `COLLECT COD: ৳${activeReceipt.total.toLocaleString('en-US')}`
                      : `PAID (${activeReceipt.paymentMethod})`}
                  </p>
                  <p className="mt-1">Items: {activeReceipt.items.reduce((s, i) => s + i.quantity, 0)} pcs</p>
                </div>
              </div>

              <table className="w-full text-xs border border-[#D4D8DD]">
                <thead className="bg-[#F3F4F6] border-b border-[#D4D8DD]">
                  <tr>
                    <th className="py-2 px-3 text-left">Item</th>
                    <th className="py-2 px-3 text-left">Pack / Variant</th>
                    <th className="py-2 px-3 text-center">Qty</th>
                    <th className="py-2 px-3 text-center">Packed Check</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {activeReceipt.items.map((item) => (
                    <tr key={item.variantId}>
                      <td className="py-2.5 px-3 font-bold">{item.name}</td>
                      <td className="py-2.5 px-3">{item.variantLabel}</td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold">{item.quantity}</td>
                      <td className="py-2.5 px-3 text-center">[ &nbsp; ]</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex flex-wrap items-center gap-3 pt-2 print:hidden">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded bg-[#212121] text-white text-xs font-bold cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>প্যাকিং স্লিপ প্রিন্ট করুন</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClearReceipt();
                    onBackToShop();
                  }}
                  className="ml-auto px-5 py-2.5 rounded-lg ot-gradient-btn text-white text-xs font-bold cursor-pointer"
                >
                  শপে ফিরে যান →
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#DDDDEF] shadow-xs overflow-hidden">
              <div className="bg-gradient-to-r from-[#081149] via-[#4C2A9B] to-[#663CBC] text-white p-5 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-full bg-white text-[#008916] flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white/90">Status: {activeReceipt.status}</p>
                    <h2 className="text-xl sm:text-2xl font-extrabold mt-0.5">
                      ধন্যবাদ, {activeReceipt.customerName}!
                    </h2>
                    <p className="text-xs text-white/90 mt-1">
                      আপনার অর্ডার সফলভাবে নিশ্চিত হয়েছে। নিচে সম্পূর্ণ অর্ডার ইনফরমেশন দেওয়া হলো।
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopyId(activeReceipt.orderId)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white text-[#081149] text-xs font-mono font-bold cursor-pointer self-start shadow-xs"
                >
                  <span>#{activeReceipt.orderId}</span>
                  {copiedId ? (
                    <Check className="w-4 h-4 text-[#008916]" />
                  ) : (
                    <Copy className="w-4 h-4 text-[#663CBC]" />
                  )}
                </button>
              </div>

              <div className="p-5 sm:p-7 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded bg-[#FAFAFA] border border-[#EEEEEE]">
                    <p className="text-xs font-bold text-[#757575]">ক্রেতার তথ্য (Customer)</p>
                    <p className="text-sm font-bold text-[#212121] mt-1">
                      {activeReceipt.customerName}
                    </p>
                    <p className="text-xs font-mono text-[#212121] mt-0.5">{activeReceipt.phone}</p>
                    <p className="text-xs text-[#616161] mt-1">{activeReceipt.address}</p>
                  </div>

                  <div className="p-4 rounded bg-[#FAFAFA] border border-[#EEEEEE]">
                    <p className="text-xs font-bold text-[#757575]">ডেলিভারি ও কুরিয়ার (Delivery)</p>
                    <p className="text-sm font-bold text-[#212121] mt-1">
                      {activeReceipt.courierProvider
                        ? `${activeReceipt.courierProvider} Courier`
                        : activeReceipt.deliveryMode ?? 'Standard Delivery'}
                    </p>
                    {activeReceipt.consignmentId && (
                      <p className="text-xs font-mono text-[#008916] font-bold mt-0.5">
                        Consignment: {activeReceipt.consignmentId}
                      </p>
                    )}
                    {activeReceipt.trackingCode && (
                      <p className="text-xs font-mono text-[#1D4ED8] mt-0.5">
                        Tracking: {activeReceipt.trackingCode}
                      </p>
                    )}
                    <p className="text-xs font-mono text-[#757575] mt-1">
                      {activeReceipt.createdAt}
                    </p>
                  </div>

                  <div className="p-4 rounded bg-[#FAFAFA] border border-[#EEEEEE]">
                    <p className="text-xs font-bold text-[#757575]">পেমেন্ট তথ্য (Payment)</p>
                    <p className="text-sm font-bold text-[#212121] mt-1">
                      {activeReceipt.paymentMethod}
                    </p>
                    {activeReceipt.trxId && (
                      <p className="text-xs font-mono text-[#008916] mt-0.5">
                        TrxID: {activeReceipt.trxId}{' '}
                        {activeReceipt.paymentVerified ? '✓ Verified' : ''}
                      </p>
                    )}
                    {activeReceipt.voucherCode && (
                      <p className="text-xs text-[#663CBC] font-semibold mt-0.5">
                        Voucher: {activeReceipt.voucherCode} (-৳{activeReceipt.discountAmount})
                      </p>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto border border-[#DDDDEF] rounded-xl">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-[#F4F7FF] text-xs font-bold text-[#5E6484] border-b border-[#DDDDEF]">
                      <tr>
                        <th className="py-3 px-4">পণ্য</th>
                        <th className="py-3 px-4">প্যাক সাইজ</th>
                        <th className="py-3 px-4 text-right">দর</th>
                        <th className="py-3 px-4 text-center">পরিমাণ</th>
                        <th className="py-3 px-4 text-right">মোট</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E7EDFF]">
                      {activeReceipt.items.map((item) => (
                        <tr key={item.variantId}>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={item.image}
                                alt={item.name}
                                referrerPolicy="no-referrer"
                                className="w-10 h-10 rounded object-cover border border-[#DDDDEF] shrink-0"
                              />
                              <span className="font-semibold text-[#081149]">{item.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-xs text-[#5E6484]">{item.variantLabel}</td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums">
                            ৳{item.price.toLocaleString('en-US')}
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-bold tabular-nums">
                            {item.quantity}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-[#663CBC] tabular-nums">
                            ৳{(item.price * item.quantity).toLocaleString('en-US')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-2">
                  <div className="text-xs text-[#5E6484] space-y-1">
                    <p className="inline-flex items-center gap-1.5 font-semibold text-[#008916]">
                      <ShieldCheck className="w-4 h-4" />
                      <span>ডেলিভারির সময় প্যাকেট খুলে যাচাই করে মূল্য পরিশোধ করতে পারবেন</span>
                    </p>
                    <p>হেল্পলাইন: {BRAND_INFO.phone}</p>
                  </div>

                  <div className="w-full sm:w-72 p-4 rounded-xl bg-[#F4F7FF] border border-[#663CBC]/25 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span>Merchandise Subtotal:</span>
                      <span className="font-mono font-bold tabular-nums">
                        ৳{activeReceipt.subtotal.toLocaleString('en-US')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping Fee:</span>
                      <span className="font-mono font-bold tabular-nums">
                        {activeReceipt.shippingFee === 0 ? '৳0' : `৳${activeReceipt.shippingFee}`}
                      </span>
                    </div>
                    {activeReceipt.discountAmount ? (
                      <div className="flex justify-between text-[#008916]">
                        <span>Voucher Discount:</span>
                        <span className="font-mono font-bold tabular-nums">-৳{activeReceipt.discountAmount}</span>
                      </div>
                    ) : null}
                    <div className="flex justify-between text-base font-extrabold text-[#081149] pt-2 border-t border-[#663CBC]/20">
                      <span>Total Paid / Payable:</span>
                      <span className="font-mono text-[#663CBC] tabular-nums">
                        ৳{activeReceipt.total.toLocaleString('en-US')}
                      </span>
                    </div>
                  </div>
                </div>

                {activeReceipt.subOrders && activeReceipt.subOrders.length > 0 && (
                  <div className="p-3 rounded-xl bg-[#F4F7FF] border border-[#DDDDEF] space-y-1.5 text-xs">
                    <p className="font-extrabold text-[#081149]">
                      Multi-Vendor Store Shipment Split ({activeReceipt.subOrders.length} Packages)
                    </p>
                    {activeReceipt.subOrders.map((so) => (
                      <div key={so.subOrderId} className="flex justify-between">
                        <span>
                          #{so.subOrderId} · <strong>{so.sellerName}</strong>
                        </span>
                        <span className="font-mono font-bold text-[#663CBC] tabular-nums">
                          ৳{so.subtotal.toLocaleString('en-US')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-[#E7EDFF] print:hidden">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-[#DDDDEF] text-xs font-bold hover:bg-[#F4F7FF] cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>ইনভয়েস প্রিন্ট করুন</span>
                  </button>
                  <a
                    href={`https://wa.me/8801770241803?text=${encodeURIComponent(
                      `আসসালামু আলাইকুম, আমার অর্ডার #${activeReceipt.orderId} (${activeReceipt.customerName}, মোট ৳${activeReceipt.total}) কনফার্ম করেছি।`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#008916] text-white text-xs font-bold"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp পাঠান</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      onClearReceipt();
                      onBackToShop();
                    }}
                    className="ml-auto px-5 py-2.5 rounded-lg ot-gradient-btn text-white text-xs font-bold cursor-pointer"
                  >
                    শপে ফিরে যান →
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="flex-1 flex flex-col pb-24">
          <main className="flex-1 max-w-[960px] w-full mx-auto px-3 sm:px-5 py-3.5 space-y-3">
            {/* Step 1: Saved Address Card */}
            <div className="bg-white rounded-xl border border-[#DDDDEF] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#663CBC] shrink-0 mt-0.5" />
                  <div>
                    {defaultAddr ? (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[#081149]">
                            {defaultAddr.fullName}
                          </span>
                          <span className="font-mono text-xs text-[#5E6484]">
                            {defaultAddr.phone}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-[#663CBC] text-white text-[10px] font-bold">
                            {defaultAddr.label}
                          </span>
                        </div>
                        <p className="text-xs text-[#5E6484] mt-1">
                          {defaultAddr.address}, {defaultAddr.zone}, {defaultAddr.city},{' '}
                          {defaultAddr.division}
                        </p>
                      </>
                    ) : (
                      <div>
                        <p className="text-sm font-bold text-[#081149]">
                          ১. ক্রেতার তথ্য ও ডেলিভারি ঠিকানা
                        </p>
                        <p className="text-xs text-[#5E6484]">
                          জেলা ও উপজেলা নির্বাচন করুন অথবা Address Book-এ সেভ করুন
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onOpenAddAddress}
                  className="text-xs font-bold text-[#2563EB] hover:underline whitespace-nowrap cursor-pointer shrink-0"
                >
                  {defaultAddr ? 'Add New Address >' : '+ Add Address'}
                </button>
              </div>
            </div>

            {/* Step 2: Product Items Card */}
            <div className="bg-white rounded-lg border border-[#EAEAEA] p-4 space-y-4">
              {items.length === 0 ? (
                <div className="p-4 rounded border border-dashed border-[#DADADA] bg-[#FAFAFA] text-xs text-[#616161]">
                  আপনার কার্ট খালি। নিচ থেকে দ্রুত পণ্য সিলেক্ট করুন:
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.variantId}
                    className="flex items-start gap-3 pb-3 border-b border-[#F2F2F2] last:border-0 last:pb-0"
                  >
                    <div className="w-20 h-20 rounded-md overflow-hidden bg-[#F4F7FF] border border-[#DDDDEF] shrink-0">
                      <ResilientImage
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded-xs bg-[#6A1B9A] text-white text-[9px] font-extrabold">
                          ORGANIC
                        </span>
                        <p className="text-xs sm:text-sm font-semibold text-[#212121] line-clamp-1">
                          {item.name}
                        </p>
                      </div>
                      <p className="text-xs text-[#757575] mt-0.5">{item.variantLabel}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-mono text-sm font-extrabold text-[#212121]">
                          ৳ {item.price.toLocaleString('en-US')}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="inline-flex items-center border border-[#EAEAEA] rounded bg-[#FAFAFA]">
                            <button
                              type="button"
                              onClick={() => onUpdateQty(item.variantId, -1)}
                              aria-label="Decrease"
                              className="w-6 h-6 flex items-center justify-center hover:bg-[#EEEEEE] cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2 font-mono text-xs font-bold">
                              Qty: {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => onUpdateQty(item.variantId, 1)}
                              aria-label="Increase"
                              className="w-6 h-6 flex items-center justify-center hover:bg-[#EEEEEE] cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => onRemoveItem(item.variantId)}
                            aria-label="Remove item"
                            className="p-1 text-[#9E9E9E] hover:text-red-600 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}

              {errors.items && <p className="text-xs font-semibold text-red-600">{errors.items}</p>}

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[11px] font-semibold text-[#757575]">Quick Add:</span>
                {products.slice(0, 4).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onAddProduct(p, p.variants[0].id, 1)}
                    className="px-2.5 py-1 rounded-full border border-[#DDDDEF] hover:border-[#663CBC] text-[11px] font-medium text-[#081149] hover:text-[#663CBC] cursor-pointer"
                  >
                    + {p.categoryLabel} (৳{p.price})
                  </button>
                ))}
              </div>

              {/* Delivery or Pickup Card */}
              <div className="pt-3 border-t border-[#E7EDFF] space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#3C4266] font-medium">Delivery or Pickup</span>
                  <button
                    type="button"
                    onClick={() =>
                      setDeliveryMode((m) =>
                        m === 'Standard Delivery' ? 'Self-Pickup' : 'Standard Delivery'
                      )
                    }
                    className="text-[#2563EB] font-semibold inline-flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>
                      {deliveryMode === 'Standard Delivery'
                        ? 'Click for self-pickup'
                        : 'Switch to Home Delivery'}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="p-3 rounded-xl border border-[#2563EB]/40 bg-[#F4F7FF] flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-[#081149]">
                      {deliveryMode === 'Self-Pickup'
                        ? 'Store Self-Pickup (Chuadanga)'
                        : 'Standard Nationwide Delivery'}
                    </p>
                    <p className="text-[11px] text-[#3C4266] mt-1 inline-flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-[#2563EB]" />
                      <span>
                        {deliveryMode === 'Self-Pickup'
                          ? 'Collect from Chuadanga Sadar Depot'
                          : `Guaranteed by 24–72 Hours (${upazila}, ${district})`}
                      </span>
                    </p>
                  </div>
                  <span className="font-mono text-xs sm:text-sm font-bold text-[#081149]">
                    {freeShipping ? 'Free (৳0)' : `৳ ${shippingFee}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Step 3: Contact, District & Dynamic Upazila Selector */}
            <div className="bg-white rounded-xl border border-[#DDDDEF] overflow-hidden">
              <button
                type="button"
                onClick={() => setShowContactEditor((s) => !s)}
                className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-[#F4F7FF] cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-[#EEF2FF] text-[#663CBC] flex items-center justify-center">
                    <FileText className="w-3.5 h-3.5" />
                  </span>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-[#081149]">
                      Invoice, District, Upazila &amp; Contact Info
                    </p>
                    <p className="text-[11px] text-[#5E6484]">
                      {name ? `${name} · ${phone} · ${upazila}, ${district}` : 'নাম, মোবাইল, জেলা ও উপজেলা লিখুন'}
                    </p>
                  </div>
                </div>
                <ChevronRight
                  className={`w-4 h-4 text-[#7880A0] transition-transform ${
                    showContactEditor ? 'rotate-90' : ''
                  }`}
                />
              </button>

              {showContactEditor && (
                <div className="px-4 pb-4 pt-2 border-t border-[#E7EDFF] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-bold mb-1">আপনার নাম *</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="আপনার সম্পূর্ণ নাম"
                      className="w-full h-9 px-3 rounded-lg border border-[#DDDDEF] focus:outline-none focus:border-[#663CBC]"
                    />
                    {errors.name && <p className="text-[11px] text-red-600 mt-0.5">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block font-bold mb-1">মোবাইল নম্বর *</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="01XXXXXXXXX"
                      className="w-full h-9 px-3 rounded-lg border border-[#DDDDEF] font-mono focus:outline-none focus:border-[#663CBC]"
                    />
                    {errors.phone && (
                      <p className="text-[11px] text-red-600 mt-0.5">{errors.phone}</p>
                    )}
                  </div>

                  <div>
                    <label className="block font-bold mb-1">জেলা (District) *</label>
                    <select
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-[#DDDDEF] bg-white focus:outline-none focus:border-[#663CBC]"
                    >
                      {BANGLADESH_LOCATIONS.map((loc) => (
                        <option key={loc.district} value={loc.district}>
                          {loc.district}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold mb-1">উপজেলা / থানা (Upazila) *</label>
                    <select
                      value={upazila}
                      onChange={(e) => setUpazila(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-[#DDDDEF] bg-white focus:outline-none focus:border-[#663CBC]"
                    >
                      {upazilas.map((up) => (
                        <option key={up} value={up}>
                          {up}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold mb-1">সম্পূর্ণ ঠিকানা (বাসা/রোড/এলাকা) *</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="বাসা নং, রোড, গ্রাম বা মহল্লা..."
                      className="w-full h-9 px-3 rounded-lg border border-[#DDDDEF] focus:outline-none focus:border-[#663CBC]"
                    />
                    {errors.address && (
                      <p className="text-[11px] text-red-600 mt-0.5">{errors.address}</p>
                    )}
                  </div>

                  <div>
                    <label className="block font-bold mb-1">ডেলিভারি নোট (ঐচ্ছিক)</label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="ডেলিভারি সংক্রান্ত নোট"
                      className="w-full h-9 px-3 rounded-lg border border-[#DDDDEF] focus:outline-none focus:border-[#663CBC]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Step 4: Payment Gateways (COD, bKash, Nagad, Rocket, SSLCommerz) */}
            <div className="bg-white rounded-lg border border-[#EAEAEA] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-[#212121]">
                  পেমেন্ট মেথড (Authorized Gateways)
                </h2>
                <span className="text-[11px] text-[#008916] font-semibold">
                  Server-Verified &amp; Duplicate Guarded
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {[
                  {
                    id: 'Cash on Delivery' as PaymentMethodLabel,
                    title: 'Cash on Delivery',
                    sub: 'পণ্য দেখে টাকা দিন',
                    color: 'text-[#663CBC]',
                    icon: Wallet,
                    enabled: true,
                  },
                  {
                    id: 'bKash' as PaymentMethodLabel,
                    title: 'bKash',
                    sub: 'Personal / Merchant',
                    color: 'text-[#E2136E]',
                    icon: CreditCard,
                    enabled: true,
                  },
                  {
                    id: 'Nagad' as PaymentMethodLabel,
                    title: 'Nagad',
                    sub: 'Send Money / Pay',
                    color: 'text-[#F6921E]',
                    icon: CreditCard,
                    enabled: true,
                  },
                  {
                    id: 'Rocket' as PaymentMethodLabel,
                    title: 'Rocket',
                    sub: 'DBBL Mobile Pay',
                    color: 'text-[#8C3494]',
                    icon: CreditCard,
                    enabled: true,
                  },
                  {
                    id: 'Upay' as PaymentMethodLabel,
                    title: 'Upay',
                    sub: 'UCB Mobile Wallet',
                    color: 'text-[#D97706]',
                    icon: CreditCard,
                    enabled: true,
                  },
                  {
                    id: 'SSLCommerz' as PaymentMethodLabel,
                    title: 'SSLCommerz',
                    sub: 'Card / NetBanking',
                    color: 'text-[#2563EB]',
                    icon: ShieldCheck,
                    enabled: storeSettings?.sslcommerzEnabled ?? true,
                  },
                ]
                  .filter((m) => m.enabled)
                  .map((m) => {
                    const Icon = m.icon;
                    const active = paymentMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          active
                            ? 'border-[#663CBC] bg-[#F5F3FF] ring-1 ring-[#663CBC]/30'
                            : 'border-[#DDDDEF] bg-white hover:border-[#663CBC]/40'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <Icon className={`w-4 h-4 ${m.color} shrink-0`} />
                          <span className="text-xs font-bold text-[#081149] truncate">
                            {m.title}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#5E6484] mt-1 truncate">{m.sub}</p>
                      </button>
                    );
                  })}
              </div>

              {(paymentMethod === 'bKash' ||
                paymentMethod === 'Nagad' ||
                paymentMethod === 'Rocket' ||
                paymentMethod === 'Upay') && (
                <div className="p-3 rounded-xl bg-[#F5F3FF] border border-[#663CBC]/30 space-y-1.5">
                  <p className="text-xs text-[#081149]">
                    <strong>{paymentMethod}</strong> নম্বরে{' '}
                    <strong className="font-mono">{merchantNumber}</strong>-তে{' '}
                    <strong>৳{grandTotal}</strong> পাঠিয়ে Transaction ID লিখুন:
                  </p>
                  <input
                    type="text"
                    value={trxId}
                    onChange={(e) => setTrxId(e.target.value)}
                    placeholder="Transaction ID (e.g. 9GH7K21M)"
                    className="w-full h-9 px-3 rounded-lg border border-[#DDDDEF] bg-white text-xs font-mono uppercase focus:outline-none focus:border-[#663CBC]"
                  />
                  {errors.trxId && <p className="text-xs text-red-600">{errors.trxId}</p>}
                </div>
              )}

              {paymentMethod === 'SSLCommerz' && (
                <div className="p-3 rounded bg-[#EFF6FF] border border-[#93C5FD] text-xs text-[#1E3A8A]">
                  Place Order বাটনে ক্লিক করলে Visa / Mastercard / Nexus / Mobile Banking
                  SSLCommerz গেটওয়ে সেশন ভেরিফাই হয়ে অর্ডার সম্পন্ন হবে।
                </div>
              )}
            </div>

            {/* Step 5: Subtotal, Delivery Fee & Coupon Validation */}
            <div className="bg-white rounded-xl border border-[#DDDDEF] p-4 space-y-2.5 text-xs sm:text-sm">
              <div className="flex justify-between text-[#3C4266]">
                <span>Merchandise Subtotal ({totalQty} Items)</span>
                <span className="font-mono font-semibold text-[#081149] tabular-nums">
                  ৳ {subtotal.toLocaleString('en-US')}
                </span>
              </div>

              <div className="flex justify-between text-[#3C4266]">
                <span>Shipping Fee ({upazila}, {district})</span>
                <span className="font-mono font-semibold text-[#081149] tabular-nums">
                  {freeShipping ? '৳ 0 (Free)' : `৳ ${shippingFee}`}
                </span>
              </div>

              <div className="flex justify-between text-[#3C4266]">
                <span>Cash Payment Fee</span>
                <span className="font-mono font-semibold text-[#008916]">৳ 0 (Free)</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-[#008916] font-semibold">
                  <span>Voucher Discount ({appliedVoucher?.code})</span>
                  <span className="font-mono tabular-nums">-৳ {discountAmount}</span>
                </div>
              )}

              <div className="pt-2.5 border-t border-[#E7EDFF] flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#081149]">
                  <Ticket className="w-4 h-4 text-[#663CBC]" />
                  <span>Voucher &amp; Code</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={voucherInput}
                    onChange={(e) => setVoucherInput(e.target.value)}
                    placeholder="WINTER50 / GUR100"
                    className="h-8 px-2.5 rounded-lg border border-[#DDDDEF] text-xs font-mono uppercase w-36 focus:outline-none focus:border-[#663CBC]"
                  />
                  <button
                    type="button"
                    onClick={handleApplyVoucher}
                    className="h-8 px-3 rounded-lg bg-[#081149] text-white text-xs font-bold cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
              </div>
              {voucherMsg && (
                <p
                  className={`text-[11px] font-semibold ${
                    appliedVoucher ? 'text-[#008916]' : 'text-[#663CBC]'
                  }`}
                >
                  {voucherMsg}
                </p>
              )}
            </div>
          </main>

          <div className="fixed bottom-0 left-0 right-0 z-40 ot-header-frosted border-t border-[#DDDDEF] shadow-[0_-4px_12px_rgba(8,17,73,0.06)]">
            <div className="max-w-[960px] mx-auto px-4 h-16 flex items-center justify-end gap-4">
              <div className="text-right">
                <span className="text-xs text-[#5E6484] mr-1.5">Total:</span>
                <span className="font-mono tabular-nums text-lg sm:text-xl font-extrabold text-[#663CBC]">
                  ৳ {grandTotal.toLocaleString('en-US')}
                </span>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="h-11 px-7 sm:px-9 rounded-xl ot-gradient-btn disabled:opacity-60 text-white text-sm font-bold cursor-pointer"
              >
                {submitting ? 'Processing...' : 'Place Order'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
