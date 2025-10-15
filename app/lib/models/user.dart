class User {
  final String id;
  final String personId;
  final String email;
  final String name;
  final String? phone;
  final bool isAdmin;
  final DateTime createdAt;
  final DateTime updatedAt;
  final DateTime? deletedAt;

  const User({
    required this.id,
    required this.personId,
    required this.email,
    required this.name,
    this.phone,
    required this.isAdmin,
    required this.createdAt,
    required this.updatedAt,
    this.deletedAt,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    final person = json['person'] as Map<String, dynamic>?;
    final personId = json['person_id'] ?? person?['id'];
    if (personId == null) {
      throw ArgumentError('person_id é obrigatório para User');
    }

    return User(
      id: json['id'] as String,
      personId: personId as String,
      email: (json['email'] ?? person?['email'] ?? '') as String,
      name: (json['name'] ?? person?['name'] ?? '') as String,
      phone: (json['phone'] ?? person?['phone']) as String?,
      isAdmin: json['is_admin'] as bool,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
      deletedAt: json['deleted_at'] != null
          ? DateTime.parse(json['deleted_at'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'person_id': personId,
      'email': email,
      'name': name,
      'phone': phone,
      'is_admin': isAdmin,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
      'deleted_at': deletedAt?.toIso8601String(),
    };
  }
}
