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

describeIf('W011 - Contrato POST growth_group_participants', () => {
  it('aceita papel valido e rejeita papel invalido', async () => {
    const unique = Date.now().toString();

    const { data: person, error: personError } = await supabase
      .from('people')
      .insert({
        name: `Pessoa Contrato W011 ${unique}`,
        email: `w011-${unique}@example.com`,
      })
      .select('id')
      .single();

    expect(personError).toBeNull();
    expect(person).not.toBeNull();

    const { data: group, error: groupError } = await supabase
      .from('growth_groups')
      .select('id')
      .order('name', { ascending: true })
      .limit(1)
      .single();

    expect(groupError).toBeNull();
    expect(group).not.toBeNull();

    const { data: validInsert, error: validError } = await supabase
      .from('growth_group_participants')
      .insert({
        gc_id: group!.id,
        person_id: person!.id,
        role: 'member',
        status: 'active',
      })
      .select('id, role, status')
      .single();

    expect(validError).toBeNull();
    expect(validInsert).not.toBeNull();
    expect(validInsert?.role).toBe('member');
    expect(validInsert?.status).toBe('active');

    const { error: invalidRoleError } = await supabase.from('growth_group_participants').insert({
      gc_id: group!.id,
      person_id: person!.id,
      role: 'invalid_role' as never,
      status: 'active',
    });

    expect(invalidRoleError).not.toBeNull();
  });
});

