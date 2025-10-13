class LessonSeries {
  final String id;
  final String name;
  final String? description;
  final String createdByUserId;
  final DateTime createdAt;
  final DateTime updatedAt;

  const LessonSeries({
    required this.id,
    required this.name,
    this.description,
    required this.createdByUserId,
    required this.createdAt,
    required this.updatedAt,
  });

  factory LessonSeries.fromJson(Map<String, dynamic> json) {
    return LessonSeries(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      createdByUserId: json['created_by_user_id'] as String,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'created_by_user_id': createdByUserId,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }
}
