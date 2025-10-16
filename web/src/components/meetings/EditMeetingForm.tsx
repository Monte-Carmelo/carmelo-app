'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { Calendar, FileText, Users, UserCheck, Trash2 } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import type { Database } from '@/lib/supabase/types';
import type { MeetingDetails } from '@/lib/supabase/queries/meetings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

const schema = z.object({
  meetingDate: z.string({ message: 'Informe a data da reunião' }),
  meetingTime: z.string({ message: 'Informe o horário da reunião' }),
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

interface EditMeetingFormProps {
  meeting: MeetingDetails;
  lessonTemplates: Pick<Lesson, 'id' | 'title'>[];
}

export function EditMeetingForm({ meeting, lessonTemplates }: EditMeetingFormProps) {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Extrair data e hora da datetime ISO
  const datetime = new Date(meeting.datetime);
  const defaultDate = datetime.toISOString().split('T')[0];
  const defaultTime = datetime.toTimeString().substring(0, 5);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      meetingDate: defaultDate,
      meetingTime: defaultTime,
      lessonTemplateId: meeting.lesson_template_id || '',
      customLessonTitle: meeting.lesson_title || '',
      comments: meeting.comments || '',
      members: meeting.meeting_member_attendance.map((att) => ({
        participantId: att.participant_id,
      })),
      visitors: meeting.meeting_visitor_attendance.map((att) => ({
        visitorId: att.visitor_id,
      })),
    },
  });

  const membersFieldArray = useFieldArray({ name: 'members', control: form.control });
  const visitorsFieldArray = useFieldArray({ name: 'visitors', control: form.control });

  // Carregar participantes e visitantes do GC
  useEffect(() => {
    loadParticipantsAndVisitors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadParticipantsAndVisitors = async () => {
    setIsLoading(true);
    const [{ data: memberRows }, { data: visitorRows }] = await Promise.all([
      supabase
        .from('growth_group_participants')
        .select('id, role, people:person_id ( id, name )')
        .eq('gc_id', meeting.gc_id)
        .eq('status', 'active')
        .in('role', ['member', 'leader', 'co_leader'])
        .order('role', { ascending: true }),
      supabase
        .from('visitors')
        .select('id, people:person_id ( id, name )')
        .eq('gc_id', meeting.gc_id)
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

    // Atualizar dados da reunião
    const { error: meetingError } = await supabase
      .from('meetings')
      .update({
        lesson_template_id: values.lessonTemplateId || null,
        lesson_title: lessonTitle,
        comments: values.comments?.trim() || null,
        datetime: datetime.toISOString(),
      })
      .eq('id', meeting.id);

    if (meetingError) {
      setErrorMessage(meetingError?.message ?? 'Falha ao atualizar reunião');
      setIsLoading(false);
      return;
    }

    // Atualizar presença de membros
    // 1. Deletar todas as presenças existentes
    await supabase.from('meeting_member_attendance').delete().eq('meeting_id', meeting.id);

    // 2. Inserir novas presenças
    if (values.members.length > 0) {
      const attendancePayload = values.members.map((member) => ({
        meeting_id: meeting.id,
        participant_id: member.participantId,
      }));

      const { error: memberAttendanceError } = await supabase
        .from('meeting_member_attendance')
        .insert(attendancePayload);

      if (memberAttendanceError) {
        setErrorMessage('Reunião atualizada, mas faltou registrar presença de membros.');
        setIsLoading(false);
        return;
      }
    }

    // Atualizar presença de visitantes
    // 1. Deletar todas as presenças existentes
    await supabase.from('meeting_visitor_attendance').delete().eq('meeting_id', meeting.id);

    // 2. Inserir novas presenças
    if (values.visitors.length > 0) {
      const visitorPayload = values.visitors.map((visitor) => ({
        meeting_id: meeting.id,
        visitor_id: visitor.visitorId,
      }));

      const { error: visitorAttendanceError } = await supabase
        .from('meeting_visitor_attendance')
        .insert(visitorPayload);

      if (visitorAttendanceError) {
        setErrorMessage('Reunião atualizada, mas faltou registrar presença de visitantes.');
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(false);
    router.push(`/gc/${meeting.gc_id}`);
    router.refresh();
  });

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir esta reunião?')) {
      return;
    }

    setIsLoading(true);
    const { error } = await supabase
      .from('meetings')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', meeting.id);

    if (error) {
      setErrorMessage(error.message);
      setIsLoading(false);
      return;
    }

    router.push(`/gc/${meeting.gc_id}`);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Editar reunião</h1>
        <p className="text-muted-foreground">
          Atualize as informações da reunião, lição e presença de membros e visitantes.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Informações básicas
          </CardTitle>
          <CardDescription>Defina data e horário da reunião</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gcName">Grupo de Crescimento</Label>
            <Input
              id="gcName"
              type="text"
              value={meeting.growth_groups.name}
              readOnly
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              O GC não pode ser alterado após criar a reunião.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="meetingDate">Data</Label>
              <Input id="meetingDate" type="date" {...form.register('meetingDate')} />
              {form.formState.errors.meetingDate && (
                <p className="text-sm text-destructive">{form.formState.errors.meetingDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="meetingTime">Horário</Label>
              <Input id="meetingTime" type="time" {...form.register('meetingTime')} />
              {form.formState.errors.meetingTime && (
                <p className="text-sm text-destructive">{form.formState.errors.meetingTime.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Lição
          </CardTitle>
          <CardDescription>Configure o tema ou lição da reunião</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="lessonTemplateId">Lição do catálogo</Label>
              <Select
                value={form.watch('lessonTemplateId') || 'none'}
                onValueChange={(value) =>
                  form.setValue('lessonTemplateId', value === 'none' ? '' : value)
                }
              >
                <SelectTrigger id="lessonTemplateId">
                  <SelectValue placeholder="Selecionar lição" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma lição</SelectItem>
                  {lessonTemplates.map((lesson) => (
                    <SelectItem key={lesson.id} value={lesson.id}>
                      {lesson.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customLessonTitle">Título customizado</Label>
              <Input
                id="customLessonTitle"
                type="text"
                placeholder="Semana especial..."
                {...form.register('customLessonTitle')}
              />
              <p className="text-xs text-muted-foreground">
                Se preenchido, substitui o título da lição padrão.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comments">Comentários</Label>
            <Textarea
              id="comments"
              rows={3}
              placeholder="Destaques da reunião, pedidos de oração, etc."
              {...form.register('comments')}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Presença
          </CardTitle>
          <CardDescription>Marque os membros e visitantes presentes na reunião</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Users className="h-4 w-4" />
              Membros
            </h3>
            <div className="space-y-2">
              {participants.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum membro ativo encontrado neste GC.
                </p>
              ) : (
                participants.map((participant) => {
                  const isChecked = form
                    .watch('members')
                    .some((item) => item.participantId === participant.id);

                  return (
                    <div key={participant.id} className="flex items-center space-x-2 rounded-lg border p-3">
                      <Checkbox
                        id={`member-${participant.id}`}
                        checked={isChecked}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            membersFieldArray.append({ participantId: participant.id });
                          } else {
                            const index = form
                              .watch('members')
                              .findIndex((item) => item.participantId === participant.id);
                            if (index >= 0) membersFieldArray.remove(index);
                          }
                        }}
                      />
                      <label
                        htmlFor={`member-${participant.id}`}
                        className="flex-1 cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {participant.name}
                        <span className="ml-2 text-xs uppercase tracking-wide text-muted-foreground">
                          {participant.role}
                        </span>
                      </label>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Users className="h-4 w-4" />
              Visitantes
            </h3>
            <div className="space-y-2">
              {visitors.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum visitante ativo encontrado; visitantes podem ser cadastrados na área de pessoas.
                </p>
              ) : (
                visitors.map((visitor) => {
                  const isChecked = form
                    .watch('visitors')
                    .some((item) => item.visitorId === visitor.id);

                  return (
                    <div key={visitor.id} className="flex items-center space-x-2 rounded-lg border p-3">
                      <Checkbox
                        id={`visitor-${visitor.id}`}
                        checked={isChecked}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            visitorsFieldArray.append({ visitorId: visitor.id });
                          } else {
                            const index = form
                              .watch('visitors')
                              .findIndex((item) => item.visitorId === visitor.id);
                            if (index >= 0) visitorsFieldArray.remove(index);
                          }
                        }}
                      />
                      <label
                        htmlFor={`visitor-${visitor.id}`}
                        className="flex-1 cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {visitor.name}
                      </label>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {errorMessage && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{errorMessage}</p>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between gap-3">
        <Button type="button" variant="destructive" onClick={handleDelete} disabled={isLoading}>
          <Trash2 className="mr-2 h-4 w-4" />
          Excluir reunião
        </Button>
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            <Calendar className="mr-2 h-4 w-4" />
            {isLoading ? 'Salvando...' : 'Salvar alterações'}
          </Button>
        </div>
      </div>
    </form>
  );
}
