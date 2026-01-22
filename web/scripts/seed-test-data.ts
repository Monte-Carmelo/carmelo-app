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

const gcSeeds = [
  { id: '40000000-0000-0000-0000-000000000011', name: 'GC Esperança', mode: 'in_person', address: 'Rua Teste 123', weekday: 3, time: '19:30', status: 'active' },
  { id: '40000000-0000-0000-0000-000000000012', name: 'GC Fé', mode: 'online', status: 'active' },
  { id: '40000000-0000-0000-0000-000000000013', name: 'GC Amor', mode: 'in_person', address: 'Av. Principal 456', weekday: 5, time: '20:00', status: 'active' },
];

const participantSeeds = [
  { id: '50000000-0000-0000-0000-000000001101', gc_id: gcSeeds[0].id, person_id: testUsers[0].person_id, role: 'leader', status: 'active' },
  { id: '50000000-0000-0000-0000-000000001102', gc_id: gcSeeds[2].id, person_id: testUsers[0].person_id, role: 'leader', status: 'active' },
  { id: '50000000-0000-0000-0000-000000001201', gc_id: gcSeeds[0].id, person_id: testUsers[1].person_id, role: 'supervisor', status: 'active' },
  { id: '50000000-0000-0000-0000-000000001202', gc_id: gcSeeds[0].id, person_id: testUsers[2].person_id, role: 'supervisor', status: 'active' },
  { id: '50000000-0000-0000-0000-000000001203', gc_id: gcSeeds[1].id, person_id: testUsers[1].person_id, role: 'supervisor', status: 'active' },
  { id: '50000000-0000-0000-0000-000000001204', gc_id: gcSeeds[2].id, person_id: testUsers[2].person_id, role: 'supervisor', status: 'active' },
  { id: '50000000-0000-0000-0000-000000001205', gc_id: gcSeeds[0].id, person_id: testUsers[3].person_id, role: 'supervisor', status: 'active' },
  { id: '50000000-0000-0000-0000-000000001206', gc_id: gcSeeds[1].id, person_id: testUsers[3].person_id, role: 'supervisor', status: 'active' },
];

const meetingSeeds = [
  {
    id: '90000000-0000-0000-0000-000000001101',
    gc_id: gcSeeds[0].id,
    lesson_title: 'O que é um GC? (Semana 1)',
    datetime: new Date().toISOString(),
    registered_by_user_id: testUsers[0].user_id,
  },
  {
    id: '90000000-0000-0000-0000-000000001102',
    gc_id: gcSeeds[1].id,
    lesson_title: 'Celebração Especial da Fé',
    datetime: new Date().toISOString(),
    registered_by_user_id: testUsers[0].user_id,
  },
];

const visitorPeopleSeeds = [
  { id: '11111111-0000-0000-0000-000000000021', name: 'João Visitante', email: 'joao.v@test.com' },
  { id: '11111111-0000-0000-0000-000000000022', name: 'Maria Visitante', email: 'maria.v@test.com' },
];

const visitorSeeds = [
  { id: '80000000-0000-0000-0000-000000001101', person_id: visitorPeopleSeeds[0].id, gc_id: gcSeeds[0].id, visit_count: 1, status: 'active' },
  { id: '80000000-0000-0000-0000-000000001102', person_id: visitorPeopleSeeds[1].id, gc_id: gcSeeds[1].id, visit_count: 0, status: 'active' },
];

