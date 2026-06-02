import { useState } from 'react';
import { getInitials } from '../lib/avatar';

export type InitialsAvatarProps = {
  name?: string | null;
  email?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  imageUrl?: string | null;
  className?: string;
};

const sizeMap = {
  sm: 'h-8 w-8 text-[11px]',
  md: 'h-10 w-10 text-sm',
  lg: 'h-16 w-16 text-xl',
  xl: 'h-24 w-24 text-3xl',
} as const;

export default function InitialsAvatar({
  name,
  email,
  size = 'md',
  imageUrl,
  className = '',
}: InitialsAvatarProps) {
  const [failed, setFailed] = useState(false);
  const initials = getInitials(name, email);
  const classes = `${sizeMap[size]} rounded-full shrink-0 overflow-hidden border border-brand-cyan/35 ${className}`;

  if (imageUrl && !failed) {
    return (
      <img
        src={imageUrl}
        alt={name || email || 'JAH Link'}
        className={`${classes} object-cover`}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div
      className={`${classes} inline-flex items-center justify-center bg-[linear-gradient(135deg,#006BFF,#00CFFF,#22C55E)] text-white font-black tracking-normal shadow-[0_0_24px_rgba(0,207,255,0.18)]`}
      aria-label={name || email || 'JAH Link'}
      title={name || email || 'JAH Link'}
    >
      {initials}
    </div>
  );
}
