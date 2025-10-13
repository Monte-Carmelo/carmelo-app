import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/meeting.dart';
import '../models/meeting_attendance.dart';
import '../services/reunioes_service.dart';
import 'auth_provider.dart';

/// T058 - ReunioesProvider: StateNotifierProvider para fluxo de registro de reunião
/// Gerencia estado do formulário de criação de reunião e lista de presenças

// Provider do ReunioesService
final reunioesServiceProvider = Provider((ref) {
  return ReunioesService(ref.watch(supabaseProvider));
});

// Provider para listar reuniões de um GC
final reunioesListProvider = FutureProvider.family<List<Meeting>, String>(
  (ref, gcId) async {
    final service = ref.watch(reunioesServiceProvider);
    return await service.listMeetings(gcId);
  },
);

// Provider para detalhes de uma reunião específica
final reuniaoDetailsProvider = FutureProvider.family<Meeting, String>(
  (ref, meetingId) async {
    final service = ref.watch(reunioesServiceProvider);
    return await service.getMeeting(meetingId);
  },
);

// Estado do formulário de registro de reunião
class ReuniaoFormState {
  final bool isLoading;
  final String? error;
  final Meeting? savedMeeting;
  final List<MeetingAttendance> attendanceList;
  final bool isSaved;

  const ReuniaoFormState({
    this.isLoading = false,
    this.error,
    this.savedMeeting,
    this.attendanceList = const [],
    this.isSaved = false,
  });

  ReuniaoFormState copyWith({
    bool? isLoading,
    String? error,
    Meeting? savedMeeting,
    List<MeetingAttendance>? attendanceList,
    bool? isSaved,
  }) {
    return ReuniaoFormState(
      isLoading: isLoading ?? this.isLoading,
      error: error,
      savedMeeting: savedMeeting ?? this.savedMeeting,
      attendanceList: attendanceList ?? this.attendanceList,
      isSaved: isSaved ?? this.isSaved,
    );
  }
}

// Notifier para gerenciar formulário de reunião
class ReuniaoFormNotifier extends StateNotifier<ReuniaoFormState> {
  final ReunioesService _service;

  ReuniaoFormNotifier(this._service) : super(const ReuniaoFormState());

  // Adicionar presença de membro
  void addMemberAttendance(String memberId) {
    final attendance = MeetingAttendance(
      id: '', // Será gerado pelo Supabase
      meetingId: '', // Será preenchido ao criar reunião
      memberId: memberId,
      attendanceType: 'member',
      createdAt: DateTime.now(),
    );

    state = state.copyWith(
      attendanceList: [...state.attendanceList, attendance],
    );
  }

  // Remover presença de membro
  void removeMemberAttendance(String memberId) {
    state = state.copyWith(
      attendanceList: state.attendanceList
          .where((a) => a.memberId != memberId)
          .toList(),
    );
  }

  // Adicionar presença de visitante
  void addVisitorAttendance(String visitorId) {
    final attendance = MeetingAttendance(
      id: '',
      meetingId: '',
      visitorId: visitorId,
      attendanceType: 'visitor',
      createdAt: DateTime.now(),
    );

    state = state.copyWith(
      attendanceList: [...state.attendanceList, attendance],
    );
  }

  // Remover presença de visitante
  void removeVisitorAttendance(String visitorId) {
    state = state.copyWith(
      attendanceList: state.attendanceList
          .where((a) => a.visitorId != visitorId)
          .toList(),
    );
  }

  // Criar reunião com lista de presenças
  Future<void> createMeeting({
    required String gcId,
    required DateTime dataHora,
    String? licaoId,
    String? observacoes,
    required String registradoPorUserId,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final meeting = await _service.createMeeting(
        gcId: gcId,
        dataHora: dataHora,
        licaoId: licaoId,
        observacoes: observacoes,
        registradoPorUserId: registradoPorUserId,
        attendanceList: state.attendanceList,
      );

      state = state.copyWith(
        isLoading: false,
        savedMeeting: meeting,
        isSaved: true,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Erro ao registrar reunião: $e',
      );
      rethrow;
    }
  }

  // Limpar formulário
  void reset() {
    state = const ReuniaoFormState();
  }

  // Limpar erro
  void clearError() {
    state = state.copyWith(error: null);
  }
}

final reuniaoFormProvider = StateNotifierProvider<ReuniaoFormNotifier, ReuniaoFormState>((ref) {
  return ReuniaoFormNotifier(ref.watch(reunioesServiceProvider));
});
