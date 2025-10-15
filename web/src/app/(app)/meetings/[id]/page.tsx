import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';

interface MeetingDetailProps {
  params: Promise<{ id: string }>;
}

async function MeetingDetailContent({ id }: { id: string }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    notFound();
  }

  const { data: meeting, error } = await supabase
    .from('meetings')
    .select(
      `id, datetime, lesson_title, comments,
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

  const dateLabel = new Date(meeting.datetime).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Link href="/meetings" className="text-primary hover:underline">
            Reuniões
          </Link>
          <span>/</span>
          <span>{meeting.growth_groups?.name ?? 'GC desconhecido'}</span>
        </div>
        <h1 className="text-3xl font-semibold text-slate-900">{meeting.lesson_title}</h1>
        <p className="text-sm text-slate-600">{dateLabel}</p>
      </header>

      {meeting.comments ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Comentários</h2>
          <p className="mt-2 text-sm text-slate-700">{meeting.comments}</p>
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Membros presentes</h2>
            <span className="text-sm font-semibold text-slate-800">{members.length}</span>
          </header>
          <ul className="mt-4 space-y-3">
            {members.length ? (
              members.map((member, index) => (
                <li key={`${member.name}-${member.email ?? member.phone ?? index}`} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="text-sm font-semibold text-slate-900">{member.name}</p>
                  <p className="text-xs uppercase tracking-wide text-slate-400">{member.role}</p>
                  <p className="text-xs text-slate-500">{member.email ?? member.phone ?? 'Contato não informado'}</p>
                </li>
              ))
            ) : (
              <li className="text-sm text-slate-500">Nenhum participante marcado.</li>
            )}
          </ul>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Visitantes presentes</h2>
            <span className="text-sm font-semibold text-slate-800">{visitors.length}</span>
          </header>
          <ul className="mt-4 space-y-3">
            {visitors.length ? (
              visitors.map((visitor, index) => (
                <li key={`${visitor.name}-${visitor.email ?? visitor.phone ?? index}`} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="text-sm font-semibold text-slate-900">{visitor.name}</p>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    {visitor.status} • {visitor.visitCount} visitas
                  </p>
                  <p className="text-xs text-slate-500">{visitor.email ?? visitor.phone ?? 'Contato não informado'}</p>
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
