import Link from 'next/link';
import { CalendarDays, UserCheck, UserPlus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AttendanceTrendProps {
  activeMembers: number;
  activeVisitors: number;
  groupCount: number;
}

export function AttendanceTrend({
  activeMembers,
  activeVisitors,
  groupCount,
}: AttendanceTrendProps) {
  return (
    <>
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardDescription className="flex items-center gap-2 text-xs font-medium">
            <UserCheck className="h-4 w-4" />
            Presença ativa
          </CardDescription>
          <CardTitle className="text-[22px] font-bold leading-none text-brand">{activeMembers}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 text-[13px] text-muted-foreground">
          Membros ativos em {groupCount} GC(s).
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardDescription className="flex items-center gap-2 text-xs font-medium">
            <UserPlus className="h-4 w-4" />
            Visitantes ativos
          </CardDescription>
          <CardTitle className="text-[22px] font-bold leading-none text-brand">{activeVisitors}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 text-[13px] text-muted-foreground">
          <Link
            href="/meetings/new"
            className="inline-flex items-center gap-1 font-semibold text-primary transition-colors hover:text-brand-hover hover:underline"
          >
            <CalendarDays className="h-4 w-4" />
            Registrar nova reunião
          </Link>
        </CardContent>
      </Card>
    </>
  );
}
