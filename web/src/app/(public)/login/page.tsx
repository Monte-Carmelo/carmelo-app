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
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-7 py-16">
      {/* Pattern de montes — telas-marco, opacidade 4-8% */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-48 text-forest opacity-[0.06]"
        style={{
          backgroundImage: "url('/logo/pattern-monte.svg')",
          backgroundRepeat: 'repeat-x',
          maskImage: 'linear-gradient(to bottom, black, transparent)',
          WebkitMaskImage: 'linear-gradient(to bottom, black, transparent)',
        }}
      />

      <div className="relative flex w-full max-w-sm flex-col">
        <div className="flex justify-center">
          <Logo className="h-20" />
        </div>
        <span className="tipograma mt-4 block text-center text-[13px]">
          Igreja Monte Carmelo
        </span>

        <h1 className="mt-9 text-center text-[26px] font-bold leading-tight text-foreground">
          Gestão de GCs
        </h1>
        <p className="mt-2 text-center text-sm leading-relaxed text-muted-foreground">
          Cuide do seu grupo: encontros, presença, membros e lições — tudo em
          um lugar.
        </p>

        <div className="mt-8">
          <LoginForm />
        </div>

        <p className="mt-5 text-center text-xs leading-relaxed text-slate-400">
          O acesso é liberado pela liderança da igreja para líderes e líderes
          em treinamento. Não consegue entrar? Fale com seu pastor.
        </p>
      </div>
    </main>
  );
}
