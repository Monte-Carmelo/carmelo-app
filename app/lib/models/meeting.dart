class Meeting {
  final String id;
  final String gcId;
  final DateTime datetime;
  final String? lessonId;
  final String registeredByUserId;
  final DateTime createdAt;
  final DateTime updatedAt;

  const Meeting({
    required this.id,
    required this.gcId,
    required this.datetime,
    this.lessonId,
    required this.registeredByUserId,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Meeting.fromJson(Map<String, dynamic> json) {
    return Meeting(
      id: json['id'] as String,
      gcId: json['gc_id'] as String,
      datetime: DateTime.parse(json['datetime'] as String),
      lessonId: json['lesson_id'] as String?,
      registeredByUserId: json['registered_by_user_id'] as String,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'gc_id': gcId,
      'datetime': datetime.toIso8601String(),
      'lesson_id': lessonId,
      'registered_by_user_id': registeredByUserId,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }
}
