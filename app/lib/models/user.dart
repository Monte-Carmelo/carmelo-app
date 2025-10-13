class User {
  final String id;
  final String email;
  final String name;
  final String? hierarchyParentId;
  final String hierarchyPath;
  final int hierarchyDepth;
  final bool isAdmin;
  final DateTime createdAt;
  final DateTime updatedAt;
  final DateTime? deletedAt;

  const User({
    required this.id,
    required this.email,
    required this.name,
    this.hierarchyParentId,
    required this.hierarchyPath,
    required this.hierarchyDepth,
    required this.isAdmin,
    required this.createdAt,
    required this.updatedAt,
    this.deletedAt,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String,
      email: json['email'] as String,
      name: json['name'] as String,
      hierarchyParentId: json['hierarchy_parent_id'] as String?,
      hierarchyPath: json['hierarchy_path'] as String,
      hierarchyDepth: json['hierarchy_depth'] as int,
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
      'email': email,
      'name': name,
      'hierarchy_parent_id': hierarchyParentId,
      'hierarchy_path': hierarchyPath,
      'hierarchy_depth': hierarchyDepth,
      'is_admin': isAdmin,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
      'deleted_at': deletedAt?.toIso8601String(),
    };
  }
}
