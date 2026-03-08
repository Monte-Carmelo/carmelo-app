# Débitos Técnicos

Inventário central de débitos técnicos ativos do projeto.

## Como usar

- Registre aqui débitos técnicos duráveis e ainda abertos.
- Use `memory-bank/decisionLog.md` para explicar a decisão e o racional.
- Use docs específicas (`docs/supabase.md`, `docs/web.md`, etc.) apenas para contextualizar localmente e apontar para este inventário.
- Quando um débito for resolvido, remova ou marque claramente como encerrado.

## Formato recomendado

- `ID`
- `Título`
- `Área`
- `Status`
- `Impacto`
- `Contexto`
- `Próximo passo`

## Abertos

### TD-001 - Nome legado para a chave pública do Supabase

- Área: `web`, `deploy`, `supabase`
- Status: aberto
- Impacto: médio
- Contexto:
  - O projeto ainda usa `NEXT_PUBLIC_SUPABASE_ANON_KEY` como nome de variável de ambiente pública.
  - O Supabase atual usa conceitualmente `publishable key`, e a chave recebida no deploy é `sb_publishable_...`.
  - Hoje isso funciona tecnicamente, mas o nome induz confusão operacional e aumenta risco de configuração incorreta.
- Próximo passo:
  - aceitar `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` no código
  - manter compatibilidade temporária com `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - migrar documentação e exemplos
  - remover o nome antigo após janela de transição
