import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { BookOpen, ChevronRight, Users, UserPlus } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { getAuthenticatedUser } from '@/lib/supabase/server-auth';
import { translateRole } from '@/lib/role-translations';

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
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10">
      <header className="flex flex-col gap-3">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-slate-500">
          {gcId ? (
            <Link href={`/gc/${gcId}`} className="text-primary hover:underline">
              {gcName}
            </Link>
          ) : (
            <span>{gcName}</span>
          )}
          <ChevronRight className="h-3.5 w-3.5" />
          <span>Reunião</span>
        </nav>

        <h1 className="text-3xl font-semibold text-slate-900">{meeting.lesson_title}</h1>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
          <span>{dateLabel}</span>
          {meeting.taught_by && (
            <>
              <span className="text-slate-300">·</span>
              <span>Ministrado por {meeting.taught_by}</span>
            </>
          )}
          <span className="text-slate-300">·</span>
          <span>{totalPresent} {totalPresent === 1 ? 'presente' : 'presentes'}</span>
        </div>

        {meeting.lesson_template_id && (
          <Link
            href={`/lessons/${meeting.lesson_template_id}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <BookOpen className="h-4 w-4" />
            Ver lição no catálogo
          </Link>
        )}
      </header>

      {meeting.comments ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Comentários</h2>
          <p className="mt-2 whitespace-pre-line text-sm text-slate-700">{meeting.comments}</p>
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
              <Users className="h-4 w-4" />
              Membros
            </h2>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
              {members.length}
            </span>
          </header>
          <ul className="mt-4 space-y-2">
            {members.length ? (
              members.map((member, index) => (
                <li key={`${member.name}-${member.email ?? member.phone ?? index}`} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="text-sm font-semibold text-slate-900">{member.name}</p>
                  <p className="text-xs text-slate-500">{translateRole(member.role)}</p>
                </li>
              ))
            ) : (
              <li className="text-sm text-slate-500">Nenhum membro marcado.</li>
            )}
          </ul>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
              <UserPlus className="h-4 w-4" />
              Visitantes
            </h2>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
              {visitors.length}
            </span>
          </header>
          <ul className="mt-4 space-y-2">
            {visitors.length ? (
              visitors.map((visitor, index) => (
                <li key={`${visitor.name}-${visitor.email ?? visitor.phone ?? index}`} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="text-sm font-semibold text-slate-900">{visitor.name}</p>
                  <p className="text-xs text-slate-500">{visitor.visitCount} {visitor.visitCount === 1 ? 'visita' : 'visitas'}</p>
                </li>
              ))
            ) : (
              <li className="text-sm text-slate-500">Nenhum visitante marcado.</li>
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
    <Suspense fallback={<div className="p-8 text-slate-500">Carregando reunião...</div>}>
      <MeetingDetailContent id={resolvedParams.id} />
    </Suspense>
  );
}
