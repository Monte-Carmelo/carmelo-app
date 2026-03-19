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
      <Card>
        <CardHeader className="pb-2">
          <CardDescription className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Presença ativa
          </CardDescription>
          <CardTitle>{activeMembers}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 text-sm text-text-light">
          Membros ativos em {groupCount} GC(s).
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Visitantes ativos
          </CardDescription>
          <CardTitle>{activeVisitors}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 text-sm text-text-light">
          <Link href="/meetings/new" className="inline-flex items-center gap-1 text-primary hover:underline">
            <CalendarDays className="h-4 w-4" />
            Registrar nova reunião
          </Link>
        </CardContent>
      </Card>
    </>
  );
}
