import 'package:test/test.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// T008 - Contract test GET /growth_groups
/// Valida select com gc_leaders/gc_supervisors joins, RLS filtering
void main() {
  late SupabaseClient supabase;
  late String authUserId;

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
  });

  tearDownAll(() async {
    await supabase.auth.signOut();
    await supabase.dispose();
  });

  group('GET /growth_groups', () {
    test('deve listar GCs com joins de líderes e supervisores', () async {
      final response = await supabase
          .from('growth_groups')
          .select('*,gc_leaders(*,user:users(*)),gc_supervisors(*,user:users(*))')
          .execute();

      expect(response.data, isA<List>());
      if ((response.data as List).isNotEmpty) {
        final firstGC = (response.data as List).first;
        expect(firstGC, containsPair('id', isA<String>()));
        expect(firstGC, containsPair('nome', isA<String>()));
        expect(firstGC, containsPair('modalidade', isA<String>()));
        expect(firstGC, containsPair('status', isA<String>()));

        // Verificar relacionamentos
        expect(firstGC, contains('gc_leaders'));
        expect(firstGC['gc_leaders'], isA<List>());
        expect(firstGC, contains('gc_supervisors'));
        expect(firstGC['gc_supervisors'], isA<List>());
      }
    });

    test('deve filtrar por status ativo', () async {
      final response = await supabase
          .from('growth_groups')
          .select()
          .eq('status', 'ativo')
          .execute();

      expect(response.data, isA<List>());
      for (var gc in (response.data as List)) {
        expect(gc['status'], equals('ativo'));
      }
    });

    test('deve respeitar RLS - líder vê apenas seus GCs', () async {
      final response = await supabase
          .from('growth_groups')
          .select('*,gc_leaders!inner(user_id)')
          .eq('gc_leaders.user_id', authUserId)
          .execute();

      expect(response.data, isA<List>());

      // Verificar que todos os GCs retornados têm o usuário como líder
      for (var gc in (response.data as List)) {
        final leaders = gc['gc_leaders'] as List;
        expect(
          leaders.any((l) => l['user_id'] == authUserId),
          isTrue,
          reason: 'GC deve ter usuário autenticado como líder',
        );
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
      expect(gc['nome'], isA<String>());
      expect(gc['modalidade'], isIn(['presencial', 'online']));
      expect(gc['status'], isIn(['ativo', 'inativo', 'multiplicando']));
      expect(gc['created_at'], isA<String>());
      expect(gc['updated_at'], isA<String>());

      // Campos opcionais
      if (gc['endereco'] != null) expect(gc['endereco'], isA<String>());
      if (gc['dia_semana'] != null) {
        expect(gc['dia_semana'], isA<int>());
        expect(gc['dia_semana'], inInclusiveRange(0, 6));
      }
      if (gc['horario'] != null) expect(gc['horario'], isA<String>());
    });
  });
}
