'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useSession } from '@/lib/auth/session-context';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import {
  getLeaderDashboardData,
  type LeaderDashboardData,
} from '@/lib/api/growth-groups';

export function useLeaderDashboard() {
  const { session } = useSession();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const query = useQuery<LeaderDashboardData>({
    queryKey: ['leader-dashboard', session.user.id],
    queryFn: () => getLeaderDashboardData(supabase, session.user.id),
    staleTime: 60_000,
  });

  return {
    groups: query.data?.groups ?? [],
    upcomingMeetings: query.data?.upcomingMeetings ?? [],
    metrics: query.data?.metrics ?? {
      meetingsCurrentMonth: 0,
      averageAttendance: 0,
      conversions30d: 0,
      conversionRatePct: 0,
    },
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
  };
}
