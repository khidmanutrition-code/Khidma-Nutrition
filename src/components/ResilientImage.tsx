import { useState, type CSSProperties } from 'react';
import { Leaf } from 'lucide-react';

interface ResilientImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
  style?: CSSProperties;
}

export function ResilientImage({
  src,
  alt,
  className = '',
  fallbackTitle,
  style,
}: ResilientImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#ECECE6] to-[#DFDFD6] text-[#435147] p-6 text-center ${className}`}
      >
        <Leaf className="w-7 h-7 mb-2 text-[#163022]/70" strokeWidth={1.5} />
        <span className="text-xs font-medium tracking-wide text-[#1A1F1C]/80">
          {fallbackTitle || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
      style={style}
    />
  );
}
