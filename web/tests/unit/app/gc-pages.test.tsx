import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import GCDetailPage from '@/app/(app)/gc/[id]/page';
import GCPage from '@/app/(app)/gc/page';
import NewMeetingPage from '@/app/(app)/meetings/new/page';

const { redirectMock, getAuthenticatedUser, createSupabaseServerClient, meetingFormSpy } = vi.hoisted(() => ({
  redirectMock: vi.fn(),
  getAuthenticatedUser: vi.fn(),
  createSupabaseServerClient: vi.fn(),
  meetingFormSpy: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: (...args: unknown[]) => redirectMock(...args),
}));

vi.mock('@/lib/supabase/server-auth', () => ({
  getAuthenticatedUser,
}));

vi.mock('@/lib/supabase/server-client', () => ({
  createSupabaseServerClient,
}));

vi.mock('@/components/meetings/MeetingForm', () => ({
  MeetingForm: (props: unknown) => {
    meetingFormSpy(props);
    return <div data-testid="meeting-form-stub">MeetingForm</div>;
  },
}));

const gcs = [
  {
    id: 'gc-1',
    name: 'GC Alpha',
    mode: 'in_person',
    address: 'Rua Um, 123',
    weekday: 2,
    time: '19:30',
    status: 'active',
  },
  {
    id: 'gc-2',
    name: 'GC Beta',
    mode: 'online',
    address: null,
    weekday: null,
    time: null,
    status: 'multiplying',
  },
];

const participantsDetailed = [
  {
    id: 'p-1',
    role: 'leader',
    status: 'active',
    joined_at: '2024-01-10T00:00:00Z',
    people: { name: 'Alice', email: 'alice@example.com', phone: '111' },
  },
  {
    id: 'p-2',
    role: 'supervisor',
    status: 'active',
    joined_at: '2024-01-11T00:00:00Z',
    people: { name: 'Bob', email: 'bob@example.com', phone: '222' },
  },
  {
    id: 'p-3',
    role: 'member',
    status: 'active',
    joined_at: '2024-01-12T00:00:00Z',
    people: { name: 'Carol', email: 'carol@example.com', phone: '333' },
  },
];

const meetings = [
  {
    id: 'meeting-1',
    datetime: '2024-02-01T19:30:00Z',
    lesson_title: 'Lição especial',
    comments: null,
    meeting_member_attendance: [{ id: 'mma-1' }],
    meeting_visitor_attendance: [{ id: 'mva-1' }],
  },
];

const chainResult = <T, U extends Record<string, unknown> = Record<string, unknown>>(data: T, extra?: U) => ({
  data,
  ...(extra ?? {}),
  eq: () => chainResult(data, extra),
  in: () => chainResult(data, extra),
  order: () => chainResult(data, extra),
  limit: () => chainResult(data, extra),
  single: () => Promise.resolve({ data: Array.isArray(data) ? data[0] : data }),
});

