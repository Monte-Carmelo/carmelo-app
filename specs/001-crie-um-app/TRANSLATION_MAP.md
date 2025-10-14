# Database Schema Translation: Portuguese → English

**Date**: 2025-10-13
**Reason**: Constitution v1.2.0 - All code must be in English

## Table Names

| Portuguese | English | Notes |
|------------|---------|-------|
| pessoas | people | Base entity for personal data |
| usuarios | users | Auth + hierarchy |
| grupos_crescimento | growth_groups | Growth groups catalog |
| participantes_gc | growth_group_participants | Papéis (leader/co_leader/supervisor/member) |
| visitantes | visitors | Visitors linked to GC |
| series_licoes | lesson_series | Lesson series catalog |
| licoes | lessons | Individual lessons |
| reunioes | meetings | Meeting instances |
| presenca_membros | meeting_member_attendance | GC participant attendance |
| presenca_visitantes | meeting_visitor_attendance | Visitor attendance |
| eventos_conversao_visitantes | visitor_conversion_events | Conversion audit log |
| configuracoes | config | Key/value configuration |

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

### Table: usuarios → users

| Portuguese | English | Type | Notes |
|------------|---------|------|-------|
| pessoa_id | person_id | UUID | FK to people |
| pai_hierarquia_id | hierarchy_parent_id | UUID | Parent user in hierarchy |
| caminho_hierarquia | hierarchy_path | TEXT | materialized path |
| profundidade | hierarchy_depth | INT | Depth level |
| is_admin | is_admin | BOOLEAN | ✅ Already English |
| created_at | created_at | TIMESTAMPTZ | ✅ Already English |
| updated_at | updated_at | TIMESTAMPTZ | ✅ Already English |
| deleted_at | deleted_at | TIMESTAMPTZ | ✅ Already English |

### Table: grupos_crescimento → growth_groups

| Portuguese | English | Type | Notes |
|------------|---------|------|-------|
| nome | name | TEXT | GC name |
| modalidade | mode | TEXT | 'presencial' → 'in_person', 'online', 'hibrido' → 'hybrid' |
| endereco | address | TEXT | Required when `mode = in_person` |
| dia_semana | weekday | INT | 0 (domingo) .. 6 (sábado) |
| horario | time | TIME | Meeting time |
| status | status | TEXT | 'ativo' → 'active', etc. |
| created_at | created_at | TIMESTAMPTZ | ✅ Already English |
| updated_at | updated_at | TIMESTAMPTZ | ✅ Already English |
| deleted_at | deleted_at | TIMESTAMPTZ | ✅ Already English |

### Table: participantes_gc → growth_group_participants

| Portuguese | English | Type | Notes |
|------------|---------|------|-------|
| gc_id | gc_id | UUID | FK to growth_groups |
| pessoa_id | person_id | UUID | FK to people |
| papel | role | TEXT | 'membro' → 'member', 'lider' → 'leader', etc. |
| status | status | TEXT | 'ativo' → 'active', 'inativo' → 'inactive', 'transferido' → 'transferred' |
| entrou_em | joined_at | TIMESTAMPTZ | Join timestamp |
| saiu_em | left_at | TIMESTAMPTZ | Nullable |
| criado_por_user_id | added_by_user_id | UUID | User who added |
| convertido_de_visitante_id | converted_from_visitor_id | UUID | Nullable |
| anotacoes | notes | TEXT | Nullable |
| created_at | created_at | TIMESTAMPTZ | ✅ |
| updated_at | updated_at | TIMESTAMPTZ | ✅ |
| deleted_at | deleted_at | TIMESTAMPTZ | ✅ |

### Table: visitantes → visitors

| Portuguese | English | Type | Notes |
|------------|---------|------|-------|
| pessoa_id | person_id | UUID | FK to people |
| gc_id | gc_id | UUID | GC context |
| status | status | TEXT | 'ativo', 'convertido', 'inativo' |
| total_visitas | visit_count | INT | Visit counter |
| primeira_visita_em | first_visit_date | TIMESTAMPTZ | Timestamp |
| ultima_visita_em | last_visit_date | TIMESTAMPTZ | Nullable |
| convertido_em | converted_at | TIMESTAMPTZ | Nullable |
| convertido_por_user_id | converted_by_user_id | UUID | Nullable |
| convertido_para_participante_id | converted_to_participant_id | UUID | Nullable |
| created_at | created_at | TIMESTAMPTZ | ✅ |
| updated_at | updated_at | TIMESTAMPTZ | ✅ |

### Table: series_licoes → lesson_series

| Portuguese | English | Type | Notes |
|------------|---------|------|-------|
| nome | name | TEXT | Series title |
| descricao | description | TEXT | Description |
| criado_por_user_id | created_by_user_id | UUID | Owner |
| created_at | created_at | TIMESTAMPTZ | ✅ |
| updated_at | updated_at | TIMESTAMPTZ | ✅ |

### Table: licoes → lessons

