'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

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

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <span className="text-sm font-medium text-slate-700">Mostrar:</span>
      <div className="flex flex-wrap rounded-lg border border-slate-200 p-1">
        <Button
          variant={currentFilter === 'future' ? 'default' : 'ghost'}
          size="sm"
          asChild
          className="h-8"
        >
          <Link href={getFilterUrl('future')}>
            Apenas Futuros
          </Link>
        </Button>
        <Button
          variant={currentFilter === 'all' ? 'default' : 'ghost'}
          size="sm"
          asChild
          className="h-8"
        >
          <Link href={getFilterUrl('all')}>
            Todos do Ano
          </Link>
        </Button>
      </div>
    </div>
  );
}
