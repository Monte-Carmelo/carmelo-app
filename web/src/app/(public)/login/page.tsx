import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/auth/LoginForm';
import { getAuthenticatedUser } from '@/lib/supabase/server-auth';
import { Logo } from '@/components/layout/Logo';

export const metadata = {
  title: 'Entrar • Carmelo',
};

export default async function LoginPage() {
  const user = await getAuthenticatedUser();

  if (user) {
    redirect('/dashboard');
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-16">
      <div className="flex w-full max-w-5xl flex-col gap-10 md:flex-row md:items-center">
        <div className="flex-1 space-y-6">
          <div className="flex justify-center md:justify-start">
            <Logo className="h-20 md:h-24" />
          </div>
          <h1 className="text-balance text-center text-2xl font-semibold text-text-dark md:text-left md:text-3xl">
            Bem-vindo
          </h1>
          <p className="text-center text-base text-text-light md:text-left">
            Entre para administrar seus Grupos de Crescimento
          </p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
