import { useMemo, useState } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import {
  AlertTriangle,
  ArrowDownUp,
  Building2,
  ClipboardList,
  Plus,
  Trash2,
  Users,
  Warehouse,
} from 'lucide-react';
import type { Product } from '../../data/products';
import type {
  PurchaseOrderRecord,
  StockMovementRecord,
  SupplierRecord,
  WarehouseRecord,
} from '../../types';
import {
  deletePurchaseOrderFromFirestore,
  deleteSupplierFromFirestore,
  deleteWarehouseFromFirestore,
  recordAdminAuditLog,
  recordStockMovementAndAdjustProduct,
  savePurchaseOrderToFirestore,
  saveSupplierToFirestore,
  saveWarehouseToFirestore,
} from '../../lib/storeDb';

interface AdminInventoryPurchaseSectionProps {
  mode: 'inventory' | 'purchases';
  darkMode: boolean;
  firebaseUser: FirebaseUser;
  products: Product[];
  warehouses: WarehouseRecord[];
  stockMovements: StockMovementRecord[];
  suppliers: SupplierRecord[];
  purchases: PurchaseOrderRecord[];
  onNotify: (msg: string) => void;
}

export function AdminInventoryPurchaseSection({
  mode,
  darkMode,
  firebaseUser,
  products,
  warehouses,
  stockMovements,
  suppliers,
  purchases,
  onNotify,
}: AdminInventoryPurchaseSectionProps) {
  const [busy, setBusy] = useState(false);

  // Warehouse form
  const [whName, setWhName] = useState('');
  const [whCode, setWhCode] = useState('');
  const [whLoc, setWhLoc] = useState('');
  const [whManager, setWhManager] = useState('');

  // Stock Movement form
  const [stkProdId, setStkProdId] = useState(products[0]?.id ?? '');
  const [stkWarehouseId, setStkWarehouseId] = useState(warehouses[0]?.id ?? 'main-dhaka');
  const [stkType, setStkType] = useState<StockMovementRecord['type']>('in');
  const [stkQty, setStkQty] = useState('10');
  const [stkBatch, setStkBatch] = useState('');
  const [stkExpiry, setStkExpiry] = useState('');
  const [stkReason, setStkReason] = useState('নতুন ব্যাচ স্টক ইন');

  // Supplier form
  const [supName, setSupName] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supLoc, setSupLoc] = useState('');
  const [supItems, setSupItems] = useState('');

  // Purchase Order form
  const [poSupplierId, setPoSupplierId] = useState(suppliers[0]?.id ?? '');
  const [poItemsSummary, setPoItemsSummary] = useState('');
  const [poTotalCost, setPoTotalCost] = useState('10000');
  const [poPaidAmount, setPoPaidAmount] = useState('5000');

  const cardCls = darkMode
    ? 'bg-[#181B22] border-[#2A2F3A] text-gray-100'
    : 'bg-white border-[#EAEAEA] text-[#212121]';
  const inputCls = darkMode
    ? 'bg-[#101318] border-[#2E3440] text-gray-100'
    : 'bg-white border-[#D1D5DB] text-[#212121]';
  const subTextCls = darkMode ? 'text-gray-400' : 'text-[#616161]';

  const inventoryStats = useMemo(() => {
    let totalUnits = 0;
    let totalCostValue = 0;
    let totalRetailValue = 0;
    let lowCount = 0;
    let outCount = 0;
    for (const p of products) {
      const qty = Math.max(0, Number(p.stockLeft ?? 0));
      const unitCost = p.costPrice ?? Math.round(p.price * 0.72);
      totalUnits += qty;
      totalCostValue += qty * unitCost;
      totalRetailValue += qty * p.price;
      if (qty === 0 || !p.inStock) outCount += 1;
      else if (qty <= 10) lowCount += 1;
    }
    return { totalUnits, totalCostValue, totalRetailValue, lowCount, outCount };
  }, [products]);

  const handleAddWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!whName.trim() || !whCode.trim()) return;
    setBusy(true);
    try {
      const id = `wh-${whCode.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now().toString().slice(-3)}`;
      await saveWarehouseToFirestore({
        id,
        name: whName.trim(),
        branchCode: whCode.trim().toUpperCase(),
        location: whLoc.trim() || 'Bangladesh',
        managerName: whManager.trim() || 'Warehouse Lead',
        isDefault: warehouses.length === 0,
        active: true,
      });
      await recordAdminAuditLog(firebaseUser, 'ADD_WAREHOUSE', id, whName);
      setWhName('');
      setWhCode('');
      setWhLoc('');
      setWhManager('');
      onNotify('নতুন ওয়ারহাউস/শাখা যুক্ত হয়েছে!');
    } finally {
      setBusy(false);
    }
  };

  const handleRecordStock = async (e: React.FormEvent) => {
    e.preventDefault();
    const product = products.find((p) => p.id === stkProdId) ?? products[0];
    if (!product) return;
    const rawQty = Math.abs(Number(stkQty) || 0);
    if (rawQty <= 0) {
      onNotify('সঠিক পরিমাণ লিখুন।');
      return;
    }
    const qtyChange = stkType === 'out' ? -rawQty : rawQty;
    setBusy(true);
    try {
      await recordStockMovementAndAdjustProduct(
        {
          productId: product.id,
          productName: product.name,
          warehouseId: stkWarehouseId || 'main-dhaka',
          type: stkType,
          qtyChange,
          batchNo: stkBatch.trim() || undefined,
          expiryDate: stkExpiry.trim() || undefined,
          reason: stkReason.trim() || 'Stock movement',
          actorEmail: firebaseUser.email ?? 'admin',
        },
        product
      );
      await recordAdminAuditLog(
        firebaseUser,
        'STOCK_MOVEMENT',
        product.id,
        `${stkType.toUpperCase()} (${qtyChange}) batch:${stkBatch || 'N/A'}`
      );
      setStkBatch('');
      setStkExpiry('');
      onNotify(`${product.name} স্টক আপডেট সম্পন্ন (${qtyChange >= 0 ? `+${qtyChange}` : qtyChange})!`);
    } finally {
      setBusy(false);
    }
  };

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName.trim() || !supPhone.trim()) return;
    setBusy(true);
    try {
      const id = `sup-${Date.now()}`;
      await saveSupplierToFirestore({
        id,
        name: supName.trim(),
        phone: supPhone.trim(),
        location: supLoc.trim() || 'Chuadanga',
        suppliedItems: supItems.trim() || 'Khejur Gur & Honey',
        lastBatchDate: new Date().toISOString().slice(0, 10),
        active: true,
      });
      await recordAdminAuditLog(firebaseUser, 'ADD_SUPPLIER', id, supName);
      setSupName('');
      setSupPhone('');
      setSupLoc('');
      setSupItems('');
      onNotify('সাপ্লায়ার প্রোফাইল সংরক্ষিত হয়েছে!');
    } finally {
      setBusy(false);
    }
  };

  const handleCreatePurchaseOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const supplier = suppliers.find((s) => s.id === poSupplierId) ?? suppliers[0];
    if (!supplier || !poItemsSummary.trim()) {
      onNotify('প্রথমে সাপ্লায়ার ও পণ্যের বিবরণ নির্বাচন করুন।');
      return;
    }
    setBusy(true);
    try {
      const totalCost = Math.max(0, Number(poTotalCost) || 0);
      const paidAmount = Math.max(0, Number(poPaidAmount) || 0);
      const id = `po-${Date.now()}`;
      await savePurchaseOrderToFirestore({
        id,
        poNumber: `PO-${Date.now().toString().slice(-5)}`,
        supplierId: supplier.id,
        supplierName: supplier.name,
        itemsSummary: poItemsSummary.trim(),
        totalCost,
        paidAmount,
        dueAmount: Math.max(0, totalCost - paidAmount),
        status: paidAmount >= totalCost ? 'Settled' : 'Ordered',
        dateText: new Date().toISOString().slice(0, 10),
      });
      await recordAdminAuditLog(firebaseUser, 'CREATE_PO', id, `${supplier.name}: ৳${totalCost}`);
      setPoItemsSummary('');
      onNotify('নতুন Purchase Order তৈরি হয়েছে!');
    } finally {
      setBusy(false);
    }
  };

  if (mode === 'inventory') {
    return (
      <div className="space-y-6">
        {/* Inventory Valuation Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className={`rounded-xl border p-4 ${cardCls}`}>
            <p className={`text-[11px] font-bold uppercase ${subTextCls}`}>Total Stock Units</p>
            <p className="text-2xl font-extrabold font-mono mt-1">{inventoryStats.totalUnits}</p>
          </div>
          <div className={`rounded-xl border p-4 ${cardCls}`}>
            <p className={`text-[11px] font-bold uppercase ${subTextCls}`}>Cost Valuation</p>
            <p className="text-2xl font-extrabold font-mono text-[#1D4ED8] mt-1">
              ৳{inventoryStats.totalCostValue.toLocaleString()}
            </p>
          </div>
          <div className={`rounded-xl border p-4 ${cardCls}`}>
            <p className={`text-[11px] font-bold uppercase ${subTextCls}`}>Retail Valuation</p>
            <p className="text-2xl font-extrabold font-mono text-[#047857] mt-1">
              ৳{inventoryStats.totalRetailValue.toLocaleString()}
            </p>
          </div>
          <div className={`rounded-xl border p-4 ${cardCls}`}>
            <p className={`text-[11px] font-bold uppercase ${subTextCls}`}>Low / Out of Stock</p>
            <p className="text-2xl font-extrabold font-mono text-[#C2410C] mt-1">
              {inventoryStats.lowCount} / {inventoryStats.outCount}
            </p>
          </div>
        </div>

        {/* Stock In/Out/Batch Adjustment + Multi-Warehouse Registry */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <form onSubmit={handleRecordStock} className={`rounded-xl border p-4 space-y-3 ${cardCls}`}>
            <h3 className="text-sm font-extrabold flex items-center gap-2">
              <ArrowDownUp className="w-4 h-4 text-[#F85606]" />
              Stock In / Out / Transfer &amp; Batch Tracking
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <select
                value={stkProdId}
                onChange={(e) => setStkProdId(e.target.value)}
                className={`border rounded-lg px-3 py-2 ${inputCls}`}
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Stock: {p.stockLeft ?? 0})
                  </option>
                ))}
              </select>
              <select
                value={stkWarehouseId}
                onChange={(e) => setStkWarehouseId(e.target.value)}
                className={`border rounded-lg px-3 py-2 ${inputCls}`}
              >
                <option value="main-dhaka">Main Dhaka Hub (DHK-01)</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.branchCode})
                  </option>
                ))}
              </select>
              <select
                value={stkType}
                onChange={(e) => setStkType(e.target.value as StockMovementRecord['type'])}
                className={`border rounded-lg px-3 py-2 ${inputCls}`}
              >
                <option value="in">Stock In (+)</option>
                <option value="out">Stock Out (-)</option>
                <option value="adjustment">Adjustment (+)</option>
                <option value="transfer">Warehouse Transfer (+)</option>
                <option value="return">Customer Return Reconcile (+)</option>
              </select>
              <input
                type="number"
                min="1"
                value={stkQty}
                onChange={(e) => setStkQty(e.target.value)}
                placeholder="Quantity"
                className={`border rounded-lg px-3 py-2 ${inputCls}`}
              />
              <input
                type="text"
                value={stkBatch}
                onChange={(e) => setStkBatch(e.target.value)}
                placeholder="Batch No (e.g. B-2026-01)"
                className={`border rounded-lg px-3 py-2 ${inputCls}`}
              />
              <input
                type="date"
                value={stkExpiry}
                onChange={(e) => setStkExpiry(e.target.value)}
                className={`border rounded-lg px-3 py-2 ${inputCls}`}
              />
              <input
                type="text"
                value={stkReason}
                onChange={(e) => setStkReason(e.target.value)}
                placeholder="Reason / Reference"
                className={`sm:col-span-2 border rounded-lg px-3 py-2 ${inputCls}`}
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full py-2 rounded-lg bg-[#F85606] hover:bg-[#D94802] text-white text-xs font-bold cursor-pointer disabled:opacity-60"
            >
              স্টক মুভমেন্ট সেভ ও ইনভেন্টরি আপডেট করুন
            </button>
          </form>

          <div className={`rounded-xl border p-4 space-y-3 ${cardCls}`}>
            <h3 className="text-sm font-extrabold flex items-center gap-2">
              <Warehouse className="w-4 h-4 text-[#047857]" />
              Multi-Warehouse &amp; Branch Registry ({warehouses.length})
            </h3>
            <form onSubmit={handleAddWarehouse} className="grid grid-cols-2 gap-2 text-xs">
              <input
                type="text"
                required
                value={whName}
                onChange={(e) => setWhName(e.target.value)}
                placeholder="Warehouse / Branch Name"
                className={`border rounded-lg px-2.5 py-2 ${inputCls}`}
              />
              <input
                type="text"
                required
                value={whCode}
                onChange={(e) => setWhCode(e.target.value)}
                placeholder="Code (e.g. CTG-03)"
                className={`border rounded-lg px-2.5 py-2 ${inputCls}`}
              />
              <input
                type="text"
                value={whLoc}
                onChange={(e) => setWhLoc(e.target.value)}
                placeholder="Location / Address"
                className={`border rounded-lg px-2.5 py-2 ${inputCls}`}
              />
              <input
                type="text"
                value={whManager}
                onChange={(e) => setWhManager(e.target.value)}
                placeholder="Manager Name"
                className={`border rounded-lg px-2.5 py-2 ${inputCls}`}
              />
              <button
                type="submit"
                disabled={busy}
                className="col-span-2 py-2 rounded-lg bg-[#047857] hover:bg-[#065F46] text-white text-xs font-bold cursor-pointer flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Warehouse / Branch
              </button>
            </form>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {warehouses.map((w) => (
                <div
                  key={w.id}
                  className="flex items-center justify-between text-xs p-2 rounded-lg border border-black/10"
                >
                  <div>
                    <span className="font-bold">{w.name}</span>{' '}
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#EFF6FF] text-[#1D4ED8]">
                      {w.branchCode}
                    </span>
                    <p className={`text-[11px] ${subTextCls}`}>{w.location}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void deleteWarehouseFromFirestore(w.id)}
                    className="p-1 text-[#DC2626] hover:bg-[#FEF2F2] rounded cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Low Stock Warnings + Movement Log */}
        <div className={`rounded-xl border p-4 ${cardCls}`}>
          <h3 className="text-sm font-extrabold mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#C2410C]" />
            Stock Movement Audit Log ({stockMovements.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className={`border-b ${subTextCls}`}>
                  <th className="py-2 pr-3">Product</th>
                  <th className="py-2 pr-3">Type</th>
                  <th className="py-2 pr-3">Qty</th>
                  <th className="py-2 pr-3">Batch / Expiry</th>
                  <th className="py-2 pr-3">Warehouse</th>
                  <th className="py-2">Reason</th>
                </tr>
              </thead>
              <tbody>
                {stockMovements.slice(0, 20).map((m) => (
                  <tr key={m.id} className="border-b border-black/5">
                    <td className="py-2 pr-3 font-bold">{m.productName}</td>
                    <td className="py-2 pr-3 uppercase font-mono text-[10px]">{m.type}</td>
                    <td
                      className={`py-2 pr-3 font-mono font-bold ${
                        m.qtyChange >= 0 ? 'text-[#047857]' : 'text-[#DC2626]'
                      }`}
                    >
                      {m.qtyChange >= 0 ? `+${m.qtyChange}` : m.qtyChange}
                    </td>
                    <td className="py-2 pr-3 text-[11px]">
                      {m.batchNo || '—'} {m.expiryDate ? `(Exp: ${m.expiryDate})` : ''}
                    </td>
                    <td className="py-2 pr-3 font-mono text-[11px]">{m.warehouseId}</td>
                    <td className="py-2">{m.reason}</td>
                  </tr>
                ))}
                {stockMovements.length === 0 && (
                  <tr>
                    <td colSpan={6} className={`py-4 text-center ${subTextCls}`}>
                      কোনো স্টক মুভমেন্ট রেকর্ড নেই।
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // mode === 'purchases'
  const totalPoPayable = purchases.reduce((s, p) => s + (Number(p.dueAmount) || 0), 0);
  const totalPoCost = purchases.reduce((s, p) => s + (Number(p.totalCost) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className={`rounded-xl border p-4 ${cardCls}`}>
          <p className={`text-[11px] font-bold uppercase ${subTextCls}`}>Active Suppliers</p>
          <p className="text-2xl font-extrabold font-mono mt-1">{suppliers.length}</p>
        </div>
        <div className={`rounded-xl border p-4 ${cardCls}`}>
          <p className={`text-[11px] font-bold uppercase ${subTextCls}`}>Total Purchase Value</p>
          <p className="text-2xl font-extrabold font-mono text-[#1D4ED8] mt-1">
            ৳{totalPoCost.toLocaleString()}
          </p>
        </div>
        <div className={`rounded-xl border p-4 ${cardCls}`}>
          <p className={`text-[11px] font-bold uppercase ${subTextCls}`}>Supplier Payable Due</p>
          <p className="text-2xl font-extrabold font-mono text-[#DC2626] mt-1">
            ৳{totalPoPayable.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Create Purchase Order */}
        <form onSubmit={handleCreatePurchaseOrder} className={`rounded-xl border p-4 space-y-3 ${cardCls}`}>
          <h3 className="text-sm font-extrabold flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-[#F85606]" /> Create Supplier Purchase Order
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <select
              value={poSupplierId}
              onChange={(e) => setPoSupplierId(e.target.value)}
              className={`sm:col-span-2 border rounded-lg px-3 py-2 ${inputCls}`}
            >
              {suppliers.length === 0 ? (
                <option value="">প্রথমে ডানপাশে সাপ্লায়ার যুক্ত করুন</option>
              ) : (
                suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.location})
                  </option>
                ))
              )}
            </select>
            <input
              type="text"
              required
              value={poItemsSummary}
              onChange={(e) => setPoItemsSummary(e.target.value)}
              placeholder="Items & Qty (e.g. Patali Gur 200kg)"
              className={`sm:col-span-2 border rounded-lg px-3 py-2 ${inputCls}`}
            />
            <input
              type="number"
              min="0"
              value={poTotalCost}
              onChange={(e) => setPoTotalCost(e.target.value)}
              placeholder="Total PO Cost (৳)"
              className={`border rounded-lg px-3 py-2 ${inputCls}`}
            />
            <input
              type="number"
              min="0"
              value={poPaidAmount}
              onChange={(e) => setPoPaidAmount(e.target.value)}
              placeholder="Paid Amount (৳)"
              className={`border rounded-lg px-3 py-2 ${inputCls}`}
            />
          </div>
          <button
            type="submit"
            disabled={busy || suppliers.length === 0}
            className="w-full py-2 rounded-lg bg-[#F85606] hover:bg-[#D94802] text-white text-xs font-bold cursor-pointer disabled:opacity-60"
          >
            Purchase Order &amp; Supplier Ledger সেভ করুন
          </button>
        </form>

        {/* Add Supplier */}
        <form onSubmit={handleAddSupplier} className={`rounded-xl border p-4 space-y-3 ${cardCls}`}>
          <h3 className="text-sm font-extrabold flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#047857]" /> Register Supplier / Farm Partner
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <input
              type="text"
              required
              value={supName}
              onChange={(e) => setSupName(e.target.value)}
              placeholder="Supplier / Farm Name"
              className={`border rounded-lg px-3 py-2 ${inputCls}`}
            />
            <input
              type="text"
              required
              value={supPhone}
              onChange={(e) => setSupPhone(e.target.value)}
              placeholder="Mobile Number"
              className={`border rounded-lg px-3 py-2 ${inputCls}`}
            />
            <input
              type="text"
              value={supLoc}
              onChange={(e) => setSupLoc(e.target.value)}
              placeholder="Location (e.g. Sarojganj, Chuadanga)"
              className={`border rounded-lg px-3 py-2 ${inputCls}`}
            />
            <input
              type="text"
              value={supItems}
              onChange={(e) => setSupItems(e.target.value)}
              placeholder="Supplied Products"
              className={`border rounded-lg px-3 py-2 ${inputCls}`}
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full py-2 rounded-lg bg-[#047857] hover:bg-[#065F46] text-white text-xs font-bold cursor-pointer"
          >
            + সাপ্লায়ার যুক্ত করুন
          </button>
        </form>
      </div>

      {/* Purchase Orders Ledger Table */}
      <div className={`rounded-xl border p-4 ${cardCls}`}>
        <h3 className="text-sm font-extrabold mb-3">Purchase Orders &amp; Payable Dues Ledger</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className={`border-b ${subTextCls}`}>
                <th className="py-2 pr-3">PO #</th>
                <th className="py-2 pr-3">Supplier</th>
                <th className="py-2 pr-3">Items</th>
                <th className="py-2 pr-3">Total</th>
                <th className="py-2 pr-3">Paid</th>
                <th className="py-2 pr-3">Due</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((po) => (
                <tr key={po.id} className="border-b border-black/5">
                  <td className="py-2 pr-3 font-mono font-bold">{po.poNumber}</td>
                  <td className="py-2 pr-3 font-bold">{po.supplierName}</td>
                  <td className="py-2 pr-3">{po.itemsSummary}</td>
                  <td className="py-2 pr-3 font-mono">৳{po.totalCost.toLocaleString()}</td>
                  <td className="py-2 pr-3 font-mono text-[#047857]">৳{po.paidAmount.toLocaleString()}</td>
                  <td className="py-2 pr-3 font-mono text-[#DC2626] font-bold">
                    ৳{po.dueAmount.toLocaleString()}
                  </td>
                  <td className="py-2 pr-3">
                    <span className="px-2 py-0.5 rounded bg-[#EFF6FF] text-[#1D4ED8] font-bold text-[10px]">
                      {po.status}
                    </span>
                  </td>
                  <td className="py-2 flex items-center gap-1.5">
                    {po.dueAmount > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          void savePurchaseOrderToFirestore({
                            ...po,
                            paidAmount: po.totalCost,
                            dueAmount: 0,
                            status: 'Settled',
                          }).then(() => onNotify(`${po.poNumber} বকেয়া পরিশোধ (Settled) হয়েছে!`))
                        }
                        className="px-2 py-1 rounded bg-[#047857] text-white text-[10px] font-bold cursor-pointer"
                      >
                        Settle Due
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => void deletePurchaseOrderFromFirestore(po.id)}
                      className="p-1 text-[#DC2626] cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {purchases.length === 0 && (
                <tr>
                  <td colSpan={8} className={`py-4 text-center ${subTextCls}`}>
                    কোনো Purchase Order এখনো তৈরি হয়নি।
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Suppliers Directory */}
      <div className={`rounded-xl border p-4 ${cardCls}`}>
        <h3 className="text-sm font-extrabold mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-[#1D4ED8]" /> Registered Suppliers ({suppliers.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {suppliers.map((s) => (
            <div key={s.id} className="p-3 rounded-lg border border-black/10 flex justify-between gap-2 text-xs">
              <div>
                <p className="font-bold">{s.name}</p>
                <p className={`text-[11px] font-mono ${subTextCls}`}>{s.phone} · {s.location}</p>
                <p className="text-[11px] mt-1">{s.suppliedItems}</p>
              </div>
              <button
                type="button"
                onClick={() => void deleteSupplierFromFirestore(s.id)}
                className="text-[#DC2626] self-start p-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
