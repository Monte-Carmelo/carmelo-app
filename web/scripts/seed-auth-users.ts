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
    person_id: '11111111-0000-0000-0000-000000000001',
  },
  {
    email: 'lider2@test.com',
    password: 'senha123',
    name: 'Ana Co-Líder',
    user_id: '10000000-0000-0000-0000-000000000002',
    person_id: '11111111-0000-0000-0000-000000000002',
  },
  {
    email: 'supervisor1@test.com',
    password: 'senha123',
    name: 'Maria Supervisora',
    user_id: '20000000-0000-0000-0000-000000000001',
    person_id: '11111111-0000-0000-0000-000000000003',
  },
  {
    email: 'supervisor2@test.com',
    password: 'senha123',
    name: 'Carlos Supervisor',
    user_id: '20000000-0000-0000-0000-000000000002',
    person_id: '11111111-0000-0000-0000-000000000004',
  },
  {
    email: 'coordenador1@test.com',
    password: 'senha123',
    name: 'Pedro Coordenador',
    user_id: '30000000-0000-0000-0000-000000000001',
    person_id: '11111111-0000-0000-0000-000000000005',
  },
  {
    email: 'admin@test.com',
    password: 'senha123',
    name: 'Admin Sistema',
    user_id: '90000000-0000-0000-0000-000000000001',
    person_id: '11111111-0000-0000-0000-000000000006',
  },
];

async function seedAuthUsers() {
  console.log('🌱 Criando usuários de autenticação no Supabase...\n');

  for (const user of testUsers) {
    try {
      // Tentar criar usuário via Admin API
      const { data, error } = await supabase.auth.admin.createUser({
        id: user.user_id,
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
          console.error(`❌ ${user.email} - Erro: ${error.message}`, error);
        }
      } else {
        console.log(`✅ ${user.email} - Criado (auth.id: ${data.user?.id})`);
      }
    } catch (err) {
      console.error(`❌ ${user.email} - Exceção:`, err);
    }
  }

  console.log('\n🔗 Criando usuários na tabela users e relacionamentos...');
  await createUsersAndRelationships();

  console.log('\n✨ Seed completo concluído!\n');
  console.log('📋 Credenciais de teste:');
  console.log('   Email: lider1@test.com | Senha: senha123');
  console.log('   Email: supervisor1@test.com | Senha: senha123');
  console.log('   Email: admin@test.com | Senha: senha123');
  console.log('\n🔗 Supabase Studio: http://127.0.0.1:54323');
}

