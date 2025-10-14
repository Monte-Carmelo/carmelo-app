import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/meeting.dart';
import '../models/meeting_attendance.dart';

class ReunioesService {
  final SupabaseClient _supabase;

  ReunioesService(this._supabase);

  /// Create a meeting with attendance list
  Future<Meeting> createMeeting({
    required String gcId,
    required DateTime datetime,
    String? lessonId,
    required List<MeetingAttendance> attendanceList,
    String? registeredByUserId,
  }) async {
    try {
      // Validar que data não é futura
      if (datetime.isAfter(DateTime.now())) {
        throw Exception('Data da reunião não pode ser no futuro');
      }

      final registrarId = registeredByUserId ?? _supabase.auth.currentUser?.id;
      if (registrarId == null) {
        throw Exception('Usuário não autenticado');
      }

      // Criar reunião
      final meetingResponse = await _supabase
          .from('meetings')
          .insert({
            'gc_id': gcId,
            'datetime': datetime.toIso8601String(),
            'lesson_id': lessonId,
            'registered_by_user_id': registrarId,
          })
          .select()
          .single();

      final meetingId = meetingResponse['id'] as String;

      // Inserir presenças de membros
      if (attendanceList.isNotEmpty) {
        final rows = attendanceList.map((attendance) {
          return {
            'meeting_id': meetingId,
            'attendance_type': attendance.attendanceType,
            'member_id': attendance.memberId,
            'visitor_id': attendance.visitorId,
          };
        }).toList();

        await _supabase.from('meeting_attendance').insert(rows);
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
          .maybeSingle();

      if (meetingResponse == null) {
        throw Exception('Reunião não encontrada');
      }

      // Buscar presenças
      final attendanceResponse = await _supabase
          .from('meeting_attendance')
          .select()
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
          .order('datetime', ascending: false)
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
      await _supabase.from('meetings').delete().eq('id', id);
    } catch (e) {
      throw Exception('Erro ao deletar reunião: $e');
    }
  }
}
