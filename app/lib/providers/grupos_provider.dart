import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/growth_group.dart';
import '../services/grupos_service.dart';
import 'auth_provider.dart';

/// T057 - GruposProvider: FutureProvider.family para listas filtradas de GCs
/// Permite filtrar GCs por status, supervisor, etc.

// Provider do GruposService
final gruposServiceProvider = Provider((ref) {
  return GruposService(ref.watch(supabaseProvider));
});

// Provider para listar todos os GCs do usuário (filtrado por RLS)
final gruposListProvider = FutureProvider<List<GrowthGroup>>((ref) async {
  final service = ref.watch(gruposServiceProvider);
  return await service.listGrowthGroups();
});

// Provider.family para listar GCs por status
final gruposByStatusProvider = FutureProvider.family<List<GrowthGroup>, String>(
  (ref, status) async {
    final service = ref.watch(gruposServiceProvider);
    return await service.listGrowthGroups(status: status);
  },
);

// Provider.family para obter detalhes de um GC específico
final grupoDetailsProvider = FutureProvider.family<GrowthGroup, String>(
  (ref, gcId) async {
    final service = ref.watch(gruposServiceProvider);
    return await service.getGrowthGroup(gcId);
  },
);

// Provider.family para listar membros de um GC
final grupoMembersProvider = FutureProvider.family<List<dynamic>, String>(
  (ref, gcId) async {
    final service = ref.watch(gruposServiceProvider);
    // Buscar GC com membros incluídos
    final gc = await service.getGrowthGroup(gcId);
    return gc.members ?? [];
  },
);

// StateNotifier para gerenciar estado de criação/edição de GC
class GrupoFormState {
  final bool isLoading;
  final String? error;
  final GrowthGroup? savedGrupo;

  const GrupoFormState({
    this.isLoading = false,
    this.error,
    this.savedGrupo,
  });

  GrupoFormState copyWith({
    bool? isLoading,
    String? error,
    GrowthGroup? savedGrupo,
  }) {
    return GrupoFormState(
      isLoading: isLoading ?? this.isLoading,
      error: error,
      savedGrupo: savedGrupo ?? this.savedGrupo,
    );
  }
}

class GrupoFormNotifier extends StateNotifier<GrupoFormState> {
  final GruposService _service;

  GrupoFormNotifier(this._service) : super(const GrupoFormState());

  Future<void> createGrupo({
    required String nome,
    required String modalidade,
    String? endereco,
    int? diaSemana,
    String? horario,
    required List<String> leaderIds,
    required List<String> supervisorIds,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final gc = await _service.createGrowthGroup(
        nome: nome,
        modalidade: modalidade,
        endereco: endereco,
        diaSemana: diaSemana,
        horario: horario,
        leaderIds: leaderIds,
        supervisorIds: supervisorIds,
      );
      state = state.copyWith(isLoading: false, savedGrupo: gc);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Erro ao criar GC: $e',
      );
      rethrow;
    }
  }

  Future<void> updateGrupo({
    required String id,
    String? nome,
    String? modalidade,
    String? endereco,
    int? diaSemana,
    String? horario,
    String? status,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final gc = await _service.updateGrowthGroup(
        id: id,
        nome: nome,
        modalidade: modalidade,
        endereco: endereco,
        diaSemana: diaSemana,
        horario: horario,
        status: status,
      );
      state = state.copyWith(isLoading: false, savedGrupo: gc);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Erro ao atualizar GC: $e',
      );
      rethrow;
    }
  }

  void clearError() {
    state = state.copyWith(error: null);
  }
}

final grupoFormProvider = StateNotifierProvider<GrupoFormNotifier, GrupoFormState>((ref) {
  return GrupoFormNotifier(ref.watch(gruposServiceProvider));
});
