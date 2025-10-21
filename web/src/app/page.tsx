import { Hero } from '../components/landing/Hero';
import { Suspense } from 'react';

const upcomingFeatures = [
  'Registro de reuniões com lição padrão ou personalizada e comentários.',
  'Gestão de participantes e visitantes com conversão registrada.',
  'Dashboards hierárquicos para líderes e supervisores.',
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-12 px-4 py-16">
      <Suspense fallback={<div className="flex items-center justify-center p-12">Carregando...</div>}>
        <Hero
          title="Sistema de Gestão de Grupos de Crescimento"
          description="Plataforma completa para gerenciar GCs, reuniões, membros e visitantes. Acesse o sistema ou confira os próximos eventos da igreja."
          primaryAction={{
            label: 'Fazer Login',
            href: '/login',
          }}
          secondaryAction={{
            label: 'Ver Eventos',
            href: '/events',
          }}
          highlight={upcomingFeatures}
        />
      </Suspense>

      <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Próximos incrementos</h2>
        <ul className="space-y-2 text-slate-700">
          {upcomingFeatures.map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <span className="mt-[6px] h-2 w-2 rounded-full bg-primary" aria-hidden />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
        <h3 className="text-base font-semibold text-slate-800">Checklist de configuração</h3>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Copie `.env.example` para `.env.local` com as chaves do Supabase.</li>
          <li>Execute `npm run dev` para iniciar o servidor local.</li>
          <li>Rode `npm run test` para validar o setup inicial.</li>
        </ol>
      </section>
    </main>
  );
}
