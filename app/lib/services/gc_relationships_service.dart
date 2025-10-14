import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/gc_leader.dart';
import '../models/gc_supervisor.dart';

class GCRelationshipsService {
  final SupabaseClient _supabase;

  GCRelationshipsService(this._supabase);

  /// Add a leader to a GC
  Future<GCLeader> addLeader({
    required String gcId,
    required String userId,
    String role = 'co_leader',
  }) async {
    try {
      // Validar role
      if (role != 'leader' && role != 'co_leader') {
        throw Exception('Role deve ser "leader" ou "co_leader"');
      }

      final response = await _supabase
          .from('gc_leaders')
          .insert({
            'gc_id': gcId,
            'user_id': userId,
            'role': role,
          })
          .select(
            'gc_id, user_id, role, added_at, added_by_user_id, '
            'user:users(id, is_admin, hierarchy_parent_id, hierarchy_path, hierarchy_depth, person:people(name, email, phone))',
          )
          .single();

      return GCLeader.fromJson(response);
    } on PostgrestException catch (e) {
      if (e.code == '23505') {
        // Duplicate key violation
        throw Exception('Usuário já é líder deste GC com este papel');
      }
      throw Exception('Erro ao adicionar líder: ${e.message}');
    } catch (e) {
      throw Exception('Erro ao adicionar líder: $e');
    }
  }

  /// Remove a leader from a GC
  Future<void> removeLeader({
    required String gcId,
    required String userId,
    required String role,
  }) async {
    try {
      await _supabase
          .from('gc_leaders')
          .delete()
          .eq('gc_id', gcId)
          .eq('user_id', userId)
          .eq('role', role);
    } on PostgrestException catch (e) {
      // Trigger ensure_gc_has_leader pode bloquear se for o último líder
      if (e.message.contains('pelo menos 1 líder')) {
        throw Exception('Não é possível remover o último líder do GC');
      }
      throw Exception('Erro ao remover líder: ${e.message}');
    } catch (e) {
      throw Exception('Erro ao remover líder: $e');
    }
  }

  /// Add a supervisor to a GC
  Future<GCSupervisor> addSupervisor({
    required String gcId,
    required String userId,
  }) async {
    try {
      final response = await _supabase
          .from('gc_supervisors')
          .insert({
            'gc_id': gcId,
            'user_id': userId,
          })
          .select()
          .single();

      return GCSupervisor.fromJson(response);
    } on PostgrestException catch (e) {
      if (e.code == '23505') {
        // Duplicate key violation
        throw Exception('Usuário já é supervisor deste GC');
      }
      throw Exception('Erro ao adicionar supervisor: ${e.message}');
    } catch (e) {
      throw Exception('Erro ao adicionar supervisor: $e');
    }
  }

  /// Remove a supervisor from a GC
  Future<void> removeSupervisor({
    required String gcId,
    required String userId,
  }) async {
    try {
      await _supabase
          .from('gc_supervisors')
          .delete()
          .eq('gc_id', gcId)
          .eq('user_id', userId);
    } on PostgrestException catch (e) {
      // Trigger ensure_gc_has_supervisor pode bloquear se for o último supervisor
      if (e.message.contains('pelo menos 1 supervisor')) {
        throw Exception('Não é possível remover o último supervisor do GC');
      }
      throw Exception('Erro ao remover supervisor: ${e.message}');
    } catch (e) {
      throw Exception('Erro ao remover supervisor: $e');
    }
  }

  /// List all leaders of a GC
  Future<List<GCLeader>> listLeaders(String gcId) async {
    try {
      final response = await _supabase
          .from('gc_leaders')
          .select(
              'gc_id, user_id, role, added_at, added_by_user_id, '
              'user:users(id, is_admin, hierarchy_parent_id, hierarchy_path, hierarchy_depth, person:people(name, email, phone))')
          .eq('gc_id', gcId)
          .order('role'); // leader antes de co-leader

      return (response as List).map((item) => GCLeader.fromJson(item)).toList();
    } catch (e) {
      throw Exception('Erro ao listar líderes: $e');
    }
  }

  /// List all supervisors of a GC
  Future<List<GCSupervisor>> listSupervisors(String gcId) async {
    try {
      final response = await _supabase
          .from('gc_supervisors')
          .select(
              'gc_id, user_id, added_at, added_by_user_id, '
              'user:users(id, is_admin, hierarchy_parent_id, hierarchy_path, hierarchy_depth, person:people(name, email, phone))')
          .eq('gc_id', gcId)
          .order('added_at');

      return (response as List).map((item) => GCSupervisor.fromJson(item)).toList();
    } catch (e) {
      throw Exception('Erro ao listar supervisores: $e');
    }
  }
}
