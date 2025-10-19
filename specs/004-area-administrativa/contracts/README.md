# API Contracts: Área Administrativa

**Feature**: 004-area-administrativa
**Date**: 2025-10-18
**Language**: Brazilian Portuguese (pt-BR) with English code

---

## Overview

Este documento consolida os contratos de queries do Supabase client para a área administrativa. Como usamos Supabase (não REST API customizada), os "contratos" definem:
- Queries esperadas (select, insert, update, delete)
- Estrutura de dados retornados
- Validações de input (Zod schemas)
- Tratamento de erros

**Arquivos detalhados** (ver subdiretórios para contratos completos):
- `admin-gc-queries.md` - Gestão de GCs
- `admin-lessons-queries.md` - Séries e lições
- `admin-reports-queries.md` - Relatórios e métricas

---

## Princípios

1. **Server Components para queries iniciais**: Usar `createSupabaseServerClient()` para buscar dados na primeira renderização
2. **Client Components para mutações**: Usar `getSupabaseBrowserClient()` para create/update/delete
3. **Validação com Zod**: Todos os inputs de formulário validados antes de submissão
4. **Tratamento de erros**: Sempre verificar `error` retornado e exibir feedback ao usuário
5. **Transações**: Operações complexas (multiplicação) executadas em sequência com rollback manual em caso de falha

---

## 1. Gestão de Grupos de Crescimento

### 1.1 Listar Todos os GCs (com líderes e supervisores)

**Endpoint**: `/admin/growth-groups/page.tsx` (server component)

**Query**:
```typescript
import { createSupabaseServerClient } from '@/lib/supabase/server-client';

const supabase = await createSupabaseServerClient();

const { data: gcs, error } = await supabase
  .from('growth_groups')
  .select(`
    id,
    name,
    mode,
    status,
    weekday,
    time,
    address,
    created_at,
    growth_group_participants!inner (
      id,
      role,
      status,
      people (
        id,
        name,
        email,
        phone
      )
    ),
    meetings (
      id,
      datetime
    )
  `)
  .is('deleted_at', null)
  .order('name', { ascending: true });

// Processar para agrupar:
// - leaders: participants com role = 'leader' ou 'co_leader'
// - supervisors: participants com role = 'supervisor'
// - memberCount: total de participants com status = 'active'
// - lastMeeting: MAX(meetings.datetime)
```

**Retorno Esperado**:
```typescript
type GCWithRelations = {
  id: string;
  name: string;
  mode: 'in_person' | 'online' | 'hybrid';
  status: 'active' | 'inactive' | 'multiplying';
  weekday: number | null;
  time: string | null;
  address: string | null;
  created_at: string;
  leaders: { id: string; name: string; role: 'leader' | 'co_leader' }[];
  supervisors: { id: string; name: string }[];
  memberCount: number;
  lastMeeting: string | null;
};
```

### 1.2 Criar GC (com transação)

**Endpoint**: `/admin/growth-groups/new/page.tsx` (client component action)

**Input Validation (Zod)**:
```typescript
import { z } from 'zod';

const createGCSchema = z.object({
  name: z.string().min(3, 'Nome muito curto').max(255),
  mode: z.enum(['in_person', 'online', 'hybrid']),
  address: z.string().optional(),
  weekday: z.number().int().min(0).max(6).nullable(),
  time: z.string().nullable(),
  leaderId: z.string().uuid('Líder obrigatório'),
  coLeaderId: z.string().uuid().optional(),
  supervisorIds: z.array(z.string().uuid()).min(1, 'Pelo menos 1 supervisor'),
  memberIds: z.array(z.string().uuid()).optional(),
}).refine(
  (data) => data.mode !== 'in_person' || data.address,
  { message: 'Endereço obrigatório para modo presencial', path: ['address'] }
);

type CreateGCInput = z.infer<typeof createGCSchema>;
```

**Query (Transação Manual)**:
```typescript
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';

async function createGC(input: CreateGCInput, userId: string) {
  const supabase = getSupabaseBrowserClient();

  // Step 1: Criar GC
  const { data: gc, error: gcError } = await supabase
    .from('growth_groups')
    .insert({
      name: input.name,
      mode: input.mode,
      address: input.address || null,
      weekday: input.weekday,
      time: input.time,
      status: 'active',
    })
    .select('id')
    .single();

  if (gcError) {
    throw new Error(`Erro ao criar GC: ${gcError.message}`);
  }

  // Step 2: Inserir participantes
  const participants = [
    { gc_id: gc.id, person_id: input.leaderId, role: 'leader', status: 'active', joined_at: new Date().toISOString(), added_by_user_id: userId },
    ...(input.coLeaderId ? [{ gc_id: gc.id, person_id: input.coLeaderId, role: 'co_leader', status: 'active', joined_at: new Date().toISOString(), added_by_user_id: userId }] : []),
    ...input.supervisorIds.map(id => ({ gc_id: gc.id, person_id: id, role: 'supervisor', status: 'active', joined_at: new Date().toISOString(), added_by_user_id: userId })),
    ...(input.memberIds || []).map(id => ({ gc_id: gc.id, person_id: id, role: 'member', status: 'active', joined_at: new Date().toISOString(), added_by_user_id: userId })),
  ];

  const { error: participantsError } = await supabase
    .from('growth_group_participants')
    .insert(participants);

  if (participantsError) {
    // Rollback manual: deletar GC criado
    await supabase.from('growth_groups').delete().eq('id', gc.id);
    throw new Error(`Erro ao adicionar participantes: ${participantsError.message}`);
  }

  return gc.id;
}
```

