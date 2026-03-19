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
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Agendar reunião</h1>
        <p className="text-muted-foreground">Crie uma nova reunião para o seu Grupo de Crescimento.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações básicas</CardTitle>
          <CardDescription>Defina o GC, data e horário da reunião</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gcId">Grupo de Crescimento</Label>
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
            <div className="space-y-2">
              <Label htmlFor="meetingDate">Data</Label>
              <Input
                id="meetingDate"
                type="date"
                {...register('meetingDate')}
              />
              {errors.meetingDate && <p className="text-sm text-destructive">{errors.meetingDate.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="meetingTime">Horário</Label>
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
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Lição
          </CardTitle>
          <CardDescription>Configure o tema ou lição da reunião</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {lessonTemplates.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="lessonTemplateId">Lição do catálogo (opcional)</Label>
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

          <div className="space-y-2">
            <Label htmlFor="lessonTitle">Título da lição</Label>
            <Input
              id="lessonTitle"
              type="text"
              placeholder={selectedTemplate ? selectedTemplate.title : 'Ex.: Adoração e Comunhão'}
              {...register('lessonTitle')}
            />
            {errors.lessonTitle && <p className="text-sm text-destructive">{errors.lessonTitle.message}</p>}
            {selectedTemplate && (
              <p className="text-sm text-muted-foreground">
                Você pode usar o título padrão ou substituir por um customizado.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="comments">Comentários (opcional)</Label>
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
        <Button type="submit" disabled={isSubmitting}>
          <Calendar className="mr-2 h-4 w-4" />
          {isSubmitting ? 'Criando...' : 'Criar reunião'}
        </Button>
      </div>
    </ClientFormShell>
  );
}
