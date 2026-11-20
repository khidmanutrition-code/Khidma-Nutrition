import { useState } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import {
  Bell,
  Briefcase,
  Check,
  Download,
  FileText,
  Globe,
  Plus,
  ShieldCheck,
  Trash2,
  Upload,
  UserPlus,
} from 'lucide-react';
import type { Product } from '../../data/products';
import { CMS_STARTER_TEMPLATES } from '../../data/templates';
import type {
  AdminNotificationRecord,
  AdminRoleName,
  AdminUserRecord,
  AuditLogRecord,
  CmsPageRecord,
  EmployeeRecord,
  RbacPermission,
  StoreSettings,
  SupplierRecord,
  VoucherRecord,
  WarehouseRecord,
} from '../../types';
import {
  ADMIN_ROLE_LIST,
  DEFAULT_CMS_PAGES,
  DEFAULT_ROLE_PERMISSIONS,
  RBAC_PERMISSIONS_LIST,
  addAdminUserToFirestore,
  deleteAdminNotification,
  deleteCmsPageFromFirestore,
  deleteEmployeeFromFirestore,
  markAdminNotificationRead,
  recordAdminAuditLog,
  removeAdminUserFromFirestore,
  saveCmsPageToFirestore,
  saveEmployeeToFirestore,
  saveProductToFirestore,
  saveStoreSettingsToFirestore,
  saveSupplierToFirestore,
  saveVoucherToFirestore,
  saveWarehouseToFirestore,
  updateAdminUserRbacInFirestore,
} from '../../lib/storeDb';
import { BOOTSTRAPPED_ADMIN_EMAIL } from '../../lib/firebase';

interface AdminCmsHrSystemSectionProps {
  mode: 'cms' | 'hr' | 'rbac' | 'system';
  darkMode: boolean;
  firebaseUser: FirebaseUser;
  cmsPages: CmsPageRecord[];
  employees: EmployeeRecord[];
  adminUsers: AdminUserRecord[];
  auditLogs: AuditLogRecord[];
  adminNotifications: AdminNotificationRecord[];
  storeSettings: StoreSettings;
  products: Product[];
  vouchers: VoucherRecord[];
  suppliers: SupplierRecord[];
  warehouses: WarehouseRecord[];
  onExportBackup: () => Promise<void>;
  onNotify: (msg: string) => void;
}

