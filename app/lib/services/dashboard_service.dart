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
      // Check if user is leader (has GCs in gc_leaders)
      final leaderResponse = await _supabase
          .from('gc_leaders')
          .select('gc_id')
          .eq('user_id', userId)
          .limit(1)
          .maybeSingle();

      final isLeader = leaderResponse != null;

      // Check if user is supervisor (has GCs in gc_supervisors)
      final supervisorResponse = await _supabase
          .from('gc_supervisors')
          .select('gc_id')
          .eq('user_id', userId)
          .limit(1)
          .maybeSingle();

      final isSupervisor = supervisorResponse != null;

      // Check if user is coordinator (has subordinates in hierarchy)
      final coordinatorResponse = await _supabase
          .from('users')
          .select('id')
          .eq('hierarchy_parent_id', userId)
          .limit(1)
          .maybeSingle();

      final isCoordinator = coordinatorResponse != null;

      // Get admin status
      final userResponse = await _supabase
          .from('users')
          .select('is_admin')
          .eq('id', userId)
          .single();

      final isAdmin = userResponse['is_admin'] as bool;

      // Count GCs led
      final leaderCountResponse = await _supabase
          .from('gc_leaders')
          .select()
          .eq('user_id', userId)
          .count();

      // Count GCs supervised
      final supervisorCountResponse = await _supabase
          .from('gc_supervisors')
          .select()
          .eq('user_id', userId)
          .count();

      // Count subordinates
      final subordinatesCountResponse = await _supabase
          .from('users')
          .select()
          .eq('hierarchy_parent_id', userId)
          .count();

      return {
        'is_leader': isLeader,
        'is_supervisor': isSupervisor,
        'is_coordinator': isCoordinator,
        'is_admin': isAdmin,
        'total_gcs_liderados': leaderCountResponse.count,
        'total_gcs_supervisionados': supervisorCountResponse.count,
        'total_subordinados': subordinatesCountResponse.count,
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
      final supervisedGCs = await _supabase
          .from('gc_supervisors')
          .select('gc_id')
          .eq('user_id', userId);

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
