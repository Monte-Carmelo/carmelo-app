#!/bin/bash

# Script completo para reset do banco com usuários
# Executa: supabase db reset + criação de usuários de autenticação

set -e

# Obter o diretório onde o script está localizado
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "🔄 Iniciando reset completo do banco de dados..."
echo "📁 Diretório do projeto: $PROJECT_ROOT"

# 1. Reset do banco Supabase (executa migrações e seed.sql)
echo "📦 Executando supabase db reset..."
cd "$PROJECT_ROOT"
supabase db reset

if [ $? -ne 0 ]; then
    echo "❌ Erro ao executar supabase db reset"
    exit 1
fi

echo "✅ Banco resetado com sucesso"

# 2. Criar usuários de autenticação
echo "👥 Criando usuários de autenticação..."
cd "$PROJECT_ROOT/web"
npx tsx scripts/seed-auth-users.ts

if [ $? -ne 0 ]; then
    echo "❌ Erro ao criar usuários de autenticação"
    exit 1
fi

echo "✅ Usuários criados com sucesso"

echo ""
echo "🎉 Reset completo concluído!"
echo ""
echo "📋 Credenciais de teste disponíveis:"
echo "   Email: lider1@test.com | Senha: senha123"
echo "   Email: supervisor1@test.com | Senha: senha123"
echo "   Email: admin@test.com | Senha: senha123"
echo ""
echo "🔗 Supabase Studio: http://127.0.0.1:54323"
