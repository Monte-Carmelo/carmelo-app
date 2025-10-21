'use client';

import { useForm } from 'react-hook-form';
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

// Zod Schema
const createGCSchema = z
  .object({
    name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').max(255),
    mode: z.enum(['in_person', 'online', 'hybrid']),
    address: z.string().optional(),
    weekday: z.number().int().min(0).max(6).nullable(),
    time: z.string().nullable(),
    leaderId: z.string().min(1, 'Selecione um líder').uuid('ID inválido'),
    coLeaderId: z.string().uuid('ID inválido').optional().or(z.literal('')),
    supervisorIds: z.array(z.string().uuid()).min(1, 'Selecione pelo menos 1 supervisor'),
    memberIds: z.array(z.string().uuid()).optional(),
  })
  .refine((data) => data.mode !== 'in_person' || (data.address && data.address.trim() !== ''), {
    message: 'Endereço obrigatório para modo presencial',
    path: ['address'],
  });

export type GrowthGroupFormData = z.infer<typeof createGCSchema>;

export interface GrowthGroupFormProps {
  gc?: Partial<GrowthGroupFormData> & { id?: string };
  onSubmit: (data: GrowthGroupFormData) => Promise<void>;
  users: Array<{ id: string; name: string }>;
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

export function AdminGrowthGroupForm({ gc, onSubmit, users }: GrowthGroupFormProps) {
  const {
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
      leaderId: gc?.leaderId || '',
      coLeaderId: gc?.coLeaderId || '',
      supervisorIds: gc?.supervisorIds || [],
      memberIds: gc?.memberIds || [],
    },
  });

  const mode = watch('mode');
  const showAddress = mode === 'in_person' || mode === 'hybrid';

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
          {/* Líder Principal */}
          <div className="space-y-2">
            <Label htmlFor="leaderId">
              Líder Principal <span className="text-red-500">*</span>
            </Label>
            <Select
              value={watch('leaderId')}
              onValueChange={(value) => setValue('leaderId', value)}
            >
              <SelectTrigger id="leaderId">
                <SelectValue placeholder="Selecione o líder" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.leaderId && <p className="text-sm text-red-500">{errors.leaderId.message}</p>}
          </div>

          {/* Co-líder */}
          <div className="space-y-2">
            <Label htmlFor="coLeaderId">Co-líder (Opcional)</Label>
            <Select
              value={watch('coLeaderId') || undefined}
              onValueChange={(value) => setValue('coLeaderId', value === 'none' ? '' : value)}
            >
              <SelectTrigger id="coLeaderId">
                <SelectValue placeholder="Nenhum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.coLeaderId && (
              <p className="text-sm text-red-500">{errors.coLeaderId.message}</p>
            )}
          </div>

          {/* Supervisores - Simplified for now, will need multi-select */}
          <div className="space-y-2">
            <Label htmlFor="supervisorId">
              Supervisor <span className="text-red-500">*</span>
            </Label>
            <Select
              value={watch('supervisorIds')?.[0] || ''}
              onValueChange={(value) => setValue('supervisorIds', value ? [value] : [])}
            >
              <SelectTrigger id="supervisorId">
                <SelectValue placeholder="Selecione o supervisor" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.supervisorIds && (
              <p className="text-sm text-red-500">{errors.supervisorIds.message}</p>
            )}
            <p className="text-xs text-slate-500">
              Nota: Multi-seleção de supervisores será implementada em próxima iteração
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : gc?.id ? 'Atualizar GC' : 'Criar GC'}
        </Button>
      </div>
    </form>
  );
}
