class MeetingAttendance {
  final String id;
  final String meetingId;
  final String? memberId;
  final String? visitorId;
  final String attendanceType; // 'member' or 'visitor'
  final DateTime createdAt;

  const MeetingAttendance({
    required this.id,
    required this.meetingId,
    this.memberId,
    this.visitorId,
    required this.attendanceType,
    required this.createdAt,
  });

  factory MeetingAttendance.fromJson(Map<String, dynamic> json) {
    return MeetingAttendance(
      id: json['id'] as String,
      meetingId: json['meeting_id'] as String,
      memberId: json['member_id'] as String?,
      visitorId: json['visitor_id'] as String?,
      attendanceType: json['attendance_type'] as String,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'meeting_id': meetingId,
      'member_id': memberId,
      'visitor_id': visitorId,
      'attendance_type': attendanceType,
      'created_at': createdAt.toIso8601String(),
    };
  }
}
