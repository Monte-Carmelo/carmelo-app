import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/auth/LoginForm';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';

export const metadata = {
  title: 'Entrar • Carmelo',
};

export default async function LoginPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    redirect('/dashboard');
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-16">
      <div className="flex w-full max-w-5xl flex-col gap-10 md:flex-row md:items-center">
        <div className="flex-1 space-y-4">
          <span className="text-sm font-semibold uppercase tracking-wide text-primary">Carmelo Web</span>
          <h1 className="text-balance text-3xl font-semibold text-slate-900 md:text-4xl">
            Entre para administrar seus Grupos de Crescimento.
          </h1>
          <p className="text-base text-slate-600">
            Use seu e-mail e senha para acessar dashboards, registrar reuniões, gerenciar participantes e acompanhar visitantes.
          </p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
