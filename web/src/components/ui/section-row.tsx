import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * SectionRow do Monte Carmelo DS — título de seção (bold 17px) com
 * link de ação opcional à direita ("Ver tudo", "Adicionar").
 */
export interface SectionRowProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  action?: React.ReactNode;
}

export function SectionRow({ title, action, className, ...props }: SectionRowProps) {
  return (
    <div
      className={cn('flex items-baseline justify-between gap-3 pb-2.5 pt-4', className)}
      {...props}
    >
      <h3 className="text-[17px] font-bold leading-tight text-foreground">{title}</h3>
      {action && (
        <span className="shrink-0 whitespace-nowrap text-xs font-semibold text-primary [&_a:hover]:text-brand-hover [&_button:hover]:text-brand-hover">
          {action}
        </span>
      )}
    </div>
  );
}
