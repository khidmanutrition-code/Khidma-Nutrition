export interface CartItem {
  productId: string;
  variantId: string;
  name: string;
  variantLabel: string;
  price: number;
  image: string;
  quantity: number;
  sellerId?: string;
  sellerName?: string;
  freeShipping?: boolean;
}

export type DeliveryZone = 'dhaka' | 'outside';

export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Processing'
  | 'Ready to Ship'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled'
  | 'Returned'
  | 'Refunded';

export type PaymentMethodLabel =
  | 'Cash on Delivery'
  | 'bKash'
  | 'Nagad'
  | 'Rocket'
  | 'Upay'
  | 'SSLCommerz'
  | 'bKash / Nagad';

export type CourierProvider = 'Steadfast' | 'Pathao' | 'RedX' | 'eCourier';

export interface SavedAddress {
  id: string;
  fullName: string;
  phone: string;
  division: string;
  city: string;
  zone: string;
  address: string;
  landmark?: string;
  label: 'HOME' | 'OFFICE';
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
}

export type WebsiteTemplateId =
  | 'daraz-mall'
  | 'modern-minimal'
  | 'artisan-heritage'
  | 'compact-wholesale'
  | 'festive-ramadan'
  | 'flash-superstore'
  | 'single-product-funnel'
  | 'luxury-boutique';

export type ProductCardDesignId =
  | 'classic-mall'
  | 'rounded-glass'
  | 'minimal-editorial'
  | 'bold-promo'
  | 'compact-quickshop'
  | 'luxury-framed'
  | 'wholesale-tier'
  | 'video-spotlight';

export type ThemePresetId =
  | 'offertopup-violet'
  | 'daraz-orange'
  | 'emerald-sunnah'
  | 'royal-indigo'
  | 'gold-heritage'
  | 'crimson-mart'
  | 'midnight-gold'
  | 'tea-garden'
  | 'sundarban-honey'
  | 'ocean-teal'
  | 'plum-bazaar';

export type HeaderStyleId =
  | 'solid-white'
  | 'brand-gradient'
  | 'clean-editorial'
  | 'dark-luxury'
  | 'floating-glass'
  | 'compact-centered';

export type HeroStyleId =
  | 'classic-mega'
  | 'full-bleed'
  | 'split-spotlight'
  | 'bento-promo';

export type CategoryStyleId =
  | 'grid-cards'
  | 'scroll-rail'
  | 'compact-tabs'
  | 'showcase-tiles';

export type FooterStyleId =
  | 'daraz-3tier'
  | 'dark-executive'
  | 'minimal-clean'
  | 'newsletter-split';

export type FontStyleId =
  | 'plus-jakarta'
  | 'hind-bengali'
  | 'serif-luxury'
  | 'compact-commerce';

export interface UserAccount {
  isLoggedIn: boolean;
  username: string;
  phone: string;
  email: string;
  phoneVerified?: boolean;
  avatarUrl?: string;
  division?: string;
  district?: string;
  upazila?: string;
  address?: string;
  gender?: 'Male' | 'Female' | 'Prefer not to say' | '';
  dateOfBirth?: string;
  bio?: string;
}

export interface RegisteredUserProfile {
  uid: string;
  email: string;
  displayName: string;
  phone?: string;
  phoneVerified?: boolean;
  avatarUrl?: string;
  division?: string;
  district?: string;
  upazila?: string;
  address?: string;
  gender?: string;
  dateOfBirth?: string;
  bio?: string;
  updatedAtText?: string;
}

export interface OrderReceipt {
  orderId: string;
  userId?: string;
  customerEmail?: string;
  createdAt: string;
  customerName: string;
  phone: string;
  district: string;
  upazila?: string;
  address: string;
  zone: DeliveryZone;
  deliveryMode?: 'Standard Delivery' | 'Self-Pickup';
  notes?: string;
  adminNote?: string;
  paymentMethod: PaymentMethodLabel;
  paymentVerified?: boolean;
  trxId?: string;
  voucherCode?: string;
  discountAmount?: number;
  courierProvider?: CourierProvider | string;
  consignmentId?: string;
  trackingCode?: string;
  customerCancelReason?: string;
  refundRequested?: boolean;
  refundReason?: string;
  items: CartItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  subOrders?: SubOrderRecord[];
  status: OrderStatus | 'Confirmed · Preparing Shipment';
}

