'use client';

import Link from 'next/link';

interface EventFilterProps {
  currentFilter: 'future' | 'all';
  currentYear: number;
}

export function EventFilter({ currentFilter, currentYear }: EventFilterProps) {

  const getFilterUrl = (filterType: 'future' | 'all') => {
    const params = new URLSearchParams();
    params.set('year', currentYear.toString());
    if (filterType === 'future') {
      params.set('filter', 'future');
    }
    return `/events?${params.toString()}`;
  };

  const pillClass = (active: boolean) =>
    active
      ? 'rounded-full bg-primary px-3.5 py-2 text-xs font-semibold text-white'
      : 'rounded-full bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-colors duration-fast ease-out-soft hover:bg-paper-deep';

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <span className="text-sm font-medium text-muted-foreground">Mostrar:</span>
      <Link href={getFilterUrl('future')} className={pillClass(currentFilter === 'future')}>
        Apenas Futuros
      </Link>
      <Link href={getFilterUrl('all')} className={pillClass(currentFilter === 'all')}>
        Todos do Ano
      </Link>
    </div>
  );
}
