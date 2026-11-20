import { useEffect, useRef } from 'react';
import { LayoutGrid } from 'lucide-react';
import { CATEGORIES, CategorySlug, Product } from '../data/products';
import type { MarketplaceLanguage } from '../types';
import { ResilientImage } from './ResilientImage';

interface FalaqCategoryMarqueeProps {
  activeCategory: CategorySlug;
  activeProducts: Product[];
  lang: MarketplaceLanguage;
  onSelectCategory: (slug: CategorySlug) => void;
  onSyncSingleProduct: (product: Product) => void;
}

export function FalaqCategoryMarquee({
  activeCategory,
  activeProducts,
  lang,
  onSelectCategory,
  onSyncSingleProduct,
}: FalaqCategoryMarqueeProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const firstSetRef = useRef<HTMLDivElement>(null);
  const floatScrollRef = useRef(0);
  const isPausedRef = useRef(false);
  const isTouchActiveRef = useRef(false);
  const resumeTimerRef = useRef<number | null>(null);

  const clearResumeTimer = () => {
    if (resumeTimerRef.current !== null) {
      window.clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
  };

  const pauseNow = () => {
    clearResumeTimer();
    isPausedRef.current = true;
    if (scrollRef.current) {
      floatScrollRef.current = scrollRef.current.scrollLeft;
    }
  };

  const scheduleResume = (delayMs: number) => {
    clearResumeTimer();
    resumeTimerRef.current = window.setTimeout(() => {
      if (!isTouchActiveRef.current) {
        if (scrollRef.current) {
          floatScrollRef.current = scrollRef.current.scrollLeft;
        }
        isPausedRef.current = false;
      }
      resumeTimerRef.current = null;
    }, delayMs);
  };

  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();
    const speedPxPerSec = 42;

    const tick = (now: number) => {
      const dt = Math.min(now - lastTime, 64);
      lastTime = now;

      const container = scrollRef.current;
      const firstSet = firstSetRef.current;
      if (container && firstSet && !isPausedRef.current) {
        const loopWidth = firstSet.offsetWidth;
        if (loopWidth > 0 && container.scrollWidth > container.clientWidth) {
          if (Math.abs(container.scrollLeft - floatScrollRef.current) > 2.5) {
            floatScrollRef.current = container.scrollLeft;
          }
          floatScrollRef.current += (dt / 1000) * speedPxPerSec;
          if (floatScrollRef.current >= loopWidth) {
            floatScrollRef.current -= loopWidth;
          }
          container.scrollLeft = floatScrollRef.current;
        }
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(rafId);
      clearResumeTimer();
    };
  }, []);

  const handleCategoryClick = (slug: CategorySlug) => {
    onSelectCategory(slug);
    if (slug !== 'all') {
      const matched = activeProducts.find((p) => p.category === slug);
      if (matched) onSyncSingleProduct(matched);
    }
    document.getElementById('all-organic-catalog')?.scrollIntoView({ behavior: 'smooth' });
  };

  const renderCardSet = (isDuplicate: boolean) => (
    <div
      ref={isDuplicate ? undefined : firstSetRef}
      aria-hidden={isDuplicate ? true : undefined}
      className="flex items-stretch gap-3.5 md:gap-5 pr-3.5 md:pr-5 shrink-0"
    >
      <button
        type="button"
        tabIndex={isDuplicate ? -1 : 0}
        onClick={() => handleCategoryClick('all')}
        className={`group/category relative flex h-[110px] md:h-[134px] w-[108px] md:w-[120px] shrink-0 flex-col items-center justify-center gap-2 p-2 text-center cursor-pointer active:scale-95 ${
          activeCategory === 'all' ? 'falaq-category-card-active' : 'falaq-category-card'
        }`}
      >
        <span className="flex w-[70px] h-[70px] md:w-[92px] md:h-[92px] shrink-0 items-center justify-center overflow-hidden rounded-[6px] bg-[#ECFDF5] text-[#159758]">
          <LayoutGrid className="w-8 h-8 md:w-10 md:h-10 transition-transform duration-200 group-hover/category:scale-105" />
        </span>
        <span
          className={`line-clamp-1 min-w-0 max-w-full break-words px-1 text-center text-[11px] md:text-[12px] font-bold uppercase leading-[16px] md:leading-[18px] ${
            activeCategory === 'all' ? 'text-[#159758]' : 'text-[#454F5B]'
          }`}
        >
          {lang === 'en' ? 'All Items' : 'সব পণ্য'}
        </span>
      </button>

      {CATEGORIES.map((cat) => {
        const active = activeCategory === cat.slug;
        return (
          <button
            key={`${isDuplicate ? 'dup' : 'main'}-${cat.slug}`}
            type="button"
            tabIndex={isDuplicate ? -1 : 0}
            onClick={() => handleCategoryClick(cat.slug)}
            className={`group/category relative flex h-[110px] md:h-[134px] w-[108px] md:w-[120px] shrink-0 flex-col items-center justify-center gap-2 p-2 text-center cursor-pointer active:scale-95 ${
              active ? 'falaq-category-card-active' : 'falaq-category-card'
            }`}
          >
            <span className="flex w-[70px] h-[70px] md:w-[92px] md:h-[92px] shrink-0 items-center justify-center overflow-hidden rounded-[6px] text-[#159758]">
              <ResilientImage
                src={cat.image}
                alt={cat.name}
                className="w-full h-full object-cover object-center transition-transform duration-200 group-hover/category:scale-105"
              />
            </span>
            <span
              className={`line-clamp-1 min-w-0 max-w-full break-words px-1 text-center text-[11px] md:text-[12px] font-bold uppercase leading-[16px] md:leading-[18px] ${
                active ? 'text-[#159758]' : 'text-[#454F5B]'
              }`}
            >
              {cat.name}
            </span>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="relative mx-auto w-full pt-1 pb-3">
      <div
        ref={scrollRef}
        onTouchStart={() => {
          isTouchActiveRef.current = true;
          pauseNow();
        }}
        onTouchEnd={() => {
          isTouchActiveRef.current = false;
          scheduleResume(2600);
        }}
        onTouchCancel={() => {
          isTouchActiveRef.current = false;
          scheduleResume(2600);
        }}
        onPointerDown={(e) => {
          if (e.pointerType !== 'mouse') {
            isTouchActiveRef.current = true;
          }
          pauseNow();
        }}
        onPointerUp={(e) => {
          if (e.pointerType !== 'mouse') {
            isTouchActiveRef.current = false;
            scheduleResume(2600);
          }
        }}
        onMouseEnter={() => {
          pauseNow();
        }}
        onMouseLeave={() => {
          if (!isTouchActiveRef.current) {
            scheduleResume(450);
          }
        }}
        onWheel={() => {
          pauseNow();
          scheduleResume(2000);
        }}
        onScroll={() => {
          if (isPausedRef.current && scrollRef.current) {
            const loopWidth = firstSetRef.current?.offsetWidth ?? 0;
            if (loopWidth > 0 && scrollRef.current.scrollLeft >= loopWidth) {
              scrollRef.current.scrollLeft -= loopWidth;
            }
            floatScrollRef.current = scrollRef.current.scrollLeft;
          }
        }}
        className="flex items-stretch overflow-x-auto no-scrollbar px-1 py-2 touch-pan-x"
      >
        {renderCardSet(false)}
        {renderCardSet(true)}
      </div>
    </div>
  );
}
