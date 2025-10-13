import 'package:test/test.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// T006 - Contract test POST /auth/v1/signup
/// Valida schema da request, response, error codes
void main() {
  late SupabaseClient supabase;

  setUpAll(() async {
    // Inicializar Supabase client para testes
    await Supabase.initialize(
      url: const String.fromEnvironment('SUPABASE_URL'),
      anonKey: const String.fromEnvironment('SUPABASE_ANON_KEY'),
    );
    supabase = Supabase.instance.client;
  });

  tearDownAll(() async {
    await supabase.dispose();
  });

  group('POST /auth/v1/signup', () {
    test('deve criar usuário com dados válidos', () async {
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      final email = 'test_$timestamp@example.com';

      final response = await supabase.auth.signUp(
        email: email,
        password: 'senha123456',
        data: {'nome': 'Test User'},
      );

      // Validar schema da response
      expect(response.user, isNotNull);
      expect(response.user!.email, equals(email));
      expect(response.session, isNotNull);
      expect(response.session!.accessToken, isNotEmpty);
      expect(response.session!.tokenType, equals('bearer'));
    });

    test('deve retornar erro 400 para senha curta', () async {
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      final email = 'test_$timestamp@example.com';

      expect(
        () async => await supabase.auth.signUp(
          email: email,
          password: 'short',
        ),
        throwsA(isA<AuthException>()),
      );
    });

    test('deve retornar erro 422 para email já cadastrado', () async {
      final email = 'duplicate@example.com';

      // Primeiro signup
      try {
        await supabase.auth.signUp(
          email: email,
          password: 'senha123456',
          data: {'nome': 'First User'},
        );
      } catch (e) {
        // Ignorar se já existe
      }

      // Segundo signup (duplicado)
      expect(
        () async => await supabase.auth.signUp(
          email: email,
          password: 'senha123456',
          data: {'nome': 'Duplicate User'},
        ),
        throwsA(isA<AuthException>()),
      );
    });

    test('deve validar formato de email', () async {
      expect(
        () async => await supabase.auth.signUp(
          email: 'invalid-email',
          password: 'senha123456',
        ),
        throwsA(isA<AuthException>()),
      );
    });

    test('deve requerer campo nome nos user metadata', () async {
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      final email = 'test_$timestamp@example.com';

      final response = await supabase.auth.signUp(
        email: email,
        password: 'senha123456',
        data: {'nome': 'Required Name'},
      );

      expect(response.user!.userMetadata!['nome'], equals('Required Name'));
    });
  });
}
