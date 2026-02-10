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
    from: () => ({
      select: () => ({ order: () => Promise.resolve({ data: groups, error: null }) }),
    }),
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
