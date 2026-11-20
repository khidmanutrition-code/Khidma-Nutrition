import React, { useState } from 'react';
import { CalendarCheck, Check, Coins, Copy, Gift, Sparkles, Trophy, X } from 'lucide-react';
import type { LoyaltyWalletRecord, MarketplaceLanguage } from '../types';

interface LoyaltyGamesModalProps {
  open: boolean;
  onClose: () => void;
  wallet: LoyaltyWalletRecord;
  onUpdateWallet: (next: LoyaltyWalletRecord) => void;
  onApplyVoucherCode: (code: string) => void;
  lang?: MarketplaceLanguage;
}

interface WheelSegment {
  label: string;
  rewardType: 'coins' | 'voucher';
  coins?: number;
  voucherCode?: string;
  color: string;
}

const WHEEL_SEGMENTS: WheelSegment[] = [
  { label: '+50 Coins', rewardType: 'coins', coins: 50, color: '#663CBC' },
  { label: 'SPIN30 (৳30)', rewardType: 'voucher', voucherCode: 'SPIN30', color: '#2563EB' },
  { label: '+100 Coins', rewardType: 'coins', coins: 100, color: '#10B981' },
  { label: 'FREEDEL', rewardType: 'voucher', voucherCode: 'FREEDEL', color: '#081149' },
  { label: '+25 Coins', rewardType: 'coins', coins: 25, color: '#7F48CD' },
  { label: 'LUCKY50 (৳50)', rewardType: 'voucher', voucherCode: 'LUCKY50', color: '#4C2A9B' },
];

