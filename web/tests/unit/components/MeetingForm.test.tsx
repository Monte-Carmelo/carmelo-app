import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import { MeetingForm } from '@/components/meetings/MeetingForm';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock('@/lib/supabase/browser-client', () => ({
  getSupabaseBrowserClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            order: () => ({
              order: () => Promise.resolve({ data: [], error: null }),
            }),
          }),
        }),
      }),
      insert: () => ({
        select: () => ({
          single: () =>
            Promise.resolve({
              data: { id: 'meeting-1' },
              error: null,
            }),
        }),
      }),
    }),
  }),
}));

const baseProps = {
  userId: 'user-1',
  groups: [{ id: 'gc-1', name: 'GC Esperança' }],
  lessonTemplates: [{ id: 'lesson-1', title: 'Lição 1' }],
};

function renderWithProviders() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MeetingForm {...baseProps} />
    </QueryClientProvider>,
  );
}

describe('MeetingForm', () => {
  it('mostra o formulário padrão com seleção de lição do catálogo', () => {
    renderWithProviders();

    // GC select e campos básicos
    expect(screen.getByLabelText(/grupo de crescimento/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/data/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/horário/i)).toBeInTheDocument();

    // Seleção de lição do catálogo é o modo padrão
    expect(screen.getByRole('button', { name: /lição do catálogo/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/selecione a lição/i)).toBeInTheDocument();
  });

  it('exibe campo de título personalizado ao escolher lição custom', async () => {
    renderWithProviders();

    await userEvent.click(screen.getByRole('button', { name: /título personalizado/i }));

    expect(
      screen.getByPlaceholderText(/culto especial de natal, estudo sobre oração/i),
    ).toBeInTheDocument();
  });

  it('mostra erros de validação quando campos obrigatórios não são preenchidos', async () => {
    renderWithProviders();

    await userEvent.click(screen.getByRole('button', { name: /registrar reunião/i }));

    await waitFor(() => {
      expect(screen.getByText(/selecione um gc/i)).toBeInTheDocument();
      expect(
        screen.getByText(/selecione uma lição do catálogo ou informe um título personalizado/i),
      ).toBeInTheDocument();
    });
  });
});
