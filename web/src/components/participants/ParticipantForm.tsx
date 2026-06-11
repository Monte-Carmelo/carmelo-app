'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { ClientFormShell } from '@/components/forms/ClientFormShell';
import { Button } from '@/components/ui/button';
import { ScreenHeader } from '@/components/ui/screen-header';
import { formatBrazilianPhone } from '@/lib/formatters/phone';
import type { Database } from '@/lib/supabase/types';

const schema = z
  .object({
    gcId: z.string({ message: 'Selecione um grupo' }).min(1, 'Selecione um grupo'),
    name: z
      .string({ message: 'Informe o nome' })
      .trim()
      .min(3, 'Nome deve ter pelo menos 3 caracteres'),
    email: z.string().email('E-mail inválido').optional().or(z.literal('')),
    phone: z.string().optional().or(z.literal('')),
    birthDate: z
      .string()
      .optional()
      .or(z.literal(''))
      .refine((value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value), 'Data inválida'),
    role: z.enum(['member', 'leader', 'supervisor'], {
      message: 'Selecione um papel',
    }),
  })
  .superRefine((value, ctx) => {
    if (!value.email?.trim() && !value.phone?.trim()) {
      ctx.addIssue({
        code: 'custom',
        message: 'Informe e-mail ou telefone',
        path: ['email'],
      });
    }

    if (value.role === 'member' && !value.birthDate?.trim()) {
      ctx.addIssue({
        code: 'custom',
        message: 'Informe a data de nascimento para membros',
        path: ['birthDate'],
      });
    }
  });

type FormValues = z.infer<typeof schema>;

type GrowthGroup = Database['public']['Tables']['growth_groups']['Row'];

interface ParticipantFormProps {
  groups: Pick<GrowthGroup, 'id' | 'name'>[];
  preselectedGcId?: string;
}

export function ParticipantForm({ groups, preselectedGcId }: ParticipantFormProps) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      role: 'member',
      gcId: preselectedGcId,
    },
  });

  const phoneField = register('phone', {
    onChange: (event) => {
      event.target.value = formatBrazilianPhone(event.target.value);
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setErrorMessage(null);
    setIsSubmitting(true);
    let isSuccess = false;

    try {
      const response = await fetch('/api/participants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gcId: values.gcId,
          name: values.name.trim(),
          email: values.email?.trim() || null,
          phone: formatBrazilianPhone(values.phone) || null,
          birthDate: values.birthDate?.trim() || null,
          role: values.role,
        }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        setErrorMessage(result.error ?? 'Não foi possível vincular participante ao GC.');
        return;
      }

      isSuccess = true;
      window.location.assign(preselectedGcId ? `/gc/${preselectedGcId}` : '/participants');
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Não foi possível vincular participante ao GC.',
      );
    } finally {
      if (!isSuccess) {
        setIsSubmitting(false);
      }
    }
  });

  return (
    <ClientFormShell
      onSubmit={onSubmit}
      className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10"
      pending={isSubmitting}
    >
      <ScreenHeader
        title="Cadastrar participante"
        subtitle="Adicione rapidamente um participante a um Grupo de Crescimento, definindo o papel e contato básico."
      />

      <div className="grid gap-4 rounded-card bg-white p-6 shadow-sm">
        {preselectedGcId ? (
          // Campo oculto com o GC pré-selecionado
          <input type="hidden" {...register('gcId')} value={preselectedGcId} />
        ) : (
          // Campo de seleção quando não há pré-seleção
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-muted-foreground">
            Grupo de Crescimento
            <select
              className="h-10 rounded-lg border border-input bg-white px-3.5 py-2 text-sm font-normal text-foreground transition-colors placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
              {...register('gcId')}
              defaultValue=""
            >
              <option value="">Selecione...</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
            {errors.gcId ? <span className="text-xs font-medium text-destructive">{errors.gcId.message}</span> : null}
          </label>
        )}

        <label className="flex flex-col gap-1.5 text-xs font-semibold text-muted-foreground">
          Nome completo
          <input
            type="text"
            className="h-10 rounded-lg border border-input bg-white px-3.5 py-2 text-sm font-normal text-foreground transition-colors placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
            placeholder="Ex.: João Pereira"
            {...register('name')}
          />
          {errors.name ? <span className="text-xs font-medium text-destructive">{errors.name.message}</span> : null}
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-muted-foreground">
            E-mail
            <input
              type="email"
              className="h-10 rounded-lg border border-input bg-white px-3.5 py-2 text-sm font-normal text-foreground transition-colors placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
              placeholder="email@exemplo.com"
              {...register('email')}
            />
            {errors.email ? <span className="text-xs font-medium text-destructive">{errors.email.message}</span> : null}
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-semibold text-muted-foreground">
            Telefone
            <input
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              maxLength={15}
              className="h-10 rounded-lg border border-input bg-white px-3.5 py-2 text-sm font-normal text-foreground transition-colors placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
              placeholder="(11) 98888-8888"
              {...phoneField}
            />
            {errors.phone ? <span className="text-xs font-medium text-destructive">{errors.phone.message}</span> : null}
          </label>
        </div>

        <label className="flex flex-col gap-1.5 text-xs font-semibold text-muted-foreground">
          Data de nascimento
          <input
            type="date"
            className="h-10 rounded-lg border border-input bg-white px-3.5 py-2 text-sm font-normal text-foreground transition-colors placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
            {...register('birthDate')}
          />
          <span className="text-xs font-normal text-muted-foreground">Obrigatória quando o papel for membro.</span>
          {errors.birthDate ? <span className="text-xs font-medium text-destructive">{errors.birthDate.message}</span> : null}
        </label>

        <label className="flex flex-col gap-1.5 text-xs font-semibold text-muted-foreground">
          Papel no GC
          <select
            className="w-48 h-10 rounded-lg border border-input bg-white px-3.5 py-2 text-sm font-normal text-foreground transition-colors placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
            {...register('role')}
          >
            <option value="member">Membro</option>
            <option value="leader">Líder</option>
            <option value="supervisor">Supervisor</option>
          </select>
        </label>
      </div>

      {errorMessage ? (
        <div className="rounded-card bg-danger-soft px-4 py-3 text-sm font-medium text-danger">{errorMessage}</div>
      ) : null}

      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : 'Cadastrar participante'}
        </Button>
      </div>
    </ClientFormShell>
  );
}
