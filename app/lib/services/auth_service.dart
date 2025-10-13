import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/user.dart' as app_models;

class AuthService {
  final SupabaseClient _supabase;

  AuthService(this._supabase);

  /// Sign up a new user with email and password
  Future<app_models.User?> signup({
    required String email,
    required String password,
    required String nome,
  }) async {
    try {
      final response = await _supabase.auth.signUp(
        email: email,
        password: password,
        data: {'name': nome},
      );

      if (response.user == null) {
        throw Exception('Falha ao criar usuário');
      }

      // Criar registro na tabela users
      final userData = await _supabase
          .from('users')
          .insert({
            'id': response.user!.id,
            'email': email,
            'name': nome,
          })
          .select()
          .single();

      return app_models.User.fromJson(userData);
    } on AuthException catch (e) {
      throw Exception('Erro ao cadastrar: ${e.message}');
    } catch (e) {
      throw Exception('Erro ao cadastrar: $e');
    }
  }

  /// Login with email and password
  Future<app_models.User?> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _supabase.auth.signInWithPassword(
        email: email,
        password: password,
      );

      if (response.user == null) {
        throw Exception('Credenciais inválidas');
      }

      // Buscar dados do usuário na tabela users
      final userData = await _supabase
          .from('users')
          .select()
          .eq('id', response.user!.id)
          .single();

      return app_models.User.fromJson(userData);
    } on AuthException catch (e) {
      throw Exception('Erro ao fazer login: ${e.message}');
    } catch (e) {
      throw Exception('Erro ao fazer login: $e');
    }
  }

  /// Logout current user
  Future<void> logout() async {
    try {
      await _supabase.auth.signOut();
    } catch (e) {
      throw Exception('Erro ao fazer logout: $e');
    }
  }

  /// Get current authenticated user
  Future<app_models.User?> getCurrentUser() async {
    try {
      final currentUser = _supabase.auth.currentUser;
      if (currentUser == null) {
        return null;
      }

      final userData = await _supabase
          .from('users')
          .select()
          .eq('id', currentUser.id)
          .single();

      return app_models.User.fromJson(userData);
    } catch (e) {
      return null;
    }
  }

  /// Get current user ID
  String? getCurrentUserId() {
    return _supabase.auth.currentUser?.id;
  }

  /// Check if user is authenticated
  bool isAuthenticated() {
    return _supabase.auth.currentUser != null;
  }

  /// Listen to auth state changes
  Stream<AuthState> get authStateChanges {
    return _supabase.auth.onAuthStateChange;
  }
}
