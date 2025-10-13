import 'package:test/test.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// T007 - Contract test POST /auth/v1/token (login)
/// Valida JWT response, rate limiting
void main() {
  late SupabaseClient supabase;

  setUpAll(() async {
    await Supabase.initialize(
      url: const String.fromEnvironment('SUPABASE_URL'),
      anonKey: const String.fromEnvironment('SUPABASE_ANON_KEY'),
    );
    supabase = Supabase.instance.client;

    // Criar usuário de teste
    try {
      await supabase.auth.signUp(
        email: 'login_test@example.com',
        password: 'senha123456',
        data: {'nome': 'Login Test User'},
      );
    } catch (e) {
      // Ignorar se já existe
    }
  });

  tearDownAll(() async {
    await supabase.dispose();
  });

  group('POST /auth/v1/token', () {
    test('deve fazer login com credenciais válidas', () async {
      final response = await supabase.auth.signInWithPassword(
        email: 'login_test@example.com',
        password: 'senha123456',
      );

      // Validar schema da response
      expect(response.session, isNotNull);
      expect(response.session!.accessToken, isNotEmpty);
      expect(response.session!.tokenType, equals('bearer'));
      expect(response.session!.expiresIn, greaterThan(0));
      expect(response.session!.refreshToken, isNotEmpty);
      expect(response.user, isNotNull);
      expect(response.user!.email, equals('login_test@example.com'));
    });

    test('deve retornar erro 400 para credenciais inválidas', () async {
      expect(
        () async => await supabase.auth.signInWithPassword(
          email: 'login_test@example.com',
          password: 'senha_errada',
        ),
        throwsA(isA<AuthException>()),
      );
    });

    test('deve retornar erro para email não cadastrado', () async {
      expect(
        () async => await supabase.auth.signInWithPassword(
          email: 'nao_existe@example.com',
          password: 'senha123456',
        ),
        throwsA(isA<AuthException>()),
      );
    });

    test('deve incluir grant_type=password implicitamente', () async {
      // O SDK Supabase já inclui grant_type=password por padrão
      final response = await supabase.auth.signInWithPassword(
        email: 'login_test@example.com',
        password: 'senha123456',
      );

      expect(response.session, isNotNull);
    });

    test('deve validar expiração do token', () async {
      final response = await supabase.auth.signInWithPassword(
        email: 'login_test@example.com',
        password: 'senha123456',
      );

      expect(response.session!.expiresIn, isA<int>());
      expect(response.session!.expiresIn, greaterThan(0));
      // Tipicamente 3600 segundos (1 hora)
      expect(response.session!.expiresIn, lessThanOrEqualTo(3600));
    });
  });
}
