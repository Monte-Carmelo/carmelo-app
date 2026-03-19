'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useTransition } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { createUser } from '@/app/(app)/admin/actions';
import { ClientFormShell } from '@/components/forms/ClientFormShell';

const schema = z
  .object({
    name: z.string({ message: 'Informe o nome completo.' }).min(3, 'Nome muito curto.'),
    email: z.string({ message: 'Informe o e-mail.' }).email('E-mail inválido.'),
    phone: z.string().optional().or(z.literal('')),
    password: z.string({ message: 'Defina uma senha temporária.' }).min(8, 'Senha deve ter pelo menos 8 caracteres.'),
    confirmPassword: z
      .string({ message: 'Confirme a senha.' })
      .min(8, 'Confirmação precisa ter pelo menos 8 caracteres.'),
    isAdmin: z.boolean(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Senhas não conferem.',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : '';
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function AdminUserCreateForm() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      phone: '',
      isAdmin: false,
    },
  });

  const onSubmit = handleSubmit((values) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    startTransition(() => {
      createUser({
        name: values.name.trim(),
        email: values.email.trim().toLowerCase(),
        phone: values.phone?.trim() ? values.phone.trim() : null,
        password: values.password,
        isAdmin: values.isAdmin,
      })
        .then((result) => {
          if (result.success && result.userId) {
            setSuccessMessage('Usuário criado com sucesso. Redirecionando...');
            reset({
              name: '',
              email: '',
              phone: '',
              password: '',
              confirmPassword: '',
              isAdmin: false,
            });
            router.replace(`/admin/users/${result.userId}?created=true`);
          } else {
            setErrorMessage(result.error ?? 'Não foi possível criar o usuário.');
          }
        })
        .catch(() => {
          setErrorMessage('Não foi possível criar o usuário.');
        });
    });
  });

  return (
    <ClientFormShell
      onSubmit={onSubmit}
      className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10"
      pending={isPending}
    >
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-slate-900">Novo usuário</h1>
          <p className="text-sm text-slate-600">
            Cadastre um novo usuário com acesso ao app. Defina uma senha temporária; atribua papéis posteriormente nos detalhes do usuário.
          </p>
        </header>

        {successMessage ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{successMessage}</div>
        ) : null}

        {errorMessage ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div>
        ) : null}

        <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Nome completo
            <input
              type="text"
              placeholder="Ex.: Maria Fernandes"
              className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              {...register('name')}
            />
            {errors.name ? <span className="text-xs text-red-600">{errors.name.message}</span> : null}
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            E-mail
            <input
              type="email"
              placeholder="email@exemplo.com"
              className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              {...register('email')}
            />
            {errors.email ? <span className="text-xs text-red-600">{errors.email.message}</span> : null}
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Telefone
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <input
                  type="tel"
                  placeholder="(11) 98888-8888"
                  name={field.name}
                  value={field.value ?? ''}
                  onChange={(event) => field.onChange(formatPhone(event.target.value))}
                  onBlur={field.onBlur}
                  ref={field.ref}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              )}
            />
            {errors.phone ? <span className="text-xs text-red-600">{errors.phone.message}</span> : null}
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
              Senha temporária
              <input
                type="password"
                placeholder="Mínimo 8 caracteres"
                className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                {...register('password')}
              />
              {errors.password ? <span className="text-xs text-red-600">{errors.password.message}</span> : null}
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
              Confirmar senha
              <input
                type="password"
                placeholder="Repita a senha"
                className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                {...register('confirmPassword')}
              />
              {errors.confirmPassword ? <span className="text-xs text-red-600">{errors.confirmPassword.message}</span> : null}
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" className="h-4 w-4" {...register('isAdmin')} />
            Conceder acesso administrativo (Admin)
          </label>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isPending ? 'Criando usuário...' : 'Criar usuário'}
          </button>
        </div>
    </ClientFormShell>
  );
}
