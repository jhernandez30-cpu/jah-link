import { useState } from 'react';

export type BrandLogoProps = {
  variant?: 'full' | 'icon';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
};

const sizeMap = {
  sm: { full: { w: 112, h: 38 }, icon: { w: 34, h: 34 } },
  md: { full: { w: 150, h: 52 }, icon: { w: 42, h: 42 } },
  lg: { full: { w: 176, h: 60 }, icon: { w: 54, h: 54 } },
  xl: { full: { w: 220, h: 76 }, icon: { w: 72, h: 72 } },
} as const;

const srcMap = {
  full: '/brand/jah-link-logo.png',
  icon: '/brand/jah-link-logo-icon.png',
} as const;

export default function BrandLogo({
  variant = 'full',
  size = 'md',
  className = '',
}: BrandLogoProps) {
  const [failed, setFailed] = useState(false);
  const dims = sizeMap[size][variant];
  const src = srcMap[variant];

  if (failed) {
    return (
      <span
        className={`inline-flex items-center font-black tracking-normal text-white ${className}`}
        style={{ fontSize: size === 'sm' ? 16 : size === 'md' ? 20 : size === 'lg' ? 24 : 30 }}
      >
        {variant === 'icon' ? 'JL' : 'JAH Link'}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt="JAH Link"
      width={dims.w}
      height={dims.h}
      loading={size === 'xl' || size === 'lg' ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => setFailed(true)}
      className={`object-contain object-left h-auto shrink-0 ${className}`}
      style={{ width: dims.w, maxWidth: '100%', height: 'auto', maxHeight: dims.h }}
    />
  );
}
