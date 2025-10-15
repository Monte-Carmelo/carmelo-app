'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import type { Database } from '@/lib/supabase/types';

const schema = z.object({
  gcId: z.string({ required_error: 'Selecione um GC' }),
  meetingDate: z.string({ required_error: 'Informe a data da reunião' }),
  meetingTime: z.string({ required_error: 'Informe o horário da reunião' }),
  lessonTemplateId: z.string().optional(),
  customLessonTitle: z
    .string()
    .max(255, 'Título muito longo')
    .optional()
    .or(z.literal('')),
  comments: z.string().max(1000, 'Texto muito longo').optional(),
  members: z.array(z.object({ participantId: z.string() })),
  visitors: z.array(z.object({ visitorId: z.string() })),
});

type FormValues = z.infer<typeof schema>;

type GrowthGroup = Database['public']['Tables']['growth_groups']['Row'];
type Lesson = Database['public']['Tables']['lessons']['Row'];

type Participant = {
  id: string;
  name: string;
  role: Database['public']['Tables']['growth_group_participants']['Row']['role'];
};

type Visitor = {
  id: string;
  name: string;
};

interface MeetingFormProps {
  userId: string;
  groups: Pick<GrowthGroup, 'id' | 'name'>[];
  lessonTemplates: Pick<Lesson, 'id' | 'title'>[];
}

