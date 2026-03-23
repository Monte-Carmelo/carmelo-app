import { Suspense } from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import NewParticipantPage from '@/app/(app)/participants/new/page';

const { getAuthenticatedUser, createSupabaseServerClient } = vi.hoisted(() => ({
  getAuthenticatedUser: vi.fn(),
  createSupabaseServerClient: vi.fn(),
}));

vi.mock('next/navigation', () => ({ redirect: vi.fn() }));
vi.mock('@/lib/supabase/server-auth', () => ({ getAuthenticatedUser }));
vi.mock('@/lib/supabase/server-client', () => ({ createSupabaseServerClient }));

vi.mock('@/components/participants/ParticipantForm', () => ({
  ParticipantForm: ({ groups, preselectedGcId }: any) => (
    <div data-testid="participant-form-stub">{groups.length}:{preselectedGcId}</div>
  ),
}));

const groups = [
  { id: 'gc-1', name: 'GC Alpha' },
];

function supabaseMock() {
  return {
    from: (table: string) => {
      switch (table) {
        case 'users':
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: () =>
                  Promise.resolve({
                    data: { person_id: 'person-1', is_admin: false },
                    error: null,
                  }),
              }),
            }),
          };
        case 'growth_group_participants':
          return {
            select: () => {
              const result = Promise.resolve({ data: [{ gc_id: 'gc-1' }], error: null }) as Promise<unknown> & {
                eq: ReturnType<typeof vi.fn>;
                in: ReturnType<typeof vi.fn>;
                is: ReturnType<typeof vi.fn>;
              };
              result.eq = vi.fn(() => result);
              result.in = vi.fn(() => result);
              result.is = vi.fn(() => result);
              return result;
            },
          };
        case 'growth_groups':
          return {
            select: () => {
              const result = Promise.resolve({ data: groups, error: null }) as Promise<unknown> & {
                in: ReturnType<typeof vi.fn>;
                neq: ReturnType<typeof vi.fn>;
                order: ReturnType<typeof vi.fn>;
              };
              result.in = vi.fn(() => result);
              result.neq = vi.fn(() => result);
              result.order = vi.fn(() => result);
              return result;
            },
          };
        default:
          return { select: () => ({ order: () => Promise.resolve({ data: [], error: null }) }) };
      }
    },
  } as any;
}

describe('NewParticipantPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAuthenticatedUser.mockResolvedValue({ id: 'user-1' });
    createSupabaseServerClient.mockResolvedValue(supabaseMock());
  });

  it('carrega form com GC preselecionado', async () => {
    const page = await NewParticipantPage({ searchParams: Promise.resolve({ gcId: 'gc-1' }) });
    const participantLoader = page.props.children as any;
    const content = await participantLoader.type(participantLoader.props);
    render(content);
    expect(screen.getByTestId('participant-form-stub').textContent).toContain('1:gc-1');
  });

  it('mostra suspense na página', async () => {
    const page = await NewParticipantPage({ searchParams: Promise.resolve({}) });
    expect(page.type).toBe(Suspense);
    render(page.props.fallback);
    expect(screen.getByLabelText(/Carregando/)).toBeInTheDocument();
  });
});
