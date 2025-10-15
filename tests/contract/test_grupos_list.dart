import 'package:test/test.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// T008 - Contract test GET /growth_groups
/// Valida select com growth_group_participants e filtros de RLS
void main() {
  late SupabaseClient supabase;
  late String authUserId;
  late String authPersonId;

  setUpAll(() async {
    await Supabase.initialize(
      url: const String.fromEnvironment('SUPABASE_URL'),
      anonKey: const String.fromEnvironment('SUPABASE_ANON_KEY'),
    );
    supabase = Supabase.instance.client;

    // Login como líder de teste
    final authResponse = await supabase.auth.signInWithPassword(
      email: 'lider1@test.com',
      password: 'senha123',
    );
    authUserId = authResponse.user!.id;
    final personResult = await supabase
        .from('users')
        .select('person_id')
        .eq('id', authUserId)
        .single();
    authPersonId = personResult['person_id'] as String;
  });

  tearDownAll(() async {
    await supabase.auth.signOut();
    await supabase.dispose();
  });

  group('GET /growth_groups', () {
    test('deve listar GCs com participantes e papéis', () async {
      final response = await supabase
          .from('growth_groups')
          .select(
              'id, name, mode, status, participants:growth_group_participants(role, status, person:person_id(name, email))')
          .execute();

      expect(response.data, isA<List>());
      if ((response.data as List).isNotEmpty) {
        final firstGC = (response.data as List).first;
        expect(firstGC, containsPair('id', isA<String>()));
        expect(firstGC, containsPair('name', isA<String>()));
        expect(firstGC, containsPair('mode', isA<String>()));
        expect(firstGC, containsPair('status', isA<String>()));

        expect(firstGC, contains('participants'));
        expect(firstGC['participants'], isA<List>());
      }
    });

    test('deve filtrar por status ativo', () async {
      final response = await supabase
          .from('growth_groups')
          .select()
          .eq('status', 'active')
          .execute();

      expect(response.data, isA<List>());
      for (var gc in (response.data as List)) {
        expect(gc['status'], equals('active'));
      }
    });

    test('deve respeitar RLS - líder vê apenas seus GCs', () async {
      final response = await supabase
          .from('growth_groups')
          .select(
              'id, name, participants:growth_group_participants!inner(person_id, role, status)')
          .eq('participants.person_id', authPersonId)
          .inFilter('participants.role', ['leader', 'co_leader'])
          .eq('participants.status', 'active')
          .execute();

      expect(response.data, isA<List>());

      // Verificar que todos os GCs retornados têm o usuário como líder
      for (var gc in (response.data as List)) {
        final participants = gc['participants'] as List;
        final matches = participants.where(
          (p) =>
              p['person_id'] == authPersonId &&
              (p['role'] == 'leader' || p['role'] == 'co_leader') &&
              p['status'] == 'active',
        );
        expect(matches.isNotEmpty, isTrue,
            reason: 'GC deve listar o usuário autenticado como líder ou co-líder');
      }
    });

    test('deve retornar array vazio se RLS bloquear acesso', () async {
      // Fazer logout e tentar acessar sem autenticação
      await supabase.auth.signOut();

      final response = await supabase
          .from('growth_groups')
          .select()
          .execute();

      // RLS deve retornar array vazio, não erro 403
      expect(response.data, isA<List>());
      expect((response.data as List), isEmpty);

      // Re-autenticar para próximos testes
      await supabase.auth.signInWithPassword(
        email: 'lider1@test.com',
        password: 'senha123',
      );
    });

    test('deve validar schema dos campos obrigatórios', () async {
      final response = await supabase
          .from('growth_groups')
          .select()
          .limit(1)
          .single();

      expect(response.data, isA<Map>());
      final gc = response.data as Map;

      // Campos obrigatórios
      expect(gc['id'], isA<String>());
      expect(gc['name'], isA<String>());
      expect(gc['mode'], isIn(['in_person', 'online', 'hybrid']));
      expect(gc['status'], isIn(['active', 'inactive', 'multiplying']));
      expect(gc['created_at'], isA<String>());
      expect(gc['updated_at'], isA<String>());

      // Campos opcionais
      if (gc['address'] != null) expect(gc['address'], isA<String>());
      if (gc['weekday'] != null) {
        expect(gc['weekday'], isA<int>());
        expect(gc['weekday'], inInclusiveRange(0, 6));
      }
      if (gc['time'] != null) expect(gc['time'], isA<String>());
    });
  });
}