export function AdminCmsHrSystemSection({
  mode,
  darkMode,
  firebaseUser,
  cmsPages,
  employees,
  adminUsers,
  auditLogs,
  adminNotifications,
  storeSettings,
  products,
  vouchers,
  suppliers,
  warehouses,
  onExportBackup,
  onNotify,
}: AdminCmsHrSystemSectionProps) {
  const [busy, setBusy] = useState(false);

  // CMS & SEO state
  const [cmsSlug, setCmsSlug] = useState('about');
  const [cmsTitle, setCmsTitle] = useState('');
  const [cmsType, setCmsType] = useState<'page' | 'blog'>('page');
  const [cmsContent, setCmsContent] = useState('');
  const [cmsMetaTitle, setCmsMetaTitle] = useState('');
  const [cmsMetaDesc, setCmsMetaDesc] = useState('');
  const [seoTitle, setSeoTitle] = useState(storeSettings.seoTitle ?? '');
  const [seoDesc, setSeoDesc] = useState(storeSettings.seoDescription ?? '');
  const [seoKeywords, setSeoKeywords] = useState(storeSettings.seoKeywords ?? '');

  // HR Employee form
  const [empName, setEmpName] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empPhone, setEmpPhone] = useState('');
  const [empDept, setEmpDept] = useState('Fulfillment & Packing');
  const [empDesig, setEmpDesig] = useState('Operations Executive');
  const [empSalary, setEmpSalary] = useState('18000');

  // RBAC Staff form
  const [newUid, setNewUid] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<AdminRoleName>('Manager');
  const [newBranch, setNewBranch] = useState('DHK-01');
  const [newPerms, setNewPerms] = useState<RbacPermission[]>(DEFAULT_ROLE_PERMISSIONS.Manager);

  // Restore JSON preview state
  const [restoreStatus, setRestoreStatus] = useState<string | null>(null);

  const cardCls = darkMode
    ? 'bg-[#181B22] border-[#2A2F3A] text-gray-100'
    : 'bg-white border-[#EAEAEA] text-[#212121]';
  const inputCls = darkMode
    ? 'bg-[#101318] border-[#2E3440] text-gray-100'
    : 'bg-white border-[#D1D5DB] text-[#212121]';
  const subTextCls = darkMode ? 'text-gray-400' : 'text-[#616161]';

  // -------- Mode: CMS & SEO --------
  if (mode === 'cms') {
    const loadPageToEditor = (p: CmsPageRecord) => {
      setCmsSlug(p.slug);
      setCmsTitle(p.title);
      setCmsType(p.type);
      setCmsContent(p.content);
      setCmsMetaTitle(p.metaTitle ?? '');
      setCmsMetaDesc(p.metaDescription ?? '');
    };

    const handleSeedCms = async () => {
      setBusy(true);
      try {
        for (const p of DEFAULT_CMS_PAGES) {
          await saveCmsPageToFirestore(p);
        }
        onNotify('৭টি ডিফল্ট CMS পেজ ও ব্লগ সেভ হয়েছে!');
      } finally {
        setBusy(false);
      }
    };

    const handleSaveCmsPage = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!cmsSlug.trim() || !cmsTitle.trim() || !cmsContent.trim()) return;
      setBusy(true);
      try {
        await saveCmsPageToFirestore({
          slug: cmsSlug.trim(),
          title: cmsTitle.trim(),
          type: cmsType,
          content: cmsContent.trim(),
          metaTitle: cmsMetaTitle.trim() || undefined,
          metaDescription: cmsMetaDesc.trim() || undefined,
          published: true,
        });
        await recordAdminAuditLog(firebaseUser, 'SAVE_CMS_PAGE', cmsSlug, cmsTitle);
        onNotify(`CMS পেজ "/${cmsSlug}" প্রকাশিত হয়েছে!`);
      } finally {
        setBusy(false);
      }
    };

    const handleSaveGlobalSeo = async (e: React.FormEvent) => {
      e.preventDefault();
      setBusy(true);
      try {
        await saveStoreSettingsToFirestore(
          {
            ...storeSettings,
            seoTitle: seoTitle.trim(),
            seoDescription: seoDesc.trim(),
            seoKeywords: seoKeywords.trim(),
          },
          firebaseUser.uid
        );
        await recordAdminAuditLog(firebaseUser, 'UPDATE_GLOBAL_SEO', 'store_settings', seoTitle);
        onNotify('গ্লোবাল SEO ও মেটা ট্যাগ আপডেট হয়েছে!');
      } finally {
        setBusy(false);
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#F85606]" />
              <span>CMS Pages, Organic Blog &amp; SEO Manager</span>
            </h2>
            <p className={`text-xs ${subTextCls}`}>
              ফুটারের তথ্য পেজ, ব্লগ পোস্ট, মেটা ট্যাগ এবং অটোমেটেড XML Sitemap পরিচালনা করুন
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href="/sitemap.xml"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg border border-black/15 text-xs font-bold flex items-center gap-1"
            >
              <Globe className="w-3.5 h-3.5" /> /sitemap.xml
            </a>
            <a
              href="/robots.txt"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg border border-black/15 text-xs font-bold"
            >
              /robots.txt
            </a>
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleSeedCms()}
              className="px-3 py-1.5 rounded-lg bg-[#047857] text-white text-xs font-bold cursor-pointer"
            >
              Seed Default Pages
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* CMS Page & Blog Editor */}
          <form onSubmit={handleSaveCmsPage} className={`rounded-xl border p-4 space-y-3 ${cardCls}`}>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-extrabold">Create / Edit CMS Page or Blog Post</h3>
                <span className={`text-[10px] font-bold ${subTextCls}`}>
                  ১ ক্লিকে স্টার্টার টেমপ্লেট লোড করুন
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {CMS_STARTER_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => {
                      loadPageToEditor({ ...tpl.page });
                      onNotify(`"${tpl.label}" টেমপ্লেট এডিটরে লোড হয়েছে!`);
                    }}
                    className="px-2.5 py-1 rounded-md bg-[#FFF5EC] hover:bg-[#F85606] text-[#9A3412] hover:text-white border border-[#FDBA74] text-[10px] font-bold cursor-pointer transition-colors"
                  >
                    + {tpl.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <input
                type="text"
                required
                value={cmsSlug}
                onChange={(e) => setCmsSlug(e.target.value)}
                placeholder="slug (e.g. about)"
                className={`border rounded-lg px-2.5 py-2 font-mono ${inputCls}`}
              />
              <select
                value={cmsType}
                onChange={(e) => setCmsType(e.target.value as 'page' | 'blog')}
                className={`border rounded-lg px-2.5 py-2 ${inputCls}`}
              >
                <option value="page">CMS Page</option>
                <option value="blog">Blog Article</option>
              </select>
              <input
                type="text"
                required
                value={cmsTitle}
                onChange={(e) => setCmsTitle(e.target.value)}
                placeholder="Page / Article Title"
                className={`col-span-3 border rounded-lg px-2.5 py-2 ${inputCls}`}
              />
              <textarea
                rows={4}
                required
                value={cmsContent}
                onChange={(e) => setCmsContent(e.target.value)}
                placeholder="Page content in Bengali or English..."
                className={`col-span-3 border rounded-lg px-2.5 py-2 ${inputCls}`}
              />
              <input
                type="text"
                value={cmsMetaTitle}
                onChange={(e) => setCmsMetaTitle(e.target.value)}
                placeholder="SEO Meta Title (Optional)"
                className={`col-span-3 border rounded-lg px-2.5 py-2 ${inputCls}`}
              />
              <input
                type="text"
                value={cmsMetaDesc}
                onChange={(e) => setCmsMetaDesc(e.target.value)}
                placeholder="SEO Meta Description (Optional)"
                className={`col-span-3 border rounded-lg px-2.5 py-2 ${inputCls}`}
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full py-2 rounded-lg bg-[#F85606] hover:bg-[#D94802] text-white text-xs font-bold cursor-pointer"
            >
              পেজ / ব্লগ সংরক্ষণ ও প্রকাশ করুন
            </button>
          </form>

          {/* Storefront Global SEO + Published Pages List */}
          <div className="space-y-4">
            <form onSubmit={handleSaveGlobalSeo} className={`rounded-xl border p-4 space-y-2.5 ${cardCls}`}>
              <h3 className="text-sm font-extrabold">Global Storefront SEO Metadata</h3>
              <input
                type="text"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder="Meta Title"
                className={`w-full border rounded-lg px-2.5 py-2 text-xs ${inputCls}`}
              />
              <textarea
                rows={2}
                value={seoDesc}
                onChange={(e) => setSeoDesc(e.target.value)}
                placeholder="Meta Description"
                className={`w-full border rounded-lg px-2.5 py-2 text-xs ${inputCls}`}
              />
              <input
                type="text"
                value={seoKeywords}
                onChange={(e) => setSeoKeywords(e.target.value)}
                placeholder="SEO Keywords (comma separated)"
                className={`w-full border rounded-lg px-2.5 py-2 text-xs ${inputCls}`}
              />
              <button
                type="submit"
                disabled={busy}
                className="w-full py-2 rounded-lg bg-[#1D4ED8] text-white text-xs font-bold cursor-pointer"
              >
                গ্লোবাল SEO আপডেট করুন
              </button>
            </form>

            <div className={`rounded-xl border p-4 space-y-2 ${cardCls}`}>
              <h3 className="text-sm font-extrabold">Published Pages &amp; Blog ({cmsPages.length})</h3>
              <div className="space-y-1.5 max-h-52 overflow-y-auto">
                {cmsPages.map((p) => (
                  <div
                    key={p.slug}
                    className="flex items-center justify-between text-xs p-2 rounded-lg border border-black/10"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-bold truncate">{p.title}</p>
                      <p className={`text-[10px] font-mono ${subTextCls}`}>
                        /{p.slug} · {p.type.toUpperCase()}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => loadPageToEditor(p)}
                        className="px-2 py-1 rounded bg-[#EFF6FF] text-[#1D4ED8] text-[10px] font-bold cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteCmsPageFromFirestore(p.slug)}
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
        </div>
      </div>
    );
  }

  // -------- Mode: HR & Payroll --------
  if (mode === 'hr') {
    const totalPayroll = employees
      .filter((e) => e.status === 'Active')
      .reduce((s, e) => s + (Number(e.salary) || 0), 0);

    const handleAddEmployee = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!empName.trim() || !empPhone.trim()) return;
      setBusy(true);
      try {
        const id = `emp-${Date.now()}`;
        await saveEmployeeToFirestore({
          id,
          name: empName.trim(),
          email: empEmail.trim() || 'staff@khidmatulummah.shop',
          phone: empPhone.trim(),
          department: empDept.trim(),
          designation: empDesig.trim(),
          salary: Math.max(0, Number(empSalary) || 0),
          attendanceDays: 26,
          leaveDays: 0,
          status: 'Active',
        });
        await recordAdminAuditLog(firebaseUser, 'ADD_EMPLOYEE', id, empName);
        setEmpName('');
        setEmpEmail('');
        setEmpPhone('');
        onNotify('নতুন স্টাফ/কর্মচারী HR তালিকায় যুক্ত হয়েছে!');
      } finally {
        setBusy(false);
      }
    };

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className={`rounded-xl border p-4 ${cardCls}`}>
            <p className={`text-[11px] font-bold uppercase ${subTextCls}`}>Total Staff</p>
            <p className="text-2xl font-extrabold font-mono mt-1">{employees.length}</p>
          </div>
          <div className={`rounded-xl border p-4 ${cardCls}`}>
            <p className={`text-[11px] font-bold uppercase ${subTextCls}`}>Active Staff</p>
            <p className="text-2xl font-extrabold font-mono text-[#047857] mt-1">
              {employees.filter((e) => e.status === 'Active').length}
            </p>
          </div>
          <div className={`rounded-xl border p-4 ${cardCls}`}>
            <p className={`text-[11px] font-bold uppercase ${subTextCls}`}>Monthly Payroll Cost</p>
            <p className="text-2xl font-extrabold font-mono text-[#F85606] mt-1">
              ৳{totalPayroll.toLocaleString()}
            </p>
          </div>
        </div>

        <form onSubmit={handleAddEmployee} className={`rounded-xl border p-4 space-y-3 ${cardCls}`}>
          <h3 className="text-sm font-extrabold flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-[#F85606]" /> Add Employee &amp; Payroll Profile
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <input
              type="text"
              required
              value={empName}
              onChange={(e) => setEmpName(e.target.value)}
              placeholder="Employee Full Name"
              className={`border rounded-lg px-2.5 py-2 ${inputCls}`}
            />
            <input
              type="text"
              required
              value={empPhone}
              onChange={(e) => setEmpPhone(e.target.value)}
              placeholder="Mobile Number"
              className={`border rounded-lg px-2.5 py-2 ${inputCls}`}
            />
            <input
              type="email"
              value={empEmail}
              onChange={(e) => setEmpEmail(e.target.value)}
              placeholder="Email Address"
              className={`border rounded-lg px-2.5 py-2 ${inputCls}`}
            />
            <input
              type="text"
              value={empDept}
              onChange={(e) => setEmpDept(e.target.value)}
              placeholder="Department"
              className={`border rounded-lg px-2.5 py-2 ${inputCls}`}
            />
            <input
              type="text"
              value={empDesig}
              onChange={(e) => setEmpDesig(e.target.value)}
              placeholder="Designation"
              className={`border rounded-lg px-2.5 py-2 ${inputCls}`}
            />
            <input
              type="number"
              min="0"
              value={empSalary}
              onChange={(e) => setEmpSalary(e.target.value)}
              placeholder="Monthly Salary (৳)"
              className={`border rounded-lg px-2.5 py-2 ${inputCls}`}
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="px-4 py-2 rounded-lg bg-[#F85606] text-white text-xs font-bold cursor-pointer"
          >
            + কর্মচারী প্রোফাইল যুক্ত করুন
          </button>
        </form>

        <div className={`rounded-xl border p-4 overflow-x-auto ${cardCls}`}>
          <h3 className="text-sm font-extrabold mb-3">Staff Attendance, Leave &amp; Payroll Directory</h3>
          <table className="w-full text-xs text-left">
            <thead>
              <tr className={`border-b ${subTextCls}`}>
                <th className="py-2 pr-3">Name</th>
                <th className="py-2 pr-3">Dept / Role</th>
                <th className="py-2 pr-3">Salary</th>
                <th className="py-2 pr-3">Present / Leave</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id} className="border-b border-black/5">
                  <td className="py-2.5 pr-3">
                    <p className="font-bold">{emp.name}</p>
                    <p className={`text-[11px] font-mono ${subTextCls}`}>{emp.phone}</p>
                  </td>
                  <td className="py-2.5 pr-3">
                    {emp.department} · {emp.designation}
                  </td>
                  <td className="py-2.5 pr-3 font-mono font-bold">৳{emp.salary.toLocaleString()}</td>
                  <td className="py-2.5 pr-3 font-mono">
                    {emp.attendanceDays}d / {emp.leaveDays}d
                  </td>
                  <td className="py-2.5 pr-3">
                    <span className="px-2 py-0.5 rounded bg-[#ECFDF5] text-[#047857] text-[10px] font-bold">
                      {emp.status}
                    </span>
                  </td>
                  <td className="py-2.5 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        void saveEmployeeToFirestore({
                          ...emp,
                          attendanceDays: emp.attendanceDays + 1,
                        }).then(() => onNotify(`${emp.name} আজকের হাজিরা যুক্ত হয়েছে!`))
                      }
                      className="px-2 py-1 rounded bg-[#EFF6FF] text-[#1D4ED8] text-[10px] font-bold cursor-pointer"
                    >
                      +1 Present
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteEmployeeFromFirestore(emp.id)}
                      className="p-1 text-[#DC2626] cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {employees.length === 0 && (
                <tr>
                  <td colSpan={6} className={`py-4 text-center ${subTextCls}`}>
                    কোনো কর্মচারী প্রোফাইল এখনো যুক্ত হয়নি।
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // -------- Mode: 10-Role RBAC & Permissions --------
  if (mode === 'rbac') {
    const togglePerm = (perm: RbacPermission) => {
      setNewPerms((prev) =>
        prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
      );
    };

    const handleRoleSelect = (role: AdminRoleName) => {
      setNewRole(role);
      setNewPerms(DEFAULT_ROLE_PERMISSIONS[role] ?? ['view']);
    };

    const handleAddStaffAdmin = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newUid.trim() || !newEmail.trim()) return;
      setBusy(true);
      try {
        await addAdminUserToFirestore(
          newUid.trim(),
          newEmail.trim(),
          newName.trim() || newEmail.split('@')[0],
          firebaseUser.uid,
          newRole,
          newPerms,
          newBranch
        );
        await recordAdminAuditLog(firebaseUser, 'ASSIGN_RBAC_ROLE', newUid, `${newRole}: ${newPerms.join(',')}`);
        setNewUid('');
        setNewEmail('');
        setNewName('');
        onNotify(`${newRole} অ্যাক্সেস ও পারমিশন যুক্ত হয়েছে!`);
      } finally {
        setBusy(false);
      }
    };

    return (
      <div className="space-y-6">
        <div className={`rounded-xl border p-4 ${cardCls}`}>
          <h2 className="text-lg font-extrabold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#F85606]" />
            <span>10-Role RBAC Permissions &amp; Multi-Admin Registry</span>
          </h2>
          <p className={`text-xs mt-1 ${subTextCls}`}>
            Primary Super Admin: <span className="font-mono font-bold">{BOOTSTRAPPED_ADMIN_EMAIL}</span> ·
            Your UID: <span className="font-mono font-bold">{firebaseUser.uid}</span>
          </p>
        </div>

        <form onSubmit={handleAddStaffAdmin} className={`rounded-xl border p-4 space-y-4 ${cardCls}`}>
          <h3 className="text-sm font-extrabold flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-[#047857]" /> Assign Staff Role &amp; Granular Permissions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-xs">
            <input
              type="text"
              required
              value={newUid}
              onChange={(e) => setNewUid(e.target.value)}
              placeholder="Firebase User UID"
              className={`border rounded-lg px-2.5 py-2 font-mono ${inputCls}`}
            />
            <input
              type="email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Google Email"
              className={`border rounded-lg px-2.5 py-2 ${inputCls}`}
            />
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Full Name"
              className={`border rounded-lg px-2.5 py-2 ${inputCls}`}
            />
            <select
              value={newRole}
              onChange={(e) => handleRoleSelect(e.target.value as AdminRoleName)}
              className={`border rounded-lg px-2.5 py-2 font-bold ${inputCls}`}
            >
              {ADMIN_ROLE_LIST.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={newBranch}
              onChange={(e) => setNewBranch(e.target.value)}
              placeholder="Branch Code (e.g. DHK-01)"
              className={`border rounded-lg px-2.5 py-2 font-mono ${inputCls}`}
            />
          </div>

          <div>
            <p className={`text-[11px] font-bold uppercase mb-2 ${subTextCls}`}>
              Permission Matrix ({newPerms.length} selected):
            </p>
            <div className="flex flex-wrap gap-2">
              {RBAC_PERMISSIONS_LIST.map((perm) => {
                const checked = newPerms.includes(perm);
                return (
                  <button
                    key={perm}
                    type="button"
                    onClick={() => togglePerm(perm)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                      checked
                        ? 'bg-[#047857] text-white border-[#047857]'
                        : 'border-black/15 opacity-75'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" /> {perm.toUpperCase()}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="px-4 py-2 rounded-lg bg-[#F85606] text-white text-xs font-bold cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Assign Role &amp; Save Staff
          </button>
        </form>

        <div className={`rounded-xl border p-4 space-y-2.5 ${cardCls}`}>
          <h3 className="text-sm font-extrabold">Authorized Staff &amp; Role Assignments ({adminUsers.length})</h3>
          {adminUsers.map((au) => (
            <div
              key={au.uid}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg border border-black/10 text-xs"
            >
              <div>
                <p className="font-bold">
                  {au.name}{' '}
                  <span className="ml-1 px-2 py-0.5 rounded bg-[#FFF7ED] text-[#C2410C] text-[10px] font-extrabold">
                    {au.role || 'Admin'}
                  </span>
                  {au.branchId && (
                    <span className="ml-1 font-mono text-[10px] opacity-75">[{au.branchId}]</span>
                  )}
                </p>
                <p className={`text-[11px] font-mono ${subTextCls}`}>
                  {au.email} · UID: {au.uid}
                </p>
                <p className="text-[10px] mt-1 font-mono text-[#047857]">
                  Permissions: {(au.permissions ?? DEFAULT_ROLE_PERMISSIONS.Manager).join(', ')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={au.role || 'Manager'}
                  onChange={(e) => {
                    const nextRole = e.target.value as AdminRoleName;
                    void updateAdminUserRbacInFirestore(
                      au.uid,
                      nextRole,
                      DEFAULT_ROLE_PERMISSIONS[nextRole]
                    ).then(() => onNotify(`${au.name} রোল আপডেট হয়েছে: ${nextRole}`));
                  }}
                  className={`border rounded px-2 py-1 text-[11px] font-bold ${inputCls}`}
                >
                  {ADMIN_ROLE_LIST.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => void removeAdminUserFromFirestore(au.uid)}
                  className="p-1.5 text-[#DC2626] hover:bg-[#FEF2F2] rounded cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // -------- Mode: System (Notifications, Backup/Restore, Maintenance, Audit Logs) --------
  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Record<string, unknown>;
      const res = await fetch('/api/backup/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        counts?: { products: number; vouchers: number; suppliers: number; warehouses: number; cmsPages: number };
        snapshot?: {
          products: Product[];
          vouchers: VoucherRecord[];
          suppliers: SupplierRecord[];
          warehouses: WarehouseRecord[];
          cmsPages: CmsPageRecord[];
        };
      };
      if (!res.ok || !json.ok || !json.snapshot) {
        onNotify(json.error || 'ব্যাকআপ ফাইল যাচাই করা যায়নি।');
        return;
      }

      for (const p of json.snapshot.products) await saveProductToFirestore(p);
      for (const v of json.snapshot.vouchers) await saveVoucherToFirestore(v);
      for (const s of json.snapshot.suppliers) await saveSupplierToFirestore(s);
      for (const w of json.snapshot.warehouses) await saveWarehouseToFirestore(w);
      for (const c of json.snapshot.cmsPages) await saveCmsPageToFirestore(c);

      await recordAdminAuditLog(firebaseUser, 'RESTORE_BACKUP', 'database', JSON.stringify(json.counts));
      setRestoreStatus(
        `Restored: ${json.counts?.products ?? 0} Products, ${json.counts?.vouchers ?? 0} Vouchers, ${json.counts?.suppliers ?? 0} Suppliers.`
      );
      onNotify('ব্যাকআপ থেকে ডাটাবেজ পুনরুদ্ধার সম্পন্ন হয়েছে!');
    } catch {
      onNotify('সঠিক JSON ব্যাকআপ ফাইল আপলোড করুন।');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Maintenance Mode & Backup/Restore */}
        <div className={`rounded-xl border p-4 space-y-4 ${cardCls}`}>
          <h3 className="text-sm font-extrabold">Backup, Restore &amp; Storefront Maintenance</h3>
          <div className="flex items-center justify-between p-3 rounded-lg border border-black/10 text-xs">
            <div>
              <p className="font-bold">Maintenance Mode (রক্ষণাবেক্ষণ মোড)</p>
              <p className={subTextCls}>
                চালু থাকলে স্টোরফ্রন্টে রক্ষণাবেক্ষণ নোটিশ দেখাবে (অ্যাডমিন প্যানেল খোলা থাকবে)
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                void saveStoreSettingsToFirestore(
                  { ...storeSettings, maintenanceMode: !storeSettings.maintenanceMode },
                  firebaseUser.uid
                ).then(() =>
                  onNotify(
                    !storeSettings.maintenanceMode
                      ? 'Maintenance Mode চালু হয়েছে।'
                      : 'Maintenance Mode বন্ধ হয়েছে।'
                  )
                )
              }
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer ${
                storeSettings.maintenanceMode
                  ? 'bg-[#DC2626] text-white'
                  : 'bg-[#ECFDF5] text-[#047857]'
              }`}
            >
              {storeSettings.maintenanceMode ? 'ACTIVE' : 'OFF (Live)'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <button
              type="button"
              onClick={() => void onExportBackup()}
              className="py-2.5 px-3 rounded-lg bg-[#1D4ED8] text-white font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" /> Export Full JSON Backup
            </button>
            <label className="py-2.5 px-3 rounded-lg bg-[#047857] text-white font-bold flex items-center justify-center gap-1.5 cursor-pointer">
              <Upload className="w-4 h-4" /> Restore from JSON
              <input
                type="file"
                accept=".json,application/json"
                onChange={(e) => void handleRestoreFile(e)}
                disabled={busy}
                className="hidden"
              />
            </label>
          </div>
          <p className={`text-[11px] ${subTextCls}`}>
            Current Store Items: {products.length} Products · {vouchers.length} Vouchers ·{' '}
            {suppliers.length} Suppliers · {warehouses.length} Warehouses
          </p>
          {restoreStatus && (
            <div className="p-2.5 rounded bg-[#ECFDF5] text-[#047857] text-xs font-bold">
              {restoreStatus}
            </div>
          )}
        </div>

        {/* Real-time Admin Notifications */}
        <div className={`rounded-xl border p-4 space-y-3 ${cardCls}`}>
          <h3 className="text-sm font-extrabold flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#F85606]" /> Admin Alert Center ({adminNotifications.length})
          </h3>
          <div className="space-y-2 max-h-56 overflow-y-auto text-xs">
            {adminNotifications.map((n) => (
              <div
                key={n.id}
                className={`p-2.5 rounded-lg border flex items-start justify-between gap-2 ${
                  n.read ? 'border-black/10 opacity-75' : 'border-[#F85606]/40 bg-[#FFF7ED]/40'
                }`}
              >
                <div>
                  <p className="font-bold">
                    {n.title}{' '}
                    <span className="font-mono text-[10px] opacity-70">{n.createdAtText}</span>
                  </p>
                  <p className={subTextCls}>{n.message}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!n.read && (
                    <button
                      type="button"
                      onClick={() => void markAdminNotificationRead(n.id)}
                      className="px-2 py-0.5 rounded bg-[#047857] text-white text-[10px] font-bold cursor-pointer"
                    >
                      Mark Read
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => void deleteAdminNotification(n.id)}
                    className="p-1 text-[#DC2626] cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {adminNotifications.length === 0 && (
              <p className={`text-xs text-center py-6 ${subTextCls}`}>কোনো নতুন নোটিফিকেশন নেই।</p>
            )}
          </div>
        </div>
      </div>

      {/* Security Audit Logs */}
      <div className={`rounded-xl border p-4 ${cardCls}`}>
        <h3 className="text-sm font-extrabold mb-3">Security &amp; Activity Audit Trail ({auditLogs.length})</h3>
        <div className="overflow-x-auto max-h-72 overflow-y-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className={`border-b ${subTextCls}`}>
                <th className="py-2 pr-3">Time</th>
                <th className="py-2 pr-3">Actor</th>
                <th className="py-2 pr-3">Action</th>
                <th className="py-2 pr-3">Target</th>
                <th className="py-2">Details</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.id} className="border-b border-black/5">
                  <td className="py-2 pr-3 font-mono text-[11px]">{log.createdAtText}</td>
                  <td className="py-2 pr-3">{log.actorEmail}</td>
                  <td className="py-2 pr-3 font-mono font-bold text-[#1D4ED8]">{log.action}</td>
                  <td className="py-2 pr-3 font-mono">{log.target}</td>
                  <td className="py-2">{log.details || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
