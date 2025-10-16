'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Calendar, MapPin, Users, UserPlus } from 'lucide-react';
import type { GrowthGroupDashboardData, UpcomingMeeting } from '@/lib/supabase/queries/gc-dashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export interface GCDashboardProps {
  groups: GrowthGroupDashboardData[];
  upcomingMeetings: UpcomingMeeting[];
  isLoading?: boolean;
  error?: string | null;
}

const WEEKDAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const MODE_NAMES: Record<string, string> = {
  in_person: 'Presencial',
  online: 'Online',
  hybrid: 'Híbrido',
};

export function GCDashboard({ groups, upcomingMeetings, isLoading, error }: GCDashboardProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-sm text-muted-foreground">Carregando dados...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Erro ao carregar dados</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (groups.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-10">
          <Users className="mb-4 h-12 w-12 text-muted-foreground" />
          <CardTitle className="mb-2">Você não está associado a nenhum GC</CardTitle>
          <CardDescription>
            Entre em contato com seu coordenador para ser adicionado a um Grupo de Crescimento.
          </CardDescription>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header com ações rápidas */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meus Grupos de Crescimento</h1>
          <p className="mt-1 text-muted-foreground">Gerencie seus GCs, reuniões e membros</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/gc/reunioes">
            <Calendar className="mr-2 h-4 w-4" />
            Registrar reunião
          </Link>
        </Button>
      </div>

      {/* Lista de GCs */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Seus GCs</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <Card key={group.id} className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl">{group.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {MODE_NAMES[group.mode] || group.mode}
                    </CardDescription>
                  </div>
                  <Badge
                    variant={
                      group.status === 'active'
                        ? 'default'
                        : group.status === 'multiplying'
                          ? 'secondary'
                          : 'outline'
                    }
                  >
                    {group.status === 'active' ? 'Ativo' : group.status === 'multiplying' ? 'Multiplicando' : 'Inativo'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Informações do GC */}
                <div className="space-y-2 text-sm text-muted-foreground">
                  {group.weekday !== null && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {WEEKDAY_NAMES[group.weekday]} {group.time ? `às ${group.time.slice(0, 5)}` : ''}
                      </span>
                    </div>
                  )}
                  {group.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span className="line-clamp-1">{group.address}</span>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Estatísticas */}
                <div className="flex gap-4">
                  <div className="flex-1 text-center">
                    <p className="text-2xl font-bold">{group.memberCount}</p>
                    <p className="text-xs text-muted-foreground">Membros</p>
                  </div>
                  <Separator orientation="vertical" />
                  <div className="flex-1 text-center">
                    <p className="text-2xl font-bold">{group.visitorCount}</p>
                    <p className="text-xs text-muted-foreground">Visitantes</p>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => router.push(`/dashboard/gc/${group.id}`)}
                  >
                    Ver detalhes
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => router.push(`/dashboard/gc/reunioes?gcId=${group.id}`)}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Nova reunião
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Próximas reuniões */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Próximas reuniões</h2>
        {upcomingMeetings.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Calendar className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Nenhuma reunião agendada</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {upcomingMeetings.map((meeting) => {
              const meetingDate = new Date(meeting.datetime);
              const dateStr = meetingDate.toLocaleDateString('pt-BR', {
                weekday: 'short',
                day: '2-digit',
                month: 'short',
              });
              const timeStr = meetingDate.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <Card key={meeting.id} className="transition-shadow hover:shadow-md">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-16 w-16 flex-col items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <span className="text-xs font-medium uppercase">{dateStr.split(' ')[0]}</span>
                      <span className="text-xl font-bold">{dateStr.split(' ')[1]}</span>
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base">{meeting.lesson_title}</CardTitle>
                      <CardDescription className="mt-1">
                        {meeting.gc_name} • {timeStr}
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/dashboard/gc/reunioes/${meeting.id}`)}
                    >
                      Ver
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
