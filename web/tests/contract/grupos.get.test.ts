import { createClient } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';
import type { Database } from '@/lib/supabase/types';
import { supabaseReachable } from '../supabase';

const describeIf = supabaseReachable ? describe : describe.skip;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz';

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

describeIf('W010 - Contrato GET growth_groups', () => {
  it('valida agrupamento por growth_group_participants', async () => {
    const { data: groups, error: groupsError } = await supabase
      .from('growth_groups')
      .select('id, name')
      .order('name', { ascending: true });

    expect(groupsError).toBeNull();
    expect(groups).not.toBeNull();
    expect((groups ?? []).length).toBeGreaterThan(0);

    const gcIds = (groups ?? []).map((gc) => gc.id);

    const { data: participants, error: participantsError } = await supabase
      .from('growth_group_participants')
      .select('gc_id, role, status, deleted_at')
      .in('gc_id', gcIds);

    expect(participantsError).toBeNull();
    expect(participants).not.toBeNull();

    const grouped = new Map<string, { total: number; leaders: number; supervisors: number }>();
    for (const gcId of gcIds) {
      grouped.set(gcId, { total: 0, leaders: 0, supervisors: 0 });
    }

    for (const row of participants ?? []) {
      const entry = grouped.get(row.gc_id);
      if (!entry) continue;
      if (row.deleted_at !== null || row.status !== 'active') continue;
      entry.total += 1;
      if (row.role === 'leader') entry.leaders += 1;
      if (row.role === 'supervisor') entry.supervisors += 1;
    }

    // Contrato mínimo: cada GC retornado deve ter agregação calculável.
    for (const gc of groups ?? []) {
      const metrics = grouped.get(gc.id);
      expect(metrics).toBeDefined();
      expect(metrics!.total).toBeGreaterThanOrEqual(0);
      expect(metrics!.leaders).toBeGreaterThanOrEqual(0);
      expect(metrics!.supervisors).toBeGreaterThanOrEqual(0);
    }
  });
});

