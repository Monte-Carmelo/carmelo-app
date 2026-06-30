import Link from 'next/link';
import { BookOpen, CalendarPlus, ChevronRight, ClipboardList, Mountain, Share2, Users } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { getAuthenticatedUser } from '@/lib/supabase/server-auth';
import { getLeaderHomeData, type LeaderHomeData, type LeaderHomeGc } from '@/lib/dashboard/queries';
import { Avatar, AvatarStack } from '@/components/ui/avatar';
import { SectionRow } from '@/components/ui/section-row';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';

const WEEKDAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const MODE_NAMES: Record<string, string> = { in_person: 'Presencial', online: 'Online', hybrid: 'Híbrido' };

function greetingFor(now: Date) {
  const hour = Number(
    now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo', hour: 'numeric', hour12: false }),
  );
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function firstName(fullName: string | null) {
  if (!fullName) return null;
  return fullName.trim().split(/\s+/)[0] ?? null;
}

function formatMeetingDate(iso: string) {
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

function scheduleLabel(gc: LeaderHomeGc) {
  const bits = [
    gc.weekday !== null ? WEEKDAY_NAMES[gc.weekday] : null,
    gc.time ? `às ${gc.time.slice(0, 5)}` : null,
  ].filter(Boolean);
  return bits.length > 0 ? bits.join(' ') : (MODE_NAMES[gc.mode] ?? gc.mode);
}

type NextMeeting = NonNullable<LeaderHomeData['nextMeeting']>;

function Hero({ nextMeeting, memberNames }: { nextMeeting: NextMeeting; memberNames: string[] }) {
  const weekday = nextMeeting.weekday !== null ? WEEKDAY_NAMES[nextMeeting.weekday] : null;
  const overflow = nextMeeting.memberCount - memberNames.length;
  const shareText = encodeURIComponent(
    `Encontro do ${nextMeeting.gcName}: ${nextMeeting.lessonTitle} — ${formatMeetingDate(nextMeeting.datetime)}`,
  );

  return (
    <div className="relative overflow-hidden rounded-hero bg-white p-6 shadow-md">
      <Mountain
        className="pointer-events-none absolute -right-3 -top-3 h-20 w-20 text-brand-soft"
        strokeWidth={1.2}
        aria-hidden
      />
      <span className="eyebrow">Próximo encontro</span>
      <h2 className="mt-2 text-[22px] font-bold leading-snug text-foreground">
        {nextMeeting.lessonTitle}
      </h2>
      <p className="mt-1.5 text-[13.5px] font-medium leading-relaxed text-slate-700">
        <Link href={`/gc/${nextMeeting.gcId}`} className="hover:text-brand-hover hover:underline">
          {nextMeeting.gcName}
        </Link>
        {weekday ? ` · ${weekday}` : ''} · {formatMeetingDate(nextMeeting.datetime)}
      </p>
      <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">
        {nextMeeting.address ?? 'Local a combinar'} · {nextMeeting.memberCount}{' '}
        {nextMeeting.memberCount === 1 ? 'membro' : 'membros'}
      </p>

      {memberNames.length > 0 && (
        <AvatarStack className="mt-4">
          {memberNames.map((name, index) => (
            <Avatar key={`${name}-${index}`} name={name} toneIndex={index} />
          ))}
          {overflow > 0 && (
            <Avatar soft="paper" aria-hidden>
              +{overflow}
            </Avatar>
          )}
        </AvatarStack>
      )}

      <div className="mt-4 flex gap-2">
        <Button asChild className="flex-1">
          <Link href={`/meetings/${nextMeeting.id}`}>
            <ClipboardList className="h-4 w-4" />
            Gerir encontro
          </Link>
        </Button>
        <Button asChild variant="outline" size="icon" aria-label="Compartilhar convite no WhatsApp">
          <a href={`https://wa.me/?text=${shareText}`} target="_blank" rel="noopener noreferrer">
            <Share2 className="h-4 w-4" />
          </a>
        </Button>
      </div>
    </div>
  );
}

function GcCard({ gc }: { gc: LeaderHomeGc }) {
  return (
    <Link
      href={`/gc/${gc.id}`}
      className="block rounded-card bg-white p-4 shadow-sm transition-colors duration-fast ease-out-soft hover:bg-paper-deep/40"
    >
      <div className="flex items-center gap-3.5">
        <Avatar soft="brand" size="md" aria-hidden>
          <Users className="h-5 w-5" />
        </Avatar>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[15px] font-bold leading-tight text-foreground">{gc.name}</h3>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{scheduleLabel(gc)}</p>
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
      </div>
      <div className="mt-3 flex items-center gap-4 border-t border-divider pt-3 text-xs text-muted-foreground">
        <span>
          <strong className="text-foreground">{gc.memberCount}</strong> membros
        </span>
        <span>
          <strong className="text-foreground">{gc.visitorCount}</strong> visitantes
        </span>
        <span className="ml-auto inline-flex items-center gap-0.5 font-semibold text-primary">
          Administrar
          <ChevronRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}

export default async function DashboardPage() {
  const user = await getAuthenticatedUser();
  const supabase = await createSupabaseServerClient();
  const home: LeaderHomeData = user
    ? await getLeaderHomeData(supabase, user.id)
    : { leaderName: null, ledGcs: [], nextMeeting: null, memberNames: [], currentSeries: null };

  const now = new Date();
  const name = firstName(home.leaderName);
  const { nextMeeting, ledGcs, currentSeries: series } = home;
  const primaryGc = ledGcs[0] ?? null;
  const progress =
    series && series.totalLessons > 0
      ? Math.min(100, Math.round((series.currentOrder / series.totalLessons) * 100))
      : 0;

  const title = nextMeeting
    ? 'Seu próximo encontro está chegando'
    : ledGcs.length > 0
      ? 'Cuide do seu GC'
      : 'Bem-vindo';

  return (
    <div className="mx-auto w-full max-w-2xl space-y-1 px-4 py-8">
      <header>
        <span className="eyebrow">
          {greetingFor(now)}
          {name ? `, ${name}` : ''}
        </span>
        <h1 className="mt-1.5 text-[26px] font-bold leading-tight tracking-tight text-foreground md:text-[28px]">
          {title}
        </h1>
      </header>

      {nextMeeting && (
        <div className="pt-4">
          <Hero nextMeeting={nextMeeting} memberNames={home.memberNames} />
        </div>
      )}

      {ledGcs.length > 0 && (
        <>
          <SectionRow title={ledGcs.length === 1 ? 'Meu GC' : 'Meus GCs'} />
          <div className="space-y-2.5">
            {ledGcs.map((gc) => (
              <GcCard key={gc.id} gc={gc} />
            ))}
          </div>
        </>
      )}

      {!nextMeeting && primaryGc && (
        <>
          <SectionRow title="Próximo encontro" />
          <div className="flex flex-col gap-3 rounded-card bg-white p-4 shadow-sm sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <p className="text-[14.5px] font-bold leading-tight text-foreground">
                Nenhum encontro marcado
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Marque o próximo encontro de {primaryGc.name}.
              </p>
            </div>
            <Button asChild className="w-full sm:w-auto">
              <Link href={`/meetings/new?gcId=${primaryGc.id}`}>
                <CalendarPlus className="h-4 w-4" />
                Marcar encontro
              </Link>
            </Button>
          </div>
        </>
      )}

      {series && (
        <>
          <SectionRow title="Série atual" action={<Link href="/lessons">Ver lições</Link>} />
          <div className="flex items-center gap-3.5 rounded-card bg-white p-4 shadow-sm">
            <Avatar soft="paper" size="md" aria-hidden>
              <BookOpen className="h-5 w-5" />
            </Avatar>
            <div className="min-w-0 flex-1">
              <h4 className="truncate text-[14.5px] font-bold leading-tight text-foreground">
                {series.name}
              </h4>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                Lição {series.currentOrder}
                {series.totalLessons > 0 ? ` de ${series.totalLessons}` : ''}
                {series.nextLessonTitle ? ` · ${series.nextLessonTitle}` : ''}
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-paper-deep">
                <div className="h-full rounded-full bg-brand" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>
        </>
      )}

      {ledGcs.length === 0 && !nextMeeting && (
        <div className="pt-4">
          <EmptyState
            icon={<Users />}
            title="Você ainda não administra um GC"
            text="Quando a liderança te vincular a um Grupo de Crescimento, ele aparece aqui pra você administrar."
          />
        </div>
      )}
    </div>
  );
}
