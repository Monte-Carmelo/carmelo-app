'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import type { Database } from '@/lib/supabase/types';

const schema = z
  .object({
    gcId: z.string({ message: 'Selecione um grupo' }),
    name: z.string({ message: 'Informe o nome' }).min(3, 'Nome muito curto'),
    email: z.string().email('E-mail inválido').optional().or(z.literal('')),
    phone: z.string().optional().or(z.literal('')),
    role: z.enum(['member', 'leader', 'co_leader', 'supervisor']),
    status: z.enum(['active', 'inactive', 'transferred']),
  })
  .refine((value) => value.email?.trim() || value.phone?.trim(), {
    message: 'Informe e-mail ou telefone',
    path: ['email'],
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
};

interface ParticipantEditFormProps {
  participant: ParticipantDetail;
  groups: Pick<GrowthGroup, 'id' | 'name'>[];
}

export function ParticipantEditForm({ participant, groups }: ParticipantEditFormProps) {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
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
      phone: participant.phone ?? '',
      role: participant.role as 'member' | 'leader' | 'co_leader' | 'supervisor',
      status: participant.status as 'active' | 'inactive' | 'transferred',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    const trimmedEmail = values.email?.trim() || null;
    const trimmedPhone = values.phone?.trim() || null;

    const { error: personError } = await supabase
      .from('people')
      .update({
        name: values.name.trim(),
        email: trimmedEmail,
        phone: trimmedPhone,
      })
      .eq('id', participant.personId);

    if (personError) {
      setErrorMessage(personError.message ?? 'Falha ao atualizar dados pessoais.');
      setIsSubmitting(false);
      return;
    }

    const { error: participantError } = await supabase
      .from('growth_group_participants')
      .update({
        gc_id: values.gcId,
        role: values.role,
        status: values.status,
      })
      .eq('id', participant.participantId);

    if (participantError) {
      setErrorMessage(participantError.message ?? 'Não foi possível salvar alterações.');
      setIsSubmitting(false);
      return;
    }

    router.replace('/participants');
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
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
              className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              {...register('phone')}
            />
            {errors.phone ? <span className="text-xs text-red-600">{errors.phone.message}</span> : null}
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Papel
            <select
              className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              {...register('role')}
            >
              <option value="member">Membro</option>
              <option value="leader">Líder</option>
              <option value="co_leader">Co-líder</option>
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
    </form>
  );
}
