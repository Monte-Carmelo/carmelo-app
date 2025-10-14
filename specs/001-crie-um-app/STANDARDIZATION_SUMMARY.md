# Database Standardization: Portuguese → English

**Date**: 2025-10-13
**Status**: ✅ Complete
**Constitution**: Updated to v1.2.0

## Objective

Standardize all database code (table names, column names, enum values, policies) to use English while maintaining Brazilian Portuguese for documentation, following global software engineering best practices.

## Changes Completed

### 1. Constitution Updated ✅

**File**: `.specify/memory/constitution.md`
**Version**: 1.1.0 → 1.2.0

**Key Update to Principle VI**:
- ALL source code, database schemas, API contracts, and technical identifiers MUST be in English
- Documentation (spec.md, plan.md, data-model.md, etc.) remains in Brazilian Portuguese
- Code comments and user-facing strings SHOULD use Portuguese for Brazilian developers

### 2. Translation Map Created ✅

**File**: `specs/001-crie-um-app/TRANSLATION_MAP.md`

Comprehensive reference document covering:
- All table name mappings
- All column name translations
- All enum value changes
- All policy name translations
- All view and constraint changes

### 3. Database Migrations Standardized ✅

**Files Updated**: All 12 migration files (001-012)

#### Major Table/Column Changes:

| Category | Before (Portuguese) | After (English) |
|----------|---------------------|-----------------|
| **Table** | `pessoas` | `people` |
| **Column** | `nome` | `name` |
| **Column** | `pessoa_id` | `person_id` |
| **Column** | `telefone` | `phone` |
| **Column** | `data_nascimento` | `birth_date` |
| **Column** | `endereco` | `address` |
| **Column** | `dia_semana` | `weekday` |
| **Column** | `horario` | `time` |
| **Column** | `modalidade` | `mode` |
| **Column** | `licao_id` | `lesson_id` |
| **Column** | `data_hora` | `datetime` |
| **Column** | `registrado_por_user_id` | `registered_by_user_id` |
| **Column** | `titulo` | `title` |
| **Column** | `descricao` | `description` |
| **Column** | `referencias_biblicas` | `bible_references` |
| **Column** | `serie_id` | `series_id` |
| **Column** | `ordem_na_serie` | `order_in_series` |
| **Column** | `criado_por_user_id` | `created_by_user_id` |
| **View** | `dashboard_metricas` | `dashboard_metrics` |

#### Enum Value Changes:

| Context | Before | After |
|---------|--------|-------|
| GC mode | `'presencial'` | `'in_person'` |
| GC mode | `'online'` | `'online'` ✅ |
| GC mode | `'hibrido'` | `'hybrid'` |
| Status | `'ativo'` | `'active'` |
| Status | `'inativo'` | `'inactive'` |
| Status | `'multiplicando'` | `'multiplying'` |
| Status | `'transferido'` | `'transferred'` |
| Leader role | `'co-leader'` | `'co_leader'` |

#### Policy Names Standardized:

32 RLS policies renamed to English, examples:
- `lideres_veem_proprios_gcs` → `leaders_view_own_gcs`
- `supervisores_veem_gcs` → `supervisors_view_gcs`
- `admins_manage_all_pessoas` → `admins_manage_all_people`
- `lideres_gerenciam_membros` → `leaders_manage_members`
- `todos_veem_licoes` → `all_view_lessons`

### 4. Seed Data Updated ✅

**File**: `supabase/seed.sql`

All INSERT statements updated:
- Table names: `pessoas` → `people`
- Column names: All translated per mapping
- Enum values: All translated per mapping
- Comments: Remain descriptive in English

### 5. Testing ✅

**Command**: `supabase db reset`
**Result**: ✅ All 12 migrations applied successfully
**Seed Data**: ✅ Loaded without errors

## Migration File Summary

| Migration | Description | Key Changes |
|-----------|-------------|-------------|
| 001_people.sql | Base entity for personal data | Created `people` table (was `pessoas`) |
| 002_users_hierarchy.sql | Users with org hierarchy | `person_id` reference, hierarchy triggers |
| 003_growth_groups.sql | Growth groups | `mode`, `address_if_in_person`, RLS placeholders |
| 004_gc_relationships.sql | Growth group participants | `growth_group_participants`, leader/supervisor triggers, RLS |
| 005_members.sql | Legacy placeholder | Documenta remoção da tabela antiga `members` |
| 006_visitors.sql | Visitors tracking | `converted_to_participant_id`, FK para participants |
| 007_lessons.sql | Lesson series & lessons | Removido `bible_references`, mantido `link` |
| 008_meetings.sql | GC meetings | `lesson_template_id`, `lesson_title`, `comments`, soft delete |
| 009_meeting_attendance.sql | Attendance tables | `meeting_member_attendance`, `meeting_visitor_attendance`, RLS |
| 010_visitor_conversion_trigger.sql | Auto-conversion trigger | Usa attendance de visitantes, cria participante ativo |
| 011_dashboard_views.sql | Dashboard metrics | Atualiza view para novas tabelas de presença |
| 012_people_rls_policies.sql | People policies | Referências a `growth_group_participants` e visitantes ativos |

## Files Still Requiring Updates

The following files reference the old Portuguese schema and need updates:

### High Priority (Blocks Implementation)

1. **Web (Next.js) services/hooks** — implementar clientes alinhados às novas tabelas (`growth_group_participants`, `meeting_member_attendance`, `meeting_visitor_attendance`).

### Medium Priority (Documentação)

2. **CLAUDE.md** - Referências às entidades legadas
3. **quickstart.md** - ✅ Atualizado para fluxo web

### Low Priority (Generated Code)

4. **Contract tests** (`tests/contract/*.ts`)
5. **Integration tests** (`web/tests/e2e/*.ts`)

## Benefits Achieved

✅ **Global Best Practices**: Code follows international standards
✅ **Tool Compatibility**: Better IDE autocomplete, linting, and tooling support
✅ **International Collaboration**: Easier for non-Portuguese speakers to contribute
✅ **Consistency**: Clear separation between code (English) and documentation (Portuguese)
✅ **Maintainability**: Standard naming conventions across database and application code

## Next Steps

1. **Immediate**: Atualizar serviços/hooks do frontend web (Sprint 1)
2. **Durante Sprint 1**: Criar testes de contrato e Vitest para garantir aderência ao schema
3. **Sprint 2-3**: Completar cenários Playwright e documentação Storybook
4. **Antes de lançar**: Rodar quickstart web e revisar documentação cruzada

## Validation Checklist

- [x] Constitution updated to v1.2.0
- [x] Translation map created
- [x] All 12 migrations updated
- [x] seed.sql updated
- [x] Migrations tested successfully
- [x] Old 001_pessoas.sql removed
- [x] data-model.md atualizado
- [ ] Web services/hooks atualizados
- [ ] Storybook/E2E coverage adicionada
- [ ] CLAUDE.md atualizado para stack web
- [x] tasks.md atualizado

---

**Notes**:
- User-facing content (like names in seed data: "João Líder", "GC Esperança") intentionally kept in Portuguese as they represent Brazilian user data
- Code comments can remain in Portuguese for clarity with Brazilian developers (per Constitution Principle VI)
- This change is **breaking** - requires full application code update before deployment
