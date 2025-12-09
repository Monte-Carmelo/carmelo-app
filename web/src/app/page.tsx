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
            label: 'Ver Eventos (login)',
            href: '/login?redirect=/events',
          }}
          highlight={upcomingFeatures}
        />
      </Suspense>
    </main>
  );
}
