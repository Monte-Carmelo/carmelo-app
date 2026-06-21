import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { BookOpen, ChevronRight, Hand, Users, UserPlus } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { getAuthenticatedUser } from '@/lib/supabase/server-auth';
import { translateRole } from '@/lib/role-translations';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScreenHeader } from '@/components/ui/screen-header';

interface MeetingDetailProps {
  params: Promise<{ id: string }>;
}

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
       meeting_member_attendance (
         participant_id,
         growth_group_participants ( role, people:people ( name, email, phone ) )
       ),
       meeting_visitor_attendance (
         visitor_id,
         visitors ( status, visit_count, people:people ( name, email, phone ) )
       )`
    )
    .eq('id', id)
    .single();

  if (error || !meeting) {
    notFound();
  }

  const members = (meeting.meeting_member_attendance ?? []).map((record) => ({
    role: record.growth_group_participants?.role ?? 'member',
    name: record.growth_group_participants?.people?.name ?? 'Sem nome',
    email: record.growth_group_participants?.people?.email ?? null,
    phone: record.growth_group_participants?.people?.phone ?? null,
  }));

  const visitors = (meeting.meeting_visitor_attendance ?? []).map((record) => ({
    status: record.visitors?.status ?? 'active',
    visitCount: record.visitors?.visit_count ?? 0,
    name: record.visitors?.people?.name ?? 'Sem nome',
    email: record.visitors?.people?.email ?? null,
    phone: record.visitors?.people?.phone ?? null,
  }));

  const totalPresent = members.length + visitors.length;

  const dateLabel = new Date(meeting.datetime).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const gcId = meeting.growth_groups?.id;
  const gcName = meeting.growth_groups?.name ?? 'GC desconhecido';

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 bg-background px-4 py-10">
      <header className="flex flex-col gap-3">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
          {gcId ? (
            <Link href={`/gc/${gcId}`} className="font-medium text-primary hover:text-brand-hover hover:underline">
              {gcName}
            </Link>
          ) : (
            <span>{gcName}</span>
          )}
          <ChevronRight className="h-3.5 w-3.5" />
          <span>Reunião</span>
        </nav>

        <ScreenHeader
          title={meeting.lesson_title}
          subtitle={
            <>
              <span>{dateLabel}</span>
              {meeting.taught_by && (
                <>
                  <span className="mx-1.5 text-slate-300">·</span>
                  <span>Ministrado por {meeting.taught_by}</span>
                </>
              )}
              <span className="mx-1.5 text-slate-300">·</span>
              <span>{totalPresent} {totalPresent === 1 ? 'presente' : 'presentes'}</span>
            </>
          }
        />

        {meeting.lesson_template_id && (
          <Link
            href={`/lessons/${meeting.lesson_template_id}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors duration-fast hover:text-brand-hover hover:underline"
          >
            <BookOpen className="h-4 w-4" />
            Ver lição no catálogo
          </Link>
        )}
      </header>

      {meeting.comments ? (
        <section className="rounded-card bg-white p-6 shadow-sm">
          <h2 className="eyebrow">Comentários</h2>
          <p className="mt-2.5 whitespace-pre-line text-sm leading-relaxed text-slate-700">{meeting.comments}</p>
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-card bg-white p-6 shadow-sm">
          <header className="flex items-center justify-between">
            <h2 className="eyebrow flex items-center gap-2">
              <Users className="h-4 w-4" />
              Membros
            </h2>
            <Badge variant="neutral">{members.length}</Badge>
          </header>
          <ul className="mt-3 [&>li+li]:border-t [&>li+li]:border-divider">
            {members.length ? (
              members.map((member, index) => (
                <li key={`${member.name}-${member.email ?? member.phone ?? index}`} className="flex items-center gap-3 py-3">
                  <Avatar name={member.name} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14.5px] font-bold leading-tight text-foreground">{member.name}</p>
                    <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{translateRole(member.role)}</p>
                  </div>
                </li>
              ))
            ) : (
              <li className="rounded-xl bg-paper-deep px-4 py-4 text-sm text-muted-foreground">Nenhum membro marcado.</li>
            )}
          </ul>
        </article>

        <article className="rounded-card bg-white p-6 shadow-sm">
          <header className="flex items-center justify-between">
            <h2 className="eyebrow flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Visitantes
            </h2>
            <Badge variant="neutral">{visitors.length}</Badge>
          </header>
          <ul className="mt-3 [&>li+li]:border-t [&>li+li]:border-divider">
            {visitors.length ? (
              visitors.map((visitor, index) => (
                <li key={`${visitor.name}-${visitor.email ?? visitor.phone ?? index}`} className="flex items-center gap-3 py-3">
                  <Avatar soft="sage" size="md">
                    <Hand className="h-5 w-5" />
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14.5px] font-bold leading-tight text-foreground">{visitor.name}</p>
                    <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{visitor.visitCount} {visitor.visitCount === 1 ? 'visita' : 'visitas'}</p>
                  </div>
                </li>
              ))
            ) : (
              <li className="rounded-xl bg-paper-deep px-4 py-4 text-sm text-muted-foreground">Nenhum visitante marcado.</li>
            )}
          </ul>
        </article>
      </section>
    </section>
  );
}

export default async function MeetingDetailPage({ params }: MeetingDetailProps) {
  const resolvedParams = await params;
  return (
    <Suspense fallback={<div className="p-8 text-muted-foreground">Carregando reunião...</div>}>
      <MeetingDetailContent id={resolvedParams.id} />
    </Suspense>
  );
}