### 1.3 Multiplicar GC (Transação Complexa)

**Input Validation**:
```typescript
const multiplyGCSchema = z.object({
  originalGcId: z.string().uuid(),
  newGCs: z.array(z.object({
    name: z.string().min(3).max(255),
    mode: z.enum(['in_person', 'online', 'hybrid']),
    address: z.string().optional(),
    weekday: z.number().int().min(0).max(6).nullable(),
    time: z.string().nullable(),
    leaderId: z.string().uuid(),
    supervisorIds: z.array(z.string().uuid()).min(1),
  })).min(1).max(3, 'Máximo 3 novos GCs por multiplicação'),
  memberAllocations: z.record(
    z.string().uuid(), // participant_id
    z.enum(['original', 'new_0', 'new_1', 'new_2']) // destino
  ),
  keepOriginalActive: z.boolean(),
  notes: z.string().optional(),
});
```

**Query (Transação Multi-Step)**:
```typescript
async function multiplyGC(input: z.infer<typeof multiplyGCSchema>, userId: string) {
  const supabase = getSupabaseBrowserClient();
  const now = new Date().toISOString();
  const createdGcIds: string[] = [];

  try {
    // Step 1: Update original GC status to 'multiplying'
    const { error: updateError } = await supabase
      .from('growth_groups')
      .update({ status: 'multiplying', updated_at: now })
      .eq('id', input.originalGcId);

    if (updateError) throw new Error(`Step 1 failed: ${updateError.message}`);

    // Step 2: Create new GCs
    for (const newGcData of input.newGCs) {
      const { data: newGc, error: createError } = await supabase
        .from('growth_groups')
        .insert({
          name: newGcData.name,
          mode: newGcData.mode,
          address: newGcData.address || null,
          weekday: newGcData.weekday,
          time: newGcData.time,
          status: 'active',
        })
        .select('id')
        .single();

      if (createError) throw new Error(`Step 2 failed: ${createError.message}`);
      createdGcIds.push(newGc.id);
    }

    // Step 3: Transfer members
    const transferredIds: string[] = [];
    const newParticipants: any[] = [];

    Object.entries(input.memberAllocations).forEach(([participantId, destination]) => {
      if (destination !== 'original') {
        transferredIds.push(participantId);

        const newGcIndex = parseInt(destination.split('_')[1]);
        newParticipants.push({
          gc_id: createdGcIds[newGcIndex],
          person_id: participantId,  // Assumindo que participantId é person_id (ajustar se necessário)
          role: 'member',  // Ajustar roles conforme necessário
          status: 'active',
          joined_at: now,
          added_by_user_id: userId,
        });
      }
    });

    // Mark transferred members as 'transferred'
    if (transferredIds.length > 0) {
      const { error: transferError } = await supabase
        .from('growth_group_participants')
        .update({ status: 'transferred', left_at: now, updated_at: now })
        .in('id', transferredIds);

      if (transferError) throw new Error(`Step 3a failed: ${transferError.message}`);
    }

    // Create participants in new GCs
    if (newParticipants.length > 0) {
      const { error: insertError } = await supabase
        .from('growth_group_participants')
        .insert(newParticipants);

      if (insertError) throw new Error(`Step 3b failed: ${insertError.message}`);
    }

    // Step 4: Insert multiplication event
    const { error: eventError } = await supabase
      .from('gc_multiplication_events')
      .insert({
        original_gc_id: input.originalGcId,
        new_gc_ids: createdGcIds,
        multiplied_by_user_id: userId,
        multiplied_at: now,
        notes: input.notes || null,
      });

    if (eventError) throw new Error(`Step 4 failed: ${eventError.message}`);

    // Step 5: Finalize original GC status
    const finalStatus = input.keepOriginalActive ? 'active' : 'inactive';
    const { error: finalizeError } = await supabase
      .from('growth_groups')
      .update({ status: finalStatus, updated_at: now })
      .eq('id', input.originalGcId);

    if (finalizeError) throw new Error(`Step 5 failed: ${finalizeError.message}`);

    return { success: true, newGcIds: createdGcIds };

  } catch (error) {
    // Manual rollback (Supabase client não suporta transações atômicas diretas)
    console.error('Multiplicação falhou, tentando rollback:', error);

    // Rollback: deletar GCs criados
    if (createdGcIds.length > 0) {
      await supabase.from('growth_groups').delete().in('id', createdGcIds);
    }

    // Restaurar status original
    await supabase
      .from('growth_groups')
      .update({ status: 'active', updated_at: now })
      .eq('id', input.originalGcId);

    throw error;
  }
}
```

