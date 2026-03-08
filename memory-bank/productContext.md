# Product Context

## Purpose

Carmelo App e uma plataforma de gestao de igreja com foco em operacao de grupos de crescimento, acompanhamento de pessoas e administracao interna.

## Core Capabilities

- gestao de GCs
- gestao de pessoas, participantes, lideres e supervisores
- registro de reunioes e presenca
- acompanhamento de visitantes e conversao
- catalogo de licoes e series
- administracao de eventos
- area administrativa com usuarios, relatorios e configuracoes

## Primary Runtime

O runtime principal ativo do projeto e:
- `web/` com Next.js App Router
- `supabase/` para banco, auth, migrations e seeds

O contexto Flutter presente em partes do repositorio e historico. Nao trate `app/` como a superficie principal de trabalho sem evidencia explicita na tarefa.

## Domain Notes

- uma pessoa base vive em `people`
- relacionamento com GC vive em `growth_group_participants`
- um GC pode ter multiplos lideres e multiplos supervisores
- `co_leader` nao existe mais como papel valido
- visitantes e participantes compartilham a base `people`
- papeis sao derivados de relacionamentos e hierarquia, nao de um campo unico

## Auth and Data Access

- autenticacao via Supabase Auth
- autorizacao combinando RLS, relacionamentos e flag `is_admin`
- no web, fluxos criticos de escrita devem preferir API routes autenticadas ou server actions apropriadas

## Reference Docs

- `docs/onboarding.md`
- `docs/web.md`
- `docs/supabase.md`
- `specs/001-crie-um-app/data-model.md`
