import 'user.dart';
import 'growth_group.dart';

class GCSupervisor {
  final String gcId;
  final String userId;
  final DateTime addedAt;
  final String? addedByUserId;

  // Optional nested objects (from joins)
  final User? user;
  final GrowthGroup? gc;

  const GCSupervisor({
    required this.gcId,
    required this.userId,
    required this.addedAt,
    this.addedByUserId,
    this.user,
    this.gc,
  });

  factory GCSupervisor.fromJson(Map<String, dynamic> json) {
    return GCSupervisor(
      gcId: json['gc_id'] as String,
      userId: json['user_id'] as String,
      addedAt: DateTime.parse(json['added_at'] as String),
      addedByUserId: json['added_by_user_id'] as String?,
      user: json['user'] != null ? User.fromJson(json['user'] as Map<String, dynamic>) : null,
      gc: json['gc'] != null ? GrowthGroup.fromJson(json['gc'] as Map<String, dynamic>) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'gc_id': gcId,
      'user_id': userId,
      'added_at': addedAt.toIso8601String(),
      'added_by_user_id': addedByUserId,
    };
  }
}
