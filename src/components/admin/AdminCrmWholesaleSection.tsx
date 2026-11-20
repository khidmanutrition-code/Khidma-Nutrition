import { Fragment, useMemo, useState } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import {
  Award,
  Ban,
  Check,
  CheckCircle2,
  Download,
  Edit3,
  History,
  Plus,
  Search,
  Tag,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import type { CustomerCrmRecord, OrderReceipt, RegisteredUserProfile } from '../../types';
import {
  deleteCustomerCrmFromFirestore,
  recordAdminAuditLog,
  saveCustomerCrmToFirestore,
} from '../../lib/storeDb';
import { ResilientImage } from '../ResilientImage';

interface AdminCrmWholesaleSectionProps {
  darkMode: boolean;
  firebaseUser: FirebaseUser;
  orders: OrderReceipt[];
  customersCrm: CustomerCrmRecord[];
  registeredUsers?: RegisteredUserProfile[];
  customerTags?: Record<string, string[]>;
  onUpdateCustomerTags?: (phone: string, tags: string[]) => void;
  onNotify: (msg: string) => void;
}

export function AdminCrmWholesaleSection({
  darkMode,
  firebaseUser,
  orders,
  customersCrm,
  registeredUsers = [],
  customerTags = {},
  onUpdateCustomerTags,
  onNotify,
}: AdminCrmWholesaleSectionProps) {
  const [search, setSearch] = useState('');
  const [segmentFilter, setSegmentFilter] = useState<string>('ALL');
  const [expandedHistoryPhone, setExpandedHistoryPhone] = useState<string | null>(null);
  const [customTagInput, setCustomTagInput] = useState<Record<string, string>>({});
  const [editingNotePhone, setEditingNotePhone] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newBusiness, setNewBusiness] = useState('');
  const [newGroup, setNewGroup] = useState<CustomerCrmRecord['group']>('Regular');
  const [newCreditDue, setNewCreditDue] = useState('0');
  const [newNotes, setNewNotes] = useState('');

  const cardCls = darkMode
    ? 'bg-[#181B22] border-[#2A2F3A] text-gray-100'
    : 'bg-white border-[#EAEAEA] text-[#212121]';
  const inputCls = darkMode
    ? 'bg-[#101318] border-[#2E3440] text-gray-100'
    : 'bg-white border-[#D1D5DB] text-[#212121]';
  const subTextCls = darkMode ? 'text-gray-400' : 'text-[#616161]';

  // Merge Order buyers with persisted CRM records
  const allCustomers = useMemo(() => {
    const orderStatsByPhone = new Map<
      string,
      { orderCount: number; totalSpent: number; name: string; email?: string }
    >();
    for (const o of orders) {
      const key = o.phone.trim();
      const prev = orderStatsByPhone.get(key) ?? {
        orderCount: 0,
        totalSpent: 0,
        name: o.customerName,
        email: o.customerEmail,
      };
      prev.orderCount += 1;
      if (!['Cancelled', 'Returned', 'Refunded'].includes(o.status)) {
        prev.totalSpent += Number(o.total) || 0;
      }
      orderStatsByPhone.set(key, prev);
    }

    const crmPhones = new Set(customersCrm.map((c) => c.phone.trim()));
    const combined: Array<CustomerCrmRecord & { orderCount: number; totalSpent: number; isCrmSaved: boolean }> =
      customersCrm.map((c) => {
        const stats = orderStatsByPhone.get(c.phone.trim());
        return {
          ...c,
          orderCount: stats?.orderCount ?? 0,
          totalSpent: stats?.totalSpent ?? 0,
          isCrmSaved: true,
        };
      });

    for (const [phone, st] of orderStatsByPhone.entries()) {
      if (!crmPhones.has(phone)) {
        combined.push({
          id: `crm-auto-${phone.replace(/[^0-9]/g, '') || Date.now()}`,
          name: st.name,
          phone,
          email: st.email,
          group: st.totalSpent >= 5000 ? 'VIP' : 'Regular',
          wholesaleApproved: false,
          creditDue: 0,
          blocked: false,
          orderCount: st.orderCount,
          totalSpent: st.totalSpent,
          isCrmSaved: false,
        });
      }
    }
    return combined;
  }, [customersCrm, orders]);

  const mergedCustomers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allCustomers.filter((c) => {
      const matchQuery =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        (c.notes || '').toLowerCase().includes(q) ||
        (c.businessName || '').toLowerCase().includes(q);
      const matchSeg =
        segmentFilter === 'ALL'
          ? true
          : segmentFilter === 'HIGH_LTV'
            ? c.totalSpent >= 10000
            : segmentFilter === 'REPEAT_BUYERS'
              ? c.orderCount >= 2
              : segmentFilter === 'PENDING_WHOLESALE'
                ? Boolean(c.wholesaleRequested && !c.wholesaleApproved)
                : segmentFilter === 'BLOCKED'
                  ? c.blocked
                  : c.group === segmentFilter;
      return matchQuery && matchSeg;
    });
  }, [allCustomers, search, segmentFilter]);

  const handleSaveCrm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;
    const id = `crm-${newPhone.replace(/[^0-9]/g, '') || Date.now()}`;
    await saveCustomerCrmToFirestore({
      id,
      name: newName.trim(),
      phone: newPhone.trim(),
      email: newEmail.trim() || undefined,
      businessName: newBusiness.trim() || undefined,
      group: newGroup,
      wholesaleApproved: newGroup === 'Wholesale',
      creditDue: Math.max(0, Number(newCreditDue) || 0),
      notes: newNotes.trim() || undefined,
      blocked: false,
    });
    await recordAdminAuditLog(firebaseUser, 'UPSERT_CUSTOMER_CRM', id, newName);
    setNewName('');
    setNewPhone('');
    setNewEmail('');
    setNewBusiness('');
    setNewCreditDue('0');
    setNewNotes('');
    onNotify('কাস্টমার CRM প্রোফাইল সংরক্ষিত হয়েছে!');
  };

  const handleSaveInlineNote = async (c: CustomerCrmRecord & { isCrmSaved: boolean }) => {
    setSavingNote(true);
    try {
      const crmId = c.isCrmSaved ? c.id : `crm-${c.phone.replace(/[^0-9]/g, '') || Date.now()}`;
      await saveCustomerCrmToFirestore({
        id: crmId,
        userId: c.userId,
        name: c.name,
        phone: c.phone,
        email: c.email,
        businessName: c.businessName,
        group: c.group,
        wholesaleRequested: c.wholesaleRequested,
        wholesaleApproved: c.wholesaleApproved,
        creditDue: c.creditDue,
        notes: noteDraft.trim() || undefined,
        blocked: c.blocked,
      });
      await recordAdminAuditLog(firebaseUser, 'UPDATE_CUSTOMER_NOTE', crmId, noteDraft.trim());
      setEditingNotePhone(null);
      onNotify(`${c.name}-এর কাস্টমার নোট সংরক্ষিত হয়েছে!`);
    } finally {
      setSavingNote(false);
    }
  };

  const handleExportCustomersCsv = async () => {
    const res = await fetch('/api/reports/export-csv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: `customers-crm-${new Date().toISOString().slice(0, 10)}`,
        headers: ['Name', 'Phone', 'Group', 'Business', 'Orders', 'Total Spent', 'Credit Due', 'Wholesale Approved', 'Notes', 'Blocked'],
        rows: mergedCustomers.map((c) => [
          c.name,
          c.phone,
          c.group,
          c.businessName || '',
          c.orderCount,
          c.totalSpent,
          c.creditDue,
          c.wholesaleApproved ? 'Yes' : 'No',
          c.notes || '',
          c.blocked ? 'Yes' : 'No',
        ]),
      }),
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers-crm-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    onNotify('কাস্টমার CRM CSV ডাউনলোড হয়েছে!');
  };

  const segmentCounts = useMemo(
    () => ({
      ALL: allCustomers.length,
      HIGH_LTV: allCustomers.filter((c) => c.totalSpent >= 10000).length,
      REPEAT_BUYERS: allCustomers.filter((c) => c.orderCount >= 2).length,
      VIP: allCustomers.filter((c) => c.group === 'VIP').length,
      Wholesale: allCustomers.filter((c) => c.group === 'Wholesale').length,
      PENDING_WHOLESALE: allCustomers.filter((c) => Boolean(c.wholesaleRequested && !c.wholesaleApproved)).length,
      BLOCKED: allCustomers.filter((c) => c.blocked).length,
    }),
    [allCustomers]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold flex items-center gap-2">
            <Users className="w-5 h-5 text-[#F85606]" />
            <span>Customer CRM, Segments, Notes &amp; Wholesale Ledger</span>
          </h2>
          <p className={`text-xs ${subTextCls}`}>
            Customer Segments (৳10,000+ High LTV, Repeat Buyers), Order History, Internal Notes, Tags ও পাইকারি অনুমোদন
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleExportCustomersCsv()}
          className="px-3 py-2 rounded-lg bg-[#1D4ED8] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer self-start"
        >
          <Download className="w-3.5 h-3.5" /> Export Customers CSV
        </button>
      </div>

      {/* Add / Edit CRM Customer */}
      <form onSubmit={handleSaveCrm} className={`rounded-xl border p-4 space-y-3 ${cardCls}`}>
        <h3 className="text-sm font-extrabold flex items-center gap-1.5">
          <Plus className="w-4 h-4 text-[#047857]" /> Add / Update Customer &amp; Wholesale Profile
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
          <input
            type="text"
            required
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Customer Name"
            className={`border rounded-lg px-2.5 py-2 ${inputCls}`}
          />
          <input
            type="text"
            required
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            placeholder="Phone (017...)"
            className={`border rounded-lg px-2.5 py-2 ${inputCls}`}
          />
          <input
            type="text"
            value={newBusiness}
            onChange={(e) => setNewBusiness(e.target.value)}
            placeholder="Business / Shop (Wholesale)"
            className={`border rounded-lg px-2.5 py-2 ${inputCls}`}
          />
          <select
            value={newGroup}
            onChange={(e) => setNewGroup(e.target.value as CustomerCrmRecord['group'])}
            className={`border rounded-lg px-2.5 py-2 ${inputCls}`}
          >
            <option value="Regular">Regular</option>
            <option value="VIP">VIP</option>
            <option value="Wholesale">Wholesale</option>
          </select>
          <input
            type="number"
            min="0"
            value={newCreditDue}
            onChange={(e) => setNewCreditDue(e.target.value)}
            placeholder="Credit Due ৳"
            className={`border rounded-lg px-2.5 py-2 ${inputCls}`}
          />
          <input
            type="text"
            value={newNotes}
            onChange={(e) => setNewNotes(e.target.value)}
            placeholder="Note (e.g. বারবার কল রিসিভ করেনি)"
            className={`border rounded-lg px-2.5 py-2 ${inputCls}`}
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-[#047857] hover:bg-[#065F46] text-white text-xs font-bold cursor-pointer"
        >
          কাস্টমার প্রোফাইল সংরক্ষণ করুন
        </button>
      </form>

      {/* Search & Customer Segments Pills */}
      <div className={`rounded-xl border p-3.5 space-y-3 ${cardCls}`}>
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="নাম, মোবাইল, নোট বা ব্যবসার নামে খুঁজুন..."
            className={`w-full pl-9 pr-3 py-2 text-xs rounded-lg border ${inputCls}`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          {(
            [
              { id: 'ALL', label: `All (${segmentCounts.ALL})` },
              { id: 'HIGH_LTV', label: `High LTV ≥ ৳10,000 (${segmentCounts.HIGH_LTV})` },
              { id: 'REPEAT_BUYERS', label: `Repeat Buyers 2+ Orders (${segmentCounts.REPEAT_BUYERS})` },
              { id: 'VIP', label: `VIP (${segmentCounts.VIP})` },
              { id: 'Wholesale', label: `Wholesale (${segmentCounts.Wholesale})` },
              { id: 'PENDING_WHOLESALE', label: `Pending Wholesale (${segmentCounts.PENDING_WHOLESALE})` },
              { id: 'BLOCKED', label: `Blocked (${segmentCounts.BLOCKED})` },
            ] as const
          ).map((seg) => (
            <button
              key={seg.id}
              type="button"
              onClick={() => setSegmentFilter(seg.id)}
              className={`px-2.5 py-1 rounded-lg font-bold border transition-colors cursor-pointer ${
                segmentFilter === seg.id
                  ? 'bg-[#F85606] text-white border-[#F85606]'
                  : 'border-black/15 hover:border-[#F85606]'
              }`}
            >
              {seg.label}
            </button>
          ))}
        </div>
      </div>

      {/* Customer Directory Table */}
      <div className={`rounded-xl border p-4 overflow-x-auto ${cardCls}`}>
        <table className="w-full text-xs text-left">
          <thead>
            <tr className={`border-b ${subTextCls}`}>
              <th className="py-2 pr-3">Customer, Tags &amp; Notes</th>
              <th className="py-2 pr-3">Segment</th>
              <th className="py-2 pr-3">Orders / Total Spent</th>
              <th className="py-2 pr-3">Wholesale Status</th>
              <th className="py-2 pr-3">Credit Due</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {mergedCustomers.map((c) => {
              const tags = customerTags[c.phone] ?? (c.group === 'VIP' ? ['VIP'] : []);
              const custOrders = orders.filter((o) => o.phone.trim() === c.phone.trim());
              const isExpanded = expandedHistoryPhone === c.phone;
              const tagDraft = customTagInput[c.phone] ?? '';
              const isEditingNote = editingNotePhone === c.phone;
              return (
                <Fragment key={c.id}>
                  <tr className="border-b border-black/5">
                    <td className="py-2.5 pr-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="font-bold">{c.name}</p>
                        {c.totalSpent >= 10000 && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#FEF3C7] text-[#92400E] border border-[#FCD34D] text-[9px] font-extrabold">
                            <Award className="w-2.5 h-2.5" /> ৳10k+ Top Spender
                          </span>
                        )}
                        {c.blocked && (
                          <span className="px-1.5 py-0.5 rounded bg-[#FEF2F2] text-[#DC2626] text-[10px] font-bold">
                            BLOCKED
                          </span>
                        )}
                      </div>
                      <p className={`text-[11px] font-mono ${subTextCls}`}>
                        {c.phone} {c.businessName ? `· ${c.businessName}` : ''}
                      </p>

                      {/* Customer Note display & inline editor */}
                      {isEditingNote ? (
                        <div className="flex items-center gap-1 mt-1.5">
                          <input
                            type="text"
                            value={noteDraft}
                            onChange={(e) => setNoteDraft(e.target.value)}
                            placeholder="নোট লিখুন (যেমন: বারবার কল রিসিভ করেনি)..."
                            className={`h-7 px-2 rounded border text-[11px] flex-1 min-w-[170px] ${inputCls}`}
                          />
                          <button
                            type="button"
                            disabled={savingNote}
                            onClick={() => void handleSaveInlineNote(c)}
                            className="h-7 px-2 rounded bg-[#047857] text-white text-[10px] font-bold cursor-pointer inline-flex items-center gap-0.5"
                          >
                            <Check className="w-3 h-3" /> Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingNotePhone(null)}
                            className="h-7 px-1.5 rounded border border-black/15 text-[10px] cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 mt-1">
                          {c.notes ? (
                            <span className="px-2 py-0.5 rounded bg-[#FEF9C3] text-[#854D0E] text-[10px] font-semibold">
                              Note: {c.notes}
                            </span>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingNotePhone(c.phone);
                              setNoteDraft(c.notes || '');
                            }}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-[#1D4ED8] hover:underline cursor-pointer"
                          >
                            <Edit3 className="w-2.5 h-2.5" />
                            <span>{c.notes ? 'Edit Note' : '+ Add Note'}</span>
                          </button>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-1 mt-1.5">
                        {tags.map((tg) => (
                          <span
                            key={tg}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#FFF7ED] text-[#C2410C] text-[10px] font-bold border border-[#FDBA74]"
                          >
                            <Tag className="w-2.5 h-2.5" />
                            <span>{tg}</span>
                            {onUpdateCustomerTags && (
                              <button
                                type="button"
                                onClick={() =>
                                  onUpdateCustomerTags(
                                    c.phone,
                                    tags.filter((x) => x !== tg)
                                  )
                                }
                                className="hover:text-[#DC2626] cursor-pointer"
                              >
                                ×
                              </button>
                            )}
                          </span>
                        ))}
                        {onUpdateCustomerTags && (
                          <span className="inline-flex items-center gap-1">
                            <input
                              type="text"
                              value={tagDraft}
                              onChange={(e) =>
                                setCustomTagInput((prev) => ({ ...prev, [c.phone]: e.target.value }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && tagDraft.trim()) {
                                  e.preventDefault();
                                  const nextTag = tagDraft.trim();
                                  if (!tags.includes(nextTag)) {
                                    onUpdateCustomerTags(c.phone, [...tags, nextTag]);
                                  }
                                  setCustomTagInput((prev) => ({ ...prev, [c.phone]: '' }));
                                }
                              }}
                              placeholder="+ Tag"
                              className={`w-16 h-5 px-1.5 rounded border text-[10px] ${inputCls}`}
                            />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 pr-3">
                      <span className="px-2 py-0.5 rounded bg-[#EFF6FF] text-[#1D4ED8] font-bold text-[10px]">
                        {c.group}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 font-mono tabular-nums">
                      <div>
                        {c.orderCount} orders · ৳{c.totalSpent.toLocaleString()}
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedHistoryPhone((prev) => (prev === c.phone ? null : c.phone))
                        }
                        className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-[#F85606] hover:underline cursor-pointer"
                      >
                        <History className="w-3 h-3" />
                        <span>{isExpanded ? 'Hide History' : `Order History (${custOrders.length})`}</span>
                      </button>
                    </td>
                    <td className="py-2.5 pr-3">
                      {c.wholesaleApproved ? (
                        <span className="inline-flex items-center gap-1 text-[#047857] font-bold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                        </span>
                      ) : c.wholesaleRequested ? (
                        <span className="text-[#C2410C] font-bold text-[11px]">Pending Approval</span>
                      ) : (
                        <span className={subTextCls}>Retail</span>
                      )}
                    </td>
                    <td className="py-2.5 pr-3 font-mono font-bold text-[#DC2626] tabular-nums">
                      ৳{c.creditDue.toLocaleString()}
                    </td>
                    <td className="py-2.5 flex flex-wrap items-center gap-1.5">
                      {!c.wholesaleApproved && (
                        <button
                          type="button"
                          onClick={() =>
                            void saveCustomerCrmToFirestore({
                              ...c,
                              group: 'Wholesale',
                              wholesaleApproved: true,
                              wholesaleRequested: false,
                            }).then(() => onNotify(`${c.name} কে Wholesale অনুমোদন দেওয়া হয়েছে!`))
                          }
                          className="px-2 py-1 rounded bg-[#047857] text-white text-[10px] font-bold cursor-pointer"
                        >
                          Approve Wholesale
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          void saveCustomerCrmToFirestore({
                            ...c,
                            blocked: !c.blocked,
                          }).then(() =>
                            onNotify(c.blocked ? `${c.name} Unblocked` : `${c.name} Blocked`)
                          )
                        }
                        className="px-2 py-1 rounded border border-black/15 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Ban className="w-3 h-3" /> {c.blocked ? 'Unblock' : 'Block'}
                      </button>
                      {c.isCrmSaved && (
                        <button
                          type="button"
                          onClick={() => void deleteCustomerCrmFromFirestore(c.id)}
                          className="p-1 text-[#DC2626] cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-black/[0.02] border-b border-black/10">
                      <td colSpan={6} className="p-3">
                        <p className="text-[11px] font-extrabold mb-2">
                          Order History — {c.name} ({c.phone})
                        </p>
                        {custOrders.length === 0 ? (
                          <p className={`text-[11px] ${subTextCls}`}>কোনো অর্ডার ইতিহাস পাওয়া যায়নি।</p>
                        ) : (
                          <div className="space-y-1.5">
                            {custOrders.map((ord) => (
                              <div
                                key={ord.orderId}
                                className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-lg border border-black/10 text-[11px]"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-extrabold text-[#F85606]">
                                    #{ord.orderId}
                                  </span>
                                  <span className={subTextCls}>{ord.createdAt}</span>
                                  <span className="truncate max-w-[260px]">
                                    {ord.items.map((it) => `${it.name}×${it.quantity}`).join(', ')}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 font-mono">
                                  <span className="px-1.5 py-0.5 rounded bg-[#ECFDF5] text-[#047857] text-[10px] font-bold">
                                    {ord.status}
                                  </span>
                                  <span className="font-extrabold">৳{ord.total.toLocaleString()}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Registered Customer User Details Directory */}
      <div className={`rounded-xl border p-4 space-y-3 ${cardCls}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold">
              Registered Website User Profiles ({registeredUsers.length})
            </h3>
            <p className={`text-[11px] ${subTextCls}`}>
              গ্রাহকদের আপলোডকৃত প্রোফাইল ছবি, জেলা/উপজেলা, জন্ম তারিখ ও ব্যক্তিগত ঠিকানা
            </p>
          </div>
        </div>
        {registeredUsers.length === 0 ? (
          <p className={`text-xs py-4 text-center ${subTextCls}`}>
            এখনো কোনো রেজিস্টার্ড ইউজার প্রোফাইল লোড হয়নি।
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {registeredUsers.map((u) => (
              <div key={u.uid} className="p-3 rounded-xl border border-black/10 flex items-start gap-3">
                <div className="w-11 h-11 rounded-full overflow-hidden bg-[#FFF5EC] text-[#F85606] font-extrabold flex items-center justify-center shrink-0 border border-[#EAEAEA]">
                  {u.avatarUrl ? (
                    <ResilientImage src={u.avatarUrl} alt={u.displayName} className="w-full h-full object-cover" />
                  ) : (
                    <span>{u.displayName.slice(0, 2).toUpperCase()}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-extrabold truncate">{u.displayName}</span>
                    {u.phoneVerified && (
                      <span className="px-1.5 py-0.5 rounded bg-[#ECFDF5] text-[#047857] text-[9px] font-bold">
                        OTP Verified
                      </span>
                    )}
                  </div>
                  <p className={`text-[11px] truncate ${subTextCls}`}>{u.email}</p>
                  {u.phone && <p className="font-mono text-[11px]">{u.phone}</p>}
                  {(u.address || u.district) && (
                    <p className={`text-[11px] line-clamp-2 ${subTextCls}`}>
                      {[u.address, u.upazila, u.district, u.division].filter(Boolean).join(', ')}
                    </p>
                  )}
                  {(u.gender || u.dateOfBirth) && (
                    <p className={`text-[10px] ${subTextCls}`}>
                      {[u.gender, u.dateOfBirth].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  {u.bio && <p className="text-[11px] italic opacity-85 line-clamp-2">“{u.bio}”</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
