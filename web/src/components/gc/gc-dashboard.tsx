'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Calendar, MapPin, Users } from 'lucide-react';
import type { GrowthGroupDashboardData, UpcomingMeeting } from '@/lib/supabase/queries/gc-dashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { ListItem } from '@/components/ui/list-item';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SectionRow } from '@/components/ui/section-row';
import { Separator } from '@/components/ui/separator';
import { Loading } from '@/components/ui/spinner';

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
        <Loading message="Carregando dados..." />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-danger-soft">
        <CardHeader>
          <CardTitle className="text-[17px] font-bold text-danger">Erro ao carregar dados</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-danger">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (groups.length === 0) {
    return (
      <EmptyState
        icon={<Users />}
        title="Você não está associado a nenhum GC"
        text="Entre em contato com seu coordenador para ser adicionado a um Grupo de Crescimento."
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Header com ações rápidas */}
      <ScreenHeader
        className="flex-col gap-4 sm:flex-row"
        title="Meus Grupos de Crescimento"
        subtitle="Gerencie seus GCs, reuniões e membros"
        action={
          <Button asChild>
            <Link href="/dashboard/gc/reunioes">
              <Calendar className="mr-2 h-4 w-4" />
              Registrar reunião
            </Link>
          </Button>
        }
      />

      {/* Lista de GCs */}
      <section>
        <SectionRow title="Seus GCs" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <Card key={group.id} className="transition-shadow duration-base ease-out-soft hover:shadow-lg">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-[17px] font-bold">{group.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {MODE_NAMES[group.mode] || group.mode}
                    </CardDescription>
                  </div>
                  <Badge
                    dot
                    variant={
                      group.status === 'active'
                        ? 'success'
                        : group.status === 'multiplying'
                          ? 'default'
                          : 'neutral'
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
                    <p className="text-[22px] font-bold leading-tight text-brand">{group.memberCount}</p>
                    <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">Membros</p>
                  </div>
                  <Separator orientation="vertical" />
                  <div className="flex-1 text-center">
                    <p className="text-[22px] font-bold leading-tight text-clay">{group.visitorCount}</p>
                    <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">Visitantes</p>
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
      <section>
        <SectionRow title="Próximas reuniões" />
        {upcomingMeetings.length === 0 ? (
          <EmptyState icon={<Calendar />} title="Nenhuma reunião agendada" />
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
                <ListItem
                  key={meeting.id}
                  className="transition-shadow duration-base ease-out-soft hover:shadow-md"
                  leading={
                    <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-card bg-brand-soft text-brand-soft-fg">
                      <span className="text-xs font-medium uppercase">{dateStr.split(' ')[0]}</span>
                      <span className="text-xl font-bold leading-tight">{dateStr.split(' ')[1]}</span>
                    </div>
                  }
                  title={meeting.lesson_title}
                  subtitle={`${meeting.gc_name} • ${timeStr}`}
                  trailing={
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/dashboard/gc/reunioes/${meeting.id}`)}
                    >
                      Ver
                    </Button>
                  }
                />
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
