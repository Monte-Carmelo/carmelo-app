class GrowthGroup {
  final String id;
  final String name;
  final String mode; // 'in_person', 'online', or 'hybrid'
  final String? address;
  final int? weekday; // 0=Sunday, 6=Saturday
  final String? time; // TIME as string (HH:MM)
  final String status; // 'active', 'inactive', 'multiplying'
  final DateTime createdAt;
  final DateTime updatedAt;
  final DateTime? deletedAt;
  final int? totalActiveMembers;

  const GrowthGroup({
    required this.id,
    required this.name,
    required this.mode,
    this.address,
    this.weekday,
    this.time,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
    this.deletedAt,
    this.totalActiveMembers,
  });

  factory GrowthGroup.fromJson(Map<String, dynamic> json) {
    return GrowthGroup(
      id: json['id'] as String,
      name: json['name'] as String,
      mode: json['mode'] as String,
      address: json['address'] as String?,
      weekday: json['weekday'] as int?,
      time: json['time'] as String?,
      status: json['status'] as String,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
      deletedAt: json['deleted_at'] != null
          ? DateTime.parse(json['deleted_at'] as String)
          : null,
      totalActiveMembers: json['total_active_members'] as int?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'mode': mode,
      'address': address,
      'weekday': weekday,
      'time': time,
      'status': status,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
      'deleted_at': deletedAt?.toIso8601String(),
      'total_active_members': totalActiveMembers,
    };
  }
}
