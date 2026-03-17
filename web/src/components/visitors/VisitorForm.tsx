'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useClientReady } from '@/lib/hooks/use-client-ready';
import type { Database } from '@/lib/supabase/types';

const schema = z
  .object({
    gcId: z.string({ message: 'Selecione um grupo' }),
    name: z.string({ message: 'Informe o nome' }).min(3, 'Nome muito curto'),
    email: z.string().email('E-mail inválido').optional().or(z.literal('')),
    phone: z.string().optional().or(z.literal('')),
  })
  .refine((value) => value.email?.trim() || value.phone?.trim(), {
    message: 'Informe e-mail ou telefone',
    path: ['email'],
  });

type FormValues = z.infer<typeof schema>;

type GrowthGroup = Database['public']['Tables']['growth_groups']['Row'];

interface VisitorFormProps {
  groups: Pick<GrowthGroup, 'id' | 'name'>[];
  preselectedGcId?: string;
}

export function VisitorForm({ groups, preselectedGcId }: VisitorFormProps) {
  const router = useRouter();
  const isClientReady = useClientReady();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      gcId: preselectedGcId,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    let isSuccess = false;

    try {
      const response = await fetch('/api/visitors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gcId: values.gcId,
          name: values.name,
          email: values.email ?? '',
          phone: values.phone ?? '',
        }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        setErrorMessage(result.error ?? 'Falha ao cadastrar visitante.');
        return;
      }

      isSuccess = true;
      window.location.assign(preselectedGcId ? `/gc/${preselectedGcId}` : '/visitors');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Falha ao cadastrar visitante.');
    } finally {
      if (!isSuccess) {
        setIsSubmitting(false);
      }
    }
  });

  return (
    <form onSubmit={onSubmit} className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-slate-900">Cadastrar visitante</h1>
        <p className="text-sm text-slate-600">Preencha os dados básicos para registrar um novo visitante em um GC.</p>
      </header>

      <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {preselectedGcId ? (
          // Campo oculto com o GC pré-selecionado
          <input type="hidden" {...register('gcId')} value={preselectedGcId} />
        ) : (
          // Campo de seleção quando não há pré-seleção
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Grupo de Crescimento
            <select
              className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
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
            {errors.gcId ? <span className="text-xs text-red-600">{errors.gcId.message}</span> : null}
          </label>
        )}

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Nome completo
          <input
            type="text"
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="Ex.: Maria da Silva"
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
              placeholder="email@exemplo.com"
              {...register('email')}
            />
            {errors.email ? <span className="text-xs text-red-600">{errors.email.message}</span> : null}
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Telefone
            <input
              type="tel"
              className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="(11) 99999-9999"
              {...register('phone')}
            />
            {errors.phone ? <span className="text-xs text-red-600">{errors.phone.message}</span> : null}
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
          disabled={!isClientReady || isSubmitting}
          className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? 'Salvando...' : 'Cadastrar visitante'}
        </button>
      </div>
    </form>
  );
}
