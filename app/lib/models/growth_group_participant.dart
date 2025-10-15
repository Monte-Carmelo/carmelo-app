class GrowthGroupParticipant {
  final String id;
  final String gcId;
  final String personId;
  final String role;
  final String status;
  final DateTime joinedAt;
  final String? addedByUserId;
  final String? userId;
  final String name;
  final String? email;
  final String? phone;

  const GrowthGroupParticipant({
    required this.id,
    required this.gcId,
    required this.personId,
    required this.role,
    required this.status,
    required this.joinedAt,
    this.addedByUserId,
    this.userId,
    required this.name,
    this.email,
    this.phone,
  });

  factory GrowthGroupParticipant.fromJson(
    Map<String, dynamic> json, {
    String? userId,
  }) {
    final person = json['person'] as Map<String, dynamic>? ?? {};

    return GrowthGroupParticipant(
      id: json['id'] as String,
      gcId: json['gc_id'] as String,
      personId: json['person_id'] as String,
      role: json['role'] as String,
      status: json['status'] as String,
      joinedAt: DateTime.parse(json['joined_at'] as String),
      addedByUserId: json['added_by_user_id'] as String?,
      userId: userId,
      name: (person['name'] ?? '') as String,
      email: person['email'] as String?,
      phone: person['phone'] as String?,
    );
  }
}
