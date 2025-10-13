import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/meeting.dart';
import '../models/meeting_attendance.dart';

class ReunioesService {
  final SupabaseClient _supabase;

  ReunioesService(this._supabase);

  /// Create a meeting with attendance list
  Future<Meeting> createMeeting({
    required String gcId,
    required DateTime dataHora,
    String? licaoId,
    String? observacoes,
    required List<String> memberIds,
    required List<String> visitorIds,
  }) async {
    try {
      // Validar que data não é futura
      if (dataHora.isAfter(DateTime.now())) {
        throw Exception('Data da reunião não pode ser no futuro');
      }

      // Criar reunião
      final meetingResponse = await _supabase
          .from('meetings')
          .insert({
            'gc_id': gcId,
            'data_hora': dataHora.toIso8601String(),
            'licao_id': licaoId,
            'observacoes': observacoes,
            'registrado_por_user_id': _supabase.auth.currentUser?.id,
          })
          .select()
          .single();

      final meetingId = meetingResponse['id'];

      // Inserir presenças de membros
      if (memberIds.isNotEmpty) {
        final memberAttendances = memberIds.map((memberId) => {
              'meeting_id': meetingId,
              'member_id': memberId,
              'attendance_type': 'member',
            }).toList();

        await _supabase.from('meeting_attendance').insert(memberAttendances);
      }

      // Inserir presenças de visitantes
      if (visitorIds.isNotEmpty) {
        final visitorAttendances = visitorIds.map((visitorId) => {
              'meeting_id': meetingId,
              'visitor_id': visitorId,
              'attendance_type': 'visitor',
            }).toList();

        await _supabase.from('meeting_attendance').insert(visitorAttendances);
      }

      return Meeting.fromJson(meetingResponse);
    } catch (e) {
      throw Exception('Erro ao criar reunião: $e');
    }
  }

  /// Get meeting by ID with attendance list
  Future<Map<String, dynamic>> getMeeting(String id) async {
    try {
      final meetingResponse = await _supabase
          .from('meetings')
          .select()
          .eq('id', id)
          .isFilter('deleted_at', null)
          .maybeSingle();

      if (meetingResponse == null) {
        throw Exception('Reunião não encontrada');
      }

      // Buscar presenças
      final attendanceResponse = await _supabase
          .from('meeting_attendance')
          .select('''
            id,
            attendance_type,
            member_id,
            visitor_id,
            members:member_id(id, nome, email),
            visitors:visitor_id(id, nome, email)
          ''')
          .eq('meeting_id', id);

      return {
        'meeting': Meeting.fromJson(meetingResponse),
        'attendance': List<MeetingAttendance>.from(
          attendanceResponse.map((item) => MeetingAttendance.fromJson(item)),
        ),
      };
    } catch (e) {
      throw Exception('Erro ao buscar reunião: $e');
    }
  }

  /// List meetings for a GC
  Future<List<Meeting>> listMeetings({
    required String gcId,
    int limit = 50,
    int offset = 0,
  }) async {
    try {
      final response = await _supabase
          .from('meetings')
          .select()
          .eq('gc_id', gcId)
          .isFilter('deleted_at', null)
          .order('data_hora', ascending: false)
          .range(offset, offset + limit - 1);

      return List<Meeting>.from(
        response.map((item) => Meeting.fromJson(item)),
      );
    } catch (e) {
      throw Exception('Erro ao listar reuniões: $e');
    }
  }

  /// Get attendance count for a meeting
  Future<Map<String, int>> getAttendanceCount(String meetingId) async {
    try {
      final response = await _supabase
          .from('meeting_attendance')
          .select('attendance_type')
          .eq('meeting_id', meetingId);

      int memberCount = 0;
      int visitorCount = 0;

      for (final attendance in response) {
        if (attendance['attendance_type'] == 'member') {
          memberCount++;
        } else if (attendance['attendance_type'] == 'visitor') {
          visitorCount++;
        }
      }

      return {
        'members': memberCount,
        'visitors': visitorCount,
        'total': memberCount + visitorCount,
      };
    } catch (e) {
      throw Exception('Erro ao contar presenças: $e');
    }
  }

  /// Delete a meeting (soft delete)
  Future<void> deleteMeeting(String id) async {
    try {
      await _supabase
          .from('meetings')
          .update({
            'deleted_at': DateTime.now().toIso8601String(),
          })
          .eq('id', id);
    } catch (e) {
      throw Exception('Erro ao deletar reunião: $e');
    }
  }
}
