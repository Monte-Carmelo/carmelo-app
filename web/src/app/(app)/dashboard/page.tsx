import Link from 'next/link';
import {
  BookOpen,
  ClipboardList,
  Mountain,
  PlusCircle,
  Share2,
  UserPlus,
  Users,
} from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { getAuthenticatedUser } from '@/lib/supabase/server-auth';
import { getLeaderHomeData, type LeaderHomeData } from '@/lib/dashboard/queries';
import { Avatar, AvatarStack } from '@/components/ui/avatar';
import { SectionRow } from '@/components/ui/section-row';
import { Button } from '@/components/ui/button';

const WEEKDAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

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

const SHORTCUTS = [
  {
    href: '/meetings/new',
    icon: PlusCircle,
    label: 'Novo encontro',
    sub: 'Marcar data e tema',
    tile: 'bg-brand-soft text-brand-soft-fg',
  },
  {
    href: '/visitors/new',
    icon: UserPlus,
    label: 'Visitante novo',
    sub: 'Registrar quem chegou',
    tile: 'bg-sage/35 text-forest',
  },
  {
    href: '/lessons',
    icon: BookOpen,
    label: 'Catálogo de lições',
    sub: 'Séries aprovadas',
    tile: 'bg-clay/[0.18] text-[#8A4A2C]',
  },
  {
    href: '/gc',
    icon: Users,
    label: 'Meu GC',
    sub: 'Membros e saúde',
    tile: 'bg-brand-soft text-brand-soft-fg',
  },
] as const;

function Hero({ nextMeeting, memberNames }: Pick<LeaderHomeData, 'nextMeeting' | 'memberNames'>) {
  if (!nextMeeting) {
    return (
      <div className="relative overflow-hidden rounded-hero bg-white p-6 shadow-md">
        <span className="eyebrow">Seu GC</span>
        <h2 className="mt-2 text-[22px] font-bold leading-snug text-foreground">
          Nenhum encontro marcado ainda
        </h2>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">
          Marque o primeiro encontro pra começar a registrar presença e visitantes.
        </p>
        <Button asChild className="mt-4">
          <Link href="/meetings/new">
            <PlusCircle className="h-4 w-4" />
            Marcar encontro
          </Link>
        </Button>
      </div>
    );
  }

  const weekday =
    nextMeeting.weekday !== null ? WEEKDAY_NAMES[nextMeeting.weekday] : null;
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
        {nextMeeting.gcName}
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
          <a
            href={`https://wa.me/?text=${shareText}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Share2 className="h-4 w-4" />
          </a>
        </Button>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const user = await getAuthenticatedUser();
  const supabase = await createSupabaseServerClient();
  const home: LeaderHomeData = user
    ? await getLeaderHomeData(supabase, user.id)
    : { leaderName: null, nextMeeting: null, memberNames: [], currentSeries: null };

  const now = new Date();
  const name = firstName(home.leaderName);
  const series = home.currentSeries;
  const progress =
    series && series.totalLessons > 0
      ? Math.min(100, Math.round((series.currentOrder / series.totalLessons) * 100))
      : 0;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-1 px-4 py-8">
      <header>
        <span className="eyebrow">
          {greetingFor(now)}
          {name ? `, ${name}` : ''}
        </span>
        <h1 className="mt-1.5 text-[26px] font-bold leading-tight tracking-tight text-foreground md:text-[28px]">
          {home.nextMeeting ? 'Seu próximo encontro está chegando' : 'Cuide do seu GC'}
        </h1>
      </header>

      <div className="pt-4">
        <Hero nextMeeting={home.nextMeeting} memberNames={home.memberNames} />
      </div>

      <SectionRow title="Atalhos do líder" />
      <div className="grid grid-cols-2 gap-2.5">
        {SHORTCUTS.map((shortcut) => {
          const Icon = shortcut.icon;
          return (
            <Link
              key={shortcut.href}
              href={shortcut.href}
              className="flex flex-col items-start gap-2.5 rounded-card bg-white p-3.5 text-left shadow-sm transition-colors duration-fast ease-out-soft hover:bg-paper-deep/50"
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${shortcut.tile}`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-[13.5px] font-bold leading-tight text-foreground">
                  {shortcut.label}
                </span>
                <span className="mt-0.5 block text-[11.5px] leading-snug text-muted-foreground">
                  {shortcut.sub}
                </span>
              </span>
            </Link>
          );
        })}
      </div>

      {series && (
        <>
          <SectionRow
            title="Série atual"
            action={<Link href="/lessons">Ver lições</Link>}
          />
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
    </div>
  );
}
