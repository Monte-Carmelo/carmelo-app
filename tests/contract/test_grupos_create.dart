import 'package:test/test.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// T009 - Contract test POST /growth_groups
/// Valida leader_ids/supervisor_ids arrays, required fields, RLS policies
void main() {
  late SupabaseClient supabase;
  late String coordenadorUserId;
  late String coordenadorPersonId;
  late String liderUserId;
  late String liderPersonId;
  late String supervisorUserId;
  late String supervisorPersonId;

  Future<String> fetchPersonId(String userId) async {
    final result = await Supabase.instance.client
        .from('users')
        .select('person_id')
        .eq('id', userId)
        .single();

    return result['person_id'] as String;
  }

  setUpAll(() async {
    await Supabase.initialize(
      url: const String.fromEnvironment('SUPABASE_URL'),
      anonKey: const String.fromEnvironment('SUPABASE_ANON_KEY'),
    );
    supabase = Supabase.instance.client;

    // Login como coordenador (pode criar GCs)
    final authResponse = await supabase.auth.signInWithPassword(
      email: 'coordenador1@test.com',
      password: 'senha123',
    );
    coordenadorUserId = authResponse.user!.id;
    coordenadorPersonId = await fetchPersonId(coordenadorUserId);

    // Buscar IDs de líder e supervisor para testes
    final liderAuth = await supabase.auth.signInWithPassword(
      email: 'lider1@test.com',
      password: 'senha123',
    );
    liderUserId = liderAuth.user!.id;
    liderPersonId = await fetchPersonId(liderUserId);

    await supabase.auth.signOut();

    final supervisorAuth = await supabase.auth.signInWithPassword(
      email: 'supervisor1@test.com',
      password: 'senha123',
    );
    supervisorUserId = supervisorAuth.user!.id;
    supervisorPersonId = await fetchPersonId(supervisorUserId);

    await supabase.auth.signOut();

    // Reautenticar como coordenador para os testes
    await supabase.auth.signInWithPassword(
      email: 'coordenador1@test.com',
      password: 'senha123',
    );
  });

  tearDownAll() async {
    await supabase.auth.signOut();
    await supabase.dispose();
  });

  group('POST /growth_groups', () {
    test('deve criar GC com dados válidos e relacionamentos', () async {
      final timestamp = DateTime.now().millisecondsSinceEpoch;

      // 1. Criar o GC
      final gcResponse = await supabase
          .from('growth_groups')
          .insert({
            'name': 'GC Test $timestamp',
            'mode': 'online',
            'status': 'active',
          })
          .select()
          .single();

      expect(gcResponse.data, isA<Map>());
      final gcId = gcResponse.data['id'];

      // 2. Adicionar líder
      await supabase.from('growth_group_participants').insert({
        'gc_id': gcId,
        'person_id': liderPersonId,
        'role': 'leader',
        'status': 'active',
        'added_by_user_id': coordenadorUserId,
      });

      // 3. Adicionar supervisor
      await supabase.from('growth_group_participants').insert({
        'gc_id': gcId,
        'person_id': supervisorPersonId,
        'role': 'supervisor',
        'status': 'active',
        'added_by_user_id': coordenadorUserId,
      });

      // Validar criação
      expect(gcResponse.data['name'], equals('GC Test $timestamp'));
      expect(gcResponse.data['mode'], equals('online'));
      expect(gcResponse.data['status'], equals('active'));
      expect(gcResponse.data['created_at'], isNotNull);
    });

    test('deve criar GC presencial com endereço obrigatório', () async {
      final timestamp = DateTime.now().millisecondsSinceEpoch;

      final response = await supabase
          .from('growth_groups')
          .insert({
            'name': 'GC Presencial $timestamp',
            'mode': 'in_person',
            'address': 'Rua Test, 123',
            'weekday': 3, // Quarta-feira
            'time': '19:30:00',
            'status': 'active',
          })
          .select()
          .single();

      expect(response.data['mode'], equals('in_person'));
      expect(response.data['address'], equals('Rua Test, 123'));
      expect(response.data['weekday'], equals(3));
      expect(response.data['time'], equals('19:30:00'));
    });

    test('deve falhar ao criar GC presencial sem endereço', () async {
      final timestamp = DateTime.now().millisecondsSinceEpoch;

      expect(
        () async => await supabase
            .from('growth_groups')
            .insert({
              'name': 'GC Sem Endereco $timestamp',
              'mode': 'in_person',
              // address faltando - deve falhar no constraint
              'status': 'active',
            })
            .execute(),
        throwsA(isA<PostgrestException>()),
      );
    });

    test('deve validar modalidade enum', () async {
      final timestamp = DateTime.now().millisecondsSinceEpoch;

      expect(
        () async => await supabase
            .from('growth_groups')
            .insert({
              'name': 'GC Modalidade Invalida $timestamp',
              'mode': 'invalid', // Não existe no enum
              'status': 'active',
            })
            .execute(),
        throwsA(isA<PostgrestException>()),
      );
    });

    test('deve validar status enum', () async {
      final timestamp = DateTime.now().millisecondsSinceEpoch;

      expect(
        () async => await supabase
            .from('growth_groups')
            .insert({
              'name': 'GC Status Invalido $timestamp',
              'mode': 'online',
              'status': 'archived', // Não existe no enum
            })
            .execute(),
        throwsA(isA<PostgrestException>()),
      );
    });

    test('deve retornar 403 se usuário não tiver permissão RLS', () async {
      // Login como líder simples (não coordenador)
      await supabase.auth.signOut();
      await supabase.auth.signInWithPassword(
        email: 'lider1@test.com',
        password: 'senha123',
      );

      final timestamp = DateTime.now().millisecondsSinceEpoch;

      expect(
        () async => await supabase
            .from('growth_groups')
            .insert({
              'name': 'GC Sem Permissao $timestamp',
              'mode': 'online',
              'status': 'active',
            })
            .execute(),
        throwsA(isA<PostgrestException>()),
      );

      // Reautenticar como coordenador
      await supabase.auth.signOut();
      await supabase.auth.signInWithPassword(
        email: 'coordenador1@test.com',
        password: 'senha123',
      );
    });

    test('deve validar dia_semana entre 0-6', () async {
      final timestamp = DateTime.now().millisecondsSinceEpoch;

      expect(
        () async => await supabase
            .from('growth_groups')
            .insert({
              'name': 'GC Dia Invalido $timestamp',
              'mode': 'online',
              'weekday': 7, // Inválido (0-6 apenas)
              'status': 'active',
            })
            .execute(),
        throwsA(isA<PostgrestException>()),
      );
    });
  });
}
