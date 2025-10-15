import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/user.dart' as app_models;

class AuthService {
  final SupabaseClient _supabase;

  AuthService(this._supabase);

  /// Sign up a new user with email and password
  Future<app_models.User> signup({
    required String email,
    required String password,
    required String name,
    String? phone,
  }) async {
    try {
      final response = await _supabase.auth.signUp(
        email: email,
        password: password,
        data: {'name': name},
      );

      if (response.user == null) {
        throw Exception('Falha ao criar usuário');
      }

      // Criar pessoa básica para o usuário
      final personData = await _supabase
          .from('people')
          .insert({
            'name': name,
            'email': email,
            if (phone != null) 'phone': phone,
          })
          .select()
          .single();

      // Criar registro na tabela users vinculando à pessoa
      final userData = await _supabase
          .from('users')
          .insert({
            'id': response.user!.id,
            'person_id': personData['id'],
          })
          .select(
            'id, person_id, is_admin, created_at, updated_at, deleted_at, '
            'person:people(name, email, phone)',
          )
          .single();

      return _mapToAppUser(userData);
    } on AuthException catch (e) {
      throw Exception('Erro ao cadastrar: ${e.message}');
    } catch (e) {
      throw Exception('Erro ao cadastrar: $e');
    }
  }

  /// Login with email and password
  Future<app_models.User> login({
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
          .select(
            'id, person_id, is_admin, created_at, updated_at, deleted_at, '
            'person:people(name, email, phone)',
          )
          .eq('id', response.user!.id)
          .single();

      return _mapToAppUser(userData);
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
          .select(
            'id, person_id, is_admin, created_at, updated_at, deleted_at, '
            'person:people(name, email, phone)',
          )
          .eq('id', currentUser.id)
          .maybeSingle();

      if (userData == null) {
        return null;
      }

      return _mapToAppUser(userData);
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

  app_models.User _mapToAppUser(Map<String, dynamic> data) {
    final person = data['person'] as Map<String, dynamic>?;
    final merged = {
      ...data,
      if (person != null) 'name': person['name'],
      if (person != null) 'email': person['email'],
      if (person != null) 'phone': person['phone'],
    };
    return app_models.User.fromJson(merged);
  }
}
