import { describe, expect, it } from 'vitest';
import { getGrowthGroups, getUpcomingMeetings } from '@/lib/supabase/queries/gc-dashboard';

function createSupabaseMock() {
  return {
    from: (table: string) => {
      switch (table) {
        case 'growth_groups':
          return {
            select: () => ({
              in: () => ({ order: () => Promise.resolve({ data: growthGroups, error: null }) }),
            }),
          };
        case 'growth_group_participants':
          return {
            select: (_cols: string, opts?: { count?: string }) => ({
              eq: (_field: string, value: string) => ({
                eq: () => ({
                  then: (resolve: (val: { data: null; count: number }) => void) =>
                    resolve({ data: null, count: memberCounts[value] ?? 0 }),
                }),
              }),
            }),
          };
        case 'visitors':
          return {
            select: (_cols: string, opts?: { count?: string }) => ({
              eq: (_field: string, value: string) => ({
                eq: () => ({
                  then: (resolve: (val: { data: null; count: number }) => void) =>
                    resolve({ data: null, count: visitorCounts[value] ?? 0 }),
                }),
              }),
            }),
          };
        case 'meetings':
          return {
            select: () => ({
              in: () => ({
                gte: () => ({ order: () => ({ limit: () => Promise.resolve({ data: meetings, error: null }) }) }),
              }),
            }),
          };
        default:
          return { select: () => ({}) };
      }
    },
  } as any;
}

const growthGroups = [
  { id: 'gc-1', name: 'GC A', mode: 'in_person', address: 'Rua A', weekday: 1, time: '19:00', status: 'active' },
];

const memberCounts: Record<string, number> = { 'gc-1': 5 };
const visitorCounts: Record<string, number> = { 'gc-1': 2 };

const meetings = [
  {
    id: 'm-1',
    gc_id: 'gc-1',
    lesson_title: 'Lição 1',
    datetime: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
    comments: null,
    growth_groups: { name: 'GC A' },
  },
];

describe('gc-dashboard queries', () => {
  it('monta contagens de membros e visitantes', async () => {
    const supabase = createSupabaseMock();
    const result = await getGrowthGroups(supabase, ['gc-1']);
    expect(result[0]).toMatchObject({ memberCount: 5, visitorCount: 2 });
  });

  it('formata reuniões futuras com nome do GC', async () => {
    const supabase = createSupabaseMock();
    const result = await getUpcomingMeetings(supabase, ['gc-1']);
    expect(result[0]).toMatchObject({ gc_name: 'GC A', lesson_title: 'Lição 1' });
  });
});
