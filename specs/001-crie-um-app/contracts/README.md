# API Contracts - App de Gestão de GCs

Este diretório contém os contratos OpenAPI 3.0 das APIs expostas via Supabase (PostgREST).

## Arquivos

- **auth.yaml**: Autenticação (signup/login/logout) via Supabase Auth
- **grupos.yaml**: CRUD de Grupos de Crescimento + participantes agregados por papel
- **gc_relationships.yaml**: Gestão direta de `growth_group_participants` (leader/co_leader/supervisor/member)
- **reunioes.yaml**: Registro de reuniões + presenças (membros e visitantes)

## Contratos Não Implementados (Baixa prioridade)

- **lessons.yaml**: CRUD de lições e séries (admin only)
- **dashboards.yaml**: Endpoint GET `/dashboard_metrics` (view PostgreSQL)

## Como Usar

### Validação de Contratos

Os contract tests em `tests/contract/` devem validar:
1. **Schema da request**: Campos obrigatórios, tipos, formatos
2. **Schema da response**: Estrutura correta (incluindo joins `select=...`)
3. **RLS Policies**: Usuários sem permissão recebem 403/vazio
4. **Edge cases**: Duplicatas (409), not found (404), bad request (400)

### Exemplo de Teste (Dart + Supabase)

```dart
// tests/contract/test_grupos_post.dart
import 'package:test/test.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

void main() {
  late SupabaseClient supabase;

  setUpAll(() async {
    await Supabase.initialize(
      url: const String.fromEnvironment('SUPABASE_URL'),
      anonKey: const String.fromEnvironment('SUPABASE_ANON_KEY'),
    );
    supabase = Supabase.instance.client;

    await supabase.auth.signInWithPassword(
      email: 'coordinator@test.com',
      password: 'senha123',
    );
  });

  test('POST /growth_groups cria GC com schema válido', () async {
    final payload = {
      'name': 'GC Test Contract',
      'mode': 'online',
      'status': 'active',
    };

    final response = await supabase
        .from('growth_groups')
        .insert(payload)
        .select()
        .single();

    expect(response['id'], isA<String>());
    expect(response['name'], equals('GC Test Contract'));
    expect(response['mode'], equals('online'));
    expect(response['status'], equals('active'));
    expect(response['created_at'], isNotNull);
  });

  test('POST /growth_groups presencial sem address retorna 400', () async {
    final payload = {
      'name': 'GC Inválido',
      'mode': 'in_person',
      'status': 'active',
    };

    expect(
      () async => await supabase.from('growth_groups').insert(payload),
      throwsA(isA<PostgrestException>()),
    );
  });
}
```

## Notas

- Todos os contratos assumem colunas **em inglês**, conforme migrations padronizadas (vide `TRANSLATION_MAP.md`).
- O campo `select` deve ser mantido alinhado ao schema atual (ex.: `growth_group_participants`, `meeting_member_attendance`).
- Atualize este README sempre que novos contratos forem criados ou descontinuados.
