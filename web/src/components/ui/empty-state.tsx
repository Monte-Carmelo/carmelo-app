import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * EmptyState do Monte Carmelo DS — estado vazio acolhedor.
 * Elevado (branco + círculo de ícone soft-teal) ou sunken (paper-deep).
 */
export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  text?: string;
  action?: React.ReactNode;
  sunken?: boolean;
}

export function EmptyState({
  icon,
  title,
  text,
  action,
  sunken = false,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'rounded-card px-6 py-7 text-center',
        sunken ? 'bg-paper-deep' : 'bg-white shadow-sm',
        className,
      )}
      {...props}
    >
      {icon && (
        <div
          className={cn(
            'mx-auto mb-3.5 flex h-14 w-14 items-center justify-center rounded-full [&_svg]:h-7 [&_svg]:w-7',
            sunken ? 'bg-white text-forest' : 'bg-brand-soft text-brand-soft-fg',
          )}
        >
          {icon}
        </div>
      )}
      <h4 className="text-[15.5px] font-bold leading-snug text-foreground">
        {title}
      </h4>
      {text && (
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
          {text}
        </p>
      )}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
