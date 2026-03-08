'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import type { Database } from '@/lib/supabase/types';
import { useSession } from '@/lib/auth/session-context';

const schema = z
  .object({
    gcId: z.string({ message: 'Selecione um grupo' }),
    name: z.string({ message: 'Informe o nome' }).min(3, 'Nome muito curto'),
    email: z.string().email('E-mail inválido').optional().or(z.literal('')),
    phone: z.string().optional().or(z.literal('')),
    role: z.enum(['member', 'leader', 'supervisor']),
  })
  .refine((value) => value.email?.trim() || value.phone?.trim(), {
    message: 'Informe e-mail ou telefone',
    path: ['email'],
  });

type FormValues = z.infer<typeof schema>;

type GrowthGroup = Database['public']['Tables']['growth_groups']['Row'];

interface ParticipantFormProps {
  groups: Pick<GrowthGroup, 'id' | 'name'>[];
  preselectedGcId?: string;
}

export function ParticipantForm({ groups, preselectedGcId }: ParticipantFormProps) {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const { user } = useSession();
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

  const onSubmit = handleSubmit(async (values) => {
    setErrorMessage(null);
    setIsSubmitting(true);

    const trimmedEmail = values.email?.trim() || null;
    const trimmedPhone = values.phone?.trim() || null;

    let personId: string | null = null;

    if (trimmedEmail) {
      const { data: existingByEmail } = await supabase
        .from('people')
        .select('id')
        .eq('email', trimmedEmail)
        .maybeSingle();
      personId = existingByEmail?.id ?? null;
    }

    if (!personId && trimmedPhone) {
      const { data: existingByPhone } = await supabase
        .from('people')
        .select('id')
        .eq('phone', trimmedPhone)
        .maybeSingle();
      personId = existingByPhone?.id ?? null;
    }

    if (!personId) {
      const { data: personData, error: personError } = await supabase
        .from('people')
        .insert({
          name: values.name.trim(),
          email: trimmedEmail,
          phone: trimmedPhone,
        })
        .select('id')
        .single();

      if (personError || !personData) {
        setErrorMessage(personError?.message ?? 'Falha ao salvar dados pessoais.');
        setIsSubmitting(false);
        return;
      }

      personId = personData.id;
    }

    const now = new Date().toISOString();

    const { error: participantError } = await supabase
      .from('growth_group_participants')
      .upsert(
        {
          gc_id: values.gcId,
          person_id: personId,
          role: values.role,
          status: 'active',
          joined_at: now,
          added_by_user_id: user.id,
        },
        {
          onConflict: 'gc_id,person_id,role',
          ignoreDuplicates: false,
        },
      );

    if (participantError) {
      setErrorMessage(participantError.message ?? 'Não foi possível vincular participante ao GC.');
      setIsSubmitting(false);
      return;
    }

    // Se veio da página do GC, redirecionar de volta
    if (preselectedGcId) {
      router.push(`/gc/${preselectedGcId}`);
    } else {
      router.push('/participants');
    }
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-slate-900">Cadastrar participante</h1>
        <p className="text-sm text-slate-600">
          Adicione rapidamente um participante a um Grupo de Crescimento, definindo o papel e contato básico.
        </p>
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
            placeholder="Ex.: João Pereira"
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
              placeholder="(11) 98888-8888"
              {...register('phone')}
            />
            {errors.phone ? <span className="text-xs text-red-600">{errors.phone.message}</span> : null}
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Papel no GC
          <select
            className="w-48 rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            {...register('role')}
          >
            <option value="member">Membro</option>
            <option value="leader">Líder</option>
            <option value="supervisor">Supervisor</option>
          </select>
        </label>
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
          {isSubmitting ? 'Salvando...' : 'Cadastrar participante'}
        </button>
      </div>
    </form>
  );
}
