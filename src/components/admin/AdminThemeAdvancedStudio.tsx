import { useRef, type ChangeEvent } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Code2,
  Download,
  Eye,
  EyeOff,
  Layers,
  Megaphone,
  RotateCcw,
  ShieldCheck,
  Sliders,
  Sparkles,
  Upload,
} from 'lucide-react';
import {
  ADVANCED_PRO_THEMES,
  DEFAULT_THEME_ADVANCED,
} from '../../data/templates';
import type {
  ShopifyThemeAdvancedConfig,
  ShopifyThemeSectionConfig,
  StoreSettings,
} from '../../types';

interface AdminThemeAdvancedStudioProps {
  darkMode: boolean;
  settingsDraft: StoreSettings;
  themeAdvanced: ShopifyThemeAdvancedConfig;
  onChangeSettingsDraft: (updater: (prev: StoreSettings) => StoreSettings) => void;
  onChangeThemeAdvanced: (next: ShopifyThemeAdvancedConfig) => void;
  onNotify: (msg: string) => void;
}

function parseHexToRgb(hex: string): [number, number, number] {
  const clean = (hex || '').trim().replace('#', '');
  if (/^[0-9a-fA-F]{3}$/.test(clean)) {
    return [
      parseInt(clean[0] + clean[0], 16),
      parseInt(clean[1] + clean[1], 16),
      parseInt(clean[2] + clean[2], 16),
    ];
  }
  if (/^[0-9a-fA-F]{6}$/.test(clean)) {
    return [
      parseInt(clean.slice(0, 2), 16),
      parseInt(clean.slice(2, 4), 16),
      parseInt(clean.slice(4, 6), 16),
    ];
  }
  return [248, 86, 6];
}

function getRelativeLuminance(hex: string): number {
  const [r, g, b] = parseHexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function getContrastRatio(hexA: string, hexB: string): number {
  const l1 = getRelativeLuminance(hexA);
  const l2 = getRelativeLuminance(hexB);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function getContrastBadge(ratio: number): {
  label: string;
  cls: string;
} {
  if (ratio >= 4.5) {
    return {
      label: `${ratio.toFixed(2)}:1 · WCAG AA Pass`,
      cls: 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]',
    };
  }
  if (ratio >= 3.0) {
    return {
      label: `${ratio.toFixed(2)}:1 · Large Text AA`,
      cls: 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]',
    };
  }
  return {
    label: `${ratio.toFixed(2)}:1 · Low Contrast`,
    cls: 'bg-[#FEF2F2] text-[#B91C1C] border-[#FCA5A5]',
  };
}

export function normalizeThemeSections(
  sections?: ShopifyThemeSectionConfig[]
): ShopifyThemeSectionConfig[] {
  const source = Array.isArray(sections) && sections.length > 0 ? sections : [];
  const byId = new Map(source.map((s) => [s.id, s]));
  const ordered: ShopifyThemeSectionConfig[] = [];

  for (const item of source) {
    const def = DEFAULT_THEME_ADVANCED.sections.find((d) => d.id === item.id);
    if (def && !ordered.some((o) => o.id === item.id)) {
      ordered.push({
        id: def.id,
        label: item.label || def.label,
        enabled: typeof item.enabled === 'boolean' ? item.enabled : def.enabled,
      });
    }
  }
  for (const def of DEFAULT_THEME_ADVANCED.sections) {
    if (!byId.has(def.id)) {
      ordered.push({ ...def });
    }
  }
  return ordered;
}

const CSS_SNIPPETS = [
  {
    label: '+ Card Hover Lift',
    css: '.theme-surface-card { transition: transform 180ms ease, box-shadow 180ms ease; }\n.theme-surface-card:hover { transform: translateY(-2px); }',
  },
  {
    label: '+ Editorial Headings',
    css: '#just-for-you-feed h2, #categories-section h2, #all-organic-catalog h2 { letter-spacing: -0.02em; }',
  },
  {
    label: '+ Hide News Strip',
    css: '#gallery-section { margin-top: 8px; }',
  },
];

