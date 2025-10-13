# Database Schema Translation: Portuguese → English

**Date**: 2025-10-13
**Reason**: Constitution v1.2.0 - All code must be in English

## Table Names

| Portuguese | English | Notes |
|------------|---------|-------|
| pessoas | people | Base entity for personal data |
| growth_groups | growth_groups | ✅ Already English |
| gc_leaders | gc_leaders | ✅ Already English |
| gc_supervisors | gc_supervisors | ✅ Already English |
| users | users | ✅ Already English |
| members | members | ✅ Already English |
| visitors | visitors | ✅ Already English |
| meetings | meetings | ✅ Already English |
| meeting_attendance | meeting_attendance | ✅ Already English |
| lessons | lessons | ✅ Already English |
| lesson_series | lesson_series | ✅ Already English |
| config | config | ✅ Already English |

## Column Names by Table

### Table: pessoas → people

| Portuguese | English | Type | Notes |
|------------|---------|------|-------|
| nome | name | TEXT | Person's full name |
| data_nascimento | birth_date | DATE | Birth date |
| telefone | phone | TEXT | Phone number |
| email | email | TEXT | ✅ Already English |
| created_at | created_at | TIMESTAMPTZ | ✅ Already English |
| updated_at | updated_at | TIMESTAMPTZ | ✅ Already English |
| deleted_at | deleted_at | TIMESTAMPTZ | ✅ Already English |

### Table: users

| Portuguese | English | Type | Notes |
|------------|---------|------|-------|
| pessoa_id | person_id | UUID | FK to people table |
| hierarchy_parent_id | hierarchy_parent_id | UUID | ✅ Already English |
| hierarchy_path | hierarchy_path | TEXT | ✅ Already English |
| hierarchy_depth | hierarchy_depth | INT | ✅ Already English |
| is_admin | is_admin | BOOLEAN | ✅ Already English |
| created_at | created_at | TIMESTAMPTZ | ✅ Already English |
| updated_at | updated_at | TIMESTAMPTZ | ✅ Already English |
| deleted_at | deleted_at | TIMESTAMPTZ | ✅ Already English |

### Table: growth_groups

| Portuguese | English | Type | Notes |
|------------|---------|------|-------|
| nome | name | TEXT | GC name |
| modalidade | mode | TEXT | 'presencial' → 'in_person', 'online' → 'online', 'hibrido' → 'hybrid' |
| endereco | address | TEXT | Physical address |
| dia_semana | weekday | INT | Day of week (0-6) |
| horario | time | TIME | Meeting time |
| status | status | TEXT | 'ativo' → 'active', 'inativo' → 'inactive', 'multiplicacao' → 'multiplying' |
| created_at | created_at | TIMESTAMPTZ | ✅ Already English |
| updated_at | updated_at | TIMESTAMPTZ | ✅ Already English |
| deleted_at | deleted_at | TIMESTAMPTZ | ✅ Already English |

### Table: gc_leaders

| Portuguese | English | Type | Notes |
|------------|---------|------|-------|
| gc_id | gc_id | UUID | ✅ Already English |
| user_id | user_id | UUID | ✅ Already English |
| role | role | TEXT | 'leader' → 'leader', 'co-leader' → 'co_leader' |
| added_at | added_at | TIMESTAMPTZ | ✅ Already English |

### Table: gc_supervisors

| Portuguese | English | Type | Notes |
|------------|---------|------|-------|
| gc_id | gc_id | UUID | ✅ Already English |
| user_id | user_id | UUID | ✅ Already English |
| added_at | added_at | TIMESTAMPTZ | ✅ Already English |

### Table: members

| Portuguese | English | Type | Notes |
|------------|---------|------|-------|
| pessoa_id | person_id | UUID | FK to people table |
| gc_id | gc_id | UUID | ✅ Already English |
| status | status | TEXT | 'ativo' → 'active', 'inativo' → 'inactive', 'transferido' → 'transferred' |
| joined_at | joined_at | TIMESTAMPTZ | ✅ Already English |
| converted_from_visitor_id | converted_from_visitor_id | UUID | ✅ Already English |
| created_at | created_at | TIMESTAMPTZ | ✅ Already English |
| updated_at | updated_at | TIMESTAMPTZ | ✅ Already English |
| deleted_at | deleted_at | TIMESTAMPTZ | ✅ Already English |

### Table: visitors

| Portuguese | English | Type | Notes |
|------------|---------|------|-------|
| pessoa_id | person_id | UUID | FK to people table |
| visit_count | visit_count | INT | ✅ Already English |
| first_visit_date | first_visit_date | TIMESTAMPTZ | ✅ Already English |
| last_visit_date | last_visit_date | TIMESTAMPTZ | ✅ Already English |
| converted_to_member_at | converted_to_member_at | TIMESTAMPTZ | ✅ Already English |
| converted_by_user_id | converted_by_user_id | UUID | ✅ Already English |
| converted_to_member_id | converted_to_member_id | UUID | ✅ Already English |
| created_at | created_at | TIMESTAMPTZ | ✅ Already English |
| updated_at | updated_at | TIMESTAMPTZ | ✅ Already English |

### Table: lesson_series

| Portuguese | English | Type | Notes |
|------------|---------|------|-------|
| nome | name | TEXT | Series name |
| descricao | description | TEXT | Description |
| criado_por_user_id | created_by_user_id | UUID | Created by user |
| created_at | created_at | TIMESTAMPTZ | ✅ Already English |
| updated_at | updated_at | TIMESTAMPTZ | ✅ Already English |

### Table: lessons

