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

describeIf('W014 - Contrato POST visitor_conversion_events', () => {
  it('registra evento de conversao manual de visitante para membro', async () => {
    const unique = Date.now().toString();

    const { data: gc, error: gcError } = await supabase
      .from('growth_groups')
      .select('id')
      .order('name', { ascending: true })
      .limit(1)
      .single();
    expect(gcError).toBeNull();
    expect(gc).not.toBeNull();

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .limit(1)
      .single();
    expect(userError).toBeNull();
    expect(user).not.toBeNull();

    const { data: person, error: personError } = await supabase
      .from('people')
      .insert({
        name: `Pessoa Conversao W014 ${unique}`,
        email: `w014-${unique}@example.com`,
      })
      .select('id')
      .single();
    expect(personError).toBeNull();
    expect(person).not.toBeNull();

    const { data: visitor, error: visitorError } = await supabase
      .from('visitors')
      .insert({
        gc_id: gc!.id,
        person_id: person!.id,
        status: 'active',
      })
      .select('id')
      .single();
    expect(visitorError).toBeNull();
    expect(visitor).not.toBeNull();

    const now = new Date().toISOString();
    const { data: participant, error: participantError } = await supabase
      .from('growth_group_participants')
      .insert({
        gc_id: gc!.id,
        person_id: person!.id,
        role: 'member',
        status: 'active',
        joined_at: now,
        converted_from_visitor_id: visitor!.id,
        added_by_user_id: user!.id,
      })
      .select('id')
      .single();
    expect(participantError).toBeNull();
    expect(participant).not.toBeNull();

    const { error: visitorUpdateError } = await supabase
      .from('visitors')
      .update({
        status: 'converted',
        converted_at: now,
        converted_by_user_id: user!.id,
        converted_to_participant_id: participant!.id,
      })
      .eq('id', visitor!.id);
    expect(visitorUpdateError).toBeNull();

    const { data: event, error: eventError } = await supabase
      .from('visitor_conversion_events')
      .insert({
        visitor_id: visitor!.id,
        participant_id: participant!.id,
        person_id: person!.id,
        gc_id: gc!.id,
        converted_by_user_id: user!.id,
        conversion_source: 'manual',
      })
      .select('id, visitor_id, participant_id, conversion_source')
      .single();

    expect(eventError).toBeNull();
    expect(event).not.toBeNull();
    expect(event?.visitor_id).toBe(visitor!.id);
    expect(event?.participant_id).toBe(participant!.id);
    expect(event?.conversion_source).toBe('manual');
  });
});

