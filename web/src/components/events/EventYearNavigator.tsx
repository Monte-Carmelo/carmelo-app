'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface EventYearNavigatorProps {
  currentYear: number;
  availableYears: number[];
}

export function EventYearNavigator({ currentYear, availableYears }: EventYearNavigatorProps) {
  const sortedYears = [...availableYears].sort((a, b) => b - a);
  const currentIndex = sortedYears.indexOf(currentYear);

  const prevYear = currentIndex < sortedYears.length - 1 ? sortedYears[currentIndex + 1] : null;
  const nextYear = currentIndex > 0 ? sortedYears[currentIndex - 1] : null;

  const pillLinkClass =
    'inline-flex items-center rounded-full bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-colors duration-fast ease-out-soft hover:bg-paper-deep';
  const pillDisabledClass =
    'inline-flex items-center rounded-full bg-white px-3.5 py-2 text-xs font-semibold text-slate-300 shadow-sm opacity-60';

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {prevYear ? (
        <Link href={`/events?year=${prevYear}`} className={pillLinkClass}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          {prevYear}
        </Link>
      ) : (
        <span className={pillDisabledClass}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          -
        </span>
      )}

      <div className="min-w-[84px] rounded-full bg-primary px-4 py-2 text-center">
        <span className="text-sm font-semibold text-white">{currentYear}</span>
      </div>

      {nextYear ? (
        <Link href={`/events?year=${nextYear}`} className={pillLinkClass}>
          {nextYear}
          <ChevronRight className="h-4 w-4 ml-1" />
        </Link>
      ) : (
        <span className={pillDisabledClass}>
          -
          <ChevronRight className="h-4 w-4 ml-1" />
        </span>
      )}
    </div>
  );
}
