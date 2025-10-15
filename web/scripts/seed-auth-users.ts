/**
 * Script para criar usuários de autenticação no Supabase local
 *
 * Cria usuários correspondentes aos seeds em supabase/seed.sql
 * para permitir testes E2E com autenticação real.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const testUsers = [
  {
    email: 'lider1@test.com',
    password: 'senha123',
    name: 'João Líder',
    user_id: '10000000-0000-0000-0000-000000000001',
  },
  {
    email: 'lider2@test.com',
    password: 'senha123',
    name: 'Ana Co-Líder',
    user_id: '10000000-0000-0000-0000-000000000002',
  },
  {
    email: 'supervisor1@test.com',
    password: 'senha123',
    name: 'Maria Supervisora',
    user_id: '20000000-0000-0000-0000-000000000001',
  },
  {
    email: 'supervisor2@test.com',
    password: 'senha123',
    name: 'Carlos Supervisor',
    user_id: '20000000-0000-0000-0000-000000000002',
  },
  {
    email: 'coordenador1@test.com',
    password: 'senha123',
    name: 'Pedro Coordenador',
    user_id: '30000000-0000-0000-0000-000000000001',
  },
  {
    email: 'admin@test.com',
    password: 'senha123',
    name: 'Admin Sistema',
    user_id: '90000000-0000-0000-0000-000000000001',
  },
];

async function seedAuthUsers() {
  console.log('🌱 Criando usuários de autenticação no Supabase...\n');

  for (const user of testUsers) {
    try {
      // Tentar criar usuário via Admin API
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true, // Auto-confirmar email
        user_metadata: {
          name: user.name,
        },
      });

      if (error) {
        if (error.message.includes('already registered')) {
          console.log(`⏭️  ${user.email} - Já existe`);
        } else {
          console.error(`❌ ${user.email} - Erro: ${error.message}`);
        }
      } else {
        console.log(`✅ ${user.email} - Criado (auth.id: ${data.user?.id})`);
      }
    } catch (err) {
      console.error(`❌ ${user.email} - Exceção:`, err);
    }
  }

  console.log('\n✨ Seed de auth users concluído!\n');
  console.log('📋 Credenciais de teste:');
  console.log('   Email: lider1@test.com | Senha: senha123');
  console.log('   Email: supervisor1@test.com | Senha: senha123');
  console.log('   Email: admin@test.com | Senha: senha123');
  console.log('\n🔗 Supabase Studio: http://127.0.0.1:54323');
}

seedAuthUsers().catch(console.error);
