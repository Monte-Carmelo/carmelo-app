'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2 } from 'lucide-react';
import { ClientFormShell } from '@/components/forms/ClientFormShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const seriesSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').max(255),
  description: z.string().optional(),
  initialLessons: z
    .array(
      z.object({
        title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres').max(255),
        description: z.string().optional(),
        link: z.string().url('Link inválido').optional().or(z.literal('')),
      })
    )
    .optional(),
});

export type SeriesFormData = z.infer<typeof seriesSchema>;

interface AdminSeriesFormProps {
  series?: {
    id: string;
    name: string;
    description: string | null;
  };
  onSubmit: (data: SeriesFormData) => Promise<void>;
  onCancel?: () => void;
}

export function AdminSeriesForm({ series, onSubmit, onCancel }: AdminSeriesFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!series;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<SeriesFormData>({
    resolver: zodResolver(seriesSchema),
    defaultValues: {
      name: series?.name || '',
      description: series?.description || '',
      initialLessons: isEditing ? undefined : [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'initialLessons',
  });

  const handleFormSubmit = async (data: SeriesFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ClientFormShell onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6" pending={isSubmitting}>
        <Card>
          <CardHeader>
            <CardTitle>Informações da Série</CardTitle>
            <CardDescription>
              {isEditing ? 'Edite as informações da série' : 'Preencha os dados da nova série'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Nome */}
            <div>
              <Label htmlFor="name">
                Nome da Série <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Ex: Fundamentos da Fé"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>}
            </div>

            {/* Descrição */}
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Descreva brevemente o conteúdo desta série..."
                rows={3}
                className={errors.description ? 'border-red-500' : ''}
              />
              {errors.description && (
                <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lições Iniciais (apenas para criação) */}
        {!isEditing && (
          <Card>
            <CardHeader>
              <CardTitle>Lições Iniciais (Opcional)</CardTitle>
              <CardDescription>
                Adicione lições à série agora ou adicione-as depois
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="p-4 border border-slate-200 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-slate-900">Lição {index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div>
                    <Label htmlFor={`initialLessons.${index}.title`}>
                      Título <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id={`initialLessons.${index}.title`}
                      {...register(`initialLessons.${index}.title`)}
                      placeholder="Ex: Introdução à Bíblia"
                      className={
                        errors.initialLessons?.[index]?.title ? 'border-red-500' : ''
                      }
                    />
                    {errors.initialLessons?.[index]?.title && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.initialLessons[index]?.title?.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor={`initialLessons.${index}.description`}>Descrição</Label>
                    <Textarea
                      id={`initialLessons.${index}.description`}
                      {...register(`initialLessons.${index}.description`)}
                      placeholder="Descrição da lição..."
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor={`initialLessons.${index}.link`}>Link (opcional)</Label>
                    <Input
                      id={`initialLessons.${index}.link`}
                      {...register(`initialLessons.${index}.link`)}
                      type="url"
                      placeholder="https://..."
                      className={
                        errors.initialLessons?.[index]?.link ? 'border-red-500' : ''
                      }
                    />
                    {errors.initialLessons?.[index]?.link && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.initialLessons[index]?.link?.message}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  append({
                    title: '',
                    description: '',
                    link: '',
                  })
                }
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Lição
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Ações */}
        <div className="flex gap-3 justify-end">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Criar Série'}
          </Button>
        </div>
    </ClientFormShell>
  );
}
