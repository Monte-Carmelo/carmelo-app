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

### Exemplo de Teste (TypeScript + supabase-js)

```ts
import { beforeAll, describe, expect, it } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
);

describe('POST /growth_groups', () => {
  beforeAll(async () => {
    await supabase.auth.signInWithPassword({
      email: 'coordinator@test.com',
      password: 'senha123',
    });
  });

  it('cria GC com schema válido', async () => {
    const payload = {
      name: 'GC Test Contract',
      mode: 'online',
      status: 'active',
    };

    const { data, error } = await supabase
      .from('growth_groups')
      .insert(payload)
      .select()
      .single();

    expect(error).toBeNull();
    expect(data?.id).toBeTypeOf('string');
    expect(data?.name).toBe('GC Test Contract');
    expect(data?.mode).toBe('online');
    expect(data?.status).toBe('active');
    expect(data?.created_at).toBeTruthy();
  });

  it('presencial sem address retorna erro', async () => {
    const payload = {
      name: 'GC Inválido',
      mode: 'in_person',
      status: 'active',
    };

    const { error } = await supabase.from('growth_groups').insert(payload);
    expect(error).not.toBeNull();
  });
});
```

## Notas

- Todos os contratos assumem colunas **em inglês**, conforme migrations padronizadas (vide `TRANSLATION_MAP.md`).
- O campo `select` deve ser mantido alinhado ao schema atual (ex.: `growth_group_participants`, `meeting_member_attendance`).
- Atualize este README sempre que novos contratos forem criados ou descontinuados.
