'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { Calendar, FileText, UserCheck, Trash2, AlertCircle } from 'lucide-react';
import type { Database } from '@/lib/supabase/types';
import type {
  AttendanceMemberOption,
  AttendanceVisitorOption,
} from '@/lib/api/growth-group-attendance';
import type { MeetingDetails } from '@/lib/supabase/queries/meetings';
import { ClientFormShell } from '@/components/forms/ClientFormShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MemberAttendanceList } from '@/components/meetings/attendance/MemberAttendanceList';
import { VisitorAttendanceList } from '@/components/meetings/attendance/VisitorAttendanceList';

const meetingStatusOptions = [
  { value: 'scheduled', label: 'Agendada' },
  { value: 'completed', label: 'Realizada' },
  { value: 'cancelled', label: 'Cancelada' },
] as const;

const schema = z
  .object({
    meetingDate: z.string({ message: 'Informe a data da reunião' }),
    meetingTime: z.string({ message: 'Informe o horário da reunião' }),
    status: z.enum(['scheduled', 'completed', 'cancelled']),
    lessonType: z.enum(['catalog', 'custom'], { message: 'Escolha o tipo de lição' }),
    lessonTemplateId: z.string().optional(),
    customLessonTitle: z.string().max(255, 'Título muito longo').optional(),
    taughtBy: z.string().max(255, 'Nome muito longo').optional(),
    comments: z.string().max(1000, 'Texto muito longo').optional(),
    members: z.array(z.object({ participantId: z.string() })),
    visitors: z.array(z.object({ visitorId: z.string() })),
  })
  .refine(
    (data) => {
      if (data.lessonType === 'catalog') {
        return !!data.lessonTemplateId;
      }
      if (data.lessonType === 'custom') {
        return !!data.customLessonTitle && data.customLessonTitle.trim().length > 0;
      }
      return false;
    },
    {
      message: 'Selecione uma lição do catálogo ou informe um título personalizado',
      path: ['lessonTemplateId'],
    }
  );

type FormValues = z.infer<typeof schema>;

type Lesson = Database['public']['Tables']['lessons']['Row'];

interface EditMeetingFormProps {
  meeting: MeetingDetails;
  lessonTemplates: Pick<Lesson, 'id' | 'title'>[];
}

