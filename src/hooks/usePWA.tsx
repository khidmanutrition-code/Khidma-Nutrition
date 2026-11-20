import { useEffect, useState } from 'react';
import { Download, Smartphone, WifiOff, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  return {
    isInstallable: Boolean(deferredPrompt),
    isInstalled,
    isIOS,
    install,
  };
}

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export function PWAInstallButton({ compact = false }: { compact?: boolean }) {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (isInstallable) {
            void install();
          } else {
            setShowGuide(true);
          }
        }}
        className={
          compact
            ? 'inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/15 hover:bg-white/25 text-white text-[10px] font-bold cursor-pointer whitespace-nowrap'
            : 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#212121] hover:bg-[#374151] text-white text-xs font-bold cursor-pointer whitespace-nowrap'
        }
      >
        <Download className="w-3.5 h-3.5" />
        <span>{isIOS ? 'Install iOS App' : 'Install App'}</span>
      </button>

      {showGuide && (
        <div
          className="fixed inset-0 z-50 bg-black/55 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowGuide(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl border border-[#EAEAEA] text-[#212121] space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg brand-tint-bg brand-text flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-extrabold text-[#081149]">Install Khidmatul Ummah App</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="p-1 text-[#757575] hover:text-[#212121] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {isIOS ? (
              <p className="text-xs text-[#424242] leading-relaxed">
                1. Safari ব্রাউজারের নিচে <strong>Share</strong> আইকনে ট্যাপ করুন।
                <br />
                2. নিচে স্ক্রল করে <strong>Add to Home Screen</strong> নির্বাচন করুন।
              </p>
            ) : (
              <p className="text-xs text-[#424242] leading-relaxed">
                ব্রাউজারের অ্যাড্রেস বারের <strong>Install App</strong> বা মেনু (⋮ →{' '}
                <em>Install Khidmatul</em>) থেকে সরাসরি মোবাইল ও ডেস্কটপে অ্যাপটি ইনস্টল করুন —
                অফলাইন ব্রাউজিং ও তাৎক্ষণিক অর্ডার নোটিফিকেশন পাবেন।
              </p>
            )}
            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="w-full py-2 rounded-lg ot-gradient-btn text-xs font-bold cursor-pointer"
            >
              বুঝেছি (Close)
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-16 lg:bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg bg-[#D97706] px-3 py-1.5 text-xs font-bold text-white shadow-lg"
    >
      <WifiOff className="w-3.5 h-3.5" />
      <span>Offline Mode — Cached Catalog Active</span>
    </div>
  );
}
