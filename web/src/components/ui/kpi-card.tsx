import * as React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * KpiCard do Monte Carmelo DS — indicador de painel: label muted, valor
 * grande no tom da marca e uma linha de "delta" opcional (variação no
 * período) com seta e cor semântica. Usado em grids 2x2 / 1x4.
 */
const DELTA_TONES = {
  success: 'text-success',
  warn: 'text-warn',
  danger: 'text-danger',
  neutral: 'text-muted-foreground',
} as const;

export interface KpiCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: React.ReactNode;
  /** Texto da variação no período (ex.: "+2 este mês") */
  delta?: React.ReactNode;
  deltaTone?: keyof typeof DELTA_TONES;
  /** Seta do delta — up (alta), down (baixa) ou none (sem seta) */
  deltaDirection?: 'up' | 'down' | 'none';
  /** Ícone customizado do delta (sobrepõe a seta) */
  deltaIcon?: React.ReactNode;
}

export function KpiCard({
  label,
  value,
  delta,
  deltaTone = 'success',
  deltaDirection = 'none',
  deltaIcon,
  className,
  ...props
}: KpiCardProps) {
  const DirectionIcon =
    deltaDirection === 'up' ? ArrowUp : deltaDirection === 'down' ? ArrowDown : null;

  return (
    <div
      className={cn(
        'flex flex-col gap-1 rounded-2xl bg-white px-3.5 py-3.5 shadow-sm',
        className,
      )}
      {...props}
    >
      <span className="text-[11px] font-medium leading-tight text-muted-foreground">
        {label}
      </span>
      <span className="text-2xl font-bold leading-none text-foreground">{value}</span>
      {delta != null && (
        <span
          className={cn(
            'mt-0.5 inline-flex items-center gap-1 whitespace-nowrap text-[11px] font-semibold',
            DELTA_TONES[deltaTone],
          )}
        >
          {deltaIcon ?? (DirectionIcon && <DirectionIcon className="h-3 w-3" aria-hidden />)}
          {delta}
        </span>
      )}
    </div>
  );
}
