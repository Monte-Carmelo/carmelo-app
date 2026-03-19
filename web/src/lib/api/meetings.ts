import type { QueryClient } from '@tanstack/react-query';
import {
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
  const response = await fetch('/api/meetings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      gcId: input.gcId,
      lessonTemplateId: input.lessonTemplateId ?? null,
      lessonTitle: input.lessonTitle,
      datetime: input.datetime,
      comments: input.comments ?? null,
      memberAttendance: input.memberAttendance ?? [],
      visitorAttendance: input.visitorAttendance ?? [],
    }),
  });

  const result = (await response.json().catch(() => null)) as CreateMeetingResult | null;

  if (!response.ok || !result?.success) {
    return {
      success: false,
      error: result?.error ?? 'Falha ao criar reunião',
    };
  }

  if (result.success && input.queryClient) {
    await invalidateMeetingQueries(input.queryClient, input.gcId, input.userId);
  }

  return result;
}