async function createUsersAndRelationships() {
  // Criar usuários na tabela users
  for (const user of testUsers) {
    try {
      const { error } = await supabase
        .from('users')
        .upsert({
          id: user.user_id,
          person_id: user.person_id,
          is_admin: user.email === 'admin@test.com',
        }, { onConflict: 'id' });

      if (error) {
        console.error(`❌ Erro ao criar user ${user.email}:`, error);
      } else {
        console.log(`✅ User criado: ${user.email}`);
      }
    } catch (err) {
      console.error(`❌ Exceção ao criar user ${user.email}:`, err);
    }
  }

  // Criar growth_group_participants (relacionamentos)
  const participants = [
    // Leaders & co-leaders
    { id: '50000000-0000-0000-0000-000000000101', gc_id: '40000000-0000-0000-0000-000000000001', person_id: '11111111-0000-0000-0000-000000000001', role: 'leader', user_id: '10000000-0000-0000-0000-000000000001' },
    { id: '50000000-0000-0000-0000-000000000102', gc_id: '40000000-0000-0000-0000-000000000001', person_id: '11111111-0000-0000-0000-000000000002', role: 'co_leader', user_id: '10000000-0000-0000-0000-000000000002' },
    { id: '50000000-0000-0000-0000-000000000103', gc_id: '40000000-0000-0000-0000-000000000002', person_id: '11111111-0000-0000-0000-000000000001', role: 'leader', user_id: '10000000-0000-0000-0000-000000000001' },
    { id: '50000000-0000-0000-0000-000000000104', gc_id: '40000000-0000-0000-0000-000000000003', person_id: '11111111-0000-0000-0000-000000000002', role: 'leader', user_id: '10000000-0000-0000-0000-000000000002' },

    // Supervisors
    { id: '50000000-0000-0000-0000-000000000201', gc_id: '40000000-0000-0000-0000-000000000001', person_id: '11111111-0000-0000-0000-000000000003', role: 'supervisor', user_id: '20000000-0000-0000-0000-000000000001' },
    { id: '50000000-0000-0000-0000-000000000202', gc_id: '40000000-0000-0000-0000-000000000001', person_id: '11111111-0000-0000-0000-000000000004', role: 'supervisor', user_id: '20000000-0000-0000-0000-000000000002' },
    { id: '50000000-0000-0000-0000-000000000203', gc_id: '40000000-0000-0000-0000-000000000002', person_id: '11111111-0000-0000-0000-000000000003', role: 'supervisor', user_id: '20000000-0000-0000-0000-000000000001' },
    { id: '50000000-0000-0000-0000-000000000204', gc_id: '40000000-0000-0000-0000-000000000003', person_id: '11111111-0000-0000-0000-000000000004', role: 'supervisor', user_id: '20000000-0000-0000-0000-000000000002' },
    { id: '50000000-0000-0000-0000-000000000205', gc_id: '40000000-0000-0000-0000-000000000001', person_id: '11111111-0000-0000-0000-000000000005', role: 'supervisor', user_id: '30000000-0000-0000-0000-000000000001' },
    { id: '50000000-0000-0000-0000-000000000206', gc_id: '40000000-0000-0000-0000-000000000002', person_id: '11111111-0000-0000-0000-000000000005', role: 'supervisor', user_id: '30000000-0000-0000-0000-000000000001' },

    // Members
    { id: '50000000-0000-0000-0000-000000000301', gc_id: '40000000-0000-0000-0000-000000000001', person_id: '11111111-0000-0000-0000-000000000011', role: 'member', user_id: '10000000-0000-0000-0000-000000000001' },
    { id: '50000000-0000-0000-0000-000000000302', gc_id: '40000000-0000-0000-0000-000000000001', person_id: '11111111-0000-0000-0000-000000000012', role: 'member', user_id: '10000000-0000-0000-0000-000000000001' },
    { id: '50000000-0000-0000-0000-000000000303', gc_id: '40000000-0000-0000-0000-000000000001', person_id: '11111111-0000-0000-0000-000000000013', role: 'member', user_id: '10000000-0000-0000-0000-000000000001' },
    { id: '50000000-0000-0000-0000-000000000304', gc_id: '40000000-0000-0000-0000-000000000001', person_id: '11111111-0000-0000-0000-000000000014', role: 'member', user_id: '10000000-0000-0000-0000-000000000001' },
    { id: '50000000-0000-0000-0000-000000000305', gc_id: '40000000-0000-0000-0000-000000000001', person_id: '11111111-0000-0000-0000-000000000015', role: 'member', user_id: '10000000-0000-0000-0000-000000000001' },
    { id: '50000000-0000-0000-0000-000000000306', gc_id: '40000000-0000-0000-0000-000000000001', person_id: '11111111-0000-0000-0000-000000000016', role: 'member', user_id: '10000000-0000-0000-0000-000000000001' },

    { id: '50000000-0000-0000-0000-000000000401', gc_id: '40000000-0000-0000-0000-000000000002', person_id: '11111111-0000-0000-0000-000000000017', role: 'member', user_id: '10000000-0000-0000-0000-000000000001' },
    { id: '50000000-0000-0000-0000-000000000402', gc_id: '40000000-0000-0000-0000-000000000002', person_id: '11111111-0000-0000-0000-000000000018', role: 'member', user_id: '10000000-0000-0000-0000-000000000001' },

    { id: '50000000-0000-0000-0000-000000000501', gc_id: '40000000-0000-0000-0000-000000000003', person_id: '11111111-0000-0000-0000-000000000012', role: 'member', user_id: '20000000-0000-0000-0000-000000000001' },
    { id: '50000000-0000-0000-0000-000000000502', gc_id: '40000000-0000-0000-0000-000000000003', person_id: '11111111-0000-0000-0000-000000000013', role: 'member', user_id: '20000000-0000-0000-0000-000000000001' },
  ];

  for (const participant of participants) {
    try {
      const { error } = await supabase
        .from('growth_group_participants')
        .upsert({
          id: participant.id,
          gc_id: participant.gc_id,
          person_id: participant.person_id,
          role: participant.role,
          status: 'active',
          joined_at: new Date().toISOString(),
          added_by_user_id: '90000000-0000-0000-0000-000000000001',
        }, { onConflict: 'id' });

      if (error) {
        console.error(`❌ Erro ao criar participant:`, error);
      } else {
        console.log(`✅ Participant criado: ${participant.role} - ${participant.person_id}`);
      }
    } catch (err) {
      console.error(`❌ Exceção ao criar participant:`, err);
    }
  }

  // Criar lesson series e lessons básicas
  await createLessonsData();
}

