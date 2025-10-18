'use client';

import { useState } from 'react';
import Image from 'next/image';
import { BRANDING } from '@/lib/constants/branding';

interface LogoProps {
  variant?: 'default' | 'compact';
  className?: string;
}

export function Logo({ variant = 'default', className = '' }: LogoProps) {
  const [imageError, setImageError] = useState(false);

  if (imageError) {
    return (
      <h1 className={`text-lg font-semibold text-text-dark ${className}`}>
        {BRANDING.logo.fallbackText}
      </h1>
    );
  }

  return (
    <div className={`flex items-center ${className}`}>
      <Image
        src={BRANDING.logo.path}
        alt={BRANDING.logo.altText}
        width={variant === 'compact' ? 40 : 160}
        height={variant === 'compact' ? 40 : 53}
        onError={() => setImageError(true)}
        priority
        className="object-contain"
      />
    </div>
  );
}
