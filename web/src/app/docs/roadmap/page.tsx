import Link from 'next/link';

const sprints = [
  {
    title: 'Sprint 1 — Registro de reuniões',
    items: [
      'Implementar autenticação Supabase (email/senha) e proteção por papéis.',
      'Dashboard do líder com resumo do GC e CTA para registrar reunião.',
      'Fluxo básico de criação de reunião com presença de membros e visitantes.',
    ],
  },
  {
    title: 'Sprint 2 — Pessoas e visitantes',
    items: [
      'CRUD de participantes e visitantes com filtros por status.',
      'Conversão manual de visitantes registrando `visitor_conversion_events`.',
      'Integração com métricas de frequência/conversão por GC.',
    ],
  },
  {
    title: 'Sprint 3 — Supervisão e catálogo de lições',
    items: [
      'Visão de rede para supervisores com filtros e drill-down.',
      'Gestão do catálogo de lições (padrão + custom).',
      'Validação de contratos e dashboards alinhados ao spec.',
    ],
  },
];

export default function RoadmapPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-12 px-4 py-16">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold text-slate-900 md:text-4xl">
          Roadmap inicial do Carmelo Web
        </h1>
        <p className="text-slate-600">
          Este roadmap deriva da especificação existente (`specs/001-crie-um-app/spec.md`) e prioriza uma
          entrega web responsiva, mobile-first. Os incrementos podem ser ajustados conforme feedback dos
          stakeholders.
        </p>
      </header>

      <section className="space-y-6">
        {sprints.map((sprint) => (
          <article key={sprint.title} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">{sprint.title}</h2>
            <ul className="list-disc space-y-2 pl-5 text-slate-700">
              {sprint.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <footer className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
        <p>
          Consulte o <Link href="/" className="underline">dashboard inicial</Link> para conferir o progresso e a próxima entrega
          priorizada. Atualizações estratégicas devem ser registradas em `specs/001-crie-um-app/web-stack-decisions.md`.
        </p>
      </footer>
    </main>
  );
}
