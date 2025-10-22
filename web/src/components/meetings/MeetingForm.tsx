'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { Calendar, FileText, Users, UserCheck } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import type { Database } from '@/lib/supabase/types';
import { translateRole } from '@/lib/role-translations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

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
  defaultGcId?: string;
  defaultGcName?: string;
  defaultDate?: string;
  defaultTime?: string;
}

export function MeetingForm({
  userId,
  groups,
  lessonTemplates,
  defaultGcId,
  defaultGcName,
  defaultDate,
  defaultTime,
}: MeetingFormProps) {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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
    if (defaultGcId) {
      handleGroupChange(defaultGcId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultGcId]);

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
        .in('role', ['member', 'leader'])
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
      setIsLoading(false);
      return;
    }

    const datetime = new Date(`${values.meetingDate}T${values.meetingTime}:00`);

    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .insert({
        gc_id: values.gcId,
        lesson_template_id: values.lessonType === 'catalog' ? values.lessonTemplateId || null : null,
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
    router.push(`/gc/${values.gcId}`);
    router.refresh();
  });

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
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
                {...form.register('gcId')}
                onValueChange={handleGroupChange}
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
          {/* Seletor de tipo de lição */}
          <div className="space-y-3">
            <Label>Tipo de lição</Label>
            <div className="grid gap-3 md:grid-cols-2">
              {/* Opção: Lição do Catálogo */}
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

              {/* Opção: Título Personalizado */}
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

          {/* Campo condicional: Lição do Catálogo */}
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

          {/* Campo condicional: Título Personalizado */}
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
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Users className="h-4 w-4" />
              Membros
            </h3>
            <div className="space-y-2">
              {participants.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Selecione um GC para carregar a lista de membros e líderes.
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
                        <span className="ml-2 text-xs tracking-wide text-muted-foreground">
                          {translateRole(participant.role)}
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

      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          <Calendar className="mr-2 h-4 w-4" />
          {isLoading ? 'Salvando...' : 'Registrar reunião'}
        </Button>
      </div>
    </form>
  );
}