export function EditMeetingForm({ meeting, lessonTemplates }: EditMeetingFormProps) {
  const router = useRouter();

  const [participants, setParticipants] = useState<AttendanceMemberOption[]>([]);
  const [visitors, setVisitors] = useState<AttendanceVisitorOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  // Extrair data e hora da datetime ISO
  const datetime = new Date(meeting.datetime);
  const defaultDate = datetime.toISOString().split('T')[0];
  const defaultTime = datetime.toTimeString().substring(0, 5);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      meetingDate: defaultDate,
      meetingTime: defaultTime,
      status: meeting.status ?? 'scheduled',
      lessonType: meeting.lesson_template_id ? 'catalog' : 'custom',
      lessonTemplateId: meeting.lesson_template_id || '',
      customLessonTitle: meeting.lesson_template_id ? '' : meeting.lesson_title || '',
      taughtBy: meeting.taught_by || '',
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
    try {
      const response = await fetch(`/api/growth-groups/${meeting.gc_id}/attendance-options`, {
        cache: 'no-store',
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? 'Falha ao carregar participantes e visitantes.');
      }

      setParticipants(payload.members ?? []);
      setVisitors(payload.visitors ?? []);
    } catch (error) {
      showError(
        error instanceof Error
          ? error.message
          : 'Falha ao carregar participantes e visitantes.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
  };

  const handleSubmit = form.handleSubmit(async (values) => {
    setErrorMessage(null);
    setIsLoading(true);
    let isSuccess = false;

    let lessonTitle: string;
    if (values.lessonType === 'custom') {
      lessonTitle = values.customLessonTitle?.trim() || '';
    } else {
      lessonTitle = lessonTemplates.find((lesson) => lesson.id === values.lessonTemplateId)?.title || '';
    }

    if (!lessonTitle) {
      showError('Por favor, selecione uma lição ou informe um título personalizado');
      setIsLoading(false);
      return;
    }

    const dt = new Date(`${values.meetingDate}T${values.meetingTime}:00`);

    try {
      const response = await fetch(`/api/meetings/${meeting.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meetingId: meeting.id,
          lessonTemplateId: values.lessonType === 'catalog' ? values.lessonTemplateId || null : null,
          lessonTitle,
          taughtBy: values.taughtBy?.trim() || null,
          comments: values.comments?.trim() || null,
          status: values.status,
          datetime: dt.toISOString(),
          memberAttendance: values.members.map((member) => member.participantId),
          visitorAttendance: values.visitors.map((visitor) => visitor.visitorId),
        }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        showError(result.error ?? 'Falha ao atualizar reunião');
        return;
      }

      isSuccess = true;
      window.location.assign(`/gc/${meeting.gc_id}`);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Falha ao atualizar reunião');
    } finally {
      if (!isSuccess) {
        setIsLoading(false);
      }
    }
  });

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir esta reunião?')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/meetings/${meeting.id}`, { method: 'DELETE' });
      const result = await response.json();

      if (!response.ok || !result.success) {
        showError(result.error ?? 'Falha ao excluir reunião');
        setIsLoading(false);
        return;
      }

      window.location.assign(`/gc/${meeting.gc_id}`);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Falha ao excluir reunião');
      setIsLoading(false);
    }
  };

  const selectedMemberIds = form.watch('members').map((item) => item.participantId);
  const selectedVisitorIds = form.watch('visitors').map((item) => item.visitorId);

  const toggleMemberSelection = (memberId: string, checked: boolean) => {
    if (checked) {
      membersFieldArray.append({ participantId: memberId });
    } else {
      const index = form.getValues('members').findIndex((item) => item.participantId === memberId);
      if (index >= 0) membersFieldArray.remove(index);
    }
  };

  const toggleVisitorSelection = (visitorId: string, checked: boolean) => {
    if (checked) {
      visitorsFieldArray.append({ visitorId });
    } else {
      const index = form.getValues('visitors').findIndex((item) => item.visitorId === visitorId);
      if (index >= 0) visitorsFieldArray.remove(index);
    }
  };

  const selectAllMembers = () => {
    const currentIds = new Set(form.getValues('members').map((m) => m.participantId));
    for (const p of participants) {
      if (!currentIds.has(p.id)) membersFieldArray.append({ participantId: p.id });
    }
  };

  const deselectAllMembers = () => { form.setValue('members', []); };

  const selectAllVisitors = () => {
    const currentIds = new Set(form.getValues('visitors').map((v) => v.visitorId));
    for (const v of visitors) {
      if (!currentIds.has(v.id)) visitorsFieldArray.append({ visitorId: v.id });
    }
  };

  const deselectAllVisitors = () => { form.setValue('visitors', []); };

  return (
    <ClientFormShell
      onSubmit={handleSubmit}
      className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8"
      pending={isLoading}
    >
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Editar reunião</h1>
        <p className="text-muted-foreground">
          Atualize as informações da reunião, lição e presença de membros e visitantes.
        </p>
      </div>

      {errorMessage && (
        <div
          ref={errorRef}
          className="flex items-start gap-2 rounded-lg border border-destructive bg-destructive/10 p-3"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <p className="text-sm text-destructive">{errorMessage}</p>
        </div>
      )}

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

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={form.watch('status')}
              onValueChange={(value) =>
                form.setValue('status', value as 'scheduled' | 'completed' | 'cancelled', { shouldValidate: true })
              }
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Selecione o status..." />
              </SelectTrigger>
              <SelectContent>
                {meetingStatusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Lição
          </CardTitle>
          <CardDescription>Escolha uma lição do catálogo ou crie um título personalizado</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label>Tipo de lição</Label>
            <div className="grid gap-3 md:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  form.setValue('lessonType', 'catalog');
                  form.setValue('customLessonTitle', '');
                }}
                className={`flex flex-col items-start gap-2 rounded-lg border-2 p-4 text-left transition-all hover:bg-accent ${
                  form.watch('lessonType') === 'catalog'
                    ? 'border-primary bg-primary/5'
                    : 'border-muted'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`h-4 w-4 rounded-full border-2 ${
                      form.watch('lessonType') === 'catalog'
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground'
                    }`}
                  >
                    {form.watch('lessonType') === 'catalog' && (
                      <div className="h-full w-full rounded-full bg-background p-0.5">
                        <div className="h-full w-full rounded-full bg-primary" />
                      </div>
                    )}
                  </div>
                  <span className="font-semibold">Lição do Catálogo</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Escolha uma lição pré-cadastrada do sistema
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  form.setValue('lessonType', 'custom');
                  form.setValue('lessonTemplateId', '');
                }}
                className={`flex flex-col items-start gap-2 rounded-lg border-2 p-4 text-left transition-all hover:bg-accent ${
                  form.watch('lessonType') === 'custom'
                    ? 'border-primary bg-primary/5'
                    : 'border-muted'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`h-4 w-4 rounded-full border-2 ${
                      form.watch('lessonType') === 'custom'
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground'
                    }`}
                  >
                    {form.watch('lessonType') === 'custom' && (
                      <div className="h-full w-full rounded-full bg-background p-0.5">
                        <div className="h-full w-full rounded-full bg-primary" />
                      </div>
                    )}
                  </div>
                  <span className="font-semibold">Título Personalizado</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Crie um título específico para esta reunião
                </p>
              </button>
            </div>
          </div>

          {form.watch('lessonType') === 'catalog' && (
            <div className="space-y-2">
              <Label htmlFor="lessonTemplateId">
                Selecione a lição <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.watch('lessonTemplateId') || ''}
                onValueChange={(value) => form.setValue('lessonTemplateId', value)}
              >
                <SelectTrigger id="lessonTemplateId">
                  <SelectValue placeholder="Escolha uma lição..." />
                </SelectTrigger>
                <SelectContent>
                  {lessonTemplates.map((lesson) => (
                    <SelectItem key={lesson.id} value={lesson.id}>
                      {lesson.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.lessonTemplateId && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.lessonTemplateId.message}
                </p>
              )}
            </div>
          )}

          {form.watch('lessonType') === 'custom' && (
            <div className="space-y-2">
              <Label htmlFor="customLessonTitle">
                Título da reunião <span className="text-destructive">*</span>
              </Label>
              <Input
                id="customLessonTitle"
                type="text"
                placeholder="Ex: Culto especial de Natal, Estudo sobre oração..."
                {...form.register('customLessonTitle')}
              />
              <p className="text-xs text-muted-foreground">
                Digite um título descritivo para esta reunião
              </p>
              {form.formState.errors.customLessonTitle && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.customLessonTitle.message}
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="taughtBy">Ministrado por (opcional)</Label>
            <Input
              id="taughtBy"
              type="text"
              placeholder="Nome de quem ministrou a reunião"
              {...form.register('taughtBy')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="comments">Comentários (opcional)</Label>
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
          <MemberAttendanceList
            members={participants}
            selectedMemberIds={selectedMemberIds}
            onToggle={toggleMemberSelection}
            onSelectAll={selectAllMembers}
            onDeselectAll={deselectAllMembers}
          />

          <VisitorAttendanceList
            visitors={visitors}
            selectedVisitorIds={selectedVisitorIds}
            onToggle={toggleVisitorSelection}
            onSelectAll={selectAllVisitors}
            onDeselectAll={deselectAllVisitors}
          />
        </CardContent>
      </Card>

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
    </ClientFormShell>
  );
}
