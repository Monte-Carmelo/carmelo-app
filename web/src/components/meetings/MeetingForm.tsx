'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { Calendar, FileText, UserCheck } from 'lucide-react';
import type { LessonTemplate } from '@/lib/api/lessons';
import type {
  AttendanceMemberOption,
  AttendanceVisitorOption,
} from '@/lib/api/growth-group-attendance';
import type { Database } from '@/lib/supabase/types';
import { ClientFormShell } from '@/components/forms/ClientFormShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MemberAttendanceList } from '@/components/meetings/attendance/MemberAttendanceList';
import { VisitorAttendanceList } from '@/components/meetings/attendance/VisitorAttendanceList';
import { LessonSelector } from '@/components/lessons/lesson-selector';

const schema = z
  .object({
    gcId: z.string({ message: 'Selecione um GC' }),
    meetingDate: z.string({ message: 'Informe a data da reunião' }),
    meetingTime: z.string({ message: 'Informe o horário da reunião' }),
    lessonType: z.enum(['catalog', 'custom'], { message: 'Escolha o tipo de lição' }),
    lessonTemplateId: z.string().optional(),
    customLessonTitle: z.string().max(255, 'Título muito longo').optional(),
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

type GrowthGroup = Database['public']['Tables']['growth_groups']['Row'];

interface MeetingFormProps {
  userId: string;
  groups: Pick<GrowthGroup, 'id' | 'name'>[];
  lessonTemplates: LessonTemplate[];
  defaultGcId?: string;
  defaultGcName?: string;
  defaultDate?: string;
  defaultTime?: string;
  initialParticipants?: AttendanceMemberOption[];
  initialVisitors?: AttendanceVisitorOption[];
}

export function MeetingForm({
  userId,
  groups,
  lessonTemplates,
  defaultGcId,
  defaultGcName,
  defaultDate,
  defaultTime,
  initialParticipants = [],
  initialVisitors = [],
}: MeetingFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [participants, setParticipants] = useState<AttendanceMemberOption[]>(initialParticipants);
  const [visitors, setVisitors] = useState<AttendanceVisitorOption[]>(initialVisitors);
  const [isFetchingAttendance, setIsFetchingAttendance] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      gcId: defaultGcId || '',
      meetingDate: defaultDate || new Date().toISOString().split('T')[0],
      meetingTime: defaultTime || '19:30',
      lessonType: 'catalog',
      lessonTemplateId: '',
      customLessonTitle: '',
      members: [],
      visitors: [],
    },
  });

  const membersFieldArray = useFieldArray({ name: 'members', control: form.control });
  const visitorsFieldArray = useFieldArray({ name: 'visitors', control: form.control });

  // Carregar participantes e visitantes automaticamente se gcId vier pré-selecionado
  useEffect(() => {
    if (defaultGcId && initialParticipants.length === 0 && initialVisitors.length === 0) {
      void handleGroupChange(defaultGcId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultGcId]);

  const handleGroupChange = async (gcId: string) => {
    form.setValue('gcId', gcId, { shouldValidate: true });
    form.setValue('members', [], { shouldValidate: true });
    form.setValue('visitors', [], { shouldValidate: true });
    setParticipants([]);
    setVisitors([]);
    setErrorMessage(null);

    if (!gcId) return;

    setIsFetchingAttendance(true);

    try {
      const response = await fetch(`/api/growth-groups/${gcId}/attendance-options`, {
        cache: 'no-store',
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? 'Falha ao carregar participantes e visitantes.');
      }

      setParticipants(payload.members ?? []);
      setVisitors(payload.visitors ?? []);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Falha ao carregar participantes e visitantes.',
      );
    } finally {
      setIsFetchingAttendance(false);
    }
  };

  const handleSubmit = form.handleSubmit(async (values) => {
    setErrorMessage(null);
    setIsSubmitting(true);
    let isSuccess = false;

    // Determinar o título da lição baseado no tipo selecionado
    let lessonTitle: string;
    if (values.lessonType === 'custom') {
      lessonTitle = values.customLessonTitle?.trim() || '';
    } else {
      lessonTitle = lessonTemplates.find((lesson) => lesson.id === values.lessonTemplateId)?.title || '';
    }

    // Validação adicional (não deveria acontecer devido ao Zod)
    if (!lessonTitle) {
      setErrorMessage('Por favor, selecione uma lição ou informe um título personalizado');
      setIsSubmitting(false);
      return;
    }

    const datetime = new Date(`${values.meetingDate}T${values.meetingTime}:00`);

    try {
      const response = await fetch('/api/meetings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gcId: values.gcId,
          lessonTemplateId: values.lessonType === 'catalog' ? values.lessonTemplateId || null : null,
          lessonTitle,
          comments: values.comments?.trim() || null,
          datetime: datetime.toISOString(),
          memberAttendance: values.members.map((member) => member.participantId),
          visitorAttendance: values.visitors.map((visitor) => visitor.visitorId),
        }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        setErrorMessage(result.error ?? 'Falha ao criar reunião');
        return;
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['leader-dashboard', userId] }),
        queryClient.invalidateQueries({ queryKey: ['meetings'] }),
        queryClient.invalidateQueries({ queryKey: ['gc', values.gcId] }),
      ]);

      isSuccess = true;
      window.location.assign(`/gc/${values.gcId}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Falha ao criar reunião');
    } finally {
      if (!isSuccess) {
        setIsSubmitting(false);
      }
    }
  });

  const selectedMemberIds = form.watch('members').map((item) => item.participantId);
  const selectedVisitorIds = form.watch('visitors').map((item) => item.visitorId);

  const toggleMemberSelection = (memberId: string, checked: boolean) => {
    if (checked) {
      membersFieldArray.append({ participantId: memberId });
      return;
    }

    const index = form.getValues('members').findIndex((item) => item.participantId === memberId);
    if (index >= 0) {
      membersFieldArray.remove(index);
    }
  };

  const toggleVisitorSelection = (visitorId: string, checked: boolean) => {
    if (checked) {
      visitorsFieldArray.append({ visitorId });
      return;
    }

    const index = form.getValues('visitors').findIndex((item) => item.visitorId === visitorId);
    if (index >= 0) {
      visitorsFieldArray.remove(index);
    }
  };

  return (
    <ClientFormShell
      onSubmit={handleSubmit}
      className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8"
      pending={isSubmitting}
    >
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Registrar reunião</h1>
        <p className="text-muted-foreground">
          Selecione o grupo, configure a lição e marque presenças de membros e visitantes.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Informações básicas
          </CardTitle>
          <CardDescription>Defina o GC, data e horário da reunião</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gcId">Grupo de Crescimento</Label>
            {defaultGcId ? (
              <div className="space-y-1">
                <Input
                  id="gcId"
                  type="text"
                  value={defaultGcName || ''}
                  readOnly
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  GC pré-selecionado. Para alterar, volte ao dashboard.
                </p>
              </div>
            ) : (
              <Select
                value={form.watch('gcId')}
                onValueChange={(value) => {
                  void handleGroupChange(value);
                }}
              >
                <SelectTrigger id="gcId">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {form.formState.errors.gcId && (
              <p className="text-sm text-destructive">{form.formState.errors.gcId.message}</p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="meetingDate">Data</Label>
              <Input
                id="meetingDate"
                type="date"
                {...form.register('meetingDate')}
              />
              {form.formState.errors.meetingDate && (
                <p className="text-sm text-destructive">{form.formState.errors.meetingDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="meetingTime">Horário</Label>
              <Input
                id="meetingTime"
                type="time"
                {...form.register('meetingTime')}
              />
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
          <CardDescription>Escolha uma lição do catálogo ou crie um título personalizado</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <LessonSelector
            lessonType={form.watch('lessonType')}
            lessonTemplates={lessonTemplates}
            selectedLessonTemplateId={form.watch('lessonTemplateId') || ''}
            customLessonTitle={form.watch('customLessonTitle') || ''}
            lessonTemplateError={form.formState.errors.lessonTemplateId?.message}
            customLessonTitleError={form.formState.errors.customLessonTitle?.message}
            onLessonTypeChange={(type) => {
              form.setValue('lessonType', type, { shouldValidate: true });
              if (type === 'catalog') {
                form.setValue('customLessonTitle', '', { shouldValidate: true });
              } else {
                form.setValue('lessonTemplateId', '', { shouldValidate: true });
              }
            }}
            onLessonTemplateChange={(value) =>
              form.setValue('lessonTemplateId', value, { shouldValidate: true })
            }
            onCustomLessonTitleChange={(value) =>
              form.setValue('customLessonTitle', value, { shouldValidate: true })
            }
          />

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
          />

          <VisitorAttendanceList
            visitors={visitors}
            selectedVisitorIds={selectedVisitorIds}
            onToggle={toggleVisitorSelection}
          />
        </CardContent>
      </Card>

      {errorMessage && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{errorMessage}</p>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting || isFetchingAttendance}>
          <Calendar className="mr-2 h-4 w-4" />
          {isSubmitting ? 'Salvando...' : 'Registrar reunião'}
        </Button>
      </div>
    </ClientFormShell>
  );
}
