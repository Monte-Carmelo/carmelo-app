# API Contracts - App de Gestão de GCs

Este diretório contém os contratos OpenAPI 3.0 para as APIs do sistema.

## Arquivos

- **auth.yaml**: Autenticação (signup, login, logout) via Supabase Auth
- **grupos.yaml**: CRUD de Grupos de Crescimento + listagem de membros
- **reunioes.yaml**: Registro de reuniões + lista de presença (membros e visitantes)

## Contratos Não Implementados (Menor Prioridade)

Os seguintes contratos serão implementados conforme necessário:

- **membros.yaml**: CRUD de membros (POST/PATCH/DELETE em `/members`)
- **licoes.yaml**: CRUD de lições e séries (admin only)
- **dashboards.yaml**: Endpoint GET `/dashboard_metricas` (view PostgreSQL)

## Como Usar

### Validação de Contratos

Os contract tests em `tests/contract/` devem validar:
1. **Schema da request**: Campos obrigatórios, tipos, formatos
2. **Schema da response**: Estrutura correta dos dados retornados
3. **RLS Policies**: Usuários sem permissão recebem 403/vazio
4. **Edge cases**: Duplicatas (409), not found (404), bad request (400)

### Exemplo de Test (Dart + Supabase)

```dart
// tests/contract/test_grupos_post.dart
import 'package:test/test.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

void main() {
  late SupabaseClient supabase;

  setUpAll(() async {
    supabase = await Supabase.initialize(/* ... */);
    // Authenticate como coordenador
    await supabase.auth.signInWithPassword(
      email: 'coordenador@test.com',
      password: 'senha123',
    );
  });

  test('POST /growth_groups cria GC com schema válido', () async {
    final payload = {
      'nome': 'GC Teste Contract',
      'modalidade': 'online',
      'lider_id': 'uuid-lider-teste',
      'supervisor_id': 'uuid-supervisor-teste',
    };

    final response = await supabase
        .from('growth_groups')
        .insert(payload)
        .select()
        .single();

    // Validar schema da response
    expect(response['id'], isA<String>());
    expect(response['nome'], equals('GC Teste Contract'));
    expect(response['modalidade'], equals('online'));
    expect(response['status'], equals('ativo')); // Default
    expect(response['created_at'], isNotNull);
  });

  test('POST /growth_groups presencial sem endereço retorna 400', () async {
    final payload = {
      'nome': 'GC Inválido',
      'modalidade': 'presencial',
      // Faltando 'endereco'
      'lider_id': 'uuid-lider',
      'supervisor_id': 'uuid-supervisor',
    };

    expect(
      () async => await supabase.from('growth_groups').insert(payload),
      throwsA(isA<PostgrestException>()),
    );
  });
}
```

## Notas de Implementação

### Supabase REST API
- Base URL: `https://your-project.supabase.co/rest/v1`
- Headers obrigatórios:
  - `apikey`: Anon key do projeto
  - `Authorization`: `Bearer {access_token}` (após login)
  - `Content-Type`: `application/json`

### Row Level Security (RLS)
Todos os endpoints respeitam RLS policies definidas no PostgreSQL:
- Líderes: Apenas seus GCs
- Supervisores: GCs de subordinados (via `hierarchy_path LIKE`)
- Admins: Acesso total

Se RLS bloquear, Supabase retorna:
- **SELECT**: Array vazio `[]` (não 403!)
- **INSERT/UPDATE/DELETE**: 403 Forbidden

### Triggers Automáticos
- **meeting_attendance** inserts acionam `auto_convert_visitor()`:
  - Incrementa `visitors.visit_count`
  - Se `visit_count >= threshold` (config), seta `converted_to_member_at`

## Validação Manual

Use Postman/Insomnia importando os YAMLs para validar manualmente durante desenvolvimento.

**Variáveis de ambiente**:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
ACCESS_TOKEN=<obtido via /auth/v1/token>
```
