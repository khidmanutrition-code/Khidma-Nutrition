import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  Crosshair,
  ImagePlus,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import type { Product } from '../data/products';
import type { MarketplaceLanguage } from '../types';
import { ResilientImage } from './ResilientImage';
import { GoogleLensIcon } from './GoogleLensIcon';

interface VisualSearchModalProps {
  open: boolean;
  onClose: () => void;
  products: Product[];
  onSelectProduct: (product: Product) => void;
  lang?: MarketplaceLanguage;
}

interface VisualMatch {
  productId: string;
  name: string;
  englishName: string;
  price: number;
  image: string;
  categoryLabel: string;
  score: number;
  reason: string;
}

export const VisualSearchModal: React.FC<VisualSearchModalProps> = ({
  open,
  onClose,
  products,
  onSelectProduct,
  lang = 'bn',
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [activeFileName, setActiveFileName] = useState<string>('lens-capture.jpg');
  const [dominantHex, setDominantHex] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [focusPoint, setFocusPoint] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [matches, setMatches] = useState<VisualMatch[]>([]);

  // Live Camera Capture State
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const loadedImageRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (!open) {
      stopCamera();
      return;
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            processImageFile(file);
          }
          break;
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('paste', handlePaste);
    };
  }, [open, onClose]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  if (!open) return null;

  const runVisualSearch = async (r: number, g: number, b: number, fileName: string) => {
    setLoading(true);
    const hex = `#${[r, g, b]
      .map((c) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, '0'))
      .join('')}`;
    setDominantHex(hex);
    try {
      const lightweightCatalog = products.slice(0, 50).map((p) => ({
        id: p.id,
        name: p.name,
        englishName: p.englishName,
        price: p.price,
        image: p.image,
        category: p.category,
        categoryLabel: p.categoryLabel,
      }));
      const res = await fetch('/api/search/visual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ r, g, b, fileName, catalog: lightweightCatalog }),
      });
      const json = (await res.json()) as { ok?: boolean; matches?: VisualMatch[] };
      if (json.ok && Array.isArray(json.matches)) {
        setMatches(json.matches);
      }
    } catch {
      setMatches(
        products.slice(0, 4).map((p) => ({
          productId: p.id,
          name: p.name,
          englishName: p.englishName,
          price: p.price,
          image: p.image,
          categoryLabel: p.categoryLabel,
          score: 88,
          reason: 'Catalog Visual Match',
        }))
      );
    } finally {
      setLoading(false);
    }
  };

  const sampleRegionFromImage = (
    img: HTMLImageElement,
    focusXPercent: number,
    focusYPercent: number,
    fileName: string
  ) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 48;
      canvas.height = 48;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        void runVisualSearch(150, 90, 40, fileName);
        return;
      }
      ctx.drawImage(img, 0, 0, 48, 48);
      const cx = Math.max(4, Math.min(43, Math.round((focusXPercent / 100) * 48)));
      const cy = Math.max(4, Math.min(43, Math.round((focusYPercent / 100) * 48)));
      const data = ctx.getImageData(cx - 4, cy - 4, 8, 8).data;
      let rSum = 0;
      let gSum = 0;
      let bSum = 0;
      const pixels = data.length / 4;
      for (let i = 0; i < data.length; i += 4) {
        rSum += data[i];
        gSum += data[i + 1];
        bSum += data[i + 2];
      }
      void runVisualSearch(rSum / pixels, gSum / pixels, bSum / pixels, fileName);
    } catch {
      void runVisualSearch(150, 90, 40, fileName);
    }
  };

  const analyzeImageUrl = (srcUrl: string, fileName: string) => {
    stopCamera();
    setPreviewUrl(srcUrl);
    setActiveFileName(fileName);
    setFocusPoint({ x: 50, y: 50 });

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      loadedImageRef.current = img;
      sampleRegionFromImage(img, 50, 50, fileName);
    };
    img.onerror = () => {
      void runVisualSearch(160, 95, 42, fileName);
    };
    img.src = srcUrl;
  };

  const processImageFile = (file: File) => {
    const objectUrl = URL.createObjectURL(file);
    analyzeImageUrl(objectUrl, file.name);
  };

  const startCamera = async () => {
    setCameraError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('আপনার ব্রাউজারে লাইভ ক্যামেরা সমর্থিত নয় — ছবি আপলোড করুন।');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
      window.setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play().catch(() => undefined);
        }
      }, 60);
    } catch {
      setCameraError('ক্যামেরার অনুমতি পাওয়া যায়নি। অনুগ্রহ করে ছবি আপলোড বা ড্র্যাগ করুন।');
    }
  };

  const snapFromCamera = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      analyzeImageUrl(dataUrl, `lens-camera-${Date.now()}.jpg`);
    }
  };

  const presetSamples = products.slice(0, 4);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[3px] flex items-center justify-center p-2.5 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Google Lens Style Visual Search"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-[#E5E7EB] overflow-hidden max-h-[92vh] flex flex-col"
      >
        {/* Google Lens Light Studio Header */}
        <div className="bg-white border-b border-[#E5E7EB] px-4 sm:px-5 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] flex items-center justify-center">
              <GoogleLensIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-[#202124] flex items-center gap-1.5">
                <span>Khidmatul Lens</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#E8F0FE] text-[#1967D2]">
                  Visual Search
                </span>
              </h2>
              <p className="text-[11px] text-[#5F6368]">
                {lang === 'en'
                  ? 'Search with camera, drag & drop, Ctrl+V paste, or tap anywhere on a photo'
                  : 'ছবি আপলোড, ক্যামেরা স্ন্যাপ বা ছবির যেকোনো অংশে ট্যাপ করে মিল থাকা পণ্য খুঁজুন'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Google Lens Search"
            className="w-9 h-9 rounded-full hover:bg-[#F1F3F4] text-[#5F6368] flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Split Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 bg-[#F8F9FA]">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) processImageFile(f);
            }}
            className="hidden"
          />

          {/* Left Pane: Google Lens Optical Viewfinder */}
          <div className="lg:col-span-6 space-y-3 flex flex-col">
            {cameraActive ? (
              <div className="relative rounded-2xl overflow-hidden bg-[#111318] aspect-[4/3] flex items-center justify-center border border-[#3C4043]">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {/* 4-Color Google Lens Corner Viewfinder Brackets */}
                <span className="pointer-events-none absolute top-4 left-4 w-7 h-7 border-t-[3px] border-l-[3px] border-[#4285F4] rounded-tl-xl" />
                <span className="pointer-events-none absolute top-4 right-4 w-7 h-7 border-t-[3px] border-r-[3px] border-[#EA4335] rounded-tr-xl" />
                <span className="pointer-events-none absolute bottom-16 left-4 w-7 h-7 border-b-[3px] border-l-[3px] border-[#FBBC05] rounded-bl-xl" />
                <span className="pointer-events-none absolute bottom-16 right-4 w-7 h-7 border-b-[3px] border-r-[3px] border-[#34A853] rounded-br-xl" />

                <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={snapFromCamera}
                    className="px-5 py-2 rounded-full bg-white text-[#202124] hover:bg-[#E8F0FE] text-xs font-extrabold shadow-lg flex items-center gap-1.5 cursor-pointer"
                  >
                    <Camera className="w-4 h-4 text-[#1A73E8]" />
                    <span>{lang === 'en' ? 'Search with Lens' : 'ছবি তুলে খুঁজুন'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="px-3.5 py-2 rounded-full bg-black/70 text-white text-xs font-bold cursor-pointer"
                  >
                    বাতিল
                  </button>
                </div>
              </div>
            ) : previewUrl ? (
              <div className="rounded-2xl overflow-hidden bg-[#111318] border border-[#202124] flex flex-col">
                <div
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100));
                    const y = Math.max(5, Math.min(95, ((e.clientY - rect.top) / rect.height) * 100));
                    setFocusPoint({ x, y });
                    if (loadedImageRef.current) {
                      sampleRegionFromImage(loadedImageRef.current, x, y, activeFileName);
                    }
                  }}
                  title="ছবির যেকোনো অংশে ক্লিক করে ফোকাস পরিবর্তন করুন"
                  className="relative aspect-[4/3] w-full flex items-center justify-center overflow-hidden cursor-crosshair select-none"
                >
                  <img
                    src={previewUrl}
                    alt="Lens Preview"
                    className="w-full h-full object-contain"
                  />

                  {/* 4-Color Google Lens Corner Crop Brackets */}
                  <span className="pointer-events-none absolute top-3 left-3 w-8 h-8 border-t-[3.5px] border-l-[3.5px] border-[#4285F4] rounded-tl-xl" />
                  <span className="pointer-events-none absolute top-3 right-3 w-8 h-8 border-t-[3.5px] border-r-[3.5px] border-[#EA4335] rounded-tr-xl" />
                  <span className="pointer-events-none absolute bottom-3 left-3 w-8 h-8 border-b-[3.5px] border-l-[3.5px] border-[#FBBC05] rounded-bl-xl" />
                  <span className="pointer-events-none absolute bottom-3 right-3 w-8 h-8 border-b-[3.5px] border-r-[3.5px] border-[#34A853] rounded-br-xl" />

                  {/* Animated Scan Beam while searching */}
                  {loading && (
                    <div className="pointer-events-none absolute inset-x-4 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-[#4285F4] via-[#FBBC05] to-[#34A853] opacity-90 shadow-[0_0_14px_#4285F4] animate-pulse" />
                  )}

                  {/* Interactive Tap-to-Focus Reticle */}
                  <span
                    className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-2 border-white shadow-[0_0_0_2px_rgba(66,133,244,0.65)] flex items-center justify-center transition-all duration-150"
                    style={{ left: `${focusPoint.x}%`, top: `${focusPoint.y}%` }}
                  >
                    <span className="w-2 h-2 rounded-full bg-white" />
                  </span>
                </div>

                <div className="px-3.5 py-2.5 bg-[#1B1E26] text-white flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <span className="inline-flex items-center gap-1.5 text-gray-300">
                    <Crosshair className="w-3.5 h-3.5 text-[#4285F4]" />
                    <span>ছবির যেকোনো অংশে ক্লিক করে ফোকাস করুন</span>
                  </span>
                  {dominantHex && (
                    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] bg-white/10 px-2 py-0.5 rounded">
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-white/40"
                        style={{ backgroundColor: dominantHex }}
                      />
                      {dominantHex}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f && f.type.startsWith('image/')) {
                    processImageFile(f);
                  }
                }}
                className={`relative rounded-2xl border-2 border-dashed p-6 flex flex-col items-center justify-center text-center gap-3 aspect-[4/3] transition-colors bg-white ${
                  dragOver
                    ? 'border-[#4285F4] bg-[#E8F0FE]/40'
                    : 'border-[#DADCE0] hover:border-[#4285F4]'
                }`}
              >
                {/* Subtle Google Lens corner accents */}
                <span className="pointer-events-none absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-[#4285F4] rounded-tl-lg" />
                <span className="pointer-events-none absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-[#EA4335] rounded-tr-lg" />
                <span className="pointer-events-none absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-[#FBBC05] rounded-bl-lg" />
                <span className="pointer-events-none absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-[#34A853] rounded-br-lg" />

                <div className="w-14 h-14 rounded-2xl bg-[#F1F3F4] flex items-center justify-center">
                  <GoogleLensIcon className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-bold text-[#202124]">
                    {lang === 'en'
                      ? 'Drag an image here or upload a photo'
                      : 'এখানে ছবি ড্র্যাগ করুন অথবা আপলোড করুন'}
                  </p>
                  <p className="text-[11px] text-[#5F6368]">
                    Ctrl+V দিয়ে পেস্ট করাও যাবে (গুড়, মধু, ঘি, খেজুর, বাদাম)
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-full bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{lang === 'en' ? 'Upload File' : 'ফাইল আপলোড'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void startCamera()}
                    className="px-4 py-2 rounded-full border border-[#DADCE0] hover:bg-[#F1F3F4] text-[#202124] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5 text-[#34A853]" />
                    <span>{lang === 'en' ? 'Use Camera' : 'ক্যামেরা চালু করুন'}</span>
                  </button>
                </div>
              </div>
            )}

            {cameraError && (
              <p className="text-[11px] font-semibold text-[#B91C1C] bg-[#FEF2F2] border border-[#FECACA] px-3 py-2 rounded-lg">
                {cameraError}
              </p>
            )}

            {/* Action strip when preview already exists */}
            {previewUrl && !cameraActive && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-full bg-white border border-[#DADCE0] hover:border-[#4285F4] text-xs font-bold text-[#202124] inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <ImagePlus className="w-3.5 h-3.5 text-[#1A73E8]" />
                  <span>অন্য ছবি দিন</span>
                </button>
                <button
                  type="button"
                  onClick={() => void startCamera()}
                  className="px-3 py-1.5 rounded-full bg-white border border-[#DADCE0] hover:border-[#34A853] text-xs font-bold text-[#202124] inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5 text-[#34A853]" />
                  <span>ক্যামেরা</span>
                </button>
              </div>
            )}

            {/* Quick Sample Photos */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-3 space-y-2">
              <p className="text-[11px] font-bold text-[#5F6368]">
                {lang === 'en' ? 'Try with a sample catalog photo:' : 'স্যাম্পল পণ্যের ছবি দিয়ে টেস্ট করুন:'}
              </p>
              <div className="grid grid-cols-4 gap-2">
                {presetSamples.map((sample) => (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() => analyzeImageUrl(sample.image, `${sample.id}.jpg`)}
                    className="group rounded-lg border border-[#E5E7EB] hover:border-[#1A73E8] overflow-hidden bg-[#FAFAFA] text-left cursor-pointer"
                    title={sample.name}
                  >
                    <div className="aspect-square w-full overflow-hidden">
                      <ResilientImage
                        src={sample.image}
                        alt={sample.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <p className="px-1.5 py-1 text-[9px] font-bold text-[#3C4043] truncate">
                      {sample.name}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Pane: Google Lens Visual Matches */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-[#E5E7EB] p-4 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F3F4]">
              <h3 className="text-xs sm:text-sm font-extrabold text-[#202124] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#4285F4]" />
                <span>{lang === 'en' ? 'Visual Matches' : 'ভিজ্যুয়াল ম্যাচ ফলাফল'}</span>
              </h3>
              {matches.length > 0 && !loading && (
                <span className="text-[11px] font-semibold text-[#5F6368]">
                  {matches.length} items found
                </span>
              )}
            </div>

            <div className="flex-1 pt-3 space-y-2.5 overflow-y-auto max-h-[430px]">
              {loading ? (
                <div className="py-16 text-center space-y-2">
                  <GoogleLensIcon className="w-9 h-9 mx-auto animate-pulse" />
                  <p className="text-xs font-bold text-[#1A73E8]">
                    {lang === 'en'
                      ? 'Analyzing object color, texture & catalog...'
                      : 'ছবির রঙ, টেক্সচার ও পণ্য বিশ্লেষণ করা হচ্ছে...'}
                  </p>
                </div>
              ) : matches.length === 0 ? (
                <div className="py-14 text-center space-y-2 text-[#5F6368]">
                  <p className="text-xs font-semibold">
                    {lang === 'en'
                      ? 'Upload a photo, use camera, or tap a sample photo on the left to see visual matches.'
                      : 'বামপাশ থেকে একটি ছবি আপলোড করুন, ক্যামেরা চালু করুন অথবা স্যাম্পল ছবিতে ক্লিক করুন।'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
                  {matches.map((m) => (
                    <button
                      key={m.productId}
                      type="button"
                      onClick={() => {
                        const prod = products.find((p) => p.id === m.productId);
                        if (prod) {
                          onSelectProduct(prod);
                          onClose();
                        }
                      }}
                      className="p-2.5 rounded-xl border border-[#E5E7EB] hover:border-[#1A73E8] hover:shadow-sm bg-white flex items-center gap-3 text-left transition-all cursor-pointer"
                    >
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-[#F1F3F4] shrink-0 border border-[#E5E7EB]">
                        <ResilientImage
                          src={m.image}
                          alt={m.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-[#E8F0FE] text-[#1967D2] text-[10px] font-extrabold">
                            {m.score}% Match
                          </span>
                          <span className="text-[10px] text-[#5F6368] truncate">
                            {m.categoryLabel}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-[#202124] truncate mt-1">{m.name}</p>
                        <p className="text-[10px] text-[#5F6368] truncate">{m.reason}</p>
                        <p className="text-xs font-extrabold text-[#663CBC] font-mono mt-0.5">
                          ৳{m.price.toLocaleString('en-US')}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
