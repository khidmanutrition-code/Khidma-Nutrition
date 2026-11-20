import React, { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import {
  ArrowLeft,
  BadgeCheck,
  BarChart3,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  MessageSquare,
  Package,
  Plus,
  Printer,
  Send,
  ShieldCheck,
  Store,
  Tag,
  Truck,
  Wallet,
} from 'lucide-react';
import type { User } from 'firebase/auth';
import type { Product } from '../data/products';
import type {
  MarketplaceLanguage,
  OrderStatus,
  ProductQuestionRecord,
  SellerPayoutRecord,
  SubOrderRecord,
  VendorStoreRecord,
  VoucherRecord,
} from '../types';
import {
  answerProductQuestionInFirestore,
  requestSellerPayoutInFirestore,
  saveChatMessageToFirestore,
  saveProductToFirestore,
  saveVendorStoreAndKycToFirestore,
  updateSubOrderStatusInFirestore,
} from '../lib/storeDb';
import { ResilientImage } from './ResilientImage';
import { MediaUploaderControl } from './MediaUploaderControl';

interface SellerCenterPageProps {
  firebaseUser: User | null;
  vendors: VendorStoreRecord[];
  products: Product[];
  subOrders: SubOrderRecord[];
  questions: ProductQuestionRecord[];
  payouts: SellerPayoutRecord[];
  vouchers: VoucherRecord[];
  lang?: MarketplaceLanguage;
  onBackToStore: () => void;
  onRequireLogin: () => void;
  onLocalVendorUpdate?: (vendor: VendorStoreRecord) => void;
  onLocalSubOrderUpdate?: (subOrderId: string, status: OrderStatus) => void;
}

type SellerTab = 'home' | 'products' | 'orders' | 'promos' | 'analytics' | 'qa' | 'chat' | 'finance' | 'kyc';

const SUB_ORDER_STATUSES: OrderStatus[] = [
  'Pending',
  'Confirmed',
  'Processing',
  'Ready to Ship',
  'Shipped',
  'Delivered',
  'Returned',
];

export const SellerCenterPage: React.FC<SellerCenterPageProps> = ({
  firebaseUser,
  vendors,
  products,
  subOrders,
  questions,
  payouts,
  vouchers,
  lang = 'bn',
  onBackToStore,
  onRequireLogin,
  onLocalVendorUpdate,
  onLocalSubOrderUpdate,
}) => {
  const [selectedVendorId, setSelectedVendorId] = useState<string>(() => {
    const owned = firebaseUser ? vendors.find((v) => v.ownerUid === firebaseUser.uid) : undefined;
    return owned?.id ?? vendors[0]?.id ?? 'khidmatul-mall';
  });
  const [tab, setTab] = useState<SellerTab>('home');
  const [liveOrderAlert, setLiveOrderAlert] = useState<string | null>(null);
  const [printSlipOrder, setPrintSlipOrder] = useState<SubOrderRecord | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const activeVendor = useMemo(
    () => vendors.find((v) => v.id === selectedVendorId) ?? vendors[0],
    [vendors, selectedVendorId]
  );

  // New Product Composer State
  const [newProdName, setNewProdName] = useState('');
  const [newProdEng, setNewProdEng] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('850');
  const [newProdOrigPrice, setNewProdOrigPrice] = useState('990');
  const [newProdCategory, setNewProdCategory] = useState<Product['category']>('patali');
  const [newProdStock, setNewProdStock] = useState('50');
  const [newProdImages, setNewProdImages] = useState<string[]>([]);
  const [newProdVideoUrl, setNewProdVideoUrl] = useState('');
  const [sellerMediaUploading, setSellerMediaUploading] = useState(false);

  // KYC Onboarding Form
  const [kycStoreName, setKycStoreName] = useState(activeVendor?.storeName ?? '');
  const [kycLocation, setKycLocation] = useState(activeVendor?.location ?? '');
  const [kycPhone, setKycPhone] = useState(activeVendor?.phone ?? '');
  const [kycNid, setKycNid] = useState(activeVendor?.nidNumber ?? '');
  const [kycTradeLicense, setKycTradeLicense] = useState(activeVendor?.tradeLicense ?? '');
  const [kycTinBin, setKycTinBin] = useState(activeVendor?.tinBin ?? '');

  // Payout State
  const [payoutAmount, setPayoutAmount] = useState('2500');
  const [payoutMethod, setPayoutMethod] = useState<'bKash' | 'Nagad' | 'Bank Transfer'>('bKash');
  const [payoutAccount, setPayoutAccount] = useState('01770241803');

  // Q&A Reply Drafts
  const [qaDrafts, setQaDrafts] = useState<Record<string, string>>({});

  // Seller Chat Replies
  const [chatThreads, setChatThreads] = useState<
    Array<{ roomId: string; sellerId: string; lastText: string; lastSender: string; count: number }>
  >([]);
  const [activeRoomId, setActiveRoomId] = useState('');
  const [sellerReplyText, setSellerReplyText] = useState('');

  useEffect(() => {
    const socket = io({ path: '/socket.io', transports: ['websocket', 'polling'] });
    socket.on('order:new', (evt: { orderId?: string; customerName?: string; sellerIds?: string[] }) => {
      if (!evt?.sellerIds || evt.sellerIds.includes(selectedVendorId)) {
        setLiveOrderAlert(
          `নতুন সাব-অর্ডার #${evt.orderId} (${evt.customerName || 'Customer'}) এসেছে!`
        );
      }
    });
    return () => {
      socket.disconnect();
    };
  }, [selectedVendorId]);

  useEffect(() => {
    if (tab !== 'chat') return;
    fetch('/api/chat/threads')
      .then((r) => r.json())
      .then((data: { ok?: boolean; threads?: typeof chatThreads }) => {
        if (data.ok && Array.isArray(data.threads)) {
          const filtered = data.threads.filter((t) => t.sellerId === selectedVendorId || !t.sellerId);
          setChatThreads(filtered);
          if (!activeRoomId && filtered[0]) {
            setActiveRoomId(filtered[0].roomId);
          }
        }
      })
      .catch(() => undefined);
  }, [tab, selectedVendorId, activeRoomId]);

  const sellerProducts = useMemo(
    () =>
      products.filter(
        (p) =>
          (p.sellerId ?? '') === selectedVendorId ||
          (!p.sellerId && selectedVendorId === 'khidmatul-mall')
      ),
    [products, selectedVendorId]
  );

  const sellerSubOrders = useMemo(
    () => subOrders.filter((s) => s.sellerId === selectedVendorId),
    [subOrders, selectedVendorId]
  );

  const sellerQuestions = useMemo(
    () => questions.filter((q) => q.sellerId === selectedVendorId),
    [questions, selectedVendorId]
  );

  const sellerPayouts = useMemo(
    () => payouts.filter((p) => p.sellerId === selectedVendorId),
    [payouts, selectedVendorId]
  );

  const notify = (msg: string) => {
    setStatusNotice(msg);
    window.setTimeout(() => setStatusNotice(null), 3500);
  };

  const handleSaveNewProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) {
      onRequireLogin();
      return;
    }
    if (!newProdName.trim()) return;
    const price = Math.max(50, Number(newProdPrice) || 500);
    const orig = Math.max(price, Number(newProdOrigPrice) || price);
    const id = `seller-${selectedVendorId}-${Date.now().toString().slice(-5)}`;
    const newProduct: Product = {
      id,
      sku: `KU-${Date.now().toString().slice(-4)}`,
      name: newProdName.trim(),
      englishName: newProdEng.trim() || newProdName.trim(),
      shortDesc: `${activeVendor?.storeName ?? 'Seller'} Verified Organic Harvest`,
      category: newProdCategory,
      categoryLabel: newProdCategory.toUpperCase(),
      brand: activeVendor?.storeName ?? 'Khidmatul Mall',
      price,
      originalPrice: orig,
      discountPercent: Math.round(((orig - price) / orig) * 100),
      soldCount: 0,
      stockLeft: Math.max(1, Number(newProdStock) || 25),
      tag: 'Seller Listing',
      badge: activeVendor?.tier === 'Official Mall' ? 'Official Mall' : 'Verified Seller',
      inStock: true,
      image: newProdImages[0] ?? products[0]?.image ?? '/src/assets/images/gur/patali_gur.jpg',
      gallery:
        newProdImages.length > 0
          ? newProdImages
          : [products[0]?.image ?? '/src/assets/images/gur/patali_gur.jpg'],
      videoUrl: newProdVideoUrl.trim() || undefined,
      origin: activeVendor?.location ?? 'Bangladesh',
      description: `${newProdName.trim()} supplied directly by ${activeVendor?.storeName}.`,
      features: ['100% Pure Organic', 'Lab Tested', 'Cash on Delivery Eligible'],
      variants: [{ id: `${id}-1kg`, label: '১ কেজি প্যাক', weightKg: 1, price }],
      sellerId: selectedVendorId,
      sellerName: activeVendor?.storeName,
      isMall: activeVendor?.tier === 'Official Mall',
      freeShipping: price >= 1100,
    };

    try {
      await saveProductToFirestore(newProduct);
      setNewProdName('');
      setNewProdEng('');
      setNewProdImages([]);
      setNewProdVideoUrl('');
      notify('নতুন পণ্য ও মিডিয়া স্টোরে যুক্ত হয়েছে!');
    } catch {
      notify('পণ্য যুক্ত করতে Verified Seller/Admin অনুমতি প্রয়োজন।');
    }
  };

  const handleExportProductsCsv = () => {
    const header = 'ID,SKU,Name,Price,Stock,SellerId';
    const rows = sellerProducts.map(
      (p) => `"${p.id}","${p.sku}","${p.name.replace(/"/g, '""')}",${p.price},${p.stockLeft ?? 30},"${selectedVendorId}"`
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seller-${selectedVendorId}-catalog.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSubmitKyc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) {
      onRequireLogin();
      return;
    }
    const vendorSlug = kycStoreName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40) || `seller-${Date.now()}`;
    const newVendor: VendorStoreRecord = {
      id: activeVendor?.ownerUid === firebaseUser.uid ? activeVendor.id : `vendor-${firebaseUser.uid.slice(0, 6)}`,
      ownerUid: firebaseUser.uid,
      ownerEmail: firebaseUser.email ?? '',
      storeName: kycStoreName.trim() || 'New Organic Vendor',
      slug: vendorSlug,
      tier: activeVendor?.tier ?? 'Standard',
      kycStatus: 'Pending',
      nidNumber: kycNid.trim(),
      tradeLicense: kycTradeLicense.trim(),
      tinBin: kycTinBin.trim(),
      phone: kycPhone.trim(),
      location: kycLocation.trim() || 'Dhaka, Bangladesh',
      commissionRate: activeVendor?.commissionRate ?? 8,
      positiveRatingPercent: activeVendor?.positiveRatingPercent ?? 96,
      shipOnTimePercent: activeVendor?.shipOnTimePercent ?? 95,
      chatResponsePercent: activeVendor?.chatResponsePercent ?? 94,
      walletBalance: activeVendor?.walletBalance ?? 0,
      totalSales: activeVendor?.totalSales ?? 0,
      followersCount: activeVendor?.followersCount ?? 1,
      active: true,
    };
    await saveVendorStoreAndKycToFirestore(newVendor, firebaseUser);
    onLocalVendorUpdate?.(newVendor);
    setSelectedVendorId(newVendor.id);
    notify('Seller KYC আবেদন সফলভাবে জমা হয়েছে!');
  };

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser || !activeVendor) {
      onRequireLogin();
      return;
    }
    await requestSellerPayoutInFirestore(
      {
        sellerId: activeVendor.id,
        sellerName: activeVendor.storeName,
        amount: Math.max(100, Number(payoutAmount) || 500),
        method: payoutMethod,
        accountNumber: payoutAccount.trim(),
        periodLabel: new Date().toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
      },
      firebaseUser
    );
    notify('পেআউট উত্তোলনের অনুরোধ পাঠানো হয়েছে!');
  };

  const handleSendSellerChatReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRoomId || !sellerReplyText.trim() || !activeVendor) return;
    const text = sellerReplyText.trim();
    setSellerReplyText('');
    const socket = io({ path: '/socket.io', transports: ['websocket', 'polling'] });
    const msg = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      roomId: activeRoomId,
      sellerId: activeVendor.id,
      sellerName: activeVendor.storeName,
      senderRole: 'seller' as const,
      senderName: activeVendor.storeName,
      text,
      createdAtMs: Date.now(),
    };
    socket.on('connect', () => {
      socket.emit('chat:join', { roomId: activeRoomId });
      socket.emit('chat:message', msg);
      window.setTimeout(() => socket.disconnect(), 400);
    });
    if (firebaseUser) {
      await saveChatMessageToFirestore(msg, firebaseUser.uid, activeVendor.ownerUid);
    }
    notify('ক্রেতাকে রিপ্লাই পাঠানো হয়েছে!');
  };

  const netRevenue = sellerSubOrders.reduce((s, o) => s + o.sellerNetPayout, 0);

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-[#212121]">
      {/* Seller Top Bar */}
      <header className="bg-[#212121] text-white sticky top-0 z-40 border-b border-white/10">
        <div className="max-w-[1280px] mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToStore}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{lang === 'en' ? 'Storefront' : 'শপে ফিরুন'}</span>
            </button>
            <div className="flex items-center gap-2">
              <Store className="w-5 h-5 text-[#F85606]" />
              <div>
                <h1 className="text-sm sm:text-base font-extrabold leading-tight">
                  {lang === 'en' ? 'Seller Center Portal' : 'সেলার সেন্টার পোর্টাল'}
                </h1>
                <p className="text-[10px] text-[#D1D5DB]">Multi-Vendor Operations &amp; KYC Hub</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedVendorId}
              onChange={(e) => setSelectedVendorId(e.target.value)}
              className="h-8 px-2.5 rounded-lg bg-[#2E2E2E] border border-white/20 text-xs font-semibold text-white"
            >
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.storeName} ({v.tier})
                </option>
              ))}
            </select>
            {!firebaseUser && (
              <button
                type="button"
                onClick={onRequireLogin}
                className="h-8 px-3 rounded-lg bg-[#F85606] text-white text-xs font-bold cursor-pointer"
              >
                {lang === 'en' ? 'Sign In' : 'লগইন করুন'}
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-[1280px] mx-auto px-4 py-5 space-y-4">
        {liveOrderAlert && (
          <div className="p-3 rounded-xl bg-[#ECFDF5] border border-[#10B981]/40 text-[#065F46] text-xs font-bold flex items-center justify-between">
            <span>🔔 {liveOrderAlert}</span>
            <button type="button" onClick={() => setLiveOrderAlert(null)} className="underline cursor-pointer">
              Dismiss
            </button>
          </div>
        )}

        {statusNotice && (
          <div className="p-3 rounded-xl bg-[#FFF5EC] border border-[#F85606]/40 text-[#9A3412] text-xs font-bold">
            ✓ {statusNotice}
          </div>
        )}

        {/* Navigation Tabs */}
        <nav className="flex flex-wrap gap-1.5 bg-white p-2 rounded-xl border border-[#E5E7EB]">
          {(
            [
              { id: 'home', label: 'Dashboard', icon: Store },
              { id: 'products', label: `Products (${sellerProducts.length})`, icon: Package },
              { id: 'orders', label: `Sub-Orders (${sellerSubOrders.length})`, icon: Truck },
              { id: 'promos', label: 'Promos & Bundles', icon: Tag },
              { id: 'analytics', label: 'Business Advisor', icon: BarChart3 },
              { id: 'qa', label: `Buyer Q&A (${sellerQuestions.length})`, icon: CheckCircle2 },
              { id: 'chat', label: 'Buyer Chat', icon: MessageSquare },
              { id: 'finance', label: 'Wallet & Payouts', icon: Wallet },
              { id: 'kyc', label: 'Store KYC', icon: ShieldCheck },
            ] as Array<{ id: SellerTab; label: string; icon: React.ComponentType<{ className?: string }> }>
          ).map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                  active ? 'bg-[#F85606] text-white' : 'text-[#4B5563] hover:bg-[#FFF5EC] hover:text-[#F85606]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* TAB 1: HOME */}
        {tab === 'home' && activeVendor && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-white p-4 rounded-xl border border-[#E5E7EB]">
                <p className="text-[11px] font-bold text-[#6B7280] uppercase">Store Status &amp; Tier</p>
                <p className="text-base font-extrabold text-[#212121] mt-1 flex items-center gap-1.5">
                  <span>{activeVendor.tier}</span>
                  <BadgeCheck className="w-4 h-4 text-[#00A859]" />
                </p>
                <p className="text-xs text-[#6B7280] mt-1">KYC: {activeVendor.kycStatus} · Fee {activeVendor.commissionRate}%</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-[#E5E7EB]">
                <p className="text-[11px] font-bold text-[#6B7280] uppercase">Net Earnings (Orders)</p>
                <p className="text-xl font-extrabold text-[#F85606] mt-1">
                  ৳{(activeVendor.walletBalance + netRevenue).toLocaleString('en-US')}
                </p>
                <p className="text-xs text-[#6B7280] mt-1">{sellerSubOrders.length} active split sub-orders</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-[#E5E7EB]">
                <p className="text-[11px] font-bold text-[#6B7280] uppercase">Seller Scorecard</p>
                <p className="text-base font-extrabold text-[#00A859] mt-1">
                  {activeVendor.positiveRatingPercent}% Positive
                </p>
                <p className="text-xs text-[#6B7280] mt-1">
                  Ship On Time: {activeVendor.shipOnTimePercent}% · Chat: {activeVendor.chatResponsePercent}%
                </p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-[#E5E7EB]">
                <p className="text-[11px] font-bold text-[#6B7280] uppercase">Active Listings</p>
                <p className="text-xl font-extrabold text-[#212121] mt-1">{sellerProducts.length} SKUs</p>
                <p className="text-xs text-[#6B7280] mt-1">{activeVendor.followersCount.toLocaleString('en-US')} followers</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PRODUCTS & CSV */}
        {tab === 'products' && (
          <div className="space-y-4">
            <form onSubmit={handleSaveNewProduct} className="bg-white p-4 rounded-xl border border-[#E5E7EB] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-extrabold text-[#212121] flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-[#F85606]" />
                  <span>Add New Store SKU</span>
                </h2>
                <button
                  type="button"
                  onClick={handleExportProductsCsv}
                  className="px-3 py-1.5 rounded-lg border border-[#D1D5DB] text-xs font-bold flex items-center gap-1.5 hover:border-[#F85606] cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-[#00A859]" />
                  <span>Export Catalog CSV</span>
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                <input
                  type="text"
                  required
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="Product Name (BN)"
                  className="h-9 px-3 rounded-lg border border-[#D1D5DB] text-xs sm:col-span-2"
                />
                <input
                  type="text"
                  value={newProdEng}
                  onChange={(e) => setNewProdEng(e.target.value)}
                  placeholder="English Name"
                  className="h-9 px-3 rounded-lg border border-[#D1D5DB] text-xs"
                />
                <select
                  value={newProdCategory}
                  onChange={(e) => setNewProdCategory(e.target.value as Product['category'])}
                  className="h-9 px-2.5 rounded-lg border border-[#D1D5DB] text-xs"
                >
                  <option value="patali">Patali Gur</option>
                  <option value="danadar">Danadar Gur</option>
                  <option value="jhola">Jhola Gur</option>
                  <option value="honey">Honey</option>
                  <option value="ghee-oil">Ghee &amp; Oil</option>
                  <option value="dates-nuts">Dates &amp; Nuts</option>
                  <option value="spices-seeds">Spices &amp; Seeds</option>
                  <option value="combo">Combo Packs</option>
                </select>
                <input
                  type="number"
                  value={newProdPrice}
                  onChange={(e) => setNewProdPrice(e.target.value)}
                  placeholder="Sale Price"
                  className="h-9 px-3 rounded-lg border border-[#D1D5DB] text-xs"
                />
                <input
                  type="number"
                  value={newProdStock}
                  onChange={(e) => setNewProdStock(e.target.value)}
                  placeholder="Stock"
                  className="h-9 px-3 rounded-lg border border-[#D1D5DB] text-xs"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <MediaUploaderControl
                  mode="gallery"
                  label="পণ্যের ফটো গ্যালারি আপলোড করুন (সর্বোচ্চ ৬টি)"
                  helperText="কম্পিউটার/ফোন থেকে সরাসরি JPG, PNG বা WebP আপলোড করুন অথবা Media Library থেকে বেছে নিন।"
                  images={newProdImages}
                  onImagesChange={setNewProdImages}
                  onUploadingChange={setSellerMediaUploading}
                />
                <MediaUploaderControl
                  mode="video"
                  label="পণ্যের ভিডিও আপলোড করুন (ঐচ্ছিক)"
                  helperText="MP4, WebM, MOV বা M4V ভিডিও ফাইল (সর্বোচ্চ ৬০ MB) অথবা ভিডিও লিংক।"
                  singleUrl={newProdVideoUrl}
                  onSingleUrlChange={setNewProdVideoUrl}
                  onUploadingChange={setSellerMediaUploading}
                />
              </div>

              <button
                type="submit"
                disabled={sellerMediaUploading}
                className="px-4 py-2 rounded-lg bg-[#F85606] disabled:opacity-60 text-white text-xs font-extrabold cursor-pointer hover:bg-[#D94802]"
              >
                {sellerMediaUploading ? 'মিডিয়া আপলোড হচ্ছে...' : 'Publish Product to Marketplace'}
              </button>
            </form>

            <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F9FAFB] text-[#6B7280] uppercase border-b border-[#E5E7EB]">
                  <tr>
                    <th className="px-4 py-2.5">Product</th>
                    <th className="px-4 py-2.5">SKU</th>
                    <th className="px-4 py-2.5">Price</th>
                    <th className="px-4 py-2.5">Stock</th>
                    <th className="px-4 py-2.5">Sold</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F4F6]">
                  {sellerProducts.map((p) => (
                    <tr key={p.id}>
                      <td className="px-4 py-2.5 flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded overflow-hidden bg-[#F3F4F6] shrink-0">
                          <ResilientImage src={p.image} alt={p.name} className="w-full h-full object-cover" />
                        </div>
                        <span className="font-bold text-[#212121]">{p.name}</span>
                      </td>
                      <td className="px-4 py-2.5 text-[#6B7280]">{p.sku}</td>
                      <td className="px-4 py-2.5 font-extrabold text-[#F85606]">৳{p.price}</td>
                      <td className="px-4 py-2.5">{p.stockLeft ?? 40} pcs</td>
                      <td className="px-4 py-2.5">{p.soldCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: SUB-ORDER FULFILLMENT & SHIPPING LABELS */}
        {tab === 'orders' && (
          <div className="space-y-3">
            {sellerSubOrders.length === 0 ? (
              <div className="bg-white p-8 rounded-xl border border-[#E5E7EB] text-center text-xs text-[#6B7280]">
                এই সেলারের জন্য এখনো কোনো সাব-অর্ডার আসেনি।
              </div>
            ) : (
              sellerSubOrders.map((so) => (
                <div key={so.subOrderId} className="bg-white p-4 rounded-xl border border-[#E5E7EB] space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-extrabold text-[#212121]">
                        Sub-Order #{so.subOrderId}
                      </span>
                      <span className="ml-2 text-[11px] text-[#6B7280]">
                        (Parent #{so.parentOrderId}) · {so.customerName} ({so.phone})
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={so.status}
                        onChange={async (e) => {
                          const next = e.target.value as OrderStatus;
                          await updateSubOrderStatusInFirestore(so.subOrderId, next).catch(() => undefined);
                          onLocalSubOrderUpdate?.(so.subOrderId, next);
                          notify(`সাব-অর্ডার #${so.subOrderId} স্ট্যাটাস আপডেট হয়েছে: ${next}`);
                        }}
                        className="h-8 px-2 rounded border border-[#D1D5DB] text-xs font-bold"
                      >
                        {SUB_ORDER_STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setPrintSlipOrder(so)}
                        className="h-8 px-2.5 rounded border border-[#D1D5DB] text-xs font-bold flex items-center gap-1 hover:border-[#F85606] cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5 text-[#F85606]" />
                        <span>Shipping Label</span>
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#4B5563] border-t border-[#F3F4F6] pt-2">
                    <span>
                      {so.items.map((i) => `${i.name} (${i.variantLabel}) x${i.quantity}`).join(', ')}
                    </span>
                    <span className="font-extrabold text-[#00A859]">
                      Net Payout: ৳{so.sellerNetPayout.toLocaleString('en-US')} (Fee {so.commissionRate}%: ৳{so.commissionAmount})
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 4: PROMOS */}
        {tab === 'promos' && (
          <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] space-y-3">
            <h2 className="text-sm font-extrabold">Active Store Vouchers &amp; Campaign Slots</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {vouchers.map((v) => (
                <div key={v.code} className="p-3 rounded-xl bg-[#FFF5EC] border border-[#F85606]/30">
                  <p className="text-xs font-extrabold text-[#F85606]">{v.code} · ৳{v.discount} OFF</p>
                  <p className="text-xs text-[#212121] font-semibold mt-0.5">{v.title}</p>
                  <p className="text-[11px] text-[#6B7280] mt-1">Min Spend ৳{v.minSpend} · Exp {v.expiry}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: ANALYTICS / BUSINESS ADVISOR */}
        {tab === 'analytics' && (
          <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] space-y-3">
            <h2 className="text-sm font-extrabold">Business Advisor · Top Converting SKUs</h2>
            <div className="space-y-2">
              {sellerProducts
                .slice()
                .sort((a, b) => b.soldCount - a.soldCount)
                .map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-[#F9FAFB]">
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate">{p.name}</p>
                      <p className="text-[11px] text-[#6B7280]">Est. Conversion 4.8% · Stock {p.stockLeft ?? 40}</p>
                    </div>
                    <span className="text-xs font-extrabold text-[#F85606] shrink-0">
                      {p.soldCount} sold · ৳{(p.soldCount * p.price).toLocaleString('en-US')}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* TAB 6: BUYER Q&A */}
        {tab === 'qa' && (
          <div className="space-y-2.5">
            {sellerQuestions.length === 0 ? (
              <div className="bg-white p-8 rounded-xl border border-[#E5E7EB] text-center text-xs text-[#6B7280]">
                ক্রেতাদের কোনো প্রশ্ন এখনো নেই।
              </div>
            ) : (
              sellerQuestions.map((q) => (
                <div key={q.id} className="bg-white p-4 rounded-xl border border-[#E5E7EB] space-y-2">
                  <p className="text-xs font-extrabold text-[#212121]">Q: {q.question}</p>
                  <p className="text-[11px] text-[#6B7280]">
                    Asked by {q.authorName} on {q.createdAtText || 'recent'}
                  </p>
                  {q.answer ? (
                    <p className="text-xs text-[#065F46] bg-[#ECFDF5] p-2.5 rounded-lg font-semibold">
                      A ({q.answeredBy}): {q.answer}
                    </p>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={qaDrafts[q.id] ?? ''}
                        onChange={(e) => setQaDrafts((prev) => ({ ...prev, [q.id]: e.target.value }))}
                        placeholder="ক্রেতার প্রশ্নের উত্তর লিখুন..."
                        className="flex-1 h-8 px-3 rounded border border-[#D1D5DB] text-xs"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          const ans = (qaDrafts[q.id] ?? '').trim();
                          if (!ans) return;
                          await answerProductQuestionInFirestore(
                            q.id,
                            ans,
                            activeVendor?.storeName ?? 'Seller'
                          ).catch(() => undefined);
                          notify('প্রশ্নের উত্তর সেভ হয়েছে!');
                        }}
                        className="h-8 px-3 rounded bg-[#F85606] text-white text-xs font-bold cursor-pointer"
                      >
                        Reply
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 7: REAL-TIME BUYER CHAT */}
        {tab === 'chat' && (
          <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] space-y-3">
            <h2 className="text-sm font-extrabold">Live Buyer Chat Threads</h2>
            {chatThreads.length === 0 ? (
              <p className="text-xs text-[#6B7280]">No active buyer chat rooms yet. Buyers can open chat from any PDP.</p>
            ) : (
              <div className="space-y-2">
                {chatThreads.map((t) => (
                  <button
                    key={t.roomId}
                    type="button"
                    onClick={() => setActiveRoomId(t.roomId)}
                    className={`w-full p-2.5 rounded-lg border text-left text-xs cursor-pointer ${
                      activeRoomId === t.roomId ? 'border-[#F85606] bg-[#FFF5EC]' : 'border-[#E5E7EB]'
                    }`}
                  >
                    <p className="font-bold">{t.lastSender} · ({t.count} msgs)</p>
                    <p className="text-[#4B5563] truncate">{t.lastText}</p>
                  </button>
                ))}
              </div>
            )}
            <form onSubmit={handleSendSellerChatReply} className="flex gap-2">
              <input
                type="text"
                value={sellerReplyText}
                onChange={(e) => setSellerReplyText(e.target.value)}
                placeholder="Select a thread and reply in real time..."
                className="flex-1 h-9 px-3 rounded-lg border border-[#D1D5DB] text-xs"
              />
              <button
                type="submit"
                disabled={!activeRoomId || !sellerReplyText.trim()}
                className="h-9 px-4 rounded-lg bg-[#F85606] text-white text-xs font-bold flex items-center gap-1 disabled:opacity-40 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Reply</span>
              </button>
            </form>
          </div>
        )}

        {/* TAB 8: FINANCE & PAYOUTS */}
        {tab === 'finance' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <form onSubmit={handleRequestPayout} className="bg-white p-4 rounded-xl border border-[#E5E7EB] space-y-3">
              <h2 className="text-sm font-extrabold">Request Seller Payout Withdrawal</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="number"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  placeholder="Amount (BDT)"
                  className="h-9 px-3 rounded-lg border border-[#D1D5DB] text-xs"
                />
                <select
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value as 'bKash' | 'Nagad' | 'Bank Transfer')}
                  className="h-9 px-2.5 rounded-lg border border-[#D1D5DB] text-xs"
                >
                  <option value="bKash">bKash Merchant</option>
                  <option value="Nagad">Nagad Merchant</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
                <input
                  type="text"
                  value={payoutAccount}
                  onChange={(e) => setPayoutAccount(e.target.value)}
                  placeholder="Account Number"
                  className="h-9 px-3 rounded-lg border border-[#D1D5DB] text-xs"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#F85606] text-white text-xs font-extrabold cursor-pointer"
              >
                Submit Withdrawal Request
              </button>
            </form>

            <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] space-y-2">
              <h2 className="text-sm font-extrabold">Payout Settlement History</h2>
              {sellerPayouts.length === 0 ? (
                <p className="text-xs text-[#6B7280]">No payout requests yet.</p>
              ) : (
                sellerPayouts.map((p) => (
                  <div key={p.id} className="p-2.5 rounded-lg bg-[#F9FAFB] flex items-center justify-between text-xs">
                    <span>
                      ৳{p.amount.toLocaleString('en-US')} via {p.method} ({p.accountNumber})
                    </span>
                    <span className="font-extrabold text-[#F85606]">{p.status}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 9: STORE KYC */}
        {tab === 'kyc' && (
          <form onSubmit={handleSubmitKyc} className="bg-white p-5 rounded-xl border border-[#E5E7EB] space-y-3 max-w-2xl">
            <h2 className="text-sm font-extrabold text-[#212121]">
              {lang === 'en' ? 'Become a Verified Marketplace Seller (KYC)' : 'নতুন সেলার স্টোর ও KYC ভেরিফিকেশন'}
            </h2>
            <p className="text-xs text-[#6B7280]">
              NID, Trade License ও ঠিকানা জমা দিলে সুপার এডমিন যাচাই করে আপনার স্টোর অনুমোদন করবেন।
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                required
                value={kycStoreName}
                onChange={(e) => setKycStoreName(e.target.value)}
                placeholder="Store Name (e.g. Rajshahi Mango & Gur House)"
                className="h-9 px-3 rounded-lg border border-[#D1D5DB] text-xs"
              />
              <input
                type="text"
                required
                value={kycLocation}
                onChange={(e) => setKycLocation(e.target.value)}
                placeholder="Hub Location (District, BD)"
                className="h-9 px-3 rounded-lg border border-[#D1D5DB] text-xs"
              />
              <input
                type="text"
                required
                value={kycPhone}
                onChange={(e) => setKycPhone(e.target.value)}
                placeholder="Business Phone (017...)"
                className="h-9 px-3 rounded-lg border border-[#D1D5DB] text-xs"
              />
              <input
                type="text"
                required
                value={kycNid}
                onChange={(e) => setKycNid(e.target.value)}
                placeholder="National ID (NID) Number"
                className="h-9 px-3 rounded-lg border border-[#D1D5DB] text-xs"
              />
              <input
                type="text"
                required
                value={kycTradeLicense}
                onChange={(e) => setKycTradeLicense(e.target.value)}
                placeholder="Trade License No."
                className="h-9 px-3 rounded-lg border border-[#D1D5DB] text-xs"
              />
              <input
                type="text"
                value={kycTinBin}
                onChange={(e) => setKycTinBin(e.target.value)}
                placeholder="TIN / BIN (Optional)"
                className="h-9 px-3 rounded-lg border border-[#D1D5DB] text-xs"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-[#F85606] text-white text-xs font-extrabold cursor-pointer hover:bg-[#D94802]"
            >
              Submit KYC &amp; Activate Store Profile
            </button>
          </form>
        )}
      </div>

      {/* Printable Shipping Label / Packing Slip Modal */}
      {printSlipOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 space-y-3 border border-[#E5E7EB]">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-extrabold">Shipping Label &amp; Handover Manifest</h3>
              <button type="button" onClick={() => setPrintSlipOrder(null)} className="text-xs font-bold underline cursor-pointer">
                Close
              </button>
            </div>
            <div className="p-3 border-2 border-dashed border-[#212121] rounded-lg space-y-1.5 text-xs">
              <p className="font-extrabold text-sm">{printSlipOrder.sellerName}</p>
              <p>Sub-Order: <strong>#{printSlipOrder.subOrderId}</strong> (Parent #{printSlipOrder.parentOrderId})</p>
              <p>Deliver To: <strong>{printSlipOrder.customerName}</strong> ({printSlipOrder.phone})</p>
              <p>{printSlipOrder.address}, {printSlipOrder.district}</p>
              <hr className="my-1.5" />
              <p className="font-bold">Items:</p>
              {printSlipOrder.items.map((it) => (
                <p key={`${it.productId}-${it.variantId}`}>
                  • {it.name} ({it.variantLabel}) × {it.quantity}
                </p>
              ))}
              <p className="font-extrabold text-[#F85606] pt-1">
                Subtotal: ৳{printSlipOrder.subtotal.toLocaleString('en-US')} · Shipping: ৳{printSlipOrder.shippingFee}
              </p>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="w-full py-2 rounded-lg bg-[#212121] text-white text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Print Label</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
