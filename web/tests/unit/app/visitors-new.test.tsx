import { Suspense } from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import NewVisitorPage from '@/app/(app)/visitors/new/page';

const { getAuthenticatedUser, createSupabaseServerClient } = vi.hoisted(() => ({
  getAuthenticatedUser: vi.fn(),
  createSupabaseServerClient: vi.fn(),
}));

vi.mock('next/navigation', () => ({ redirect: vi.fn() }));
vi.mock('@/lib/supabase/server-auth', () => ({ getAuthenticatedUser }));
vi.mock('@/lib/supabase/server-client', () => ({ createSupabaseServerClient }));

vi.mock('@/components/visitors/VisitorForm', () => ({
  VisitorForm: ({ groups, preselectedGcId }: any) => (
    <div data-testid="visitor-form-stub">{groups.length}:{preselectedGcId}</div>
  ),
}));

const groups = [
  { id: 'gc-1', name: 'GC Alpha' },
  { id: 'gc-2', name: 'GC Beta' },
];

function supabaseMock() {
  return {
    from: () => ({
      select: () => ({ order: () => Promise.resolve({ data: groups, error: null }) }),
    }),
  } as any;
}

describe('NewVisitorPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAuthenticatedUser.mockResolvedValue({ id: 'user-1' });
    createSupabaseServerClient.mockResolvedValue(supabaseMock());
  });

  it('carrega form com grupos e gc preselecionado', async () => {
    const page = await NewVisitorPage({ searchParams: Promise.resolve({ gcId: 'gc-2' }) });
    const visitorLoader = page.props.children as any;
    const content = await visitorLoader.type(visitorLoader.props);
    render(content);
    expect(screen.getByTestId('visitor-form-stub').textContent).toContain('2:gc-2');
  });

  it('renderiza página com suspense wrapper', async () => {
    const page = await NewVisitorPage({ searchParams: Promise.resolve({}) });
    expect(page.type).toBe(Suspense);
    render(page.props.fallback);
    expect(screen.getByLabelText(/Carregando/)).toBeInTheDocument();
  });
});
