# Pesquisa Técnica: App de Gestão de Grupos de Crescimento

**Feature**: 001-crie-um-app
**Data**: 2025-10-04
**Referência**: [plan.md](./plan.md)

## Resumo Executivo

Este documento consolida as decisões técnicas para implementação do app móvel de gestão de GCs usando Flutter + Supabase. Todas as decisões foram tomadas priorizando: (1) velocidade de desenvolvimento, (2) offline-first capability, (3) escalabilidade da hierarquia organizacional, (4) segurança via RLS.

---

## 1. Flutter + Supabase Integration

### Decisão
Utilizar **Supabase Flutter SDK oficial** (`supabase_flutter: ^2.0.0+`) com autenticação email/senha via Supabase Auth.

### Rationale
- SDK oficial tem suporte completo a auth, realtime, storage e edge functions
- Supabase Auth já implementa hashing seguro (bcrypt), rate limiting, email verification
- Reduz código boilerplate vs implementação manual de backend
- Flutter SDK tem integração nativa com sqflite para offline storage

### Alternativas Consideradas
| Alternativa | Razão para Rejeição |
|-------------|---------------------|
| Firebase + Flutter | Supabase oferece PostgreSQL (mais flexível para queries hierárquicas complexas) e é open-source |
| Backend custom (Node/Nest.js) | Tempo de desenvolvimento muito maior; Supabase já fornece auth, realtime, RLS out-of-the-box |
| Amplify + Flutter | Vendor lock-in AWS; Supabase tem melhor DX para developers |

### Implementação Chave
```dart
// supabase/config.dart
import 'package:supabase_flutter/supabase_flutter.dart';

await Supabase.initialize(
  url: SUPABASE_URL,
  anonKey: SUPABASE_ANON_KEY,
  authOptions: FlutterAuthClientOptions(
    authFlowType: AuthFlowType.pkce, // Segurança adicional
  ),
);

final supabase = Supabase.instance.client;
```

---

## 2. Hierarquia Organizacional Expansível

### Decisão
Usar **Adjacency List** com **Materialized Path** como índice auxiliar para queries de subárvore.

### Rationale
- Adjacency List (`parent_id`) é simples e permite N níveis sem limite
- Materialized Path (`hierarchy_path` ex: `/1/3/7`) otimiza queries "todos descendentes de X" (LIKE '/1/3/%')
- PostgreSQL Common Table Expressions (CTEs recursivas) suportam bem adjacency list
- RLS policies podem usar `hierarchy_path` para filtragem eficiente

### Alternativas Consideradas
| Alternativa | Razão para Rejeição |
|-------------|---------------------|
| Nested Sets | Dificulta inserções frequentes (requer renumeração); overkill para hierarquia que cresce incrementalmente |
| Closure Table | Tabela extra com todas relações ancestrais; overhead de storage/manutenção para estrutura que pode ter 10+ níveis |
| JSON/JSONB column | Queries hierárquicas menos eficientes; sem FK constraints |

### Schema (simplificado)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  hierarchy_parent_id UUID REFERENCES users(id),
  hierarchy_path TEXT, -- ex: '/uuid1/uuid2/uuid3'
  hierarchy_depth INT DEFAULT 0, -- Profundidade na árvore (0=raiz, 1+= níveis abaixo)
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- IMPORTANTE: Papéis (líder, supervisor, coordenador) são DERIVADOS de relacionamentos,
-- não armazenados como campo estático. Um usuário pode acumular múltiplos papéis.
-- Ver data-model.md seção "Modelo de Papéis Acumulados" para detalhes.

-- Trigger para auto-atualizar hierarchy_path ao inserir/atualizar parent_id
CREATE OR REPLACE FUNCTION update_hierarchy_path() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.hierarchy_parent_id IS NULL THEN
    NEW.hierarchy_path := '/' || NEW.id::TEXT;
  ELSE
    SELECT hierarchy_path || '/' || NEW.id::TEXT
    INTO NEW.hierarchy_path
    FROM users
    WHERE id = NEW.hierarchy_parent_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_hierarchy_path
