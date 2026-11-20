import { useRef, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Film,
  FolderOpen,
  ImagePlus,
  Loader2,
  Star,
  Trash2,
  Upload,
} from 'lucide-react';
import { ResilientImage } from './ResilientImage';

interface MediaLibraryFile {
  fileName: string;
  url: string;
  mediaType: 'image' | 'video';
  sizeBytes: number;
}

interface MediaUploaderControlProps {
  mode: 'gallery' | 'single-image' | 'video';
  label: string;
  helperText?: string;
  images?: string[];
  singleUrl?: string;
  onImagesChange?: (urls: string[]) => void;
  onSingleUrlChange?: (url: string) => void;
  onUploadingChange?: (busy: boolean) => void;
  maxImages?: number;
  darkMode?: boolean;
}

function readSliceAsBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const idx = result.indexOf(',');
      resolve(idx >= 0 ? result.slice(idx + 1) : result);
    };
    reader.onerror = () => reject(new Error('ফাইল পড়তে সমস্যা হয়েছে'));
    reader.readAsDataURL(blob);
  });
}

export function isPlayableDirectVideoUrl(url: string): boolean {
  const clean = url.trim().toLowerCase();
  return (
    clean.startsWith('/uploads/') ||
    clean.startsWith('blob:') ||
    /\.(mp4|webm|mov|m4v|3gp)(\?.*)?$/i.test(clean)
  );
}

