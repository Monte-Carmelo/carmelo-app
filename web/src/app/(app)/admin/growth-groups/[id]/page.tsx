import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Check, GitFork, Pencil, TrendingUp } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { getAdminGcDetail } from '@/lib/admin/gc-detail';
import { GC_HEALTH_META } from '@/lib/admin/gc-health';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ListItem } from '@/components/ui/list-item';
import { SectionRow } from '@/components/ui/section-row';
import { Sparkline } from '@/components/ui/sparkline';
import { Loading } from '@/components/ui/spinner';

interface PageProps {
  params: Promise<{ id: string }>;
}

const WEEKDAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const MODE_LABELS: Record<string, string> = {
  in_person: 'Presencial',
  online: 'Online',
  hybrid: 'Híbrido',
};

function formatDate(iso: string) {
  return new Date(iso)
    .toLocaleString('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo',
    })
    .replace(/\.,/g, ',')
    .replace(/\./g, '');
}

function shortDate(iso: string) {
  return new Date(iso)
    .toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', timeZone: 'America/Sao_Paulo' })
    .replace('.', '');
}

function formatTime(time: string | null) {
  if (!time) return null;
  const match = /^(\d{2}:\d{2})/.exec(time);
  return match ? match[1] : time;
}

async function GcDetailContent({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const gc = await getAdminGcDetail(supabase, id);

  if (!gc) {
    notFound();
  }

  const health = GC_HEALTH_META[gc.health];
  const weekday = gc.weekday !== null ? WEEKDAY_NAMES[gc.weekday] : null;
  const scheduleBits = [weekday ? `${weekday}s` : null, formatTime(gc.time)]
    .filter(Boolean)
    .join(', ');
  const eyebrow = [scheduleBits, MODE_LABELS[gc.mode]].filter(Boolean).join(' · ');
  const leaderNames = gc.leaders.map((l) => l.name).join(', ');

  return (
    <div className="space-y-2">
      <Link
        href="/admin/growth-groups"
        className="inline-flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar para GCs
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-3 pt-2">
        <div className="min-w-0">
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <h1 className="mt-1.5 text-[26px] font-bold leading-tight tracking-tight text-foreground md:text-[28px]">
            {gc.name}
          </h1>
          <p className="mt-1.5 text-[13.5px] text-muted-foreground">
            {leaderNames ? `Liderado por ${leaderNames}` : 'Sem líder definido'} · {gc.peopleCount}{' '}
            {gc.peopleCount === 1 ? 'pessoa' : 'pessoas'}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {gc.status !== 'active' && (
              <Badge variant="neutral">
                {gc.status === 'inactive'
                  ? 'Inativo'
                  : gc.status === 'multiplying'
                    ? 'Multiplicando'
                    : 'Multiplicado'}
              </Badge>
            )}
            <Badge variant={health.variant} dot>
              {health.label}
            </Badge>
            {gc.averageAttendancePct !== null && (
              <Badge variant="neutral">
                <TrendingUp className="h-3 w-3" />
                {gc.averageAttendancePct}% presença
              </Badge>
            )}
          </div>
        </div>
        <Button asChild variant="outline" size="sm" className="mt-1 shrink-0">
          <Link href={`/admin/growth-groups/${gc.id}/edit`}>
            <Pencil className="h-4 w-4" />
            Editar
          </Link>
        </Button>
      </div>

      {/* Presence sparkline */}
      {gc.attendanceSeries.length >= 2 && (
        <div className="mt-3 rounded-card bg-white p-4 shadow">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-xs font-semibold text-muted-foreground">
              Presença · últimos {gc.attendanceSeries.length} encontros
            </span>
            {gc.attendanceDeltaPp !== null && (
              <span
                className={`text-sm font-bold ${
                  gc.attendanceDeltaPp >= 0 ? 'text-success' : 'text-danger'
                }`}
              >
                {gc.attendanceDeltaPp >= 0 ? '+' : ''}
                {gc.attendanceDeltaPp}pp
              </span>
            )}
          </div>
          <Sparkline data={gc.attendanceSeries} />
        </div>
      )}

      {/* Multiplication */}
      {gc.status === 'active' && (
        <>
          <SectionRow title="Multiplicação" />
          <div className="rounded-card bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <Avatar soft="sage" size="md" aria-hidden>
                <GitFork className="h-5 w-5" />
              </Avatar>
              <div className="min-w-0 flex-1">
                <h4 className="text-[14.5px] font-bold leading-snug text-foreground">
                  Pronto para multiplicar?
                </h4>
                <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
                  Quando o GC está saudável e tem um líder em formação, ele pode se dividir em
                  dois — o novo GC nasce em acompanhamento próximo.
                </p>
              </div>
            </div>
            <Button asChild className="mt-3.5 w-full">
              <Link href={`/admin/growth-groups/${gc.id}/multiply`}>
                <GitFork className="h-4 w-4" />
                Iniciar multiplicação
              </Link>
            </Button>
          </div>
        </>
      )}

      {/* Leaders */}
      {gc.leaders.length > 0 && (
        <>
          <SectionRow title={gc.leaders.length === 1 ? 'Líder' : 'Líderes'} />
          <div className="space-y-2">
            {gc.leaders.map((leader, index) => (
              <ListItem
                key={`${leader.name}-${index}`}
                leading={<Avatar name={leader.name} toneIndex={index} />}
                title={leader.name}
                subtitle="Líder"
              />
            ))}
          </div>
        </>
      )}

      {/* Next meeting */}
      {gc.nextMeeting && (
        <>
          <SectionRow title="Próximo encontro" />
          <div className="rounded-card bg-white p-4 shadow-sm">
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <span className="text-[15px] font-bold text-foreground">
                {formatDate(gc.nextMeeting.datetime)}
              </span>
              <Badge variant="success">Agendado</Badge>
            </div>
            <p className="text-[13px] leading-relaxed text-muted-foreground">
              {gc.nextMeeting.lessonTitle}
            </p>
          </div>
        </>
      )}

      {/* History */}
      {gc.history.length > 0 && (
        <>
          <SectionRow title="Histórico recente" />
          <div className="space-y-2">
            {gc.history.map((item) => (
              <ListItem
                key={item.id}
                leading={
                  <Avatar soft="paper" size="md" aria-hidden>
                    <Check className="h-5 w-5" />
                  </Avatar>
                }
                title={item.title}
                subtitle={shortDate(item.date)}
                trailing={
                  <Badge variant={item.present >= item.total ? 'success' : 'warn'}>
                    {item.present}/{item.total}
                  </Badge>
                }
              />
            ))}
          </div>
        </>
      )}

      <div className="h-4" />
    </div>
  );
}

export default function AdminGrowthGroupDetailPage({ params }: PageProps) {
  return (
    <Suspense fallback={<Loading message="Carregando GC..." />}>
      <GcDetailContent params={params} />
    </Suspense>
  );
}