| Portuguese | English | Type | Notes |
|------------|---------|------|-------|
| titulo | title | TEXT | Lesson title |
| descricao | description | TEXT | Summary |
| serie_id | series_id | UUID | FK to lesson_series |
| link | link | TEXT | Optional external resource |
| ordem_na_serie | order_in_series | INT | Order |
| criado_por_user_id | created_by_user_id | UUID | Author |
| created_at | created_at | TIMESTAMPTZ | ✅ |
| updated_at | updated_at | TIMESTAMPTZ | ✅ |

### Table: reunioes → meetings

| Portuguese | English | Type | Notes |
|------------|---------|------|-------|
| gc_id | gc_id | UUID | ✅ |
| licao_modelo_id | lesson_template_id | UUID | Nullable FK to lessons |
| titulo_licao | lesson_title | TEXT | Required, can override template |
| data_hora | datetime | TIMESTAMPTZ | Meeting timestamp |
| comentarios | comments | TEXT | Optional notes |
| registrado_por_user_id | registered_by_user_id | UUID | User who logged meeting |
| created_at | created_at | TIMESTAMPTZ | ✅ |
| updated_at | updated_at | TIMESTAMPTZ | ✅ |
| deleted_at | deleted_at | TIMESTAMPTZ | Nullable soft delete |

### Table: presenca_membros → meeting_member_attendance

| Portuguese | English | Type | Notes |
|------------|---------|------|-------|
| reuniao_id | meeting_id | UUID | FK to meetings |
| participante_id | participant_id | UUID | FK to growth_group_participants |
| created_at | created_at | TIMESTAMPTZ | ✅ |

### Table: presenca_visitantes → meeting_visitor_attendance

| Portuguese | English | Type | Notes |
|------------|---------|------|-------|
| reuniao_id | meeting_id | UUID | FK to meetings |
| visitante_id | visitor_id | UUID | FK to visitors |
| created_at | created_at | TIMESTAMPTZ | ✅ |

### Table: eventos_conversao_visitantes → visitor_conversion_events

| Portuguese | English | Type | Notes |
|------------|---------|------|-------|
| visitante_id | visitor_id | UUID | FK to visitors |
| participante_id | participant_id | UUID | FK to growth_group_participants |
| pessoa_id | person_id | UUID | Redundant FK for convenience |
| gc_id | gc_id | UUID | GC context |
| convertido_em | converted_at | TIMESTAMPTZ | Timestamp |
| convertido_por_user_id | converted_by_user_id | UUID | Nullable |
| origem_conversao | conversion_source | TEXT | 'auto' / 'manual' |
| notas | notes | TEXT | Optional |
| created_at | created_at | TIMESTAMPTZ | ✅ |

### Table: configuracoes → config

| Portuguese | English | Type | Notes |
|------------|---------|------|-------|
| chave | key | TEXT | Config key |
| valor | value | JSONB | Config value |
| descricao | description | TEXT | Optional |
| updated_at | updated_at | TIMESTAMPTZ | ✅ |

## View Names

| Portuguese | English | Notes |
|------------|---------|-------|
| dashboard_metricas | dashboard_metrics | GC metrics view |
| user_gc_roles | user_gc_roles | Aggregated GC roles per user |

## View Columns: dashboard_metricas → dashboard_metrics

| Portuguese | English | Notes |
|------------|---------|-------|
| gc_nome | gc_name | Growth group name |
| reunioes_mes_atual | meetings_current_month | Count |
| media_presenca_30d | average_attendance | Rounded average |
| membros_ativos | total_active_members | Count |
| novos_membros_30d | new_members_30d | Count |
| conversoes_30d | conversions_30d | Count |
| visitantes_unicos_30d | unique_visitors_30d | Count |
| taxa_conversao_pct | conversion_rate_pct | Percentage |

## View Columns: user_gc_roles

| Portuguese | English | Notes |
|------------|---------|-------|
| nome | name | User name |
| email | email | ✅ |
| is_leader | is_leader | ✅ |
| is_supervisor | is_supervisor | ✅ |
| is_coordinator | is_coordinator | ✅ |
| is_admin | is_admin | ✅ |
| total_gcs_liderados | gcs_led | Count |
| total_gcs_supervisionados | gcs_supervised | Count |
| total_subordinados | direct_subordinates | Count |

## Function Names

| Portuguese | English | Notes |
|------------|---------|-------|
| atualizar_timestamp() | update_timestamp() | Trigger helper |
| atualizar_caminho_hierarquia() | update_hierarchy_path() | Hierarchy trigger |
| converter_visitante_automaticamente() | auto_convert_visitor() | Visitor conversion trigger |

## Constraint Examples

| Portuguese | English | Notes |
|------------|---------|-------|
| participante_membro_unico | uq_growth_group_participants_active_membership | Unique active membership |
| gc_precisa_lider | ensure_gc_has_leader | Trigger to keep a leader |
| gc_precisa_supervisor | ensure_gc_has_supervisor | Trigger to keep a supervisor |
| visitante_unico_por_gc | visitors_person_id_gc_unique | Unique visitor per GC |
