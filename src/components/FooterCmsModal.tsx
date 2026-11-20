import { BookOpen, FileText, X } from 'lucide-react';
import type { CmsPageRecord } from '../types';

interface FooterCmsModalProps {
  isOpen: boolean;
  activeSlug: string | null;
  cmsPages: CmsPageRecord[];
  onSelectSlug: (slug: string) => void;
  onClose: () => void;
}

export function FooterCmsModal({
  isOpen,
  activeSlug,
  cmsPages,
  onSelectSlug,
  onClose,
}: FooterCmsModalProps) {
  if (!isOpen) return null;

  const publishedPages = cmsPages.filter((p) => p.published);
  const pagesList = publishedPages.length > 0 ? publishedPages : cmsPages;
  const activePage =
    pagesList.find((p) => p.slug === activeSlug) ?? pagesList[0] ?? null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/55 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Store Information & Blog"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-[#EAEAEA] overflow-hidden max-h-[88vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-3.5 bg-gradient-to-r from-[#081149] via-[#4C2A9B] to-[#663CBC] text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {activePage?.type === 'blog' ? (
              <BookOpen className="w-4 h-4 text-[#C4B5FD]" />
            ) : (
              <FileText className="w-4 h-4 text-[#C4B5FD]" />
            )}
            <h2 className="text-sm sm:text-base font-extrabold line-clamp-1">
              {activePage?.title || 'তথ্য ও নীতিমালা'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-full hover:bg-white/15 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 py-2.5 bg-[#F4F7FF] border-b border-[#DDDDEF] flex flex-wrap gap-1.5">
          {pagesList.map((page) => {
            const selected = activePage?.slug === page.slug;
            return (
              <button
                key={page.slug}
                type="button"
                onClick={() => onSelectSlug(page.slug)}
                className={`px-3 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-colors ${
                  selected
                    ? 'bg-[#663CBC] text-white'
                    : 'bg-white border border-[#DDDDEF] text-[#3C4266] hover:border-[#663CBC] hover:text-[#663CBC]'
                }`}
              >
                {page.type === 'blog' ? 'Blog: ' : ''}
                {page.slug.toUpperCase()}
              </button>
            );
          })}
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-[#374151] leading-relaxed">
          {activePage ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#F0F0F0]">
                <div>
                  <span className="inline-block px-2 py-0.5 rounded bg-[#ECFDF5] text-[#047857] text-[10px] font-bold uppercase">
                    {activePage.type === 'blog' ? 'Organic Journal & Guide' : 'Official Store Policy'}
                  </span>
                  <h3 className="text-base sm:text-lg font-extrabold text-[#212121] mt-1">
                    {activePage.title}
                  </h3>
                </div>
                {activePage.updatedAtText && (
                  <span className="text-[11px] text-[#757575]">
                    Updated: {activePage.updatedAtText}
                  </span>
                )}
              </div>

              {activePage.metaDescription && (
                <p className="p-3 rounded-lg bg-[#F5F3FF] border border-[#663CBC]/25 text-xs text-[#4C1D95] font-medium">
                  {activePage.metaDescription}
                </p>
              )}

              <div className="space-y-3 whitespace-pre-line text-[#374151]">
                {activePage.content}
              </div>
            </>
          ) : (
            <p className="text-center text-[#757575] py-8">কোনো তথ্য পাওয়া যায়নি।</p>
          )}
        </div>
      </div>
    </div>
  );
}