export interface VoucherRecord {
  code: string;
  title: string;
  discount: number;
  minSpend: number;
  expiry: string;
  active: boolean;
}

export interface HeroBannerConfig {
  id: string;
  image: string;
  alt: string;
  targetProductId: string;
}

export interface StoreSettings {
  noticeText: string;
  popupTitle: string;
  popupBody: string;
  popupEnabled: boolean;
  dhakaDeliveryFee: number;
  outsideDeliveryFee: number;
  freeShippingMin: number;
  freeDeliveryCampaignActive?: boolean;
  bkashMerchant?: string;
  nagadMerchant?: string;
  rocketMerchant?: string;
  sslcommerzEnabled?: boolean;
  steadfastEnabled?: boolean;
  pathaoEnabled?: boolean;
  redxEnabled?: boolean;
  ecourierEnabled?: boolean;
  fbPixelId?: string;
  ga4MeasurementId?: string;
  gtmContainerId?: string;
  metaCapiEnabled?: boolean;
  gmcFeedEnabled?: boolean;
  smsGatewayEnabled?: boolean;
  emailCampaignEnabled?: boolean;
  storeName?: string;
  storePhone?: string;
  storeEmail?: string;
  storeAddress?: string;
  taxRatePercent?: number;
  packagingCostPerOrder?: number;
  gatewayFeePercent?: number;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  maintenanceMode?: boolean;
  heroBanners?: HeroBannerConfig[];
  websiteTemplate?: WebsiteTemplateId;
  productCardDesign?: ProductCardDesignId;
  themePreset?: ThemePresetId;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  headerStyle?: HeaderStyleId;
  heroStyle?: HeroStyleId;
  categoryStyle?: CategoryStyleId;
  footerStyle?: FooterStyleId;
  fontStyle?: FontStyleId;
}

export type AdminRoleName =
  | 'Super Admin'
  | 'Admin'
  | 'Manager'
  | 'Accountant'
  | 'Order Manager'
  | 'Inventory Manager'
  | 'Product Manager'
  | 'Marketing Manager'
  | 'Customer Support'
  | 'Delivery Manager';

export type RbacPermission =
  | 'view'
  | 'create'
  | 'edit'
  | 'delete'
  | 'approve'
  | 'refund'
  | 'export'
  | 'settings';

export interface AdminUserRecord {
  uid: string;
  email: string;
  name: string;
  role?: AdminRoleName | string;
  permissions?: RbacPermission[];
  branchId?: string;
  addedBy: string;
}

export interface ProductReviewRecord {
  id: string;
  productId: string;
  userId: string;
  author: string;
  location?: string;
  rating: number;
  comment: string;
  createdAtText?: string;
}

export interface SupplierRecord {
  id: string;
  name: string;
  phone: string;
  location: string;
  suppliedItems: string;
  lastBatchDate?: string;
  active: boolean;
}

export interface SubscriberRecord {
  id: string;
  email: string;
  createdAtText?: string;
}

export interface AuditLogRecord {
  id: string;
  actorUid: string;
  actorEmail: string;
  action: string;
  target: string;
  details?: string;
  createdAtText?: string;
}

export interface CourierParcelRecord {
  consignmentId: string;
  orderId: string;
  provider: CourierProvider;
  trackingCode: string;
  status: string;
  codAmount: number;
}

export interface WarehouseRecord {
  id: string;
  name: string;
  branchCode: string;
  location: string;
  managerName?: string;
  isDefault: boolean;
  active: boolean;
}

export interface StockMovementRecord {
  id: string;
  productId: string;
  productName: string;
  warehouseId: string;
  type: 'in' | 'out' | 'adjustment' | 'transfer' | 'return';
  qtyChange: number;
  batchNo?: string;
  expiryDate?: string;
  reason: string;
  actorEmail: string;
  createdAtText?: string;
}

export interface PurchaseOrderRecord {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  itemsSummary: string;
  totalCost: number;
  paidAmount: number;
  dueAmount: number;
  status: 'Ordered' | 'Received' | 'Returned' | 'Settled';
  dateText: string;
}

export interface AccountingEntryRecord {
  id: string;
  type: 'income' | 'expense';
  category: string;
  orderId?: string;
  amount: number;
  accountName: string;
  description: string;
  dateText: string;
  createdBy: string;
}

export interface EmployeeRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  salary: number;
  attendanceDays: number;
  leaveDays: number;
  status: 'Active' | 'On Leave' | 'Inactive';
}

