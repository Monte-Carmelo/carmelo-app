'use client';

import { BarChart3, TrendingUp, UsersRound } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface ConversionBannerProps {
  meetingsCurrentMonth: number;
  averageAttendance: number;
  conversions30d: number;
  conversionRatePct: number;
}

export function ConversionBanner({
  meetingsCurrentMonth,
  averageAttendance,
  conversions30d,
  conversionRatePct,
}: ConversionBannerProps) {
  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="grid gap-4 p-4 md:grid-cols-4">
        <div className="flex items-center gap-2 text-sm">
          <BarChart3 className="h-4 w-4 text-primary" />
          <span className="text-muted-foreground">Reuniões no mês:</span>
          <strong>{meetingsCurrentMonth}</strong>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <UsersRound className="h-4 w-4 text-primary" />
          <span className="text-muted-foreground">Presença média:</span>
          <strong>{averageAttendance.toFixed(1)}</strong>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <TrendingUp className="h-4 w-4 text-primary" />
          <span className="text-muted-foreground">Conversões 30d:</span>
          <strong>{conversions30d}</strong>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <TrendingUp className="h-4 w-4 text-primary" />
          <span className="text-muted-foreground">Taxa conversão:</span>
          <strong>{conversionRatePct.toFixed(1)}%</strong>
        </div>
      </CardContent>
    </Card>
  );
}
