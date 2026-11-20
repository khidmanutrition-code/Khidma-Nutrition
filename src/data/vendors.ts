import type { Product } from '../data/products.ts';
import type { CartItem, OrderReceipt, SubOrderRecord, VendorStoreRecord } from '../types.ts';

export const DEFAULT_VENDORS: VendorStoreRecord[] = [
  {
    id: 'khidmatul-mall',
    storeName: 'Khidmatul Organic Mall',
    slug: 'khidmatul-mall',
    tier: 'Official Mall',
    kycStatus: 'Verified',
    nidNumber: '1992441087651',
    tradeLicense: 'TL-DHK-2026-0091',
    tinBin: 'BIN-44120987',
    phone: '01770241803',
    location: 'Mirpur, Dhaka & Chuadanga Hub',
    commissionRate: 5,
    positiveRatingPercent: 98,
    shipOnTimePercent: 99,
    chatResponsePercent: 97,
    walletBalance: 48500,
    totalSales: 312000,
    followersCount: 1840,
    active: true,
  },
  {
    id: 'chuadanga-gachi',
    storeName: 'Chuadanga Gachi Collective',
    slug: 'chuadanga-gachi',
    tier: 'Official Mall',
    kycStatus: 'Verified',
    nidNumber: '1988551042119',
    tradeLicense: 'TL-CHD-2026-0412',
    tinBin: 'BIN-78214402',
    phone: '01715002211',
    location: 'Sarojganj Bazar, Chuadanga',
    commissionRate: 8,
    positiveRatingPercent: 97,
    shipOnTimePercent: 96,
    chatResponsePercent: 94,
    walletBalance: 29400,
    totalSales: 194500,
    followersCount: 1290,
    active: true,
  },
  {
    id: 'sundarban-apiary',
    storeName: 'Sundarban Natural Apiary',
    slug: 'sundarban-apiary',
    tier: 'Standard',
    kycStatus: 'Verified',
    nidNumber: '1991771099324',
    tradeLicense: 'TL-KHL-2026-0874',
    tinBin: 'BIN-33109941',
    phone: '01819334455',
    location: 'Shyamnagar, Satkhira · Khulna',
    commissionRate: 10,
    positiveRatingPercent: 95,
    shipOnTimePercent: 94,
    chatResponsePercent: 92,
    walletBalance: 18600,
    totalSales: 128000,
    followersCount: 840,
    active: true,
  },
  {
    id: 'sunnah-dates-bd',
    storeName: 'Madinah Sunnah & Spice House',
    slug: 'sunnah-dates-bd',
    tier: 'Official Mall',
    kycStatus: 'Verified',
    nidNumber: '1990121044321',
    tradeLicense: 'TL-DHK-2026-1190',
    tinBin: 'BIN-55190822',
    phone: '01911445566',
    location: 'Chawkbazar, Dhaka',
    commissionRate: 7,
    positiveRatingPercent: 96,
    shipOnTimePercent: 97,
    chatResponsePercent: 95,
    walletBalance: 24100,
    totalSales: 162400,
    followersCount: 1120,
    active: true,
  },
];

const CATEGORY_TO_VENDOR: Record<string, string> = {
  patali: 'chuadanga-gachi',
  danadar: 'chuadanga-gachi',
  jhola: 'chuadanga-gachi',
  combo: 'khidmatul-mall',
  honey: 'sundarban-apiary',
  'ghee-oil': 'khidmatul-mall',
  'dates-nuts': 'sunnah-dates-bd',
  'spices-seeds': 'sunnah-dates-bd',
};

export interface ExtendedProductMeta {
  seller: VendorStoreRecord;
  isMall: boolean;
  freeShipping: boolean;
  warrantyLabel: string;
  rating: number;
  reviewCount: number;
}

export function getProductMarketplaceMeta(
  product: Product & {
    sellerId?: string;
    sellerName?: string;
    isMall?: boolean;
    freeShipping?: boolean;
    warrantyLabel?: string;
  },
  vendors: VendorStoreRecord[] = DEFAULT_VENDORS
): ExtendedProductMeta {
  const vendorId = product.sellerId || CATEGORY_TO_VENDOR[product.category] || 'khidmatul-mall';
  const seller =
    vendors.find((v) => v.id === vendorId) ||
    vendors[0] ||
    DEFAULT_VENDORS[0];

  return {
    seller,
    isMall: typeof product.isMall === 'boolean' ? product.isMall : seller.tier === 'Official Mall',
    freeShipping:
      typeof product.freeShipping === 'boolean'
        ? product.freeShipping
        : product.price >= 1100 || product.category === 'combo',
    warrantyLabel: product.warrantyLabel || '100% Authenticity & 7-Day Easy Return',
    rating: Number((4.6 + ((product.soldCount % 4) * 0.1)).toFixed(1)),
    reviewCount: Math.max(18, Math.round(product.soldCount * 0.45)),
  };
}

export function splitCartIntoSubOrders(
  parentOrderId: string,
  items: CartItem[],
  baseOrder: {
    userId?: string;
    customerName: string;
    phone: string;
    address: string;
    district: string;
    shippingFee: number;
    status: OrderReceipt['status'];
  },
  vendors: VendorStoreRecord[] = DEFAULT_VENDORS
): SubOrderRecord[] {
  const grouped = new Map<string, CartItem[]>();

  for (const item of items) {
    const sid = item.sellerId || 'khidmatul-mall';
    const list = grouped.get(sid) ?? [];
    list.push(item);
    grouped.set(sid, list);
  }

  const groupsCount = Math.max(1, grouped.size);
  const perGroupShipping = Math.round(baseOrder.shippingFee / groupsCount);
  let idx = 1;
  const result: SubOrderRecord[] = [];

  grouped.forEach((sellerItems, sellerId) => {
    const vendor = vendors.find((v) => v.id === sellerId) ?? DEFAULT_VENDORS[0];
    const subtotal = sellerItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const commissionRate = vendor.commissionRate ?? 8;
    const commissionAmount = Math.round((subtotal * commissionRate) / 100);
    const sellerNetPayout = Math.max(0, subtotal - commissionAmount);

    result.push({
      subOrderId: `${parentOrderId}-S${idx}`,
      parentOrderId,
      sellerId: vendor.id,
      sellerName: sellerItems[0]?.sellerName || vendor.storeName,
      userId: baseOrder.userId,
      customerName: baseOrder.customerName,
      phone: baseOrder.phone,
      address: baseOrder.address,
      district: baseOrder.district,
      items: sellerItems,
      subtotal,
      shippingFee: idx === 1 ? baseOrder.shippingFee - perGroupShipping * (groupsCount - 1) : perGroupShipping,
      commissionRate,
      commissionAmount,
      sellerNetPayout,
      status:
        baseOrder.status === 'Confirmed · Preparing Shipment' ? 'Confirmed' : baseOrder.status,
      createdAtText: new Date().toLocaleString('en-GB'),
    });
    idx += 1;
  });

  return result;
}
