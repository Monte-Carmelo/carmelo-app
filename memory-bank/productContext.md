# Product Context

This file provides a high-level overview of the project and the expected product that will be created. Initially it is based upon projectBrief.md (if provided) and all other available project-related information in the working directory. This file is intended to be updated as the project evolves, and should be used to inform all other modes of the project's goals and context.
2025-10-20 15:39:47 - Log of updates made will be appended as footnotes to the end of this file.

*

## Project Goal

* Criar uma plataforma integrada para gestão de comunidades e igrejas, com foco em grupos de crescimento, eventos e administração de membros.

## Key Features

* Sistema de gestão de pessoas e hierarquia
* Grupos de crescimento (GC) e relacionamentos
* Sistema de reuniões e controle de presença
* Área administrativa completa
* Sistema de eventos com administração e visualização pública
* Dashboard para líderes
* Sistema de visitantes e conversão
* Integração com Supabase para autenticação e banco de dados
* Interface responsiva e acessível

## Overall Architecture

* Aplicação web desenvolvida com Next.js para o front-end
* Supabase como backend-as-a-service, incluindo autenticação, banco de dados e políticas RLS
* Estrutura modular com separação clara entre camadas de infraestrutura, validações, ações e componentes
* Banco de dados PostgreSQL gerenciado pelo Supabase, com suporte a migrations e seeds
* Padrões de design responsivo para garantir acessibilidade em dispositivos móveis e desktops
[2025-10-20 17:41] - Adicionada funcionalidade de eventos ao produto