BEFORE INSERT OR UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_hierarchy_path();
```

### Query Exemplo: "Todos GCs sob coordenador X"
```sql
-- Usando materialized path
SELECT gc.*
FROM growth_groups gc
JOIN users leader ON gc.lider_id = leader.id
JOIN users supervisor ON gc.supervisor_id = supervisor.id
WHERE supervisor.hierarchy_path LIKE (
  SELECT hierarchy_path || '%' FROM users WHERE id = 'coordenador_x_id'
);
```

---

## 3. Row Level Security (RLS) Policies

### Decisão
Implementar **RLS nativo do PostgreSQL** para todas as tabelas principais, com policies baseadas em `hierarchy_path` e `is_admin`.

### Rationale
- Segurança no nível de dados (mesmo se app Flutter for comprometido, backend está protegido)
- Supabase gerencia JWT automaticamente, RLS usa `auth.uid()` e `auth.jwt()`
- Escala melhor que lógica de permissão no app layer

### Políticas Principais
```sql
-- Exemplo: Líderes só veem seus próprios GCs
CREATE POLICY "lideres_veem_proprios_gcs" ON growth_groups
FOR SELECT USING (
  lider_id = auth.uid()
  OR
  supervisor_id IN (
    SELECT id FROM users
    WHERE hierarchy_path LIKE (
      SELECT hierarchy_path || '%' FROM users WHERE id = auth.uid()
    )
  )
);

-- Admins veem tudo
CREATE POLICY "admins_veem_tudo" ON growth_groups
FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
);
```

---

## 4. Offline-First com Sincronização

### Decisão
Usar **sqflite** para armazenamento local + **Supabase Realtime** para sincronização bidirecional.

### Rationale
- Líderes precisam registrar reuniões mesmo offline (contexto: reuniões são semanais, podem acontecer em locais sem internet)
- sqflite é padrão do ecossistema Flutter para SQLite local
- Supabase Realtime (baseado em Postgres LISTEN/NOTIFY) sincroniza mudanças assim que app volta online
- Conflict resolution: last-write-wins com timestamp (reuniões raramente têm edições concorrentes)

### Estratégia de Sync
```dart
class SyncService {
  // 1. Salvar localmente (sqflite) SEMPRE
  Future<void> createMeeting(Meeting meeting) async {
    await localDb.insert('meetings', meeting.toJson());

    // 2. Tentar sync imediatamente se online
    if (await connectivity.isOnline) {
      await _syncToSupabase(meeting);
    } else {
      // 3. Marcar como pending sync
      await localDb.insert('sync_queue', {
        'table': 'meetings',
        'record_id': meeting.id,
        'operation': 'INSERT',
      });
    }
  }

  // 4. Background sync quando volta online
  Future<void> processSyncQueue() async {
    final pending = await localDb.query('sync_queue');
    for (var item in pending) {
      await _syncToSupabase(item);
      await localDb.delete('sync_queue', where: 'id = ?', whereArgs: [item['id']]);
    }
  }
}
```

### Alternativas Consideradas
| Alternativa | Razão para Rejeição |
|-------------|---------------------|
| Apenas online (sem offline) | FR-003 requer registro de reuniões; contexto de uso (igrejas) frequentemente tem conectividade ruim |
| Drift (moor) | Overkill para nosso schema; sqflite + generated code é suficiente |
| Hive/ObjectBox | Não-relacional dificulta queries hierárquicas; queremos manter mental model consistente com PostgreSQL |

---

## 5. State Management

### Decisão
Usar **Riverpod 2.x** com `StateNotifierProvider` para lógica de negócio e `FutureProvider` para data fetching.

### Rationale
- Riverpod é compile-safe (vs Provider que tem erros em runtime)
- Ótima integração com testing (mocking providers é trivial)
- Evita boilerplate do Bloc sem perder testabilidade
- Community momentum forte no ecossistema Flutter 2024+

### Alternativas Consideradas
| Alternativa | Razão para Rejeição |
|-------------|---------------------|
| Provider (original) | Riverpod resolve problemas de tipo safety e permite múltiplos providers do mesmo tipo |
| Bloc | Muito boilerplate para escopo do projeto; Riverpod oferece ~80% dos benefícios com menos código |
| GetX | Mágica demais (service locator global); dificulta testing e manutenção |

### Exemplo
```dart
final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(ref.read(supabaseProvider));
});

