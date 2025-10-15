'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { createUser } from '@/app/(app)/admin/actions';

const schema = z
  .object({
    name: z.string({ required_error: 'Informe o nome completo.' }).min(3, 'Nome muito curto.'),
    email: z.string({ required_error: 'Informe o e-mail.' }).email('E-mail inválido.'),
    phone: z.string().optional().or(z.literal('')),
    password: z.string({ required_error: 'Defina uma senha temporária.' }).min(8, 'Senha deve ter pelo menos 8 caracteres.'),
    confirmPassword: z
      .string({ required_error: 'Confirme a senha.' })
      .min(8, 'Confirmação precisa ter pelo menos 8 caracteres.'),
    isAdmin: z.boolean().default(false),
    hierarchyParentId: z.string().uuid().optional().or(z.literal('')),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Senhas não conferem.',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

interface SupervisorOption {
  id: string;
  name: string;
}

interface AdminUserCreateFormProps {
  supervisors: SupervisorOption[];
}

export function AdminUserCreateForm({ supervisors }: AdminUserCreateFormProps) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
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
        hierarchyParentId: values.hierarchyParentId || null,
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
              hierarchyParentId: '',
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
    <form onSubmit={onSubmit} className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-slate-900">Novo usuário</h1>
        <p className="text-sm text-slate-600">
          Cadastre um novo usuário com acesso ao app. Defina uma senha temporária e atribua, se necessário, o supervisor direto.
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
          <input
            type="tel"
            placeholder="(11) 98888-8888"
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            {...register('phone')}
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

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Supervisor direto (opcional)
          <select
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            {...register('hierarchyParentId')}
            defaultValue=""
          >
            <option value="">Sem supervisor definido</option>
            {supervisors.map((supervisor) => (
              <option key={supervisor.id} value={supervisor.id}>
                {supervisor.name}
              </option>
            ))}
          </select>
          {errors.hierarchyParentId ? (
            <span className="text-xs text-red-600">{errors.hierarchyParentId.message}</span>
          ) : null}
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
    </form>
  );
}
