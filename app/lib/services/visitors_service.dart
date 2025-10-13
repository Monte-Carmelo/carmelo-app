import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/visitor.dart';

class VisitorsService {
  final SupabaseClient _supabase;

  VisitorsService(this._supabase);

  /// List all visitors
  Future<List<Visitor>> listVisitors({
    bool onlyNotConverted = false,
  }) async {
    try {
      var query = _supabase
          .from('visitors')
          .select();

      if (onlyNotConverted) {
        query = query.isFilter('converted_to_member_at', null);
      }

      query = query.order('visit_count', ascending: false);

      final response = await query;
      return List<Visitor>.from(
        response.map((item) => Visitor.fromJson(item)),
      );
    } catch (e) {
      throw Exception('Erro ao listar visitantes: $e');
    }
  }

  /// Add a visitor
  Future<Visitor> addVisitor({
    required String nome,
    String? email,
    String? telefone,
  }) async {
    try {
      // Validar que tem pelo menos email OU telefone
      if ((email == null || email.isEmpty) && (telefone == null || telefone.isEmpty)) {
        throw Exception('Email ou telefone é obrigatório');
      }

      final response = await _supabase
          .from('visitors')
          .insert({
            'nome': nome,
            'email': email,
            'telefone': telefone,
            'visit_count': 0,
          })
          .select()
          .single();

      return Visitor.fromJson(response);
    } catch (e) {
      throw Exception('Erro ao adicionar visitante: $e');
    }
  }

  /// Get visitor by ID
  Future<Visitor?> getVisitor(String id) async {
    try {
      final response = await _supabase
          .from('visitors')
          .select()
          .eq('id', id)
          .maybeSingle();

      if (response == null) {
        return null;
      }

      return Visitor.fromJson(response);
    } catch (e) {
      throw Exception('Erro ao buscar visitante: $e');
    }
  }

  /// Get visitor conversion status
  Future<Map<String, dynamic>> getVisitorConversionStatus(String id) async {
    try {
      final visitor = await getVisitor(id);
      if (visitor == null) {
        throw Exception('Visitante não encontrado');
      }

      // Buscar threshold da config
      final configResponse = await _supabase
          .from('config')
          .select('value')
          .eq('key', 'visitor_conversion_threshold')
          .maybeSingle();

      final threshold = configResponse != null
          ? int.parse(configResponse['value'].toString())
          : 3;

      return {
        'visitor_id': visitor.id,
        'nome': visitor.nome,
        'visit_count': visitor.visitCount,
        'threshold': threshold,
        'is_ready_to_convert': visitor.visitCount >= threshold,
        'is_converted': visitor.convertedToMemberAt != null,
        'converted_at': visitor.convertedToMemberAt?.toIso8601String(),
        'remaining_visits': threshold - visitor.visitCount,
      };
    } catch (e) {
      throw Exception('Erro ao buscar status de conversão: $e');
    }
  }

  /// Search visitors by name, email or phone
  Future<List<Visitor>> searchVisitors(String query) async {
    try {
      final response = await _supabase
          .from('visitors')
          .select()
          .or('nome.ilike.%$query%,email.ilike.%$query%,telefone.ilike.%$query%')
          .order('visit_count', ascending: false);

      return List<Visitor>.from(
        response.map((item) => Visitor.fromJson(item)),
      );
    } catch (e) {
      throw Exception('Erro ao buscar visitantes: $e');
    }
  }

  /// Get visitors ready for conversion (reached threshold)
  Future<List<Visitor>> getVisitorsReadyForConversion() async {
    try {
      // Buscar threshold
      final configResponse = await _supabase
          .from('config')
          .select('value')
          .eq('key', 'visitor_conversion_threshold')
          .maybeSingle();

      final threshold = configResponse != null
          ? int.parse(configResponse['value'].toString())
          : 3;

      final response = await _supabase
          .from('visitors')
          .select()
          .gte('visit_count', threshold)
          .isFilter('converted_to_member_at', null)
          .order('visit_count', ascending: false);

      return List<Visitor>.from(
        response.map((item) => Visitor.fromJson(item)),
      );
    } catch (e) {
      throw Exception('Erro ao buscar visitantes prontos para conversão: $e');
    }
  }
}
