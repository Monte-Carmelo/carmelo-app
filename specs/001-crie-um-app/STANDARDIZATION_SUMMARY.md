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
| 002_users_hierarchy.sql | Users with org hierarchy | `person_id` reference |
| 003_growth_groups.sql | Growth groups | `name`, `mode`, `address`, `weekday`, `time` columns |
| 004_gc_relationships.sql | GC leaders & supervisors | `co_leader` enum value, English policies |
| 005_members.sql | GC members | `person_id` reference, `active` status |
| 006_visitors.sql | Visitors tracking | `person_id` reference |
| 007_lessons.sql | Lesson series & lessons | `title`, `description`, `bible_references`, `series_id`, `order_in_series`, `created_by_user_id` |
| 008_meetings.sql | GC meetings | `datetime`, `lesson_id`, `registered_by_user_id` |
| 009_meeting_attendance.sql | Meeting attendance | English policies |
| 010_visitor_conversion_trigger.sql | Auto-conversion trigger | `registered_by_user_id` in trigger |
| 011_dashboard_views.sql | Dashboard metrics | `dashboard_metrics` view with English columns |
| 012_people_rls_policies.sql | People & visitor policies | English policy names for `people` table |

## Files Still Requiring Updates

The following files reference the old Portuguese schema and need updates:

### High Priority (Blocks Implementation)

1. **data-model.md** - SQL examples use Portuguese names
2. **All Flutter models** (app/lib/models/*.dart) - Property names need translation
3. **All Flutter services** (app/lib/services/*.dart) - Supabase queries need updates

### Medium Priority (Documentation)

4. **CLAUDE.md** - References to data model
5. **tasks.md** - Task descriptions mentioning Portuguese column names
6. **plan.md** - Technical specifications
7. **quickstart.md** - Manual test scenarios

### Low Priority (Generated Code)

8. **Contract tests** (tests/contract/*.dart) - API contract validations
9. **Integration tests** (app/integration_test/*.dart) - Test scenarios

## Benefits Achieved

✅ **Global Best Practices**: Code follows international standards
✅ **Tool Compatibility**: Better IDE autocomplete, linting, and tooling support
✅ **International Collaboration**: Easier for non-Portuguese speakers to contribute
✅ **Consistency**: Clear separation between code (English) and documentation (Portuguese)
✅ **Maintainability**: Standard naming conventions across database and application code

## Next Steps

1. **Immediate**: Update data-model.md to reflect English schema
2. **Before coding**: Update Flutter models and services
3. **During implementation**: Update tests to use English schema
4. **Before PR**: Update all documentation references

## Validation Checklist

- [x] Constitution updated to v1.2.0
- [x] Translation map created
- [x] All 12 migrations updated
- [x] seed.sql updated
- [x] Migrations tested successfully
- [x] Old 001_pessoas.sql removed
- [ ] data-model.md updated
- [ ] Flutter models updated
- [ ] Flutter services updated
- [ ] CLAUDE.md updated
- [ ] tasks.md updated

---

**Notes**:
- User-facing content (like names in seed data: "João Líder", "GC Esperança") intentionally kept in Portuguese as they represent Brazilian user data
- Code comments can remain in Portuguese for clarity with Brazilian developers (per Constitution Principle VI)
- This change is **breaking** - requires full application code update before deployment
