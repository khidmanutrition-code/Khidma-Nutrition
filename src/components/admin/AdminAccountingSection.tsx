import { useEffect, useState } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import {
  Calculator,
  Download,
  FileSpreadsheet,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import type { Product } from '../../data/products';
import type {
  AccountingEntryRecord,
  OrderReceipt,
  StoreSettings,
} from '../../types';
import {
  deleteAccountingEntryFromFirestore,
  recordAdminAuditLog,
  saveAccountingEntryToFirestore,
  saveStoreSettingsToFirestore,
  syncOrderProfitToAccounting,
} from '../../lib/storeDb';

interface ProfitCalcResult {
  formula: string;
  calculatedOrders: number;
  summary: {
    grossSales: number;
    totalDiscounts: number;
    netSales: number;
    totalCogs: number;
    grossProfit: number;
    totalDeliveryExpense: number;
    totalPackaging: number;
    totalGatewayFee: number;
    totalTax: number;
    totalNetProfit: number;
  };
  perOrder: Array<{
    orderId: string;
    status: string;
    grossSales: number;
    discounts: number;
    netRevenue: number;
    cogs: number;
    storeDeliveryExpense: number;
    packagingCost: number;
    gatewayFee: number;
    taxProvision: number;
    netProfit: number;
    marginPercent: number;
  }>;
}

interface AdminAccountingSectionProps {
  darkMode: boolean;
  firebaseUser: FirebaseUser;
  products: Product[];
  orders: OrderReceipt[];
  accountingEntries: AccountingEntryRecord[];
  storeSettings: StoreSettings;
  onNotify: (msg: string) => void;
}

export function AdminAccountingSection({
  darkMode,
  firebaseUser,
  products,
  orders,
  accountingEntries,
  storeSettings,
  onNotify,
}: AdminAccountingSectionProps) {
  const [pnlReport, setPnlReport] = useState<ProfitCalcResult | null>(null);
  const [busy, setBusy] = useState(false);

  // Accounting Rules Editor
  const [taxPct, setTaxPct] = useState(String(storeSettings.taxRatePercent ?? 0));
  const [pkgCost, setPkgCost] = useState(String(storeSettings.packagingCostPerOrder ?? 25));
  const [gwFeePct, setGwFeePct] = useState(String(storeSettings.gatewayFeePercent ?? 1.5));

  // Cashbook Entry Form
  const [entryType, setEntryType] = useState<'income' | 'expense'>('expense');
  const [entryCategory, setEntryCategory] = useState('Courier & Logistics');
  const [entryAmount, setEntryAmount] = useState('1500');
  const [entryAccount, setEntryAccount] = useState('Main Cashbook');
  const [entryDesc, setEntryDesc] = useState('');

  const cardCls = darkMode
    ? 'bg-[#181B22] border-[#2A2F3A] text-gray-100'
    : 'bg-white border-[#EAEAEA] text-[#212121]';
  const inputCls = darkMode
    ? 'bg-[#101318] border-[#2E3440] text-gray-100'
    : 'bg-white border-[#D1D5DB] text-[#212121]';
  const subTextCls = darkMode ? 'text-gray-400' : 'text-[#616161]';

  const runServerProfitEngine = async () => {
    setBusy(true);
    try {
      const productCostMap: Record<string, number> = {};
      for (const p of products) {
        productCostMap[p.id] = p.costPrice ?? Math.round(p.price * 0.72);
      }
      const res = await fetch('/api/erp/profit-calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orders,
          productCostMap,
          rules: {
            taxRatePercent: Number(taxPct) || 0,
            packagingCostPerOrder: Number(pkgCost) || 25,
            gatewayFeePercent: Number(gwFeePct) || 1.5,
          },
        }),
      });
      const json = (await res.json()) as ProfitCalcResult & { ok?: boolean };
      if (json?.ok) {
        setPnlReport(json);
      }
    } catch {
      onNotify('অটোমেটিক প্রফিট ক্যালকুলেশন চালাতে সমস্যা হয়েছে।');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    void runServerProfitEngine();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders.length, products.length]);

  const handleSaveAccountingRules = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await saveStoreSettingsToFirestore(
        {
          ...storeSettings,
          taxRatePercent: Number(taxPct) || 0,
          packagingCostPerOrder: Number(pkgCost) || 25,
          gatewayFeePercent: Number(gwFeePct) || 1.5,
        },
        firebaseUser.uid
      );
      await runServerProfitEngine();
      await recordAdminAuditLog(firebaseUser, 'UPDATE_ACCOUNTING_RULES', 'store_settings', `Tax:${taxPct}%`);
      onNotify('অ্যাকাউন্টিং ও ট্যাক্স নিয়ম সংরক্ষিত হয়েছে!');
    } finally {
      setBusy(false);
    }
  };

  const handleSyncOrdersToLedger = async () => {
    if (!pnlReport) return;
    setBusy(true);
    try {
      let synced = 0;
      for (const row of pnlReport.perOrder) {
        if (row.status === 'Delivered' || row.status === 'Confirmed' || row.status === 'Shipped') {
          const ok = await syncOrderProfitToAccounting(
            row.orderId,
            row.netProfit,
            firebaseUser.email ?? 'admin',
            `Auto P&L: Rev ৳${row.netRevenue} - COGS ৳${row.cogs} - Exp ৳${
              row.storeDeliveryExpense + row.packagingCost + row.gatewayFee + row.taxProvision
            }`
          );
          if (ok) synced += 1;
        }
      }
      await recordAdminAuditLog(firebaseUser, 'SYNC_ORDER_PNL', 'accounting_entries', `${synced} new synced`);
      onNotify(
        synced > 0
          ? `${synced}টি অর্ডারের নিট প্রফিট ক্যাশবুকে যুক্ত হয়েছে (ডুপ্লিকেট সুরক্ষিত)!`
          : 'সব যোগ্য অর্ডার ইতোমধ্যেই ক্যাশবুকে সিঙ্ক করা আছে (কোনো ডুপ্লিকেট এন্ট্রি নেই)।'
      );
    } finally {
      setBusy(false);
    }
  };

  const handleAddCashbookEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryDesc.trim()) return;
    setBusy(true);
    try {
      const id = `acc-${Date.now()}`;
      await saveAccountingEntryToFirestore({
        id,
        type: entryType,
        category: entryCategory,
        amount: Math.max(0, Number(entryAmount) || 0),
        accountName: entryAccount,
        description: entryDesc.trim(),
        dateText: new Date().toISOString().slice(0, 10),
        createdBy: firebaseUser.email ?? 'admin',
      });
      await recordAdminAuditLog(firebaseUser, 'ADD_ACCOUNTING_ENTRY', id, `${entryType}: ৳${entryAmount}`);
      setEntryDesc('');
      onNotify('ক্যাশবুক লেনদেন সংরক্ষিত হয়েছে!');
    } finally {
      setBusy(false);
    }
  };

  const handleExportAccountingCsv = async () => {
    if (!pnlReport) return;
    const res = await fetch('/api/reports/export-csv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: `khidmatul-pnl-${new Date().toISOString().slice(0, 10)}`,
        headers: [
          'Order ID',
          'Status',
          'Gross Sales',
          'Discounts',
          'Net Revenue',
          'Purchase Cost (COGS)',
          'Delivery Expense',
          'Packaging',
          'Gateway Fee',
          'Tax',
          'Net Profit',
          'Margin %',
        ],
        rows: pnlReport.perOrder.map((o) => [
          o.orderId,
          o.status,
          o.grossSales,
          o.discounts,
          o.netRevenue,
          o.cogs,
          o.storeDeliveryExpense,
          o.packagingCost,
          o.gatewayFee,
          o.taxProvision,
          o.netProfit,
          o.marginPercent,
        ]),
      }),
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `khidmatul-pnl-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    onNotify('P&L অডিট রিপোর্ট (UTF-8 CSV) ডাউনলোড হয়েছে!');
  };

  const manualIncome = accountingEntries
    .filter((e) => e.type === 'income' && !e.orderId)
    .reduce((s, e) => s + e.amount, 0);
  const manualExpenses = accountingEntries
    .filter((e) => e.type === 'expense' && !e.orderId)
    .reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold flex items-center gap-2">
            <Calculator className="w-5 h-5 text-[#F85606]" />
            <span>Accounting, Automated Profit Engine &amp; Cashbook</span>
          </h2>
          <p className={`text-xs ${subTextCls}`}>
            {pnlReport?.formula ||
              'Selling Revenue − Purchase Cost (COGS) − Discounts − Delivery Expense − Packaging − Gateway Fee − Tax'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void runServerProfitEngine()}
            className="px-3 py-2 rounded-lg border border-black/15 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Recalculate P&amp;L
          </button>
          <button
            type="button"
            disabled={busy || !pnlReport}
            onClick={() => void handleSyncOrdersToLedger()}
            className="px-3 py-2 rounded-lg bg-[#047857] hover:bg-[#065F46] text-white text-xs font-bold cursor-pointer"
          >
            Sync Order P&amp;L to Ledger
          </button>
          <button
            type="button"
            onClick={() => void handleExportAccountingCsv()}
            className="px-3 py-2 rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Export P&amp;L CSV
          </button>
        </div>
      </div>

      {/* Automated P&L Summary */}
      {pnlReport && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className={`rounded-xl border p-3.5 ${cardCls}`}>
            <p className={`text-[10px] font-bold uppercase ${subTextCls}`}>Net Sales</p>
            <p className="text-lg font-extrabold font-mono mt-1">
              ৳{pnlReport.summary.netSales.toLocaleString()}
            </p>
          </div>
          <div className={`rounded-xl border p-3.5 ${cardCls}`}>
            <p className={`text-[10px] font-bold uppercase ${subTextCls}`}>Purchase COGS</p>
            <p className="text-lg font-extrabold font-mono text-[#DC2626] mt-1">
              -৳{pnlReport.summary.totalCogs.toLocaleString()}
            </p>
          </div>
          <div className={`rounded-xl border p-3.5 ${cardCls}`}>
            <p className={`text-[10px] font-bold uppercase ${subTextCls}`}>Gross Profit</p>
            <p className="text-lg font-extrabold font-mono text-[#1D4ED8] mt-1">
              ৳{pnlReport.summary.grossProfit.toLocaleString()}
            </p>
          </div>
          <div className={`rounded-xl border p-3.5 ${cardCls}`}>
            <p className={`text-[10px] font-bold uppercase ${subTextCls}`}>Ops / Delivery / Fee</p>
            <p className="text-lg font-extrabold font-mono text-[#C2410C] mt-1">
              -৳
              {(
                pnlReport.summary.totalDeliveryExpense +
                pnlReport.summary.totalPackaging +
                pnlReport.summary.totalGatewayFee +
                manualExpenses
              ).toLocaleString()}
            </p>
          </div>
          <div className={`rounded-xl border p-3.5 ${cardCls}`}>
            <p className={`text-[10px] font-bold uppercase ${subTextCls}`}>Tax &amp; Other Inc</p>
            <p className="text-lg font-extrabold font-mono mt-1">
              -৳{pnlReport.summary.totalTax.toLocaleString()} / +৳{manualIncome.toLocaleString()}
            </p>
          </div>
          <div className={`rounded-xl border p-3.5 ${cardCls}`}>
            <p className={`text-[10px] font-bold uppercase ${subTextCls}`}>True Net Profit</p>
            <p className="text-xl font-extrabold font-mono text-[#047857] mt-1">
              ৳{(pnlReport.summary.totalNetProfit + manualIncome - manualExpenses).toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Accounting Rules + Manual Cashbook Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <form onSubmit={handleSaveAccountingRules} className={`rounded-xl border p-4 space-y-3 ${cardCls}`}>
          <h3 className="text-sm font-extrabold flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-[#1D4ED8]" /> Automated Cost &amp; Tax Rules
          </h3>
          <div className="grid grid-cols-3 gap-2.5 text-xs">
            <div>
              <label className={`block text-[11px] font-bold mb-1 ${subTextCls}`}>VAT / Tax (%)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="50"
                value={taxPct}
                onChange={(e) => setTaxPct(e.target.value)}
                className={`w-full border rounded-lg px-2.5 py-2 ${inputCls}`}
              />
            </div>
            <div>
              <label className={`block text-[11px] font-bold mb-1 ${subTextCls}`}>Packaging / Order (৳)</label>
              <input
                type="number"
                min="0"
                value={pkgCost}
                onChange={(e) => setPkgCost(e.target.value)}
                className={`w-full border rounded-lg px-2.5 py-2 ${inputCls}`}
              />
            </div>
            <div>
              <label className={`block text-[11px] font-bold mb-1 ${subTextCls}`}>Gateway Fee (%)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="20"
                value={gwFeePct}
                onChange={(e) => setGwFeePct(e.target.value)}
                className={`w-full border rounded-lg px-2.5 py-2 ${inputCls}`}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full py-2 rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-bold cursor-pointer"
          >
            নিয়ম আপডেট ও পুনঃহিসাব করুন
          </button>
        </form>

        <form onSubmit={handleAddCashbookEntry} className={`rounded-xl border p-4 space-y-3 ${cardCls}`}>
          <h3 className="text-sm font-extrabold flex items-center gap-2">
            <Plus className="w-4 h-4 text-[#047857]" /> Record Cashbook Income / Operating Expense
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <select
              value={entryType}
              onChange={(e) => setEntryType(e.target.value as 'income' | 'expense')}
              className={`border rounded-lg px-2.5 py-2 ${inputCls}`}
            >
              <option value="expense">Expense (-)</option>
              <option value="income">Income (+)</option>
            </select>
            <input
              type="text"
              value={entryCategory}
              onChange={(e) => setEntryCategory(e.target.value)}
              placeholder="Category"
              className={`border rounded-lg px-2.5 py-2 ${inputCls}`}
            />
            <input
              type="number"
              min="1"
              value={entryAmount}
              onChange={(e) => setEntryAmount(e.target.value)}
              placeholder="Amount ৳"
              className={`border rounded-lg px-2.5 py-2 ${inputCls}`}
            />
            <select
              value={entryAccount}
              onChange={(e) => setEntryAccount(e.target.value)}
              className={`border rounded-lg px-2.5 py-2 ${inputCls}`}
            >
              <option value="Main Cashbook">Main Cashbook</option>
              <option value="bKash Merchant">bKash Merchant</option>
              <option value="Bank Account">Bank Account</option>
            </select>
            <input
              type="text"
              required
              value={entryDesc}
              onChange={(e) => setEntryDesc(e.target.value)}
              placeholder="Description (e.g. Facebook Ad Spend / Jar Purchase)"
              className={`col-span-2 sm:col-span-4 border rounded-lg px-3 py-2 ${inputCls}`}
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full py-2 rounded-lg bg-[#047857] hover:bg-[#065F46] text-white text-xs font-bold cursor-pointer"
          >
            ক্যাশবুক এন্ট্রি যোগ করুন
          </button>
        </form>
      </div>

      {/* Order-by-Order Auditable Profit Table */}
      <div className={`rounded-xl border p-4 ${cardCls}`}>
        <h3 className="text-sm font-extrabold mb-3">
          Order-Level Audited Profit Breakdown ({pnlReport?.perOrder.length ?? 0} Orders)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className={`border-b ${subTextCls}`}>
                <th className="py-2 pr-3">Order</th>
                <th className="py-2 pr-3">Net Rev</th>
                <th className="py-2 pr-3">COGS</th>
                <th className="py-2 pr-3">Deliv+Pkg+Fee</th>
                <th className="py-2 pr-3">Net Profit</th>
                <th className="py-2">Margin</th>
              </tr>
            </thead>
            <tbody>
              {(pnlReport?.perOrder ?? []).slice(0, 15).map((row) => (
                <tr key={row.orderId} className="border-b border-black/5">
                  <td className="py-2 pr-3 font-mono font-bold">#{row.orderId}</td>
                  <td className="py-2 pr-3 font-mono">৳{row.netRevenue.toLocaleString()}</td>
                  <td className="py-2 pr-3 font-mono text-[#DC2626]">৳{row.cogs.toLocaleString()}</td>
                  <td className="py-2 pr-3 font-mono">
                    ৳{(row.storeDeliveryExpense + row.packagingCost + row.gatewayFee + row.taxProvision).toLocaleString()}
                  </td>
                  <td
                    className={`py-2 pr-3 font-mono font-extrabold ${
                      row.netProfit >= 0 ? 'text-[#047857]' : 'text-[#DC2626]'
                    }`}
                  >
                    ৳{row.netProfit.toLocaleString()}
                  </td>
                  <td className="py-2 font-mono">{row.marginPercent}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cashbook Ledger */}
      <div className={`rounded-xl border p-4 ${cardCls}`}>
        <h3 className="text-sm font-extrabold mb-3">Cashbook Ledger ({accountingEntries.length})</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {accountingEntries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between gap-3 text-xs p-2.5 rounded-lg border border-black/10"
            >
              <div>
                <p className="font-bold">
                  [{entry.accountName}] {entry.category}
                  {entry.orderId ? ` · #${entry.orderId}` : ''}
                </p>
                <p className={`text-[11px] ${subTextCls}`}>
                  {entry.description} · {entry.dateText}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`font-mono font-extrabold ${
                    entry.type === 'income' ? 'text-[#047857]' : 'text-[#DC2626]'
                  }`}
                >
                  {entry.type === 'income' ? '+' : '-'}৳{entry.amount.toLocaleString()}
                </span>
                <button
                  type="button"
                  onClick={() => void deleteAccountingEntryFromFirestore(entry.id)}
                  className="p-1 text-[#DC2626] cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
          {accountingEntries.length === 0 && (
            <p className={`text-xs text-center py-4 ${subTextCls}`}>কোনো ক্যাশবুক এন্ট্রি নেই।</p>
          )}
        </div>
      </div>
    </div>
  );
}
