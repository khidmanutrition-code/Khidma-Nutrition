import React from 'react';

interface GoogleLensIconProps {
  className?: string;
  monochrome?: boolean;
}

/**
 * Optical viewfinder mark inspired by Google Lens (crisp black by default).
 */
export const GoogleLensIcon: React.FC<GoogleLensIconProps> = ({
  className = 'w-5 h-5',
  monochrome = true,
}) => {
  const c1 = monochrome ? 'currentColor' : '#4285F4';
  const c2 = monochrome ? 'currentColor' : '#EA4335';
  const c3 = monochrome ? 'currentColor' : '#FBBC05';
  const c4 = monochrome ? 'currentColor' : '#34A853';

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Top-left arc */}
      <path
        d="M5 10V7.5C5 6.12 6.12 5 7.5 5H10"
        stroke={c1}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* Top-right arc */}
      <path
        d="M14 5H16.5C17.88 5 19 6.12 19 7.5V10"
        stroke={c2}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* Bottom-left arc */}
      <path
        d="M10 19H7.5C6.12 19 5 17.88 5 16.5V14"
        stroke={c3}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* Center lens circle */}
      <circle cx="12" cy="12" r="3" fill={c1} />
      {/* Bottom-right dot */}
      <circle cx="17.5" cy="17.5" r="2" fill={c4} />
    </svg>
  );
};
