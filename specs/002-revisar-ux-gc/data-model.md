# Modelo de Dados: Gestão de GCs

O modelo de dados para a gestão de Grupos de Crescimento (GCs), reuniões e presenças já está bem estabelecido no banco de dados Supabase. A revisão da UX se concentrará em como esses dados são apresentados e manipulados na interface, não em grandes alterações no esquema.

## Entidades Principais

### `growth_groups`
Representa um Grupo de Crescimento.
- `id`: UUID - Identificador único do GC.
- `name`: TEXT - Nome do GC.
- `mode`: TEXT - Modo da reunião (`in_person`, `online`, `hybrid`).
- `address`: TEXT - Endereço (se presencial).
- `weekday`: INT - Dia da semana da reunião (0-6).
- `time`: TIME - Horário da reunião.
- `status`: TEXT - Status do GC (`active`, `inactive`, `multiplying`).

### `growth_group_participants`
Associa pessoas a GCs com papéis específicos (líder, membro, etc.).
- `id`: UUID - Identificador único da participação.
- `person_id`: UUID - ID da pessoa (da tabela `people`).
- `gc_id`: UUID - ID do GC.
- `role`: TEXT - Papel da pessoa no GC (`leader`, `co_leader`, `member`, `supervisor`).
- `status`: TEXT - Status da participação (`active`, `inactive`).

### `meetings`
Representa uma reunião de um GC.
- `id`: UUID - Identificador único da reunião.
- `gc_id`: UUID - ID do GC ao qual a reunião pertence.
- `lesson_title`: TEXT - Título da lição ou tema da reunião.
- `datetime`: TIMESTAMPTZ - Data e hora da reunião.
- `comments`: TEXT - Comentários ou observações.

### `meeting_member_attendance`
Registra a presença de um membro em uma reunião.
- `meeting_id`: UUID - ID da reunião.
- `participant_id`: UUID - ID do participante (da tabela `growth_group_participants`).

### `visitors`
Registra informações sobre visitantes de um GC.
- `id`: UUID - Identificador único do visitante.
- `person_id`: UUID - ID da pessoa (da tabela `people`).
- `gc_id`: UUID - ID do GC que o visitante frequentou.
- `visit_count`: INT - Número de visitas.
- `status`: TEXT - Status do visitante (`active`, `converted`, `inactive`).

### `meeting_visitor_attendance`
Registra a presença de um visitante em uma reunião.
- `meeting_id`: UUID - ID da reunião.
- `visitor_id`: UUID - ID do visitante (da tabela `visitors`).

## Relacionamentos
- Um `growth_group` pode ter vários `growth_group_participants`.
- Um `growth_group` pode ter várias `meetings`.
- Uma `meeting` pode ter vários `meeting_member_attendance` (presenças de membros).
- Uma `meeting` pode ter vários `meeting_visitor_attendance` (presenças de visitantes).
- Um `visitor` está associado a um `growth_group` e a uma `person`.