export function MediaUploaderControl({
  mode,
  label,
  helperText,
  images = [],
  singleUrl = '',
  onImagesChange,
  onSingleUrlChange,
  onUploadingChange,
  maxImages = 6,
  darkMode = false,
}: MediaUploaderControlProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [videoPreviewError, setVideoPreviewError] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryFiles, setLibraryFiles] = useState<MediaLibraryFile[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [urlDraft, setUrlDraft] = useState('');

  const setUploadingState = (busy: boolean) => {
    setUploading(busy);
    onUploadingChange?.(busy);
  };

  const uploadViaChunks = async (file: File): Promise<string> => {
    const inferredMime =
      file.type || (mode === 'video' ? 'video/mp4' : 'image/jpeg');

    const initRes = await fetch('/api/media/upload/init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        mimeType: inferredMime,
        totalSize: file.size,
      }),
    });
    const initJson = (await initRes.json()) as {
      ok?: boolean;
      uploadId?: string;
      error?: string;
    };
    if (!initRes.ok || !initJson.ok || !initJson.uploadId) {
      throw new Error(initJson.error || 'আপলোড শুরু করা যায়নি।');
    }

    const uploadId = initJson.uploadId;
    const chunkSize = 1024 * 1024; // 1MB raw per chunk (~1.37MB base64, well below Cloud Run 32MB ceiling)
    const totalChunks = Math.max(1, Math.ceil(file.size / chunkSize));

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(file.size, start + chunkSize);
      const slice = file.slice(start, end);
      const dataBase64 = await readSliceAsBase64(slice);

      const chunkRes = await fetch('/api/media/upload/chunk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uploadId, index: i, dataBase64 }),
      });
      const chunkJson = (await chunkRes.json()) as { ok?: boolean; error?: string };
      if (!chunkRes.ok || !chunkJson.ok) {
        throw new Error(chunkJson.error || 'ফাইলের অংশ আপলোড ব্যর্থ হয়েছে।');
      }
      setUploadProgress(Math.min(95, Math.round(((i + 1) / totalChunks) * 95)));
    }

    const doneRes = await fetch('/api/media/upload/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uploadId }),
    });
    const doneJson = (await doneRes.json()) as {
      ok?: boolean;
      url?: string;
      error?: string;
    };
    if (!doneRes.ok || !doneJson.ok || !doneJson.url) {
      throw new Error(doneJson.error || 'আপলোড সম্পন্ন করা যায়নি।');
    }
    setUploadProgress(100);
    return doneJson.url;
  };

  const uploadOneFile = async (file: File): Promise<string | null> => {
    const maxMb = mode === 'video' ? 60 : 15;
    if (file.size > maxMb * 1024 * 1024) {
      setErrorMsg(`ফাইলের সাইজ ${maxMb} MB-এর মধ্যে হতে হবে।`);
      return null;
    }

    // Use chunked upload for all videos or files > 1.2 MB so uploads never get truncated or cut off
    if (mode === 'video' || file.size > 1.2 * 1024 * 1024) {
      return uploadViaChunks(file);
    }

    const dataBase64 = await readSliceAsBase64(file);
    const res = await fetch('/api/media/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        mimeType: file.type || 'image/jpeg',
        dataBase64,
      }),
    });
    const data = (await res.json()) as { ok?: boolean; url?: string; error?: string };
    if (!res.ok || !data.ok || !data.url) {
      throw new Error(data.error || 'আপলোড ব্যর্থ হয়েছে');
    }
    setUploadProgress(100);
    return data.url;
  };

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setVideoPreviewError(false);
    setUploadProgress(5);
    setUploadingState(true);
    try {
      const selected = Array.from(files);
      if (mode === 'gallery') {
        const nextList = [...images];
        for (const f of selected) {
          if (nextList.length >= maxImages) break;
          const url = await uploadOneFile(f);
          if (url && !nextList.includes(url)) {
            nextList.push(url);
          }
        }
        onImagesChange?.(nextList);
        setSuccessMsg('ছবি সফলভাবে আপলোড হয়েছে!');
      } else {
        const url = await uploadOneFile(selected[0]);
        if (url) {
          onSingleUrlChange?.(url);
          setSuccessMsg(
            mode === 'video'
              ? 'ভিডিও আপলোড সম্পন্ন হয়েছে! এখন নিচের সংরক্ষণ বাটনে ক্লিক করে সেভ করুন।'
              : 'ছবি সফলভাবে আপলোড হয়েছে!'
          );
        }
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'আপলোড করতে সমস্যা হয়েছে।');
    } finally {
      setUploadingState(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const openLibrary = async () => {
    const nextOpen = !libraryOpen;
    setLibraryOpen(nextOpen);
    if (!nextOpen) return;
    setLoadingLibrary(true);
    try {
      const res = await fetch('/api/media/list');
      const data = (await res.json()) as { ok?: boolean; files?: MediaLibraryFile[] };
      const allFiles = Array.isArray(data.files) ? data.files : [];
      const wantedType = mode === 'video' ? 'video' : 'image';
      setLibraryFiles(allFiles.filter((f) => f.mediaType === wantedType));
    } catch {
      setLibraryFiles([]);
    } finally {
      setLoadingLibrary(false);
    }
  };

  const handleAddUrl = () => {
    const clean = urlDraft.trim();
    if (!clean) return;
    setErrorMsg(null);
    setVideoPreviewError(false);
    if (mode === 'gallery') {
      if (!images.includes(clean)) {
        onImagesChange?.([...images, clean].slice(0, maxImages));
      }
    } else {
      onSingleUrlChange?.(clean);
      setSuccessMsg(
        mode === 'video' ? 'ভিডিও লিংক যুক্ত হয়েছে — সংরক্ষণ করতে ভুলবেন না।' : 'ছবির লিংক যুক্ত হয়েছে।'
      );
    }
    setUrlDraft('');
  };

  const boxCls = darkMode
    ? 'bg-[#101318] border-[#2E3440] text-gray-200'
    : 'bg-[#FAFAFA] border-[#E5E7EB] text-[#212121]';

  return (
    <div className={`rounded-xl border p-3 space-y-2.5 ${boxCls}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-extrabold flex items-center gap-1.5">
            {mode === 'video' ? (
              <Film className="w-3.5 h-3.5 text-[#F85606]" />
            ) : (
              <ImagePlus className="w-3.5 h-3.5 text-[#F85606]" />
            )}
            <span>{label}</span>
          </p>
          {helperText && (
            <p className={`text-[10px] mt-0.5 ${darkMode ? 'text-gray-400' : 'text-[#6B7280]'}`}>
              {helperText}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <input
            ref={fileInputRef}
            type="file"
            multiple={mode === 'gallery'}
            accept={
              mode === 'video'
                ? 'video/*,.mp4,.webm,.mov,.m4v,.3gp'
                : 'image/*,.jpg,.jpeg,.png,.webp,.gif'
            }
            onChange={(e) => void handleFilesSelected(e.target.files)}
            className="hidden"
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-1.5 rounded-lg bg-[#F85606] hover:bg-[#D94802] disabled:opacity-60 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
          >
            {uploading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5" />
            )}
            <span>
              {uploading
                ? `আপলোড হচ্ছে ${uploadProgress}%`
                : mode === 'video'
                  ? 'ভিডিও আপলোড'
                  : 'ফটো আপলোড'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => void openLibrary()}
            className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold flex items-center gap-1 cursor-pointer ${
              darkMode
                ? 'border-[#374151] bg-[#181B22] text-gray-200 hover:bg-[#1F2430]'
                : 'border-[#D1D5DB] bg-white text-[#374151] hover:bg-[#F3F4F6]'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Media Library</span>
          </button>
        </div>
      </div>

      {uploading && (
        <div className="space-y-1">
          <div className="w-full h-2 rounded-full bg-black/10 overflow-hidden">
            <div
              className="h-full bg-[#F85606] transition-all duration-200"
              style={{ width: `${Math.max(8, uploadProgress)}%` }}
            />
          </div>
          <p className="text-[10px] font-semibold text-[#F85606]">
            ফাইল পাঠানো হচ্ছে ({uploadProgress}%) — অনুগ্রহ করে অপেক্ষা করুন...
          </p>
        </div>
      )}

      {errorMsg && (
        <div className="px-2.5 py-1.5 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[11px] font-semibold text-[#B91C1C]">
          {errorMsg}
        </div>
      )}

      {successMsg && !uploading && (
        <div className="px-2.5 py-1.5 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0] text-[11px] font-semibold text-[#047857] flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Gallery Preview Grid */}
      {mode === 'gallery' && images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {images.map((imgUrl, idx) => (
            <div
              key={`${imgUrl}-${idx}`}
              className={`relative group rounded-lg overflow-hidden border bg-white aspect-square ${
                idx === 0 ? 'border-[#F85606] ring-2 ring-[#F85606]/25' : 'border-[#E5E7EB]'
              }`}
            >
              <ResilientImage src={imgUrl} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
              {idx === 0 && (
                <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-[#F85606] text-white text-[9px] font-bold">
                  Main
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 p-1 bg-black/65 flex items-center justify-between gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {idx > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      const reordered = [imgUrl, ...images.filter((_, i) => i !== idx)];
                      onImagesChange?.(reordered);
                    }}
                    title="Set as Main Cover"
                    className="p-1 rounded bg-white/20 hover:bg-[#F85606] text-white text-[9px] font-bold flex items-center gap-0.5 cursor-pointer"
                  >
                    <Star className="w-2.5 h-2.5" />
                    <span>Main</span>
                  </button>
                ) : (
                  <span className="text-[9px] text-white px-1 font-bold flex items-center gap-0.5">
                    <Check className="w-2.5 h-2.5" /> Cover
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => onImagesChange?.(images.filter((_, i) => i !== idx))}
                  title="Remove"
                  className="p-1 rounded bg-red-600/80 hover:bg-red-600 text-white cursor-pointer"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Single Image Preview */}
      {mode === 'single-image' && singleUrl && (
        <div className="flex items-center gap-3 p-2 rounded-lg border border-[#E5E7EB] bg-white">
          <ResilientImage
            src={singleUrl}
            alt="Uploaded preview"
            className="w-16 h-16 rounded-lg object-cover shrink-0 border border-[#EAEAEA]"
          />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold text-[#212121] truncate">{singleUrl}</p>
            <button
              type="button"
              onClick={() => {
                setSuccessMsg(null);
                onSingleUrlChange?.('');
              }}
              className="mt-1 text-[10px] font-bold text-red-600 hover:underline cursor-pointer"
            >
              ছবি মুছুন
            </button>
          </div>
        </div>
      )}

      {/* Video Preview — Fixed aspect-video + object-contain so portrait/landscape videos never clip */}
      {mode === 'video' && singleUrl && (
        <div className="rounded-lg border border-[#E5E7EB] bg-black overflow-hidden">
          {isPlayableDirectVideoUrl(singleUrl) ? (
            <div className="w-full aspect-video max-h-56 bg-black flex items-center justify-center">
              <video
                key={singleUrl}
                src={singleUrl}
                controls
                playsInline
                preload="metadata"
                onError={() => setVideoPreviewError(true)}
                onLoadedMetadata={() => setVideoPreviewError(false)}
                className="w-full h-full object-contain bg-black"
              />
            </div>
          ) : (
            <div className="p-3 bg-white text-[11px] font-semibold text-[#1E40AF] truncate">
              Video Link: {singleUrl}
            </div>
          )}
          {videoPreviewError && (
            <div className="px-2.5 py-1.5 bg-[#FEF2F2] text-[#B91C1C] text-[10px] font-semibold">
              ব্রাউজারে এই ভিডিও প্রিভিউ লোড হয়নি — নিশ্চিত করুন এটি H.264 MP4 বা WebM ফরম্যাট।
            </div>
          )}
          <div className="flex items-center justify-between px-2.5 py-1.5 bg-[#181B22] text-white text-[10px]">
            <span className="truncate font-mono">{singleUrl}</span>
            <button
              type="button"
              onClick={() => {
                setSuccessMsg(null);
                setVideoPreviewError(false);
                onSingleUrlChange?.('');
              }}
              className="text-red-400 hover:text-red-300 font-bold shrink-0 ml-2 cursor-pointer"
            >
              Remove
            </button>
          </div>
        </div>
      )}

      {/* Direct URL paste fallback */}
      <div className="flex items-center gap-1.5">
        <input
          type="text"
          value={urlDraft}
          onChange={(e) => setUrlDraft(e.target.value)}
          placeholder={
            mode === 'video'
              ? 'অথবা ভিডিও URL পেস্ট করুন (/uploads/... বা YouTube)'
              : 'অথবা সরাসরি ছবির URL পেস্ট করুন...'
          }
          className={`flex-1 px-2.5 py-1.5 rounded-lg border text-[11px] focus:outline-none ${
            darkMode
              ? 'bg-[#181B22] border-[#2E3440] text-gray-100'
              : 'bg-white border-[#D1D5DB] text-[#212121]'
          }`}
        />
        <button
          type="button"
          onClick={handleAddUrl}
          className="px-2.5 py-1.5 rounded-lg border border-[#D1D5DB] bg-white hover:bg-[#F3F4F6] text-[11px] font-bold text-[#212121] cursor-pointer"
        >
          যোগ করুন
        </button>
      </div>

      {/* Media Library Picker */}
      {libraryOpen && (
        <div className="p-2.5 rounded-lg border border-[#E5E7EB] bg-white space-y-2 text-[#212121]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#212121]">
              সার্ভারে আপলোডকৃত ফাইল ({libraryFiles.length})
            </span>
            <button
              type="button"
              onClick={() => setLibraryOpen(false)}
              className="text-[10px] font-bold text-[#757575] cursor-pointer"
            >
              বন্ধ করুন
            </button>
          </div>
          {loadingLibrary ? (
            <p className="text-[11px] text-[#757575]">লোড হচ্ছে...</p>
          ) : libraryFiles.length === 0 ? (
            <p className="text-[11px] text-[#757575]">এখনো কোনো ফাইল আপলোড করা হয়নি।</p>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 max-h-40 overflow-y-auto">
              {libraryFiles.map((f) => (
                <button
                  key={f.fileName}
                  type="button"
                  onClick={() => {
                    if (mode === 'gallery') {
                      if (!images.includes(f.url)) {
                        onImagesChange?.([...images, f.url].slice(0, maxImages));
                      }
                    } else {
                      setVideoPreviewError(false);
                      onSingleUrlChange?.(f.url);
                      setSuccessMsg('Media Library থেকে নির্বাচিত হয়েছে! সংরক্ষণ করুন।');
                      setLibraryOpen(false);
                    }
                  }}
                  className="rounded border border-[#E5E7EB] hover:border-[#F85606] overflow-hidden bg-[#FAFAFA] aspect-square flex flex-col items-center justify-center p-0.5 cursor-pointer"
                  title={f.fileName}
                >
                  {f.mediaType === 'image' ? (
                    <ResilientImage src={f.url} alt={f.fileName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center px-1">
                      <Film className="w-5 h-5 mx-auto text-[#F85606]" />
                      <span className="text-[9px] text-[#424242] line-clamp-2 break-all">{f.fileName}</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
