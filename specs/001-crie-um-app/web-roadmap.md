# Roadmap Inicial (Web)

**Contexto**: Reaproveita requisitos funcionais de `spec.md` com entrega via app web responsivo (React + Next.js).

## Sprint 1 — Registro de Reuniões (Líder)
- Autenticação e sessão com Supabase (email/senha, proteção por papéis via RLS).
- Dashboard do líder com overview do GC (lição atual, presença recente, próximos passos).
- Fluxo de registro de reunião incluindo:
  - Seleção de lição do catálogo ou título customizado.
  - Campo de comentários da reunião.
  - Presença separada para membros (`meeting_member_attendance`) e visitantes (`meeting_visitor_attendance`).
- Validação mínima: testes unitários de componentes-chave e smoke E2E registrando uma reunião.

## Sprint 2 — Gestão de Pessoas e Visitantes
- Listagem e manutenção de participantes (`growth_group_participants`) com filtros por papel/status.
- Gestão de visitantes com tracking de visitas e vínculo ao GC.
- Conversão manual de visitantes com registro em `visitor_conversion_events` + resp. UI.
- Indicadores rápidos de frequência e conversão por GC.
- Testes: cenários de conversão, contrato com endpoints de relacionamento.

## Sprint 3 — Supervisão e Catálogo de Lições
- Visão da rede para supervisores: lista de GCs com filtros (frequência, crescimento, líder).
- Drill-down para acompanhar reuniões recentes e comentários.
- CRUD do catálogo de lições (padrão) para perfis administrativos.
- Ajustes finais de acessibilidade e responsividade com check WCAG AA.
- Testes: suítes Playwright para líder e supervisor, cobertura de componentes críticos no Storybook (a definir).

## Referências
- Decisões de stack: `web-stack-decisions.md`.
- Modelo de dados: `data-model.md` (invariável).
- Contratos de API: `contracts/` (já atualizados para novos relacionamentos).

## Próximos Passos
1. Atualizar `tasks.md` para refletir arquitetura web (tarefas Flutter tornam-se legado).
2. Adicionar guia de setup rápido (`web/README.md`) — concluído.
3. Planejar Storybook + testes E2E detalhados em Sprint 2.
