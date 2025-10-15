# Contract Tests

Contract tests validam os esquemas de API e RLS policies do Supabase.

## Pré-requisitos

1. Supabase local rodando: `supabase start`
2. Migrations aplicadas: `supabase db reset`
3. Seed data carregado
4. Variáveis de ambiente configuradas:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`

## Executar testes

```bash
# Todos os contract tests
dart test tests/contract/

# Test específico
dart test tests/contract/test_auth_signup.dart
```

## Status

- ✅ T006: test_auth_signup.dart (POST /auth/signup)
- ✅ T007: test_auth_login.dart (POST /auth/login) 
- ✅ T008: test_grupos_list.dart (GET /growth_groups)
- ✅ T009: test_grupos_create.dart (POST /growth_groups)
- ⏳ T010-T018: Pending implementation

## Notas

- **RLS**: SELECT retorna array vazio (não 403) quando bloqueado
- **TDD**: Testes foram escritos ANTES da implementação do app Flutter
- **Papéis de GC**: líderes, co-líderes, supervisores e membros vivem em `growth_group_participants`
