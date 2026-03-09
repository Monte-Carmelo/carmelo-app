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

describeIf('W012 - Contrato POST meetings', () => {
  it('cria reuniao com lesson_title, comentarios e presencas de membro/visitante', async () => {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .limit(1)
      .single();
    expect(userError).toBeNull();
    expect(user).not.toBeNull();

    const { data: participant, error: participantError } = await supabase
      .from('growth_group_participants')
      .select('id, gc_id')
      .eq('role', 'member')
      .eq('status', 'active')
      .limit(1)
      .single();
    expect(participantError).toBeNull();
    expect(participant).not.toBeNull();

    const gcId = participant!.gc_id;

    const { data: existingVisitor, error: visitorFetchError } = await supabase
      .from('visitors')
      .select('id')
      .eq('gc_id', gcId)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle();
    expect(visitorFetchError).toBeNull();

    let visitorId = existingVisitor?.id;
    if (!visitorId) {
      const unique = Date.now().toString();
      const { data: person, error: personError } = await supabase
        .from('people')
        .insert({
          name: `Visitante Contrato W012 ${unique}`,
          email: `w012-${unique}@example.com`,
        })
        .select('id')
        .single();
      expect(personError).toBeNull();
      expect(person).not.toBeNull();

      const { data: createdVisitor, error: visitorCreateError } = await supabase
        .from('visitors')
        .insert({
          gc_id: gcId,
          person_id: person!.id,
          status: 'active',
        })
        .select('id')
        .single();
      expect(visitorCreateError).toBeNull();
      expect(createdVisitor).not.toBeNull();
      visitorId = createdVisitor!.id;
    }

    const lessonTitle = `Contrato W012 ${Date.now()}`;
    const comments = 'Cobertura de contrato para criacao de reuniao.';

    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .insert({
        gc_id: gcId,
        lesson_template_id: null,
        lesson_title: lessonTitle,
        datetime: new Date().toISOString(),
        comments,
        registered_by_user_id: user!.id,
      })
      .select('id, lesson_title, comments')
      .single();

    expect(meetingError).toBeNull();
    expect(meeting).not.toBeNull();
    expect(meeting?.lesson_title).toBe(lessonTitle);
    expect(meeting?.comments).toBe(comments);

    const { error: memberAttendanceError } = await supabase.from('meeting_member_attendance').insert({
      meeting_id: meeting!.id,
      participant_id: participant!.id,
    });
    expect(memberAttendanceError).toBeNull();

    const { error: visitorAttendanceError } = await supabase.from('meeting_visitor_attendance').insert({
      meeting_id: meeting!.id,
      visitor_id: visitorId!,
    });
    expect(visitorAttendanceError).toBeNull();
  });
});
