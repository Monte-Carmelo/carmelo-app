class Visitor {
  final String id;
  final String name;
  final String? email;
  final String? phone;
  final int visitCount;
  final DateTime? firstVisitDate;
  final DateTime? convertedToMemberAt;
  final String? convertedByUserId;
  final DateTime createdAt;
  final DateTime updatedAt;

  const Visitor({
    required this.id,
    required this.name,
    this.email,
    this.phone,
    required this.visitCount,
    this.firstVisitDate,
    this.convertedToMemberAt,
    this.convertedByUserId,
    required this.createdAt,
    required this.updatedAt,
  });

  bool get isConverted => convertedToMemberAt != null;

  factory Visitor.fromJson(Map<String, dynamic> json) {
    final person = json['person'] as Map<String, dynamic>?;
    return Visitor(
      id: json['id'] as String,
      name: (json['name'] ?? person?['name']) as String,
      email: (json['email'] ?? person?['email']) as String?,
      phone: (json['phone'] ?? person?['phone']) as String?,
      visitCount: json['visit_count'] as int? ?? 0,
      firstVisitDate: json['first_visit_date'] != null
          ? DateTime.parse(json['first_visit_date'] as String)
          : null,
      convertedToMemberAt: json['converted_to_member_at'] != null
          ? DateTime.parse(json['converted_to_member_at'] as String)
          : null,
      convertedByUserId: json['converted_by_user_id'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'phone': phone,
      'visit_count': visitCount,
      'first_visit_date': firstVisitDate?.toIso8601String(),
      'converted_to_member_at': convertedToMemberAt?.toIso8601String(),
      'converted_by_user_id': convertedByUserId,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }
}