| Portuguese | English | Type | Notes |
|------------|---------|------|-------|
| titulo | title | TEXT | Lesson title |
| descricao | description | TEXT | Description |
| referencias_biblicas | bible_references | TEXT | Bible references |
| serie_id | series_id | UUID | FK to lesson_series |
| link | link | TEXT | ✅ Already English |
| ordem_na_serie | order_in_series | INT | Order in series |
| criado_por_user_id | created_by_user_id | UUID | Created by user |
| created_at | created_at | TIMESTAMPTZ | ✅ Already English |
| updated_at | updated_at | TIMESTAMPTZ | ✅ Already English |

### Table: meetings

| Portuguese | English | Type | Notes |
|------------|---------|------|-------|
| gc_id | gc_id | UUID | ✅ Already English |
| data_hora | datetime | TIMESTAMPTZ | Meeting date and time |
| licao_id | lesson_id | UUID | FK to lessons |
| registrado_por_user_id | registered_by_user_id | UUID | Registered by user |
| created_at | created_at | TIMESTAMPTZ | ✅ Already English |
| updated_at | updated_at | TIMESTAMPTZ | ✅ Already English |

### Table: meeting_attendance

| Portuguese | English | Type | Notes |
|------------|---------|------|-------|
| meeting_id | meeting_id | UUID | ✅ Already English |
| member_id | member_id | UUID | ✅ Already English |
| visitor_id | visitor_id | UUID | ✅ Already English |
| attendance_type | attendance_type | TEXT | ✅ Already English |
| created_at | created_at | TIMESTAMPTZ | ✅ Already English |

## View Names

| Portuguese | English | Notes |
|------------|---------|-------|
| dashboard_metricas | dashboard_metrics | Dashboard metrics view |
| user_roles | user_roles | ✅ Already English |

## View Columns: dashboard_metricas → dashboard_metrics

| Portuguese | English | Notes |
|------------|---------|-------|
| gc_nome | gc_name | Growth group name |
| total_reunioes_mes_atual | total_meetings_current_month | Count |
| media_presenca | average_attendance | Average attendance |
| total_membros_ativos | total_active_members | Count |
| conversoes_ultimo_mes | conversions_last_month | Count |
| novos_membros_ultimo_mes | new_members_last_month | Count |
| total_lideres | total_leaders | Count |
| total_supervisores | total_supervisors | Count |

## View Columns: user_roles

| Portuguese | English | Notes |
|------------|---------|-------|
| nome | name | User name |
| email | email | ✅ Already English |
| is_leader | is_leader | ✅ Already English |
| is_supervisor | is_supervisor | ✅ Already English |
| is_coordinator | is_coordinator | ✅ Already English |
| is_admin | is_admin | ✅ Already English |
| gcs_liderados | gcs_led | GCs led count |
| gcs_supervisionados | gcs_supervised | GCs supervised count |
| subordinados_diretos | direct_subordinates | Count |

## Function Names

| Portuguese | English | Notes |
|------------|---------|-------|
| update_timestamp() | update_timestamp() | ✅ Already English |
| update_hierarchy_path() | update_hierarchy_path() | ✅ Already English |
| auto_convert_visitor() | auto_convert_visitor() | ✅ Already English |

## Constraint Names

| Portuguese | English | Notes |
|------------|---------|-------|
| pessoa_tem_contato | person_has_contact | CHECK constraint |
| endereco_se_presencial | address_if_in_person | CHECK constraint |
| member_or_visitor | member_or_visitor | ✅ Already English |

## Index Names

| Portuguese | English | Notes |
|------------|---------|-------|
| idx_pessoas_* | idx_people_* | All people indexes |
| idx_*_pessoa | idx_*_person | All pessoa_id indexes |

## Enum Values

### modalidade → mode
- 'presencial' → 'in_person'
- 'online' → 'online'
- 'hibrido' → 'hybrid'

### status (growth_groups)
- 'ativo' → 'active'
- 'inativo' → 'inactive'
- 'multiplicacao' → 'multiplying'

### status (members)
- 'ativo' → 'active'
- 'inativo' → 'inactive'
- 'transferido' → 'transferred'

### role (gc_leaders)
- 'leader' → 'leader'
- 'co-leader' → 'co_leader'

### attendance_type
- 'member' → 'member'
- 'visitor' → 'visitor'

## Policy Names

Keep policy names descriptive in English but retain Portuguese where it aids clarity:

Example:
- `lideres_veem_proprios_gcs` → `leaders_view_own_gcs`
- `supervisores_veem_gcs` → `supervisors_view_gcs`
- `admins_manage_all_pessoas` → `admins_manage_all_people`

## Migration Strategy

1. Create new migration `013_standardize_to_english.sql`
2. Rename table: `ALTER TABLE pessoas RENAME TO people;`
3. Rename columns: `ALTER TABLE <table> RENAME COLUMN <old> TO <new>;`
4. Rename views: `DROP VIEW old; CREATE VIEW new AS ...;`
5. Update enum values: `UPDATE <table> SET <column> = CASE ... END;`
6. Rename constraints: `ALTER TABLE <table> RENAME CONSTRAINT <old> TO <new>;`
7. Rename indexes: `ALTER INDEX <old> RENAME TO <new>;`
8. Drop and recreate policies with new names and references

## Files to Update

- ✅ constitution.md (updated to v1.2.0)
- [ ] All migration files (001-012)
- [ ] seed.sql
- [ ] data-model.md
- [ ] All Flutter models (app/lib/models/*.dart)
- [ ] All Flutter services (app/lib/services/*.dart)
- [ ] CLAUDE.md
- [ ] tasks.md (references to Portuguese names)
