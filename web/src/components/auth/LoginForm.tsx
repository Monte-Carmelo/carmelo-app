'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter, useSearchParams } from 'next/navigation';
import { z } from 'zod';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { getMissingSupabaseEnvMessage, isEnvReady } from '@/lib/env';
import { ClientFormShell } from '@/components/forms/ClientFormShell';
import { Spinner } from '@/components/ui/spinner';

const schema = z.object({
  email: z.string().min(1, 'Falta preencher seu e-mail.').email('E-mail inválido.'),
  password: z.string().min(1, 'Falta preencher sua senha.'),
});

type FormValues = z.infer<typeof schema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect');
  const safeRedirectTo =
    redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//')
      ? redirectTo
      : '/dashboard';
  const supabase = isEnvReady ? getSupabaseBrowserClient() : null;
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  if (!supabase) {
    return (
      <div className="w-full rounded-card bg-warn-soft p-6 text-sm text-warn-fg shadow-sm">
        {getMissingSupabaseEnvMessage('renderizar o login')}
      </div>
    );
  }

  const onSubmit = handleSubmit(async (values) => {
    setErrorMessage(null);
    setIsSubmitting(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (error) {
      setErrorMessage(error.message ?? 'Não foi possível entrar.');
      setIsSubmitting(false);
      return;
    }

    const userId = data.user?.id;
    if (userId) {
      const { data: activeUser, error: activeUserError } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .is('deleted_at', null)
        .maybeSingle();

      if (activeUserError || !activeUser) {
        await supabase.auth.signOut();
        setErrorMessage('Este usuário está inativo. Procure um administrador.');
        setIsSubmitting(false);
        return;
      }
    }

    router.replace(safeRedirectTo);
    router.refresh();
  });

  return (
    <ClientFormShell
      onSubmit={onSubmit}
      className="flex w-full flex-col gap-4"
      pending={isSubmitting}
    >
      <div>
        <label
          htmlFor="email"
          className="mb-1.5 block text-xs font-semibold text-muted-foreground"
        >
          E-mail
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="voce@exemplo.com"
          className="w-full rounded-xl border-[1.5px] border-border bg-white px-4 py-3.5 text-[15px] text-foreground placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
          {...register('email')}
        />
        {errors.email ? (
          <p className="mt-1 text-sm text-danger">{errors.email.message}</p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-1.5 block text-xs font-semibold text-muted-foreground"
        >
          Senha
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          className="w-full rounded-xl border-[1.5px] border-border bg-white px-4 py-3.5 text-[15px] text-foreground placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
          {...register('password')}
        />
        {errors.password ? (
          <p className="mt-1 text-sm text-danger">{errors.password.message}</p>
        ) : null}
      </div>

      {errorMessage ? <p className="text-sm text-danger">{errorMessage}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-1 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-all duration-base ease-out-soft hover:bg-brand-hover active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting && <Spinner size="sm" className="border-white border-t-transparent" />}
        {isSubmitting ? 'Entrando…' : 'Entrar'}
      </button>
    </ClientFormShell>
  );
}
