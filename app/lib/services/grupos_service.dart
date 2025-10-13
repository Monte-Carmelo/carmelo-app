import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/growth_group.dart';

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
      var query = _supabase
          .from('growth_groups')
          .select()
          .isFilter('deleted_at', null)
          .order('nome')
          .range(offset, offset + limit - 1);

      if (status != null) {
        query = query.eq('status', status);
      }

      final response = await query;
      return (response as List)
          .map((item) => GrowthGroup.fromJson(item))
          .toList();
    } catch (e) {
      throw Exception('Erro ao listar GCs: $e');
    }
  }

  /// Create a new growth group with leaders and supervisors
  Future<GrowthGroup> createGrowthGroup({
    required String nome,
    required String modalidade,
    required List<String> leaderIds,
    required List<String> supervisorIds,
    String? endereco,
    int? diaSemana,
    String? horario,
  }) async {
    try {
      // Validar que presencial tem endereço
      if (modalidade == 'presencial' && (endereco == null || endereco.isEmpty)) {
        throw Exception('Endereço é obrigatório para GCs presenciais');
      }

      // Validar que há pelo menos 1 líder e 1 supervisor
      if (leaderIds.isEmpty) {
        throw Exception('GC deve ter pelo menos 1 líder');
      }
      if (supervisorIds.isEmpty) {
        throw Exception('GC deve ter pelo menos 1 supervisor');
      }

      // Criar GC
      final gcData = await _supabase
          .from('growth_groups')
          .insert({
            'nome': nome,
            'modalidade': modalidade,
            'endereco': endereco,
            'dia_semana': diaSemana,
            'horario': horario,
            'status': 'ativo',
          })
          .select()
          .single();

      final gcId = gcData['id'];

      // Adicionar líderes
      for (int i = 0; i < leaderIds.length; i++) {
        await _supabase.from('gc_leaders').insert({
          'gc_id': gcId,
          'user_id': leaderIds[i],
          'role': i == 0 ? 'leader' : 'co-leader', // Primeiro é leader, demais co-leader
        });
      }

      // Adicionar supervisores
      for (final supervisorId in supervisorIds) {
        await _supabase.from('gc_supervisors').insert({
          'gc_id': gcId,
          'user_id': supervisorId,
        });
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
    String? nome,
    String? modalidade,
    String? endereco,
    int? diaSemana,
    String? horario,
    String? status,
  }) async {
    try {
      final updates = <String, dynamic>{};
      if (nome != null) updates['nome'] = nome;
      if (modalidade != null) updates['modalidade'] = modalidade;
      if (endereco != null) updates['endereco'] = endereco;
      if (diaSemana != null) updates['dia_semana'] = diaSemana;
      if (horario != null) updates['horario'] = horario;
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
            'status': 'inativo',
            'deleted_at': DateTime.now().toIso8601String(),
          })
          .eq('id', id);
    } catch (e) {
      throw Exception('Erro ao deletar GC: $e');
    }
  }

  /// Get leaders of a GC
  Future<List<Map<String, dynamic>>> getLeaders(String gcId) async {
    try {
      final response = await _supabase
          .from('gc_leaders')
          .select('user_id, role, users!inner(id, nome, email)')
          .eq('gc_id', gcId);

      return List<Map<String, dynamic>>.from(response);
    } catch (e) {
      throw Exception('Erro ao buscar líderes: $e');
    }
  }

  /// Get supervisors of a GC
  Future<List<Map<String, dynamic>>> getSupervisors(String gcId) async {
    try {
      final response = await _supabase
          .from('gc_supervisors')
          .select('user_id, users!inner(id, nome, email)')
          .eq('gc_id', gcId);

      return List<Map<String, dynamic>>.from(response);
    } catch (e) {
      throw Exception('Erro ao buscar supervisores: $e');
    }
  }

  /// Get member count for a GC
  Future<int> getMemberCount(String gcId) async {
    try {
      final response = await _supabase
          .from('members')
          .select()
          .eq('gc_id', gcId)
          .eq('status', 'ativo')
          .isFilter('deleted_at', null)
          .count();

      return response.count;
    } catch (e) {
      throw Exception('Erro ao contar membros: $e');
    }
  }
}
