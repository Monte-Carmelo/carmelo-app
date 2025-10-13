# Status do MVP - App de Gestão de GCs

**Data**: 2025-10-04
**Estratégia**: Opção 3 - MVP Funcional Básico
**Branch**: 001-crie-um-app

## ✅ Implementado (MVP Básico)

### Backend & Database (100% - T024-T034)
- ✅ 11 Migrations SQL criadas e prontas para deploy
  - users com hierarquia (adjacency list + materialized path)
  - growth_groups, gc_leaders, gc_supervisors (many-to-many)
  - members, visitors
  - lesson_series, lessons
  - meetings, meeting_attendance
- ✅ Triggers implementados
  - update_hierarchy_path (auto-atualiza hierarquia)
  - auto_convert_visitor (conversão automática após N visitas)
  - ensure_gc_has_leader/supervisor (constraints de integridade)
- ✅ RLS Policies configuradas (líder, supervisor, coordenador, admin)
- ✅ View dashboard_metricas (métricas agregadas)
- ✅ Seed data preparado (quickstart.md)

### Models (100% - T035-T044)
- ✅ 10 models Dart criados
  - User, GrowthGroup, GCLeader, GCSupervisor
  - Member, Visitor
  - Meeting, MeetingAttendance
  - Lesson, LessonSeries

### Services (100% - T045-T052)
- ✅ 8 services criados
  - AuthService (signup, login, logout)
  - GruposService (CRUD, RLS)
  - GCRelationshipsService (add/remove líderes/supervisores)
  - MembrosService, VisitorsService
  - ReunioesService (criar reunião com presenças)
  - LicoesService (admin only)
  - DashboardService (métricas)

### Providers (75% - T056-T058)
- ✅ authProvider (StateNotifier com login/signup/logout)
- ✅ gruposProvider (FutureProvider.family para listas filtradas)
- ✅ reunioesProvider (StateNotifier para registro de reunião)
- ⏳ dashboardProvider (pendente - T059)

### Screens (40% - T060, T062)
- ✅ LoginScreen (email/password, validação, navegação)
- ✅ HomeScreen (lista de GCs com refresh, role-based UI)
- ⏳ SignupScreen (pendente - T061)
- ⏳ Outras screens (T063-T073)

### Widgets (75% - T074-T076)
- ✅ LoadingIndicator (spinner com mensagem)
- ✅ ErrorDisplay (erro com retry)
- ✅ GCCard (card de GC com métricas resumidas)
- ⏳ MemberAttendanceCheckbox (pendente - T077)

### Navegação & Config
- ✅ main.dart configurado com Riverpod + Supabase
- ✅ Rotas básicas (/login, /home)
- ✅ AuthGuard (proteção de rotas autenticadas)
- ✅ Theme Material 3 configurado

### Contract Tests (31% - T006-T009)
- ✅ test_auth_signup.dart
- ✅ test_auth_login.dart
- ✅ test_grupos_list.dart
- ✅ test_grupos_create.dart
- ⏳ Testes restantes (T010-T018)

## ⏳ Pendente (Para Completar MVP)

### Crítico para MVP Funcional
1. **SignupScreen** (T061) - Permitir cadastro de novos usuários
2. **GrupoDetailScreen** (T064) - Visualizar detalhes do GC, membros, reuniões
3. **MeetingRegistrationScreen** (T069) - Registrar reunião com presenças
4. **Aplicar migrations no Supabase** (T078) - Deploy do schema
5. **Carregar seed data** (T079) - Dados de teste

### Importante (Pós-MVP)
- Offline Sync (T053-T055) - Registro offline de reuniões
- Integration Tests (T019-T023) - Validar cenários do quickstart
- Screens secundárias (criar/editar GC, lições, dashboard)
- Unit & Widget Tests (T086-T093)
- Performance & Polish (T094-T103)

## 🚀 Como Executar o MVP

### Pré-requisitos
```bash
# Instalar dependências Flutter
cd app/
flutter pub get

# Configurar Supabase local
supabase start

# Aplicar migrations
supabase db reset

# Carregar seed data
supabase db push
```

### Executar App
```bash
# Com variáveis de ambiente
flutter run \
  --dart-define=SUPABASE_URL=http://localhost:54321 \
  --dart-define=SUPABASE_ANON_KEY=your-anon-key
```

### Testar
```bash
# Contract tests
dart test tests/contract/

# Widget tests (quando implementados)
flutter test
```

## 📊 Progresso Geral

### Por Fase
- ✅ Phase 3.1: Setup (100% - 5/5 tarefas)
- ⏳ Phase 3.2: Tests First (31% - 4/13 contract tests)
- ✅ Phase 3.3: Database (100% - 11/11 migrations)
- ✅ Phase 3.3: Models (100% - 10/10 models)
- ✅ Phase 3.3: Services (100% - 8/8 services)
- ⏳ Phase 3.3: Providers (75% - 3/4 providers)
- ⏳ Phase 3.3: Screens (14% - 2/14 screens)
- ⏳ Phase 3.3: Widgets (75% - 3/4 widgets)
- ⏳ Phase 3.4: Integration (0% - 0/8 tarefas)
- ⏳ Phase 3.5: Polish (0% - 0/18 tarefas)

### Total: 52/103 tarefas (50.5%)

## 🎯 Próximos Passos Recomendados

### Opção A: Completar MVP Mínimo (3-5 tarefas)
1. Implementar SignupScreen (T061)
2. Implementar GrupoDetailScreen (T064)
3. Implementar MeetingRegistrationScreen (T069)
4. Aplicar migrations e seed (T078-T079)
5. Testar fluxo E2E manualmente

### Opção B: Focar em Testes (TDD Correto)
1. Completar todos contract tests (T010-T018)
2. Implementar integration tests (T019-T023)
3. Validar com quickstart.md
4. Então continuar implementação

### Opção C: Continuar Implementação Completa
1. Completar todas as screens (T063-T073)
2. Implementar offline sync (T053-T055)
3. Integration & Polish (T078-T103)

## 🐛 Issues Conhecidos

1. **Erros de tipo nos Providers** - Services retornam tipos diferentes do esperado pelos providers (precisam ajuste de assinaturas)
2. **GrowthGroup model** - Falta campo `totalMembrosAtivos` (adicionar ao model ou buscar via query)
3. **AuthService** - Assinaturas de login/signup precisam ajuste (named parameters)
4. **Testes com erros de importação** - Esperado (TDD), packages precisam ser instalados via `flutter pub get`

## 📝 Notas Técnicas

### Papéis Acumulados (Importante!)
- Usuários podem ter **múltiplos papéis** simultaneamente
- Líder + Supervisor + Coordenador na mesma pessoa é válido
- Papéis são **derivados de relacionamentos**, não campos estáticos
- Ver `data-model.md` seção "Modelo de Papéis Acumulados"

### RLS Policies
- SELECT retorna **array vazio** (não 403) quando RLS bloqueia
- INSERT/UPDATE/DELETE retornam **403 Forbidden** quando bloqueados
- Testes devem validar ambos comportamentos

### Offline-First
- Reuniões devem ser salváveis offline (sqflite)
- Sync automático quando volta online
- Conflict resolution: last-write-wins

---

**Recomendação**: Iniciar com **Opção A** para ter um app rodando rapidamente, depois voltar para testes (Opção B) e então completar features (Opção C).
