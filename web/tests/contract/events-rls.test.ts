import { createClient } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';
import { supabaseReachable } from '../supabase';

const describeIf = supabaseReachable ? describe : describe.skip;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function client() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      storageKey: `events-rls-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    },
  });
}

describeIf('Events RLS Contract Tests', () => {
  it('permite SELECT público apenas de eventos ativos', async () => {
    const supabase = client();
    const { data, error } = await supabase
      .from('events')
      .select('id, deleted_at')
      .limit(20);

    expect(error).toBeNull();
    expect(data).not.toBeNull();
    const rows = (data ?? []) as Array<{ deleted_at: string | null }>;
    expect(rows.every((row) => row.deleted_at === null)).toBe(true);
  });

  it('bloqueia INSERT de evento para usuário não autenticado', async () => {
    const supabase = client();
    const { error } = await supabase.from('events').insert({
      title: `RLS test ${Date.now()}`,
      event_date: '2099-01-01',
      created_by_user_id: '00000000-0000-0000-0000-000000000000',
      status: 'scheduled',
    });

    expect(error).not.toBeNull();
  });
});
