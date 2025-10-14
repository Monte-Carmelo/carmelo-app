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
      final query = _supabase
          .from('members')
          .select(
            'id, gc_id, status, joined_at, created_at, updated_at, deleted_at, '
            'converted_from_visitor_id, person:people(name, email, phone)',
          )
          .eq('gc_id', gcId)
          .isFilter('deleted_at', null);

      if (status != null) {
        query.eq('status', status);
      }

      final response = await query.order('joined_at');
      final members = List<Member>.from(
        (response as List).map((item) => Member.fromJson(_mapMember(item))),
      );
      members.sort((a, b) => a.name.compareTo(b.name));
      return members;
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

      // Criar pessoa
      final personData = await _supabase
          .from('people')
          .insert({
            'name': nome,
            'email': email,
            'phone': telefone,
          })
          .select()
          .single();

      final response = await _supabase
          .from('members')
          .insert({
            'gc_id': gcId,
            'person_id': personData['id'],
            'status': 'active',
            if (convertedFromVisitorId != null)
              'converted_from_visitor_id': convertedFromVisitorId,
          })
          .select(
            'id, gc_id, status, joined_at, created_at, updated_at, deleted_at, '
            'converted_from_visitor_id, person:people(name, email, phone)',
          )
          .single();

      return Member.fromJson(_mapMember(response));
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
      final memberResponse = await _supabase
          .from('members')
          .select('person_id')
          .eq('id', id)
          .maybeSingle();

      if (memberResponse == null) {
        throw Exception('Membro não encontrado');
      }

      final memberUpdates = <String, dynamic>{};
      if (status != null) memberUpdates['status'] = status;

      if (memberUpdates.isNotEmpty) {
        await _supabase
            .from('members')
            .update(memberUpdates)
            .eq('id', id);
      }

      final personUpdates = <String, dynamic>{};
      if (nome != null) personUpdates['name'] = nome;
      if (email != null) personUpdates['email'] = email;
      if (telefone != null) personUpdates['phone'] = telefone;

      if (personUpdates.isNotEmpty) {
        await _supabase
            .from('people')
            .update(personUpdates)
            .eq('id', memberResponse['person_id']);
      }

      final response = await _supabase
          .from('members')
          .select(
            'id, gc_id, status, joined_at, created_at, updated_at, deleted_at, '
            'converted_from_visitor_id, person:people(name, email, phone)',
          )
          .eq('id', id)
          .single();

      return Member.fromJson(_mapMember(response));
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
            'status': 'inactive',
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
          .select(
            'id, gc_id, status, joined_at, created_at, updated_at, deleted_at, '
            'converted_from_visitor_id, person:people(name, email, phone)',
          )
          .eq('id', id)
          .isFilter('deleted_at', null)
          .maybeSingle();

      if (response == null) {
        return null;
      }

      return Member.fromJson(_mapMember(response));
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
            'status': 'transferred',
          })
          .eq('id', memberId)
          .select(
            'id, gc_id, status, joined_at, created_at, updated_at, deleted_at, '
            'converted_from_visitor_id, person:people(name, email, phone)',
          )
          .single();

      return Member.fromJson(_mapMember(response));
    } catch (e) {
      throw Exception('Erro ao transferir membro: $e');
    }
  }

  Map<String, dynamic> _mapMember(Map<String, dynamic> data) {
    final person = data['person'] as Map<String, dynamic>?;
    return {
      ...data,
      if (person != null) 'name': person['name'],
      if (person != null) 'email': person['email'],
      if (person != null) 'phone': person['phone'],
    };
  }
}
