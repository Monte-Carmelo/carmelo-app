'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Calendar, FileText } from 'lucide-react';
import { ClientFormShell } from '@/components/forms/ClientFormShell';
import type { CreateMeetingInput } from '@/lib/supabase/mutations/meetings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const schema = z.object({
  gcId: z.string({ message: 'Selecione um GC' }),
  lessonTemplateId: z.string().optional().or(z.literal('')),
  lessonTitle: z.string({ message: 'Informe o título da lição' }).min(3, 'Título muito curto'),
  meetingDate: z.string({ message: 'Informe a data' }),
  meetingTime: z.string({ message: 'Informe o horário' }),
  comments: z.string().max(1000, 'Texto muito longo').optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

export interface ScheduleMeetingFormProps {
  userId: string;
  growthGroups: { id: string; name: string }[];
  lessonTemplates?: { id: string; title: string }[];
  onSubmit: (input: CreateMeetingInput) => Promise<{ success: boolean; meetingId?: string; error?: string }>;
}

export function ScheduleMeetingForm({
  userId,
  growthGroups,
  lessonTemplates = [],
  onSubmit,
}: ScheduleMeetingFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      meetingDate: new Date().toISOString().split('T')[0],
      meetingTime: '19:30',
      lessonTitle: '',
    },
  });

  const selectedTemplateId = watch('lessonTemplateId');
  const selectedTemplate = lessonTemplates.find((t) => t.id === selectedTemplateId);

  const handleFormSubmit = handleSubmit(async (values) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    const datetime = new Date(`${values.meetingDate}T${values.meetingTime}:00`).toISOString();

    const result = await onSubmit({
      gcId: values.gcId,
      lessonTemplateId: values.lessonTemplateId || null,
      lessonTitle: values.lessonTitle.trim(),
      datetime,
      comments: values.comments?.trim() || null,
      registeredByUserId: userId,
    });

    setIsSubmitting(false);

    if (result.success && result.meetingId) {
      router.push(`/dashboard/gc/reunioes/${result.meetingId}`);
      router.refresh();
    } else {
      setErrorMessage(result.error ?? 'Erro ao criar reunião');
    }
  });

  return (
    <ClientFormShell
      onSubmit={handleFormSubmit}
      className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8"
      pending={isSubmitting}
    >
      <ScreenHeader
        title="Agendar reunião"
        subtitle="Crie uma nova reunião para o seu Grupo de Crescimento."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-[17px] font-bold">Informações básicas</CardTitle>
          <CardDescription>Defina o GC, data e horário da reunião</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="gcId" className="text-xs font-semibold text-muted-foreground">Grupo de Crescimento</Label>
            <Select
              onValueChange={(value) => setValue('gcId', value)}
              defaultValue=""
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {growthGroups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.gcId && <p className="text-sm text-destructive">{errors.gcId.message}</p>}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="meetingDate" className="text-xs font-semibold text-muted-foreground">Data</Label>
              <Input
                id="meetingDate"
                type="date"
                {...register('meetingDate')}
              />
              {errors.meetingDate && <p className="text-sm text-destructive">{errors.meetingDate.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="meetingTime" className="text-xs font-semibold text-muted-foreground">Horário</Label>
              <Input
                id="meetingTime"
                type="time"
                {...register('meetingTime')}
              />
              {errors.meetingTime && <p className="text-sm text-destructive">{errors.meetingTime.message}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[17px] font-bold">
            <FileText className="h-5 w-5" />
            Lição
          </CardTitle>
          <CardDescription>Configure o tema ou lição da reunião</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {lessonTemplates.length > 0 && (
            <div className="space-y-1.5">
              <Label htmlFor="lessonTemplateId" className="text-xs font-semibold text-muted-foreground">Lição do catálogo (opcional)</Label>
              <Select
                onValueChange={(value) => setValue('lessonTemplateId', value === 'none' ? '' : value)}
                defaultValue="none"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Nenhuma (usar título customizado)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma (usar título customizado)</SelectItem>
                  {lessonTemplates.map((lesson) => (
                    <SelectItem key={lesson.id} value={lesson.id}>
                      {lesson.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="lessonTitle" className="text-xs font-semibold text-muted-foreground">Título da lição</Label>
            <Input
              id="lessonTitle"
              type="text"
              placeholder={selectedTemplate ? selectedTemplate.title : 'Ex.: Adoração e Comunhão'}
              {...register('lessonTitle')}
            />
            {errors.lessonTitle && <p className="text-sm text-destructive">{errors.lessonTitle.message}</p>}
            {selectedTemplate && (
              <p className="text-[13px] leading-relaxed text-muted-foreground">
                Você pode usar o título padrão ou substituir por um customizado.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="comments" className="text-xs font-semibold text-muted-foreground">Comentários (opcional)</Label>
            <Textarea
              id="comments"
              rows={3}
              placeholder="Destaques, pedidos de oração, etc."
              {...register('comments')}
            />
            {errors.comments && <p className="text-sm text-destructive">{errors.comments.message}</p>}
          </div>
        </CardContent>
      </Card>

      {errorMessage && (
        <div className="rounded-card bg-danger-soft px-4 py-3.5 shadow-sm">
          <p className="text-sm font-medium text-danger">{errorMessage}</p>
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
          <Calendar className="mr-2 h-4 w-4" />
          {isSubmitting ? 'Criando...' : 'Criar reunião'}
        </Button>
      </div>
    </ClientFormShell>
  );
}