export interface CmsPageRecord {
  slug: string;
  title: string;
  type: 'page' | 'blog';
  content: string;
  metaTitle?: string;
  metaDescription?: string;
  published: boolean;
  updatedAtText?: string;
}

export interface CustomerCrmRecord {
  id: string;
  userId?: string;
  name: string;
  phone: string;
  email?: string;
  businessName?: string;
  group: 'Regular' | 'VIP' | 'Wholesale';
  wholesaleRequested?: boolean;
  wholesaleApproved: boolean;
  creditDue: number;
  notes?: string;
  blocked: boolean;
}

export interface AdminNotificationRecord {
  id: string;
  type: 'order' | 'stock' | 'refund' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAtText?: string;
}

export type MarketplaceLanguage = 'bn' | 'en';

export interface VendorStoreRecord {
  id: string;
  ownerUid?: string;
  ownerEmail?: string;
  storeName: string;
  slug: string;
  tier: 'Standard' | 'Official Mall';
  kycStatus: 'Pending' | 'Verified' | 'Rejected';
  nidNumber: string;
  tradeLicense: string;
  tinBin?: string;
  phone: string;
  location: string;
  commissionRate: number;
  positiveRatingPercent: number;
  shipOnTimePercent: number;
  chatResponsePercent: number;
  walletBalance: number;
  totalSales: number;
  followersCount: number;
  active: boolean;
  createdAtText?: string;
}

export interface SubOrderRecord {
  subOrderId: string;
  parentOrderId: string;
  sellerId: string;
  sellerName: string;
  userId?: string;
  customerName: string;
  phone: string;
  address: string;
  district: string;
  items: CartItem[];
  subtotal: number;
  shippingFee: number;
  commissionRate: number;
  commissionAmount: number;
  sellerNetPayout: number;
  status: OrderStatus;
  courierProvider?: string;
  consignmentId?: string;
  trackingCode?: string;
  createdAtText?: string;
}

export interface ProductQuestionRecord {
  id: string;
  productId: string;
  sellerId: string;
  authorName: string;
  userId?: string;
  question: string;
  answer?: string;
  answeredBy?: string;
  createdAtText?: string;
}

export interface SellerPayoutRecord {
  id: string;
  sellerId: string;
  sellerName: string;
  amount: number;
  method: 'bKash' | 'Nagad' | 'Bank Transfer';
  accountNumber: string;
  status: 'Requested' | 'Processing' | 'Paid';
  periodLabel: string;
  createdAtText?: string;
}

export interface ChatMessageRecord {
  id: string;
  roomId: string;
  sellerId: string;
  sellerName: string;
  senderRole: 'buyer' | 'seller';
  senderName: string;
  text: string;
  productAttachment?: {
    id: string;
    name: string;
    price: number;
    image: string;
  };
  createdAtMs: number;
}

export interface LoyaltyWalletRecord {
  userId: string;
  coins: number;
  streakDays: number;
  lastCheckInDate: string;
  lastSpinDate: string;
  referralCode: string;
  collectedVouchers: string[];
}

export interface ShopifyCollectionRecord {
  id: string;
  title: string;
  handle: string;
  mode: 'manual' | 'smart';
  description: string;
  productIds: string[];
  smartRuleField?: 'category' | 'discount' | 'maxPrice' | 'flag';
  smartRuleValue?: string;
  published: boolean;
}

export interface ShopifyGiftCardRecord {
  id: string;
  code: string;
  initialAmount: number;
  balance: number;
  recipientName: string;
  recipientPhone: string;
  note?: string;
  active: boolean;
  createdAt: string;
}

export interface ShopifyMetaobjectRecord {
  id: string;
  type: string;
  title: string;
  handle: string;
  fields: Array<{ key: string; value: string }>;
  linkedProductIds?: string[];
  published: boolean;
}

export interface ShopifyContentDocumentRecord {
  id: string;
  title: string;
  category: 'Size Guide PDF' | 'Lab Test Report' | 'Price List' | 'Banner / Flyer';
  url: string;
  fileType: string;
  uploadedAt: string;
}

export interface ShopifyCampaignRecord {
  id: string;
  name: string;
  channel: 'Facebook & IG' | 'Google Ads' | 'TikTok Ads' | 'Email & SMS' | 'WhatsApp';
  budget: number;
  spent: number;
  attributedSales: number;
  sessions: number;
  utmSource: string;
  status: 'Active' | 'Paused' | 'Completed';
}

