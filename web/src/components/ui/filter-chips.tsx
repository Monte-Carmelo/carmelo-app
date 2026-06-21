'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * FilterChips do Monte Carmelo DS — fila horizontal de chips de filtro.
 * Ativo: preenchido em forest (brand-deep). Inativo: card branco com sombra.
 */
export interface FilterChipOption {
  id: string;
  label: string;
}

export interface FilterChipsProps {
  options: FilterChipOption[];
  value: string;
  onValueChange: (id: string) => void;
  className?: string;
}

export function FilterChips({
  options,
  value,
  onValueChange,
  className,
}: FilterChipsProps) {
  return (
    <div
      className={cn(
        'flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        className,
      )}
    >
      {options.map((option) => {
        const active = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={active}
            onClick={() => onValueChange(option.id)}
            className={cn(
              'shrink-0 whitespace-nowrap rounded-full px-3.5 py-2 text-xs font-semibold transition-colors duration-fast ease-out-soft active:scale-95',
              active
                ? 'bg-brand-deep text-white'
                : 'bg-white text-slate-700 shadow-sm hover:bg-paper-deep',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
