import Link from 'next/link';

const upcomingFeatures = [
  'Registro de reuniões com lição padrão ou personalizada e comentários.',
  'Gestão de participantes e visitantes com conversão registrada.',
  'Dashboards hierárquicos para líderes e supervisores.',
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-12 px-4 py-16">
      <section className="flex flex-col gap-6">
        <span className="text-sm font-semibold uppercase tracking-wide text-primary">
          Carmelo Web
        </span>
        <h1 className="text-balance text-4xl font-semibold text-slate-900 md:text-5xl">
          Gestão dos Grupos de Crescimento com foco em líderes e supervisores.
        </h1>
        <p className="text-base text-slate-600 md:text-lg">
          Estamos migrando do app híbrido para uma experiência web responsiva, mobile-first,
          aproveitando o modelo de dados e contratos já validados no Supabase.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="https://supabase.com"
            className="inline-flex items-center rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:brightness-110"
          >
            Configurar ambiente Supabase
          </Link>
          <Link
            href="/docs/roadmap"
            className="inline-flex items-center rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Ver plano de entrega
          </Link>
        </div>
      </section>

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
