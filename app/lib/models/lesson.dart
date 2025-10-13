class Lesson {
  final String id;
  final String title;
  final String? description;
  final String? bibleReferences;
  final String? seriesId;
  final String? link;
  final int? orderInSeries;
  final String createdByUserId;
  final DateTime createdAt;
  final DateTime updatedAt;

  const Lesson({
    required this.id,
    required this.title,
    this.description,
    this.bibleReferences,
    this.seriesId,
    this.link,
    this.orderInSeries,
    required this.createdByUserId,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Lesson.fromJson(Map<String, dynamic> json) {
    return Lesson(
      id: json['id'] as String,
      title: json['title'] as String,
      description: json['description'] as String?,
      bibleReferences: json['bible_references'] as String?,
      seriesId: json['series_id'] as String?,
      link: json['link'] as String?,
      orderInSeries: json['order_in_series'] as int?,
      createdByUserId: json['created_by_user_id'] as String,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'bible_references': bibleReferences,
      'series_id': seriesId,
      'link': link,
      'order_in_series': orderInSeries,
      'created_by_user_id': createdByUserId,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }
}
