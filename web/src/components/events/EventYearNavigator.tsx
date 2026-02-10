'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EventYearNavigatorProps {
  currentYear: number;
  availableYears: number[];
}

export function EventYearNavigator({ currentYear, availableYears }: EventYearNavigatorProps) {
  const sortedYears = [...availableYears].sort((a, b) => b - a);
  const currentIndex = sortedYears.indexOf(currentYear);
  
  const prevYear = currentIndex < sortedYears.length - 1 ? sortedYears[currentIndex + 1] : null;
  const nextYear = currentIndex > 0 ? sortedYears[currentIndex - 1] : null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {prevYear ? (
        <Button variant="outline" size="sm" asChild>
          <Link href={`/events?year=${prevYear}`}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            {prevYear}
          </Link>
        </Button>
      ) : (
        <Button variant="outline" size="sm" disabled>
          <ChevronLeft className="h-4 w-4 mr-1" />
          -
        </Button>
      )}

      <div className="min-w-[84px] rounded-lg bg-slate-100 px-4 py-2 text-center">
        <span className="font-semibold text-slate-900">{currentYear}</span>
      </div>

      {nextYear ? (
        <Button variant="outline" size="sm" asChild>
          <Link href={`/events?year=${nextYear}`}>
            {nextYear}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      ) : (
        <Button variant="outline" size="sm" disabled>
          -
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      )}
    </div>
  );
}