export const LoyaltyGamesModal: React.FC<LoyaltyGamesModalProps> = ({
  open,
  onClose,
  wallet,
  onUpdateWallet,
  onApplyVoucherCode,
  lang = 'bn',
}) => {
  const [spinning, setSpinning] = useState(false);
  const [rotationDeg, setRotationDeg] = useState(0);
  const [spinResult, setSpinResult] = useState<string | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);

  if (!open) return null;

  const todayKey = new Date().toISOString().slice(0, 10);
  const checkedInToday = wallet.lastCheckInDate === todayKey;
  const spunToday = wallet.lastSpinDate === todayKey;

  const handleDailyCheckIn = () => {
    if (checkedInToday) return;
    const nextStreak = Math.min(30, wallet.streakDays + 1);
    const bonusCoins = 20 + Math.min(50, nextStreak * 5);
    onUpdateWallet({
      ...wallet,
      coins: wallet.coins + bonusCoins,
      streakDays: nextStreak,
      lastCheckInDate: todayKey,
    });
    setSpinResult(
      lang === 'en'
        ? `Day ${nextStreak} Check-in claimed: +${bonusCoins} Daraz Coins!`
        : `দিন ${nextStreak} চেক-ইন সম্পন্ন: +${bonusCoins} কয়েন যোগ হয়েছে!`
    );
  };

  const handleSpinWheel = () => {
    if (spinning || spunToday) return;
    setSpinning(true);
    setSpinResult(null);

    const chosenIndex = Math.floor(Math.random() * WHEEL_SEGMENTS.length);
    const segmentAngle = 360 / WHEEL_SEGMENTS.length;
    const extraTurns = 1440;
    const targetOffset = 360 - (chosenIndex * segmentAngle + segmentAngle / 2);
    const finalDeg = rotationDeg + extraTurns + targetOffset;
    setRotationDeg(finalDeg);

    window.setTimeout(() => {
      const won = WHEEL_SEGMENTS[chosenIndex];
      const nextCollected =
        won.voucherCode && !wallet.collectedVouchers.includes(won.voucherCode)
          ? [...wallet.collectedVouchers, won.voucherCode]
          : wallet.collectedVouchers;

      onUpdateWallet({
        ...wallet,
        coins: wallet.coins + (won.coins ?? 15),
        lastSpinDate: todayKey,
        collectedVouchers: nextCollected,
      });

      setSpinResult(
        won.voucherCode
          ? lang === 'en'
            ? `Congratulations! Unlocked Voucher ${won.voucherCode} + 15 Coins!`
            : `অভিনন্দন! আপনি জিতেছেন ভাউচার ${won.voucherCode} + ১৫ কয়েন!`
          : lang === 'en'
            ? `You won ${won.coins} Organic Coins!`
            : `আপনি জিতেছেন ${won.coins} অর্গানিক কয়েন!`
      );
      setSpinning(false);
    }, 3200);
  };

  const handleCopyReferral = () => {
    const shareUrl = `${window.location.origin}/?ref=${wallet.referralCode}`;
    navigator.clipboard?.writeText(shareUrl).catch(() => undefined);
    setCopiedRef(true);
    window.setTimeout(() => setCopiedRef(false), 2200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#DDDDEF] max-h-[92vh] flex flex-col">
        {/* Top Banner */}
        <div className="bg-gradient-to-r from-[#081149] via-[#4C2A9B] to-[#663CBC] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center">
              <Coins className="w-6 h-6 text-[#FEF08A]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold">
                {lang === 'en' ? 'Organic Coins & Lucky Spin Hub' : 'অর্গানিক কয়েন ও লাকি স্পিন হাব'}
              </h2>
              <p className="text-xs text-white/90">
                {lang === 'en'
                  ? `Balance: ${wallet.coins} Coins (৳${Math.floor(wallet.coins / 10)} Value) · Streak: ${wallet.streakDays}d`
                  : `ব্যালেন্স: ${wallet.coins} কয়েন (৳${Math.floor(wallet.coins / 10)} সমমূল্য) · স্ট্রিক: ${wallet.streakDays} দিন`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close coins modal"
            className="p-1.5 rounded-full hover:bg-white/20 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 bg-[#F4F7FF]">
          {spinResult && (
            <div className="p-3 rounded-xl bg-[#ECFDF5] border border-[#10B981]/30 text-[#065F46] text-xs font-bold flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#059669] shrink-0" />
              <span>{spinResult}</span>
            </div>
          )}

          {/* Daily Check-in */}
          <div className="p-4 rounded-xl bg-white border border-[#DDDDEF] flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-[#081149] flex items-center gap-1.5">
                <CalendarCheck className="w-4 h-4 text-[#663CBC]" />
                <span>{lang === 'en' ? 'Daily Check-In Streak' : 'দৈনিক চেক-ইন কয়েন'}</span>
              </h3>
              <p className="text-xs text-[#5E6484] mt-0.5">
                {lang === 'en'
                  ? 'Check in daily to earn +25 to +70 bonus coins usable on checkout.'
                  : 'প্রতিদিন চেক-ইন করে +২৫ থেকে +৭০ কয়েন জিতে নিন।'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleDailyCheckIn}
              disabled={checkedInToday}
              className="ot-gradient-btn px-4 py-2 rounded-xl text-white text-xs font-extrabold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {checkedInToday
                ? lang === 'en'
                  ? 'Claimed Today ✓'
                  : 'আজকের কয়েন সংগ্রহ হয়েছে ✓'
                : lang === 'en'
                  ? 'Claim Today +Coins'
                  : 'আজকের কয়েন নিন'}
            </button>
          </div>

          {/* Interactive SVG Spin Wheel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center bg-[#F9FAFB] p-4 rounded-xl border border-[#E5E7EB]">
            <div className="relative flex flex-col items-center">
              <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[16px] border-t-[#212121] mb-1 z-10" />
              <div
                style={{
                  transform: `rotate(${rotationDeg}deg)`,
                  transition: 'transform 3.1s cubic-bezier(0.17, 0.67, 0.14, 0.99)',
                }}
                className="w-48 h-48 rounded-full border-4 border-[#212121] shadow-lg overflow-hidden relative"
              >
                <svg viewBox="0 0 200 200" className="w-full h-full">
                  {WHEEL_SEGMENTS.map((seg, idx) => {
                    const startAngle = (idx * 60 - 90) * (Math.PI / 180);
                    const endAngle = ((idx + 1) * 60 - 90) * (Math.PI / 180);
                    const x1 = 100 + 100 * Math.cos(startAngle);
                    const y1 = 100 + 100 * Math.sin(startAngle);
                    const x2 = 100 + 100 * Math.cos(endAngle);
                    const y2 = 100 + 100 * Math.sin(endAngle);
                    const midAngle = (startAngle + endAngle) / 2;
                    const tx = 100 + 62 * Math.cos(midAngle);
                    const ty = 100 + 62 * Math.sin(midAngle);
                    return (
                      <g key={seg.label}>
                        <path
                          d={`M 100 100 L ${x1} ${y1} A 100 100 0 0 1 ${x2} ${y2} Z`}
                          fill={seg.color}
                          stroke="#ffffff"
                          strokeWidth="1.5"
                        />
                        <text
                          x={tx}
                          y={ty}
                          fill="#ffffff"
                          fontSize="8.5"
                          fontWeight="bold"
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          {seg.label}
                        </text>
                      </g>
                    );
                  })}
                  <circle cx="100" cy="100" r="18" fill="#212121" />
                </svg>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-extrabold text-[#081149] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#663CBC]" />
                <span>{lang === 'en' ? 'Spin & Win Instant Vouchers' : 'স্পিন করুন ও ভাউচার জিতুন'}</span>
              </h3>
              <p className="text-xs text-[#3C4266]">
                {lang === 'en'
                  ? '1 Free Spin every day! Win bonus coins or instant discount codes (SPIN30, LUCKY50, FREEDEL).'
                  : 'প্রতিদিন ১টি ফ্রি স্পিন! বোনাস কয়েন অথবা সরাসরি ডিসকাউন্ট ভাউচার জিতে নিন।'}
              </p>
              <button
                type="button"
                onClick={handleSpinWheel}
                disabled={spinning || spunToday}
                className="ot-gradient-btn w-full py-2.5 rounded-xl text-white text-xs font-extrabold shadow-md hover:opacity-95 disabled:opacity-50 cursor-pointer"
              >
                {spinning
                  ? lang === 'en'
                    ? 'Spinning...'
                    : 'ঘুরছে...'
                  : spunToday
                    ? lang === 'en'
                      ? 'Spin Used Today (Come Back Tomorrow)'
                      : 'আজকের স্পিন শেষ (আগামীকাল আবার)'
                    : lang === 'en'
                      ? 'SPIN THE WHEEL NOW'
                      : 'এখনই স্পিন করুন'}
              </button>
            </div>
          </div>

          {/* Collected Vouchers & Referral */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-white border border-[#DDDDEF]">
              <h4 className="text-xs font-extrabold text-[#081149] flex items-center gap-1.5 mb-2">
                <Gift className="w-4 h-4 text-[#663CBC]" />
                <span>{lang === 'en' ? 'Collected Promo Vouchers' : 'সংগৃহীত ভাউচার'}</span>
              </h4>
              {wallet.collectedVouchers.length === 0 ? (
                <p className="text-[11px] text-[#5E6484]">
                  {lang === 'en' ? 'Spin the wheel to unlock promo codes.' : 'স্পিন করে ভাউচার আনলক করুন।'}
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {wallet.collectedVouchers.map((code) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => {
                        onApplyVoucherCode(code);
                        onClose();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-[#F5F3FF] border border-[#663CBC]/35 text-[11px] font-extrabold text-[#663CBC] hover:bg-[#663CBC] hover:text-white cursor-pointer"
                    >
                      {code} · {lang === 'en' ? 'Apply' : 'ব্যবহার'}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-[#DDDDEF]">
              <h4 className="text-xs font-extrabold text-[#081149] mb-1">
                {lang === 'en' ? 'Refer & Earn 100 Coins' : 'বন্ধুকে রেফার করে ১০০ কয়েন'}
              </h4>
              <p className="text-[11px] text-[#5E6484] mb-2">
                {lang === 'en' ? `Your Referral Code: ${wallet.referralCode}` : `আপনার কোড: ${wallet.referralCode}`}
              </p>
              <button
                type="button"
                onClick={handleCopyReferral}
                className="w-full py-1.5 px-3 rounded-lg border border-[#DDDDEF] text-xs font-bold text-[#081149] hover:border-[#663CBC] hover:bg-[#F5F3FF] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copiedRef ? <Check className="w-3.5 h-3.5 text-[#00A859]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>
                  {copiedRef
                    ? lang === 'en'
                      ? 'Referral Link Copied'
                      : 'রেফার লিংক কপি হয়েছে'
                    : lang === 'en'
                      ? 'Copy Referral Link'
                      : 'রেফার লিংক কপি করুন'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
