-- Restaura os grants padrão da API Supabase para os papéis anon/authenticated/service_role.
--
-- Contexto: imagens recentes do Postgres local (Supabase CLI >= 2.1xx) não aplicam
-- mais DML (SELECT/INSERT/UPDATE/DELETE) por default privileges aos papéis da API,
-- quebrando ambiente local/CI (seed de usuários, contract tests e o próprio app).
-- Em produção estes grants já existem (criados sob defaults antigos) — aqui são
-- reafirmados de forma idempotente. O controle de acesso por linha continua sendo
-- feito exclusivamente via RLS, que permanece habilitado em todas as tabelas.

grant usage on schema public to anon, authenticated, service_role;

grant all privileges on all tables in schema public to service_role;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;

grant all on all sequences in schema public to anon, authenticated, service_role;
grant execute on all functions in schema public to anon, authenticated, service_role;

alter default privileges in schema public
  grant all on tables to service_role;
alter default privileges in schema public
  grant select, insert, update, delete on tables to anon, authenticated;
alter default privileges in schema public
  grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public
  grant execute on functions to anon, authenticated, service_role;