function createSupabaseMock() {
  const memberCounts: Record<string, number> = { 'gc-1': 10, 'gc-2': 4 };
  const visitorCounts: Record<string, number> = { 'gc-1': 3, 'gc-2': 1 };

  return {
    from: (table: string) => {
      switch (table) {
        case 'users':
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: { person_id: 'person-1' } }),
              }),
            }),
          };
        case 'growth_group_participants':
          return {
            select: (_columns?: string, options?: { count?: string }) => {
              if (options?.count) {
                return {
                  eq: (_field: string, value: string) => chainResult(null, { count: memberCounts[value] ?? 0 }),
                };
              }

              if (_columns?.includes('people')) {
                return chainResult(participantsDetailed);
              }

              return chainResult([
                { gc_id: 'gc-1', role: 'leader' },
                { gc_id: 'gc-2', role: 'member' },
              ]);
            },
          };
        case 'growth_groups':
          return {
            select: () => ({
              eq: (_field: string, value: string) => ({
                single: () => Promise.resolve({ data: gcs.find((gc) => gc.id === value) ?? null }),
              }),
              in: (_field: string, ids: string[]) => chainResult(gcs.filter((gc) => ids.includes(gc.id))),
              order: () => chainResult(gcs),
            }),
          };
        case 'visitors':
          return {
            select: (_columns?: string, options?: { count?: string }) => {
              if (options?.count) {
                return {
                  eq: (_field: string, value: string) => chainResult(null, { count: visitorCounts[value] ?? 0 }),
                };
              }

              return chainResult([]);
            },
          };
        case 'meetings':
          return {
            select: () => ({
              eq: () => ({
                order: () => ({
                  limit: () => Promise.resolve({ data: meetings }),
                }),
              }),
            }),
          };
        case 'lessons':
          return {
            select: () => ({
              order: () => Promise.resolve({ data: [{ id: 'lesson-1', title: 'Comunhão' }] }),
            }),
          };
        default:
          return { select: () => chainResult([]) };
      }
    },
  };
}

describe('GC pages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAuthenticatedUser.mockResolvedValue({ id: 'user-1' });
    createSupabaseServerClient.mockResolvedValue(createSupabaseMock());
  });

  it('lista GCs associados ao usuário com contagens e ações', async () => {
    const page = await GCPage();
    const gcLoader = page.props.children as any;
    const content = await gcLoader.type(gcLoader.props);
    render(content);

    await screen.findByText('GC Alpha');
    expect(screen.getByText('GC Beta')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();

    const meetingLinks = screen.getAllByRole('link', { name: /nova reunião/i });
    expect(meetingLinks[0]).toHaveAttribute('href', '/meetings/new?gcId=gc-1');

    expect(screen.getByText('GC Beta')).toBeInTheDocument();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it('exibe detalhes do GC com liderança, membros e reuniões recentes', async () => {
    const page = await GCDetailPage({ params: Promise.resolve({ id: 'gc-1' }) });
    render(page);

    expect(screen.getByRole('heading', { name: 'GC Alpha' })).toBeInTheDocument();
    expect(screen.getByText(/Liderança e supervisão/)).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Carol')).toBeInTheDocument();
    expect(screen.getByText(/Últimas reuniões/)).toBeInTheDocument();
    expect(screen.getByText(/Visitantes: 1/)).toBeInTheDocument();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it('pré-seleciona GC e data padrão ao criar nova reunião', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-05-06T12:00:00Z'));

    const supabaseMock = createSupabaseMock();
    createSupabaseServerClient.mockResolvedValueOnce({
      from: (table: string) => {
        if (table === 'growth_groups') {
          return {
            select: (columns?: string) => {
              if (columns?.includes('weekday')) {
                return {
                  eq: () => ({
                    single: () =>
                      Promise.resolve({ data: { id: 'gc-1', name: 'GC Alpha', weekday: 3, time: '20:00' } }),
                  }),
                };
              }

              return {
                order: () => Promise.resolve({ data: gcs }),
              };
            },
          };
        }

        if (table === 'lessons') {
          return {
            select: () => ({ order: () => Promise.resolve({ data: [{ id: 'lesson-1', title: 'Comunhão' }] }) }),
          };
        }

        return supabaseMock.from(table);
      },
    });

    const page = await NewMeetingPage({ searchParams: Promise.resolve({ gcId: 'gc-1' }) });
    const meetingLoader = page.props.children as any;
    const form = await meetingLoader.type(meetingLoader.props);
    render(form);

    const formElement = form as unknown as { props: Record<string, unknown> };
    expect(formElement.props.defaultGcId).toBe('gc-1');
    expect(formElement.props.defaultGcName).toBe('GC Alpha');
    expect(formElement.props.defaultTime).toBe('20:00');
    expect(formElement.props.defaultDate).toBe('2024-05-08');

    vi.useRealTimers();
  });
});
