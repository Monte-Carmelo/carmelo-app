import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/lesson.dart';
import '../models/lesson_series.dart';

class LicoesService {
  final SupabaseClient _supabase;

  LicoesService(this._supabase);

  /// List all lessons
  Future<List<Lesson>> listLessons({
    String? serieId,
  }) async {
    try {
      var query = _supabase
          .from('lessons')
          .select()
          .isFilter('deleted_at', null);

      if (serieId != null) {
        query = query.eq('serie_id', serieId);
      }

      final response = await query.order('ordem_na_serie');

      return List<Lesson>.from(
        response.map((item) => Lesson.fromJson(item)),
      );
    } catch (e) {
      throw Exception('Erro ao listar lições: $e');
    }
  }

  /// List all lesson series
  Future<List<LessonSeries>> listLessonSeries() async {
    try {
      final response = await _supabase
          .from('lesson_series')
          .select()
          .isFilter('deleted_at', null)
          .order('nome');

      return List<LessonSeries>.from(
        response.map((item) => LessonSeries.fromJson(item)),
      );
    } catch (e) {
      throw Exception('Erro ao listar séries de lições: $e');
    }
  }

  /// Create a lesson (admin only)
  Future<Lesson> createLesson({
    required String titulo,
    String? descricao,
    String? referenciasBiblicas,
    String? link,
    String? serieId,
    int? ordemNaSerie,
  }) async {
    try {
      // Validar que se tem série, deve ter ordem
      if (serieId != null && ordemNaSerie == null) {
        throw Exception('Lição em série deve ter ordem');
      }
      if (serieId == null && ordemNaSerie != null) {
        throw Exception('Ordem só é permitida para lições em série');
      }

      final response = await _supabase
          .from('lessons')
          .insert({
            'titulo': titulo,
            'descricao': descricao,
            'referencias_biblicas': referenciasBiblicas,
            'link': link,
            'serie_id': serieId,
            'ordem_na_serie': ordemNaSerie,
            'criado_por_user_id': _supabase.auth.currentUser?.id,
          })
          .select()
          .single();

      return Lesson.fromJson(response);
    } on PostgrestException catch (e) {
      if (e.code == '23505') {
        // Duplicate key - ordem já existe na série
        throw Exception('Já existe uma lição com esta ordem na série');
      }
      throw Exception('Erro ao criar lição: ${e.message}');
    } catch (e) {
      throw Exception('Erro ao criar lição: $e');
    }
  }

  /// Create a lesson series (admin only)
  Future<LessonSeries> createLessonSeries({
    required String nome,
    String? descricao,
  }) async {
    try {
      final response = await _supabase
          .from('lesson_series')
          .insert({
            'nome': nome,
            'descricao': descricao,
            'criado_por_user_id': _supabase.auth.currentUser?.id,
          })
          .select()
          .single();

      return LessonSeries.fromJson(response);
    } on PostgrestException catch (e) {
      if (e.code == '23505') {
        // Duplicate key - nome já existe
        throw Exception('Já existe uma série com este nome');
      }
      throw Exception('Erro ao criar série: ${e.message}');
    } catch (e) {
      throw Exception('Erro ao criar série: $e');
    }
  }

  /// Get lesson by ID
  Future<Lesson?> getLesson(String id) async {
    try {
      final response = await _supabase
          .from('lessons')
          .select()
          .eq('id', id)
          .isFilter('deleted_at', null)
          .maybeSingle();

      if (response == null) {
        return null;
      }

      return Lesson.fromJson(response);
    } catch (e) {
      throw Exception('Erro ao buscar lição: $e');
    }
  }

  /// Get lesson series by ID with all lessons
  Future<Map<String, dynamic>?> getLessonSeries(String id) async {
    try {
      final seriesResponse = await _supabase
          .from('lesson_series')
          .select()
          .eq('id', id)
          .isFilter('deleted_at', null)
          .maybeSingle();

      if (seriesResponse == null) {
        return null;
      }

      // Buscar lições da série
      final lessonsResponse = await _supabase
          .from('lessons')
          .select()
          .eq('serie_id', id)
          .isFilter('deleted_at', null)
          .order('ordem_na_serie');

      return {
        'series': LessonSeries.fromJson(seriesResponse),
        'lessons': List<Lesson>.from(
          lessonsResponse.map((item) => Lesson.fromJson(item)),
        ),
      };
    } catch (e) {
      throw Exception('Erro ao buscar série: $e');
    }
  }

  /// Update lesson (admin only)
  Future<Lesson> updateLesson({
    required String id,
    String? titulo,
    String? descricao,
    String? referenciasBiblicas,
    String? link,
    int? ordemNaSerie,
  }) async {
    try {
      final updates = <String, dynamic>{};
      if (titulo != null) updates['titulo'] = titulo;
      if (descricao != null) updates['descricao'] = descricao;
      if (referenciasBiblicas != null) updates['referencias_biblicas'] = referenciasBiblicas;
      if (link != null) updates['link'] = link;
      if (ordemNaSerie != null) updates['ordem_na_serie'] = ordemNaSerie;

      if (updates.isEmpty) {
        throw Exception('Nenhum campo para atualizar');
      }

      final response = await _supabase
          .from('lessons')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

      return Lesson.fromJson(response);
    } catch (e) {
      throw Exception('Erro ao atualizar lição: $e');
    }
  }

  /// Delete lesson (soft delete, admin only)
  Future<void> deleteLesson(String id) async {
    try {
      await _supabase
          .from('lessons')
          .update({
            'deleted_at': DateTime.now().toIso8601String(),
          })
          .eq('id', id);
    } catch (e) {
      throw Exception('Erro ao deletar lição: $e');
    }
  }
}
