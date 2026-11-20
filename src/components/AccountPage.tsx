import { useMemo, useState } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import {
  ArrowLeft,
  MoreVertical,
  MessageSquare,
  Package,
  RotateCcw,
  XCircle,
  Heart,
  Ticket,
  Star,
  MapPin,
  CreditCard,
  User,
  Settings,
  FileText,
  HelpCircle,
  Headphones,
  LogOut,
  LogIn,
  Copy,
  Check,
  X,
  ShieldCheck,
  Truck,
  Smartphone,
  CheckCircle2,
  Building2,
  KeyRound,
  Coins,
  Store,
} from 'lucide-react';
import { ACTIVE_VOUCHERS, BRAND_INFO, DISTRICTS } from '../data/products';
import { getUpazilasByDistrict } from '../data/bangladeshLocations';
import {
  CustomerCrmRecord,
  OrderReceipt,
  SavedAddress,
  UserAccount,
  VoucherRecord,
} from '../types';
import { submitWholesaleApplicationByCustomer } from '../lib/storeDb';
import { MediaUploaderControl } from './MediaUploaderControl';
import { ResilientImage } from './ResilientImage';

interface AccountPageProps {
  account: UserAccount;
  orders: OrderReceipt[];
  addresses: SavedAddress[];
  wishlistCount: number;
  firebaseUser?: FirebaseUser | null;
  vouchers?: VoucherRecord[];
  customerCrmRecord?: CustomerCrmRecord | null;
  loyaltyCoins?: number;
  onBack: () => void;
  onUpdateAccount: (next: UserAccount) => void;
  onOpenOrderInfo: (order: OrderReceipt) => void;
  onOpenWishlist: () => void;
  onOpenAddAddress: () => void;
  onSelectDefaultAddress: (id: string) => void;
  onOpenAdmin: () => void;
  onOpenLoyalty?: () => void;
  onOpenSellerCenter?: () => void;
  onGoogleLogin?: () => Promise<void>;
  onGoogleLogout?: () => Promise<void>;
  onCancelOrder?: (orderId: string, reason: string) => Promise<void>;
  onRequestRefund?: (orderId: string, reason: string) => Promise<void>;
  onPhoneVerified?: (phone: string) => Promise<void>;
  onSaveUserDetails?: (next: UserAccount) => Promise<void>;
  onNotify: (msg: string) => void;
}

type SubDrawer =
  | null
  | 'orders'
  | 'returns'
  | 'cancellations'
  | 'vouchers'
  | 'addresses'
  | 'payments'
  | 'info'
  | 'policies'
  | 'wholesale'
  | 'login';

const STATUS_BADGE_MAP: Record<string, string> = {
  Pending: 'bg-[#FFF7ED] text-[#C2410C]',
  Confirmed: 'bg-[#EFF6FF] text-[#1D4ED8]',
  Processing: 'bg-[#F5F3FF] text-[#6D28D9]',
  'Ready to Ship': 'bg-[#EEF2FF] text-[#4338CA]',
  Shipped: 'bg-[#ECFEFF] text-[#0E7490]',
  Delivered: 'bg-[#ECFDF5] text-[#047857]',
  Cancelled: 'bg-[#FEF2F2] text-[#B91C1C]',
  Returned: 'bg-[#FEF3C7] text-[#92400E]',
  Refunded: 'bg-[#F3F4F6] text-[#374151]',
};

