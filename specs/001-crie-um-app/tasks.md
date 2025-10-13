# Tasks: App de Gestão de Grupos de Crescimento

**Input**: Design documents from `/specs/001-crie-um-app/`
**Prerequisites**: plan.md, research.md, data-model.md, contracts/, quickstart.md
**Language**: Brazilian Portuguese (pt-BR) - per Constitution Principle VI

## Execution Flow
```
1. Setup project structure (Flutter + Supabase)
2. Write tests first (TDD) - contract tests, integration tests
3. Implement core features (models, services, screens)
4. Integration (offline sync, RLS policies, triggers)
5. Polish (unit tests, performance, validation)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Flutter app**: `app/lib/` for source, `app/test/` for tests
- **Supabase**: `supabase/migrations/` for SQL, `supabase/seed.sql` for initial data
- **Contract tests**: `tests/contract/` for API validation

---

## Phase 3.1: Setup

- [x] T001 Create Flutter project structure at `app/` with folders: lib/models, lib/services, lib/screens, lib/widgets, lib/providers, lib/utils, test/unit, test/widget, integration_test
- [x] T002 Initialize Flutter dependencies in `app/pubspec.yaml`: supabase_flutter ^2.0.0, riverpod ^2.0.0, sqflite, connectivity_plus, mockito, integration_test
- [x] T003 [P] Create Supabase project structure with `supabase/migrations/` folder and `supabase/seed.sql` file
- [x] T004 [P] Configure linting in `app/analysis_options.yaml` with Flutter recommended lints
- [x] T005 Create Supabase config in `app/lib/utils/supabase_config.dart` with Supabase.initialize() and PKCE auth flow

---

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Contract Tests (from contracts/*.yaml)

- [x] T006 [P] Contract test POST /auth/signup in `tests/contract/test_auth_signup.dart` - validate schema, RLS, error codes
- [x] T007 [P] Contract test POST /auth/login in `tests/contract/test_auth_login.dart` - validate JWT response, rate limiting
- [x] T008 [P] Contract test GET /growth_groups in `tests/contract/test_grupos_list.dart` - validate select with gc_leaders/gc_supervisors joins, RLS filtering
- [x] T009 [P] Contract test POST /growth_groups in `tests/contract/test_grupos_create.dart` - validate leader_ids/supervisor_ids arrays, required fields, RLS policies
- [ ] T010 [P] Contract test GET /growth_groups/{id} in `tests/contract/test_grupos_get.dart` - validate detailed response with members count
- [ ] T011 [P] Contract test PATCH /growth_groups/{id} in `tests/contract/test_grupos_update.dart` - validate partial updates, RLS
- [ ] T012 [P] Contract test DELETE /growth_groups/{id} in `tests/contract/test_grupos_delete.dart` - validate soft delete (status=inativo)
- [ ] T013 [P] Contract test POST /gc_leaders in `tests/contract/test_gc_leaders_add.dart` - validate role enum, duplicate prevention
- [ ] T014 [P] Contract test DELETE /gc_leaders/{gc_id}/{user_id}/{role} in `tests/contract/test_gc_leaders_remove.dart` - validate cannot remove last leader
- [ ] T015 [P] Contract test POST /gc_supervisors in `tests/contract/test_gc_supervisors_add.dart` - validate duplicate prevention
- [ ] T016 [P] Contract test DELETE /gc_supervisors/{gc_id}/{user_id} in `tests/contract/test_gc_supervisors_remove.dart` - validate cannot remove last supervisor
- [ ] T017 [P] Contract test POST /meetings (reunioes) in `tests/contract/test_reunioes_create.dart` - validate meeting with attendance data
- [ ] T018 [P] Contract test GET /meetings/{id} in `tests/contract/test_reunioes_get.dart` - validate meeting with attendance list

### Integration Tests (from quickstart.md scenarios)

- [ ] T019 [P] Integration test "Líder registra reunião com 5 membros + 2 visitantes" in `app/integration_test/test_scenario_1_register_meeting.dart`
- [ ] T020 [P] Integration test "Visitante atinge 3 visitas e é convertido automaticamente" in `app/integration_test/test_scenario_2_visitor_conversion.dart`
- [ ] T021 [P] Integration test "Supervisor visualiza métricas da rede (3 GCs)" in `app/integration_test/test_scenario_3_supervisor_dashboard.dart`
- [ ] T022 [P] Integration test "Admin cria série de 4 lições" in `app/integration_test/test_scenario_4_admin_lessons.dart`
- [ ] T023 [P] Integration test "Coordenador atribui João como supervisor de novo GC" in `app/integration_test/test_scenario_5_role_accumulation.dart`

---

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### Database Migrations (based on data-model.md)

- [x] T024 Create migration `supabase/migrations/001_users_hierarchy.sql` - users table, hierarchy triggers, RLS policies for self/subordinates/supervisor views
- [x] T025 Create migration `supabase/migrations/002_growth_groups.sql` - growth_groups table, timestamps trigger, RLS policies for visibility
- [x] T026 Create migration `supabase/migrations/003_gc_relationships.sql` - gc_leaders and gc_supervisors many-to-many tables, constraints to ensure at least 1 leader/supervisor per GC
- [x] T027 Create migration `supabase/migrations/004_members.sql` - members table, FK to growth_groups, RLS policies
- [x] T028 Create migration `supabase/migrations/005_visitors.sql` - visitors table, conversion tracking fields
- [x] T029 Create migration `supabase/migrations/006_lessons.sql` - lesson_series and lessons tables, RLS for admin-only create
- [x] T030 Create migration `supabase/migrations/007_meetings.sql` - meetings table, FK to growth_groups and lessons
- [x] T031 Create migration `supabase/migrations/008_meeting_attendance.sql` - meeting_attendance table, FK to meetings/members/visitors
- [x] T032 Create migration `supabase/migrations/009_visitor_conversion_trigger.sql` - auto_convert_visitor() trigger on meeting_attendance with threshold from config table
- [x] T033 Create migration `supabase/migrations/010_dashboard_views.sql` - dashboard_metricas view with frequency, growth, conversion aggregations
- [x] T034 Create seed data in `supabase/seed.sql` - test users, GCs with multiple leaders/supervisors, members, lesson series per quickstart.md

### Models (entities from data-model.md)

- [x] T035 [P] User model in `app/lib/models/user.dart` - id, email, nome, hierarchy_parent_id, hierarchy_path, is_admin, fromJson/toJson
- [x] T036 [P] GrowthGroup model in `app/lib/models/growth_group.dart` - id, nome, modalidade, endereco, dia_semana, horario, status, fromJson/toJson
- [x] T037 [P] GCLeader model in `app/lib/models/gc_leader.dart` - gc_id, user_id, role, added_at, fromJson/toJson
- [x] T038 [P] GCSupervisor model in `app/lib/models/gc_supervisor.dart` - gc_id, user_id, added_at, fromJson/toJson
- [x] T039 [P] Member model in `app/lib/models/member.dart` - id, nome, email, telefone, gc_id, status, joined_at, fromJson/toJson
- [x] T040 [P] Visitor model in `app/lib/models/visitor.dart` - id, nome, email, telefone, visit_count, first_visit_date, converted_to_member_at, fromJson/toJson
- [x] T041 [P] Meeting model in `app/lib/models/meeting.dart` - id, gc_id, data_hora, licao_id, registrado_por_user_id, fromJson/toJson
- [x] T042 [P] MeetingAttendance model in `app/lib/models/meeting_attendance.dart` - id, meeting_id, member_id, visitor_id, attendance_type, fromJson/toJson
- [x] T043 [P] Lesson model in `app/lib/models/lesson.dart` - id, titulo, descricao, referencias_biblicas, serie_id, link, ordem_na_serie, fromJson/toJson
- [x] T044 [P] LessonSeries model in `app/lib/models/lesson_series.dart` - id, nome, descricao, criado_por_user_id, fromJson/toJson

### Services (business logic + Supabase integration)

- [x] T045 Create AuthService in `app/lib/services/auth_service.dart` - signup(), login(), logout(), getCurrentUser() using Supabase Auth
- [x] T046 Create GruposService in `app/lib/services/grupos_service.dart` - listGrowthGroups(), createGrowthGroup(leader_ids, supervisor_ids), getGrowthGroup(id), updateGrowthGroup(), deleteGrowthGroup()
- [x] T047 Create GCRelationshipsService in `app/lib/services/gc_relationships_service.dart` - addLeader(), removeLeader(), addSupervisor(), removeSupervisor()
- [x] T048 Create MembrosService in `app/lib/services/membros_service.dart` - listMembers(gc_id), addMember(), updateMember(), deleteMember()
- [x] T049 Create VisitorsService in `app/lib/services/visitors_service.dart` - listVisitors(), addVisitor(), getVisitorConversionStatus()
- [x] T050 Create ReunioesService in `app/lib/services/reunioes_service.dart` - createMeeting(attendance_list), getMeeting(id), listMeetings(gc_id)
- [x] T051 Create LicoesService in `app/lib/services/licoes_service.dart` - listLessons(), listLessonSeries(), createLesson(admin_only), createLessonSeries(admin_only)
- [x] T052 Create DashboardService in `app/lib/services/dashboard_service.dart` - getMetricas() with 5min TTL cache, getRolesForUser(user_id) to check is_leader/is_supervisor/is_coordinator

### Offline Sync Layer

- [ ] T053 Create SyncService in `app/lib/services/sync_service.dart` - processSyncQueue(), _syncToSupabase(), sqflite setup, connectivity monitoring
- [ ] T054 Create local sqflite schema in `app/lib/utils/local_db.dart` - mirrors Supabase tables for meetings, sync_queue table
- [ ] T055 Update ReunioesService to save locally first, then sync - integrate with SyncService

### Providers (Riverpod state management)

- [x] T056 [P] Create authProvider in `app/lib/providers/auth_provider.dart` - StateNotifierProvider<AuthNotifier, AuthState>
- [x] T057 [P] Create gruposProvider in `app/lib/providers/grupos_provider.dart` - FutureProvider.family for filtered GC lists
- [x] T058 [P] Create reunioesProvider in `app/lib/providers/reunioes_provider.dart` - StateNotifierProvider for meeting registration flow
- [ ] T059 [P] Create dashboardProvider in `app/lib/providers/dashboard_provider.dart` - FutureProvider with cache invalidation

### Screens (UI implementation)

- [x] T060 Create LoginScreen in `app/lib/screens/auth/login_screen.dart` - email/password form, error handling, navigation to home
- [ ] T061 Create SignupScreen in `app/lib/screens/auth/signup_screen.dart` - email/password form, validation
- [x] T062 Create HomeScreen in `app/lib/screens/home_screen.dart` - role-based navigation (leader → GCs list, supervisor → dashboard, admin → admin panel)
- [ ] T063 Create GCListScreen in `app/lib/screens/grupos/gc_list_screen.dart` - filtered list based on RLS, search, pagination
- [ ] T064 Create GCDetailScreen in `app/lib/screens/grupos/gc_detail_screen.dart` - display GC info, leaders, supervisors, members count, navigation to members/meetings
- [ ] T065 Create CreateGCScreen in `app/lib/screens/grupos/create_gc_screen.dart` - form with leader_ids/supervisor_ids multi-select, address for presencial, validation
- [ ] T066 Create EditGCScreen in `app/lib/screens/grupos/edit_gc_screen.dart` - update GC details, add/remove leaders/supervisors
- [ ] T067 Create MemberListScreen in `app/lib/screens/membros/member_list_screen.dart` - list members for a GC, status filter
- [ ] T068 Create AddMemberScreen in `app/lib/screens/membros/add_member_screen.dart` - form to add member or visitor
- [ ] T069 Create MeetingRegistrationScreen in `app/lib/screens/reunioes/meeting_registration_screen.dart` - date/time picker, lesson selector, attendance checklist (members + visitors), offline-first save
- [ ] T070 Create MeetingDetailScreen in `app/lib/screens/reunioes/meeting_detail_screen.dart` - show meeting info, attendance list, lesson details
- [ ] T071 Create DashboardScreen in `app/lib/screens/dashboards/dashboard_screen.dart` - display metricas (frequencia, crescimento, conversão) for supervised GCs, charts/tables
- [ ] T072 Create LessonListScreen in `app/lib/screens/licoes/lesson_list_screen.dart` - browse lessons by series, search
- [ ] T073 Create CreateLessonScreen in `app/lib/screens/licoes/create_lesson_screen.dart` - admin-only, form for lesson/series creation

### Widgets (reusable components)

- [x] T074 [P] Create LoadingIndicator in `app/lib/widgets/loading_indicator.dart` - consistent loading spinner
- [x] T075 [P] Create ErrorDisplay in `app/lib/widgets/error_display.dart` - error message with retry button
- [x] T076 [P] Create GCCard in `app/lib/widgets/gc_card.dart` - display GC summary in lists
- [ ] T077 [P] Create MemberAttendanceCheckbox in `app/lib/widgets/member_attendance_checkbox.dart` - checkbox for meeting attendance list

---

## Phase 3.4: Integration

- [ ] T078 Apply all Supabase migrations in order using `supabase db push` - verify tables, triggers, views, RLS policies created
- [ ] T079 Load seed.sql data using `supabase db reset --db-url <local>` - verify test users, GCs with multiple leaders/supervisors, members, lessons
- [ ] T080 Test RLS policies manually via Supabase SQL editor - verify leader sees own GCs, supervisor sees supervised GCs, coordinator sees subordinate GCs
- [ ] T081 Test visitor conversion trigger - manually insert 3 meeting_attendance records for same visitor, verify converted_to_member_at updated
- [ ] T082 Test dashboard_metricas view - query and verify aggregations match expected calculations
- [ ] T083 Implement error handling in all services - wrap Supabase calls with try-catch, map to user-friendly error messages
- [ ] T084 Implement logging in `app/lib/utils/logger.dart` - log auth events, sync errors, RLS denials for debugging
- [ ] T085 Connect offline sync to connectivity listener - trigger processSyncQueue() when app goes online

---

## Phase 3.5: Polish

### Unit Tests

- [ ] T086 [P] Unit tests for User model in `app/test/unit/models/user_test.dart` - test fromJson/toJson, validation
- [ ] T087 [P] Unit tests for GrowthGroup model in `app/test/unit/models/growth_group_test.dart` - test fromJson/toJson, validation
- [ ] T088 [P] Unit tests for AuthService in `app/test/unit/services/auth_service_test.dart` - mock Supabase client, test login/signup flows
- [ ] T089 [P] Unit tests for GruposService in `app/test/unit/services/grupos_service_test.dart` - mock Supabase, test CRUD operations
- [ ] T090 [P] Unit tests for SyncService in `app/test/unit/services/sync_service_test.dart` - mock sqflite and Supabase, test sync queue logic

### Widget Tests

- [ ] T091 [P] Widget test for LoginScreen in `app/test/widget/login_screen_test.dart` - test form validation, error states, navigation
- [ ] T092 [P] Widget test for MeetingRegistrationScreen in `app/test/widget/meeting_registration_screen_test.dart` - test attendance checklist, offline indicator
- [ ] T093 [P] Widget test for DashboardScreen in `app/test/widget/dashboard_screen_test.dart` - test metrics display, loading/error states

### Performance & Optimization

- [ ] T094 Add pagination to GC list queries - limit 50, offset parameter, infinite scroll in GCListScreen
- [ ] T095 Add indexes to Supabase in `supabase/migrations/011_performance_indexes.sql` - index on meetings.data_hora, meeting_attendance.member_id, members.gc_id
- [ ] T096 Optimize dashboard cache in DashboardService - verify 5min TTL, manual refresh on pull-to-refresh
- [ ] T097 Test UI performance - verify 60fps on GCListScreen with 100+ GCs using Flutter DevTools
- [ ] T098 Test list loading performance - verify <500ms for GET /growth_groups with 100 records

### Validation & Documentation

- [ ] T099 Run all 5 quickstart.md scenarios manually - verify each step passes, document any issues
- [ ] T100 Update CLAUDE.md with final tech stack - add any additional dependencies, update structure if changed
- [ ] T101 Remove code duplication - refactor repeated error handling, consolidate Supabase query builders
- [ ] T102 Run `flutter analyze` - fix all warnings and errors
- [ ] T103 Run full test suite `flutter test && flutter test integration_test/` - verify all tests pass

---

## Dependencies

**Setup blocks everything**:
- T001-T005 must complete before any other phase

**Tests block implementation**:
- T006-T023 (all tests) must FAIL before starting T024-T077 (implementation)

**Database blocks services**:
- T024-T034 (migrations + seed) must complete before T045-T052 (services)

**Models block services**:
- T035-T044 (models) must complete before T045-T052 (services)

**Services block screens**:
- T045-T052 (services) must complete before T060-T073 (screens)

**Offline sync has dependencies**:
- T053 (SyncService) requires T054 (local DB schema)
- T055 (integrate sync) requires T050 (ReunioesService) and T053 (SyncService)

**Integration requires implementation**:
- T078-T085 (integration) requires T024-T077 (all implementation) complete

**Polish requires integration**:
- T086-T103 (polish) requires T078-T085 (integration) complete

**Within-phase parallelization**:
- Contract tests T006-T018 can run in parallel [P]
- Integration tests T019-T023 can run in parallel [P]
- Migrations T024-T033 should run sequentially (numbered order)
- Models T035-T044 can run in parallel [P]
- Services T045-T052 can run in parallel after models [P]
- Providers T056-T059 can run in parallel [P]
- Screens can run in parallel if different files [P]
- Widgets T074-T077 can run in parallel [P]
- Unit tests T086-T090 can run in parallel [P]
- Widget tests T091-T093 can run in parallel [P]

---

## Parallel Execution Examples

### Example 1: Contract Tests
```bash
# Launch T006-T010 together (5 parallel test files):
claude code "Contract test POST /auth/signup in tests/contract/test_auth_signup.dart"
claude code "Contract test POST /auth/login in tests/contract/test_auth_login.dart"
claude code "Contract test GET /growth_groups in tests/contract/test_grupos_list.dart"
claude code "Contract test POST /growth_groups in tests/contract/test_grupos_create.dart"
claude code "Contract test GET /growth_groups/{id} in tests/contract/test_grupos_get.dart"
```

### Example 2: Models
```bash
# Launch T035-T039 together (5 parallel model files):
claude code "User model in app/lib/models/user.dart"
claude code "GrowthGroup model in app/lib/models/growth_group.dart"
claude code "GCLeader model in app/lib/models/gc_leader.dart"
claude code "GCSupervisor model in app/lib/models/gc_supervisor.dart"
claude code "Member model in app/lib/models/member.dart"
```

### Example 3: Integration Tests
```bash
# Launch T019-T023 together (5 parallel integration test files):
claude code "Integration test líder registra reunião in app/integration_test/test_scenario_1_register_meeting.dart"
claude code "Integration test visitor conversion in app/integration_test/test_scenario_2_visitor_conversion.dart"
claude code "Integration test supervisor dashboard in app/integration_test/test_scenario_3_supervisor_dashboard.dart"
claude code "Integration test admin lessons in app/integration_test/test_scenario_4_admin_lessons.dart"
claude code "Integration test role accumulation in app/integration_test/test_scenario_5_role_accumulation.dart"
```

---

## Notes

- **[P] tasks** = different files, no dependencies - safe to parallelize
- **Verify tests fail** before implementing features (TDD principle)
- **Commit after each task** with message format: `feat: T###: <description>`
- **Avoid**: vague tasks, modifying same file in parallel tasks, skipping test phase
- **Multiple leaders/supervisors model**: Remember gc_leaders and gc_supervisors are many-to-many tables. Roles are ACCUMULATED, not exclusive. See CLAUDE.md for details.
- **RLS policies critical**: All data access is filtered by RLS - test policies thoroughly in T078-T082
- **Offline-first**: Meetings MUST be saveable offline (T053-T055). Test without internet connection.

