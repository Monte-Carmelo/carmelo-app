# carmelo-app Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-10-04

## Active Technologies
- Dart 3.x+ com Flutter 3.x+ + Flutter SDK, Supabase Flutter SDK, Provider/Riverpod (state management) (001-crie-um-app)
- PostgreSQL via Supabase (gerenciado) com Row Level Security (RLS)
- Flutter test framework, integration_test, mockito para unit tests
- TypeScript '^5' + Next.js '15.5.5', React '19.1.0', Supabase (002-revisar-ux-gc)
- Supabase (PostgreSQL) (002-revisar-ux-gc)
- TypeScript 5.x, Next.js 15.5.5, React 19.1.0 + Next.js, React, Tailwind CSS 3.4.18, Lucide React (ícones), Supabase client (auth apenas), shadcn/ui components (003-vamos-ajustar-a)
- N/A (feature visual apenas - sem mudanças de dados) (003-vamos-ajustar-a)

## Project Structure
```
app/
├── lib/
│   ├── main.dart
│   ├── models/           # Entities: User, GC, Meeting, Member, Visitor, Lesson
│   ├── services/         # Supabase clients, auth, sync logic
│   ├── screens/          # UI screens by feature
│   ├── widgets/          # Reusable components
│   ├── providers/        # State management
│   └── utils/            # Helpers, constants
├── test/
└── integration_test/

supabase/
├── migrations/          # SQL schema migrations
└── seed.sql             # Initial data

specs/001-crie-um-app/
├── spec.md              # Feature specification
├── plan.md              # Implementation plan
├── data-model.md        # Database schema
├── quickstart.md        # Manual validation scenarios
└── contracts/           # API contracts (OpenAPI)
```

## Commands
```bash
# Flutter development
flutter run                  # Run app in debug mode
flutter test                 # Run unit/widget tests
flutter test integration_test/  # Run integration tests
flutter build apk            # Build Android APK
flutter build ios            # Build iOS app

# Supabase local development
supabase start              # Start local Supabase instance
supabase migration new <name>  # Create new migration
supabase db reset --local   # Reset local DB with migrations
supabase db push            # Push migrations to remote

# Web validation
cd web && npm run lint      # ESLint CLI (no warnings)
cd web && npm test          # Unit + contract tests
cd web && npm run test:e2e:full  # Full desktop Playwright suite
```

## Code Style
- Dart 3.x+ com Flutter 3.x+: Follow standard conventions
- Use `snake_case` for file names, `camelCase` for variables/functions
- Prefer `final` over `var` where possible
- Use const constructors for immutable widgets
- Follow Flutter widget composition patterns
- **Database naming**: `snake_case` in English for all tables/columns (per Constitution v1.2.0)
- **Code language**: English for all code, database schemas, and technical identifiers
- **Documentation language**: Brazilian Portuguese (pt-BR) for specs, plans, and comments

## Data Model - Múltiplos Líderes/Supervisores
**IMPORTANTE**: O sistema permite **múltiplos líderes** e **múltiplos supervisores** por GC com igualdade de autoridade:

### Tabelas Principais (English names):
- `people` (pessoas): Entidade base normalizada com dados pessoais (name, email, phone, birth_date)
- `users`: Usuários do app (referencia `people` via person_id)
- `growth_groups`: GCs com informações (name, mode, address, weekday, time, status)
- `growth_group_participants` (gc_id, person_id, role, status): Relaciona pessoas a GCs
  - `role` pode ser: 'leader', 'supervisor', 'member'
  - **Múltiplos líderes**: Todos com role='leader', sem distinção de "principal" ou "co-líder"
  - **Múltiplos supervisores**: Todos com role='supervisor'
  - Constraint: Pelo menos 1 líder obrigatório (trigger `ensure_gc_has_leader`)
  - Constraint: Pelo menos 1 supervisor obrigatório (trigger `ensure_gc_has_supervisor`)
- `visitors`: Visitantes (referencia `people` via person_id, tracking de conversão)
- `meetings`: Reuniões (datetime, lesson_id, registered_by_user_id)
- `meeting_member_attendance` e `meeting_visitor_attendance`: Presença em reuniões
- `lessons` e `lesson_series`: Catálogo de lições

**Papéis são ACUMULADOS**, não exclusivos:
- Um usuário pode ser simultaneamente líder de GC A, supervisor de GC B, e coordenador na hierarquia
- Papéis são derivados de relacionamentos, não armazenados como campo estático
- Ver `specs/001-crie-um-app/data-model.md` para detalhes completos

## RLS (Row Level Security)
- Todas as tabelas têm RLS habilitado
- Líderes veem GCs via `growth_group_participants` onde `role='leader'` (policy `leaders_view_own_gcs`)
- Supervisores veem GCs via `growth_group_participants` onde `role='supervisor'` (policy `supervisors_view_gcs`)
- Coordenadores veem GCs de subordinados (policy `supervisors_view_subordinate_gcs`)
- Admins veem tudo via `is_admin` flag (policy `admins_manage_all_*`)

## Recent Changes
- 2025-10-21: **Removed co-leader distinction** - All leaders now have equal authority
  - Removed `co_leader` role from database and code
  - GC creation/edit now supports multiple leaders via multi-select
  - Migration `20251021000000_remove_co_leader_role.sql` converts all co-leaders to leaders
  - Updated `AdminGrowthGroupForm` to use `MultiSelect` component for leaders and supervisors
- 003-vamos-ajustar-a: Added TypeScript 5.x, Next.js 15.5.5, React 19.1.0 + Next.js, React, Tailwind CSS 3.4.18, Lucide React (ícones), Supabase client (auth apenas), shadcn/ui components
- 002-revisar-ux-gc: Added TypeScript '^5' + Next.js '15.5.5', React '19.1.0', Supabase
- 2025-10-13: **Database standardization** - All table/column names changed to English (Constitution v1.2.0)
  - `pessoas` → `people`, `nome` → `name`, `pessoa_id` → `person_id`, etc.
  - All enum values to English ('ativo' → 'active', 'presencial' → 'in_person', etc.)
  - All 32 RLS policies renamed to English
  - View `dashboard_metricas` → `dashboard_metrics`
  - See `specs/001-crie-um-app/TRANSLATION_MAP.md` for complete mapping

<!-- MANUAL ADDITIONS START -->
- 2026-03-08: Web validation hardened
  - `web` now uses internal authenticated API routes for meeting creation, visitor creation, and GC attendance option loading.
  - `web` lint command now uses ESLint CLI instead of `next lint`.
  - Playwright scripts unset `NO_COLOR`, and the Playwright web server suppresses Node 23 `ExperimentalWarning` noise.
<!-- MANUAL ADDITIONS END -->
