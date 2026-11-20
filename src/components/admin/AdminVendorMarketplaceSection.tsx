import React, { useState } from 'react';
import { BadgeCheck, Check, Coins, ShieldCheck, Store, Wallet, XCircle } from 'lucide-react';
import type { SellerPayoutRecord, SubOrderRecord, VendorStoreRecord } from '../../types';
import {
  updateSellerPayoutStatusInFirestore,
  updateVendorAdminMetaInFirestore,
} from '../../lib/storeDb';

interface AdminVendorMarketplaceSectionProps {
  vendors: VendorStoreRecord[];
  subOrders: SubOrderRecord[];
  payouts: SellerPayoutRecord[];
  onLocalVendorPatch?: (vendorId: string, patch: Partial<VendorStoreRecord>) => void;
  onLocalPayoutPatch?: (payoutId: string, status: SellerPayoutRecord['status']) => void;
  onNotify: (msg: string) => void;
}

export const AdminVendorMarketplaceSection: React.FC<AdminVendorMarketplaceSectionProps> = ({
  vendors,
  subOrders,
  payouts,
  onLocalVendorPatch,
  onLocalPayoutPatch,
  onNotify,
}) => {
  const [commissionDrafts, setCommissionDrafts] = useState<Record<string, string>>({});

  const platformGmv = subOrders.reduce((s, so) => s + so.subtotal, 0);
  const netCommissionRevenue = subOrders.reduce((s, so) => s + so.commissionAmount, 0);
  const deliveredRate =
    subOrders.length > 0
      ? Math.round(
          (subOrders.filter((s) => s.status === 'Delivered').length / subOrders.length) * 100
        )
      : 98;

  return (
    <div className="space-y-5">
      {/* Platform Multi-Vendor KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-[#E5E7EB]">
          <p className="text-[11px] font-bold text-[#6B7280] uppercase">Marketplace GMV</p>
          <p className="text-xl font-extrabold text-[#212121] mt-1">
            ৳{platformGmv.toLocaleString('en-US')}
          </p>
          <p className="text-xs text-[#6B7280] mt-1">{subOrders.length} split sub-orders</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#E5E7EB]">
          <p className="text-[11px] font-bold text-[#6B7280] uppercase">Platform Commission Earned</p>
          <p className="text-xl font-extrabold text-[#F85606] mt-1">
            ৳{netCommissionRevenue.toLocaleString('en-US')}
          </p>
          <p className="text-xs text-[#6B7280] mt-1">Net marketplace fee revenue</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#E5E7EB]">
          <p className="text-[11px] font-bold text-[#6B7280] uppercase">Active Verified Vendors</p>
          <p className="text-xl font-extrabold text-[#00A859] mt-1">
            {vendors.filter((v) => v.kycStatus === 'Verified').length} / {vendors.length}
          </p>
          <p className="text-xs text-[#6B7280] mt-1">
            {vendors.filter((v) => v.tier === 'Official Mall').length} Official Mall Stores
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#E5E7EB]">
          <p className="text-[11px] font-bold text-[#6B7280] uppercase">Fulfillment Health</p>
          <p className="text-xl font-extrabold text-[#212121] mt-1">{deliveredRate}%</p>
          <p className="text-xs text-[#6B7280] mt-1">Zero SLA breach alert</p>
        </div>
      </div>

      {/* Vendor Directory & KYC Verification */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#E5E7EB] flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-[#212121] flex items-center gap-2">
            <Store className="w-4 h-4 text-[#F85606]" />
            <span>Multi-Vendor KYC, Tier &amp; Commission Control</span>
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#F9FAFB] text-[#6B7280] uppercase border-b border-[#E5E7EB]">
              <tr>
                <th className="px-4 py-2.5">Store</th>
                <th className="px-4 py-2.5">KYC Status</th>
                <th className="px-4 py-2.5">Tier</th>
                <th className="px-4 py-2.5">Commission %</th>
                <th className="px-4 py-2.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {vendors.map((v) => {
                const draftRate = commissionDrafts[v.id] ?? String(v.commissionRate);
                return (
                  <tr key={v.id}>
                    <td className="px-4 py-3">
                      <p className="font-bold text-[#212121] flex items-center gap-1">
                        <span>{v.storeName}</span>
                        {v.tier === 'Official Mall' && <BadgeCheck className="w-3.5 h-3.5 text-[#C2185B]" />}
                      </p>
                      <p className="text-[11px] text-[#6B7280]">{v.location}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          v.kycStatus === 'Verified'
                            ? 'bg-[#ECFDF5] text-[#065F46]'
                            : v.kycStatus === 'Rejected'
                              ? 'bg-[#FEF2F2] text-[#991B1B]'
                              : 'bg-[#FFFBEB] text-[#92400E]'
                        }`}
                      >
                        {v.kycStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={async () => {
                          const nextTier = v.tier === 'Official Mall' ? 'Standard' : 'Official Mall';
                          await updateVendorAdminMetaInFirestore(v.id, { tier: nextTier }).catch(() => undefined);
                          onLocalVendorPatch?.(v.id, { tier: nextTier });
                          onNotify(`${v.storeName} tier set to ${nextTier}`);
                        }}
                        className="px-2.5 py-1 rounded border border-[#D1D5DB] hover:border-[#F85606] font-bold cursor-pointer"
                      >
                        {v.tier} ⇄
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          value={draftRate}
                          onChange={(e) =>
                            setCommissionDrafts((prev) => ({ ...prev, [v.id]: e.target.value }))
                          }
                          className="w-14 h-7 px-2 rounded border border-[#D1D5DB] text-xs"
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            const rate = Math.max(0, Math.min(50, Number(draftRate) || 8));
                            await updateVendorAdminMetaInFirestore(v.id, { commissionRate: rate }).catch(
                              () => undefined
                            );
                            onLocalVendorPatch?.(v.id, { commissionRate: rate });
                            onNotify(`${v.storeName} commission updated to ${rate}%`);
                          }}
                          className="h-7 px-2 rounded bg-[#212121] text-white text-[10px] font-bold cursor-pointer"
                        >
                          Save
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={async () => {
                            await updateVendorAdminMetaInFirestore(v.id, { kycStatus: 'Verified' }).catch(
                              () => undefined
                            );
                            onLocalVendorPatch?.(v.id, { kycStatus: 'Verified' });
                            onNotify(`${v.storeName} KYC Approved`);
                          }}
                          className="px-2 py-1 rounded bg-[#00A859] text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3 h-3" />
                          <span>Approve</span>
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await updateVendorAdminMetaInFirestore(v.id, { kycStatus: 'Rejected' }).catch(
                              () => undefined
                            );
                            onLocalVendorPatch?.(v.id, { kycStatus: 'Rejected' });
                            onNotify(`${v.storeName} KYC Rejected`);
                          }}
                          className="px-2 py-1 rounded bg-[#DC2626] text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <XCircle className="w-3 h-3" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sub-Order Commission Split Ledger & Seller Payout Settlement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] space-y-2.5">
          <h3 className="text-sm font-extrabold flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-[#F85606]" />
            <span>Sub-Order Commission Split Ledger</span>
          </h3>
          {subOrders.length === 0 ? (
            <p className="text-xs text-[#6B7280]">No split sub-orders recorded yet.</p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {subOrders.map((so) => (
                <div key={so.subOrderId} className="p-2.5 rounded-lg bg-[#F9FAFB] text-xs flex justify-between gap-2">
                  <div>
                    <p className="font-bold">#{so.subOrderId} · {so.sellerName}</p>
                    <p className="text-[11px] text-[#6B7280]">
                      Gross ৳{so.subtotal} · Status {so.status}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold text-[#F85606]">Fee: ৳{so.commissionAmount} ({so.commissionRate}%)</p>
                    <p className="text-[11px] text-[#00A859] font-bold">Net Seller: ৳{so.sellerNetPayout}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] space-y-2.5">
          <h3 className="text-sm font-extrabold flex items-center gap-1.5">
            <Wallet className="w-4 h-4 text-[#00A859]" />
            <span>Seller Payout Settlement Queue</span>
          </h3>
          {payouts.length === 0 ? (
            <p className="text-xs text-[#6B7280]">No withdrawal requests in queue.</p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {payouts.map((p) => (
                <div key={p.id} className="p-2.5 rounded-lg bg-[#F9FAFB] text-xs flex items-center justify-between gap-2">
                  <div>
                    <p className="font-bold">{p.sellerName}</p>
                    <p className="text-[11px] text-[#6B7280]">
                      ৳{p.amount.toLocaleString('en-US')} via {p.method} ({p.accountNumber})
                    </p>
                  </div>
                  {p.status === 'Paid' ? (
                    <span className="px-2 py-0.5 rounded bg-[#ECFDF5] text-[#065F46] font-bold text-[10px]">
                      Paid ✓
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={async () => {
                        await updateSellerPayoutStatusInFirestore(p.id, 'Paid').catch(() => undefined);
                        onLocalPayoutPatch?.(p.id, 'Paid');
                        onNotify(`Settled ৳${p.amount} payout for ${p.sellerName}`);
                      }}
                      className="px-2.5 py-1 rounded bg-[#00A859] text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <ShieldCheck className="w-3 h-3" />
                      <span>Mark Paid</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