export function MeetingForm({ userId, groups, lessonTemplates }: MeetingFormProps) {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      meetingDate: new Date().toISOString().split('T')[0],
      meetingTime: '19:30',
      members: [],
      visitors: [],
    },
  });

  const membersFieldArray = useFieldArray({ name: 'members', control: form.control });
  const visitorsFieldArray = useFieldArray({ name: 'visitors', control: form.control });

  const handleGroupChange = async (gcId: string) => {
    form.reset({
      ...form.getValues(),
      gcId,
      members: [],
      visitors: [],
    });

    if (!gcId) return;

    setIsLoading(true);
    const [{ data: memberRows }, { data: visitorRows }] = await Promise.all([
      supabase
        .from('growth_group_participants')
        .select('id, role, people:person_id ( id, name )')
        .eq('gc_id', gcId)
        .eq('status', 'active')
        .in('role', ['member', 'leader', 'co_leader'])
        .order('role', { ascending: true }),
      supabase
        .from('visitors')
        .select('id, people:person_id ( id, name )')
        .eq('gc_id', gcId)
        .eq('status', 'active')
        .order('first_visit_date', { ascending: false }),
    ]);

    setParticipants(
      (memberRows ?? []).map((row) => ({
        id: row.id,
        name: row.people?.name ?? 'Sem nome',
        role: row.role,
      })),
    );

    setVisitors(
      (visitorRows ?? []).map((row) => ({
        id: row.id,
        name: row.people?.name ?? 'Sem nome',
      })),
    );
    setIsLoading(false);
  };

  const handleSubmit = form.handleSubmit(async (values) => {
    setErrorMessage(null);
    setIsLoading(true);

    const lessonTitle = values.customLessonTitle?.trim()
      ? values.customLessonTitle.trim()
      : lessonTemplates.find((lesson) => lesson.id === values.lessonTemplateId)?.title ??
        'Reunião sem título';

    const datetime = new Date(`${values.meetingDate}T${values.meetingTime}:00`);

    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .insert({
        gc_id: values.gcId,
        lesson_template_id: values.lessonTemplateId || null,
        lesson_title: lessonTitle,
        comments: values.comments?.trim() || null,
        datetime: datetime.toISOString(),
        registered_by_user_id: userId,
      })
      .select('id')
      .single();

    if (meetingError || !meeting) {
      setErrorMessage(meetingError?.message ?? 'Falha ao criar reunião');
      setIsLoading(false);
      return;
    }

    const attendancePayload = values.members.map((member) => ({
      meeting_id: meeting.id,
      participant_id: member.participantId,
    }));

    if (attendancePayload.length) {
      const { error: memberAttendanceError } = await supabase
        .from('meeting_member_attendance')
        .insert(attendancePayload);
      if (memberAttendanceError) {
        setErrorMessage('Reunião criada, mas faltou registrar presença de membros.');
      }
    }

    const visitorPayload = values.visitors.map((visitor) => ({
      meeting_id: meeting.id,
      visitor_id: visitor.visitorId,
    }));

    if (visitorPayload.length) {
      const { error: visitorAttendanceError } = await supabase
        .from('meeting_visitor_attendance')
        .insert(visitorPayload);
      if (visitorAttendanceError) {
        setErrorMessage('Reunião criada, mas faltou registrar presença de visitantes.');
      }
    }

    setIsLoading(false);
    router.replace('/dashboard');
    router.refresh();
  });

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-slate-900">Registrar reunião</h1>
        <p className="text-sm text-slate-600">Selecione o grupo, configure a lição e marque presenças de membros e visitantes.</p>
      </header>

      <fieldset className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <legend className="text-sm font-semibold uppercase tracking-wide text-slate-500">Informações básicas</legend>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Grupo de Crescimento
            <select
              className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              {...form.register('gcId')}
              onChange={(event) => handleGroupChange(event.target.value)}
            >
              <option value="">Selecione...</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
            {form.formState.errors.gcId ? (
              <span className="text-xs text-red-600">{form.formState.errors.gcId.message}</span>
            ) : null}
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
              Data
              <input
                type="date"
                className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                {...form.register('meetingDate')}
              />
              {form.formState.errors.meetingDate ? (
                <span className="text-xs text-red-600">{form.formState.errors.meetingDate.message}</span>
              ) : null}
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
              Horário
              <input
                type="time"
                className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                {...form.register('meetingTime')}
              />
              {form.formState.errors.meetingTime ? (
                <span className="text-xs text-red-600">{form.formState.errors.meetingTime.message}</span>
              ) : null}
            </label>
          </div>
        </div>
      </fieldset>

      <fieldset className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <legend className="text-sm font-semibold uppercase tracking-wide text-slate-500">Lição</legend>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Lição do catálogo
            <select
              className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              {...form.register('lessonTemplateId')}
            >
              <option value="">Selecionar lição</option>
              {lessonTemplates.map((lesson) => (
                <option key={lesson.id} value={lesson.id}>
                  {lesson.title}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Título customizado
            <input
              type="text"
              placeholder="Semana especial..."
              className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              {...form.register('customLessonTitle')}
            />
            <span className="text-xs text-slate-500">Se preenchido, substitui o título da lição padrão.</span>
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Comentários
          <textarea
            rows={3}
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="Destaques da reunião, pedidos de oração, etc."
            {...form.register('comments')}
          />
        </label>
      </fieldset>

      <fieldset className="grid gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <legend className="text-sm font-semibold uppercase tracking-wide text-slate-500">Presença</legend>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700">Membros</h2>
          <div className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
            {participants.length === 0 ? (
              <span className="text-sm text-slate-500">
                Selecione um GC para carregar a lista de membros e líderes.
              </span>
            ) : (
              participants.map((participant) => {
                const isChecked = form
                  .watch('members')
                  .some((item) => item.participantId === participant.id);

                return (
                  <label key={participant.id} className="flex items-center justify-between rounded-lg bg-white px-3 py-2">
                    <div>
                      <span className="text-sm font-medium text-slate-800">{participant.name}</span>
                      <span className="ml-2 text-xs uppercase tracking-wide text-slate-400">{participant.role}</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(event) => {
                        if (event.target.checked) {
                          membersFieldArray.append({ participantId: participant.id });
                        } else {
                          const index = form
                            .watch('members')
                            .findIndex((item) => item.participantId === participant.id);
                          if (index >= 0) membersFieldArray.remove(index);
                        }
                      }}
                    />
                  </label>
                );
              })
            )}
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700">Visitantes</h2>
          <div className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
            {visitors.length === 0 ? (
              <span className="text-sm text-slate-500">
                Nenhum visitante ativo encontrado; visitantes podem ser cadastrados na área de pessoas.
              </span>
            ) : (
              visitors.map((visitor) => {
                const isChecked = form
                  .watch('visitors')
                  .some((item) => item.visitorId === visitor.id);

                return (
                  <label key={visitor.id} className="flex items-center justify-between rounded-lg bg-white px-3 py-2">
                    <span className="text-sm font-medium text-slate-800">{visitor.name}</span>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(event) => {
                        if (event.target.checked) {
                          visitorsFieldArray.append({ visitorId: visitor.id });
                        } else {
                          const index = form
                            .watch('visitors')
                            .findIndex((item) => item.visitorId === visitor.id);
                          if (index >= 0) visitorsFieldArray.remove(index);
                        }
                      }}
                    />
                  </label>
                );
              })
            )}
          </div>
        </div>
      </fieldset>

      {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
          onClick={() => router.back()}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? 'Salvando...' : 'Registrar reunião'}
        </button>
      </div>
    </form>
  );
}