final gruposProvider = FutureProvider.family<List<GrowthGroup>, String?>((ref, supervisorId) async {
  final supabase = ref.watch(supabaseProvider);
  return supabase.from('growth_groups')
    .select()
    .eq('supervisor_id', supervisorId ?? ref.watch(authProvider).user!.id)
    .execute()
    .then((res) => (res.data as List).map((e) => GrowthGroup.fromJson(e)).toList());
});
```

---

## 6. Conversão Automática de Visitantes

### Decisão
Implementar via **PostgreSQL Trigger** que verifica `visit_count` ao inserir `meeting_attendance` e atualiza tabela `visitors`.

### Rationale
- Lógica de negócio crítica fica no banco (não depende de app Flutter estar online)
- Trigger é atômico (não há race condition)
- Parametrizável via tabela `config` (threshold de visitas)

### Implementação
```sql
CREATE TABLE config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL
);

INSERT INTO config VALUES ('visitor_conversion_threshold', '3');

CREATE OR REPLACE FUNCTION auto_convert_visitor() RETURNS TRIGGER AS $$
DECLARE
  threshold INT;
  current_count INT;
BEGIN
  -- Apenas para visitantes (não membros)
  IF NEW.visitor_id IS NOT NULL THEN
    -- Buscar threshold
    SELECT (value::TEXT)::INT INTO threshold
    FROM config WHERE key = 'visitor_conversion_threshold';

    -- Contar visitas do visitante
    SELECT COUNT(*) INTO current_count
    FROM meeting_attendance
    WHERE visitor_id = NEW.visitor_id;

    -- Se atingiu threshold, converter
    IF current_count >= threshold THEN
      UPDATE visitors
      SET converted_to_member_at = NOW(),
          converted_by_user_id = NEW.meeting_id -- (meeting tem registrado_por_user_id)
      WHERE id = NEW.visitor_id;

      -- Criar membro (lógica adicional pode ser edge function)
      -- Por simplicidade, trigger apenas marca conversão
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_visitor_conversion
AFTER INSERT ON meeting_attendance
FOR EACH ROW EXECUTE FUNCTION auto_convert_visitor();
```

### Alternativas Consideradas
| Alternativa | Razão para Rejeição |
|-------------|---------------------|
| Edge Function (Deno) | Triggers são mais rápidos; edge functions adicionam latência de rede |
| Lógica no app Flutter | Não funciona offline; visitante poderia atingir threshold sem conversão se líder registrar offline |

---

## 7. Dashboards e Métricas

### Decisão
Criar **PostgreSQL Views** para métricas agregadas + **caching no app** (TTL 5 minutos).

### Rationale
- Views pré-computam joins complexos (frequência média, crescimento, conversão)
- Supabase expõe views como endpoints REST automaticamente
- Caching reduz calls desnecessários (dashboards raramente mudam a cada segundo)

### View Exemplo: Métrica de Frequência
```sql
CREATE VIEW dashboard_metricas AS
SELECT
  gc.id as gc_id,
  gc.nome as gc_nome,
  COUNT(DISTINCT m.id) as total_reunioes_mes_atual,
  AVG(attendance_count.count) as media_presenca,
  (
    SELECT COUNT(*) FROM members WHERE gc_id = gc.id AND status = 'ativo'
  ) as total_membros_ativos,
  (
    SELECT COUNT(*) FROM visitors v
    JOIN meeting_attendance ma ON ma.visitor_id = v.id
    JOIN meetings m2 ON m2.id = ma.meeting_id
    WHERE m2.gc_id = gc.id
      AND v.converted_to_member_at IS NOT NULL
      AND v.converted_to_member_at >= NOW() - INTERVAL '30 days'
  ) as conversoes_ultimo_mes
FROM growth_groups gc
LEFT JOIN meetings m ON m.gc_id = gc.id
  AND m.data_hora >= DATE_TRUNC('month', NOW())
LEFT JOIN LATERAL (
  SELECT COUNT(*) as count
  FROM meeting_attendance
  WHERE meeting_id = m.id
) attendance_count ON true
GROUP BY gc.id;
```

### Caching no App
```dart
class DashboardCache {
  DateTime? _lastFetch;
  List<Metrica>? _cachedData;
  static const cacheDuration = Duration(minutes: 5);

