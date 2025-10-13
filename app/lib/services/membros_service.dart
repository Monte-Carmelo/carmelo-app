import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/member.dart';

class MembrosService {
  final SupabaseClient _supabase;

  MembrosService(this._supabase);

  /// List members of a GC
  Future<List<Member>> listMembers({
    required String gcId,
    String? status,
  }) async {
    try {
      var query = _supabase
          .from('members')
          .select()
          .eq('gc_id', gcId)
          .isFilter('deleted_at', null);

      if (status != null) {
        query = query.eq('status', status);
      }

      query = query.order('nome');

      final response = await query;
      return List<Member>.from(
        response.map((item) => Member.fromJson(item)),
      );
    } catch (e) {
      throw Exception('Erro ao listar membros: $e');
    }
  }

  /// Add a member to a GC
  Future<Member> addMember({
    required String gcId,
    required String nome,
    String? email,
    String? telefone,
    String? convertedFromVisitorId,
  }) async {
    try {
      // Validar que tem pelo menos email OU telefone
      if ((email == null || email.isEmpty) && (telefone == null || telefone.isEmpty)) {
        throw Exception('Email ou telefone é obrigatório');
      }

      final response = await _supabase
          .from('members')
          .insert({
            'gc_id': gcId,
            'nome': nome,
            'email': email,
            'telefone': telefone,
            'status': 'ativo',
            if (convertedFromVisitorId != null)
              'converted_from_visitor_id': convertedFromVisitorId,
          })
          .select()
          .single();

      return Member.fromJson(response);
    } catch (e) {
      throw Exception('Erro ao adicionar membro: $e');
    }
  }

  /// Update a member
  Future<Member> updateMember({
    required String id,
    String? nome,
    String? email,
    String? telefone,
    String? status,
  }) async {
    try {
      final updates = <String, dynamic>{};
      if (nome != null) updates['nome'] = nome;
      if (email != null) updates['email'] = email;
      if (telefone != null) updates['telefone'] = telefone;
      if (status != null) updates['status'] = status;

      if (updates.isEmpty) {
        throw Exception('Nenhum campo para atualizar');
      }

      final response = await _supabase
          .from('members')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

      return Member.fromJson(response);
    } catch (e) {
      throw Exception('Erro ao atualizar membro: $e');
    }
  }

  /// Delete a member (soft delete)
  Future<void> deleteMember(String id) async {
    try {
      await _supabase
          .from('members')
          .update({
            'status': 'inativo',
            'deleted_at': DateTime.now().toIso8601String(),
          })
          .eq('id', id);
    } catch (e) {
      throw Exception('Erro ao deletar membro: $e');
    }
  }

  /// Get member by ID
  Future<Member?> getMember(String id) async {
    try {
      final response = await _supabase
          .from('members')
          .select()
          .eq('id', id)
          .isFilter('deleted_at', null)
          .maybeSingle();

      if (response == null) {
        return null;
      }

      return Member.fromJson(response);
    } catch (e) {
      throw Exception('Erro ao buscar membro: $e');
    }
  }

  /// Transfer member to another GC
  Future<Member> transferMember({
    required String memberId,
    required String newGcId,
  }) async {
    try {
      final response = await _supabase
          .from('members')
          .update({
            'gc_id': newGcId,
            'status': 'transferido',
          })
          .eq('id', memberId)
          .select()
          .single();

      return Member.fromJson(response);
    } catch (e) {
      throw Exception('Erro ao transferir membro: $e');
    }
  }
}