---

## 2. Gestão de Lições e Séries

### 2.1 Listar Séries com Lições

```typescript
const { data: series, error } = await supabase
  .from('lesson_series')
  .select(`
    id,
    name,
    description,
    created_at,
    users!created_by_user_id (
      id,
      people (name)
    ),
    lessons (
      id,
      title,
      description,
      order_in_series,
      link
    )
  `)
  .order('created_at', { ascending: false });

// Ordenar lições por order_in_series
series?.forEach(s => {
  s.lessons.sort((a, b) => (a.order_in_series || 0) - (b.order_in_series || 0));
});
```

### 2.2 Reordenar Lições

```typescript
const reorderLessonsSchema = z.object({
  seriesId: z.string().uuid(),
  lessonOrder: z.array(z.object({
    lessonId: z.string().uuid(),
    newOrder: z.number().int().positive(),
  })),
});

async function reorderLessons(input: z.infer<typeof reorderLessonsSchema>) {
  const supabase = getSupabaseBrowserClient();

  // Atualizar cada lição (não há batch update no Supabase client)
  for (const item of input.lessonOrder) {
    const { error } = await supabase
      .from('lessons')
      .update({ order_in_series: item.newOrder, updated_at: new Date().toISOString() })
      .eq('id', item.lessonId)
      .eq('series_id', input.seriesId);

    if (error) {
      throw new Error(`Erro ao reordenar lição ${item.lessonId}: ${error.message}`);
    }
  }
}
```

---

## 3. Relatórios e Métricas

### 3.1 Métricas do Dashboard

```typescript
async function getDashboardMetrics() {
  const supabase = await createSupabaseServerClient();

  // Executar queries em paralelo
  const [usersResult, gcsResult, membersResult, visitorsResult] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('growth_groups').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('growth_group_participants').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('visitors').select('id', { count: 'exact', head: true }).eq('status', 'active'),
  ]);

  return {
    totalUsers: usersResult.count || 0,
    activeGCs: gcsResult.count || 0,
    activeMembers: membersResult.count || 0,
    activeVisitors: visitorsResult.count || 0,
  };
}
```

### 3.2 Crescimento Temporal (por mês)

```typescript
async function getGrowthReport(startDate: string, endDate: string) {
  const supabase = await createSupabaseServerClient();

  // Query para crescimento de membros por mês
  const { data, error } = await supabase.rpc('get_member_growth_by_month', {
    start_date: startDate,
    end_date: endDate,
  });

  // Nota: Requer criar função RPC no Supabase:
  // CREATE OR REPLACE FUNCTION get_member_growth_by_month(start_date date, end_date date)
  // RETURNS TABLE(month date, total_members bigint) AS $$
  // SELECT
  //   date_trunc('month', joined_at)::date as month,
  //   COUNT(*) as total_members
  // FROM growth_group_participants
  // WHERE joined_at BETWEEN start_date AND end_date
  //   AND status = 'active'
  // GROUP BY month
  // ORDER BY month;
  // $$ LANGUAGE SQL;

  if (error) throw new Error(`Erro ao buscar crescimento: ${error.message}`);
  return data;
}
```

---

## Tratamento de Erros Padrão

```typescript
async function handleSupabaseError(error: any, context: string) {
  console.error(`[${context}] Erro Supabase:`, error);

  // Mapear erros comuns
  if (error.code === '23505') {
    return { success: false, message: 'Registro duplicado' };
  }
  if (error.code === '23503') {
    return { success: false, message: 'Referência inválida' };
  }
  if (error.code === '42P01') {
    return { success: false, message: 'Tabela não encontrada (erro de migração?)' };
  }

  return { success: false, message: error.message || 'Erro desconhecido' };
}
```

---

## Resumo de Validações Zod

Todos os formulários admin devem usar Zod para validação client-side:

- **CreateGC**: nome, mode, address (condicional), leaderId, supervisorIds (min 1)
- **MultiplyGC**: newGCs (1-3), memberAllocations (todos alocados), keepOriginalActive
- **CreateSeries**: name, description (opcional), lessons (opcional)
- **ReorderLessons**: seriesId, lessonOrder (array de {lessonId, newOrder})

**Pattern Comum**:
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const form = useForm<CreateGCInput>({
  resolver: zodResolver(createGCSchema),
  defaultValues: { ... },
});

const onSubmit = form.handleSubmit(async (values) => {
  try {
    await createGC(values, session.user.id);
    toast.success('GC criado com sucesso!');
    router.push('/admin/growth-groups');
  } catch (error) {
    toast.error(`Erro: ${error.message}`);
  }
});
```

---

**Version**: 1.0
**Last Updated**: 2025-10-18
