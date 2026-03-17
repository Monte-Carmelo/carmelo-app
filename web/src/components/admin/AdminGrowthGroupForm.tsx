'use client';

import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MultiSelect } from '@/components/ui/multi-select';
import { useClientReady } from '@/lib/hooks/use-client-ready';
import { postgresUuid } from '@/lib/validation/postgres-uuid';

// Zod Schema
const createGCSchema = z
  .object({
    name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').max(255),
    mode: z.enum(['in_person', 'online', 'hybrid']),
    address: z.string().optional(),
    weekday: z.number().int().min(0).max(6).nullable(),
    time: z.string().nullable(),
    leaderIds: z.array(postgresUuid('Líder inválido.')).min(1, 'Selecione pelo menos 1 líder'),
    supervisorIds: z.array(postgresUuid('Supervisor inválido.')).min(1, 'Selecione pelo menos 1 supervisor'),
    memberIds: z.array(postgresUuid('Membro inválido.')).optional(),
  })
  .refine((data) => data.mode !== 'in_person' || (data.address && data.address.trim() !== ''), {
    message: 'Endereço obrigatório para modo presencial',
    path: ['address'],
  });

export type GrowthGroupFormData = z.infer<typeof createGCSchema>;

export interface GrowthGroupFormProps {
  gc?: Partial<GrowthGroupFormData> & { id?: string };
  onSubmit: (data: GrowthGroupFormData) => Promise<void>;
  people: Array<{ id: string; name: string }>;
}

const modeOptions = [
  { value: 'in_person', label: 'Presencial' },
  { value: 'online', label: 'Online' },
  { value: 'hybrid', label: 'Híbrido' },
];

const weekdayOptions = [
  { value: '0', label: 'Domingo' },
  { value: '1', label: 'Segunda-feira' },
  { value: '2', label: 'Terça-feira' },
  { value: '3', label: 'Quarta-feira' },
  { value: '4', label: 'Quinta-feira' },
  { value: '5', label: 'Sexta-feira' },
  { value: '6', label: 'Sábado' },
];

export function AdminGrowthGroupForm({ gc, onSubmit, people }: GrowthGroupFormProps) {
  const isClientReady = useClientReady();
  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<GrowthGroupFormData>({
    resolver: zodResolver(createGCSchema),
    defaultValues: {
      name: gc?.name || '',
      mode: gc?.mode || 'in_person',
      address: gc?.address || '',
      weekday: gc?.weekday ?? null,
      time: gc?.time || '',
      leaderIds: gc?.leaderIds || [],
      supervisorIds: gc?.supervisorIds || [],
      memberIds: gc?.memberIds || [],
    },
  });

  const mode = watch('mode');
  const showAddress = mode === 'in_person' || mode === 'hybrid';

  const peopleOptions = people.map((person) => ({ label: person.name, value: person.id }));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informações Básicas</CardTitle>
          <CardDescription>Dados principais do Grupo de Crescimento</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Nome do GC <span className="text-red-500">*</span>
            </Label>
            <Input id="name" {...register('name')} placeholder="Ex: GC Esperança" />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>

          {/* Modo */}
          <div className="space-y-2">
            <Label htmlFor="mode">
              Modo <span className="text-red-500">*</span>
            </Label>
            <Select
              value={watch('mode')}
              onValueChange={(value) => setValue('mode', value as 'in_person' | 'online' | 'hybrid')}
            >
              <SelectTrigger id="mode">
                <SelectValue placeholder="Selecione o modo" />
              </SelectTrigger>
              <SelectContent>
                {modeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.mode && <p className="text-sm text-red-500">{errors.mode.message}</p>}
          </div>

          {/* Endereço (condicional) */}
          {showAddress && (
            <div className="space-y-2">
              <Label htmlFor="address">
                Endereço <span className="text-red-500">*</span>
              </Label>
              <Input
                id="address"
                {...register('address')}
                placeholder="Rua, número, bairro"
              />
              {errors.address && <p className="text-sm text-red-500">{errors.address.message}</p>}
            </div>
          )}

          {/* Dia da Semana */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weekday">Dia da Semana</Label>
              <Select
                value={watch('weekday')?.toString() || ''}
                onValueChange={(value) => setValue('weekday', value ? parseInt(value) : null)}
              >
                <SelectTrigger id="weekday">
                  <SelectValue placeholder="Selecione o dia" />
                </SelectTrigger>
                <SelectContent>
                  {weekdayOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.weekday && <p className="text-sm text-red-500">{errors.weekday.message}</p>}
            </div>

            {/* Horário */}
            <div className="space-y-2">
              <Label htmlFor="time">Horário</Label>
              <Input id="time" type="time" {...register('time')} />
              {errors.time && <p className="text-sm text-red-500">{errors.time.message}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Liderança</CardTitle>
          <CardDescription>Defina os líderes e supervisores do GC</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Líderes (Multi-select) */}
          <div className="space-y-2">
            <Label htmlFor="leaderIds">
              Líderes <span className="text-red-500">*</span>
            </Label>
            <Controller
              name="leaderIds"
              control={control}
              render={({ field, fieldState }) => (
                <>
                  <MultiSelect
                    options={peopleOptions}
                    selected={field.value || []}
                    onChange={(selected) => field.onChange(selected)}
                    placeholder="Selecione os líderes"
                  />
                  {fieldState.error?.message ? (
                    <p className="text-sm text-red-500">{fieldState.error.message}</p>
                  ) : null}
                </>
              )}
            />
            <p className="text-xs text-slate-500">
              Selecione um ou mais líderes para o GC. Todos têm autoridade igual.
            </p>
          </div>

          {/* Supervisores (Multi-select) */}
          <div className="space-y-2">
            <Label htmlFor="supervisorIds">
              Supervisores <span className="text-red-500">*</span>
            </Label>
            <Controller
              name="supervisorIds"
              control={control}
              render={({ field, fieldState }) => (
                <>
                  <MultiSelect
                    options={peopleOptions}
                    selected={field.value || []}
                    onChange={(selected) => field.onChange(selected)}
                    placeholder="Selecione os supervisores"
                  />
                  {fieldState.error?.message ? (
                    <p className="text-sm text-red-500">{fieldState.error.message}</p>
                  ) : null}
                </>
              )}
            />
            <p className="text-xs text-slate-500">
              Selecione um ou mais supervisores responsáveis pelo GC.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={!isClientReady || isSubmitting}>
          {isSubmitting ? 'Salvando...' : gc?.id ? 'Atualizar GC' : 'Criar GC'}
        </Button>
      </div>
    </form>
  );
}
