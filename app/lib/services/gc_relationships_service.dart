import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/growth_group_participant.dart';

class GCRelationshipsService {
  final SupabaseClient _supabase;

  GCRelationshipsService(this._supabase);

  Future<String> _resolvePersonId(String userId) async {
    final result = await _supabase
        .from('users')
        .select('person_id')
        .eq('id', userId)
        .isFilter('deleted_at', null)
        .maybeSingle();

    if (result == null || result['person_id'] == null) {
      throw Exception('Usuário não encontrado ou sem pessoa vinculada.');
    }

    return result['person_id'] as String;
  }

  Future<Map<String, String>> _usersByPersonIds(List<String> personIds) async {
    if (personIds.isEmpty) {
      return {};
    }

    final response = await _supabase
        .from('users')
        .select('id, person_id')
        .inFilter('person_id', personIds)
        .isFilter('deleted_at', null);

    final List list = response as List;
    return {
      for (final item in list)
        if (item['person_id'] != null && item['id'] != null)
          item['person_id'] as String: item['id'] as String,
    };
  }

  Future<GrowthGroupParticipant> _insertParticipant({
    required String gcId,
    required String personId,
    required String role,
    String? addedByUserId,
  }) async {
    final response = await _supabase
        .from('growth_group_participants')
        .insert({
          'gc_id': gcId,
          'person_id': personId,
          'role': role,
          'status': 'active',
          'added_by_user_id': addedByUserId,
        })
        .select(
          'id, gc_id, person_id, role, status, joined_at, added_by_user_id, '
          'person:person_id ( id, name, email, phone )',
        )
        .single();

    final userMap = await _usersByPersonIds([personId]);
    return GrowthGroupParticipant.fromJson(
      response as Map<String, dynamic>,
      userId: userMap[personId],
    );
  }

  Future<void> _deleteParticipant({
    required String gcId,
    required String personId,
    required String role,
  }) async {
    await _supabase
        .from('growth_group_participants')
        .delete()
        .eq('gc_id', gcId)
        .eq('person_id', personId)
        .eq('role', role)
        .eq('status', 'active');
  }

  Future<List<GrowthGroupParticipant>> _listParticipants({
    required String gcId,
    required List<String> roles,
  }) async {
    final response = await _supabase
        .from('growth_group_participants')
        .select(
          'id, gc_id, person_id, role, status, joined_at, added_by_user_id, '
          'person:person_id ( id, name, email, phone )',
        )
        .eq('gc_id', gcId)
        .inFilter('role', roles)
        .eq('status', 'active')
        .isFilter('deleted_at', null)
        .order('role')
        .order('joined_at');

    final List rows = response as List;
    final personIds = <String>{
      for (final row in rows)
        if (row['person_id'] != null) row['person_id'] as String,
    }.toList();

    final userMap = await _usersByPersonIds(personIds);

    return rows
        .map(
          (row) => GrowthGroupParticipant.fromJson(
            row as Map<String, dynamic>,
            userId: userMap[row['person_id']],
          ),
        )
        .toList();
  }

  /// Adiciona um líder ou co-líder a um GC.
  Future<GrowthGroupParticipant> addLeader({
    required String gcId,
    required String userId,
    String role = 'co_leader',
    String? addedByUserId,
  }) async {
    if (role != 'leader' && role != 'co_leader') {
      throw Exception('Role deve ser "leader" ou "co_leader".');
    }

    try {
      final personId = await _resolvePersonId(userId);
      return await _insertParticipant(
        gcId: gcId,
        personId: personId,
        role: role,
        addedByUserId: addedByUserId,
      );
    } on PostgrestException catch (e) {
      if (e.code == '23505') {
        throw Exception('Usuário já possui esse papel neste GC.');
      }
      throw Exception('Erro ao adicionar líder: ${e.message}');
    }
  }

  /// Remove um líder ou co-líder de um GC.
  Future<void> removeLeader({
    required String gcId,
    required String userId,
    required String role,
  }) async {
    final personId = await _resolvePersonId(userId);

    try {
      await _deleteParticipant(
        gcId: gcId,
        personId: personId,
        role: role,
      );
    } on PostgrestException catch (e) {
      if (e.message.contains('GC') && e.message.contains('pelo menos um leader')) {
        throw Exception('Não é possível remover o último líder do GC.');
      }
      throw Exception('Erro ao remover líder: ${e.message}');
    }
  }

  /// Adiciona um supervisor a um GC.
  Future<GrowthGroupParticipant> addSupervisor({
    required String gcId,
    required String userId,
    String? addedByUserId,
  }) async {
    try {
      final personId = await _resolvePersonId(userId);
      return await _insertParticipant(
        gcId: gcId,
        personId: personId,
        role: 'supervisor',
        addedByUserId: addedByUserId,
      );
    } on PostgrestException catch (e) {
      if (e.code == '23505') {
        throw Exception('Usuário já é supervisor deste GC.');
      }
      throw Exception('Erro ao adicionar supervisor: ${e.message}');
    }
  }

  /// Remove um supervisor de um GC.
  Future<void> removeSupervisor({
    required String gcId,
    required String userId,
  }) async {
    final personId = await _resolvePersonId(userId);

    try {
      await _deleteParticipant(
        gcId: gcId,
        personId: personId,
        role: 'supervisor',
      );
    } on PostgrestException catch (e) {
      if (e.message.contains('GC') && e.message.contains('pelo menos um supervisor')) {
        throw Exception('Não é possível remover o último supervisor do GC.');
      }
      throw Exception('Erro ao remover supervisor: ${e.message}');
    }
  }

  /// Lista líderes e co-líderes ativos de um GC.
  Future<List<GrowthGroupParticipant>> listLeaders(String gcId) {
    return _listParticipants(
      gcId: gcId,
      roles: const ['leader', 'co_leader'],
    );
  }

  /// Lista supervisores ativos de um GC.
  Future<List<GrowthGroupParticipant>> listSupervisors(String gcId) {
    return _listParticipants(
      gcId: gcId,
      roles: const ['supervisor'],
    );
  }
}
