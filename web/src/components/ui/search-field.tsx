import * as React from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * SearchField do Monte Carmelo DS — campo de busca em card branco
 * (lupa + input limpo, sem borda), com slot trailing opcional (ex.: funil).
 */
export interface SearchFieldProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  containerClassName?: string;
  trailing?: React.ReactNode;
}

export const SearchField = React.forwardRef<HTMLInputElement, SearchFieldProps>(
  ({ className, containerClassName, trailing, ...props }, ref) => (
    <div
      className={cn(
        'flex items-center gap-2.5 rounded-xl bg-white px-3.5 py-3 shadow-sm',
        containerClassName,
      )}
    >
      <Search className="h-[18px] w-[18px] shrink-0 text-slate-500" aria-hidden />
      <input
        ref={ref}
        type="search"
        className={cn(
          'min-w-0 flex-1 bg-transparent text-sm leading-none text-foreground outline-none placeholder:text-muted-foreground',
          className,
        )}
        {...props}
      />
      {trailing}
    </div>
  ),
);
SearchField.displayName = 'SearchField';