async function createLessonsData() {
  try {
    // Criar lesson series
    const { error: seriesError } = await supabase
      .from('lesson_series')
      .upsert([
        {
          id: '60000000-0000-0000-0000-000000000001',
          name: 'Fundamentos da Fé',
          description: 'Série básica de lições para novos convertidos',
          created_by_user_id: '90000000-0000-0000-0000-000000000001',
        },
        {
          id: '60000000-0000-0000-0000-000000000002',
          name: 'Vida Cristã Prática',
          description: 'Lições sobre o dia a dia da vida cristã',
          created_by_user_id: '90000000-0000-0000-0000-000000000001',
        },
      ], { onConflict: 'id' });

    if (seriesError) {
      console.error('❌ Erro ao criar lesson series:', seriesError);
    } else {
      console.log('✅ Lesson series criadas');
    }

    // Criar lessons
    const { error: lessonsError } = await supabase
      .from('lessons')
      .upsert([
        {
          id: '70000000-0000-0000-0000-000000000001',
          title: 'Salvação em Cristo',
          description: 'Estudo sobre o plano da salvação...',
          series_id: '60000000-0000-0000-0000-000000000001',
          order_in_series: 1,
          created_by_user_id: '90000000-0000-0000-0000-000000000001',
        },
        {
          id: '70000000-0000-0000-0000-000000000002',
          title: 'Oração e Comunhão',
          description: 'Como desenvolver uma vida de oração...',
          series_id: '60000000-0000-0000-0000-000000000001',
          order_in_series: 2,
          created_by_user_id: '90000000-0000-0000-0000-000000000001',
        },
        {
          id: '70000000-0000-0000-0000-000000000003',
          title: 'Fruto do Espírito',
          description: 'Estudo sobre Gálatas 5:22-23...',
          series_id: '60000000-0000-0000-0000-000000000002',
          order_in_series: 1,
          created_by_user_id: '90000000-0000-0000-0000-000000000001',
        },
      ], { onConflict: 'id' });

    if (lessonsError) {
      console.error('❌ Erro ao criar lessons:', lessonsError);
    } else {
      console.log('✅ Lessons criadas');
    }

    // Criar meetings de exemplo
    const { error: meetingsError } = await supabase
      .from('meetings')
      .upsert([
        {
          id: '90000000-0000-0000-0000-000000000101',
          gc_id: '40000000-0000-0000-0000-000000000001',
          lesson_template_id: '70000000-0000-0000-0000-000000000001',
          lesson_title: 'Salvação em Cristo',
          datetime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          registered_by_user_id: '10000000-0000-0000-0000-000000000001',
        },
        {
          id: '90000000-0000-0000-0000-000000000102',
          gc_id: '40000000-0000-0000-0000-000000000001',
          lesson_template_id: '70000000-0000-0000-0000-000000000002',
          lesson_title: 'Oração e Comunhão',
          datetime: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          registered_by_user_id: '10000000-0000-0000-0000-000000000001',
        },
      ], { onConflict: 'id' });

    if (meetingsError) {
      console.error('❌ Erro ao criar meetings:', meetingsError);
    } else {
      console.log('✅ Meetings criados');
    }
  } catch (err) {
    console.error('❌ Exceção ao criar lessons data:', err);
  }
}

seedAuthUsers().catch(console.error);
