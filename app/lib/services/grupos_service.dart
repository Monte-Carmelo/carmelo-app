import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/growth_group.dart';
import '../models/growth_group_participant.dart';
import 'gc_relationships_service.dart';

class GruposService {
  final SupabaseClient _supabase;

  GruposService(this._supabase);

  /// List growth groups (filtered by RLS)
  Future<List<GrowthGroup>> listGrowthGroups({
    String? status,
    int limit = 50,
    int offset = 0,
  }) async {
    try {
      final response = await _supabase
          .from('growth_groups')
          .select()
          .isFilter('deleted_at', null)
          .order('name')
          .range(offset, offset + limit - 1);

      final groups = (response as List)
          .map((item) => GrowthGroup.fromJson(item))
          .toList();

      if (status != null) {
        return groups.where((gc) => gc.status == status).toList();
      }

      return groups;
    } catch (e) {
      throw Exception('Erro ao listar GCs: $e');
    }
  }

  /// Create a new growth group with leaders and supervisors
  Future<GrowthGroup> createGrowthGroup({
    required String name,
    required String mode,
    required List<String> leaderIds,
    required List<String> supervisorIds,
    String? address,
    int? weekday,
    String? time,
  }) async {
    try {
      // Validar que presencial tem endereço
      if (mode == 'in_person' && (address == null || address.isEmpty)) {
        throw Exception('Address is required for in-person growth groups');
      }

      // Validar que há pelo menos 1 líder e 1 supervisor
      if (leaderIds.isEmpty) {
        throw Exception('Growth group must have at least one leader');
      }
      if (supervisorIds.isEmpty) {
        throw Exception('Growth group must have at least one supervisor');
      }

      // Criar GC
      final gcData = await _supabase
          .from('growth_groups')
          .insert({
            'name': name,
            'mode': mode,
            'address': address,
            'weekday': weekday,
            'time': time,
            'status': 'active',
          })
          .select()
          .single();

      final gcId = gcData['id'];

      final relationships = GCRelationshipsService(_supabase);

      for (int i = 0; i < leaderIds.length; i++) {
        final role = i == 0 ? 'leader' : 'co_leader';
        await relationships.addLeader(
          gcId: gcId,
          userId: leaderIds[i],
          role: role,
        );
      }

      for (final supervisorId in supervisorIds) {
        await relationships.addSupervisor(
          gcId: gcId,
          userId: supervisorId,
        );
      }

      return GrowthGroup.fromJson(gcData);
    } catch (e) {
      throw Exception('Erro ao criar GC: $e');
    }
  }

  /// Get growth group by ID with details
  Future<GrowthGroup?> getGrowthGroup(String id) async {
    try {
      final response = await _supabase
          .from('growth_groups')
          .select()
          .eq('id', id)
          .isFilter('deleted_at', null)
          .maybeSingle();

      if (response == null) {
        return null;
      }

      return GrowthGroup.fromJson(response);
    } catch (e) {
      throw Exception('Erro ao buscar GC: $e');
    }
  }

  /// Update growth group
  Future<GrowthGroup> updateGrowthGroup({
    required String id,
    String? name,
    String? mode,
    String? address,
    int? weekday,
    String? time,
    String? status,
  }) async {
    try {
      final updates = <String, dynamic>{};
      if (name != null) updates['name'] = name;
      if (mode != null) updates['mode'] = mode;
      if (address != null) updates['address'] = address;
      if (weekday != null) updates['weekday'] = weekday;
      if (time != null) updates['time'] = time;
      if (status != null) updates['status'] = status;

      if (updates.isEmpty) {
        throw Exception('Nenhum campo para atualizar');
      }

      final response = await _supabase
          .from('growth_groups')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

      return GrowthGroup.fromJson(response);
    } catch (e) {
      throw Exception('Erro ao atualizar GC: $e');
    }
  }

  /// Delete growth group (soft delete)
  Future<void> deleteGrowthGroup(String id) async {
    try {
      // Soft delete - apenas muda status para inativo
      await _supabase
          .from('growth_groups')
          .update({
            'status': 'inactive',
            'deleted_at': DateTime.now().toIso8601String(),
          })
          .eq('id', id);
    } catch (e) {
      throw Exception('Erro ao deletar GC: $e');
    }
  }

  /// Get leaders of a GC
  Future<List<GrowthGroupParticipant>> getLeaders(String gcId) async {
    final relationships = GCRelationshipsService(_supabase);
    return relationships.listLeaders(gcId);
  }

  /// Get supervisors of a GC
  Future<List<GrowthGroupParticipant>> getSupervisors(String gcId) async {
    final relationships = GCRelationshipsService(_supabase);
    return relationships.listSupervisors(gcId);
  }

  /// Get member count for a GC
  Future<int> getMemberCount(String gcId) async {
    try {
      final response = await _supabase
          .from('growth_group_participants')
          .select()
          .eq('gc_id', gcId)
          .eq('role', 'member')
          .eq('status', 'active')
          .isFilter('deleted_at', null)
          .count();

      return response.count;
    } catch (e) {
      throw Exception('Erro ao contar membros: $e');
    }
  }
}