export interface ShopifyAutomationRecord {
  id: string;
  name: string;
  trigger: string;
  channel: 'Email' | 'SMS' | 'WhatsApp';
  enabled: boolean;
  sentCount: number;
  conversionRate: number;
}

export interface ShopifyDiscountRuleRecord {
  id: string;
  title: string;
  method: 'Code' | 'Automatic';
  code?: string;
  type: 'amount_off_products' | 'amount_off_order' | 'buy_x_get_y' | 'free_shipping';
  valueLabel: string;
  minSpend: number;
  usesCount: number;
  active: boolean;
}

export interface ShopifyNavMenuItem {
  id: string;
  location: 'Main Menu' | 'Footer Menu';
  label: string;
  url: string;
  order: number;
}

export interface ShopifyAppRecord {
  id: string;
  name: string;
  category: string;
  description: string;
  installed: boolean;
  permissions: Array<'read_orders' | 'write_products' | 'read_customers' | 'manage_fulfillment'>;
}

export interface ShopifyDomainRecord {
  id: string;
  domain: string;
  isPrimary: boolean;
  sslStatus: 'Connected' | 'Pending DNS';
  type: 'Custom Domain' | 'Subdomain';
}

export interface ShopifyMetafieldDef {
  id: string;
  namespace: string;
  key: string;
  ownerType: 'Product' | 'Customer' | 'Order';
  valueType: 'Single line text' | 'Number' | 'Date' | 'Boolean';
  defaultValue: string;
}

export interface ShopifyAbandonedCheckout {
  id: string;
  customerName: string;
  phone: string;
  district: string;
  itemsSummary: string;
  total: number;
  abandonedAt: string;
  recovered: boolean;
}

export type HomepageSectionId =
  | 'hero'
  | 'shortcuts'
  | 'flashSale'
  | 'categories'
  | 'catalog'
  | 'justForYou'
  | 'singleProduct'
  | 'gallery'
  | 'reviewsFaq'
  | 'newsletter';

export interface ShopifyThemeSectionConfig {
  id: HomepageSectionId;
  label: string;
  enabled: boolean;
}

export interface ShopifyThemeAdvancedConfig {
  surfaceMode: 'light' | 'warm-ivory' | 'dark-slate';
  buttonRadius: 'sharp' | 'rounded' | 'pill';
  cardRadius: 'sharp' | 'soft' | 'curvy';
  cardElevation: 'flat' | 'hairline' | 'elevated';
  containerWidth: 'standard' | 'wide' | 'full';
  gridGap: 'compact' | 'comfortable' | 'airy';
  gridColsDesktop: 3 | 4 | 5;
  bodyFontScale: 'compact' | 'standard' | 'large';
  headingWeight: '700' | '800' | '900';
  announcementBarEnabled: boolean;
  announcementBarText: string;
  announcementBarStyle: 'brand' | 'dark' | 'emerald';
  sections: ShopifyThemeSectionConfig[];
  customCss: string;
}

export interface ShopifyWorkspaceState {
  collections: ShopifyCollectionRecord[];
  giftCards: ShopifyGiftCardRecord[];
  metaobjects: ShopifyMetaobjectRecord[];
  contentDocuments?: ShopifyContentDocumentRecord[];
  campaigns: ShopifyCampaignRecord[];
  automations: ShopifyAutomationRecord[];
  discountRules: ShopifyDiscountRuleRecord[];
  navigationMenus: ShopifyNavMenuItem[];
  apps: ShopifyAppRecord[];
  domains: ShopifyDomainRecord[];
  metafields: ShopifyMetafieldDef[];
  customerTags: Record<string, string[]>;
  orderAddressOverrides?: Record<string, string>;
  weightUnit?: 'kg' | 'g';
  themeAdvanced?: ShopifyThemeAdvancedConfig;
  planName: 'Basic' | 'Shopify' | 'Advanced' | 'Enterprise ERP';
  billingCycle: 'Monthly' | 'Annual';
  checkoutConfig: {
    requirePhone: boolean;
    emailOptional: boolean;
    guestCheckout: boolean;
    codOtpCheck: boolean;
    orderConfirmTemplate: string;
    shippingConfirmTemplate?: string;
  };
  taxConfig: {
    taxIncludedInPrices: boolean;
    vatNumber: string;
    chargeShippingTax: boolean;
  };
}



