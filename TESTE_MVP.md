# 🧪 Guia de Teste do MVP - App de Gestão de GCs

**Data**: 2025-10-04
**Objetivo**: Validar que o MVP básico está funcional

## 📋 Pré-requisitos

- [ ] Flutter SDK instalado (3.0+)
- [ ] Docker instalado (para Supabase local)
- [ ] Supabase CLI instalado: `brew install supabase/tap/supabase`
- [ ] Editor (VS Code ou Android Studio)

## 🚀 Passo 1: Instalar Dependências Flutter

```bash
cd /Users/rafael/dev/carmelo-app/app

# Instalar dependências
flutter pub get

# Verificar que não há erros
flutter analyze
```

**Resultado esperado**:
- ✅ Packages instalados com sucesso
- ⚠️ Pode ter alguns warnings (normal para código em desenvolvimento)

---

## 🗄️ Passo 2: Configurar Supabase Local

```bash
cd /Users/rafael/dev/carmelo-app

# Verificar se Supabase está configurado
ls -la supabase/

# Iniciar Supabase local (primeira vez pode demorar)
supabase start

# Aguardar até ver:
# API URL: http://localhost:54321
# anon key: eyJh...
```

**Anotar as credenciais**:
```bash
# Exemplo de output:
API URL: http://localhost:54321
anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🔧 Passo 3: Aplicar Migrations e Seed Data

```bash
cd /Users/rafael/dev/carmelo-app

# Aplicar todas as migrations (cria tabelas, triggers, RLS)
supabase db reset

# Verificar que migrations foram aplicadas
supabase db diff

