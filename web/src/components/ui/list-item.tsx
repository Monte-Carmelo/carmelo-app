import * as React from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * ListItem do Monte Carmelo DS — linha de lista em card branco:
 * leading (avatar/ícone) + título bold + subtítulo muted + trailing (chip/caret).
 *
 * Use solto (card individual, radius 14 + sombra) ou dentro de <ListGroup>
 * (card único com divisores internos).
 */
export interface ListItemProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  leading?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  trailing?: React.ReactNode;
  caret?: boolean;
  /** Quando true, remove card próprio (para uso dentro de ListGroup) */
  grouped?: boolean;
}

export function ListItem({
  leading,
  title,
  subtitle,
  trailing,
  caret = false,
  grouped = false,
  className,
  onClick,
  ...props
}: ListItemProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-4 py-3.5',
        !grouped && 'rounded-card bg-white shadow-sm',
        onClick &&
          'cursor-pointer transition-colors duration-fast ease-out-soft hover:bg-paper-deep/50 active:bg-paper-deep',
        className,
      )}
      {...props}
    >
      {leading}
      <div className="min-w-0 flex-1">
        <h4 className="truncate text-[14.5px] font-bold leading-tight text-foreground">
          {title}
        </h4>
        {subtitle && (
          <p className="mt-0.5 truncate text-xs leading-snug text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>
      {trailing}
      {caret && <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />}
    </div>
  );
}

/** Agrupa ListItems num card único com divisores (padrão chamada/conta do DS) */
export function ListGroup({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-card bg-white shadow-sm [&>*+*]:border-t [&>*+*]:border-divider',
        className,
      )}
    >
      {children}
    </div>
  );
}