export function AdminThemeAdvancedStudio({
  darkMode,
  settingsDraft,
  themeAdvanced,
  onChangeSettingsDraft,
  onChangeThemeAdvanced,
  onNotify,
}: AdminThemeAdvancedStudioProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const cardCls = darkMode
    ? 'bg-[#111827] border-[#1F2937] text-slate-100'
    : 'bg-white border-black/10 text-[#111827]';
  const subTextCls = darkMode ? 'text-slate-400' : 'text-[#616161]';
  const inputCls = darkMode
    ? 'bg-[#1F2937] border-[#374151] text-white'
    : 'bg-white border-black/15 text-[#111827]';

  const normalizedSections = normalizeThemeSections(themeAdvanced.sections);

  const primaryColor = settingsDraft.primaryColor || '#F85606';
  const secondaryColor = settingsDraft.secondaryColor || '#212121';
  const backgroundColor = settingsDraft.backgroundColor || '#F5F5F5';

  const ctaContrast = getContrastRatio(primaryColor, '#FFFFFF');
  const inkCanvasContrast = getContrastRatio(secondaryColor, backgroundColor);
  const surfaceBg =
    themeAdvanced.surfaceMode === 'dark-slate'
      ? '#171B26'
      : themeAdvanced.surfaceMode === 'warm-ivory'
        ? '#FFFDF8'
        : '#FFFFFF';
  const surfaceInk =
    themeAdvanced.surfaceMode === 'dark-slate'
      ? '#F1F5F9'
      : themeAdvanced.surfaceMode === 'warm-ivory'
        ? '#292018'
        : '#212121';
  const surfaceContrast = getContrastRatio(surfaceInk, surfaceBg);

  const ctaBadge = getContrastBadge(ctaContrast);
  const inkBadge = getContrastBadge(inkCanvasContrast);
  const surfaceBadge = getContrastBadge(surfaceContrast);

  const updateToken = <K extends keyof ShopifyThemeAdvancedConfig>(
    key: K,
    value: ShopifyThemeAdvancedConfig[K]
  ) => {
    onChangeThemeAdvanced({
      ...themeAdvanced,
      sections: normalizedSections,
      [key]: value,
    });
  };

  const moveSection = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= normalizedSections.length) return;
    const next = [...normalizedSections];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    updateToken('sections', next);
  };

  const toggleSection = (id: ShopifyThemeSectionConfig['id']) => {
    const next = normalizedSections.map((sec) =>
      sec.id === id ? { ...sec, enabled: !sec.enabled } : sec
    );
    updateToken('sections', next);
  };

  const handleExportThemeJson = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      schema: 'ku-online-store-2.0-theme',
      storeTheme: {
        websiteTemplate: settingsDraft.websiteTemplate ?? 'daraz-mall',
        heroStyle: settingsDraft.heroStyle ?? 'classic-mega',
        headerStyle: settingsDraft.headerStyle ?? 'solid-white',
        categoryStyle: settingsDraft.categoryStyle ?? 'grid-cards',
        productCardDesign: settingsDraft.productCardDesign ?? 'classic-mall',
        footerStyle: settingsDraft.footerStyle ?? 'daraz-3tier',
        themePreset: settingsDraft.themePreset ?? 'daraz-orange',
        fontStyle: settingsDraft.fontStyle ?? 'plus-jakarta',
        primaryColor,
        secondaryColor,
        accentColor: settingsDraft.accentColor || '#047857',
        backgroundColor,
      },
      themeAdvanced: {
        ...themeAdvanced,
        sections: normalizedSections,
      },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `theme-preset-${settingsDraft.websiteTemplate ?? 'store'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onNotify('Theme JSON কনফিগারেশন ডাউনলোড হয়েছে!');
  };

  const handleImportThemeJson = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || '{}')) as {
          storeTheme?: Partial<StoreSettings>;
          themeAdvanced?: Partial<ShopifyThemeAdvancedConfig>;
        };
        if (parsed.storeTheme && typeof parsed.storeTheme === 'object') {
          onChangeSettingsDraft((prev) => ({
            ...prev,
            ...parsed.storeTheme,
          }));
        }
        if (parsed.themeAdvanced && typeof parsed.themeAdvanced === 'object') {
          onChangeThemeAdvanced({
            ...DEFAULT_THEME_ADVANCED,
            ...parsed.themeAdvanced,
            sections: normalizeThemeSections(parsed.themeAdvanced.sections),
          });
        }
        onNotify('Theme JSON ইমপোর্ট সম্পন্ন! লাইভ করতে "Publish Theme Live" চাপুন।');
      } catch {
        onNotify('সঠিক Theme JSON ফাইল সিলেক্ট করুন।');
      } finally {
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-5">
      {/* A. 4 One-Click Pro Design Systems */}
      <div className={`rounded-xl border p-4 sm:p-5 space-y-4 ${cardCls}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-extrabold flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#F85606]" />
              <span>Online Store 2.0 Pro Design Systems</span>
            </h3>
            <p className={`text-[11px] mt-0.5 ${subTextCls}`}>
              প্রতিটি প্রো সিস্টেমে লেআউট, কালার থিম, কার্ড শ্যাডো, রেডিয়াস ও সারফেস মোড এক ক্লিকে সমন্বয় হয়।
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              onChangeThemeAdvanced({ ...DEFAULT_THEME_ADVANCED });
              onNotify('প্রো ডিজাইন টোকেন ডিফল্টে রিসেট হয়েছে।');
            }}
            className="h-8 px-3 rounded-lg border border-black/15 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Pro Tokens</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ADVANCED_PRO_THEMES.map((sys) => {
            const active =
              (settingsDraft.websiteTemplate ?? 'daraz-mall') === sys.websiteTemplate &&
              themeAdvanced.surfaceMode === (sys.advanced.surfaceMode ?? 'light') &&
              themeAdvanced.buttonRadius === (sys.advanced.buttonRadius ?? 'rounded') &&
              themeAdvanced.gridColsDesktop === (sys.advanced.gridColsDesktop ?? 4);

            return (
              <div
                key={sys.id}
                className={`rounded-xl border p-3.5 flex flex-col justify-between gap-3 transition-all ${
                  active
                    ? 'border-[#F85606] ring-2 ring-[#F85606]/25 bg-[#FFF5EC]/20'
                    : 'border-black/15 hover:border-black/35'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-extrabold">{sys.name}</p>
                      <p className={`text-[11px] mt-0.5 ${subTextCls}`}>{sys.subtitle}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-[#EFF6FF] text-[#1D4ED8] text-[10px] font-bold shrink-0 whitespace-nowrap">
                      {sys.badge}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                    <span
                      className="w-4 h-4 rounded-full border border-white shadow-xs"
                      style={{ backgroundColor: sys.primaryColor }}
                    />
                    <span
                      className="w-4 h-4 rounded-full border border-white shadow-xs"
                      style={{ backgroundColor: sys.backgroundColor }}
                    />
                    <span className={`ml-1 ${subTextCls}`}>
                      {sys.advanced.surfaceMode} · {sys.advanced.gridColsDesktop}-col · {sys.advanced.buttonRadius}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onChangeSettingsDraft((prev) => ({
                      ...prev,
                      websiteTemplate: sys.websiteTemplate,
                      heroStyle: sys.heroStyle,
                      headerStyle: sys.headerStyle,
                      categoryStyle: sys.categoryStyle,
                      productCardDesign: sys.productCardDesign,
                      footerStyle: sys.footerStyle,
                      themePreset: sys.themePreset,
                      fontStyle: sys.fontStyle,
                      primaryColor: sys.primaryColor,
                      secondaryColor: sys.secondaryColor,
                      accentColor: sys.accentColor,
                      backgroundColor: sys.backgroundColor,
                    }));
                    onChangeThemeAdvanced({
                      ...DEFAULT_THEME_ADVANCED,
                      ...themeAdvanced,
                      sections: normalizedSections,
                      ...sys.advanced,
                    });
                    onNotify(`"${sys.name}" প্রো ডিজাইন সিস্টেম প্রয়োগ হয়েছে!`);
                  }}
                  className={`w-full py-2 rounded-lg text-xs font-extrabold cursor-pointer transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-[#047857] text-white'
                      : 'bg-[#F85606] hover:bg-[#D94802] text-white'
                  }`}
                >
                  {active ? '✓ Active Pro System' : 'Apply Pro System'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* B. WCAG Contrast Accessibility Auditor */}
      <div className={`rounded-xl border p-4 sm:p-5 space-y-3 ${cardCls}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-extrabold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#047857]" />
            <span>WCAG 2.1 Color Contrast Accessibility Checker</span>
          </h3>
          <span className={`text-[11px] ${subTextCls}`}>
            বাটন ও টেক্সটের পড়ার যোগ্যতা (Minimum 4.5:1 recommended)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="rounded-lg border border-black/10 p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold">Primary CTA on White</span>
              <span
                className="px-2 py-0.5 rounded font-bold text-[10px]"
                style={{ backgroundColor: primaryColor, color: '#FFFFFF' }}
              >
                Buy Now
              </span>
            </div>
            <span className={`inline-block px-2 py-0.5 rounded border text-[11px] font-bold ${ctaBadge.cls}`}>
              {ctaBadge.label}
            </span>
          </div>

          <div className="rounded-lg border border-black/10 p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold">Ink vs Page Canvas</span>
              <span
                className="px-2 py-0.5 rounded border border-black/15 font-bold text-[10px]"
                style={{ backgroundColor, color: secondaryColor }}
              >
                Sample Aa
              </span>
            </div>
            <span className={`inline-block px-2 py-0.5 rounded border text-[11px] font-bold ${inkBadge.cls}`}>
              {inkBadge.label}
            </span>
          </div>

          <div className="rounded-lg border border-black/10 p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold">Card Surface Readability</span>
              <span
                className="px-2 py-0.5 rounded border border-black/15 font-bold text-[10px]"
                style={{ backgroundColor: surfaceBg, color: surfaceInk }}
              >
                ৳450 Card
              </span>
            </div>
            <span className={`inline-block px-2 py-0.5 rounded border text-[11px] font-bold ${surfaceBadge.cls}`}>
              {surfaceBadge.label}
            </span>
          </div>
        </div>
      </div>

      {/* C. Granular Design Token Studio */}
      <div className={`rounded-xl border p-4 sm:p-5 space-y-4 ${cardCls}`}>
        <h3 className="text-sm font-extrabold flex items-center gap-1.5">
          <Sliders className="w-4 h-4 text-[#F85606]" />
          <span>Design Token Studio (Surface, Radius, Grid &amp; Typography)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          {/* Surface Mode */}
          <div className="space-y-1.5">
            <span className="font-bold block">Storefront Surface Mode</span>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { id: 'light', label: 'Pure Light' },
                  { id: 'warm-ivory', label: 'Warm Ivory' },
                  { id: 'dark-slate', label: 'Dark Slate' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => updateToken('surfaceMode', opt.id)}
                  className={`py-2 px-2 rounded-lg border font-bold cursor-pointer whitespace-nowrap ${
                    themeAdvanced.surfaceMode === opt.id
                      ? 'bg-[#F85606] text-white border-[#F85606]'
                      : 'border-black/15 hover:border-black/35'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Button Radius */}
          <div className="space-y-1.5">
            <span className="font-bold block">Button Shape Radius</span>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { id: 'sharp', label: 'Sharp 4px' },
                  { id: 'rounded', label: 'Soft 10px' },
                  { id: 'pill', label: 'Pill Full' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => updateToken('buttonRadius', opt.id)}
                  className={`py-2 px-2 rounded-lg border font-bold cursor-pointer whitespace-nowrap ${
                    themeAdvanced.buttonRadius === opt.id
                      ? 'bg-[#F85606] text-white border-[#F85606]'
                      : 'border-black/15 hover:border-black/35'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Card Radius */}
          <div className="space-y-1.5">
            <span className="font-bold block">Product Card Corner Radius</span>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { id: 'sharp', label: 'Sharp 6px' },
                  { id: 'soft', label: 'Soft 12px' },
                  { id: 'curvy', label: 'Curvy 20px' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => updateToken('cardRadius', opt.id)}
                  className={`py-2 px-2 rounded-lg border font-bold cursor-pointer whitespace-nowrap ${
                    themeAdvanced.cardRadius === opt.id
                      ? 'bg-[#F85606] text-white border-[#F85606]'
                      : 'border-black/15 hover:border-black/35'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Card Elevation */}
          <div className="space-y-1.5">
            <span className="font-bold block">Card Elevation &amp; Depth</span>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { id: 'flat', label: 'Flat Zero' },
                  { id: 'hairline', label: '1px Crisp' },
                  { id: 'elevated', label: 'Soft Depth' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => updateToken('cardElevation', opt.id)}
                  className={`py-2 px-2 rounded-lg border font-bold cursor-pointer whitespace-nowrap ${
                    themeAdvanced.cardElevation === opt.id
                      ? 'bg-[#F85606] text-white border-[#F85606]'
                      : 'border-black/15 hover:border-black/35'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Container Width */}
          <div className="space-y-1.5">
            <span className="font-bold block">Desktop Container Width</span>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { id: 'standard', label: '1240px' },
                  { id: 'wide', label: '1380px' },
                  { id: 'full', label: '1520px' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => updateToken('containerWidth', opt.id)}
                  className={`py-2 px-2 rounded-lg border font-bold cursor-pointer whitespace-nowrap ${
                    themeAdvanced.containerWidth === opt.id
                      ? 'bg-[#F85606] text-white border-[#F85606]'
                      : 'border-black/15 hover:border-black/35'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Catalog Columns */}
          <div className="space-y-1.5">
            <span className="font-bold block">Catalog Desktop Grid Columns</span>
            <div className="grid grid-cols-3 gap-1.5">
              {([3, 4, 5] as const).map((cols) => (
                <button
                  key={cols}
                  type="button"
                  onClick={() => updateToken('gridColsDesktop', cols)}
                  className={`py-2 px-2 rounded-lg border font-bold cursor-pointer whitespace-nowrap ${
                    themeAdvanced.gridColsDesktop === cols
                      ? 'bg-[#F85606] text-white border-[#F85606]'
                      : 'border-black/15 hover:border-black/35'
                  }`}
                >
                  {cols} Columns
                </button>
              ))}
            </div>
          </div>

          {/* Grid Gap */}
          <div className="space-y-1.5">
            <span className="font-bold block">Catalog Grid Spacing</span>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { id: 'compact', label: 'Compact' },
                  { id: 'comfortable', label: 'Normal' },
                  { id: 'airy', label: 'Airy' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => updateToken('gridGap', opt.id)}
                  className={`py-2 px-2 rounded-lg border font-bold cursor-pointer whitespace-nowrap ${
                    themeAdvanced.gridGap === opt.id
                      ? 'bg-[#F85606] text-white border-[#F85606]'
                      : 'border-black/15 hover:border-black/35'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Body Scale */}
          <div className="space-y-1.5">
            <span className="font-bold block">Typography Scale</span>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { id: 'compact', label: 'Compact' },
                  { id: 'standard', label: 'Standard' },
                  { id: 'large', label: 'Large' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => updateToken('bodyFontScale', opt.id)}
                  className={`py-2 px-2 rounded-lg border font-bold cursor-pointer whitespace-nowrap ${
                    themeAdvanced.bodyFontScale === opt.id
                      ? 'bg-[#F85606] text-white border-[#F85606]'
                      : 'border-black/15 hover:border-black/35'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Heading Weight */}
          <div className="space-y-1.5">
            <span className="font-bold block">Heading Font Weight</span>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { id: '700', label: '700 Bold' },
                  { id: '800', label: '800 Extra' },
                  { id: '900', label: '900 Black' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => updateToken('headingWeight', opt.id)}
                  className={`py-2 px-2 rounded-lg border font-bold cursor-pointer whitespace-nowrap ${
                    themeAdvanced.headingWeight === opt.id
                      ? 'bg-[#F85606] text-white border-[#F85606]'
                      : 'border-black/15 hover:border-black/35'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* D. Top Announcement Bar Studio */}
      <div className={`rounded-xl border p-4 sm:p-5 space-y-3 ${cardCls}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-extrabold flex items-center gap-1.5">
            <Megaphone className="w-4 h-4 text-[#F85606]" />
            <span>Top Storefront Announcement Strip</span>
          </h3>
          <label className="inline-flex items-center gap-2 text-xs font-bold cursor-pointer">
            <input
              type="checkbox"
              checked={themeAdvanced.announcementBarEnabled}
              onChange={(e) => updateToken('announcementBarEnabled', e.target.checked)}
              className="accent-[#F85606]"
            />
            <span>অ্যানাউন্সমেন্ট বার চালু করুন</span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
          <label className="md:col-span-8 space-y-1">
            <span className="font-bold block">Announcement Message</span>
            <input
              type="text"
              value={themeAdvanced.announcementBarText}
              onChange={(e) => updateToken('announcementBarText', e.target.value)}
              placeholder="ফ্রি ডেলিভারি বা ক্যাম্পেইন বার্তা লিখুন..."
              className={`w-full h-9 px-3 rounded-lg border ${inputCls}`}
            />
          </label>
          <div className="md:col-span-4 space-y-1">
            <span className="font-bold block">Strip Theme</span>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { id: 'brand', label: 'Brand' },
                  { id: 'dark', label: 'Dark' },
                  { id: 'emerald', label: 'Emerald' },
                ] as const
              ).map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => updateToken('announcementBarStyle', st.id)}
                  className={`h-9 rounded-lg border font-bold cursor-pointer whitespace-nowrap ${
                    themeAdvanced.announcementBarStyle === st.id
                      ? 'bg-[#F85606] text-white border-[#F85606]'
                      : 'border-black/15 hover:border-black/35'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* E. Homepage Section Order & Visibility Builder */}
      <div className={`rounded-xl border p-4 sm:p-5 space-y-3 ${cardCls}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-extrabold flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[#F85606]" />
              <span>Homepage Section Order &amp; Visibility Builder</span>
            </h3>
            <p className={`text-[11px] mt-0.5 ${subTextCls}`}>
              স্টোরের হোমপেজের প্রতিটি সেকশনের ক্রম উপরে-নিচে সাজান অথবা প্রয়োজনমতো হাইড করুন।
            </p>
          </div>
          <button
            type="button"
            onClick={() => updateToken('sections', DEFAULT_THEME_ADVANCED.sections)}
            className="h-8 px-3 rounded-lg border border-black/15 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Section Order</span>
          </button>
        </div>

        <div className="space-y-1.5">
          {normalizedSections.map((sec, idx) => (
            <div
              key={sec.id}
              className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-xs ${
                sec.enabled
                  ? 'border-black/15'
                  : 'border-dashed border-black/15 opacity-60'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-6 h-6 rounded-md bg-black/5 flex items-center justify-center font-mono text-[11px] font-bold shrink-0">
                  {idx + 1}
                </span>
                <span className="font-bold truncate">{sec.label}</span>
                <span className={`text-[10px] font-mono hidden sm:inline ${subTextCls}`}>
                  #{sec.id}
                </span>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => moveSection(idx, -1)}
                  aria-label={`Move ${sec.label} up`}
                  className="p-1.5 rounded-md border border-black/15 hover:border-[#F85606] disabled:opacity-35 cursor-pointer"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={idx === normalizedSections.length - 1}
                  onClick={() => moveSection(idx, 1)}
                  aria-label={`Move ${sec.label} down`}
                  className="p-1.5 rounded-md border border-black/15 hover:border-[#F85606] disabled:opacity-35 cursor-pointer"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => toggleSection(sec.id)}
                  className={`h-7 px-2.5 rounded-md border text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                    sec.enabled
                      ? 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]'
                      : 'bg-black/5 text-[#616161] border-black/15'
                  }`}
                >
                  {sec.enabled ? (
                    <>
                      <Eye className="w-3 h-3" />
                      <span>Visible</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3 h-3" />
                      <span>Hidden</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* F. Custom CSS Injection & Theme JSON Backup/Restore */}
      <div className={`rounded-xl border p-4 sm:p-5 space-y-4 ${cardCls}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-extrabold flex items-center gap-1.5">
              <Code2 className="w-4 h-4 text-[#F85606]" />
              <span>Custom Storefront CSS &amp; Theme JSON Portability</span>
            </h3>
            <p className={`text-[11px] mt-0.5 ${subTextCls}`}>
              অ্যাডভান্সড কাস্টম স্টাইল লিখুন অথবা পুরো থিম সেটআপ JSON হিসেবে এক্সপোর্ট/ইমপোর্ট করুন।
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportThemeJson}
              className="h-8 px-3 rounded-lg border border-black/15 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Theme JSON</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="h-8 px-3 rounded-lg bg-[#212121] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import Theme JSON</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleImportThemeJson}
              className="hidden"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {CSS_SNIPPETS.map((snip) => (
            <button
              key={snip.label}
              type="button"
              onClick={() =>
                updateToken(
                  'customCss',
                  themeAdvanced.customCss.trim()
                    ? `${themeAdvanced.customCss.trim()}\n${snip.css}`
                    : snip.css
                )
              }
              className="px-2.5 py-1 rounded-md border border-black/15 hover:border-[#F85606] text-[11px] font-bold cursor-pointer whitespace-nowrap"
            >
              {snip.label}
            </button>
          ))}
          {themeAdvanced.customCss.trim() && (
            <button
              type="button"
              onClick={() => updateToken('customCss', '')}
              className="px-2.5 py-1 rounded-md border border-[#FCA5A5] text-[#B91C1C] text-[11px] font-bold cursor-pointer whitespace-nowrap"
            >
              Clear CSS
            </button>
          )}
        </div>

        <textarea
          rows={4}
          value={themeAdvanced.customCss}
          onChange={(e) => updateToken('customCss', e.target.value)}
          placeholder="/* উদাহরণ: .theme-surface-card { border-width: 2px; } */"
          spellCheck={false}
          className={`w-full p-3 rounded-lg border font-mono text-xs outline-none focus:border-[#F85606] ${inputCls}`}
        />
      </div>
    </div>
  );
}
