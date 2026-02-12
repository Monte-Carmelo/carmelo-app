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

describeIf('W013 - Contrato GET meetings/{id}', () => {
  it('retorna reuniao com joins de presenca (membros e visitantes)', async () => {
    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    expect(meetingError).toBeNull();
    expect(meeting).not.toBeNull();

    const { data, error } = await supabase
      .from('meetings')
      .select(
        `
          id,
          gc_id,
          lesson_title,
          datetime,
          comments,
          meeting_member_attendance (
            meeting_id,
            participant_id
          ),
          meeting_visitor_attendance (
            meeting_id,
            visitor_id
          )
        `
      )
      .eq('id', meeting!.id)
      .single();

    expect(error).toBeNull();
    expect(data).not.toBeNull();
    expect(data?.id).toBe(meeting!.id);
    expect(Array.isArray(data?.meeting_member_attendance)).toBe(true);
    expect(Array.isArray(data?.meeting_visitor_attendance)).toBe(true);
  });
});