async function seedTestData() {
  console.log('🌱 Iniciando o seed de dados de teste...\n');

  // 1. Criar usuários de autenticação
  for (const user of testUsers) {
    try {
      const { data: existingUser, error: existingError } = await supabase.auth.admin.getUserById(user.user_id);
      if (existingError) {
        console.error(`❌ Erro ao buscar usuário existente ${user.email}: ${existingError.message}`);
      }
      if (!existingUser?.user) {
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
        }
      } else {
        console.log(`⏭️  Usuário de autenticação já existe: ${user.email}`);
      }
    } catch (error) {
      console.error(`❌ Erro ao criar usuário de autenticação ${user.email}:`, error);
    }
  }

  const { error: peopleError } = await supabase
    .from('people')
    .upsert(
      testUsers.map((user) => ({
        id: user.person_id,
        name: user.name,
        email: user.email,
      })),
      { onConflict: 'id' }
    );

  if (peopleError) {
    console.error(`❌ Erro ao criar pessoas: ${peopleError.message}`);
  } else {
    console.log('✅ Pessoas criadas/atualizadas');
  }

  const { error: usersError } = await supabase
    .from('users')
    .upsert(
      testUsers.map((user) => ({
        id: user.user_id,
        person_id: user.person_id,
        is_admin: user.is_admin || false,
      })),
      { onConflict: 'id' }
    );

  if (usersError) {
    console.error(`❌ Erro ao criar usuários em public.users: ${usersError.message}`);
  } else {
    console.log('✅ Usuários criados/atualizados em public.users');
  }

  // 4. Create GCs
  const { data: gcs, error: gcsError } = await supabase
    .from('growth_groups')
    .upsert(gcSeeds, { onConflict: 'id' })
    .select();

  if (gcsError || !gcs) {
    console.error(`❌ Erro ao criar GCs: ${gcsError?.message || 'GCs não foram criados'}`);
    return;
  } else {
    console.log(`✅ GCs criados/atualizados:`, gcs);
  }

  // 5. Create GC participants
  const { data: participants, error: participantsError } = await supabase
    .from('growth_group_participants')
    .upsert(
      participantSeeds.map((participant) => ({
        id: participant.id,
        gc_id: participant.gc_id,
        person_id: participant.person_id,
        role: participant.role,
        status: participant.status,
        joined_at: new Date().toISOString(),
        added_by_user_id: testUsers[4].user_id,
      })),
      { onConflict: 'gc_id,person_id,role' }
    )
    .select();

  if (participantsError) {
    console.error(`❌ Erro ao criar participantes de GCs: ${participantsError.message}`);
  } else {
    console.log(`✅ Participantes de GCs criados/atualizados:`, participants);
  }

  // 6. Create Meetings
  const { data: meetings, error: meetingsError } = await supabase
    .from('meetings')
    .upsert(meetingSeeds, { onConflict: 'id' })
    .select();

  if (meetingsError || !meetings) {
    console.error(`❌ Erro ao criar reuniões: ${meetingsError?.message || 'Reuniões não foram criadas'}`);
    return;
  } else {
    console.log(`✅ Reuniões criadas/atualizadas:`, meetings);
  }

  // 7. Create Visitor People
  const { data: visitorPeople, error: visitorPeopleError } = await supabase
    .from('people')
    .upsert(visitorPeopleSeeds, { onConflict: 'id' })
    .select();

  if (visitorPeopleError) {
    console.error(`❌ Erro ao criar pessoas dos visitantes: ${visitorPeopleError.message}`);
  } else {
    console.log(`✅ Pessoas dos visitantes criadas/atualizadas:`, visitorPeople);
  }

  // 8. Create Visitors
  const { data: visitors, error: visitorsError } = await supabase
    .from('visitors')
    .upsert(visitorSeeds, { onConflict: 'id' })
    .select();

  if (visitorsError) {
    console.error(`❌ Erro ao criar visitantes: ${visitorsError.message}`);
  } else {
    console.log(`✅ Visitantes criados/atualizados:`, visitors);
  }

  // 9. Create Attendance Records
  if (meetings && participants && visitors) {
    const { error: memberAttendanceError } = await supabase
      .from('meeting_member_attendance')
      .upsert(
        [
          { meeting_id: meetings[0].id, participant_id: participants[0].id },
          { meeting_id: meetings[0].id, participant_id: participants[1].id },
          { meeting_id: meetings[1].id, participant_id: participants[2].id },
        ],
        { onConflict: 'meeting_id,participant_id' }
      );

    if (memberAttendanceError) {
      console.error(`❌ Erro ao criar presença de membros: ${memberAttendanceError.message}`);
    } else {
      console.log(`✅ Presença de membros criada/atualizada.`);
    }

    const { error: visitorAttendanceError } = await supabase
      .from('meeting_visitor_attendance')
      .upsert(
        [{ meeting_id: meetings[1].id, visitor_id: visitors[0].id }],
        { onConflict: 'meeting_id,visitor_id' }
      );

    if (visitorAttendanceError) {
      console.error(`❌ Erro ao criar presença de visitantes: ${visitorAttendanceError.message}`);
    } else {
      console.log(`✅ Presença de visitantes criada/atualizada.`);
    }
  }
  console.log('\n✨ Seed de dados de teste concluído!\n');
}

seedTestData().catch(console.error);
