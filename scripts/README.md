# Scripts de Banco de Dados

Este diretório contém scripts para automatizar o processo de reset e seed do banco de dados do Carmelo App.

## Scripts Disponíveis

### 1. full-db-reset.sh
Script completo que executa o reset do banco e criação de usuários em um único comando.

```bash
./scripts/full-db-reset.sh
```

**O que faz:**
- Executa `supabase db reset` (roda migrações + seed.sql)
- Executa `npx tsx scripts/seed-auth-users.ts` (cria usuários de autenticação)
- Exibe credenciais de teste disponíveis

### 2. Scripts NPM (via package.json)

A partir do diretório `web/`, você pode usar:

```bash
# Reset completo (banco + usuários)
npm run db:full-reset

# Apenas reset do banco (sem usuários)
npm run db:reset

# Apenas criação de usuários (se o banco já estiver resetado)
npm run db:seed-users
```

## Fluxo de Funcionamento

### Por que precisamos de duas etapas?

1. **`supabase db reset`**
   - Executa migrações SQL
   - Roda `supabase/seed.sql` (dados básicos: people, growth_groups, visitors)
   - **NÃO** pode criar usuários em `auth.users` (tabela especial do Supabase)

2. **`seed-auth-users.ts`**
   - Usa Admin API do Supabase para criar usuários em `auth.users`
   - Cria registros correspondentes na tabela `users`
   - Cria relacionamentos e dados dependentes

### Estrutura de Dados

```
people (dados pessoais)
├── users (vínculo com auth.users)
├── growth_groups (grupos)
├── growth_group_participants (relacionamentos)
├── lessons, meetings, etc.
```

## Credenciais de Teste

Após executar o reset completo, as seguintes credenciais estarão disponíveis:

| Email | Senha | Tipo |
|-------|-------|------|
| lider1@test.com | senha123 | Líder de GC |
| supervisor1@test.com | senha123 | Supervisor |
| admin@test.com | senha123 | Administrador |

## Troubleshooting

### Problema: "Usuário já existe" ou "duplicate key value"
Se encontrar erros de usuários já existentes ou chaves duplicadas, é normal. O script trata esses casos e continua. Isso acontece quando:
- Usuários já existem no auth.users
- Pessoas já estão vinculadas a grupos
- O script foi executado mais de uma vez

**Erros esperados e seguros:**
- `duplicate key value violates unique constraint "uq_growth_group_participants_active_membership"`
- `already registered` (para usuários auth)

### Problema: Permissão negada
Certifique-se de que:
- O Supabase local está rodando (`supabase start`)
- As variáveis de ambiente estão configuradas
- Você tem permissão para executar scripts (`chmod +x scripts/full-db-reset.sh`)

### Problema: Portas em uso
Verifique se as portas 54321 (API) e 54323 (Studio) estão livres.

## Recomendações

- Use `npm run db:full-reset` para desenvolvimento diário
- Use `./scripts/full-db-reset.sh` para automação em CI/CD
- Sempre execute o reset completo antes de testes E2E
