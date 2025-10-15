import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';

type SearchParams = {
  gcId?: string;
};

async function MeetingsContent({ searchParams }: { searchParams: SearchParams }) {
  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const meetingsQuery = supabase
    .from('meetings')
    .select(
      `id, gc_id, datetime, lesson_title, comments,
       growth_groups ( name ),
       meeting_member_attendance ( id ),
       meeting_visitor_attendance ( id )`
    )
    .order('datetime', { ascending: false })
    .limit(20);

  if (searchParams.gcId) {
    meetingsQuery.eq('gc_id', searchParams.gcId);
  }

  const [groupsResult, meetingsResult] = await Promise.all([
    supabase
      .from('growth_groups')
      .select('id, name')
      .order('name', { ascending: true }),
    meetingsQuery,
  ]);

  if (meetingsResult.error) {
    throw meetingsResult.error;
  }

  const filteredMeetings = meetingsResult.data ?? [];

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-slate-900">Reuniões</h1>
          <p className="text-sm text-slate-600">
            Acompanhe as reuniões registradas recentemente, com destaque para presença de membros e visitantes.
          </p>
        </div>
        <Link
          href="/meetings/new"
          className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:brightness-110"
        >
          Registrar nova reunião
        </Link>
      </header>

      <form className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Filtrar por GC
          <select
            name="gcId"
            defaultValue={searchParams.gcId ?? ''}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">Todos</option>
            {(groupsResult.data ?? []).map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="inline-flex items-center rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
        >
          Aplicar filtro
        </button>
      </form>

      <div className="grid gap-4">
        {filteredMeetings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
            Nenhuma reunião encontrada para o filtro selecionado.
          </div>
        ) : (
          filteredMeetings.map((meeting) => {
            const memberCount = Array.isArray(meeting.meeting_member_attendance)
              ? meeting.meeting_member_attendance.length
              : 0;
            const visitorCount = Array.isArray(meeting.meeting_visitor_attendance)
              ? meeting.meeting_visitor_attendance.length
              : 0;

            return (
              <article
                key={meeting.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-xs uppercase tracking-wide text-slate-400">
                    {meeting.growth_groups?.name ?? 'GC desconhecido'}
                  </span>
                  <h2 className="text-lg font-semibold text-slate-900">{meeting.lesson_title}</h2>
                  <p className="text-xs text-slate-500">
                    {new Date(meeting.datetime).toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600 md:grid-cols-4">
                  <div>
                    <dt className="uppercase text-xs tracking-wide text-slate-400">Membros presentes</dt>
                    <dd className="text-sm font-semibold text-slate-800">{memberCount}</dd>
                  </div>
                  <div>
                    <dt className="uppercase text-xs tracking-wide text-slate-400">Visitantes presentes</dt>
                    <dd className="text-sm font-semibold text-slate-800">{visitorCount}</dd>
                  </div>
                  {meeting.comments ? (
                    <div className="col-span-2">
                      <dt className="uppercase text-xs tracking-wide text-slate-400">Comentários</dt>
                      <dd className="text-sm text-slate-600">{meeting.comments}</dd>
                    </div>
                  ) : null}
                </dl>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}

export default function MeetingsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<div className="p-8 text-slate-500">Carregando...</div>}>
      <MeetingsContent searchParams={searchParams} />
    </Suspense>
  );
}
