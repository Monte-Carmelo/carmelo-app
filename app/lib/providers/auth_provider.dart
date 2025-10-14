import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/user.dart';
import '../services/auth_service.dart';
import '../utils/supabase_config.dart';

/// T056 - AuthProvider: StateNotifierProvider<AuthNotifier, AuthState>
/// Gerencia estado de autenticação e usuário logado

// Estado de autenticação
class AuthState {
  final User? user;
  final bool isLoading;
  final String? error;
  final bool isAuthenticated;

  const AuthState({
    this.user,
    this.isLoading = false,
    this.error,
    this.isAuthenticated = false,
  });

  AuthState copyWith({
    User? user,
    bool? isLoading,
    String? error,
    bool? isAuthenticated,
  }) {
    return AuthState(
      user: user ?? this.user,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
    );
  }
}

// Notifier para gerenciar autenticação
class AuthNotifier extends StateNotifier<AuthState> {
  final AuthService _authService;

  AuthNotifier(this._authService) : super(const AuthState()) {
    _checkCurrentUser();
  }

  // Verificar usuário atual ao inicializar
  Future<void> _checkCurrentUser() async {
    state = state.copyWith(isLoading: true);
    try {
      final user = await _authService.getCurrentUser();
      if (user != null) {
        state = state.copyWith(
          user: user,
          isAuthenticated: true,
          isLoading: false,
        );
      } else {
        state = state.copyWith(isLoading: false);
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Erro ao verificar usuário: $e',
      );
    }
  }

  // Login
  Future<void> login(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final user = await _authService.login(
        email: email,
        password: password,
      );
      state = state.copyWith(
        user: user,
        isAuthenticated: true,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Erro ao fazer login: $e',
      );
      rethrow;
    }
  }

  // Signup
  Future<void> signup(String email, String password, String nome) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final user = await _authService.signup(
        email: email,
        password: password,
        name: nome,
      );
      state = state.copyWith(
        user: user,
        isAuthenticated: true,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Erro ao criar conta: $e',
      );
      rethrow;
    }
  }

  // Logout
  Future<void> logout() async {
    state = state.copyWith(isLoading: true);
    try {
      await _authService.logout();
      state = const AuthState(isLoading: false);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Erro ao fazer logout: $e',
      );
    }
  }

  // Limpar erro
  void clearError() {
    state = state.copyWith(error: null);
  }
}

// Provider do Supabase client
final supabaseProvider = Provider((ref) => SupabaseConfig.client);

// Provider do AuthService
final authServiceProvider = Provider((ref) {
  return AuthService(ref.watch(supabaseProvider));
});

// Provider principal de autenticação
final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(ref.watch(authServiceProvider));
});

// Provider para verificar se está autenticado (conveniente para guards)
final isAuthenticatedProvider = Provider<bool>((ref) {
  return ref.watch(authProvider).isAuthenticated;
});

// Provider para obter usuário atual
final currentUserProvider = Provider<User?>((ref) {
  return ref.watch(authProvider).user;
});