---

## Task Generation Validation Checklist

*GATE: Verified before tasks.md creation*

- [x] All 4 contract files have corresponding tests (auth, grupos, gc_relationships, reunioes)
- [x] All 10 entities from data-model.md have model tasks (User, GrowthGroup, GCLeader, GCSupervisor, Member, Visitor, Meeting, MeetingAttendance, Lesson, LessonSeries)
- [x] All tests come before implementation (Phase 3.2 before Phase 3.3)
- [x] Parallel tasks are truly independent (different files, marked [P])
- [x] Each task specifies exact file path
- [x] No [P] task modifies same file as another [P] task
- [x] All 5 quickstart scenarios have integration tests
- [x] Migrations cover all tables, triggers, views from data-model.md
- [x] Services cover all major endpoints from contracts/
- [x] Screens cover all user roles (leader, supervisor, coordinator, admin)

---

**Total Tasks**: 103 tasks
**Estimated Complexity**: High (mobile app + backend + offline sync + complex RLS policies)
**Critical Path**: Setup → Tests → Migrations → Models → Services → Screens → Integration → Polish
**Parallel Opportunities**: ~40 tasks can be parallelized (contract tests, models, services, widgets, unit tests)

---

*Generated per Constitution v1.1.0 - Based on plan.md, data-model.md, contracts/, research.md, quickstart.md*
