import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { ArrowLeft, BookOpen, Check, ClipboardList, HandHeart } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { getAuthenticatedUser } from '@/lib/supabase/server-auth';
import { translateRole } from '@/lib/role-translations';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SectionRow } from '@/components/ui/section-row';
import { StatTile } from '@/components/ui/stat-tile';
import { ListGroup, ListItem } from '@/components/ui/list-item';
import { Loading } from '@/components/ui/spinner';

interface MeetingDetailProps {
  params: Promise<{ id: string }>;
}

const SP = 'America/Sao_Paulo';

async function MeetingDetailContent({ id }: { id: string }) {
  const user = await getAuthenticatedUser();
  if (!user) {
    notFound();
  }

  const supabase = await createSupabaseServerClient();

  const { data: meeting, error } = await supabase
    .from('meetings')
    .select(
      `id, datetime, lesson_title, lesson_template_id, comments, taught_by,
       growth_groups ( id, name ),
       meeting_member_attendance ( participant_id ),
       meeting_visitor_attendance (
         visitor_id,
         visitors ( visit_count, people:people ( name ) )
       )`,
    )
    .eq('id', id)
    .single();

  if (error || !meeting) {
    notFound();
  }

  const gc = (meeting.growth_groups ?? null) as { id?: string; name?: string | null } | null;
  const gcName = gc?.name ?? 'GC';

  // Full active roster of the GC (to show present + absent like the kit's chamada)
  const { data: rosterData } = gc?.id
    ? await supabase
        .from('growth_group_participants')
        .select('id, role, people:people ( name )')
        .eq('gc_id', gc.id)
        .eq('status', 'active')
        .is('deleted_at', null)
    : { data: [] };

  const roster = ((rosterData ?? []) as Array<{
    id: string;
    role: string;
    people?: { name?: string | null } | null;
  }>).map((r) => ({ id: r.id, role: r.role, name: r.people?.name ?? 'Sem nome' }));

  const presentSet = new Set(
    ((meeting.meeting_member_attendance ?? []) as Array<{ participant_id: string | null }>)
      .map((a) => a.participant_id)
      .filter((pid): pid is string => Boolean(pid)),
  );

  const attendance = roster
    .map((member) => ({ ...member, present: presentSet.has(member.id) }))
    .sort((a, b) => {
      if (a.present !== b.present) return a.present ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

  const presentCount = attendance.filter((a) => a.present).length || presentSet.size;
  const absentCount = Math.max(0, roster.length - presentCount);

  const visitors = ((meeting.meeting_visitor_attendance ?? []) as Array<{
    visitors?: { visit_count?: number | null; people?: { name?: string | null } | null } | null;
  }>).map((record) => ({
    name: record.visitors?.people?.name ?? 'Visitante',
    visitCount: record.visitors?.visit_count ?? 0,
  }));

  const date = new Date(meeting.datetime);
  const eyebrow = `${date
    .toLocaleDateString('pt-BR', { weekday: 'long', timeZone: SP })
    .replace(/^\w/, (c) => c.toUpperCase())} · ${date
    .toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', timeZone: SP })
    .replace('.', '')} · ${date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: SP,
  })}`;

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-2 px-4 py-8">
      <Link
        href="/meetings"
        className="inline-flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar para encontros
      </Link>

      <ScreenHeader
        className="pt-2"
        eyebrow={eyebrow}
        title={meeting.lesson_title}
        subtitle={`${gcName} · ${presentCount} ${
          presentCount === 1 ? 'presente' : 'presentes'
        } · ${visitors.length} ${visitors.length === 1 ? 'visitante' : 'visitantes'}`}
        action={
          <Button asChild variant="outline" size="sm">
            <Link href={`/meetings/${meeting.id}/edit`}>
              <ClipboardList className="h-4 w-4" />
              Gerir presença
            </Link>
          </Button>
        }
      />

      {meeting.lesson_template_id && (
        <Link
          href={`/lessons/${meeting.lesson_template_id}`}
          className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-primary transition-colors duration-fast hover:text-brand-hover"
        >
          <BookOpen className="h-4 w-4" />
          Ver lição no catálogo
        </Link>
      )}

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-2.5 pt-4">
        <StatTile centered value={presentCount} label="Presentes" tone="success" />
        <StatTile centered value={absentCount} label="Ausentes" tone="neutral" />
        <StatTile centered value={visitors.length} label="Visitantes" tone="info" />
      </div>

      {/* Chamada */}
      <SectionRow
        title="Chamada"
        action={<Link href={`/meetings/${meeting.id}/edit`}>Gerir</Link>}
      />
      {attendance.length === 0 ? (
        <div className="rounded-card bg-white px-4 py-6 text-center text-sm text-muted-foreground shadow-sm">
          Nenhum membro ativo neste GC.
        </div>
      ) : (
        <ListGroup>
          {attendance.map((member) => (
            <ListItem
              key={member.id}
              grouped
              leading={<Avatar name={member.name} />}
              title={member.name}
              subtitle={translateRole(member.role)}
              trailing={
                <span
                  aria-label={member.present ? 'Presente' : 'Ausente'}
                  className={`flex h-6 w-6 items-center justify-center rounded-md ${
                    member.present
                      ? 'bg-brand text-white'
                      : 'border-[1.5px] border-border bg-white'
                  }`}
                >
                  {member.present && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                </span>
              }
            />
          ))}
        </ListGroup>
      )}

      {/* Visitantes */}
      <SectionRow title="Visitantes" action={<span>{visitors.length}</span>} />
      {visitors.length === 0 ? (
        <div className="rounded-card bg-paper-deep px-4 py-5 text-center text-sm text-muted-foreground">
          Nenhum visitante registrado neste encontro.
        </div>
      ) : (
        <div className="space-y-2">
          {visitors.map((visitor, index) => (
            <ListItem
              key={`${visitor.name}-${index}`}
              leading={
                <Avatar soft="sage" size="md" aria-hidden>
                  <HandHeart className="h-5 w-5" />
                </Avatar>
              }
              title={visitor.name}
              subtitle={`${visitor.visitCount} ${visitor.visitCount === 1 ? 'visita' : 'visitas'}`}
              trailing={<Badge variant="sage">Visitante</Badge>}
            />
          ))}
        </div>
      )}

      {/* Notas */}
      <SectionRow title="Notas do encontro" />
      <div className="rounded-card bg-white p-4 shadow-sm">
        {meeting.comments ? (
          <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
            {meeting.comments}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Sem notas registradas para este encontro.
          </p>
        )}
      </div>

      <div className="h-4" />
    </section>
  );
}

export default async function MeetingDetailPage({ params }: MeetingDetailProps) {
  const resolvedParams = await params;
  return (
    <Suspense fallback={<Loading message="Carregando encontro…" />}>
      <MeetingDetailContent id={resolvedParams.id} />
    </Suspense>
  );
}