# Resultado esperado: "No schema changes detected"
```

### Verificar Schema no Supabase Studio

```bash
# Abrir Supabase Studio no navegador
open http://localhost:54323
```

**Validar que existem:**
- ✅ Tabela `users` (com hierarquia)
- ✅ Tabela `growth_groups`
- ✅ Tabelas `gc_leaders`, `gc_supervisors`
- ✅ Tabelas `members`, `visitors`
- ✅ Tabelas `meetings`, `meeting_member_attendance`, `meeting_visitor_attendance`
- ✅ Tabelas `lessons`, `lesson_series`
- ✅ View `dashboard_metricas`

---

## 📝 Passo 4: Criar Dados de Teste (Seed Manual)

Como o seed.sql pode não estar completo, vamos criar dados via SQL manualmente:

```sql
-- Abrir SQL Editor no Supabase Studio (http://localhost:54323)

-- 1. Criar usuário de teste (IMPORTANTE: usa Supabase Auth)
-- Via Dashboard > Authentication > Add User:
--   Email: lider1@test.com
--   Password: senha123
--   Confirm: senha123

-- Após criar via dashboard, pegar o UUID do user criado e inserir na tabela users:
INSERT INTO users (id, email, nome, hierarchy_depth, is_admin)
VALUES
  ('UUID_DO_USER_CRIADO', 'lider1@test.com', 'João Líder', 0, false);

-- 2. Criar um GC de teste
INSERT INTO growth_groups (id, nome, modalidade, status)
VALUES
  (gen_random_uuid(), 'GC Esperança', 'online', 'ativo');

-- Pegar o UUID do GC criado para próximos inserts
-- Ex: '123e4567-e89b-12d3-a456-426614174000'

-- 3. Adicionar líder ao GC
INSERT INTO gc_leaders (gc_id, user_id, role)
VALUES
  ('UUID_DO_GC', 'UUID_DO_USER', 'leader');

-- 4. Adicionar supervisor (pode ser o mesmo user para teste)
INSERT INTO gc_supervisors (gc_id, user_id)
VALUES
  ('UUID_DO_GC', 'UUID_DO_USER');

-- 5. Criar membros de teste
INSERT INTO members (nome, email, gc_id, status)
VALUES
  ('Ana Silva', 'ana@test.com', 'UUID_DO_GC', 'ativo'),
  ('Carlos Santos', 'carlos@test.com', 'UUID_DO_GC', 'ativo'),
  ('Beatriz Lima', 'beatriz@test.com', 'UUID_DO_GC', 'ativo');
```

**Alternativa Simplificada - Script SQL Completo:**

Salvar em `/Users/rafael/dev/carmelo-app/supabase/seed_test.sql`:

```sql
-- Seed data para teste
-- IMPORTANTE: Substituir 'USER_UUID' pelo UUID do user criado via Auth dashboard

DO $$
DECLARE
  user_id UUID := 'COLAR_UUID_AQUI'; -- SUBSTITUIR!
  gc_id UUID := gen_random_uuid();
BEGIN
  -- Inserir user na tabela users
  INSERT INTO users (id, email, nome, hierarchy_depth, is_admin)
  VALUES (user_id, 'lider1@test.com', 'João Líder', 0, false)
  ON CONFLICT (id) DO NOTHING;

  -- Criar GC
  INSERT INTO growth_groups (id, nome, modalidade, status)
  VALUES (gc_id, 'GC Esperança', 'online', 'ativo');

  -- Adicionar líder
  INSERT INTO gc_leaders (gc_id, user_id, role)
  VALUES (gc_id, user_id, 'leader');

  -- Adicionar supervisor
  INSERT INTO gc_supervisors (gc_id, user_id)
  VALUES (gc_id, user_id);

  -- Criar membros
  INSERT INTO members (nome, email, gc_id, status)
  VALUES
    ('Ana Silva', 'ana@test.com', gc_id, 'ativo'),
    ('Carlos Santos', 'carlos@test.com', gc_id, 'ativo'),
    ('Beatriz Lima', 'beatriz@test.com', gc_id, 'ativo');

  RAISE NOTICE 'Seed data criado! GC ID: %', gc_id;
END $$;
```

Executar:
```bash
# Copiar e colar no SQL Editor do Supabase Studio
# Ou via CLI:
supabase db execute --file supabase/seed_test.sql
```

---

## 📱 Passo 5: Executar o App Flutter

### Opção A: Via Terminal

```bash
cd /Users/rafael/dev/carmelo-app/app

# Executar com variáveis de ambiente
flutter run \
  --dart-define=SUPABASE_URL=http://localhost:54321 \
  --dart-define=SUPABASE_ANON_KEY="COLAR_ANON_KEY_AQUI"

# Escolher dispositivo (emulador iOS/Android ou Chrome)
# Digitar o número do dispositivo desejado
```

### Opção B: Via VS Code

1. Abrir `/Users/rafael/dev/carmelo-app/app` no VS Code
2. Criar arquivo `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Flutter (Local Supabase)",
      "type": "dart",
      "request": "launch",
      "program": "lib/main.dart",
      "args": [
        "--dart-define=SUPABASE_URL=http://localhost:54321",
        "--dart-define=SUPABASE_ANON_KEY=COLAR_ANON_KEY_AQUI"
      ]
    }
  ]
}
```

3. Pressionar `F5` ou clicar em "Run and Debug"

---

## ✅ Passo 6: Testar Fluxo Básico

### Teste 1: Login (Tela Inicial)

1. **App abre na tela de Login**
   - [ ] Formulário com campos Email e Senha visíveis
   - [ ] Botão "Entrar" visível
   - [ ] Link "Não tem conta? Cadastre-se" visível

2. **Tentar login com credenciais erradas**
   ```
   Email: teste@errado.com
   Senha: errada123
   ```
   - [ ] Deve mostrar erro em vermelho

3. **Login com credenciais corretas**
   ```
   Email: lider1@test.com
   Senha: senha123
   ```
   - [ ] Loading aparece no botão
   - [ ] Redireciona para HomeScreen
   - [ ] AppBar mostra "Olá, João Líder"

### Teste 2: Home - Lista de GCs

1. **HomeScreen carrega**
   - [ ] Loading aparece ("Carregando grupos...")
   - [ ] Lista de GCs aparece
   - [ ] GCCard exibe "GC Esperança"
   - [ ] Card mostra ícone de "online" (videocam)
   - [ ] Status badge "ATIVO" em verde
   - [ ] Chip com "Membros: 3"

2. **Pull-to-refresh**
   - [ ] Arrastar lista para baixo
   - [ ] Loading aparece
   - [ ] Lista recarrega

3. **Logout**
   - [ ] Tocar ícone de logout (canto superior direito)
   - [ ] Redireciona para LoginScreen

### Teste 3: Navegação (Parcial - DetailScreen não implementada)

1. **Tocar em "GC Esperança"**
   - [ ] Navega para tela placeholder
   - [ ] Mostra "GC ID: [uuid]"
   - [ ] Botão voltar funciona

---

## 🐛 Troubleshooting

### Erro: "Target of URI doesn't exist"
**Causa**: Dependências não instaladas
**Solução**:
```bash
cd app/
flutter pub get
flutter clean
flutter pub get
```

### Erro: "Connection refused" ou "Failed to connect to Supabase"
**Causa**: Supabase local não está rodando
**Solução**:
```bash
supabase status  # Verificar se está rodando
supabase start   # Iniciar se necessário
```

### Erro: "Invalid login credentials"
**Causa**: User não foi criado no Supabase Auth
**Solução**:
1. Abrir http://localhost:54323
2. Authentication > Users > Add User
3. Email: lider1@test.com, Password: senha123
4. Pegar UUID do user criado
5. Inserir na tabela `users` via SQL

### App abre mas mostra "Nenhum grupo encontrado"
**Causa**: Seed data não foi carregado ou RLS está bloqueando
**Solução**:
1. Verificar no Supabase Studio se `growth_groups` tem registros
2. Verificar se `gc_leaders` tem relação user <-> GC
3. Executar query de teste:
```sql
-- Como o user logado
SELECT * FROM growth_groups;
-- Deve retornar o GC Esperança
```

### Widget tests/Contract tests com erros
**Causa**: Normal - TDD, testes escritos antes da implementação
**Solução**: Ignorar por enquanto (ou rodar `flutter pub get` para resolver imports)

---

## 📊 Checklist de Validação MVP

### Backend (Supabase)
- [ ] Supabase local rodando (`supabase status`)
- [ ] Migrations aplicadas (11 tabelas criadas)
- [ ] Triggers funcionando (hierarchy_path auto-popula)
- [ ] RLS policies ativas (líder só vê seus GCs)
- [ ] User criado via Auth dashboard
- [ ] Seed data inserido (1 GC, 3 membros)

### Frontend (Flutter)
- [ ] App compila sem erros (`flutter run`)
- [ ] LoginScreen renderiza corretamente
- [ ] Login funciona (redireciona para Home)
- [ ] HomeScreen lista GCs do usuário
- [ ] GCCard exibe dados corretos
- [ ] Logout funciona (volta para Login)
- [ ] Pull-to-refresh recarrega dados
- [ ] Navegação básica funciona

### Funcionalidades Testadas
- ✅ Autenticação (login/logout)
- ✅ RLS (usuário só vê GCs permitidos)
- ✅ Lista de GCs com UI responsiva
- ✅ State management (Riverpod providers)
- ✅ Navegação entre telas
- ⏳ Cadastro (SignupScreen não implementada)
- ⏳ Detalhes do GC (GrupoDetailScreen não implementada)
- ⏳ Registro de reunião (não implementado)

---

## 🎯 Próximos Passos Após Validação

Se todos os testes acima passarem, o MVP básico está funcional!

**Para completar o MVP mínimo**, implementar:

1. **SignupScreen** - Permitir cadastro de novos usuários
2. **GrupoDetailScreen** - Ver membros, reuniões, líderes/supervisores
3. **MeetingRegistrationScreen** - Registrar reunião com presenças

**Comando para continuar**:
```bash
/implement "Complete MVP: SignupScreen, GrupoDetailScreen, MeetingRegistrationScreen"
```

---

**Status**: Guia de teste completo. Seguir os 6 passos para validar o MVP.
