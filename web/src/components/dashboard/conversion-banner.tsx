import { BarChart3, TrendingUp, UsersRound } from 'lucide-react';

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
    <div className="grid gap-4 rounded-card bg-brand-soft p-4 md:grid-cols-4">
      <div className="flex items-center gap-2 text-sm">
        <BarChart3 className="h-4 w-4 shrink-0 text-brand-soft-fg" />
        <span className="text-brand-soft-fg/80">Reuniões no mês:</span>
        <strong className="text-brand-soft-fg">{meetingsCurrentMonth}</strong>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <UsersRound className="h-4 w-4 shrink-0 text-brand-soft-fg" />
        <span className="text-brand-soft-fg/80">Presença média:</span>
        <strong className="text-brand-soft-fg">{averageAttendance.toFixed(1)}</strong>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <TrendingUp className="h-4 w-4 shrink-0 text-brand-soft-fg" />
        <span className="text-brand-soft-fg/80">Conversões 30d:</span>
        <strong className="text-brand-soft-fg">{conversions30d}</strong>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <TrendingUp className="h-4 w-4 shrink-0 text-brand-soft-fg" />
        <span className="text-brand-soft-fg/80">Taxa conversão:</span>
        <strong className="text-brand-soft-fg">{conversionRatePct.toFixed(1)}%</strong>
      </div>
    </div>
  );
}
