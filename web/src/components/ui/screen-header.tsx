import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * ScreenHeader do Monte Carmelo DS — anatomia de cabeçalho de tela:
 * eyebrow (contexto) + título bold + subtítulo muted + ação opcional à direita.
 */
export interface ScreenHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  eyebrow?: string;
  title: string;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
}

export function ScreenHeader({
  eyebrow,
  title,
  subtitle,
  action,
  className,
  ...props
}: ScreenHeaderProps) {
  return (
    <header
      className={cn(
        'flex items-start justify-between gap-3',
        className,
      )}
      {...props}
    >
      <div className="min-w-0">
        {eyebrow && <span className="eyebrow whitespace-nowrap">{eyebrow}</span>}
        <h1
          className={cn(
            'text-[26px] font-bold leading-tight tracking-tight text-foreground md:text-[28px]',
            eyebrow && 'mt-1.5',
          )}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="mt-1 shrink-0">{action}</div>}
    </header>
  );
}
