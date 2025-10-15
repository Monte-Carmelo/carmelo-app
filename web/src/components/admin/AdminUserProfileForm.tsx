'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { updateUserProfile } from '@/app/(app)/admin/actions';

const schema = z.object({
  name: z.string({ message: 'Informe o nome completo.' }).min(3, 'Nome muito curto.'),
  email: z.string({ message: 'Informe o e-mail.' }).email('E-mail inválido.'),
  phone: z.string().optional().or(z.literal('')),
  isAdmin: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

interface AdminUserProfileFormProps {
  userId: string;
  initialValues: {
    name: string;
    email: string | null;
    phone: string | null;
    isAdmin: boolean;
  };
}

export function AdminUserProfileForm({ userId, initialValues }: AdminUserProfileFormProps) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialValues.name,
      email: initialValues.email ?? '',
      phone: initialValues.phone ?? '',
      isAdmin: initialValues.isAdmin,
    },
  });

  const onSubmit = handleSubmit((values) => {
    setFeedback(null);
    setErrorMessage(null);

    startTransition(() => {
      updateUserProfile({
        userId,
        name: values.name.trim(),
        email: values.email.trim().toLowerCase(),
        phone: values.phone?.trim() ? values.phone.trim() : null,
        isAdmin: values.isAdmin,
      })
        .then((result) => {
          if (result.success) {
            setFeedback('Dados atualizados com sucesso.');
            router.refresh();
          } else {
            setErrorMessage(result.error ?? 'Não foi possível atualizar os dados.');
          }
        })
        .catch(() => {
          setErrorMessage('Não foi possível atualizar os dados.');
        });
    });
  });

  return (
    <form onSubmit={onSubmit} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Dados do usuário</h2>
        <p className="text-sm text-slate-600">Atualize os dados pessoais e permissões do usuário.</p>
      </div>

      {feedback ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{feedback}</div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div>
      ) : null}

      <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
        Nome completo
        <input
          type="text"
          className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          {...register('name')}
        />
        {errors.name ? <span className="text-xs text-red-600">{errors.name.message}</span> : null}
      </label>

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

      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <input type="checkbox" className="h-4 w-4" {...register('isAdmin')} />
        Acesso administrativo (Admin)
      </label>

     <div className="flex items-center justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </div>
    </form>
  );
}
