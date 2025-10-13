import 'package:flutter/material.dart';
import '../models/growth_group.dart';

/// T076 - GCCard: Card para exibir GC com resumo de métricas
class GCCard extends StatelessWidget {
  final GrowthGroup grupo;
  final VoidCallback? onTap;

  const GCCard({
    Key? key,
    required this.grupo,
    this.onTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                children: [
                  // Ícone de modalidade
                  Icon(
                    grupo.modalidade == 'presencial'
                        ? Icons.home
                        : Icons.videocam,
                    color: Colors.blue.shade700,
                  ),
                  const SizedBox(width: 12),
                  // Nome do GC
                  Expanded(
                    child: Text(
                      grupo.nome,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                  ),
                  // Status badge
                  _StatusBadge(status: grupo.status),
                ],
              ),
              const SizedBox(height: 12),

              // Informações adicionais
              if (grupo.modalidade == 'presencial' && grupo.endereco != null)
                _InfoRow(
                  icon: Icons.location_on,
                  text: grupo.endereco!,
                ),
              if (grupo.diaSemana != null && grupo.horario != null)
                _InfoRow(
                  icon: Icons.calendar_today,
                  text: _formatDiaHorario(grupo.diaSemana!, grupo.horario!),
                ),

              // Métricas (placeholder - será populado com dados reais)
              const SizedBox(height: 12),
              Row(
                children: [
                  _MetricChip(
                    icon: Icons.people,
                    label: 'Membros',
                    value: '${grupo.totalMembrosAtivos ?? 0}',
                  ),
                  const SizedBox(width: 8),
                  _MetricChip(
                    icon: Icons.event,
                    label: 'Reuniões',
                    value: '0', // TODO: buscar do dashboard
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatDiaHorario(int diaSemana, String horario) {
    const dias = [
      'Domingo',
      'Segunda',
      'Terça',
      'Quarta',
      'Quinta',
      'Sexta',
      'Sábado'
    ];
    return '${dias[diaSemana]} às $horario';
  }
}

class _StatusBadge extends StatelessWidget {
  final String status;

  const _StatusBadge({required this.status});

  @override
  Widget build(BuildContext context) {
    Color color;
    switch (status) {
      case 'ativo':
        color = Colors.green;
        break;
      case 'multiplicando':
        color = Colors.orange;
        break;
      case 'inativo':
        color = Colors.grey;
        break;
      default:
        color = Colors.grey;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Text(
        status.toUpperCase(),
        style: TextStyle(
          color: color.shade700,
          fontSize: 10,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String text;

  const _InfoRow({
    required this.icon,
    required this.text,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        children: [
          Icon(icon, size: 16, color: Colors.grey.shade600),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.grey.shade700,
                  ),
            ),
          ),
        ],
      ),
    );
  }
}

class _MetricChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _MetricChip({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.blue.shade50,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: Colors.blue.shade700),
          const SizedBox(width: 4),
          Text(
            '$value ',
            style: TextStyle(
              color: Colors.blue.shade900,
              fontWeight: FontWeight.bold,
              fontSize: 14,
            ),
          ),
          Text(
            label,
            style: TextStyle(
              color: Colors.blue.shade700,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }
}
