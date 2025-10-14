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
      final query = _supabase.from('lessons').select();

      if (serieId != null) {
        query.eq('series_id', serieId);
      }

      final response = await query.order('order_in_series');

      return List<Lesson>.from(
        (response as List).map((item) => Lesson.fromJson(item)),
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
          .order('name');

      return List<LessonSeries>.from(
        (response as List).map((item) => LessonSeries.fromJson(item)),
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
            'title': titulo,
            'description': descricao,
            'bible_references': referenciasBiblicas,
            'link': link,
            'series_id': serieId,
            'order_in_series': ordemNaSerie,
            'created_by_user_id': _supabase.auth.currentUser?.id,
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
            'name': nome,
            'description': descricao,
            'created_by_user_id': _supabase.auth.currentUser?.id,
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
          .maybeSingle();

      if (seriesResponse == null) {
        return null;
      }

      // Buscar lições da série
      final lessonsResponse = await _supabase
          .from('lessons')
          .select()
          .eq('series_id', id)
          .order('order_in_series');

      return {
        'series': LessonSeries.fromJson(seriesResponse),
        'lessons': List<Lesson>.from(
          (lessonsResponse as List).map((item) => Lesson.fromJson(item)),
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
      if (titulo != null) updates['title'] = titulo;
      if (descricao != null) updates['description'] = descricao;
      if (referenciasBiblicas != null) updates['bible_references'] = referenciasBiblicas;
      if (link != null) updates['link'] = link;
      if (ordemNaSerie != null) updates['order_in_series'] = ordemNaSerie;

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
      await _supabase.from('lessons').delete().eq('id', id);
    } catch (e) {
      throw Exception('Erro ao deletar lição: $e');
    }
  }
}
