import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/auth_provider.dart';
import '../providers/grupos_provider.dart';
import '../widgets/gc_card.dart';
import '../widgets/loading_indicator.dart';
import '../widgets/error_display.dart';

/// T062 - HomeScreen: Tela inicial role-based
/// Líder → lista GCs, Supervisor → dashboard, Admin → painel admin

class HomeScreen extends ConsumerWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);
    final gruposAsync = ref.watch(gruposListProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text('Olá, ${user?.nome ?? "Usuário"}'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await ref.read(authProvider.notifier).logout();
              if (context.mounted) {
                Navigator.of(context).pushReplacementNamed('/login');
              }
            },
            tooltip: 'Sair',
          ),
        ],
      ),
      body: gruposAsync.when(
        data: (grupos) {
          if (grupos.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.group_off,
                    size: 64,
                    color: Colors.grey.shade400,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Nenhum grupo encontrado',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          color: Colors.grey.shade600,
                        ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Entre em contato com seu coordenador',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Colors.grey.shade500,
                        ),
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(gruposListProvider);
            },
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: grupos.length,
              itemBuilder: (context, index) {
                return GCCard(
                  grupo: grupos[index],
                  onTap: () {
                    Navigator.of(context).pushNamed(
                      '/grupo-detail',
                      arguments: grupos[index].id,
                    );
                  },
                );
              },
            ),
          );
        },
        loading: () => const LoadingIndicator(
          message: 'Carregando grupos...',
        ),
        error: (error, stack) => ErrorDisplay(
          message: 'Erro ao carregar grupos',
          error: error.toString(),
          onRetry: () {
            ref.invalidate(gruposListProvider);
          },
        ),
      ),
      floatingActionButton: user?.isAdmin == true
          ? FloatingActionButton.extended(
              onPressed: () {
                Navigator.of(context).pushNamed('/criar-grupo');
              },
              icon: const Icon(Icons.add),
              label: const Text('Novo GC'),
            )
          : null,
    );
  }
}
