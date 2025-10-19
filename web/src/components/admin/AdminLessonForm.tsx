'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const lessonSchema = z.object({
  title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres').max(255),
  description: z.string().optional(),
  link: z.string().optional(),
  series_id: z.string().optional(),
  order_in_series: z.number().int().min(1).optional().nullable(),
});

export type LessonFormData = z.infer<typeof lessonSchema>;

export interface LessonSeries {
  id: string;
  name: string;
}

interface AdminLessonFormProps {
  lesson?: {
    id: string;
    title: string;
    description: string | null;
    link: string | null;
    series_id: string | null;
    order_in_series: number | null;
  };
  series: LessonSeries[];
  defaultSeriesId?: string;
  onSubmit: (data: LessonFormData) => Promise<void>;
  onCancel?: () => void;
}

export function AdminLessonForm({
  lesson,
  series,
  defaultSeriesId,
  onSubmit,
  onCancel,
}: AdminLessonFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!lesson;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LessonFormData>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      title: lesson?.title || '',
      description: lesson?.description || '',
      link: lesson?.link || '',
      series_id: lesson?.series_id || defaultSeriesId || '',
      order_in_series: lesson?.order_in_series || null,
    },
  });

  const selectedSeriesId = watch('series_id');

  // Handle the "no series" option with a special placeholder value
  const handleSeriesChange = (value: string) => {
    const finalValue = value === 'none' ? '' : value;
    setValue('series_id', finalValue);
  };

  const handleFormSubmit = async (data: LessonFormData) => {
    setIsSubmitting(true);
    try {
      // Validate UUID format for series_id if provided
      let seriesId = data.series_id || null;
      if (seriesId && seriesId !== '') {
        // Basic UUID validation
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(seriesId)) {
          throw new Error('ID da série inválido');
        }
      } else {
        seriesId = null;
      }

      // Convert empty string to null for optional fields
      const processedData = {
        ...data,
        series_id: seriesId,
        link: data.link || null,
        description: data.description || null,
      };
      await onSubmit(processedData as LessonFormData);
    } catch (error) {
      console.error('Error submitting form:', error);
      // You might want to show a toast notification here
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informações da Lição</CardTitle>
          <CardDescription>
            {isEditing ? 'Edite as informações da lição' : 'Preencha os dados da nova lição'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Título */}
          <div>
            <Label htmlFor="title">
              Título <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="Ex: Introdução à Bíblia"
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>}
          </div>

          {/* Descrição */}
          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Descreva o conteúdo da lição..."
              rows={4}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && (
              <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
            )}
          </div>

          {/* Link */}
          <div>
            <Label htmlFor="link">Link para Recurso (opcional)</Label>
            <Input
              id="link"
              {...register('link')}
              placeholder="https://..."
              className={errors.link ? 'border-red-500' : ''}
            />
            {errors.link && <p className="text-sm text-red-600 mt-1">{errors.link.message}</p>}
            <p className="text-sm text-slate-500 mt-1">
              Link para vídeo, PDF, artigo ou outro material relacionado
            </p>
          </div>

          {/* Série */}
          <div>
            <Label htmlFor="series_id">Série (opcional)</Label>
            <Select
              value={selectedSeriesId || 'none'}
              onValueChange={handleSeriesChange}
            >
              <SelectTrigger className={errors.series_id ? 'border-red-500' : ''}>
                <SelectValue placeholder="Selecione uma série ou deixe como lição avulsa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem série (lição avulsa)</SelectItem>
                {series.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.series_id && (
              <p className="text-sm text-red-600 mt-1">{errors.series_id.message}</p>
            )}
          </div>

          {/* Ordem na Série (condicional) */}
          {selectedSeriesId && selectedSeriesId !== 'none' && (
            <div>
              <Label htmlFor="order_in_series">Ordem na Série</Label>
              <Input
                id="order_in_series"
                type="number"
                min="1"
                {...register('order_in_series', { valueAsNumber: true })}
                placeholder="Ex: 1"
                className={errors.order_in_series ? 'border-red-500' : ''}
              />
              {errors.order_in_series && (
                <p className="text-sm text-red-600 mt-1">{errors.order_in_series.message}</p>
              )}
              <p className="text-sm text-slate-500 mt-1">
                Posição desta lição dentro da série (pode ser ajustada depois via drag-and-drop)
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ações */}
      <div className="flex gap-3 justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Criar Lição'}
        </Button>
      </div>
    </form>
  );
}
