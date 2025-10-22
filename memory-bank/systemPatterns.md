# System Patterns *Optional*

This file documents recurring patterns and standards used in the project.
It is optional, but recommended to be updated as the project evolves.
2025-10-20 15:40:09 - Log of updates made.

*

## Coding Patterns

* Uso de TypeScript para tipagem estática e segurança no código
* Componentes React para construção modular e reutilizável da interface
* Validações de formulários com Zod
* Scripts auxiliares escritos em TypeScript para automação de tarefas

## Architectural Patterns

* Estrutura em 5 fases: Infraestrutura, Validações, Ações, Componentes, Páginas
* Separação clara entre administração e visualização pública
* Componentes reutilizáveis para listagem e detalhes
* Validações com Zod para formulários
* Storage do Supabase para uploads de arquivos
* Banco de dados PostgreSQL com suporte a migrations e políticas RLS
* Integração com Supabase para autenticação e gerenciamento de dados

## Testing Patterns

* Testes E2E com Playwright para validação de fluxos completos
* Testes de contrato para endpoints e integrações
* Scripts de seed para garantir consistência nos dados de teste