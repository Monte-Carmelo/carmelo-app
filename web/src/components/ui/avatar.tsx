import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Avatar do Monte Carmelo DS — círculo com iniciais ou ícone.
 * Paleta da marca (b1-b5) atribuída por índice/nome, ou variante soft
 * (paper-deep + forest) para tiles de ícone em listas.
 */

const AVATAR_TONES = [
  'bg-brand text-white',
  'bg-forest text-white',
  'bg-clay text-white',
  'bg-sage text-white',
  'bg-slate-500 text-white',
] as const;

const SOFT_TONES = {
  paper: 'bg-paper-deep text-forest',
  brand: 'bg-brand-soft text-brand-soft-fg',
  sage: 'bg-sage/35 text-forest',
  clay: 'bg-clay/[0.18] text-[#8A4A2C]',
  warn: 'bg-warn-soft text-warn-fg',
  danger: 'bg-danger-soft text-danger',
} as const;

const SIZES = {
  sm: 'h-8 w-8 text-[11px]',
  md: 'h-11 w-11 text-sm',
  lg: 'h-14 w-14 text-[17px]',
} as const;

export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Nome completo — vira iniciais (2 letras) e define o tom da paleta */
  name?: string;
  /** Índice explícito na paleta b1-b5 (sobrepõe o hash do nome) */
  toneIndex?: number;
  /** Tom soft para tiles de ícone (paper/brand/sage/clay/warn/danger) */
  soft?: keyof typeof SOFT_TONES;
  size?: keyof typeof SIZES;
  children?: React.ReactNode;
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return '?';
  const first = parts[0][0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? '') : '';
  return (first + last).toUpperCase();
}

function hashName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function Avatar({
  name,
  toneIndex,
  soft,
  size = 'md',
  className,
  children,
  ...props
}: AvatarProps) {
  const tone = soft
    ? SOFT_TONES[soft]
    : AVATAR_TONES[
        (toneIndex ?? (name ? hashName(name) : 0)) % AVATAR_TONES.length
      ];

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-bold leading-none',
        SIZES[size],
        tone,
        className,
      )}
      {...props}
    >
      {children ?? (name ? getInitials(name) : null)}
    </span>
  );
}

/** Pilha de avatares sobrepostos (avatar-stack do DS) */
export function AvatarStack({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex [&>*]:shadow-[0_0_0_2.5px_#fff] [&>*+*]:-ml-2.5',
        className,
      )}
    >
      {children}
    </div>
  );
}
