import type { QueryClient } from '@tanstack/react-query';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import {
  createMeeting as createMeetingMutation,
  type CreateMeetingInput,
  type CreateMeetingResult,
} from '@/lib/supabase/mutations/meetings';

type RegisterMeetingInput = CreateMeetingInput & {
  userId: string;
  queryClient?: QueryClient;
};

async function invalidateMeetingQueries(
  queryClient: QueryClient,
  gcId: string,
  userId: string,
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['leader-dashboard', userId] }),
    queryClient.invalidateQueries({ queryKey: ['meetings'] }),
    queryClient.invalidateQueries({ queryKey: ['gc', gcId] }),
  ]);
}

export async function registerMeeting(input: RegisterMeetingInput): Promise<CreateMeetingResult> {
  const supabase = getSupabaseBrowserClient();

  const result = await createMeetingMutation(supabase, {
    gcId: input.gcId,
    lessonTemplateId: input.lessonTemplateId,
    lessonTitle: input.lessonTitle,
    datetime: input.datetime,
    comments: input.comments,
    registeredByUserId: input.registeredByUserId,
    memberAttendance: input.memberAttendance,
    visitorAttendance: input.visitorAttendance,
  });

  if (result.success && input.queryClient) {
    await invalidateMeetingQueries(input.queryClient, input.gcId, input.userId);
  }

  return result;
}