  Future<List<Metrica>> getMetricas({bool forceRefresh = false}) async {
    if (!forceRefresh &&
        _cachedData != null &&
        _lastFetch != null &&
        DateTime.now().difference(_lastFetch!) < cacheDuration) {
      return _cachedData!;
    }

    _cachedData = await supabase.from('dashboard_metricas').select().execute();
    _lastFetch = DateTime.now();
    return _cachedData!;
  }
}
```

---

## 8. Testing Strategy

### Decisão
Pirâmide de testes: **70% unit** (models, services) + **20% widget** (screens críticas) + **10% integration** (user flows E2E).

### Rationale
- Unit tests são rápidos e cobrem lógica de negócio
- Widget tests validam UI sem precisar de Supabase real
- Integration tests garantem que fluxos críticos funcionam ponta-a-ponta

### Ferramentas
- **mockito**: Mock Supabase client para unit/widget tests
- **integration_test**: E2E tests rodando em emulador/device
- **Supabase local**: Docker compose com Postgres local para integration tests (CI/CD)

### Exemplo: Mock Supabase
```dart
class MockSupabaseClient extends Mock implements SupabaseClient {}

void main() {
  late MockSupabaseClient mockSupabase;
  late AuthService authService;

  setUp(() {
    mockSupabase = MockSupabaseClient();
    authService = AuthService(mockSupabase);
  });

  test('login com credenciais válidas retorna user', () async {
    when(mockSupabase.auth.signInWithPassword(
      email: 'test@test.com',
      password: 'senha123',
    )).thenAnswer((_) async => AuthResponse(/* mock data */));

    final user = await authService.login('test@test.com', 'senha123');
    expect(user, isNotNull);
  });
}
```

---

## 9. Performance & Constraints

### Decisões
| Constraint | Solução |
|------------|---------|
| <500ms carregamento listas | Pagination (limit 50), indexes em FKs, views para joins complexos |
| <200ms ações locais | Sqflite local, UI otimista (atualiza UI antes de sync) |
| 60fps UI | Usar `ListView.builder` (lazy load), evitar rebuilds desnecessários (Riverpod select) |
| <100MB storage local | Cleanup automático de reuniões >1 ano (configurável), compressão de imagens (se futuro) |

---

## 10. Segurança

### Decisões
| Ameaça | Mitigação |
|--------|-----------|
| SQL Injection | Supabase client usa prepared statements; RLS valida no DB layer |
| XSS (mobile context) | Sanitização de inputs em forms (Flutter validators) |
| Credential stuffing | Rate limiting no Supabase Auth (built-in: 5 tentativas/hora) |
| Privilege escalation | RLS policies testadas via contract tests; `is_admin` flag protegida por RLS |
| Data leakage | HTTPS only (Supabase enforced), sensitive data em tabelas separadas com RLS stricto |

---

## Sumário de Decisões

| Decisão | Tecnologia/Padrão | Justificativa Chave |
|---------|-------------------|---------------------|
| Frontend | Flutter 3.x | Multiplataforma, performance nativa, ecosystem maduro |
| Backend | Supabase (PostgreSQL) | Reduz tempo dev, RLS nativo, realtime out-of-box |
| Auth | Supabase Auth (email/senha) | Seguro, rate limiting, fácil integração |
| State Mgmt | Riverpod 2.x | Type-safe, testável, menos boilerplate que Bloc |
| Offline | sqflite + sync queue | Requisito crítico (FR-003), conflict resolution simples |
| Hierarquia | Adjacency List + Materialized Path | N níveis, queries eficientes, RLS-friendly |
| Visitor Conversion | PostgreSQL Trigger | Atômico, offline-safe, parametrizável |
| Dashboards | PostgreSQL Views + cache | Performance, reduz lógica no app |
| Testing | Unit (mockito) + Widget + Integration | Cobertura balanceada, CI-friendly |

---

**Status**: ✅ Todas decisões técnicas consolidadas. Pronto para Phase 1 (data-model, contracts, quickstart).
