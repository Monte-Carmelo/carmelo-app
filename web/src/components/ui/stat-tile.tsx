import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * StatTile do Monte Carmelo DS — indicador compacto em card branco
 * (número grande no tom da marca + label muted), usado em grids de 3.
 */
const VALUE_TONES = {
  brand: 'text-brand',
  forest: 'text-forest',
  clay: 'text-clay',
  success: 'text-success',
  info: 'text-info',
  warn: 'text-warn',
  danger: 'text-danger',
  neutral: 'text-slate-700',
} as const;

export interface StatTileProps extends React.HTMLAttributes<HTMLDivElement> {
  value: React.ReactNode;
  label: string;
  tone?: keyof typeof VALUE_TONES;
  centered?: boolean;
}

export function StatTile({
  value,
  label,
  tone = 'brand',
  centered = false,
  className,
  ...props
}: StatTileProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-1 rounded-card bg-white px-3 py-3.5 shadow-sm',
        centered && 'items-center text-center',
        className,
      )}
      {...props}
    >
      <span className={cn('text-[22px] font-bold leading-none', VALUE_TONES[tone])}>
        {value}
      </span>
      <span className="text-[11px] font-medium leading-snug text-muted-foreground">
        {label}
      </span>
    </div>
  );
}
