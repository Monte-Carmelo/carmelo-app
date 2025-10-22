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
    is_admin: true,
  },
];

async function seedTestData() {
  console.log('🌱 Iniciando o seed de dados de teste...\n');

  // 1. Criar usuários de autenticação
  for (const user of testUsers) {
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      id: user.user_id,
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: {
        name: user.name,
      },
    });

    if (authError) {
      console.error(`❌ Erro ao criar usuário de autenticação ${user.email}: ${authError.message}`);
    } else {
      console.log(`✅ Usuário de autenticação criado: ${authUser.user.email}`);

      // 2. Criar entrada na tabela people
      const { error: personError } = await supabase.from('people').insert({
        id: user.person_id,
        name: user.name,
        email: user.email,
      });

      if (personError) {
        console.error(`❌ Erro ao criar pessoa para ${user.email}: ${personError.message}`);
      } else {
        console.log(`✅ Pessoa criada: ${user.name}`);

        // 3. Criar entrada na tabela users
        const { data: userData, error: userError } = await supabase.from('users').insert({
          id: user.user_id,
          person_id: user.person_id,
          is_admin: user.is_admin || false,
        }).select();

        if (userError) {
          console.error(`❌ Erro ao criar usuário em public.users para ${user.email}: ${userError.message}`);
        } else {
          console.log(`✅ Usuário criado em public.users: ${user.email}`, userData);
        }
      }
    }
  }

  // TODO: Adicionar criação de GCs, participantes, reuniões, etc.

  // 4. Create GCs
  const { data: gcs, error: gcsError } = await supabase.from('growth_groups').insert([
    { name: 'GC Esperança', mode: 'in_person', address: 'Rua Teste 123', weekday: 3, time: '19:30', status: 'active' },
    { name: 'GC Fé', mode: 'online', status: 'active' },
    { name: 'GC Amor', mode: 'in_person', address: 'Av. Principal 456', weekday: 5, time: '20:00', status: 'active' },
  ]).select();

  if (gcsError || !gcs) {
    console.error(`❌ Erro ao criar GCs: ${gcsError?.message || 'GCs não foram criados'}`);
    return;
  } else {
    console.log(`✅ GCs criados:`, gcs);
  }

  // 5. Create GC participants
  const { data: participants, error: participantsError } = await supabase.from('growth_group_participants').insert([
    { gc_id: gcs[0].id, person_id: testUsers[0].person_id, role: 'leader', status: 'active' },
    { gc_id: gcs[2].id, person_id: testUsers[0].person_id, role: 'leader', status: 'active' },
    { gc_id: gcs[0].id, person_id: testUsers[1].person_id, role: 'supervisor', status: 'active' },
    { gc_id: gcs[0].id, person_id: testUsers[2].person_id, role: 'supervisor', status: 'active' },
    { gc_id: gcs[1].id, person_id: testUsers[1].person_id, role: 'supervisor', status: 'active' },
    { gc_id: gcs[2].id, person_id: testUsers[2].person_id, role: 'supervisor', status: 'active' },
    { gc_id: gcs[0].id, person_id: testUsers[3].person_id, role: 'supervisor', status: 'active' },
    { gc_id: gcs[1].id, person_id: testUsers[3].person_id, role: 'supervisor', status: 'active' },
  ]).select();

  if (participantsError) {
    console.error(`❌ Erro ao criar participantes de GCs: ${participantsError.message}`);
  } else {
    console.log(`✅ Participantes de GCs criados:`, participants);
  }

  // 6. Create Meetings
  const { data: meetings, error: meetingsError } = await supabase.from('meetings').insert([
    { gc_id: gcs[0].id, lesson_title: 'O que é um GC? (Semana 1)', datetime: new Date().toISOString(), registered_by_user_id: testUsers[0].user_id },
    { gc_id: gcs[1].id, lesson_title: 'Celebração Especial da Fé', datetime: new Date().toISOString(), registered_by_user_id: testUsers[0].user_id },
  ]).select();

  if (meetingsError || !meetings) {
    console.error(`❌ Erro ao criar reuniões: ${meetingsError?.message || 'Reuniões não foram criadas'}`);
    return;
  } else {
    console.log(`✅ Reuniões criadas:`, meetings);
  }

  // 7. Create Visitor People
  const { data: visitorPeople, error: visitorPeopleError } = await supabase.from('people').insert([
    { id: '11111111-0000-0000-0000-000000000021', name: 'João Visitante', email: 'joao.v@test.com' },
    { id: '11111111-0000-0000-0000-000000000022', name: 'Maria Visitante', email: 'maria.v@test.com' },
  ]).select();

  if (visitorPeopleError) {
    console.error(`❌ Erro ao criar pessoas dos visitantes: ${visitorPeopleError.message}`);
  } else {
    console.log(`✅ Pessoas dos visitantes criadas:`, visitorPeople);
  }

  // 8. Create Visitors
  const { data: visitors, error: visitorsError } = await supabase.from('visitors').insert([
    { person_id: '11111111-0000-0000-0000-000000000021', gc_id: gcs[0].id, visit_count: 1, status: 'active' },
    { person_id: '11111111-0000-0000-0000-000000000022', gc_id: gcs[1].id, visit_count: 0, status: 'active' },
  ]).select();

  if (visitorsError) {
    console.error(`❌ Erro ao criar visitantes: ${visitorsError.message}`);
  } else {
    console.log(`✅ Visitantes criados:`, visitors);
  }

  // 9. Create Attendance Records
  if (meetings && participants && visitors) {
    const { error: memberAttendanceError } = await supabase.from('meeting_member_attendance').insert([
      { meeting_id: meetings[0].id, participant_id: participants[0].id },
      { meeting_id: meetings[0].id, participant_id: participants[1].id },
      { meeting_id: meetings[1].id, participant_id: participants[2].id },
    ]);

    if (memberAttendanceError) {
      console.error(`❌ Erro ao criar presença de membros: ${memberAttendanceError.message}`);
    } else {
      console.log(`✅ Presença de membros criada.`);
    }

    const { error: visitorAttendanceError } = await supabase.from('meeting_visitor_attendance').insert([
      { meeting_id: meetings[1].id, visitor_id: visitors[0].id },
    ]);

    if (visitorAttendanceError) {
      console.error(`❌ Erro ao criar presença de visitantes: ${visitorAttendanceError.message}`);
    } else {
      console.log(`✅ Presença de visitantes criada.`);
    }
  }
  console.log('\n✨ Seed de dados de teste concluído!\n');
}

seedTestData().catch(console.error);
