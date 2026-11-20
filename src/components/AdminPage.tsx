import { useEffect, useMemo, useState } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { io } from 'socket.io-client';
import {
  Activity,
  AppWindow,
  ArrowLeft,
  BarChart3,
  Bell,
  Briefcase,
  Calculator,
  Check,
  ClipboardList,
  Database,
  Download,
  Edit3,
  Eye,
  FileText,
  FolderOpen,
  LogIn,
  LogOut,
  Mail,
  Megaphone,
  Menu,
  MessageSquare,
  Monitor,
  Moon,
  Package,
  Palette,
  Plus,
  Printer,
  RotateCcw,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Store,
  Sun,
  Tablet,
  Tag,
  Trash2,
  Truck,
  Upload,
  Users,
  Warehouse,
  X,
} from 'lucide-react';
import {
  CATEGORIES,
  CategorySlug,
  GUR_IMAGES,
  ORGANIC_IMAGES,
  Product,
  ProductVariant,
} from '../data/products';
import {
  CATEGORY_TEMPLATES,
  DEFAULT_THEME_ADVANCED,
  FONT_TEMPLATES,
  FOOTER_TEMPLATES,
  HEADER_TEMPLATES,
  HERO_TEMPLATES,
  MASTER_TEMPLATE_KITS,
  PRODUCT_CARD_TEMPLATES,
  PROMO_NOTICE_TEMPLATES,
  WEBSITE_TEMPLATES,
} from '../data/templates';
import type {
  AccountingEntryRecord,
  AdminNotificationRecord,
  AdminUserRecord,
  AuditLogRecord,
  CategoryStyleId,
  CmsPageRecord,
  CourierParcelRecord,
  CourierProvider,
  CustomerCrmRecord,
  EmployeeRecord,
  FontStyleId,
  FooterStyleId,
  HeaderStyleId,
  HeroBannerConfig,
  HeroStyleId,
  OrderReceipt,
  OrderStatus,
  ProductCardDesignId,
  ProductQuestionRecord,
  ProductReviewRecord,
  PurchaseOrderRecord,
  RegisteredUserProfile,
  SellerPayoutRecord,
  ShopifyAbandonedCheckout,
  ShopifyThemeAdvancedConfig,
  ShopifyWorkspaceState,
  StockMovementRecord,
  StoreSettings,
  SubOrderRecord,
  SubscriberRecord,
  SupplierRecord,
  ThemePresetId,
  VendorStoreRecord,
  VoucherRecord,
  WarehouseRecord,
  WebsiteTemplateId,
} from '../types';
import {
  answerProductQuestionInFirestore,
  DEFAULT_STORE_SETTINGS,
  deleteOrderFromFirestore,
  deleteProductFromFirestore,
  deleteReviewFromFirestore,
  deleteVoucherFromFirestore,
  markAdminNotificationRead,
  recordAdminAuditLog,
  saveCourierParcelToFirestore,
  saveProductToFirestore,
  saveStoreSettingsToFirestore,
  saveVoucherToFirestore,
  seedInitialStorefrontToFirestore,
  THEME_PRESETS,
  updateOrderStatusInFirestore,
} from '../lib/storeDb';
import { BOOTSTRAPPED_ADMIN_EMAIL } from '../lib/firebase';
import { ResilientImage } from './ResilientImage';
import { MediaUploaderControl } from './MediaUploaderControl';
import { ProductCard } from './ProductCard';
import { AdminOverviewBI } from './admin/AdminOverviewBI';
import { AdminInventoryPurchaseSection } from './admin/AdminInventoryPurchaseSection';
import { AdminAccountingSection } from './admin/AdminAccountingSection';
import { AdminCrmWholesaleSection } from './admin/AdminCrmWholesaleSection';
import { AdminCmsHrSystemSection } from './admin/AdminCmsHrSystemSection';
import { AdminVendorMarketplaceSection } from './admin/AdminVendorMarketplaceSection';
import { AdminShopifySuite } from './admin/AdminShopifySuite';
import {
  AdminThemeAdvancedStudio,
  normalizeThemeSections,
} from './admin/AdminThemeAdvancedStudio';

type AdminTab =
  | 'overview'
  | 'orders'
  | 'products'
  | 'vendors'
  | 'inventory'
  | 'purchases'
  | 'customers'
  | 'content'
  | 'analytics'
  | 'accounting'
  | 'marketing'
  | 'sales-channels'
  | 'apps'
  | 'appearance'
  | 'cms'
  | 'hr'
  | 'rbac'
  | 'system';

const DEFAULT_SHOPIFY_WORKSPACE_CLIENT: ShopifyWorkspaceState = {
  collections: [],
  giftCards: [],
  metaobjects: [],
  campaigns: [],
  automations: [],
  discountRules: [],
  navigationMenus: [],
  apps: [],
  domains: [],
  metafields: [],
  customerTags: {},
  planName: 'Enterprise ERP',
  billingCycle: 'Annual',
  checkoutConfig: {
    requirePhone: true,
    emailOptional: true,
    guestCheckout: true,
    codOtpCheck: false,
    orderConfirmTemplate: 'ধন্যবাদ {name}! আপনার অর্ডার #{orderId} (৳{total}) কনফার্ম হয়েছে।',
  },
  taxConfig: {
    taxIncludedInPrices: true,
    vatNumber: 'BIN-004982110-0402',
    chargeShippingTax: false,
  },
};

interface AdminPageProps {
  firebaseUser: FirebaseUser | null;
  isAdmin: boolean;
  products: Product[];
  firestoreProductsCount: number;
  orders: OrderReceipt[];
  vouchers: VoucherRecord[];
  storeSettings: StoreSettings;
  adminUsers: AdminUserRecord[];
  registeredUsers?: RegisteredUserProfile[];
  reviews?: ProductReviewRecord[];
  suppliers?: SupplierRecord[];
  subscribers?: SubscriberRecord[];
  auditLogs?: AuditLogRecord[];
  courierParcels?: CourierParcelRecord[];
  warehouses?: WarehouseRecord[];
  stockMovements?: StockMovementRecord[];
  purchases?: PurchaseOrderRecord[];
  accountingEntries?: AccountingEntryRecord[];
  employees?: EmployeeRecord[];
  cmsPages?: CmsPageRecord[];
  customersCrm?: CustomerCrmRecord[];
  adminNotifications?: AdminNotificationRecord[];
  vendors?: VendorStoreRecord[];
  subOrders?: SubOrderRecord[];
  payouts?: SellerPayoutRecord[];
  productQuestions?: ProductQuestionRecord[];
  onLocalVendorPatch?: (vendorId: string, patch: Partial<VendorStoreRecord>) => void;
  onLocalPayoutPatch?: (payoutId: string, status: SellerPayoutRecord['status']) => void;
  onThemeAdvancedChange?: (next: ShopifyThemeAdvancedConfig) => void;
  onBackToStore: () => void;
  onGoogleLogin: () => Promise<void>;
  onGoogleLogout: () => Promise<void>;
  onViewInvoice: (order: OrderReceipt) => void;
  onNotify: (msg: string) => void;
}

const ORDER_STATUS_LIST: OrderStatus[] = [
  'Pending',
  'Confirmed',
  'Processing',
  'Ready to Ship',
  'Shipped',
  'Delivered',
  'Cancelled',
  'Returned',
  'Refunded',
];

const COURIER_PROVIDERS: CourierProvider[] = ['Steadfast', 'Pathao', 'RedX', 'eCourier'];

const STATUS_BADGE_CLASS: Record<string, string> = {
  Pending: 'bg-[#FFF7ED] text-[#C2410C] border-[#FDBA74]',
  Confirmed: 'bg-[#EFF6FF] text-[#1D4ED8] border-[#93C5FD]',
  Processing: 'bg-[#F5F3FF] text-[#6D28D9] border-[#C4B5FD]',
  'Ready to Ship': 'bg-[#EEF2FF] text-[#4338CA] border-[#A5B4FC]',
  Shipped: 'bg-[#ECFEFF] text-[#0E7490] border-[#67E8F9]',
  Delivered: 'bg-[#ECFDF5] text-[#047857] border-[#6EE7B7]',
  Cancelled: 'bg-[#FEF2F2] text-[#B91C1C] border-[#FCA5A5]',
  Returned: 'bg-[#FEF3C7] text-[#92400E] border-[#FCD34D]',
  Refunded: 'bg-[#F3F4F6] text-[#374151] border-[#D1D5DB]',
};

const PRESET_IMAGES = [
  { label: 'Patali Gur', url: GUR_IMAGES.pataliGur },
  { label: 'Danadar Gur', url: GUR_IMAGES.danadarGur },
  { label: 'Jhola Gur', url: GUR_IMAGES.jholaGur },
  { label: 'Triple Combo', url: GUR_IMAGES.heroGur },
  { label: 'Raw Honey', url: ORGANIC_IMAGES.rawHoney },
  { label: 'Kalojira Honey', url: ORGANIC_IMAGES.kalojiraHoney },
  { label: 'Honey Nuts', url: ORGANIC_IMAGES.honeyNuts },
  { label: 'Desi Ghee', url: ORGANIC_IMAGES.desiGhee },
  { label: 'Mustard Oil', url: ORGANIC_IMAGES.mustardOil },
  { label: 'Black Seed Oil', url: ORGANIC_IMAGES.blackSeedOil },
  { label: 'Coconut Oil', url: ORGANIC_IMAGES.coconutOil },
  { label: 'Chia & Seeds', url: ORGANIC_IMAGES.chiaSeeds },
  { label: 'Ajwa Dates', url: ORGANIC_IMAGES.datesSuperfoods },
  { label: 'Organic Spices', url: ORGANIC_IMAGES.spicesCombo },
];

interface ProductFormState {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  englishName: string;
  shortDesc: string;
  category: Exclude<CategorySlug, 'all'>;
  price: string;
  originalPrice: string;
  wholesalePrice: string;
  minWholesaleQty: string;
  costPrice: string;
  stockLeft: string;
  tag: string;
  badge: string;
  origin: string;
  image: string;
  gallery: string[];
  videoUrl: string;
  variantLabel: string;
  variantWeightKg: string;
  variants: ProductVariant[];
  description: string;
  inStock: boolean;
  isHotDeal: boolean;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
}

const EMPTY_PRODUCT_FORM: ProductFormState = {
  id: '',
  sku: '',
  barcode: '',
  name: '',
  englishName: '',
  shortDesc: '',
  category: 'patali',
  price: '450',
  originalPrice: '520',
  wholesalePrice: '390',
  minWholesaleQty: '5',
  costPrice: '320',
  stockLeft: '25',
  tag: 'খাঁটি অর্গানিক',
  badge: '১০০% খাঁটি',
  origin: 'চুয়াডাঙ্গা / বাংলাদেশ',
  image: GUR_IMAGES.pataliGur,
  gallery: [GUR_IMAGES.pataliGur],
  videoUrl: '',
  variantLabel: '১ কেজি প্যাক',
  variantWeightKg: '1',
  variants: [
    { id: 'v-1kg', label: '১ কেজি প্যাক', weightKg: 1, price: 450, originalPrice: 520 },
  ],
  description: '',
  inStock: true,
  isHotDeal: true,
  isFeatured: true,
  isBestSeller: false,
  isNewArrival: true,
};

