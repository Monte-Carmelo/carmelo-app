'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { UserPlus, Mail, Phone, Users } from 'lucide-react';
import { ClientFormShell } from '@/components/forms/ClientFormShell';
import type { AddVisitorInput } from '@/lib/supabase/mutations/visitors';
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

const schema = z
  .object({
    gcId: z.string({ message: 'Selecione um GC' }),
    name: z.string({ message: 'Informe o nome' }).min(3, 'Nome muito curto'),
    email: z.string().email('E-mail inválido').optional().or(z.literal('')),
    phone: z.string().optional().or(z.literal('')),
    initialVisitCount: z.number().min(0).max(50),
  })
  .refine((value) => value.email?.trim() || value.phone?.trim(), {
    message: 'Informe e-mail ou telefone',
    path: ['email'],
  });

type FormValues = z.infer<typeof schema>;

export interface AddVisitorFormProps {
  growthGroups: { id: string; name: string }[];
  preselectedGcId?: string;
  onSubmit: (input: AddVisitorInput) => Promise<{ success: boolean; visitorId?: string; error?: string }>;
}

export function AddVisitorForm({ growthGroups, preselectedGcId, onSubmit }: AddVisitorFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      gcId: preselectedGcId || '',
      initialVisitCount: 0,
    },
  });

  const handleFormSubmit = handleSubmit(async (values) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    const result = await onSubmit({
      gcId: values.gcId,
      name: values.name.trim(),
      email: values.email?.trim() || null,
      phone: values.phone?.trim() || null,
      initialVisitCount: values.initialVisitCount,
    });

    setIsSubmitting(false);

    if (result.success) {
      router.back();
      router.refresh();
    } else {
      setErrorMessage(result.error ?? 'Erro ao adicionar visitante');
    }
  });

  return (
    <ClientFormShell
      onSubmit={handleFormSubmit}
      className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10"
      pending={isSubmitting}
    >
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Cadastrar visitante</h1>
        <p className="text-muted-foreground">Adicione uma nova pessoa como visitante de um Grupo de Crescimento.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Informações do visitante
          </CardTitle>
          <CardDescription>Preencha os dados básicos para registrar um novo visitante</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gcId">
              <Users className="inline h-4 w-4 mr-1" />
              Grupo de Crescimento
            </Label>
            <Select
              onValueChange={(value) => setValue('gcId', value)}
              defaultValue={preselectedGcId || ''}
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

          <div className="space-y-2">
            <Label htmlFor="name">Nome completo</Label>
            <Input
              id="name"
              type="text"
              placeholder="Ex.: Maria da Silva"
              {...register('name')}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">
                <Mail className="inline h-4 w-4 mr-1" />
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="email@exemplo.com"
                {...register('email')}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">
                <Phone className="inline h-4 w-4 mr-1" />
                Telefone
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(11) 99999-9999"
                {...register('phone')}
              />
              {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="initialVisitCount">Visitas já realizadas (opcional)</Label>
            <Input
              id="initialVisitCount"
              type="number"
              min={0}
              max={50}
              className="w-32"
              {...register('initialVisitCount', { valueAsNumber: true })}
            />
            <p className="text-sm text-muted-foreground">
              Caso o visitante já tenha frequentado o GC antes deste cadastro, informe o número de visitas.
            </p>
            {errors.initialVisitCount && (
              <p className="text-sm text-destructive">{errors.initialVisitCount.message}</p>
            )}
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
          <UserPlus className="mr-2 h-4 w-4" />
          {isSubmitting ? 'Salvando...' : 'Cadastrar visitante'}
        </Button>
      </div>
    </ClientFormShell>
  );
}
