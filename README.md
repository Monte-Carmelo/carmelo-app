# Carmelo App – Guia de Execução

Este repositório combina a aplicação web (`web/`) e a infraestrutura Supabase (`supabase/`). O guia abaixo descreve os passos mínimos para levantar o ambiente local, popular dados de teste e executar a interface.

## Pré-requisitos
- Node.js 20+ e npm 10+
- Docker em execução
- Supabase CLI 1.200+ (`brew install supabase/tap/supabase` ou consulte a [documentação](https://supabase.com/docs/guides/cli/getting-started))
- Playwright (opcional para E2E) – será instalado automaticamente via `npx playwright install`

## 1. Preparar variáveis de ambiente
```bash
cd web
cp .env.example .env.local
```
Preencha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` com as credenciais do Supabase local (veja o terminal após `supabase start`).

## 2. Instalar dependências da aplicação
```bash
cd web
npm install
```

## 3. Subir o Supabase local
Na raiz do projeto:
```bash
supabase start
```
- A primeira execução cria os containers e mostra as portas (API: `http://127.0.0.1:54321`, Studio: `http://127.0.0.1:54323`).
- Sempre que quiser um banco limpo, rode `supabase db reset` para reaplicar migrations e `supabase/seed.sql`.

> Após `supabase start`, deixe os containers rodando em uma aba/terminal separada.

## 4. Criar usuários de autenticação (Auth)
O seed SQL preenche as tabelas, mas as credenciais de login do Supabase Auth precisam ser criadas via script:
```bash
cd web
npx tsx scripts/seed-auth-users.ts
```
O script é idempotente: pode ser executado sempre que você resetar o banco.

## 5. Executar a aplicação web
```bash
cd web
npm run dev
```
Acesse `http://localhost:3000` (Next.js em modo desenvolvimento).

## 6. Executar testes E2E (opcional)
- Exporte as credenciais de login utilizadas pelos testes:
  ```bash
  export E2E_SUPABASE_EMAIL=lider1@test.com
  export E2E_SUPABASE_PASSWORD=senha123
  ```
- Em seguida:
  ```bash
  cd web
  npm run test:e2e
  ```
Para validar também o viewport mobile utilize `npm run test:e2e -- --project=chromium-mobile`.

## Usuários de teste
Todos os usuários compartilham a senha `senha123`. Após rodar o seed de Auth, você pode utilizar:

| Email                     | Nome               | Papel principal                                       |
|---------------------------|--------------------|-------------------------------------------------------|
| `lider1@test.com`         | João Líder         | Líder do `GC Esperança`                               |
| `lider2@test.com`         | Ana Co-Líder       | Co-líder; lidera `GC Amor`                            |
| `supervisor1@test.com`    | Maria Supervisora  | Supervisora do `GC Esperança`                         |
| `supervisor2@test.com`    | Carlos Supervisor  | Supervisor adicional (mesmo GC)                       |
| `coordenador1@test.com`   | Pedro Coordenador  | Coordenador responsável pela supervisão dos líderes   |
| `admin@test.com`          | Admin Sistema      | Administrador (flag `is_admin = true`)                |

Os perfis estão associados a pessoas e grupos na tabela `growth_group_participants`, garantindo que as políticas RLS reflitam a atuação de cada usuário.

## Outras referências
- Detalhes dos scripts e comandos front-end: `web/README.md`
- Migrations e seeds do banco: `supabase/migrations/` e `supabase/seed.sql`
- Especificações funcionais: `specs/`

Para interromper o ambiente local, utilize `supabase stop`. Se quiser remover containers/imagens, rode `supabase stop --destroy`.