export function AdminPage({
  firebaseUser,
  isAdmin,
  products,
  firestoreProductsCount,
  orders,
  vouchers,
  storeSettings,
  adminUsers,
  registeredUsers = [],
  reviews = [],
  suppliers = [],
  subscribers = [],
  auditLogs = [],
  courierParcels = [],
  warehouses = [],
  stockMovements = [],
  purchases = [],
  accountingEntries = [],
  employees = [],
  cmsPages = [],
  customersCrm = [],
  adminNotifications = [],
  vendors = [],
  subOrders = [],
  payouts = [],
  productQuestions = [],
  onLocalVendorPatch,
  onLocalPayoutPatch,
  onThemeAdvancedChange,
  onBackToStore,
  onGoogleLogin,
  onGoogleLogout,
  onViewInvoice,
  onNotify,
}: AdminPageProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [darkMode, setDarkMode] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [busyAction, setBusyAction] = useState<string | null>(null);

  // Orders filter, bulk select, packing slip & inline edit
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('ALL');
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [bulkCourierProvider, setBulkCourierProvider] = useState<CourierProvider>('Steadfast');
  const [packingSlipOrder, setPackingSlipOrder] = useState<OrderReceipt | null>(null);
  const [orderDrafts, setOrderDrafts] = useState<
    Record<string, { status: OrderStatus; adminNote: string; courierProvider: CourierProvider }>
  >({});
  const [confirmDeleteOrderId, setConfirmDeleteOrderId] = useState<string | null>(null);
  const [trackingResult, setTrackingResult] = useState<string | null>(null);
  const [editingOrderAddressId, setEditingOrderAddressId] = useState<string | null>(null);
  const [orderAddressDraft, setOrderAddressDraft] = useState('');

  // Products filter & form
  const [prodSearch, setProdSearch] = useState('');
  const [prodCategoryFilter, setProdCategoryFilter] = useState<CategorySlug>('all');
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState<ProductFormState>(EMPTY_PRODUCT_FORM);
  const [productMediaUploading, setProductMediaUploading] = useState(false);
  const [confirmDeleteProdId, setConfirmDeleteProdId] = useState<string | null>(null);

  // Vouchers & Store settings
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherTitle, setVoucherTitle] = useState('');
  const [voucherDiscount, setVoucherDiscount] = useState('50');
  const [voucherMinSpend, setVoucherMinSpend] = useState('500');
  const [voucherExpiry, setVoucherExpiry] = useState('31 Dec 2026');

  const [settingsDraft, setSettingsDraft] = useState<StoreSettings>(storeSettings);
  useEffect(() => {
    setSettingsDraft(storeSettings);
  }, [storeSettings]);

  const [studioSubTab, setStudioSubTab] = useState<
    'kits' | 'colors-fonts' | 'header-hero' | 'category-cards' | 'footer-promo' | 'pro-tokens'
  >('kits');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [applyKitCopy, setApplyKitCopy] = useState(true);

  // Hero banner add inputs
  const [bannerImage, setBannerImage] = useState('');
  const [bannerAlt, setBannerAlt] = useState('');
  const [bannerProductId, setBannerProductId] = useState(products[0]?.id ?? 'patali-gur');
  const [liveSocketOrderAlert, setLiveSocketOrderAlert] = useState<string | null>(null);
  const [qaReplyDrafts, setQaReplyDrafts] = useState<Record<string, string>>({});

  // Shopify Admin Workspace & Sub-tab states
  const [ordersSubTab, setOrdersSubTab] = useState<
    'all' | 'drafts' | 'abandoned' | 'returns'
  >('all');
  const [productsSubTab, setProductsSubTab] = useState<
    'all' | 'bulk-edit' | 'collections' | 'gift-cards'
  >('all');
  const [marketingSubTab, setMarketingSubTab] = useState<
    'discounts' | 'campaigns' | 'gateways'
  >('discounts');
  const [shopifyWorkspace, setShopifyWorkspace] = useState<ShopifyWorkspaceState>(
    DEFAULT_SHOPIFY_WORKSPACE_CLIENT
  );
  const [abandonedCheckouts, setAbandonedCheckouts] = useState<ShopifyAbandonedCheckout[]>([]);

  useEffect(() => {
    if (!firebaseUser || !isAdmin) return;
    fetch('/api/shopify/workspace')
      .then((r) => r.json())
      .then((data: { workspace?: ShopifyWorkspaceState }) => {
        if (data?.workspace) setShopifyWorkspace(data.workspace);
      })
      .catch(() => undefined);

    fetch('/api/shopify/abandoned-checkouts')
      .then((r) => r.json())
      .then((data: { checkouts?: ShopifyAbandonedCheckout[]; items?: ShopifyAbandonedCheckout[] }) => {
        const list = data?.checkouts ?? data?.items;
        if (Array.isArray(list)) setAbandonedCheckouts(list);
      })
      .catch(() => undefined);
  }, [firebaseUser, isAdmin]);

  const resolvedThemeAdvanced: ShopifyThemeAdvancedConfig = useMemo(
    () => ({
      ...DEFAULT_THEME_ADVANCED,
      ...(shopifyWorkspace.themeAdvanced ?? {}),
      sections: normalizeThemeSections(shopifyWorkspace.themeAdvanced?.sections),
    }),
    [shopifyWorkspace.themeAdvanced]
  );

  const updateThemeAdvanced = (next: ShopifyThemeAdvancedConfig) => {
    setShopifyWorkspace((prev) => ({ ...prev, themeAdvanced: next }));
    onThemeAdvancedChange?.(next);
  };

  const handleSaveWorkspace = async (next: ShopifyWorkspaceState, toastMsg?: string) => {
    setShopifyWorkspace(next);
    try {
      const res = await fetch('/api/shopify/workspace', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      });
      if (res.ok) {
        const data = (await res.json()) as { workspace?: ShopifyWorkspaceState };
        if (data?.workspace) setShopifyWorkspace(data.workspace);
      }
      if (toastMsg) onNotify(toastMsg);
    } catch {
      onNotify('ওয়ার্কস্পেস সংরক্ষণে সমস্যা হয়েছে।');
    }
  };

  const handleDeleteAbandonedCheckout = async (id: string) => {
    setAbandonedCheckouts((prev) => prev.filter((x) => x.id !== id));
    await fetch(`/api/shopify/abandoned-checkouts/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }).catch(() => undefined);
  };

  useEffect(() => {
    if (!firebaseUser || !isAdmin) return;
    const socket = io({ path: '/socket.io', transports: ['websocket', 'polling'] });
    socket.emit('chat:join', { roomId: 'admin-orders' });
    socket.on('order:new', (payload: { orderId?: string; customerName?: string; total?: number }) => {
      if (payload?.orderId) {
        const msg = `নতুন অর্ডার #${payload.orderId} · ${payload.customerName ?? 'Customer'} (৳${Number(payload.total ?? 0).toLocaleString('en-US')})`;
        setLiveSocketOrderAlert(msg);
        onNotify(msg);
      }
    });
    return () => {
      socket.disconnect();
    };
  }, [firebaseUser, isAdmin, onNotify]);

  const currentRoleLabel = useMemo(() => {
    if (!firebaseUser) return 'Guest';
    if (firebaseUser.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase()) {
      return 'Super Admin';
    }
    const found = adminUsers.find((a) => a.uid === firebaseUser.uid);
    return found?.role || 'Admin';
  }, [firebaseUser, adminUsers]);

  const unreadNotifs = adminNotifications.filter((n) => !n.read).length;

  const filteredOrders = useMemo(() => {
    const q = (orderSearch || globalSearch).trim().toLowerCase();
    return orders.filter((o) => {
      const matchStatus = orderStatusFilter === 'ALL' || o.status === orderStatusFilter;
      const matchQuery =
        !q ||
        o.orderId.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.phone.toLowerCase().includes(q) ||
        (o.consignmentId || '').toLowerCase().includes(q);
      return matchStatus && matchQuery;
    });
  }, [orders, orderSearch, globalSearch, orderStatusFilter]);

  const filteredProducts = useMemo(() => {
    const q = (prodSearch || globalSearch).trim().toLowerCase();
    return products.filter((p) => {
      const matchCat = prodCategoryFilter === 'all' || p.category === prodCategoryFilter;
      const matchQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.englishName.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode || '').toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [products, prodSearch, globalSearch, prodCategoryFilter]);

  // Auth / Admin Role Gate
  if (!firebaseUser || !isAdmin) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
        <header className="bg-gradient-to-r from-[#FF6B00] to-[#F85606] text-white h-14 px-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToStore}
              className="p-1.5 rounded-full hover:bg-white/15 cursor-pointer"
              aria-label="Back to store"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-base sm:text-lg font-extrabold">
              Enterprise Admin Console · খিদমাতুল উম্মাহ
            </h1>
          </div>
          <button
            type="button"
            onClick={onBackToStore}
            className="px-3 py-1 rounded bg-white/15 hover:bg-white/25 text-xs font-bold cursor-pointer"
          >
            স্টোরে ফিরুন
          </button>
        </header>

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl border border-[#EAEAEA] shadow-lg p-6 sm:p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#F85606] to-[#FF8A00] text-white flex items-center justify-center mx-auto shadow-md">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-xl font-extrabold text-[#212121]">Super Admin &amp; ERP Login</h2>
              <p className="text-xs sm:text-sm text-[#616161] mt-1.5 leading-relaxed">
                অর্ডার, কুরিয়ার, ইনভেন্টরি, অ্যাকাউন্টিং, CRM, HR ও CMS পরিচালনা করতে অনুমোদিত অ্যাডমিন
                Google অ্যাকাউন্ট দিয়ে লগইন করুন।
              </p>
            </div>

            {firebaseUser ? (
              <div className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-left space-y-2">
                <p className="text-xs font-bold text-[#991B1B]">
                  বর্তমান অ্যাকাউন্ট ({firebaseUser.email}) অ্যাডমিন তালিকায় নেই।
                </p>
                <p className="text-[11px] text-[#7F1D1D]">
                  প্রাইমারি অ্যাডমিন ({BOOTSTRAPPED_ADMIN_EMAIL}) দিয়ে সাইন-ইন করুন অথবা আপনার UID
                  ({firebaseUser.uid}) RBAC অ্যাডমিন লিস্টে যুক্ত করুন।
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => void onGoogleLogin()}
                    className="flex-1 py-2 rounded-lg bg-[#F85606] hover:bg-[#D94802] text-white text-xs font-bold cursor-pointer"
                  >
                    অন্য অ্যাকাউন্টে লগইন
                  </button>
                  <button
                    type="button"
                    onClick={() => void onGoogleLogout()}
                    className="px-3 py-2 rounded-lg border border-[#D1D5DB] text-xs font-bold text-[#424242] cursor-pointer"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => void onGoogleLogin()}
                className="w-full py-3 px-4 rounded-xl bg-[#F85606] hover:bg-[#D94802] text-white text-sm font-extrabold flex items-center justify-center gap-2.5 shadow-md cursor-pointer transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span>Google দিয়ে Admin Login করুন</span>
              </button>
            )}

            <div className="pt-2 border-t border-[#F0F0F0] text-[11px] text-[#757575]">
              Bootstrapped Store Owner:{' '}
              <span className="font-mono font-bold">{BOOTSTRAPPED_ADMIN_EMAIL}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const cardCls = darkMode
    ? 'bg-[#181B22] border-[#2A2F3A] text-gray-100'
    : 'bg-white border-[#EAEAEA] text-[#212121]';
  const inputCls = darkMode
    ? 'bg-[#101318] border-[#2E3440] text-gray-100'
    : 'bg-white border-[#D4D8DD] text-[#212121]';
  const subTextCls = darkMode ? 'text-gray-400' : 'text-[#616161]';

  const handleSeedDatabase = async () => {
    setBusyAction('seed');
    try {
      const count = await seedInitialStorefrontToFirestore(firebaseUser.uid);
      await recordAdminAuditLog(firebaseUser, 'SEED_CATALOG', 'products', `${count} items + CMS + warehouses seeded`);
      onNotify(`${count}টি অর্গানিক পণ্য, ওয়্যারহাউস, CMS পেজ ও ভাউচার ডাটাবেজে যুক্ত হয়েছে!`);
    } catch {
      onNotify('ডাটাবেজে সিড করতে সমস্যা হয়েছে।');
    } finally {
      setBusyAction(null);
    }
  };

  const handleExportBackup = async () => {
    setBusyAction('backup');
    try {
      const snapshot = {
        products,
        orders,
        vouchers,
        suppliers,
        warehouses,
        cmsPages,
        storeSettings,
        exportedBy: firebaseUser.email,
      };
      const res = await fetch('/api/backup/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snapshot),
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `khidmatul-ummah-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      await recordAdminAuditLog(firebaseUser, 'EXPORT_BACKUP', 'database', `${orders.length} orders`);
      onNotify('ডাটাবেজ ব্যাকআপ JSON ডাউনলোড হয়েছে!');
    } catch {
      onNotify('ব্যাকআপ ডাউনলোড করতে সমস্যা হয়েছে।');
    } finally {
      setBusyAction(null);
    }
  };

  const handleExportOrdersCsv = async () => {
    const res = await fetch('/api/reports/export-csv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: `orders-${new Date().toISOString().slice(0, 10)}`,
        headers: ['Order ID', 'Date', 'Customer', 'Phone', 'District', 'Payment', 'Total', 'Status', 'Courier', 'Consignment'],
        rows: filteredOrders.map((o) => [
          o.orderId,
          o.createdAt,
          o.customerName,
          o.phone,
          o.district,
          o.paymentMethod,
          o.total,
          o.status,
          o.courierProvider || '',
          o.consignmentId || '',
        ]),
      }),
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    onNotify('অর্ডার তালিকা CSV ডাউনলোড হয়েছে!');
  };

  const handleBulkStatusUpdate = async (targetStatus: OrderStatus) => {
    if (selectedOrderIds.length === 0) return;
    setBusyAction('bulk-status');
    try {
      let updated = 0;
      for (const oid of selectedOrderIds) {
        const ord = orders.find((o) => o.orderId === oid);
        if (ord?.userId) {
          await updateOrderStatusInFirestore(oid, targetStatus, `Bulk updated to ${targetStatus}`);
          updated += 1;
        }
      }
      await recordAdminAuditLog(firebaseUser, 'BULK_ORDER_STATUS', targetStatus, `${updated} orders`);
      setSelectedOrderIds([]);
      onNotify(`${updated}টি ক্লাউড অর্ডার "${targetStatus}"-এ আপডেট হয়েছে!`);
    } finally {
      setBusyAction(null);
    }
  };

  const handleBulkCourierDispatch = async () => {
    if (selectedOrderIds.length === 0) return;
    const selectedCloudOrders = orders.filter((o) => selectedOrderIds.includes(o.orderId) && o.userId);
    if (selectedCloudOrders.length === 0) {
      onNotify('শুধুমাত্র ক্লাউড অর্ডার বাল্ক কুরিয়ারে পাঠানো যায়।');
      return;
    }
    setBusyAction('bulk-courier');
    try {
      const res = await fetch('/api/couriers/bulk-dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: bulkCourierProvider, orders: selectedCloudOrders }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        dispatched?: Array<{
          consignmentId: string;
          trackingCode: string;
          provider: CourierProvider;
          orderId: string;
          status: string;
        }>;
      };
      if (data?.ok && data.dispatched) {
        for (const p of data.dispatched) {
          const ord = selectedCloudOrders.find((o) => o.orderId === p.orderId);
          await saveCourierParcelToFirestore({
            consignmentId: p.consignmentId,
            orderId: p.orderId,
            provider: p.provider,
            trackingCode: p.trackingCode,
            status: p.status,
            codAmount: ord?.paymentMethod === 'Cash on Delivery' ? ord.total : 0,
          });
          await updateOrderStatusInFirestore(
            p.orderId,
            'Shipped',
            `Bulk ${p.provider}: ${p.trackingCode}`,
            {
              courierProvider: p.provider,
              consignmentId: p.consignmentId,
              trackingCode: p.trackingCode,
            }
          );
        }
        setSelectedOrderIds([]);
        onNotify(`${data.dispatched.length}টি অর্ডার ${bulkCourierProvider}-এ বুক হয়েছে!`);
      }
    } finally {
      setBusyAction(null);
    }
  };

  const handleDispatchCourier = async (order: OrderReceipt, provider: CourierProvider) => {
    if (!order.userId) {
      onNotify('শুধুমাত্র ক্লাউড অর্ডার কুরিয়ারে পাঠানো যাবে।');
      return;
    }
    setBusyAction(`dispatch-${order.orderId}`);
    try {
      const res = await fetch('/api/couriers/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          orderId: order.orderId,
          customerName: order.customerName,
          phone: order.phone,
          address: `${order.address}${order.upazila ? `, ${order.upazila}` : ''}, ${order.district}`,
          codAmount: order.paymentMethod === 'Cash on Delivery' ? order.total : 0,
          note: order.notes || 'Organic Food Parcel',
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        parcel?: {
          consignmentId: string;
          trackingCode: string;
          provider: CourierProvider;
          status: string;
        };
      };
      if (!res.ok || !data.ok || !data.parcel) {
        onNotify(data.error || 'কুরিয়ার বুকিং ব্যর্থ হয়েছে।');
        return;
      }

      await saveCourierParcelToFirestore({
        consignmentId: data.parcel.consignmentId,
        orderId: order.orderId,
        provider,
        trackingCode: data.parcel.trackingCode,
        status: data.parcel.status,
        codAmount: order.paymentMethod === 'Cash on Delivery' ? order.total : 0,
      });

      await updateOrderStatusInFirestore(
        order.orderId,
        'Shipped',
        `Dispatched via ${provider} (${data.parcel.trackingCode})`,
        {
          courierProvider: provider,
          consignmentId: data.parcel.consignmentId,
          trackingCode: data.parcel.trackingCode,
        }
      );

      await recordAdminAuditLog(
        firebaseUser,
        'DISPATCH_COURIER',
        order.orderId,
        `${provider}: ${data.parcel.consignmentId}`
      );
      onNotify(`${provider} কুরিয়ারে পার্সেল বুকড (${data.parcel.trackingCode})!`);
    } catch {
      onNotify('কুরিয়ার এপিআই-তে সংযোগ করা যায়নি।');
    } finally {
      setBusyAction(null);
    }
  };

  const handleTrackCourier = async (provider: string, consignmentId: string) => {
    try {
      const res = await fetch(
        `/api/couriers/track/${encodeURIComponent(provider)}/${encodeURIComponent(consignmentId)}`
      );
      const data = (await res.json()) as { status?: string; consignmentId?: string };
      setTrackingResult(`${provider} (${consignmentId}): ${data.status || 'In Transit'}`);
      onNotify(`Tracking: ${data.status || 'In Transit'}`);
    } catch {
      onNotify('ট্র্যাকিং তথ্য পাওয়া যায়নি।');
    }
  };

  const handleOpenAddProduct = () => {
    setEditingProductId(null);
    const rnd = Math.floor(100 + Math.random() * 899);
    const newId = `organic-${Date.now().toString().slice(-5)}`;
    setProductForm({
      ...EMPTY_PRODUCT_FORM,
      id: newId,
      sku: `KU-${rnd}`,
      barcode: `890${String(Date.now()).slice(-6)}`,
      gallery: [EMPTY_PRODUCT_FORM.image],
      variants: [
        { id: `${newId}-1kg`, label: '১ কেজি প্যাক', weightKg: 1, price: 450, originalPrice: 520 },
      ],
    });
    setProductFormOpen(true);
  };

  const handleOpenEditProduct = (product: Product) => {
    setEditingProductId(product.id);
    const initialGallery = product.gallery?.length ? product.gallery : [product.image];
    const mappedVariants = product.variants?.length
      ? product.variants.map((v) => ({ ...v }))
      : [
          {
            id: `${product.id}-1kg`,
            label: '১ কেজি প্যাক',
            weightKg: 1,
            price: product.price,
            originalPrice: product.originalPrice,
          },
        ];
    setProductForm({
      id: product.id,
      sku: product.sku,
      barcode: product.barcode ?? '',
      name: product.name,
      englishName: product.englishName,
      shortDesc: product.shortDesc,
      category: product.category,
      price: String(product.price),
      originalPrice: String(product.originalPrice ?? product.price),
      wholesalePrice: String(product.wholesalePrice ?? Math.round(product.price * 0.85)),
      minWholesaleQty: String(product.minWholesaleQty ?? 5),
      costPrice: String(product.costPrice ?? Math.round(product.price * 0.72)),
      stockLeft: String(product.stockLeft ?? 25),
      tag: product.tag || 'খাঁটি অর্গানিক',
      badge: product.badge,
      origin: product.origin,
      image: product.image,
      gallery: initialGallery,
      videoUrl: product.videoUrl ?? '',
      variantLabel: mappedVariants[0]?.label ?? '১ কেজি প্যাক',
      variantWeightKg: String(mappedVariants[0]?.weightKg ?? 1),
      variants: mappedVariants,
      description: product.description,
      inStock: product.inStock,
      isHotDeal: Boolean(product.isHotDeal),
      isFeatured: Boolean(product.isFeatured),
      isBestSeller: Boolean(product.isBestSeller),
      isNewArrival: Boolean(product.isNewArrival),
    });
    setProductFormOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = Math.max(1, Number(productForm.price) || 0);
    const origNum = Math.max(priceNum, Number(productForm.originalPrice) || priceNum);
    const discountPct =
      origNum > priceNum ? Math.round(((origNum - priceNum) / origNum) * 100) : 0;
    const catMeta = CATEGORIES.find((c) => c.slug === productForm.category);
    const cleanId =
      (editingProductId || productForm.id || `item-${Date.now()}`)
        .toLowerCase()
        .replace(/[^a-z0-9_\-]/g, '-')
        .replace(/-+/g, '-') || `item-${Date.now()}`;

    const existing = products.find((p) => p.id === editingProductId);
    const finalGallery =
      productForm.gallery.length > 0
        ? productForm.gallery.slice(0, 6)
        : [productForm.image.trim() || GUR_IMAGES.pataliGur];
    const mainCover = finalGallery[0] || productForm.image.trim() || GUR_IMAGES.pataliGur;

    const cleanVariants: ProductVariant[] =
      productForm.variants.length > 0
        ? productForm.variants.slice(0, 10).map((v, idx) => ({
            id: v.id || `${cleanId}-v${idx + 1}`,
            label: v.label.trim() || `${v.weightKg || 1} কেজি প্যাক`,
            weightKg: Math.max(0.05, Number(v.weightKg) || 1),
            price: idx === 0 && !v.price ? priceNum : Math.max(1, Number(v.price) || priceNum),
            ...(v.originalPrice && v.originalPrice > (v.price || priceNum)
              ? { originalPrice: v.originalPrice }
              : {}),
          }))
        : [
            {
              id: `${cleanId}-1kg`,
              label: productForm.variantLabel.trim() || '১ কেজি প্যাক',
              weightKg: Math.max(0.1, Number(productForm.variantWeightKg) || 1),
              price: priceNum,
              originalPrice: origNum > priceNum ? origNum : undefined,
            },
          ];

    const newProduct: Product = {
      id: cleanId,
      sku: productForm.sku.trim() || `KU-${Date.now().toString().slice(-4)}`,
      barcode: productForm.barcode.trim() || undefined,
      name: productForm.name.trim() || 'খাঁটি অর্গানিক পণ্য',
      englishName: productForm.englishName.trim() || 'Organic Product',
      shortDesc: productForm.shortDesc.trim() || 'শতভাগ খাঁটি ও প্রাকৃতিক অর্গানিক খাদ্যপণ্য',
      category: productForm.category,
      categoryLabel: catMeta?.name ?? 'Organic',
      brand: existing?.brand ?? 'খিদমাতুল উম্মাহ',
      price: priceNum,
      originalPrice: origNum > priceNum ? origNum : undefined,
      wholesalePrice: Number(productForm.wholesalePrice) > 0 ? Number(productForm.wholesalePrice) : undefined,
      minWholesaleQty: Number(productForm.minWholesaleQty) >= 1 ? Number(productForm.minWholesaleQty) : undefined,
      costPrice: Number(productForm.costPrice) >= 0 ? Number(productForm.costPrice) : undefined,
      discountPercent: discountPct > 0 ? discountPct : undefined,
      soldCount: existing?.soldCount ?? 0,
      stockLeft: Math.max(0, Number(productForm.stockLeft) || 0),
      promoLabel: discountPct > 0 ? `${discountPct}% OFF` : existing?.promoLabel,
      tag: productForm.tag.trim() || 'খাঁটি অর্গানিক',
      badge: productForm.badge.trim() || '১০০% খাঁটি',
      inStock: productForm.inStock,
      isHotDeal: productForm.isHotDeal,
      isFeatured: productForm.isFeatured,
      isBestSeller: productForm.isBestSeller,
      isNewArrival: productForm.isNewArrival,
      image: mainCover,
      videoUrl: productForm.videoUrl.trim() || undefined,
      gallery: finalGallery,
      origin: productForm.origin.trim() || 'বাংলাদেশ',
      description:
        productForm.description.trim() ||
        'খিদমাতুল উম্মাহ শপ বিডির সম্পূর্ণ ভেজালমুক্ত ও প্রাকৃতিক অর্গানিক পণ্য।',
      features: existing?.features ?? [
        '১০০% প্রাকৃতিক ও কেমিক্যালমুক্ত',
        'ল্যাব ও অভিজ্ঞ টিম দ্বারা যাচাইকৃত',
        'সারা বাংলাদেশে ক্যাশ অন ডেলিভারি',
      ],
      specifications: existing?.specifications,
      variants: cleanVariants,
    };

    setBusyAction('save-product');
    try {
      await saveProductToFirestore(newProduct);
      await recordAdminAuditLog(
        firebaseUser,
        editingProductId ? 'UPDATE_PRODUCT' : 'CREATE_PRODUCT',
        cleanId,
        newProduct.name
      );
      setProductFormOpen(false);
      onNotify(editingProductId ? 'পণ্য আপডেট হয়েছে!' : 'নতুন পণ্য ডাটাবেজে যোগ হয়েছে!');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('permission') || msg.includes('PERMISSION_DENIED')) {
        onNotify('পণ্য সেভ করার অনুমতি নেই — অ্যাডমিন অ্যাকাউন্ট যাচাই করুন।');
      } else {
        onNotify('পণ্য সেভ করতে সমস্যা হয়েছে। অনুগ্রহ করে তথ্য যাচাই করে আবার চেষ্টা করুন।');
      }
    } finally {
      setBusyAction(null);
    }
  };

  const handleExportProductsCsv = async () => {
    const res = await fetch('/api/reports/export-csv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: `products-catalog-${new Date().toISOString().slice(0, 10)}`,
        headers: ['ID', 'SKU', 'Name', 'English Name', 'Category', 'Price', 'Cost Price', 'Wholesale Price', 'Stock'],
        rows: products.map((p) => [
          p.id,
          p.sku,
          p.name,
          p.englishName,
          p.category,
          p.price,
          p.costPrice ?? Math.round(p.price * 0.72),
          p.wholesalePrice ?? Math.round(p.price * 0.85),
          p.stockLeft ?? 25,
        ]),
      }),
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products-catalog-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    onNotify('প্রোডাক্ট ক্যাটালগ CSV ডাউনলোড হয়েছে!');
  };

  const handleImportProductsCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusyAction('csv-import');
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) {
        onNotify('CSV ফাইলে হেডারসহ কমপক্ষে একটি পণ্যের সারি থাকতে হবে।');
        return;
      }
      let imported = 0;
      for (const row of lines.slice(1)) {
        const cols = row.split(',').map((c) => c.replace(/^"|"$/g, '').trim());
        const name = cols[2] || cols[0];
        if (!name) continue;
        const price = Math.max(10, Number(cols[5]) || 450);
        const id = (cols[0] || `csv-${Date.now()}-${imported}`).toLowerCase().replace(/[^a-z0-9_\-]/g, '-');
        const cat = (['patali', 'danadar', 'jhola', 'combo', 'honey', 'ghee-oil', 'dates-nuts', 'spices-seeds'].includes(cols[4])
          ? cols[4]
          : 'patali') as Exclude<CategorySlug, 'all'>;
        await saveProductToFirestore({
          id,
          sku: cols[1] || `KU-${100 + imported}`,
          name,
          englishName: cols[3] || name,
          shortDesc: 'শতভাগ খাঁটি অর্গানিক পণ্য',
          category: cat,
          categoryLabel: CATEGORIES.find((c) => c.slug === cat)?.name ?? 'Organic',
          brand: 'খিদমাতুল উম্মাহ',
          price,
          costPrice: Number(cols[6]) || Math.round(price * 0.72),
          wholesalePrice: Number(cols[7]) || Math.round(price * 0.85),
          stockLeft: Number(cols[8]) || 25,
          soldCount: 0,
          tag: 'খাঁটি অর্গানিক',
          badge: '১০০% খাঁটি',
          inStock: true,
          image: GUR_IMAGES.pataliGur,
          gallery: [GUR_IMAGES.pataliGur],
          origin: 'বাংলাদেশ',
          description: `${name} — খিদমাতুল উম্মাহ শপ বিডি`,
          features: ['১০০% প্রাকৃতিক ও কেমিক্যালমুক্ত'],
          variants: [{ id: `${id}-1kg`, label: '১ কেজি প্যাক', weightKg: 1, price }],
        });
        imported += 1;
      }
      onNotify(`${imported}টি পণ্য CSV থেকে সফলভাবে ইমপোর্ট হয়েছে!`);
    } finally {
      setBusyAction(null);
    }
  };

  type NavGroupKey = 'CORE COMMERCE' | 'MARKETING & CHANNELS' | 'ERP & FINANCE' | 'PLATFORM & SYSTEM';

  const NAV_ITEMS: Array<{
    id: AdminTab;
    group: NavGroupKey;
    label: string;
    icon: typeof BarChart3;
    badge?: string | number;
  }> = [
    { id: 'overview', group: 'CORE COMMERCE', label: 'Home (Dashboard & BI)', icon: BarChart3 },
    { id: 'orders', group: 'CORE COMMERCE', label: 'Orders, Drafts & Returns', icon: ShoppingBag, badge: orders.length },
    { id: 'products', group: 'CORE COMMERCE', label: 'Products & Collections', icon: Package, badge: products.length },
    { id: 'vendors', group: 'CORE COMMERCE', label: 'Vendors & Payouts', icon: Store, badge: vendors.length },
    { id: 'customers', group: 'CORE COMMERCE', label: 'Customers, Tags & CRM', icon: Users },
    { id: 'analytics', group: 'MARKETING & CHANNELS', label: 'Analytics & Live View', icon: Activity },
    { id: 'marketing', group: 'MARKETING & CHANNELS', label: 'Marketing & Discounts', icon: Megaphone },
    { id: 'sales-channels', group: 'MARKETING & CHANNELS', label: 'Sales Channels & POS', icon: Store },
    { id: 'content', group: 'MARKETING & CHANNELS', label: 'Content (Files & Meta)', icon: FolderOpen },
    { id: 'appearance', group: 'MARKETING & CHANNELS', label: 'Online Store Themes', icon: Palette },
    { id: 'cms', group: 'MARKETING & CHANNELS', label: 'Pages, Blog & SEO', icon: FileText },
    { id: 'inventory', group: 'ERP & FINANCE', label: 'Inventory & Warehouse', icon: Warehouse },
    { id: 'purchases', group: 'ERP & FINANCE', label: 'Purchase & Suppliers', icon: ClipboardList, badge: suppliers.length },
    { id: 'accounting', group: 'ERP & FINANCE', label: 'Accounting & P&L', icon: Calculator },
    { id: 'hr', group: 'ERP & FINANCE', label: 'HR & Payroll', icon: Briefcase },
    { id: 'apps', group: 'PLATFORM & SYSTEM', label: 'Apps & Permissions', icon: AppWindow, badge: shopifyWorkspace.apps.filter((a) => a.installed).length || undefined },
    { id: 'rbac', group: 'PLATFORM & SYSTEM', label: 'RBAC Roles & Staff', icon: ShieldCheck, badge: adminUsers.length },
    { id: 'system', group: 'PLATFORM & SYSTEM', label: 'Settings (10-Hub) & Logs', icon: Settings, badge: unreadNotifs || undefined },
  ];

  const NAV_GROUPS: NavGroupKey[] = [
    'CORE COMMERCE',
    'MARKETING & CHANNELS',
    'ERP & FINANCE',
    'PLATFORM & SYSTEM',
  ];
  const activeNavLabel = NAV_ITEMS.find((n) => n.id === activeTab)?.label ?? 'Home (Dashboard & BI)';

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors ${
        darkMode ? 'bg-[#0D1017] text-gray-100' : 'bg-[#F6F6F7] text-[#212121]'
      }`}
    >
      {/* Top Enterprise Polaris Header */}
      <header
        className={`sticky top-0 z-40 h-14 px-3 sm:px-5 border-b flex items-center justify-between gap-3 backdrop-blur-md ${
          darkMode
            ? 'bg-[#13161E]/95 border-[#252A36] text-gray-100'
            : 'bg-white/95 border-[#E3E5E8] text-[#212121]'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen((s) => !s)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-black/5 cursor-pointer"
            aria-label="Toggle admin menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={onBackToStore}
            aria-label="Back to storefront"
            className="p-1.5 rounded-full hover:bg-black/5 cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-sm font-extrabold truncate flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#047857] animate-pulse" />
                <span>Khidmatul Ummah Admin</span>
              </h1>
              <span className="hidden xl:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/10 text-[10px] font-bold">
                <span>Admin</span>
                <span className="opacity-50">/</span>
                <span className="text-[#F85606]">{activeNavLabel}</span>
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-[#FFF7ED] text-[#C2410C] border border-[#FED7AA] text-[10px] font-extrabold">
                {currentRoleLabel}
              </span>
              <span className="hidden md:inline-block px-2 py-0.5 rounded bg-[#EEF2FF] text-[#4338CA] border border-[#C7D2FE] text-[10px] font-bold">
                {shopifyWorkspace.planName || 'Enterprise ERP'}
              </span>
            </div>
            <p className={`text-[10px] truncate ${subTextCls}`}>
              {firebaseUser.email} · Online Store: Live
            </p>
          </div>
        </div>

        {/* Global Search */}
        <div className="hidden md:flex flex-1 max-w-sm relative">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder="Global Search: Order ID, Product SKU, Phone..."
            className={`w-full h-8 pl-8 pr-3 rounded-lg border text-xs outline-none focus:border-[#F85606] ${inputCls}`}
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Dark/Light Mode Switch */}
          <button
            type="button"
            onClick={() => setDarkMode((d) => !d)}
            className="p-2 rounded-lg border border-black/10 hover:bg-black/5 cursor-pointer"
            title={darkMode ? 'Light Mode' : 'Dark Mode'}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Notification Bell */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setNotifDropdownOpen((o) => !o)}
              className="p-2 rounded-lg border border-black/10 hover:bg-black/5 relative cursor-pointer"
              title="Admin Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifs > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#F85606] text-white text-[9px] font-bold flex items-center justify-center">
                  {unreadNotifs}
                </span>
              )}
            </button>
            {notifDropdownOpen && (
              <div
                className={`absolute right-0 mt-2 w-72 rounded-xl border shadow-xl p-3 z-50 space-y-2 ${cardCls}`}
              >
                <div className="flex items-center justify-between text-xs font-extrabold">
                  <span>Notifications ({unreadNotifs} unread)</span>
                  <button
                    type="button"
                    onClick={() => {
                      setNotifDropdownOpen(false);
                      setActiveTab('system');
                    }}
                    className="text-[#F85606] cursor-pointer"
                  >
                    See All
                  </button>
                </div>
                <div className="max-h-56 overflow-y-auto space-y-1.5 text-[11px]">
                  {adminNotifications.slice(0, 5).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => void markAdminNotificationRead(n.id)}
                      className={`p-2 rounded-lg border cursor-pointer ${
                        n.read ? 'border-black/10 opacity-70' : 'border-[#F85606]/40 bg-[#FFF7ED]/30'
                      }`}
                    >
                      <p className="font-bold">{n.title}</p>
                      <p className={subTextCls}>{n.message}</p>
                    </div>
                  ))}
                  {adminNotifications.length === 0 && (
                    <p className={`text-center py-3 ${subTextCls}`}>কোনো নতুন নোটিফিকেশন নেই</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onBackToStore}
            className="px-3 py-1.5 rounded-lg bg-[#047857] hover:bg-[#065F46] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" /> স্টোর দেখুন
          </button>
          <button
            type="button"
            onClick={() => void onGoogleLogout()}
            aria-label="Logout admin"
            className="p-2 rounded-lg border border-black/10 hover:bg-black/5 cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Body Layout: Polaris Sidebar + Main Workspace */}
      <div className="flex-1 flex max-w-[1440px] w-full mx-auto">
        {/* Desktop & Mobile Sidebar */}
        <aside
          className={`${
            mobileSidebarOpen ? 'fixed inset-y-14 left-0 z-30 block w-64 shadow-2xl' : 'hidden'
          } lg:block lg:w-64 shrink-0 border-r p-3 space-y-3 overflow-y-auto ${
            darkMode ? 'bg-[#13161E] border-[#252A36]' : 'bg-[#FBFBFC] border-[#E3E5E8]'
          }`}
        >
          <div className="px-3 py-2.5 rounded-xl bg-gradient-to-r from-[#1E293B] to-[#0F172A] text-white flex items-center justify-between text-[11px] font-bold shadow-xs">
            <span>Shopify Polaris Suite</span>
            <span className="px-1.5 py-0.5 rounded bg-[#F85606] text-[9px] font-extrabold">18 Modules</span>
          </div>
          {NAV_GROUPS.map((group) => {
            const groupItems = NAV_ITEMS.filter((it) => it.group === group);
            return (
              <div key={group} className="space-y-0.5">
                <p
                  className={`px-2.5 pt-1 pb-1 text-[10px] font-extrabold tracking-wider uppercase ${
                    darkMode ? 'text-gray-500' : 'text-[#8C9196]'
                  }`}
                >
                  {group}
                </p>
                {groupItems.map((item) => {
                  const Icon = item.icon;
                  const active = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileSidebarOpen(false);
                      }}
                      className={`w-full px-2.5 py-2 rounded-lg text-xs font-bold flex items-center justify-between gap-2 transition-all cursor-pointer ${
                        active
                          ? darkMode
                            ? 'bg-[#F85606] text-white shadow-xs'
                            : 'bg-white text-[#F85606] border border-[#E5E7EB] border-l-[3px] border-l-[#F85606] shadow-xs'
                          : darkMode
                            ? 'text-gray-300 hover:bg-[#1E232D]'
                            : 'text-[#4A4E54] hover:bg-[#EFEFF1]'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 truncate">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </span>
                      {item.badge !== undefined && (
                        <span
                          className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold ${
                            active
                              ? darkMode
                                ? 'bg-white/25 text-white'
                                : 'bg-[#FFF7ED] text-[#F85606]'
                              : darkMode
                                ? 'bg-white/10 text-gray-200'
                                : 'bg-[#E5E7EB] text-[#374151]'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </aside>

        {/* Main Panel Content */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 space-y-5">
          {liveSocketOrderAlert && (
            <div className="rounded-xl bg-[#ECFDF5] border border-[#6EE7B7] text-[#065F46] px-4 py-2.5 flex items-center justify-between gap-3 text-xs font-bold shadow-xs">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#047857] shrink-0" />
                <span>Live Order Alert: {liveSocketOrderAlert}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab('orders')}
                  className="px-2.5 py-1 rounded bg-[#047857] text-white text-[11px] font-bold cursor-pointer"
                >
                  View Orders
                </button>
                <button
                  type="button"
                  onClick={() => setLiveSocketOrderAlert(null)}
                  className="p-1 text-[#065F46] hover:bg-[#D1FAE5] rounded cursor-pointer"
                  aria-label="Dismiss live alert"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Quick Seed Banner when DB empty */}
          {firestoreProductsCount === 0 && activeTab === 'overview' && (
            <div className="bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] text-white rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
              <div>
                <h2 className="text-sm sm:text-base font-extrabold flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  <span>এক ক্লিকে সম্পূর্ণ ই-কমার্স ও ERP ডাটাবেজ সিড করুন</span>
                </h2>
                <p className="text-xs text-white/85 mt-1">
                  ১২টি অর্গানিক পণ্য, ২টি ওয়ারহাউস হাব, ৭টি CMS পেজ, ভাউচার ও সেটিংস ক্লাউডে যুক্ত হবে।
                </p>
              </div>
              <button
                type="button"
                disabled={busyAction === 'seed'}
                onClick={() => void handleSeedDatabase()}
                className="px-4 py-2.5 rounded-lg bg-white text-[#5B21B6] text-xs font-extrabold hover:bg-[#F5F3FF] cursor-pointer disabled:opacity-60"
              >
                {busyAction === 'seed' ? 'সিড হচ্ছে...' : 'ডাটাবেজে সব ডেটা সিড করুন'}
              </button>
            </div>
          )}

          {/* TAB: OVERVIEW & BI */}
          {activeTab === 'overview' && (
            <AdminOverviewBI
              darkMode={darkMode}
              products={products}
              orders={orders}
              auditLogs={auditLogs}
              accountingEntries={accountingEntries}
              storeSettings={storeSettings}
              abandonedCount={abandonedCheckouts.length}
              onOpenTab={(t) => setActiveTab(t as AdminTab)}
            />
          )}

          {/* TAB: ORDERS & COURIER + SHOPIFY DRAFTS / ABANDONED / RETURNS */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className={`rounded-xl border p-2.5 flex flex-wrap items-center gap-2 ${cardCls}`}>
                {(
                  [
                    { id: 'all', label: `All Orders (${orders.length})` },
                    { id: 'drafts', label: 'Draft Orders (Create)' },
                    { id: 'abandoned', label: `Abandoned Checkouts (${abandonedCheckouts.length})` },
                    { id: 'returns', label: 'Returns & Refunds' },
                  ] as const
                ).map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setOrdersSubTab(sub.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer ${
                      ordersSubTab === sub.id ? 'bg-[#F85606] text-white' : 'border border-black/15'
                    }`}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>

              {ordersSubTab !== 'all' ? (
                <AdminShopifySuite
                  mode={
                    ordersSubTab === 'drafts'
                      ? 'draft-orders'
                      : ordersSubTab === 'abandoned'
                        ? 'abandoned-checkouts'
                        : 'returns-refunds'
                  }
                  darkMode={darkMode}
                  firebaseUser={firebaseUser}
                  products={products}
                  orders={orders}
                  vouchers={vouchers}
                  storeSettings={storeSettings}
                  adminUsers={adminUsers}
                  workspace={shopifyWorkspace}
                  abandonedCheckouts={abandonedCheckouts}
                  onSaveWorkspace={handleSaveWorkspace}
                  onDeleteAbandonedCheckout={handleDeleteAbandonedCheckout}
                  onOpenAdminTab={(t) => setActiveTab(t as AdminTab)}
                  onNotify={onNotify}
                />
              ) : (
                <div className="space-y-4">
                  <div className={`rounded-xl border p-4 space-y-3 ${cardCls}`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="relative flex-1 min-w-[220px]">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      placeholder="Order ID, নাম, ফোন বা Consignment ID দিয়ে খুঁজুন..."
                      className={`w-full h-9 pl-9 pr-3 rounded-lg border text-xs outline-none focus:border-[#F85606] ${inputCls}`}
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void handleExportOrdersCsv()}
                      className="h-9 px-3 rounded-lg bg-[#1D4ED8] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" /> Export Orders CSV
                    </button>
                    {trackingResult && (
                      <span className="px-3 py-1.5 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0] text-xs font-bold text-[#047857]">
                        {trackingResult}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status Filter Pills */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {['ALL', ...ORDER_STATUS_LIST].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setOrderStatusFilter(st)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer border ${
                        orderStatusFilter === st
                          ? 'bg-[#F85606] text-white border-[#F85606]'
                          : 'border-black/15 opacity-80'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                {/* Bulk Operations Toolbar */}
                {selectedOrderIds.length > 0 && (
                  <div className="p-2.5 rounded-lg bg-[#FFF7ED] border border-[#FDBA74] text-[#9A3412] flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-extrabold">
                      {selectedOrderIds.length}টি অর্ডার নির্বাচিত
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void handleBulkStatusUpdate('Confirmed')}
                        className="px-2.5 py-1 rounded bg-[#1D4ED8] text-white font-bold cursor-pointer"
                      >
                        Bulk Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleBulkStatusUpdate('Ready to Ship')}
                        className="px-2.5 py-1 rounded bg-[#4338CA] text-white font-bold cursor-pointer"
                      >
                        Bulk Ready to Ship
                      </button>
                      <select
                        value={bulkCourierProvider}
                        onChange={(e) => setBulkCourierProvider(e.target.value as CourierProvider)}
                        className="px-2 py-1 rounded border bg-white text-[#212121] font-bold"
                      >
                        {COURIER_PROVIDERS.map((cp) => (
                          <option key={cp} value={cp}>
                            {cp}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        disabled={busyAction === 'bulk-courier'}
                        onClick={() => void handleBulkCourierDispatch()}
                        className="px-2.5 py-1 rounded bg-[#047857] text-white font-bold cursor-pointer"
                      >
                        Bulk Dispatch Courier
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedOrderIds([])}
                        className="px-2 py-1 rounded border border-black/20 font-bold cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {filteredOrders.length === 0 ? (
                <div className={`rounded-xl border py-12 text-center text-xs ${cardCls}`}>
                  কোনো অর্ডার পাওয়া যায়নি।
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredOrders.map((order) => {
                    const checked = selectedOrderIds.includes(order.orderId);
                    const draft = orderDrafts[order.orderId] ?? {
                      status: (ORDER_STATUS_LIST.includes(order.status as OrderStatus)
                        ? order.status
                        : 'Pending') as OrderStatus,
                      adminNote: order.adminNote ?? '',
                      courierProvider: ((COURIER_PROVIDERS.includes(
                        order.courierProvider as CourierProvider
                      )
                        ? order.courierProvider
                        : 'Steadfast') as CourierProvider),
                    };

                    return (
                      <div
                        key={order.orderId}
                        className={`rounded-xl border p-4 space-y-3 ${cardCls}`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-black/10 pb-3">
                          <div className="flex items-start gap-2.5">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                setSelectedOrderIds((prev) =>
                                  checked
                                    ? prev.filter((id) => id !== order.orderId)
                                    : [...prev, order.orderId]
                                )
                              }
                              className="mt-1 accent-[#F85606] cursor-pointer"
                            />
                            <div className="space-y-0.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-sm font-extrabold">
                                  #{order.orderId}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                    STATUS_BADGE_CLASS[order.status] ??
                                    'bg-[#F5F5F5] text-[#424242] border-[#E5E7EB]'
                                  }`}
                                >
                                  {order.status}
                                </span>
                                <button
                                  type="button"
                                  disabled={busyAction === `pay-${order.orderId}`}
                                  onClick={async () => {
                                    if (!order.userId) {
                                      onNotify('লোকাল ডেমো অর্ডার; শুধুমাত্র ক্লাউড অর্ডার আপডেটযোগ্য');
                                      return;
                                    }
                                    const nextPaid = !order.paymentVerified;
                                    setBusyAction(`pay-${order.orderId}`);
                                    try {
                                      await updateOrderStatusInFirestore(
                                        order.orderId,
                                        draft.status,
                                        draft.adminNote,
                                        { paymentVerified: nextPaid }
                                      );
                                      await recordAdminAuditLog(
                                        firebaseUser,
                                        'TOGGLE_ORDER_PAYMENT',
                                        order.orderId,
                                        nextPaid ? 'Marked Paid' : 'Marked Payment Pending'
                                      );
                                      onNotify(
                                        nextPaid
                                          ? `অর্ডার #${order.orderId} Paid হিসেবে চিহ্নিত হয়েছে!`
                                          : `অর্ডার #${order.orderId} Payment Pending করা হয়েছে।`
                                      );
                                    } finally {
                                      setBusyAction(null);
                                    }
                                  }}
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border cursor-pointer transition-colors ${
                                    order.paymentVerified
                                      ? 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0] hover:bg-[#D1FAE5]'
                                      : 'bg-[#FFF7ED] text-[#C2410C] border-[#FDBA74] hover:bg-[#FFEDD5]'
                                  }`}
                                  title="Click to toggle Paid / Pending Payment status"
                                >
                                  {order.paymentVerified ? 'Paid ✓' : 'Pending Payment · Mark Paid'}
                                </button>
                                {order.refundRequested && (
                                  <span className="px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] text-[10px] font-bold">
                                    Refund Requested
                                  </span>
                                )}
                              </div>
                              <p className="text-xs font-bold">
                                {order.customerName} · <span className="font-mono">{order.phone}</span>
                              </p>
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className={`text-[11px] ${subTextCls}`}>
                                    {shopifyWorkspace.orderAddressOverrides?.[order.orderId] || order.address}
                                    {order.upazila ? `, ${order.upazila}` : ''} ({order.district})
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (editingOrderAddressId === order.orderId) {
                                        setEditingOrderAddressId(null);
                                      } else {
                                        setEditingOrderAddressId(order.orderId);
                                        setOrderAddressDraft(
                                          shopifyWorkspace.orderAddressOverrides?.[order.orderId] ||
                                            order.address
                                        );
                                      }
                                    }}
                                    className="text-[10px] font-bold text-[#1D4ED8] hover:underline cursor-pointer"
                                  >
                                    {editingOrderAddressId === order.orderId ? 'Cancel' : 'Edit Address'}
                                  </button>
                                </div>
                                {editingOrderAddressId === order.orderId && (
                                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                    <input
                                      type="text"
                                      value={orderAddressDraft}
                                      onChange={(e) => setOrderAddressDraft(e.target.value)}
                                      placeholder="নতুন ডেলিভারি ঠিকানা লিখুন..."
                                      className={`flex-1 min-w-[200px] h-7 px-2 rounded border text-[11px] ${inputCls}`}
                                    />
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        const trimmed = orderAddressDraft.trim();
                                        if (!trimmed) return;
                                        await handleSaveWorkspace(
                                          {
                                            ...shopifyWorkspace,
                                            orderAddressOverrides: {
                                              ...(shopifyWorkspace.orderAddressOverrides ?? {}),
                                              [order.orderId]: trimmed,
                                            },
                                          },
                                          `অর্ডার #${order.orderId}-এর ডেলিভারি ঠিকানা আপডেট হয়েছে!`
                                        );
                                        const nextNote = draft.adminNote
                                          ? `${draft.adminNote} | [Shipping Updated: ${trimmed}]`
                                          : `[Shipping Updated: ${trimmed}]`;
                                        setOrderDrafts((prev) => ({
                                          ...prev,
                                          [order.orderId]: { ...draft, adminNote: nextNote },
                                        }));
                                        if (order.userId) {
                                          await updateOrderStatusInFirestore(
                                            order.orderId,
                                            draft.status,
                                            nextNote
                                          ).catch(() => undefined);
                                          await recordAdminAuditLog(
                                            firebaseUser,
                                            'UPDATE_ORDER_ADDRESS',
                                            order.orderId,
                                            trimmed
                                          );
                                        }
                                        setEditingOrderAddressId(null);
                                      }}
                                      className="h-7 px-2.5 rounded bg-[#047857] text-white text-[10px] font-bold cursor-pointer"
                                    >
                                      Save Address
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-right font-mono">
                            <p className="text-base font-extrabold text-[#F85606]">
                              ৳{order.total.toLocaleString('en-US')}
                            </p>
                            <p className={`text-[11px] ${subTextCls}`}>
                              {order.paymentMethod}
                              {order.trxId ? ` · Trx: ${order.trxId}` : ''}
                            </p>
                            <p className="text-[10px] opacity-70">{order.createdAt}</p>
                          </div>
                        </div>

                        {/* Items & Order Status Timeline */}
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                          <div className="flex flex-wrap gap-1.5">
                            {order.items.map((it, idx) => (
                              <span
                                key={`${order.orderId}-${idx}`}
                                className="px-2 py-1 rounded border border-black/10"
                              >
                                {it.name} ({it.variantLabel}) × {it.quantity}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center gap-1 text-[10px] font-mono">
                            {(['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered'] as const).map(
                              (step, i) => {
                                const done =
                                  step === order.status ||
                                  order.status === 'Delivered' ||
                                  (order.status === 'Shipped' && i < 4) ||
                                  (order.status === 'Processing' && i < 3) ||
                                  (order.status === 'Confirmed' && i < 2);
                                return (
                                  <span
                                    key={step}
                                    className={`px-1.5 py-0.5 rounded ${
                                      done ? 'bg-[#ECFDF5] text-[#047857] font-bold' : 'opacity-40'
                                    }`}
                                  >
                                    {step}
                                  </span>
                                );
                              }
                            )}
                          </div>
                        </div>

                        {/* Courier Dispatch Bar */}
                        <div className="p-2.5 rounded-lg border border-black/10 flex flex-wrap items-center justify-between gap-2 text-xs">
                          {order.consignmentId ? (
                            <div className="flex flex-wrap items-center gap-2 text-[#047857]">
                              <Truck className="w-4 h-4" />
                              <span>
                                <strong>{order.courierProvider}</strong> · Consignment:{' '}
                                <span className="font-mono font-bold">{order.consignmentId}</span> ·
                                Tracking:{' '}
                                <span className="font-mono font-bold">{order.trackingCode}</span>
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  void handleTrackCourier(
                                    order.courierProvider || 'Steadfast',
                                    order.consignmentId || ''
                                  )
                                }
                                className="px-2 py-0.5 rounded border border-[#047857] text-[10px] font-bold cursor-pointer"
                              >
                                Check Status
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-wrap items-center gap-2 w-full justify-between">
                              <span className="font-semibold inline-flex items-center gap-1.5">
                                <Truck className="w-4 h-4 text-[#F85606]" />
                                <span>Courier Dispatch:</span>
                              </span>
                              <div className="flex items-center gap-2">
                                <select
                                  value={draft.courierProvider}
                                  onChange={(e) =>
                                    setOrderDrafts((prev) => ({
                                      ...prev,
                                      [order.orderId]: {
                                        ...draft,
                                        courierProvider: e.target.value as CourierProvider,
                                      },
                                    }))
                                  }
                                  className={`h-8 px-2 rounded border text-xs font-bold ${inputCls}`}
                                >
                                  {COURIER_PROVIDERS.map((cp) => (
                                    <option key={cp} value={cp}>
                                      {cp}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  disabled={busyAction === `dispatch-${order.orderId}`}
                                  onClick={() =>
                                    void handleDispatchCourier(order, draft.courierProvider)
                                  }
                                  className="h-8 px-3 rounded bg-[#6C3CE9] hover:bg-[#5B21B6] text-white text-[11px] font-bold cursor-pointer"
                                >
                                  {busyAction === `dispatch-${order.orderId}`
                                    ? 'Booking...'
                                    : `Send to ${draft.courierProvider}`}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Actions Bar: Status, Note, Invoice, Packing Slip, Delete */}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <select
                            value={draft.status}
                            onChange={(e) =>
                              setOrderDrafts((prev) => ({
                                ...prev,
                                [order.orderId]: {
                                  ...draft,
                                  status: e.target.value as OrderStatus,
                                },
                              }))
                            }
                            className={`h-9 px-2.5 rounded-lg border text-xs font-bold ${inputCls}`}
                          >
                            {ORDER_STATUS_LIST.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>

                          <input
                            type="text"
                            value={draft.adminNote}
                            onChange={(e) =>
                              setOrderDrafts((prev) => ({
                                ...prev,
                                [order.orderId]: {
                                  ...draft,
                                  adminNote: e.target.value,
                                },
                              }))
                            }
                            placeholder="অ্যাডমিন নোট / ট্র্যাকিং কোড..."
                            className={`flex-1 min-w-[180px] h-9 px-3 rounded-lg border text-xs ${inputCls}`}
                          />

                          <button
                            type="button"
                            disabled={busyAction === `order-${order.orderId}`}
                            onClick={async () => {
                              if (!order.userId) {
                                onNotify('লোকাল ডেমো অর্ডার; শুধুমাত্র ক্লাউড অর্ডার আপডেটযোগ্য');
                                return;
                              }
                              setBusyAction(`order-${order.orderId}`);
                              try {
                                await updateOrderStatusInFirestore(
                                  order.orderId,
                                  draft.status,
                                  draft.adminNote
                                );
                                await recordAdminAuditLog(
                                  firebaseUser,
                                  'UPDATE_ORDER_STATUS',
                                  order.orderId,
                                  `Status -> ${draft.status}`
                                );
                                onNotify(`অর্ডার #${order.orderId} আপডেট হয়েছে!`);
                              } finally {
                                setBusyAction(null);
                              }
                            }}
                            className="h-9 px-3.5 rounded-lg bg-[#047857] text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" /> Save
                          </button>

                          <button
                            type="button"
                            onClick={() => onViewInvoice(order)}
                            className="h-9 px-3 rounded-lg bg-[#EFF6FF] text-[#1D4ED8] text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" /> Invoice
                          </button>

                          <button
                            type="button"
                            onClick={() => setPackingSlipOrder(order)}
                            className="h-9 px-3 rounded-lg bg-[#F5F3FF] text-[#6D28D9] text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" /> Packing Slip
                          </button>

                          {order.userId &&
                            (confirmDeleteOrderId === order.orderId ? (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await deleteOrderFromFirestore(order.orderId);
                                    await recordAdminAuditLog(firebaseUser, 'DELETE_ORDER', order.orderId);
                                    setConfirmDeleteOrderId(null);
                                    onNotify('অর্ডার ডিলিট হয়েছে।');
                                  }}
                                  className="h-9 px-2.5 rounded-lg bg-[#DC2626] text-white text-xs font-bold cursor-pointer"
                                >
                                  Confirm
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteOrderId(null)}
                                  className="h-9 px-2 rounded-lg border text-xs cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteOrderId(order.orderId)}
                                className="h-9 w-9 rounded-lg bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
                </div>
              )}
            </div>
          )}

          {/* TAB: PRODUCTS, BULK EDIT, COLLECTIONS & GIFT CARDS */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              <div className={`rounded-xl border p-2.5 flex flex-wrap items-center gap-2 ${cardCls}`}>
                {(
                  [
                    { id: 'all', label: `All Products (${products.length})` },
                    { id: 'bulk-edit', label: 'Bulk Edit (Spreadsheet)' },
                    { id: 'collections', label: `Collections (${shopifyWorkspace.collections.length})` },
                    { id: 'gift-cards', label: `Gift Cards (${shopifyWorkspace.giftCards.length})` },
                  ] as const
                ).map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setProductsSubTab(sub.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer ${
                      productsSubTab === sub.id ? 'bg-[#F85606] text-white' : 'border border-black/15'
                    }`}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>

              {productsSubTab !== 'all' ? (
                <AdminShopifySuite
                  mode={productsSubTab}
                  darkMode={darkMode}
                  firebaseUser={firebaseUser}
                  products={products}
                  orders={orders}
                  vouchers={vouchers}
                  storeSettings={storeSettings}
                  adminUsers={adminUsers}
                  workspace={shopifyWorkspace}
                  abandonedCheckouts={abandonedCheckouts}
                  onSaveWorkspace={handleSaveWorkspace}
                  onDeleteAbandonedCheckout={handleDeleteAbandonedCheckout}
                  onOpenAdminTab={(t) => setActiveTab(t as AdminTab)}
                  onNotify={onNotify}
                />
              ) : (
                <div className="space-y-4">
                  <div className={`rounded-xl border p-4 flex flex-wrap items-center justify-between gap-3 ${cardCls}`}>
                <div className="flex flex-wrap items-center gap-2 flex-1">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={prodSearch}
                      onChange={(e) => setProdSearch(e.target.value)}
                      placeholder="পণ্যের নাম, SKU বা Barcode দিয়ে খুঁজুন..."
                      className={`w-full h-9 pl-9 pr-3 rounded-lg border text-xs outline-none focus:border-[#F85606] ${inputCls}`}
                    />
                  </div>
                  <select
                    value={prodCategoryFilter}
                    onChange={(e) => setProdCategoryFilter(e.target.value as CategorySlug)}
                    className={`h-9 px-3 rounded-lg border text-xs font-semibold ${inputCls}`}
                  >
                    <option value="all">সব ক্যাটাগরি</option>
                    {CATEGORIES.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void handleExportProductsCsv()}
                    className="h-9 px-3 rounded-lg border border-black/15 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> CSV Export
                  </button>
                  <label className="h-9 px-3 rounded-lg border border-black/15 text-xs font-bold inline-flex items-center gap-1 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" /> CSV Import
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      onChange={(e) => void handleImportProductsCsv(e)}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleOpenAddProduct}
                    className="h-9 px-4 rounded-lg bg-[#F85606] hover:bg-[#D94802] text-white text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> নতুন পণ্য
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className={`rounded-xl border p-3.5 flex items-center gap-3.5 ${cardCls}`}
                  >
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-[#F5F5F5] shrink-0">
                      <ResilientImage
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#FFF5EC] text-[#F85606]">
                          {product.categoryLabel}
                        </span>
                        <span className={`text-[10px] font-mono ${subTextCls}`}>{product.sku}</span>
                        {product.isFeatured && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#EEF2FF] text-[#4338CA]">
                            Featured
                          </span>
                        )}
                        {product.videoUrl && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]">
                            Video
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold truncate mt-0.5">{product.name}</h4>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs font-mono">
                        <span className="font-extrabold text-[#F85606]">৳{product.price}</span>
                        <span className={subTextCls}>
                          Cost: ৳{product.costPrice ?? Math.round(product.price * 0.72)}
                        </span>
                        <span className={subTextCls}>Stock: {product.stockLeft ?? 25}</span>
                        <span className={product.inStock ? 'text-[#047857]' : 'text-[#DC2626]'}>
                          {product.inStock ? 'Active' : 'Hidden/Out'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEditProduct(product)}
                        className="p-2 rounded-lg bg-[#EFF6FF] text-[#1D4ED8] cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      {confirmDeleteProdId === product.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={async () => {
                              await deleteProductFromFirestore(product.id);
                              await recordAdminAuditLog(firebaseUser, 'DELETE_PRODUCT', product.id, product.name);
                              setConfirmDeleteProdId(null);
                              onNotify('পণ্য ডিলিট করা হয়েছে!');
                            }}
                            className="px-2 py-1.5 rounded bg-[#DC2626] text-white text-[10px] font-bold cursor-pointer"
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteProdId(null)}
                            className="px-2 py-1.5 rounded border text-[10px] cursor-pointer"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteProdId(product.id)}
                          className="p-2 rounded-lg bg-[#FEF2F2] text-[#DC2626] cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: INVENTORY & WAREHOUSE */}
          {activeTab === 'inventory' && (
            <AdminInventoryPurchaseSection
              mode="inventory"
              darkMode={darkMode}
              firebaseUser={firebaseUser}
              products={products}
              warehouses={warehouses}
              stockMovements={stockMovements}
              suppliers={suppliers}
              purchases={purchases}
              onNotify={onNotify}
            />
          )}

          {/* TAB: PURCHASE & SUPPLIERS */}
          {activeTab === 'purchases' && (
            <AdminInventoryPurchaseSection
              mode="purchases"
              darkMode={darkMode}
              firebaseUser={firebaseUser}
              products={products}
              warehouses={warehouses}
              stockMovements={stockMovements}
              suppliers={suppliers}
              purchases={purchases}
              onNotify={onNotify}
            />
          )}

          {/* TAB: CUSTOMERS & WHOLESALE CRM + TAGS + ORDER HISTORY */}
          {activeTab === 'customers' && (
            <AdminCrmWholesaleSection
              darkMode={darkMode}
              firebaseUser={firebaseUser}
              orders={orders}
              customersCrm={customersCrm}
              registeredUsers={registeredUsers}
              customerTags={shopifyWorkspace.customerTags}
              onUpdateCustomerTags={(phone, tags) =>
                void handleSaveWorkspace(
                  {
                    ...shopifyWorkspace,
                    customerTags: { ...shopifyWorkspace.customerTags, [phone]: tags },
                  },
                  'কাস্টমার ট্যাগ সংরক্ষিত হয়েছে!'
                )
              }
              onNotify={onNotify}
            />
          )}

          {/* TAB: CONTENT (FILES & METAOBJECTS) */}
          {activeTab === 'content' && (
            <AdminShopifySuite
              mode="content"
              darkMode={darkMode}
              firebaseUser={firebaseUser}
              products={products}
              orders={orders}
              vouchers={vouchers}
              storeSettings={storeSettings}
              adminUsers={adminUsers}
              workspace={shopifyWorkspace}
              abandonedCheckouts={abandonedCheckouts}
              onSaveWorkspace={handleSaveWorkspace}
              onDeleteAbandonedCheckout={handleDeleteAbandonedCheckout}
              onOpenAdminTab={(t) => setActiveTab(t as AdminTab)}
              onNotify={onNotify}
            />
          )}

          {/* TAB: ANALYTICS & LIVE VIEW */}
          {activeTab === 'analytics' && (
            <AdminShopifySuite
              mode="analytics"
              darkMode={darkMode}
              firebaseUser={firebaseUser}
              products={products}
              orders={orders}
              vouchers={vouchers}
              storeSettings={storeSettings}
              adminUsers={adminUsers}
              workspace={shopifyWorkspace}
              abandonedCheckouts={abandonedCheckouts}
              onSaveWorkspace={handleSaveWorkspace}
              onDeleteAbandonedCheckout={handleDeleteAbandonedCheckout}
              onOpenAdminTab={(t) => setActiveTab(t as AdminTab)}
              onNotify={onNotify}
            />
          )}

          {/* TAB: ACCOUNTING & P&L */}
          {activeTab === 'accounting' && (
            <AdminAccountingSection
              darkMode={darkMode}
              firebaseUser={firebaseUser}
              products={products}
              orders={orders}
              accountingEntries={accountingEntries}
              storeSettings={storeSettings}
              onNotify={onNotify}
            />
          )}

          {/* TAB: MARKETING, DISCOUNTS (AUTO/BOGO/CODES), CAMPAIGNS, GATEWAYS & BANNERS */}
          {activeTab === 'marketing' && (
            <div className="space-y-4">
              <div className={`rounded-xl border p-2.5 flex flex-wrap items-center gap-2 ${cardCls}`}>
                {(
                  [
                    { id: 'discounts', label: 'Discounts (Codes, Auto, BOGO, Free Ship)' },
                    { id: 'campaigns', label: 'Campaigns & Automations' },
                    { id: 'gateways', label: 'Banners, Pixels & Gateways' },
                  ] as const
                ).map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setMarketingSubTab(sub.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer ${
                      marketingSubTab === sub.id ? 'bg-[#F85606] text-white' : 'border border-black/15'
                    }`}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>

              {marketingSubTab === 'campaigns' ? (
                <AdminShopifySuite
                  mode="campaigns"
                  darkMode={darkMode}
                  firebaseUser={firebaseUser}
                  products={products}
                  orders={orders}
                  vouchers={vouchers}
                  storeSettings={storeSettings}
                  adminUsers={adminUsers}
                  workspace={shopifyWorkspace}
                  abandonedCheckouts={abandonedCheckouts}
                  onSaveWorkspace={handleSaveWorkspace}
                  onDeleteAbandonedCheckout={handleDeleteAbandonedCheckout}
                  onOpenAdminTab={(t) => setActiveTab(t as AdminTab)}
                  onNotify={onNotify}
                />
              ) : marketingSubTab === 'discounts' ? (
                <div className="space-y-5">
                  <AdminShopifySuite
                    mode="discounts"
                    darkMode={darkMode}
                    firebaseUser={firebaseUser}
                    products={products}
                    orders={orders}
                    vouchers={vouchers}
                    storeSettings={storeSettings}
                    adminUsers={adminUsers}
                    workspace={shopifyWorkspace}
                    abandonedCheckouts={abandonedCheckouts}
                    onSaveWorkspace={handleSaveWorkspace}
                    onDeleteAbandonedCheckout={handleDeleteAbandonedCheckout}
                    onOpenAdminTab={(t) => setActiveTab(t as AdminTab)}
                    onNotify={onNotify}
                  />
                  <div className={`rounded-xl border p-4 sm:p-5 space-y-4 ${cardCls}`}>
                    <h3 className="text-sm font-extrabold flex items-center gap-2">
                      <Tag className="w-4 h-4 text-[#F85606]" /> Checkout Promo Codes (Firestore Synced)
                    </h3>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!voucherCode.trim()) return;
                      const code = voucherCode.trim().toUpperCase();
                      await saveVoucherToFirestore({
                        code,
                        title: voucherTitle.trim() || `${code} Discount`,
                        discount: Number(voucherDiscount) || 50,
                        minSpend: Number(voucherMinSpend) || 500,
                        expiry: voucherExpiry.trim() || '31 Dec 2026',
                        active: true,
                      });
                      setVoucherCode('');
                      setVoucherTitle('');
                      onNotify('নতুন ভাউচার কোড সেভ হয়েছে!');
                    }}
                    className="grid grid-cols-2 gap-2 text-xs"
                  >
                    <input
                      type="text"
                      required
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value)}
                      placeholder="Code (EID150)"
                      className={`h-9 px-2.5 rounded border font-mono uppercase ${inputCls}`}
                    />
                    <input
                      type="text"
                      value={voucherTitle}
                      onChange={(e) => setVoucherTitle(e.target.value)}
                      placeholder="অফার টাইটেল"
                      className={`h-9 px-2.5 rounded border ${inputCls}`}
                    />
                    <input
                      type="number"
                      value={voucherDiscount}
                      onChange={(e) => setVoucherDiscount(e.target.value)}
                      placeholder="Discount ৳"
                      className={`h-9 px-2.5 rounded border font-mono ${inputCls}`}
                    />
                    <input
                      type="number"
                      value={voucherMinSpend}
                      onChange={(e) => setVoucherMinSpend(e.target.value)}
                      placeholder="Min Spend ৳"
                      className={`h-9 px-2.5 rounded border font-mono ${inputCls}`}
                    />
                    <input
                      type="text"
                      value={voucherExpiry}
                      onChange={(e) => setVoucherExpiry(e.target.value)}
                      placeholder="Expiry"
                      className={`h-9 px-2.5 rounded border ${inputCls}`}
                    />
                    <button
                      type="submit"
                      className="h-9 rounded bg-[#F85606] text-white font-bold cursor-pointer"
                    >
                      + ভাউচার সেভ
                    </button>
                  </form>

                  <div className="space-y-1.5">
                    {vouchers.map((v) => (
                      <div
                        key={v.code}
                        className="p-2.5 rounded-lg border border-black/10 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-mono font-extrabold text-[#F85606]">{v.code}</span> ·{' '}
                          <span className="font-bold">{v.title}</span> (৳{v.discount} OFF / Min ৳{v.minSpend})
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => void saveVoucherToFirestore({ ...v, active: !v.active })}
                            className="px-2 py-0.5 rounded bg-[#ECFDF5] text-[#047857] text-[10px] font-bold cursor-pointer"
                          >
                            {v.active ? 'Active' : 'Paused'}
                          </button>
                          <button
                            type="button"
                            onClick={() => void deleteVoucherFromFirestore(v.code)}
                            className="p-1 text-[#DC2626] cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  <div className="lg:col-span-6 space-y-5">
                {/* Dynamic Hero Banners */}
                <div className={`rounded-xl border p-4 sm:p-5 space-y-3 ${cardCls}`}>
                  <h3 className="text-sm font-extrabold">Hero Slider Banner Manager</h3>
                  <div className="space-y-2.5 text-xs">
                    <MediaUploaderControl
                      mode="single-image"
                      label="হিরো ব্যানার ছবি আপলোড করুন (Upload or Paste URL)"
                      singleUrl={bannerImage}
                      onSingleUrlChange={setBannerImage}
                      darkMode={darkMode}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={bannerAlt}
                        onChange={(e) => setBannerAlt(e.target.value)}
                        placeholder="Banner Caption"
                        className={`h-9 px-2.5 rounded border ${inputCls}`}
                      />
                      <select
                        value={bannerProductId}
                        onChange={(e) => setBannerProductId(e.target.value)}
                        className={`h-9 px-2 rounded border ${inputCls}`}
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!bannerImage.trim()) return;
                        const newSlide: HeroBannerConfig = {
                          id: `banner-${Date.now()}`,
                          image: bannerImage.trim(),
                          alt: bannerAlt.trim() || 'Khidmatul Ummah Offer',
                          targetProductId: bannerProductId,
                        };
                        setSettingsDraft((s) => ({
                          ...s,
                          heroBanners: [...(s.heroBanners ?? []), newSlide],
                        }));
                        setBannerImage('');
                        setBannerAlt('');
                        onNotify('ড্রাফটে যোগ হয়েছে — ডানপাশের সেভ বাটনে ক্লিক করুন!');
                      }}
                      className="w-full h-8 rounded bg-[#1D4ED8] text-white font-bold cursor-pointer"
                    >
                      + ব্যানার যোগ করুন
                    </button>
                  </div>
                  {(settingsDraft.heroBanners ?? []).map((b) => (
                    <div key={b.id} className="flex justify-between text-xs p-2 rounded border border-black/10">
                      <span className="truncate">{b.alt}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setSettingsDraft((s) => ({
                            ...s,
                            heroBanners: (s.heroBanners ?? []).filter((x) => x.id !== b.id),
                          }))
                        }
                        className="text-[#DC2626] cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                {/* Newsletter & Reviews */}
                <div className={`rounded-xl border p-4 space-y-3 ${cardCls}`}>
                  <h3 className="text-sm font-extrabold flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-[#047857]" /> Subscribers ({subscribers.length}) &amp;
                    <MessageSquare className="w-4 h-4 text-[#F85606]" /> Reviews ({reviews.length})
                  </h3>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto text-xs">
                    {reviews.map((r) => (
                      <div key={r.id} className="flex justify-between items-center p-2 rounded border border-black/10">
                        <div>
                          <span className="font-bold">{r.author}</span> ({r.rating}★) — {r.comment}
                        </div>
                        <button
                          type="button"
                          onClick={() => void deleteReviewFromFirestore(r.id)}
                          className="text-[#DC2626] cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    {subscribers.map((s) => (
                      <div key={s.id} className="text-[11px] font-mono opacity-80">
                        • {s.email}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Storefront, Payment, Courier & Pixel Config */}
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setBusyAction('save-settings');
                  try {
                    await saveStoreSettingsToFirestore(settingsDraft, firebaseUser.uid);
                    await recordAdminAuditLog(firebaseUser, 'UPDATE_STORE_SETTINGS', 'store_settings/main');
                    onNotify('স্টোর, পেমেন্ট, কুরিয়ার ও মার্কেটিং সেটিংস সেভ হয়েছে!');
                  } finally {
                    setBusyAction(null);
                  }
                }}
                className={`lg:col-span-6 rounded-xl border p-4 sm:p-5 space-y-3 text-xs ${cardCls}`}
              >
                <h3 className="text-sm font-extrabold">
                  Payment Gateways, Courier APIs, Pixels &amp; Store Config
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    value={settingsDraft.noticeText}
                    onChange={(e) => setSettingsDraft((s) => ({ ...s, noticeText: e.target.value }))}
                    placeholder="Top Marquee Notice"
                    className={`sm:col-span-2 h-9 px-3 rounded border ${inputCls}`}
                  />
                  <input
                    type="number"
                    value={settingsDraft.dhakaDeliveryFee}
                    onChange={(e) =>
                      setSettingsDraft((s) => ({ ...s, dhakaDeliveryFee: Number(e.target.value) || 0 }))
                    }
                    placeholder="Dhaka Delivery ৳"
                    className={`h-9 px-3 rounded border font-mono ${inputCls}`}
                  />
                  <input
                    type="number"
                    value={settingsDraft.outsideDeliveryFee}
                    onChange={(e) =>
                      setSettingsDraft((s) => ({
                        ...s,
                        outsideDeliveryFee: Number(e.target.value) || 0,
                      }))
                    }
                    placeholder="Outside Dhaka ৳"
                    className={`h-9 px-3 rounded border font-mono ${inputCls}`}
                  />
                  <input
                    type="number"
                    value={settingsDraft.freeShippingMin}
                    onChange={(e) =>
                      setSettingsDraft((s) => ({ ...s, freeShippingMin: Number(e.target.value) || 0 }))
                    }
                    placeholder="Free Shipping Min ৳"
                    className={`h-9 px-3 rounded border font-mono ${inputCls}`}
                  />
                  <label className="flex items-center gap-2 font-bold">
                    <input
                      type="checkbox"
                      checked={Boolean(settingsDraft.freeDeliveryCampaignActive)}
                      onChange={(e) =>
                        setSettingsDraft((s) => ({
                          ...s,
                          freeDeliveryCampaignActive: e.target.checked,
                        }))
                      }
                    />
                    Free Delivery Campaign Active
                  </label>
                  <input
                    type="text"
                    value={settingsDraft.bkashMerchant ?? ''}
                    onChange={(e) => setSettingsDraft((s) => ({ ...s, bkashMerchant: e.target.value }))}
                    placeholder="bKash Merchant"
                    className={`h-9 px-3 rounded border font-mono ${inputCls}`}
                  />
                  <input
                    type="text"
                    value={settingsDraft.nagadMerchant ?? ''}
                    onChange={(e) => setSettingsDraft((s) => ({ ...s, nagadMerchant: e.target.value }))}
                    placeholder="Nagad Merchant"
                    className={`h-9 px-3 rounded border font-mono ${inputCls}`}
                  />
                  <input
                    type="text"
                    value={settingsDraft.fbPixelId ?? ''}
                    onChange={(e) => setSettingsDraft((s) => ({ ...s, fbPixelId: e.target.value }))}
                    placeholder="Facebook Pixel ID"
                    className={`h-9 px-3 rounded border font-mono ${inputCls}`}
                  />
                  <input
                    type="text"
                    value={settingsDraft.ga4MeasurementId ?? ''}
                    onChange={(e) =>
                      setSettingsDraft((s) => ({ ...s, ga4MeasurementId: e.target.value }))
                    }
                    placeholder="GA4 Measurement ID (G-...)"
                    className={`h-9 px-3 rounded border font-mono ${inputCls}`}
                  />
                  <input
                    type="text"
                    value={settingsDraft.gtmContainerId ?? ''}
                    onChange={(e) =>
                      setSettingsDraft((s) => ({ ...s, gtmContainerId: e.target.value }))
                    }
                    placeholder="Google Tag Manager (GTM-...)"
                    className={`h-9 px-3 rounded border font-mono ${inputCls}`}
                  />
                  <label className="flex items-center gap-2 font-bold">
                    <input
                      type="checkbox"
                      checked={Boolean(settingsDraft.metaCapiEnabled)}
                      onChange={(e) =>
                        setSettingsDraft((s) => ({ ...s, metaCapiEnabled: e.target.checked }))
                      }
                    />
                    Meta Conversion API (CAPI)
                  </label>
                  <label className="flex items-center gap-2 font-bold">
                    <input
                      type="checkbox"
                      checked={Boolean(settingsDraft.popupEnabled)}
                      onChange={(e) =>
                        setSettingsDraft((s) => ({ ...s, popupEnabled: e.target.checked }))
                      }
                    />
                    Promo Welcome Popup Enabled
                  </label>
                  <label className="flex items-center gap-2 font-bold">
                    <input
                      type="checkbox"
                      checked={settingsDraft.gmcFeedEnabled ?? true}
                      onChange={(e) =>
                        setSettingsDraft((s) => ({ ...s, gmcFeedEnabled: e.target.checked }))
                      }
                    />
                    Google Merchant Center Feed
                  </label>
                </div>

                <div className="flex flex-wrap gap-3 pt-1">
                  {(['sslcommerzEnabled', 'steadfastEnabled', 'pathaoEnabled', 'redxEnabled', 'ecourierEnabled'] as const).map(
                    (k) => (
                      <label key={k} className="inline-flex items-center gap-1.5 font-bold">
                        <input
                          type="checkbox"
                          checked={Boolean(settingsDraft[k])}
                          onChange={(e) => setSettingsDraft((s) => ({ ...s, [k]: e.target.checked }))}
                        />
                        {k.replace('Enabled', '').toUpperCase()}
                      </label>
                    )
                  )}
                </div>

                <button
                  type="submit"
                  disabled={busyAction === 'save-settings'}
                  className="w-full h-10 rounded-lg bg-[#047857] hover:bg-[#065F46] text-white font-extrabold cursor-pointer"
                >
                  সব সেটিংস সংরক্ষণ করুন
                </button>
              </form>
            </div>
              )}
            </div>
          )}

          {/* TAB: SALES CHANNELS (ONLINE STORE NAV, POS COUNTER, SOCIAL) */}
          {activeTab === 'sales-channels' && (
            <AdminShopifySuite
              mode="sales-channels"
              darkMode={darkMode}
              firebaseUser={firebaseUser}
              products={products}
              orders={orders}
              vouchers={vouchers}
              storeSettings={storeSettings}
              adminUsers={adminUsers}
              workspace={shopifyWorkspace}
              abandonedCheckouts={abandonedCheckouts}
              onSaveWorkspace={handleSaveWorkspace}
              onDeleteAbandonedCheckout={handleDeleteAbandonedCheckout}
              onOpenAdminTab={(t) => setActiveTab(t as AdminTab)}
              onNotify={onNotify}
            />
          )}

          {/* TAB: APPS & PERMISSIONS */}
          {activeTab === 'apps' && (
            <AdminShopifySuite
              mode="apps"
              darkMode={darkMode}
              firebaseUser={firebaseUser}
              products={products}
              orders={orders}
              vouchers={vouchers}
              storeSettings={storeSettings}
              adminUsers={adminUsers}
              workspace={shopifyWorkspace}
              abandonedCheckouts={abandonedCheckouts}
              onSaveWorkspace={handleSaveWorkspace}
              onDeleteAbandonedCheckout={handleDeleteAbandonedCheckout}
              onOpenAdminTab={(t) => setActiveTab(t as AdminTab)}
              onNotify={onNotify}
            />
          )}

          {/* TAB: ALL-IN-ONE MULTI-TEMPLATE & THEME STUDIO */}
          {activeTab === 'appearance' && (
            <div className="space-y-5">
              {/* Top Action Header */}
              <div className={`rounded-xl border p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 ${cardCls}`}>
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold flex items-center gap-2">
                    <Palette className="w-5 h-5 text-[#F85606]" />
                    <span>All-in-One Multi-Template, Theme &amp; Brand Studio</span>
                  </h2>
                  <p className={`text-xs mt-0.5 ${subTextCls}`}>
                    ৮টি ফুল স্টোর কিট, ১০টি কালার থিম, ৪টি ফন্ট, ৮টি ওয়েবসাইট লেআউট, ৪টি হিরো, ৬টি হেডার, ৪টি ক্যাটাগরি, ৮টি প্রোডাক্ট কার্ড, ৪টি ফুটার ও ৬টি প্রোমো টেমপ্লেট।
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const def = THEME_PRESETS['daraz-orange'];
                      setSettingsDraft((s) => ({
                        ...s,
                        themePreset: 'daraz-orange',
                        websiteTemplate: 'daraz-mall',
                        heroStyle: 'classic-mega',
                        headerStyle: def.headerStyle,
                        categoryStyle: 'grid-cards',
                        productCardDesign: 'classic-mall',
                        footerStyle: 'daraz-3tier',
                        fontStyle: 'plus-jakarta',
                        primaryColor: def.primaryColor,
                        secondaryColor: def.secondaryColor,
                        accentColor: def.accentColor,
                        backgroundColor: def.backgroundColor,
                      }));
                      updateThemeAdvanced({ ...DEFAULT_THEME_ADVANCED });
                      onNotify('ডিফল্ট Daraz থিম ও প্রো ডিজাইন টোকেন রিসেট হয়েছে — Publish Theme Live চাপুন।');
                    }}
                    className="h-9 px-3 rounded-lg border border-black/15 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Default</span>
                  </button>
                  <button
                    type="button"
                    disabled={busyAction === 'save-theme'}
                    onClick={async () => {
                      setBusyAction('save-theme');
                      try {
                        await saveStoreSettingsToFirestore(settingsDraft, firebaseUser.uid);
                        await handleSaveWorkspace({
                          ...shopifyWorkspace,
                          themeAdvanced: resolvedThemeAdvanced,
                        });
                        onThemeAdvancedChange?.(resolvedThemeAdvanced);
                        window.dispatchEvent(
                          new CustomEvent('ku-theme-advanced-updated', {
                            detail: resolvedThemeAdvanced,
                          })
                        );
                        await recordAdminAuditLog(
                          firebaseUser,
                          'UPDATE_THEME_TEMPLATE',
                          'store_settings/main',
                          `Layout:${settingsDraft.websiteTemplate ?? 'daraz-mall'}, Hero:${settingsDraft.heroStyle ?? 'classic-mega'}, Header:${settingsDraft.headerStyle ?? 'solid-white'}, Card:${settingsDraft.productCardDesign ?? 'classic-mall'}, Surface:${resolvedThemeAdvanced.surfaceMode}, Cols:${resolvedThemeAdvanced.gridColsDesktop}`
                        );
                        onNotify('সমস্ত টেমপ্লেট, প্রো ডিজাইন টোকেন ও সেকশন সফলভাবে লাইভ সেভ হয়েছে!');
                      } finally {
                        setBusyAction(null);
                      }
                    }}
                    className="h-9 px-4 rounded-lg bg-[#047857] hover:bg-[#065F46] text-white text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
                  >
                    <Check className="w-4 h-4" />
                    <span>{busyAction === 'save-theme' ? 'Publishing...' : 'Publish Theme Live'}</span>
                  </button>
                </div>
              </div>

              {/* Studio Sub-Navigation Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {[
                  { id: 'kits' as const, label: '১. ফুল স্টোর কিট (8 Kits)' },
                  { id: 'colors-fonts' as const, label: '২. কালার ও ফন্ট (10 + 4)' },
                  { id: 'header-hero' as const, label: '৩. লেআউট, হিরো ও হেডার (8+4+6)' },
                  { id: 'category-cards' as const, label: '৪. ক্যাটাগরি ও কার্ড (4 + 8)' },
                  { id: 'footer-promo' as const, label: '৫. ফুটার ও প্রোমো কপি (4 + 6)' },
                  { id: 'pro-tokens' as const, label: '৬. প্রো টোকেন, সেকশন ও CSS' },
                ].map((tab) => {
                  const active = studioSubTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setStudioSubTab(tab.id)}
                      className={`px-3.5 py-2 rounded-lg text-xs font-extrabold border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                        active
                          ? 'bg-[#F85606] text-white border-[#F85606] shadow-xs'
                          : `${cardCls} hover:border-[#F85606]/60`
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
                {/* Left Main Template Controls (8 Columns on XL) */}
                <div className="xl:col-span-8 space-y-5">
                  {/* PANEL 1: 8 MASTER STORE KITS */}
                  {studioSubTab === 'kits' && (
                    <div className={`rounded-xl border p-4 sm:p-5 space-y-4 ${cardCls}`}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-extrabold flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-[#F85606]" />
                            <span>১-ক্লিক কমপ্লিট স্টোর কিট (One-Click Master Storefront Kits)</span>
                          </h3>
                          <p className={`text-[11px] mt-0.5 ${subTextCls}`}>
                            যেকোনো কিট সিলেক্ট করলেই পুরো ওয়েবসাইটের লেআউট, হিরো, হেডার, কার্ড, ফুটার, রঙ ও ফন্ট একসাথে বদলে যাবে।
                          </p>
                        </div>
                        <label className="inline-flex items-center gap-2 text-xs font-bold cursor-pointer">
                          <input
                            type="checkbox"
                            checked={applyKitCopy}
                            onChange={(e) => setApplyKitCopy(e.target.checked)}
                            className="accent-[#F85606]"
                          />
                          <span>নোটিশ ও পপআপ টেক্সটও অ্যাপ্লাই করুন</span>
                        </label>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {MASTER_TEMPLATE_KITS.map((kit) => {
                          const isCurrent =
                            (settingsDraft.websiteTemplate ?? 'daraz-mall') === kit.websiteTemplate &&
                            (settingsDraft.themePreset ?? 'daraz-orange') === kit.themePreset &&
                            (settingsDraft.productCardDesign ?? 'classic-mall') === kit.productCardDesign;

                          return (
                            <div
                              key={kit.id}
                              className={`rounded-xl border p-3.5 flex flex-col justify-between gap-3 transition-all ${
                                isCurrent
                                  ? 'border-[#F85606] ring-2 ring-[#F85606]/25 bg-[#FFF5EC]/20'
                                  : 'border-black/15 hover:border-black/35'
                              }`}
                            >
                              <div className="space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <p className="text-sm font-extrabold">{kit.name}</p>
                                    <p className={`text-[11px] font-bold ${subTextCls}`}>{kit.bnName}</p>
                                  </div>
                                  <span className="px-2 py-0.5 rounded bg-[#EFF6FF] text-[#1D4ED8] text-[10px] font-bold shrink-0">
                                    {kit.badge}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <span
                                    className="w-4 h-4 rounded-full border border-white shadow-xs"
                                    style={{ backgroundColor: kit.primaryColor }}
                                  />
                                  <span
                                    className="w-4 h-4 rounded-full border border-white shadow-xs"
                                    style={{ backgroundColor: kit.secondaryColor }}
                                  />
                                  <span
                                    className="w-4 h-4 rounded-full border border-white shadow-xs"
                                    style={{ backgroundColor: kit.accentColor }}
                                  />
                                  <span className={`text-[10px] font-mono ml-1 ${subTextCls}`}>
                                    {kit.heroStyle} · {kit.productCardDesign}
                                  </span>
                                </div>

                                <p className={`text-[11px] leading-relaxed ${subTextCls}`}>
                                  {kit.description}
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setSettingsDraft((s) => ({
                                    ...s,
                                    websiteTemplate: kit.websiteTemplate,
                                    heroStyle: kit.heroStyle,
                                    headerStyle: kit.headerStyle,
                                    categoryStyle: kit.categoryStyle,
                                    productCardDesign: kit.productCardDesign,
                                    footerStyle: kit.footerStyle,
                                    themePreset: kit.themePreset,
                                    fontStyle: kit.fontStyle,
                                    primaryColor: kit.primaryColor,
                                    secondaryColor: kit.secondaryColor,
                                    accentColor: kit.accentColor,
                                    backgroundColor: kit.backgroundColor,
                                    ...(applyKitCopy
                                      ? {
                                          noticeText: kit.noticeText,
                                          popupTitle: kit.popupTitle,
                                          popupBody: kit.popupBody,
                                        }
                                      : {}),
                                  }));
                                  onNotify(`"${kit.name}" কিট লোড হয়েছে! লাইভ করতে "Publish Theme Live" চাপুন।`);
                                }}
                                className={`w-full py-2 rounded-lg text-xs font-extrabold cursor-pointer transition-colors ${
                                  isCurrent
                                    ? 'bg-[#047857] text-white'
                                    : 'bg-[#F85606] hover:bg-[#D94802] text-white'
                                }`}
                              >
                                {isCurrent ? '✓ Active in Draft' : 'Apply Complete Kit'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* PANEL 2: 10 COLOR THEMES + HEX PICKERS + 4 FONT FAMILIES */}
                  {studioSubTab === 'colors-fonts' && (
                    <div className={`rounded-xl border p-4 sm:p-5 space-y-5 ${cardCls}`}>
                      <div className="space-y-3">
                        <h3 className="text-sm font-extrabold flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-[#F85606]" />
                          <span>১০টি প্রিমিয়াম কালার থিম (Color Themes)</span>
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                          {(Object.keys(THEME_PRESETS) as ThemePresetId[]).map((presetKey) => {
                            const preset = THEME_PRESETS[presetKey];
                            const active = settingsDraft.themePreset === presetKey;
                            return (
                              <button
                                key={presetKey}
                                type="button"
                                onClick={() =>
                                  setSettingsDraft((s) => ({
                                    ...s,
                                    themePreset: presetKey,
                                    primaryColor: preset.primaryColor,
                                    secondaryColor: preset.secondaryColor,
                                    accentColor: preset.accentColor,
                                    backgroundColor: preset.backgroundColor,
                                    headerStyle: preset.headerStyle,
                                  }))
                                }
                                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                                  active
                                    ? 'border-[#F85606] ring-2 ring-[#F85606]/25'
                                    : 'border-black/10 hover:border-black/30'
                                }`}
                              >
                                <div className="flex items-center gap-1.5 mb-2">
                                  <span
                                    className="w-5 h-5 rounded-full border border-white shadow-xs"
                                    style={{ backgroundColor: preset.primaryColor }}
                                  />
                                  <span
                                    className="w-4 h-4 rounded-full border border-white shadow-xs"
                                    style={{ backgroundColor: preset.secondaryColor }}
                                  />
                                  <span
                                    className="w-4 h-4 rounded-full border border-white shadow-xs"
                                    style={{ backgroundColor: preset.accentColor }}
                                  />
                                  <span
                                    className="w-4 h-4 rounded-full border border-black/15 shadow-xs"
                                    style={{ backgroundColor: preset.backgroundColor }}
                                  />
                                </div>
                                <p className="text-xs font-extrabold">{preset.label}</p>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-black/10 text-xs">
                        {[
                          {
                            key: 'primaryColor' as const,
                            label: 'Primary Brand',
                            val: settingsDraft.primaryColor || DEFAULT_STORE_SETTINGS.primaryColor || '#F85606',
                          },
                          {
                            key: 'secondaryColor' as const,
                            label: 'Secondary Ink',
                            val: settingsDraft.secondaryColor || '#212121',
                          },
                          {
                            key: 'accentColor' as const,
                            label: 'Trust Accent',
                            val: settingsDraft.accentColor || '#047857',
                          },
                          {
                            key: 'backgroundColor' as const,
                            label: 'Page Canvas',
                            val: settingsDraft.backgroundColor || '#F5F5F5',
                          },
                        ].map((picker) => (
                          <label key={picker.key} className="space-y-1.5 block">
                            <span className="font-bold block">{picker.label}</span>
                            <div className="flex items-center gap-2 p-1.5 rounded-lg border border-black/15">
                              <input
                                type="color"
                                value={picker.val}
                                onChange={(e) =>
                                  setSettingsDraft((s) => ({ ...s, [picker.key]: e.target.value }))
                                }
                                className="w-8 h-7 rounded border-0 cursor-pointer bg-transparent"
                              />
                              <span className="font-mono text-[11px] font-bold uppercase">{picker.val}</span>
                            </div>
                          </label>
                        ))}
                      </div>

                      <div className="pt-3 border-t border-black/10 space-y-2.5">
                        <h3 className="text-sm font-extrabold">
                          ওয়েবসাইট ফন্ট ও টাইপোগ্রাফি টেমপ্লেট (Font Stacks)
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                          {FONT_TEMPLATES.map((ft) => {
                            const active = (settingsDraft.fontStyle ?? 'plus-jakarta') === ft.id;
                            return (
                              <button
                                key={ft.id}
                                type="button"
                                onClick={() =>
                                  setSettingsDraft((s) => ({ ...s, fontStyle: ft.id as FontStyleId }))
                                }
                                className={`p-3 rounded-xl border text-left cursor-pointer space-y-1 ${
                                  active
                                    ? 'border-[#F85606] ring-2 ring-[#F85606]/25 bg-[#FFF5EC]/20'
                                    : 'border-black/15 hover:border-black/35'
                                }`}
                              >
                                <p className="font-extrabold text-sm" style={{ fontFamily: ft.headingFamily }}>
                                  {ft.title}
                                </p>
                                <p className={`text-[11px] ${subTextCls}`} style={{ fontFamily: ft.cssFamily }}>
                                  {ft.desc}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PANEL 3: 8 WEBSITE LAYOUTS + 4 HERO STYLES + 6 HEADER STYLES */}
                  {studioSubTab === 'header-hero' && (
                    <div className="space-y-5">
                      <div className={`rounded-xl border p-4 sm:p-5 space-y-3 ${cardCls}`}>
                        <h3 className="text-sm font-extrabold">
                          ৮টি ওয়েবসাইট হোমপেজ লেআউট (Website Layouts)
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          {WEBSITE_TEMPLATES.map((tpl) => {
                            const active = (settingsDraft.websiteTemplate ?? 'daraz-mall') === tpl.id;
                            return (
                              <button
                                key={tpl.id}
                                type="button"
                                onClick={() =>
                                  setSettingsDraft((s) => ({
                                    ...s,
                                    websiteTemplate: tpl.id as WebsiteTemplateId,
                                  }))
                                }
                                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer space-y-1.5 ${
                                  active
                                    ? 'border-[#F85606] ring-2 ring-[#F85606]/25 bg-[#FFF5EC]/20'
                                    : 'border-black/15 hover:border-black/35'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-extrabold text-sm">{tpl.name}</span>
                                  <span className="px-2 py-0.5 rounded bg-[#EFF6FF] text-[#1D4ED8] text-[10px] font-bold">
                                    {tpl.badge}
                                  </span>
                                </div>
                                <p className={`text-[11px] leading-relaxed ${subTextCls}`}>{tpl.desc}</p>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className={`rounded-xl border p-4 sm:p-5 space-y-3 ${cardCls}`}>
                        <h3 className="text-sm font-extrabold">৪টি হিরো সেকশন টেমপ্লেট (Hero Templates)</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          {HERO_TEMPLATES.map((hs) => {
                            const active = (settingsDraft.heroStyle ?? 'classic-mega') === hs.id;
                            return (
                              <button
                                key={hs.id}
                                type="button"
                                onClick={() =>
                                  setSettingsDraft((s) => ({ ...s, heroStyle: hs.id as HeroStyleId }))
                                }
                                className={`p-3 rounded-xl border text-left cursor-pointer space-y-1 ${
                                  active
                                    ? 'border-[#F85606] ring-2 ring-[#F85606]/25 bg-[#FFF5EC]/20'
                                    : 'border-black/15 hover:border-black/35'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-extrabold">{hs.title}</span>
                                  <span className="px-1.5 py-0.5 rounded bg-[#ECFDF5] text-[#047857] text-[10px] font-bold">
                                    {hs.badge}
                                  </span>
                                </div>
                                <p className={`text-[11px] ${subTextCls}`}>{hs.desc}</p>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className={`rounded-xl border p-4 sm:p-5 space-y-3 ${cardCls}`}>
                        <h3 className="text-sm font-extrabold">৬টি হেডার নেভিগেশন টেমপ্লেট (Header Styles)</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
                          {HEADER_TEMPLATES.map((hs) => (
                            <button
                              key={hs.id}
                              type="button"
                              onClick={() =>
                                setSettingsDraft((s) => ({ ...s, headerStyle: hs.id as HeaderStyleId }))
                              }
                              className={`p-3 rounded-xl border text-left cursor-pointer space-y-1 ${
                                (settingsDraft.headerStyle ?? 'solid-white') === hs.id
                                  ? 'border-[#F85606] ring-2 ring-[#F85606]/25 bg-[#FFF5EC]/20'
                                  : 'border-black/15 hover:border-black/35'
                              }`}
                            >
                              <p className="font-extrabold">{hs.title}</p>
                              <p className={`text-[10px] ${subTextCls}`}>{hs.desc}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PANEL 4: 4 CATEGORY TEMPLATES + 8 PRODUCT CARD TEMPLATES */}
                  {studioSubTab === 'category-cards' && (
                    <div className="space-y-5">
                      <div className={`rounded-xl border p-4 sm:p-5 space-y-3 ${cardCls}`}>
                        <h3 className="text-sm font-extrabold">
                          ৪টি ক্যাটাগরি শোকেস টেমপ্লেট (Category Styles)
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          {CATEGORY_TEMPLATES.map((cs) => {
                            const active = (settingsDraft.categoryStyle ?? 'grid-cards') === cs.id;
                            return (
                              <button
                                key={cs.id}
                                type="button"
                                onClick={() =>
                                  setSettingsDraft((s) => ({
                                    ...s,
                                    categoryStyle: cs.id as CategoryStyleId,
                                  }))
                                }
                                className={`p-3 rounded-xl border text-left cursor-pointer space-y-1 ${
                                  active
                                    ? 'border-[#F85606] ring-2 ring-[#F85606]/25 bg-[#FFF5EC]/20'
                                    : 'border-black/15 hover:border-black/35'
                                }`}
                              >
                                <p className="font-extrabold">{cs.title}</p>
                                <p className={`text-[11px] ${subTextCls}`}>{cs.desc}</p>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className={`rounded-xl border p-4 sm:p-5 space-y-3 ${cardCls}`}>
                        <h3 className="text-sm font-extrabold">
                          ৮টি প্রোডাক্ট কার্ড ডিজাইন টেমপ্লেট (Product Card Styles)
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          {PRODUCT_CARD_TEMPLATES.map((cd) => {
                            const active =
                              (settingsDraft.productCardDesign ?? 'classic-mall') === cd.id;
                            return (
                              <button
                                key={cd.id}
                                type="button"
                                onClick={() =>
                                  setSettingsDraft((s) => ({
                                    ...s,
                                    productCardDesign: cd.id as ProductCardDesignId,
                                  }))
                                }
                                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer space-y-1.5 ${
                                  active
                                    ? 'border-[#F85606] ring-2 ring-[#F85606]/25 bg-[#FFF5EC]/20'
                                    : 'border-black/15 hover:border-black/35'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-extrabold">{cd.title}</span>
                                  <span className="px-2 py-0.5 rounded bg-[#FFF7ED] text-[#C2410C] text-[10px] font-bold">
                                    {cd.tag}
                                  </span>
                                </div>
                                <p className={`text-[11px] ${subTextCls}`}>{cd.desc}</p>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PANEL 5: 4 FOOTER TEMPLATES + 6 PROMO NOTICE & POPUP TEMPLATES */}
                  {studioSubTab === 'footer-promo' && (
                    <div className="space-y-5">
                      <div className={`rounded-xl border p-4 sm:p-5 space-y-3 ${cardCls}`}>
                        <h3 className="text-sm font-extrabold">৪টি ফুটার লেআউট টেমপ্লেট (Footer Styles)</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          {FOOTER_TEMPLATES.map((ft) => {
                            const active = (settingsDraft.footerStyle ?? 'daraz-3tier') === ft.id;
                            return (
                              <button
                                key={ft.id}
                                type="button"
                                onClick={() =>
                                  setSettingsDraft((s) => ({
                                    ...s,
                                    footerStyle: ft.id as FooterStyleId,
                                  }))
                                }
                                className={`p-3.5 rounded-xl border text-left cursor-pointer space-y-1 ${
                                  active
                                    ? 'border-[#F85606] ring-2 ring-[#F85606]/25 bg-[#FFF5EC]/20'
                                    : 'border-black/15 hover:border-black/35'
                                }`}
                              >
                                <p className="font-extrabold">{ft.title}</p>
                                <p className={`text-[11px] ${subTextCls}`}>{ft.desc}</p>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className={`rounded-xl border p-4 sm:p-5 space-y-4 ${cardCls}`}>
                        <div>
                          <h3 className="text-sm font-extrabold">
                            ৬টি নোটিশ বার ও ওয়েলকাম পপআপ কপি টেমপ্লেট (Promo Copy Templates)
                          </h3>
                          <p className={`text-[11px] mt-0.5 ${subTextCls}`}>
                            এক ক্লিকে প্রোমোশনাল নোটিশ ও পপআপ অফার টেক্সট পরিবর্তন করুন এবং নিচে প্রয়োজনমতো এডিট করুন।
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
                          {PROMO_NOTICE_TEMPLATES.map((promo) => (
                            <button
                              key={promo.id}
                              type="button"
                              onClick={() => {
                                setSettingsDraft((s) => ({
                                  ...s,
                                  noticeText: promo.noticeText,
                                  popupTitle: promo.popupTitle,
                                  popupBody: promo.popupBody,
                                  popupEnabled: true,
                                }));
                                onNotify(`"${promo.name}" প্রোমো টেক্সট যুক্ত হয়েছে!`);
                              }}
                              className="p-3 rounded-xl border border-black/15 hover:border-[#F85606] text-left cursor-pointer space-y-1"
                            >
                              <p className="font-extrabold text-[#F85606]">{promo.name}</p>
                              <p className={`text-[10px] line-clamp-2 ${subTextCls}`}>{promo.noticeText}</p>
                            </button>
                          ))}
                        </div>

                        <div className="space-y-2.5 pt-2 border-t border-black/10 text-xs">
                          <label className="block space-y-1">
                            <span className="font-bold">Live Top Notice Text</span>
                            <input
                              type="text"
                              value={settingsDraft.noticeText}
                              onChange={(e) =>
                                setSettingsDraft((s) => ({ ...s, noticeText: e.target.value }))
                              }
                              className={`w-full h-9 px-3 rounded-lg border ${inputCls}`}
                            />
                          </label>
                          <label className="block space-y-1">
                            <span className="font-bold">Welcome Popup Headline</span>
                            <input
                              type="text"
                              value={settingsDraft.popupTitle}
                              onChange={(e) =>
                                setSettingsDraft((s) => ({ ...s, popupTitle: e.target.value }))
                              }
                              className={`w-full h-9 px-3 rounded-lg border ${inputCls}`}
                            />
                          </label>
                          <label className="block space-y-1">
                            <span className="font-bold">Welcome Popup Body</span>
                            <textarea
                              rows={2}
                              value={settingsDraft.popupBody}
                              onChange={(e) =>
                                setSettingsDraft((s) => ({ ...s, popupBody: e.target.value }))
                              }
                              className={`w-full p-2.5 rounded-lg border ${inputCls}`}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* PANEL 6: ONLINE STORE 2.0 PRO TOKENS, SECTIONS, WCAG & CUSTOM CSS */}
                  {studioSubTab === 'pro-tokens' && (
                    <AdminThemeAdvancedStudio
                      darkMode={darkMode}
                      settingsDraft={settingsDraft}
                      themeAdvanced={resolvedThemeAdvanced}
                      onChangeSettingsDraft={setSettingsDraft}
                      onChangeThemeAdvanced={updateThemeAdvanced}
                      onNotify={onNotify}
                    />
                  )}
                </div>

                {/* Right Sticky Live Storefront Wireframe + Product Card Preview (4 Columns on XL) */}
                <div className="xl:col-span-4 space-y-4">
                  {/* Live Mini Storefront Skeleton with Device Switcher */}
                  <div className={`rounded-xl border p-4 space-y-3 ${cardCls}`}>
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <h3 className="text-xs font-extrabold uppercase tracking-wider">
                          Live Storefront Preview
                        </h3>
                        <span className="text-[10px] font-mono font-bold text-[#047857]">
                          {settingsDraft.websiteTemplate ?? 'daraz-mall'} · {resolvedThemeAdvanced.surfaceMode}
                        </span>
                      </div>
                      <div className="inline-flex items-center rounded-lg border border-black/15 p-0.5">
                        {(
                          [
                            { id: 'desktop', icon: Monitor, label: 'Desktop preview' },
                            { id: 'tablet', icon: Tablet, label: 'Tablet preview' },
                            { id: 'mobile', icon: Smartphone, label: 'Mobile preview' },
                          ] as const
                        ).map((dev) => {
                          const DevIcon = dev.icon;
                          const isDev = previewDevice === dev.id;
                          return (
                            <button
                              key={dev.id}
                              type="button"
                              onClick={() => setPreviewDevice(dev.id)}
                              aria-label={dev.label}
                              className={`p-1.5 rounded-md cursor-pointer transition-colors ${
                                isDev
                                  ? 'bg-[#F85606] text-white'
                                  : 'text-[#616161] hover:text-[#111827]'
                              }`}
                            >
                              <DevIcon className="w-3.5 h-3.5" />
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div
                      data-store-surface={resolvedThemeAdvanced.surfaceMode}
                      className={`mx-auto rounded-xl border border-black/15 overflow-hidden text-[10px] transition-all ${
                        previewDevice === 'mobile'
                          ? 'max-w-[240px]'
                          : previewDevice === 'tablet'
                            ? 'max-w-[320px]'
                            : 'w-full'
                      }`}
                      style={{
                        backgroundColor:
                          resolvedThemeAdvanced.surfaceMode === 'dark-slate' &&
                          (settingsDraft.backgroundColor || '#F5F5F5').toUpperCase() === '#F5F5F5'
                            ? '#0B0F19'
                            : resolvedThemeAdvanced.surfaceMode === 'warm-ivory' &&
                                (settingsDraft.backgroundColor || '#F5F5F5').toUpperCase() === '#F5F5F5'
                              ? '#FAF6EE'
                              : settingsDraft.backgroundColor || '#F5F5F5',
                        fontFamily:
                          FONT_TEMPLATES.find((f) => f.id === (settingsDraft.fontStyle ?? 'plus-jakarta'))
                            ?.cssFamily ?? 'inherit',
                      }}
                    >
                      {/* Mini Top Announcement Bar */}
                      {resolvedThemeAdvanced.announcementBarEnabled && (
                        <div
                          className="px-2 py-1 text-[8px] font-bold text-white truncate text-center"
                          style={{
                            backgroundColor:
                              resolvedThemeAdvanced.announcementBarStyle === 'dark'
                                ? '#0F172A'
                                : resolvedThemeAdvanced.announcementBarStyle === 'emerald'
                                  ? '#047857'
                                  : settingsDraft.primaryColor || '#F85606',
                          }}
                        >
                          {resolvedThemeAdvanced.announcementBarText || 'Storefront Announcement Strip'}
                        </div>
                      )}

                      {/* Mini Header */}
                      <div
                        className="px-2.5 py-2 flex items-center justify-between border-b border-black/10"
                        style={{
                          backgroundColor:
                            settingsDraft.headerStyle === 'dark-luxury'
                              ? '#0F172A'
                              : settingsDraft.headerStyle === 'brand-gradient'
                                ? settingsDraft.primaryColor || '#F85606'
                                : settingsDraft.headerStyle === 'clean-editorial'
                                  ? '#FFFDF9'
                                  : '#FFFFFF',
                          color:
                            settingsDraft.headerStyle === 'dark-luxury' ||
                            settingsDraft.headerStyle === 'brand-gradient'
                              ? '#FFFFFF'
                              : '#212121',
                        }}
                      >
                        <span className="font-extrabold truncate">
                          {settingsDraft.storeName || 'Khidmatul Ummah'}
                        </span>
                        <span
                          className="px-1.5 py-0.5 text-white text-[8px] font-bold"
                          style={{
                            backgroundColor: settingsDraft.primaryColor || '#F85606',
                            borderRadius:
                              resolvedThemeAdvanced.buttonRadius === 'pill'
                                ? '9999px'
                                : resolvedThemeAdvanced.buttonRadius === 'sharp'
                                  ? '4px'
                                  : '8px',
                          }}
                        >
                          {settingsDraft.headerStyle ?? 'solid-white'}
                        </span>
                      </div>

                      {/* Mini Hero */}
                      {resolvedThemeAdvanced.sections.find((s) => s.id === 'hero')?.enabled !== false && (
                        <div className="p-2 grid grid-cols-12 gap-1.5">
                          {(settingsDraft.heroStyle ?? 'classic-mega') === 'classic-mega' &&
                            previewDevice === 'desktop' && (
                              <div className="col-span-3 bg-white rounded p-1 space-y-1 border border-black/5">
                                <div className="h-1.5 rounded bg-black/15 w-full" />
                                <div className="h-1.5 rounded bg-black/10 w-4/5" />
                                <div className="h-1.5 rounded bg-black/10 w-3/4" />
                                <div className="h-1.5 rounded bg-black/10 w-full" />
                              </div>
                            )}
                          <div
                            className={`p-2 text-white flex flex-col justify-end min-h-[54px] ${
                              previewDevice !== 'desktop' ||
                              (settingsDraft.heroStyle ?? 'classic-mega') === 'full-bleed'
                                ? 'col-span-12'
                                : (settingsDraft.heroStyle ?? 'classic-mega') === 'classic-mega'
                                  ? 'col-span-9'
                                  : 'col-span-8'
                            }`}
                            style={{
                              borderRadius:
                                resolvedThemeAdvanced.cardRadius === 'curvy'
                                  ? '16px'
                                  : resolvedThemeAdvanced.cardRadius === 'sharp'
                                    ? '4px'
                                    : '10px',
                              background: `linear-gradient(110deg, ${
                                settingsDraft.primaryColor || '#F85606'
                              }, ${settingsDraft.secondaryColor || '#212121'})`,
                            }}
                          >
                            <p className="font-extrabold text-[9px]">
                              Hero: {settingsDraft.heroStyle ?? 'classic-mega'}
                            </p>
                          </div>
                          {previewDevice === 'desktop' &&
                            ((settingsDraft.heroStyle ?? 'classic-mega') === 'split-spotlight' ||
                              (settingsDraft.heroStyle ?? 'classic-mega') === 'bento-promo') && (
                              <div className="col-span-4 grid grid-cols-1 gap-1">
                                <div className="bg-white rounded p-1 border border-black/5 text-[8px] font-bold text-[#212121]">
                                  Promo A
                                </div>
                                <div className="bg-white rounded p-1 border border-black/5 text-[8px] font-bold text-[#212121]">
                                  Promo B
                                </div>
                              </div>
                            )}
                        </div>
                      )}

                      {/* Mini Section Order Stack */}
                      <div className="px-2 pb-2 space-y-1">
                        <div className="flex flex-wrap gap-1">
                          {resolvedThemeAdvanced.sections
                            .filter((s) => s.enabled)
                            .slice(0, 5)
                            .map((s) => (
                              <span
                                key={s.id}
                                className="px-1.5 py-0.5 text-[7px] font-mono font-bold bg-white/90 border border-black/10 text-[#212121] rounded"
                              >
                                {s.id}
                              </span>
                            ))}
                        </div>
                        <div className="flex items-center justify-between text-[8px] font-mono text-[#616161]">
                          <span>
                            {resolvedThemeAdvanced.gridColsDesktop}-col · {resolvedThemeAdvanced.containerWidth}
                          </span>
                          <span>{resolvedThemeAdvanced.buttonRadius}</span>
                        </div>
                      </div>

                      {/* Mini Footer */}
                      <div
                        className="px-2.5 py-1.5 border-t border-black/10 flex items-center justify-between text-[8px] font-bold"
                        style={{
                          backgroundColor:
                            settingsDraft.footerStyle === 'dark-executive' ? '#0F172A' : '#FFFFFF',
                          color:
                            settingsDraft.footerStyle === 'dark-executive' ? '#F8FAFC' : '#424242',
                        }}
                      >
                        <span>Footer: {settingsDraft.footerStyle ?? 'daraz-3tier'}</span>
                        <span>৳ BDT</span>
                      </div>
                    </div>
                  </div>

                  {/* Live Product Card Preview */}
                  <div className={`rounded-xl border p-4 space-y-3 ${cardCls}`}>
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider">
                        Live Product Card Preview
                      </h3>
                      <span className="text-[10px] font-mono font-bold text-[#F85606]">
                        {settingsDraft.productCardDesign ?? 'classic-mall'}
                      </span>
                    </div>
                    <div
                      data-store-surface={resolvedThemeAdvanced.surfaceMode}
                      className="max-w-[260px] mx-auto p-2 rounded-xl"
                      style={
                        {
                          backgroundColor:
                            resolvedThemeAdvanced.surfaceMode === 'dark-slate'
                              ? '#0B0F19'
                              : resolvedThemeAdvanced.surfaceMode === 'warm-ivory'
                                ? '#FAF6EE'
                                : 'transparent',
                          '--brand-primary': settingsDraft.primaryColor || '#F85606',
                          '--brand-primary-hover': settingsDraft.primaryColor || '#D94802',
                          '--brand-secondary': settingsDraft.secondaryColor || '#212121',
                          '--brand-accent': settingsDraft.accentColor || '#047857',
                          '--theme-btn-radius':
                            resolvedThemeAdvanced.buttonRadius === 'pill'
                              ? '9999px'
                              : resolvedThemeAdvanced.buttonRadius === 'sharp'
                                ? '4px'
                                : '10px',
                          '--theme-card-radius':
                            resolvedThemeAdvanced.cardRadius === 'curvy'
                              ? '20px'
                              : resolvedThemeAdvanced.cardRadius === 'sharp'
                                ? '6px'
                                : '12px',
                          '--theme-card-shadow':
                            resolvedThemeAdvanced.cardElevation === 'flat'
                              ? 'none'
                              : resolvedThemeAdvanced.cardElevation === 'elevated'
                                ? '0 10px 25px -5px rgba(0,0,0,0.08), 0 4px 10px -6px rgba(0,0,0,0.04)'
                                : '0 1px 2px rgba(0,0,0,0.04)',
                          '--site-font-body':
                            FONT_TEMPLATES.find((f) => f.id === (settingsDraft.fontStyle ?? 'plus-jakarta'))
                              ?.cssFamily ?? 'inherit',
                          '--site-font-heading':
                            FONT_TEMPLATES.find((f) => f.id === (settingsDraft.fontStyle ?? 'plus-jakarta'))
                              ?.headingFamily ?? 'inherit',
                        } as React.CSSProperties
                      }
                    >
                      {products[0] && (
                        <ProductCard
                          product={products[0]}
                          isWishlisted={false}
                          vendors={vendors}
                          cardDesign={settingsDraft.productCardDesign ?? 'classic-mall'}
                          onToggleWishlist={() => undefined}
                          onOpenDetail={() => undefined}
                          onOrderNow={() => undefined}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: CMS, BLOG & SEO */}
          {activeTab === 'cms' && (
            <AdminCmsHrSystemSection
              mode="cms"
              darkMode={darkMode}
              firebaseUser={firebaseUser}
              cmsPages={cmsPages}
              employees={employees}
              adminUsers={adminUsers}
              auditLogs={auditLogs}
              adminNotifications={adminNotifications}
              storeSettings={storeSettings}
              products={products}
              vouchers={vouchers}
              suppliers={suppliers}
              warehouses={warehouses}
              onExportBackup={handleExportBackup}
              onNotify={onNotify}
            />
          )}

          {/* TAB: HR & PAYROLL */}
          {activeTab === 'hr' && (
            <AdminCmsHrSystemSection
              mode="hr"
              darkMode={darkMode}
              firebaseUser={firebaseUser}
              cmsPages={cmsPages}
              employees={employees}
              adminUsers={adminUsers}
              auditLogs={auditLogs}
              adminNotifications={adminNotifications}
              storeSettings={storeSettings}
              products={products}
              vouchers={vouchers}
              suppliers={suppliers}
              warehouses={warehouses}
              onExportBackup={handleExportBackup}
              onNotify={onNotify}
            />
          )}

          {/* TAB: 10-ROLE RBAC */}
          {activeTab === 'rbac' && (
            <AdminCmsHrSystemSection
              mode="rbac"
              darkMode={darkMode}
              firebaseUser={firebaseUser}
              cmsPages={cmsPages}
              employees={employees}
              adminUsers={adminUsers}
              auditLogs={auditLogs}
              adminNotifications={adminNotifications}
              storeSettings={storeSettings}
              products={products}
              vouchers={vouchers}
              suppliers={suppliers}
              warehouses={warehouses}
              onExportBackup={handleExportBackup}
              onNotify={onNotify}
            />
          )}

          {/* TAB: MULTI-VENDOR MARKETPLACE & Q&A MODERATION */}
          {activeTab === 'vendors' && (
            <div className="space-y-5">
              <AdminVendorMarketplaceSection
                vendors={vendors}
                subOrders={subOrders}
                payouts={payouts}
                onLocalVendorPatch={onLocalVendorPatch}
                onLocalPayoutPatch={onLocalPayoutPatch}
                onNotify={onNotify}
              />

              <div className={`rounded-xl border p-4 space-y-3 ${cardCls}`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[#F85606]" />
                    <span>Product Q&amp;A Moderation ({productQuestions.length})</span>
                  </h3>
                  <span className={`text-[11px] ${subTextCls}`}>
                    {productQuestions.filter((q) => !q.answer).length} unanswered
                  </span>
                </div>

                {productQuestions.length === 0 ? (
                  <p className={`text-xs ${subTextCls}`}>No customer product questions yet.</p>
                ) : (
                  <div className="space-y-2.5 max-h-80 overflow-y-auto">
                    {productQuestions.map((q) => {
                      const draft = qaReplyDrafts[q.id] ?? q.answer ?? '';
                      return (
                        <div
                          key={q.id}
                          className="p-3 rounded-lg border border-black/10 space-y-2 text-xs"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-bold">
                              {q.authorName} · <span className="font-mono text-[#F85606]">{q.productId}</span>
                            </span>
                            <span className={`text-[10px] ${subTextCls}`}>{q.createdAtText || 'Recent'}</span>
                          </div>
                          <p className="font-medium">Q: {q.question}</p>
                          {q.answer ? (
                            <p className="text-[#047857] font-semibold bg-[#ECFDF5] px-2.5 py-1.5 rounded">
                              A ({q.answeredBy || 'Admin'}): {q.answer}
                            </p>
                          ) : (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={draft}
                                onChange={(e) =>
                                  setQaReplyDrafts((prev) => ({ ...prev, [q.id]: e.target.value }))
                                }
                                placeholder="Write official answer..."
                                className={`flex-1 h-8 px-2.5 rounded border text-xs ${inputCls}`}
                              />
                              <button
                                type="button"
                                onClick={async () => {
                                  const answer = draft.trim();
                                  if (!answer) return;
                                  await answerProductQuestionInFirestore(
                                    q.id,
                                    answer,
                                    firebaseUser.displayName || 'Khidmatul Mall Admin'
                                  ).catch(() => undefined);
                                  onNotify('প্রশ্নের উত্তর সেভ হয়েছে!');
                                }}
                                className="h-8 px-3 rounded bg-[#F85606] text-white font-bold cursor-pointer"
                              >
                                Reply
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: SYSTEM (10-SECTION SHOPIFY SETTINGS HUB + BACKUP/RESTORE, ALERTS, LOGS) */}
          {activeTab === 'system' && (
            <div className="space-y-5">
              <AdminShopifySuite
                mode="shopify-settings"
                darkMode={darkMode}
                firebaseUser={firebaseUser}
                products={products}
                orders={orders}
                vouchers={vouchers}
                storeSettings={storeSettings}
                adminUsers={adminUsers}
                workspace={shopifyWorkspace}
                abandonedCheckouts={abandonedCheckouts}
                onSaveWorkspace={handleSaveWorkspace}
                onDeleteAbandonedCheckout={handleDeleteAbandonedCheckout}
                onOpenAdminTab={(t) => setActiveTab(t as AdminTab)}
                onNotify={onNotify}
              />
              <AdminCmsHrSystemSection
                mode="system"
                darkMode={darkMode}
                firebaseUser={firebaseUser}
                cmsPages={cmsPages}
                employees={employees}
                adminUsers={adminUsers}
                auditLogs={auditLogs}
                adminNotifications={adminNotifications}
                storeSettings={storeSettings}
                products={products}
                vouchers={vouchers}
                suppliers={suppliers}
                warehouses={warehouses}
                onExportBackup={handleExportBackup}
                onNotify={onNotify}
              />
            </div>
          )}
        </main>
      </div>

      {/* Add / Edit Product Modal */}
      {productFormOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto"
          onClick={() => setProductFormOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`rounded-2xl max-w-2xl w-full shadow-2xl border overflow-hidden my-auto ${cardCls}`}
          >
            <div className="px-5 py-3.5 bg-gradient-to-r from-[#FF6B00] to-[#F85606] text-white flex items-center justify-between">
              <h3 className="text-sm font-extrabold">
                {editingProductId ? 'পণ্য সম্পাদনা (Edit Product)' : 'নতুন পণ্য যোগ করুন'}
              </h3>
              <button
                type="button"
                onClick={() => setProductFormOpen(false)}
                className="p-1 rounded-full hover:bg-white/15 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleSaveProduct}
              className="flex flex-col max-h-[84vh]"
            >
              <div className="p-4 sm:p-5 space-y-3 text-xs overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="পণ্যের বাংলা নাম"
                  className={`sm:col-span-2 h-9 px-3 rounded border ${inputCls}`}
                />
                <input
                  type="text"
                  required
                  value={productForm.englishName}
                  onChange={(e) => setProductForm((f) => ({ ...f, englishName: e.target.value }))}
                  placeholder="English Name"
                  className={`h-9 px-3 rounded border ${inputCls}`}
                />
                <input
                  type="text"
                  required
                  value={productForm.sku}
                  onChange={(e) => setProductForm((f) => ({ ...f, sku: e.target.value }))}
                  placeholder="SKU"
                  className={`h-9 px-3 rounded border font-mono ${inputCls}`}
                />
                <input
                  type="text"
                  value={productForm.barcode}
                  onChange={(e) => setProductForm((f) => ({ ...f, barcode: e.target.value }))}
                  placeholder="Barcode"
                  className={`h-9 px-3 rounded border font-mono ${inputCls}`}
                />
                <select
                  value={productForm.category}
                  onChange={(e) =>
                    setProductForm((f) => ({
                      ...f,
                      category: e.target.value as Exclude<CategorySlug, 'all'>,
                    }))
                  }
                  className={`h-9 px-3 rounded border ${inputCls}`}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  required
                  value={productForm.price}
                  onChange={(e) => setProductForm((f) => ({ ...f, price: e.target.value }))}
                  placeholder="Retail Price (৳)"
                  className={`h-9 px-3 rounded border font-mono font-bold ${inputCls}`}
                />
                <input
                  type="number"
                  value={productForm.originalPrice}
                  onChange={(e) => setProductForm((f) => ({ ...f, originalPrice: e.target.value }))}
                  placeholder="Regular Price (৳)"
                  className={`h-9 px-3 rounded border font-mono ${inputCls}`}
                />
                <input
                  type="number"
                  value={productForm.costPrice}
                  onChange={(e) => setProductForm((f) => ({ ...f, costPrice: e.target.value }))}
                  placeholder="Purchase Cost (৳)"
                  className={`h-9 px-3 rounded border font-mono ${inputCls}`}
                />
                <input
                  type="number"
                  value={productForm.wholesalePrice}
                  onChange={(e) =>
                    setProductForm((f) => ({ ...f, wholesalePrice: e.target.value }))
                  }
                  placeholder="Wholesale Price (৳)"
                  className={`h-9 px-3 rounded border font-mono ${inputCls}`}
                />
                <input
                  type="number"
                  value={productForm.minWholesaleQty}
                  onChange={(e) =>
                    setProductForm((f) => ({ ...f, minWholesaleQty: e.target.value }))
                  }
                  placeholder="Min Wholesale Qty"
                  className={`h-9 px-3 rounded border font-mono ${inputCls}`}
                />
                <input
                  type="number"
                  value={productForm.stockLeft}
                  onChange={(e) => setProductForm((f) => ({ ...f, stockLeft: e.target.value }))}
                  placeholder="Stock Qty"
                  className={`h-9 px-3 rounded border font-mono ${inputCls}`}
                />
                <input
                  type="text"
                  value={productForm.tag}
                  onChange={(e) => setProductForm((f) => ({ ...f, tag: e.target.value }))}
                  placeholder="Product Tag (যেমন: খাঁটি অর্গানিক)"
                  className={`h-9 px-3 rounded border ${inputCls}`}
                />
                <input
                  type="text"
                  value={productForm.badge}
                  onChange={(e) => setProductForm((f) => ({ ...f, badge: e.target.value }))}
                  placeholder="Badge Label (যেমন: ১০০% খাঁটি)"
                  className={`h-9 px-3 rounded border ${inputCls}`}
                />
                <input
                  type="text"
                  value={productForm.origin}
                  onChange={(e) => setProductForm((f) => ({ ...f, origin: e.target.value }))}
                  placeholder="Origin (যেমন: যশোর / সুন্দরবন)"
                  className={`h-9 px-3 rounded border ${inputCls}`}
                />
                <input
                  type="text"
                  value={productForm.shortDesc}
                  onChange={(e) => setProductForm((f) => ({ ...f, shortDesc: e.target.value }))}
                  placeholder="Short Description / Meta SEO Description"
                  className={`sm:col-span-3 h-9 px-3 rounded border ${inputCls}`}
                />
              </div>

              {/* Search Engine Listing Preview (Google SEO Preview) */}
              <div className="p-3 rounded-xl border border-black/15 bg-black/[0.02] space-y-1">
                <p className="text-[10px] font-extrabold uppercase tracking-wider opacity-60">
                  Search Engine Listing Preview (Google SEO)
                </p>
                <p className="text-sm font-bold text-[#1A0DAB] truncate">
                  {productForm.name.trim() || 'পণ্যের নাম'} | খিদমাতুল উম্মাহ
                </p>
                <p className="text-[11px] font-mono text-[#006621] truncate">
                  https://khidmatulummah.shop/product/{productForm.id || 'organic-item'}
                </p>
                <p className={`text-[11px] line-clamp-2 ${subTextCls}`}>
                  {productForm.shortDesc.trim() ||
                    'শতভাগ খাঁটি ও প্রাকৃতিক অর্গানিক খাদ্যপণ্য — সারা বাংলাদেশে ক্যাশ অন ডেলিভারি।'}
                </p>
              </div>

              <div className="space-y-2.5">
                <MediaUploaderControl
                  mode="gallery"
                  label="পণ্যের ছবি আপলোড ও গ্যালারি (সরাসরি কম্পিউটার/ফোন থেকে)"
                  helperText="প্রথম ছবিটি প্রোডাক্টের মেইন কভার হিসেবে দেখানো হবে (সর্বোচ্চ ৬টি ছবি)।"
                  images={productForm.gallery}
                  onImagesChange={(nextUrls) =>
                    setProductForm((f) => ({
                      ...f,
                      gallery: nextUrls,
                      image: nextUrls[0] || f.image,
                    }))
                  }
                  onUploadingChange={setProductMediaUploading}
                  darkMode={darkMode}
                />

                <div className="flex flex-wrap gap-1.5">
                  {PRESET_IMAGES.map((img) => (
                    <button
                      key={img.label}
                      type="button"
                      onClick={() =>
                        setProductForm((f) => ({
                          ...f,
                          image: img.url,
                          gallery: f.gallery.includes(img.url)
                            ? [img.url, ...f.gallery.filter((x) => x !== img.url)]
                            : [img.url, ...f.gallery].slice(0, 6),
                        }))
                      }
                      className={`px-2 py-1 rounded text-[10px] font-bold border cursor-pointer ${
                        productForm.image === img.url
                          ? 'bg-[#F85606] text-white border-[#F85606]'
                          : 'border-black/15'
                      }`}
                    >
                      {img.label}
                    </button>
                  ))}
                </div>

                <MediaUploaderControl
                  mode="video"
                  label="পণ্যের ভিডিও আপলোড করুন (MP4 / WebM / MOV বা YouTube লিংক)"
                  helperText="সর্বোচ্চ ৬০ MB — আপলোড সম্পন্ন হলে নিচের সংরক্ষণ বাটনে ক্লিক করুন।"
                  singleUrl={productForm.videoUrl}
                  onSingleUrlChange={(url) => setProductForm((f) => ({ ...f, videoUrl: url }))}
                  onUploadingChange={setProductMediaUploading}
                  darkMode={darkMode}
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <label className="inline-flex items-center gap-1.5 font-semibold">
                  <input
                    type="checkbox"
                    checked={productForm.inStock}
                    onChange={(e) => setProductForm((f) => ({ ...f, inStock: e.target.checked }))}
                  />
                  In Stock (Publish)
                </label>
                <label className="inline-flex items-center gap-1.5 font-semibold">
                  <input
                    type="checkbox"
                    checked={productForm.isFeatured}
                    onChange={(e) =>
                      setProductForm((f) => ({ ...f, isFeatured: e.target.checked }))
                    }
                  />
                  Featured
                </label>
                <label className="inline-flex items-center gap-1.5 font-semibold">
                  <input
                    type="checkbox"
                    checked={productForm.isBestSeller}
                    onChange={(e) =>
                      setProductForm((f) => ({ ...f, isBestSeller: e.target.checked }))
                    }
                  />
                  Best Seller
                </label>
                <label className="inline-flex items-center gap-1.5 font-semibold">
                  <input
                    type="checkbox"
                    checked={productForm.isNewArrival}
                    onChange={(e) =>
                      setProductForm((f) => ({ ...f, isNewArrival: e.target.checked }))
                    }
                  />
                  New Arrival
                </label>
              </div>

              {/* Multi-Variant Pricing & Weight Options Editor */}
              <div className="p-3 rounded-xl border border-black/15 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold">Product Variants (ওজন ও মূল্য অপশন)</span>
                  <button
                    type="button"
                    onClick={() =>
                      setProductForm((f) => ({
                        ...f,
                        variants: [
                          ...f.variants,
                          {
                            id: `var-${Date.now().toString().slice(-4)}`,
                            label: '৫০০ গ্রাম প্যাক',
                            weightKg: 0.5,
                            price: Math.max(100, Math.round((Number(f.price) || 450) * 0.55)),
                          },
                        ],
                      }))
                    }
                    className="px-2.5 py-1 rounded bg-[#047857] text-white text-[10px] font-bold cursor-pointer"
                  >
                    + Add Variant
                  </button>
                </div>
                <div className="space-y-1.5">
                  {productForm.variants.map((v, idx) => (
                    <div key={v.id || idx} className="grid grid-cols-12 gap-1.5 items-center">
                      <input
                        type="text"
                        value={v.label}
                        onChange={(e) =>
                          setProductForm((f) => ({
                            ...f,
                            variants: f.variants.map((it, i) =>
                              i === idx ? { ...it, label: e.target.value } : it
                            ),
                          }))
                        }
                        placeholder="Label (১ কেজি)"
                        className={`col-span-5 h-8 px-2 rounded border ${inputCls}`}
                      />
                      <input
                        type="number"
                        step="0.1"
                        value={v.weightKg}
                        onChange={(e) =>
                          setProductForm((f) => ({
                            ...f,
                            variants: f.variants.map((it, i) =>
                              i === idx ? { ...it, weightKg: Number(e.target.value) || 0.5 } : it
                            ),
                          }))
                        }
                        placeholder="kg"
                        className={`col-span-2 h-8 px-2 rounded border font-mono ${inputCls}`}
                      />
                      <input
                        type="number"
                        value={v.price}
                        onChange={(e) =>
                          setProductForm((f) => ({
                            ...f,
                            variants: f.variants.map((it, i) =>
                              i === idx ? { ...it, price: Number(e.target.value) || 0 } : it
                            ),
                          }))
                        }
                        placeholder="Price ৳"
                        className={`col-span-3 h-8 px-2 rounded border font-mono font-bold ${inputCls}`}
                      />
                      <button
                        type="button"
                        disabled={productForm.variants.length <= 1}
                        onClick={() =>
                          setProductForm((f) => ({
                            ...f,
                            variants: f.variants.filter((_, i) => i !== idx),
                          }))
                        }
                        className="col-span-2 h-8 rounded bg-[#FEF2F2] text-[#DC2626] font-bold text-[10px] disabled:opacity-40 cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <textarea
                rows={2}
                value={productForm.description}
                onChange={(e) => setProductForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="বিস্তারিত বিবরণ..."
                className={`w-full p-2.5 rounded border ${inputCls}`}
              />
              </div>

              <div className={`px-4 sm:px-5 py-3 border-t flex items-center justify-end gap-2 ${darkMode ? 'border-[#262B36] bg-[#161920]' : 'border-[#EAEAEA] bg-[#FAFAFA]'}`}>
                <button
                  type="button"
                  onClick={() => setProductFormOpen(false)}
                  className="h-10 px-4 rounded-lg border border-black/15 text-xs font-bold cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={busyAction === 'save-product' || productMediaUploading}
                  className="flex-1 sm:flex-initial sm:min-w-[200px] h-10 px-5 rounded-lg bg-[#F85606] hover:bg-[#D94802] disabled:opacity-60 text-white text-xs font-extrabold cursor-pointer"
                >
                  {productMediaUploading
                    ? 'মিডিয়া আপলোড হচ্ছে...'
                    : busyAction === 'save-product'
                      ? 'সংরক্ষণ হচ্ছে...'
                      : 'পণ্য সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Packing Slip Modal */}
      {packingSlipOrder && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setPackingSlipOrder(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white text-[#212121] rounded-2xl max-w-md w-full p-5 space-y-3 shadow-2xl border border-[#EAEAEA]"
          >
            <div className="flex items-center justify-between border-b pb-2.5">
              <div>
                <h3 className="text-base font-extrabold">PACKING SLIP · খিদমাতুল উম্মাহ</h3>
                <p className="text-xs font-mono text-[#616161]">
                  Order #{packingSlipOrder.orderId} · {packingSlipOrder.createdAt}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPackingSlipOrder(null)}
                className="p-1 rounded hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs space-y-1">
              <p>
                <strong>Recipient:</strong> {packingSlipOrder.customerName}
              </p>
              <p>
                <strong>Phone:</strong> <span className="font-mono">{packingSlipOrder.phone}</span>
              </p>
              <p>
                <strong>Address:</strong>{' '}
                {shopifyWorkspace.orderAddressOverrides?.[packingSlipOrder.orderId] ||
                  packingSlipOrder.address}
                {packingSlipOrder.upazila ? `, ${packingSlipOrder.upazila}` : ''},{' '}
                {packingSlipOrder.district}
              </p>
              {packingSlipOrder.courierProvider && (
                <p>
                  <strong>Courier:</strong> {packingSlipOrder.courierProvider} (
                  {packingSlipOrder.consignmentId})
                </p>
              )}
            </div>
            <div className="border-t border-b py-2 space-y-1 text-xs">
              {packingSlipOrder.items.map((it, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>
                    {it.name} ({it.variantLabel}) × {it.quantity}
                  </span>
                  <span className="font-mono font-bold">৳{it.price * it.quantity}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between text-xs font-extrabold">
              <span>COD / Payable Total:</span>
              <span className="text-base font-mono text-[#F85606]">
                ৳{packingSlipOrder.total.toLocaleString()}
              </span>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="w-full py-2.5 rounded-lg bg-[#F85606] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Print Packing Slip
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
