import 'package:supabase_flutter/supabase_flutter.dart';

class DashboardService {
  final SupabaseClient _supabase;

  // Cache
  Map<String, dynamic>? _cachedMetricas;
  DateTime? _lastFetch;
  static const _cacheDuration = Duration(minutes: 5);

  DashboardService(this._supabase);

  /// Get metrics from dashboard view (with 5min TTL cache)
  Future<List<Map<String, dynamic>>> getMetricas({
    bool forceRefresh = false,
  }) async {
    try {
      // Check cache
      if (!forceRefresh &&
          _cachedMetricas != null &&
          _lastFetch != null &&
          DateTime.now().difference(_lastFetch!) < _cacheDuration) {
        return List<Map<String, dynamic>>.from(_cachedMetricas!['data']);
      }

      // Fetch from database
      final response = await _supabase.from('dashboard_metrics').select();

      // Update cache
      _cachedMetricas = {'data': response};
      _lastFetch = DateTime.now();

      return List<Map<String, dynamic>>.from(response);
    } catch (e) {
      throw Exception('Erro ao buscar métricas: $e');
    }
  }

  /// Get roles for a user (is_leader, is_supervisor, is_coordinator)
  Future<Map<String, dynamic>> getRolesForUser(String userId) async {
    try {
      final response = await _supabase
          .from('user_gc_roles')
          .select(
            'is_leader, is_supervisor, is_coordinator, is_admin, '
            'gcs_led, gcs_supervised, direct_subordinates',
          )
          .eq('user_id', userId)
          .maybeSingle();

      if (response == null) {
        return {
          'is_leader': false,
          'is_supervisor': false,
          'is_coordinator': false,
          'is_admin': false,
          'total_gcs_liderados': 0,
          'total_gcs_supervisionados': 0,
          'total_subordinados': 0,
        };
      }

      return {
        'is_leader': response['is_leader'] ?? false,
        'is_supervisor': response['is_supervisor'] ?? false,
        'is_coordinator': response['is_coordinator'] ?? false,
        'is_admin': response['is_admin'] ?? false,
        'total_gcs_liderados': response['gcs_led'] ?? 0,
        'total_gcs_supervisionados': response['gcs_supervised'] ?? 0,
        'total_subordinados': response['direct_subordinates'] ?? 0,
      };
    } catch (e) {
      throw Exception('Erro ao buscar papéis do usuário: $e');
    }
  }

  /// Get metrics for a specific GC
  Future<Map<String, dynamic>?> getMetricasForGC(String gcId) async {
    try {
      final response = await _supabase
          .from('dashboard_metrics')
          .select()
          .eq('gc_id', gcId)
          .maybeSingle();

      return response;
    } catch (e) {
      throw Exception('Erro ao buscar métricas do GC: $e');
    }
  }

  /// Clear cache
  void clearCache() {
    _cachedMetricas = null;
    _lastFetch = null;
  }

  /// Get metrics for GCs supervised by user (directly or via hierarchy)
  Future<List<Map<String, dynamic>>> getMetricasForSupervisor(String userId) async {
    try {
      // Get GCs directly supervised by user
      final userRecord = await _supabase
          .from('users')
          .select('person_id')
          .eq('id', userId)
          .maybeSingle();

      if (userRecord == null) {
        return [];
      }

      final supervisedGCs = await _supabase
          .from('growth_group_participants')
          .select('gc_id')
          .eq('person_id', userRecord['person_id'])
          .eq('role', 'supervisor')
          .eq('status', 'active')
          .isFilter('deleted_at', null);

      final gcIds = supervisedGCs.map((item) => item['gc_id']).toList();

      if (gcIds.isEmpty) {
        return [];
      }

      // Get metrics for these GCs
      final response = await _supabase
          .from('dashboard_metrics')
          .select()
          .inFilter('gc_id', gcIds);

      return List<Map<String, dynamic>>.from(response);
    } catch (e) {
      throw Exception('Erro ao buscar métricas do supervisor: $e');
    }
  }
}