export function AccountPage({
  account,
  orders,
  addresses,
  wishlistCount,
  firebaseUser,
  vouchers,
  customerCrmRecord,
  loyaltyCoins = 0,
  onBack,
  onUpdateAccount,
  onOpenOrderInfo,
  onOpenWishlist,
  onOpenAddAddress,
  onSelectDefaultAddress,
  onOpenAdmin,
  onOpenLoyalty,
  onOpenSellerCenter,
  onGoogleLogin,
  onGoogleLogout,
  onCancelOrder,
  onRequestRefund,
  onPhoneVerified,
  onSaveUserDetails,
  onNotify,
}: AccountPageProps) {
  const [subDrawer, setSubDrawer] = useState<SubDrawer>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [loginName, setLoginName] = useState(
    firebaseUser?.displayName || account.username || 'khidmatulummahshopbd'
  );
  const [loginPhone, setLoginPhone] = useState(account.phone || BRAND_INFO.rawPhone);
  const [loginEmail, setLoginEmail] = useState(
    firebaseUser?.email || account.email || BRAND_INFO.email
  );
  const [avatarUrl, setAvatarUrl] = useState(
    account.avatarUrl || firebaseUser?.photoURL || ''
  );
  const [userDivision, setUserDivision] = useState(account.division || 'ঢাকা');
  const [userDistrict, setUserDistrict] = useState(account.district || 'ঢাকা');
  const [userUpazila, setUserUpazila] = useState(
    account.upazila || getUpazilasByDistrict('ঢাকা')[0] || 'মিরপুর'
  );
  const [userAddress, setUserAddress] = useState(account.address || '');
  const [userGender, setUserGender] = useState<UserAccount['gender']>(account.gender || '');
  const [userDob, setUserDob] = useState(account.dateOfBirth || '');
  const [userBio, setUserBio] = useState(account.bio || '');
  const [savingProfile, setSavingProfile] = useState(false);

  const upazilaOptions = useMemo(
    () => getUpazilasByDistrict(userDistrict),
    [userDistrict]
  );

  // Wholesale application form
  const [wholesaleBusiness, setWholesaleBusiness] = useState(
    customerCrmRecord?.businessName || ''
  );
  const [wholesaleNotes, setWholesaleNotes] = useState(customerCrmRecord?.notes || '');
  const [wholesaleBusy, setWholesaleBusy] = useState(false);

  // OTP state
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpPreviewHint, setOtpPreviewHint] = useState<string | null>(null);
  const [otpBusy, setOtpBusy] = useState(false);

  // Cancel / Refund inline forms
  const [actionOrderId, setActionOrderId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'cancel' | 'refund' | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [actionBusy, setActionBusy] = useState(false);

  const liveVouchers = useMemo(() => {
    if (vouchers && vouchers.length > 0) {
      return vouchers.filter((v) => v.active);
    }
    return ACTIVE_VOUCHERS.map((v) => ({ ...v, active: true }));
  }, [vouchers]);

  const cancelledOrders = useMemo(
    () => orders.filter((o) => o.status === 'Cancelled'),
    [orders]
  );

  const returnOrders = useMemo(
    () =>
      orders.filter(
        (o) => o.status === 'Returned' || o.status === 'Refunded' || Boolean(o.refundRequested)
      ),
    [orders]
  );

  const handleCopyVoucher = (code: string) => {
    navigator.clipboard?.writeText(code).catch(() => undefined);
    setCopiedCode(code);
    onNotify(`ভাউচার কোড ${code} কপি হয়েছে!`);
    setTimeout(() => setCopiedCode(null), 1800);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserAccount = {
      ...account,
      isLoggedIn: true,
      username: loginName.trim() || 'khidmatulummahshopbd',
      phone: loginPhone.trim() || BRAND_INFO.rawPhone,
      email: loginEmail.trim() || BRAND_INFO.email,
      avatarUrl: avatarUrl.trim(),
      division: userDivision,
      district: userDistrict,
      upazila: userUpazila,
      address: userAddress.trim(),
      gender: userGender,
      dateOfBirth: userDob,
      bio: userBio.trim(),
    };
    setSavingProfile(true);
    try {
      onUpdateAccount(updated);
      if (onSaveUserDetails) {
        await onSaveUserDetails(updated);
      }
      setSubDrawer(null);
      onNotify('আপনার প্রোফাইল ও বিস্তারিত তথ্য সেভ হয়েছে!');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSendOtp = async () => {
    const cleanPhone = loginPhone.trim();
    if (!cleanPhone) {
      onNotify('সঠিক মোবাইল নম্বর লিখুন।');
      return;
    }
    setOtpBusy(true);
    try {
      const res = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        previewOtp?: string;
        message?: string;
      };
      if (!res.ok || !data.ok) {
        onNotify(data.error || 'OTP পাঠানো যায়নি।');
        return;
      }
      setOtpSent(true);
      setOtpPreviewHint(data.previewOtp ?? null);
      onNotify(data.message || 'OTP কোড পাঠানো হয়েছে!');
    } catch {
      onNotify('OTP সার্ভারে সংযোগ করা যায়নি।');
    } finally {
      setOtpBusy(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode.trim()) {
      onNotify('OTP কোড লিখুন।');
      return;
    }
    setOtpBusy(true);
    try {
      const res = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: loginPhone.trim(), code: otpCode.trim() }),
      });
      const data = (await res.json()) as { ok?: boolean; verified?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        onNotify(data.error || 'OTP যাচাই ব্যর্থ হয়েছে।');
        return;
      }
      onUpdateAccount({
        ...account,
        isLoggedIn: true,
        phone: loginPhone.trim(),
        phoneVerified: true,
      });
      if (onPhoneVerified) {
        await onPhoneVerified(loginPhone.trim());
      }
      setOtpSent(false);
      setOtpCode('');
      setOtpPreviewHint(null);
      onNotify('মোবাইল নম্বর OTP ভেরিফাই সম্পন্ন হয়েছে!');
    } catch {
      onNotify('OTP যাচাই করতে সমস্যা হয়েছে।');
    } finally {
      setOtpBusy(false);
    }
  };

  const handleSubmitOrderAction = async () => {
    if (!actionOrderId || !actionType) return;
    const reason = actionReason.trim() || (actionType === 'cancel' ? 'Customer requested cancellation' : 'Quality or damage issue');
    setActionBusy(true);
    try {
      if (actionType === 'cancel' && onCancelOrder) {
        await onCancelOrder(actionOrderId, reason);
      } else if (actionType === 'refund' && onRequestRefund) {
        await onRequestRefund(actionOrderId, reason);
      }
      setActionOrderId(null);
      setActionType(null);
      setActionReason('');
    } finally {
      setActionBusy(false);
    }
  };

  const handleWholesaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser?.emailVerified) {
      onNotify('পাইকারি পার্টনার আবেদনের জন্য প্রথমে Google Login করুন।');
      return;
    }
    if (!wholesaleBusiness.trim()) {
      onNotify('আপনার ব্যবসা বা প্রতিষ্ঠানের নাম লিখুন।');
      return;
    }
    setWholesaleBusy(true);
    try {
      await submitWholesaleApplicationByCustomer(
        firebaseUser,
        loginName.trim() || firebaseUser.displayName || 'Wholesale Applicant',
        loginPhone.trim() || BRAND_INFO.rawPhone,
        wholesaleBusiness.trim(),
        wholesaleNotes.trim()
      );
      onNotify('পাইকারি / B2B পার্টনার আবেদন সফলভাবে জমা হয়েছে!');
    } catch {
      onNotify('আবেদন জমা দিতে সমস্যা হয়েছে।');
    } finally {
      setWholesaleBusy(false);
    }
  };

  const loggedInItems = [
    {
      icon: MessageSquare,
      label: 'Message Support',
      badge: 'WhatsApp',
      href: BRAND_INFO.whatsappUrl,
      action: undefined as (() => void) | undefined,
    },
    {
      icon: Package,
      label: 'My Orders',
      badge: orders.length > 0 ? `${orders.length}` : undefined,
      action: () => setSubDrawer('orders'),
    },
    {
      icon: RotateCcw,
      label: 'My Returns & Refunds',
      badge: returnOrders.length > 0 ? `${returnOrders.length}` : undefined,
      action: () => setSubDrawer('returns'),
    },
    {
      icon: XCircle,
      label: 'My Cancellations',
      badge: cancelledOrders.length > 0 ? `${cancelledOrders.length}` : undefined,
      action: () => setSubDrawer('cancellations'),
    },
    {
      icon: Heart,
      label: 'My Wishlist & Followed Stores',
      badge: wishlistCount > 0 ? `${wishlistCount}` : undefined,
      action: onOpenWishlist,
    },
    {
      icon: Ticket,
      label: 'Vouchers',
      badge: `${liveVouchers.length} Active`,
      action: () => setSubDrawer('vouchers'),
    },
    {
      icon: Star,
      label: 'My Reviews',
      action: () => {
        onBack();
        setTimeout(() => {
          document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' });
        }, 120);
      },
    },
    {
      icon: MapPin,
      label: 'Address Book',
      badge: addresses.length > 0 ? `${addresses.length}` : undefined,
      action: () => setSubDrawer('addresses'),
    },
    {
      icon: CreditCard,
      label: 'My Payment Options',
      action: () => setSubDrawer('payments'),
    },
    {
      icon: User,
      label: 'Account Information & OTP',
      badge: account.phoneVerified ? 'Verified' : 'Verify OTP',
      href: undefined as string | undefined,
      action: () => setSubDrawer('info'),
    },
    {
      icon: Building2,
      label: 'Wholesale Partner / B2B',
      badge: customerCrmRecord?.wholesaleApproved
        ? 'Approved'
        : customerCrmRecord?.wholesaleRequested
          ? 'Pending'
          : 'Apply',
      href: undefined as string | undefined,
      action: () => setSubDrawer('wholesale'),
    },
  ];

  const guestSupportItems = [
    {
      icon: FileText,
      label: 'Policies',
      href: undefined as string | undefined,
      action: () => setSubDrawer('policies'),
    },
    {
      icon: MessageSquare,
      label: 'Feedback',
      href: undefined as string | undefined,
      action: () => onNotify('আপনার মূল্যবান মতামতের জন্য ধন্যবাদ!'),
    },
    {
      icon: HelpCircle,
      label: 'Help & FAQ',
      href: undefined as string | undefined,
      action: () => {
        onBack();
        setTimeout(() => {
          document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' });
        }, 120);
      },
    },
    {
      icon: Headphones,
      label: 'Chat with us',
      href: BRAND_INFO.whatsappUrl,
      action: undefined as (() => void) | undefined,
    },
  ];

  const renderOrdersList = (list: OrderReceipt[], emptyMessage: string) => {
    if (list.length === 0) {
      return <p className="text-center text-[#757575] py-6">{emptyMessage}</p>;
    }
    return list.map((order) => {
      const badgeCls = STATUS_BADGE_MAP[order.status] ?? 'bg-[#F5F5F5] text-[#424242]';
      const canCancel = order.status === 'Pending' && Boolean(order.userId) && Boolean(onCancelOrder);
      const canRefund =
        order.status === 'Delivered' &&
        !order.refundRequested &&
        Boolean(order.userId) &&
        Boolean(onRequestRefund);

      return (
        <div
          key={order.orderId}
          className="p-3 rounded-lg border border-[#EAEAEA] bg-[#FAFAFA] space-y-2"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono font-bold text-[#212121]">#{order.orderId}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeCls}`}>
              {order.status}
            </span>
          </div>

          <p className="text-[#616161]">
            {order.address} {order.upazila ? `(${order.upazila}, ${order.district})` : ''}
          </p>

          {(order.courierProvider || order.consignmentId) && (
            <div className="p-2 rounded bg-[#ECFDF5] border border-[#A7F3D0] text-[11px] text-[#065F46] flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 shrink-0" />
              <span>
                {order.courierProvider || 'Courier'} · Tracking:{' '}
                <strong className="font-mono">{order.trackingCode || order.consignmentId}</strong>
              </span>
            </div>
          )}

          {order.refundRequested && (
            <div className="p-2 rounded bg-[#FEF3C7] text-[11px] text-[#92400E] font-medium">
              রিফান্ড অনুরোধ পাঠানো হয়েছে: {order.refundReason}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-[#E7EDFF]">
            <span className="font-mono font-bold text-[#663CBC]">
              ৳{order.total.toLocaleString('en-US')}
            </span>

            <div className="flex items-center gap-1.5">
              {canCancel && (
                <button
                  type="button"
                  onClick={() => {
                    setActionOrderId(order.orderId);
                    setActionType('cancel');
                    setActionReason('');
                  }}
                  className="px-2 py-1 rounded border border-[#FCA5A5] text-[#B91C1C] font-bold cursor-pointer hover:bg-[#FEF2F2]"
                >
                  Cancel
                </button>
              )}

              {canRefund && (
                <button
                  type="button"
                  onClick={() => {
                    setActionOrderId(order.orderId);
                    setActionType('refund');
                    setActionReason('');
                  }}
                  className="px-2 py-1 rounded border border-[#C4B5FD] text-[#663CBC] font-bold cursor-pointer hover:bg-[#F5F3FF]"
                >
                  Refund
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setSubDrawer(null);
                  onOpenOrderInfo(order);
                }}
                className="px-2.5 py-1 rounded ot-gradient-btn text-white font-bold cursor-pointer"
              >
                Invoice / Details →
              </button>
            </div>
          </div>

          {actionOrderId === order.orderId && actionType && (
            <div className="pt-2 border-t border-[#E7EDFF] space-y-2">
              <input
                type="text"
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder={
                  actionType === 'cancel'
                    ? 'অর্ডার বাতিলের কারণ লিখুন...'
                    : 'রিফান্ড বা রিটার্নের কারণ লিখুন...'
                }
                className="w-full h-8 px-2.5 rounded border border-[#DDDDEF] bg-white text-xs outline-none focus:border-[#663CBC]"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActionOrderId(null);
                    setActionType(null);
                  }}
                  className="px-2.5 py-1 rounded border border-[#D4D8DD] text-[11px] font-semibold cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={actionBusy}
                  onClick={() => void handleSubmitOrderAction()}
                  className="px-3 py-1 rounded bg-[#DC2626] text-white text-[11px] font-bold cursor-pointer"
                >
                  {actionBusy
                    ? 'Submitting...'
                    : actionType === 'cancel'
                      ? 'Confirm Cancel'
                      : 'Submit Refund'}
                </button>
              </div>
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="min-h-screen site-canvas text-[#081149] flex flex-col">
      {/* Royal Violet & Navy Top Header */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-[#081149] via-[#4C2A9B] to-[#663CBC] text-white">
        <div className="max-w-[720px] mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              aria-label="Back"
              className="p-1.5 rounded-full hover:bg-white/15 cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-base sm:text-lg font-medium">My Account</h1>
          </div>
          <button
            type="button"
            onClick={() =>
              onUpdateAccount({
                ...account,
                isLoggedIn: !account.isLoggedIn,
              })
            }
            title="Switch Guest / Logged-in View"
            className="p-1.5 rounded-full hover:bg-white/15 cursor-pointer"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-[720px] w-full mx-auto pb-8">
        {/* Greeting + Avatar + Google Login / Phone Verification Strip */}
        <div className="bg-white px-4 py-3.5 border-b border-[#EEEEEE] flex flex-wrap items-center justify-between gap-3">
          {account.isLoggedIn ? (
            <>
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => setSubDrawer('info')}
                  className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#663CBC]/40 bg-[#F5F3FF] text-[#663CBC] font-extrabold text-base flex items-center justify-center shrink-0 cursor-pointer"
                  title="Edit Profile Photo & Details"
                >
                  {account.avatarUrl || firebaseUser?.photoURL ? (
                    <ResilientImage
                      src={account.avatarUrl || firebaseUser?.photoURL || ''}
                      alt={account.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{(firebaseUser?.displayName || account.username || 'U').slice(0, 2).toUpperCase()}</span>
                  )}
                </button>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm text-[#212121] font-bold truncate">
                      Hello, {firebaseUser?.displayName || account.username}
                    </p>
                    {account.phoneVerified && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-[#ECFDF5] text-[#047857] text-[10px] font-bold">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>OTP Verified</span>
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#757575] font-mono truncate">
                    {account.phone} · {firebaseUser?.email || account.email}
                  </p>
                  {(account.district || account.address) && (
                    <p className="text-[11px] text-[#6B7280] truncate">
                      📍 {[account.address, account.upazila, account.district].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!firebaseUser && onGoogleLogin ? (
                  <button
                    type="button"
                    onClick={() => void onGoogleLogin()}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-[#EFF6FF] border border-[#BFDBFE] text-xs font-bold text-[#1D4ED8] hover:bg-[#DBEAFE] cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Google Sync</span>
                  </button>
                ) : firebaseUser && onGoogleLogout ? (
                  <button
                    type="button"
                    onClick={() => void onGoogleLogout()}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-[#DDDDEF] text-xs font-semibold text-[#5E6484] hover:text-[#663CBC] cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Google Sign Out</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onUpdateAccount({ ...account, isLoggedIn: false })}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-[#DDDDEF] text-xs font-semibold text-[#5E6484] hover:text-[#663CBC] cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Logout</span>
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-[#3C4266]">Hello, Welcome to খিদমাতুল উম্মাহ!</p>
              <div className="flex items-center gap-2">
                {onGoogleLogin && (
                  <button
                    type="button"
                    onClick={() => void onGoogleLogin()}
                    className="px-3 py-2 rounded-lg bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE] text-xs font-bold cursor-pointer"
                  >
                    Google Login
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSubDrawer('login')}
                  className="px-4 py-2 rounded-lg ot-gradient-btn text-white text-xs font-bold tracking-wide cursor-pointer shrink-0"
                >
                  LOGIN / SIGNUP
                </button>
              </div>
            </>
          )}
        </div>

        {/* Loyalty Coins & Marketplace Seller Entry Cards */}
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 px-0">
          {onOpenLoyalty && (
            <div className="bg-white px-4 py-3 border-y sm:border border-[#EEEEEE] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-9 h-9 rounded-lg bg-[#FFFBEB] text-[#D97706] flex items-center justify-center shrink-0">
                  <Coins className="w-5 h-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-extrabold text-[#212121] flex items-center gap-1.5">
                    <span>Loyalty Coins</span>
                    <span className="px-1.5 py-0.5 rounded bg-[#FEF3C7] text-[#B45309] font-mono text-[10px]">
                      {loyaltyCoins.toLocaleString('en-US')}
                    </span>
                  </p>
                  <p className="text-[11px] text-[#757575] truncate">
                    Daily Check-in, Lucky Wheel &amp; Vouchers
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenLoyalty}
                className="px-3 py-1.5 rounded-md bg-[#F59E0B] hover:bg-[#D97706] text-white text-xs font-bold cursor-pointer shrink-0"
              >
                Open Spin &amp; Coins
              </button>
            </div>
          )}

          {onOpenSellerCenter && (
            <div className="bg-white px-4 py-3 border-y sm:border border-[#EEEEEE] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-9 h-9 rounded-lg bg-[#ECFDF5] text-[#047857] flex items-center justify-center shrink-0">
                  <Store className="w-5 h-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-extrabold text-[#212121]">
                    Marketplace Seller Center
                  </p>
                  <p className="text-[11px] text-[#757575] truncate">
                    বিক্রেতা হিসেবে যোগ দিন ও প্রোডাক্ট সেল করুন (#seller)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenSellerCenter}
                className="px-3 py-1.5 rounded-md bg-[#047857] hover:bg-[#065F46] text-white text-xs font-bold cursor-pointer shrink-0"
              >
                Become a Seller
              </button>
            </div>
          )}
        </div>

        {/* Admin Dashboard Entry Card */}
        <div className="mt-2 bg-white px-4 py-3 border-y border-[#EEEEEE] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-[#F5F3FF] text-[#6C3CE9] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <div>
              <p className="text-xs font-extrabold text-[#212121]">
                Admin Dashboard · অ্যাডমিন প্যানেল
              </p>
              <p className="text-[11px] text-[#757575]">
                অর্ডার, কুরিয়ার, পেমেন্ট ও ডাটাবেজ পরিচালনা (#admin)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenAdmin}
            className="px-3.5 py-1.5 rounded-md bg-[#6C3CE9] hover:bg-[#5B21B6] text-white text-xs font-bold cursor-pointer shrink-0"
          >
            Open Admin
          </button>
        </div>

        {/* Account List Rows */}
        {account.isLoggedIn ? (
          <>
            <div className="mt-2 bg-white divide-y divide-[#F0F0F0] border-y border-[#EEEEEE]">
              {loggedInItems.map((item) => {
                const Icon = item.icon;
                if (item.href) {
                  return (
                    <a
                      key={item.label}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-[#FAFAFA] transition-colors text-left"
                    >
                      <div className="flex items-center gap-4">
                        <Icon className="w-5 h-5 text-[#757575]" strokeWidth={1.6} />
                        <span className="text-sm text-[#212121]">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="px-2 py-0.5 rounded-full bg-[#F5F3FF] text-[#663CBC] text-[11px] font-bold">
                          {item.badge}
                        </span>
                      )}
                    </a>
                  );
                }
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={item.action}
                    className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-[#F4F7FF] transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <Icon className="w-5 h-5 text-[#5E6484]" strokeWidth={1.6} />
                      <span className="text-sm text-[#081149]">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="px-2 py-0.5 rounded-full bg-[#F5F3FF] text-[#663CBC] text-[11px] font-bold">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-2.5 bg-white divide-y divide-[#E7EDFF] border-y border-[#DDDDEF]">
              <button
                type="button"
                onClick={() => setSubDrawer('info')}
                className="w-full px-4 py-3.5 flex items-center gap-4 hover:bg-[#F4F7FF] text-left cursor-pointer"
              >
                <Settings className="w-5 h-5 text-[#5E6484]" strokeWidth={1.6} />
                <span className="text-sm text-[#081149]">Setting &amp; OTP Verification</span>
              </button>
              {guestSupportItems.map((item) => {
                const Icon = item.icon;
                if (item.href) {
                  return (
                    <a
                      key={item.label}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full px-4 py-3.5 flex items-center gap-4 hover:bg-[#F4F7FF] text-left"
                    >
                      <Icon className="w-5 h-5 text-[#5E6484]" strokeWidth={1.6} />
                      <span className="text-sm text-[#081149]">{item.label}</span>
                    </a>
                  );
                }
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={item.action}
                    className="w-full px-4 py-3.5 flex items-center gap-4 hover:bg-[#F4F7FF] text-left cursor-pointer"
                  >
                    <Icon className="w-5 h-5 text-[#5E6484]" strokeWidth={1.6} />
                    <span className="text-sm text-[#081149]">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <div className="mt-2 bg-white divide-y divide-[#E7EDFF] border-y border-[#DDDDEF]">
              <button
                type="button"
                onClick={() => setSubDrawer('orders')}
                className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-[#F4F7FF] text-left cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <Package className="w-5 h-5 text-[#5E6484]" strokeWidth={1.6} />
                  <span className="text-sm text-[#081149]">My Orders</span>
                </div>
                {orders.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-[#F5F3FF] text-[#663CBC] text-[11px] font-bold">
                    {orders.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={onOpenWishlist}
                className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-[#F4F7FF] text-left cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <Heart className="w-5 h-5 text-[#5E6484]" strokeWidth={1.6} />
                  <span className="text-sm text-[#081149]">My Wishlist &amp; Followed Stores</span>
                </div>
                {wishlistCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-[#F5F3FF] text-[#663CBC] text-[11px] font-bold">
                    {wishlistCount}
                  </span>
                )}
              </button>
            </div>

            <div className="mt-2.5 bg-white divide-y divide-[#F0F0F0] border-y border-[#EEEEEE]">
              <button
                type="button"
                onClick={() => setSubDrawer('wholesale')}
                className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-[#FAFAFA] text-left cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <Building2 className="w-5 h-5 text-[#757575]" strokeWidth={1.6} />
                  <span className="text-sm text-[#212121]">Wholesale Partner / B2B</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#047857] text-[11px] font-bold">
                  Apply
                </span>
              </button>
              {guestSupportItems.map((item) => {
                const Icon = item.icon;
                if (item.href) {
                  return (
                    <a
                      key={item.label}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full px-4 py-3.5 flex items-center gap-4 hover:bg-[#FAFAFA] text-left"
                    >
                      <Icon className="w-5 h-5 text-[#757575]" strokeWidth={1.6} />
                      <span className="text-sm text-[#212121]">{item.label}</span>
                    </a>
                  );
                }
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={item.action}
                    className="w-full px-4 py-3.5 flex items-center gap-4 hover:bg-[#FAFAFA] text-left cursor-pointer"
                  >
                    <Icon className="w-5 h-5 text-[#757575]" strokeWidth={1.6} />
                    <span className="text-sm text-[#212121]">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </main>

      {/* Interactive Sub-Modal */}
      {subDrawer && (
        <div
          className="fixed inset-0 z-50 bg-black/55 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setSubDrawer(null)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-2xl overflow-hidden shadow-2xl border border-[#DDDDEF] max-h-[88vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3.5 bg-gradient-to-r from-[#081149] via-[#4C2A9B] to-[#663CBC] text-white flex items-center justify-between">
              <h2 className="text-sm font-bold">
                {subDrawer === 'orders' && 'My Orders'}
                {subDrawer === 'returns' && 'My Returns & Refund Requests'}
                {subDrawer === 'cancellations' && 'Cancelled Orders'}
                {subDrawer === 'vouchers' && 'Available Vouchers'}
                {subDrawer === 'addresses' && 'Address Book'}
                {subDrawer === 'payments' && 'My Payment Options'}
                {subDrawer === 'policies' && 'Return & Quality Policies'}
                {subDrawer === 'wholesale' && 'Wholesale Partner / B2B Program'}
                {(subDrawer === 'info' || subDrawer === 'login') &&
                  'Account Information & Mobile OTP'}
              </h2>
              <button
                type="button"
                onClick={() => setSubDrawer(null)}
                className="p-1 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 text-xs">
              {subDrawer === 'orders' &&
                renderOrdersList(
                  orders,
                  'এখনো কোনো অর্ডার করা হয়নি। অর্ডার করার পর এখানে ইনভয়েস দেখতে পারবেন।'
                )}

              {subDrawer === 'returns' &&
                renderOrdersList(
                  returnOrders,
                  'কোনো রিটার্ন বা রিফান্ড অনুরোধ নেই। ডেলিভার্ড অর্ডারে Refund বাটনে ক্লিক করে আবেদন করতে পারবেন।'
                )}

              {subDrawer === 'cancellations' &&
                renderOrdersList(
                  cancelledOrders,
                  'কোনো বাতিলকৃত অর্ডার নেই। Pending অর্ডার প্রয়োজন হলে Cancel করতে পারবেন।'
                )}

              {subDrawer === 'vouchers' &&
                liveVouchers.map((v) => (
                  <div
                    key={v.code}
                    className="p-3 rounded-xl border border-[#663CBC]/30 bg-[#F5F3FF] flex items-center justify-between gap-2"
                  >
                    <div>
                      <p className="font-mono text-sm font-extrabold text-[#663CBC]">{v.code}</p>
                      <p className="font-semibold text-[#081149] mt-0.5">{v.title}</p>
                      <p className="text-[11px] text-[#5E6484]">
                        ৳{v.discount} ছাড় · Min Spend ৳{v.minSpend} · {v.expiry}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyVoucher(v.code)}
                      className="px-3 py-1.5 rounded-lg ot-gradient-btn text-white font-bold flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      {copiedCode === v.code ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedCode === v.code ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                ))}

              {subDrawer === 'addresses' && (
                <>
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      onClick={() => {
                        onSelectDefaultAddress(addr.id);
                        onNotify('ডিফল্ট ডেলিভারি ঠিকানা আপডেট হয়েছে');
                      }}
                      className={`p-3 rounded-xl border cursor-pointer space-y-1 ${
                        addr.isDefaultShipping
                          ? 'border-[#663CBC] bg-[#F5F3FF]'
                          : 'border-[#DDDDEF] bg-[#F4F7FF]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#081149]">
                          {addr.fullName} · <span className="font-mono">{addr.phone}</span>
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-[#663CBC] text-white text-[10px] font-bold">
                          {addr.label}
                        </span>
                      </div>
                      <p className="text-[#5E6484]">
                        {addr.address}, {addr.zone}, {addr.city}, {addr.division}
                      </p>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setSubDrawer(null);
                      onOpenAddAddress();
                    }}
                    className="w-full py-2.5 rounded-xl ot-gradient-btn text-white font-bold cursor-pointer"
                  >
                    + Add New Address
                  </button>
                </>
              )}

              {subDrawer === 'payments' && (
                <div className="space-y-2.5">
                  <div className="p-3 rounded-xl border border-[#663CBC]/35 bg-[#F4F7FF]">
                    <p className="font-bold text-[#212121]">Cash on Delivery (Default)</p>
                    <p className="text-[#616161] mt-0.5">
                      পণ্য হাতে পেয়ে সিল যাচাই করে মূল্য পরিশোধ করুন।
                    </p>
                  </div>
                  <div className="p-3 rounded border border-[#EAEAEA]">
                    <p className="font-bold text-[#E2136E]">bKash / Nagad / Rocket Merchant</p>
                    <p className="font-mono text-[#212121] mt-0.5">{BRAND_INFO.phone}</p>
                  </div>
                  <div className="p-3 rounded border border-[#EAEAEA]">
                    <p className="font-bold text-[#1D4ED8]">SSLCommerz Online Cards / MFS</p>
                    <p className="text-[#616161] mt-0.5">
                      Visa, Mastercard, DBBL Nexus ও মোবাইল ব্যাংকিং সাপোর্টেড।
                    </p>
                  </div>
                </div>
              )}

              {subDrawer === 'policies' && (
                <div className="space-y-2 text-[#424242] leading-relaxed">
                  <p>
                    <strong>১০০% খাঁটি পণ্যের নিশ্চয়তা:</strong> চুয়াডাঙ্গার গাছিদের নিজস্ব রস
                    থেকে মাটির চুলায় তৈরি খাঁটি গুড় এবং শতভাগ অর্গানিক মধু, ঘি ও তেল।
                  </p>
                  <p>
                    <strong>৭ দিনের রিটার্ন সুবিধা:</strong> কোনো ভেজাল বা গুণগত ত্রুটি প্রমাণিত
                    হলে ৭ দিনের মধ্যে সম্পূর্ণ মূল্য ফেরত পাবেন।
                  </p>
                </div>
              )}

              {subDrawer === 'wholesale' && (
                <div className="space-y-3">
                  {customerCrmRecord && (
                    <div
                      className={`p-3 rounded-lg border ${
                        customerCrmRecord.wholesaleApproved
                          ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#047857]'
                          : 'bg-[#FFF7ED] border-[#FDBA74] text-[#C2410C]'
                      }`}
                    >
                      <p className="font-bold text-xs">
                        {customerCrmRecord.wholesaleApproved
                          ? 'আপনার পাইকারি / B2B একাউন্ট অনুমোদিত হয়েছে!'
                          : 'আপনার পাইকারি আবেদন রিভিউ পর্যায়ে রয়েছে (Pending Approval)'}
                      </p>
                      {customerCrmRecord.businessName && (
                        <p className="text-[11px] mt-0.5">
                          প্রতিষ্ঠান: {customerCrmRecord.businessName}
                        </p>
                      )}
                    </div>
                  )}

                  {!firebaseUser?.emailVerified ? (
                    <div className="p-3 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] space-y-2.5">
                      <p className="font-bold text-[#1E3A8A]">
                        পাইকারি রেট পেতে Google একাউন্ট দিয়ে সাইন-ইন করুন
                      </p>
                      <p className="text-[11px] text-[#1D4ED8]">
                        ডিলার ও পাইকারি ক্রেতারা কমপক্ষে ৫ কেজি অর্ডারে বিশেষ হোলসেল ডিসকাউন্ট পাবেন।
                      </p>
                      {onGoogleLogin && (
                        <button
                          type="button"
                          onClick={() => void onGoogleLogin()}
                          className="w-full h-9 rounded bg-[#1D4ED8] text-white font-bold flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <LogIn className="w-4 h-4" />
                          <span>Google Sign-In করে আবেদন করুন</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <form onSubmit={handleWholesaleSubmit} className="space-y-2.5">
                      <div>
                        <label className="block font-bold mb-1">Business / Shop Name *</label>
                        <input
                          type="text"
                          required
                          value={wholesaleBusiness}
                          onChange={(e) => setWholesaleBusiness(e.target.value)}
                          placeholder="যেমন: মদিনা সুপার শপ / অনলাইন স্টোর"
                          className="w-full h-9 px-3 rounded border border-[#DADADA]"
                        />
                      </div>
                      <div>
                        <label className="block font-bold mb-1">Contact Phone</label>
                        <input
                          type="tel"
                          value={loginPhone}
                          onChange={(e) => setLoginPhone(e.target.value)}
                          className="w-full h-9 px-3 rounded border border-[#DADADA] font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-bold mb-1">Estimated Monthly Volume / Notes</label>
                        <textarea
                          rows={3}
                          value={wholesaleNotes}
                          onChange={(e) => setWholesaleNotes(e.target.value)}
                          placeholder="কোন পণ্য কত কেজি লাগবে তা লিখুন..."
                          className="w-full p-2.5 rounded border border-[#DADADA]"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={wholesaleBusy}
                        className="w-full h-10 rounded bg-[#008916] hover:bg-[#047857] text-white font-bold cursor-pointer"
                      >
                        {wholesaleBusy ? 'Submitting...' : 'Submit Wholesale Application'}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {(subDrawer === 'info' || subDrawer === 'login') && (
                <div className="space-y-4">
                  <form onSubmit={handleSaveProfile} className="space-y-3">
                    <MediaUploaderControl
                      mode="single-image"
                      label="প্রোফাইল ফটো / অবতার আপলোড"
                      helperText="আপনার নিজের ছবি আপলোড করুন (JPG / PNG / WebP)"
                      singleUrl={avatarUrl}
                      onSingleUrlChange={setAvatarUrl}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block font-bold mb-1">Full Name / Username *</label>
                        <input
                          type="text"
                          required
                          value={loginName}
                          onChange={(e) => setLoginName(e.target.value)}
                          className="w-full h-9 px-3 rounded border border-[#DADADA]"
                        />
                      </div>
                      <div>
                        <label className="block font-bold mb-1">Email</label>
                        <input
                          type="email"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          className="w-full h-9 px-3 rounded border border-[#DADADA]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold mb-1">Phone Number</label>
                      <div className="flex gap-2">
                        <input
                          type="tel"
                          value={loginPhone}
                          onChange={(e) => setLoginPhone(e.target.value)}
                          className="flex-1 h-9 px-3 rounded border border-[#DADADA] font-mono"
                        />
                        <button
                          type="button"
                          disabled={otpBusy}
                          onClick={() => void handleSendOtp()}
                          className="px-3 h-9 rounded bg-[#6C3CE9] hover:bg-[#5B21B6] text-white font-bold inline-flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          <Smartphone className="w-3.5 h-3.5" />
                          <span>{otpBusy ? '...' : 'Send OTP'}</span>
                        </button>
                      </div>
                    </div>

                    {otpSent && (
                      <div className="p-3 rounded-lg bg-[#F5F3FF] border border-[#DDD6FE] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#5B21B6]">OTP Verification Code</span>
                          {otpPreviewHint && (
                            <span className="font-mono font-bold text-[11px] bg-white px-2 py-0.5 rounded border border-[#DDD6FE] text-[#5B21B6]">
                              Test Code: {otpPreviewHint}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value)}
                            placeholder="6-digit OTP"
                            className="flex-1 h-8 px-2.5 rounded border border-[#C4B5FD] bg-white font-mono"
                          />
                          <button
                            type="button"
                            disabled={otpBusy}
                            onClick={() => void handleVerifyOtp()}
                            className="px-3 h-8 rounded bg-[#008916] text-white font-bold cursor-pointer"
                          >
                            Verify OTP
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block font-bold mb-1">বিভাগ (Division)</label>
                        <select
                          value={userDivision}
                          onChange={(e) => setUserDivision(e.target.value)}
                          className="w-full h-9 px-2.5 rounded border border-[#DADADA] bg-white"
                        >
                          {['ঢাকা', 'চট্টগ্রাম', 'রাজশাহী', 'খুলনা', 'বরিশাল', 'সিলেট', 'রংপুর', 'ময়মনসিংহ'].map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold mb-1">জেলা (District)</label>
                        <select
                          value={userDistrict}
                          onChange={(e) => {
                            const dist = e.target.value;
                            setUserDistrict(dist);
                            setUserUpazila(getUpazilasByDistrict(dist)[0] || 'সদর');
                          }}
                          className="w-full h-9 px-2.5 rounded border border-[#DADADA] bg-white"
                        >
                          {DISTRICTS.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold mb-1">থানা / উপজেলা</label>
                        <select
                          value={userUpazila}
                          onChange={(e) => setUserUpazila(e.target.value)}
                          className="w-full h-9 px-2.5 rounded border border-[#DADADA] bg-white"
                        >
                          {upazilaOptions.map((u) => (
                            <option key={u} value={u}>
                              {u}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold mb-1">বিস্তারিত ঠিকানা (Street / House / Road)</label>
                      <input
                        type="text"
                        value={userAddress}
                        onChange={(e) => setUserAddress(e.target.value)}
                        placeholder="বাসা নং, রোড, এলাকা..."
                        className="w-full h-9 px-3 rounded border border-[#DADADA]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block font-bold mb-1">Gender</label>
                        <select
                          value={userGender}
                          onChange={(e) => setUserGender(e.target.value as UserAccount['gender'])}
                          className="w-full h-9 px-2.5 rounded border border-[#DADADA] bg-white"
                        >
                          <option value="">নির্বাচন করুন</option>
                          <option value="Male">পুরুষ (Male)</option>
                          <option value="Female">মহিলা (Female)</option>
                          <option value="Prefer not to say">অন্যান্য</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold mb-1">জন্ম তারিখ (Date of Birth)</label>
                        <input
                          type="date"
                          value={userDob}
                          onChange={(e) => setUserDob(e.target.value)}
                          className="w-full h-9 px-3 rounded border border-[#DADADA]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold mb-1">Personal Note / Delivery Preference</label>
                      <textarea
                        rows={2}
                        value={userBio}
                        onChange={(e) => setUserBio(e.target.value)}
                        placeholder="যেমন: অফিস টাইমের পর ডেলিভারি নিলে সুবিধা হয়..."
                        className="w-full p-2.5 rounded border border-[#DADADA]"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="w-full h-10 rounded-xl ot-gradient-btn text-white font-bold cursor-pointer"
                    >
                      {savingProfile
                        ? 'Saving Details...'
                        : subDrawer === 'login'
                          ? 'LOGIN & SAVE DETAILS'
                          : 'SAVE USER DETAILS'}
                    </button>
                  </form>

                  <div className="p-3 rounded-xl bg-[#F4F7FF] border border-[#DDDDEF] space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-[#081149]">
                      <KeyRound className="w-3.5 h-3.5 text-[#663CBC]" />
                      <span>Account Recovery &amp; Security</span>
                    </div>
                    <p className="text-[11px] text-[#6B7280] leading-relaxed">
                      আপনার একাউন্ট পাসওয়ার্ডবিহীন Google OAuth ও মোবাইল OTP দ্বারা সুরক্ষিত। যেকোনো
                      সময় Google অ্যাকাউন্ট বা মোবাইল OTP ভেরিফিকেশনের মাধ্যমে একাউন্ট রিকভার করা যাবে।
                    </p>
                  </div>

                  {onGoogleLogin && !firebaseUser && (
                    <button
                      type="button"
                      onClick={() => {
                        setSubDrawer(null);
                        void onGoogleLogin();
                      }}
                      className="w-full h-9 rounded border border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8] font-bold flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Continue with Google Account</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
