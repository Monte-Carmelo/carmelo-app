'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { ClientFormShell } from '@/components/forms/ClientFormShell';
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
    status: z.enum(['active', 'inactive', 'transferred'], {
      message: 'Selecione um status',
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

type ParticipantDetail = {
  participantId: string;
  personId: string;
  gcId: string;
  role: Database['public']['Tables']['growth_group_participants']['Row']['role'];
  status: Database['public']['Tables']['growth_group_participants']['Row']['status'];
  name: string;
  email: string | null;
  phone: string | null;
  birthDate: string | null;
};

interface ParticipantEditFormProps {
  participant: ParticipantDetail;
  groups: Pick<GrowthGroup, 'id' | 'name'>[];
}

export function ParticipantEditForm({ participant, groups }: ParticipantEditFormProps) {
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
      gcId: participant.gcId,
      name: participant.name,
      email: participant.email ?? '',
      phone: formatBrazilianPhone(participant.phone ?? ''),
      birthDate: participant.birthDate ?? '',
      role: participant.role as 'member' | 'leader' | 'supervisor',
      status: participant.status as 'active' | 'inactive' | 'transferred',
    },
  });

  const phoneField = register('phone', {
    onChange: (event) => {
      event.target.value = formatBrazilianPhone(event.target.value);
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    let isSuccess = false;

    try {
      const response = await fetch(`/api/participants/${participant.participantId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participantId: participant.participantId,
          personId: participant.personId,
          gcId: values.gcId,
          name: values.name.trim(),
          email: values.email?.trim() || null,
          phone: formatBrazilianPhone(values.phone) || null,
          birthDate: values.birthDate?.trim() || null,
          role: values.role,
          status: values.status,
        }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        setErrorMessage(result.error ?? 'Não foi possível salvar alterações.');
        return;
      }

      isSuccess = true;
      window.location.assign('/participants');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Não foi possível salvar alterações.');
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
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-slate-900">Editar participante</h1>
        <p className="text-sm text-slate-600">Atualize contato, papel e status do participante selecionado.</p>
      </header>

      <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Grupo de Crescimento
          <select
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            {...register('gcId')}
          >
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
          {errors.gcId ? <span className="text-xs text-red-600">{errors.gcId.message}</span> : null}
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Nome completo
          <input
            type="text"
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            {...register('name')}
          />
          {errors.name ? <span className="text-xs text-red-600">{errors.name.message}</span> : null}
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            E-mail
            <input
              type="email"
              className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              {...register('email')}
            />
            {errors.email ? <span className="text-xs text-red-600">{errors.email.message}</span> : null}
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Telefone
            <input
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              maxLength={15}
              className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="(11) 98888-8888"
              {...phoneField}
            />
            {errors.phone ? <span className="text-xs text-red-600">{errors.phone.message}</span> : null}
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Data de nascimento
          <input
            type="date"
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            {...register('birthDate')}
          />
          <span className="text-xs text-slate-500">Obrigatória quando o papel for membro.</span>
          {errors.birthDate ? <span className="text-xs text-red-600">{errors.birthDate.message}</span> : null}
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Papel
            <select
              className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              {...register('role')}
            >
              <option value="member">Membro</option>
              <option value="leader">Líder</option>
              <option value="supervisor">Supervisor</option>
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Status
            <select
              className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              {...register('status')}
            >
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
              <option value="transferred">Transferido</option>
            </select>
          </label>
        </div>
      </div>

      {errorMessage ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div>
      ) : null}

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
          onClick={() => router.back()}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </div>
    </ClientFormShell>
  );
}
