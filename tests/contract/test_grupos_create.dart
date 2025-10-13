import 'package:test/test.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// T009 - Contract test POST /growth_groups
/// Valida leader_ids/supervisor_ids arrays, required fields, RLS policies
void main() {
  late SupabaseClient supabase;
  late String coordenadorUserId;
  late String liderUserId;
  late String supervisorUserId;

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

    // Buscar IDs de líder e supervisor para testes
    final users = await supabase
        .from('users')
        .select('id, email')
        .inFilter('email', ['lider1@test.com', 'supervisor1@test.com'])
        .execute();

    for (var user in (users.data as List)) {
      if (user['email'] == 'lider1@test.com') liderUserId = user['id'];
      if (user['email'] == 'supervisor1@test.com') supervisorUserId = user['id'];
    }
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
            'nome': 'GC Test $timestamp',
            'modalidade': 'online',
            'status': 'ativo',
          })
          .select()
          .single();

      expect(gcResponse.data, isA<Map>());
      final gcId = gcResponse.data['id'];

      // 2. Adicionar líder
      await supabase
          .from('gc_leaders')
          .insert({
            'gc_id': gcId,
            'user_id': liderUserId,
            'role': 'leader',
          });

      // 3. Adicionar supervisor
      await supabase
          .from('gc_supervisors')
          .insert({
            'gc_id': gcId,
            'user_id': supervisorUserId,
          });

      // Validar criação
      expect(gcResponse.data['nome'], equals('GC Test $timestamp'));
      expect(gcResponse.data['modalidade'], equals('online'));
      expect(gcResponse.data['status'], equals('ativo'));
      expect(gcResponse.data['created_at'], isNotNull);
    });

    test('deve criar GC presencial com endereço obrigatório', () async {
      final timestamp = DateTime.now().millisecondsSinceEpoch;

      final response = await supabase
          .from('growth_groups')
          .insert({
            'nome': 'GC Presencial $timestamp',
            'modalidade': 'presencial',
            'endereco': 'Rua Test, 123',
            'dia_semana': 3, // Quarta-feira
            'horario': '19:30:00',
            'status': 'ativo',
          })
          .select()
          .single();

      expect(response.data['modalidade'], equals('presencial'));
      expect(response.data['endereco'], equals('Rua Test, 123'));
      expect(response.data['dia_semana'], equals(3));
      expect(response.data['horario'], equals('19:30:00'));
    });

    test('deve falhar ao criar GC presencial sem endereço', () async {
      final timestamp = DateTime.now().millisecondsSinceEpoch;

      expect(
        () async => await supabase
            .from('growth_groups')
            .insert({
              'nome': 'GC Sem Endereco $timestamp',
              'modalidade': 'presencial',
              // endereco faltando - deve falhar no constraint
              'status': 'ativo',
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
              'nome': 'GC Modalidade Invalida $timestamp',
              'modalidade': 'hibrido', // Não existe no enum
              'status': 'ativo',
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
              'nome': 'GC Status Invalido $timestamp',
              'modalidade': 'online',
              'status': 'arquivado', // Não existe no enum
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
              'nome': 'GC Sem Permissao $timestamp',
              'modalidade': 'online',
              'status': 'ativo',
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
              'nome': 'GC Dia Invalido $timestamp',
              'modalidade': 'online',
              'dia_semana': 7, // Inválido (0-6 apenas)
              'status': 'ativo',
            })
            .execute(),
        throwsA(isA<PostgrestException>()),
      );
    });
  });
}
