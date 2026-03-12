import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { AdminUserCreateForm } from '@/components/admin/AdminUserCreateForm';

const { backMock, replaceMock, createUserMock } = vi.hoisted(() => ({
  backMock: vi.fn(),
  replaceMock: vi.fn(),
  createUserMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    back: backMock,
    replace: replaceMock,
  }),
}));

vi.mock('@/app/(app)/admin/actions', () => ({
  createUser: createUserMock,
}));

describe('AdminUserCreateForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createUserMock.mockResolvedValue({
      success: true,
      userId: 'user-123',
    });
  });

  it('permite criar usuário sem preencher telefone', async () => {
    render(<AdminUserCreateForm />);

    await userEvent.type(screen.getByLabelText(/nome completo/i), 'Maria sem Telefone');
    await userEvent.type(screen.getByLabelText(/^e-mail$/i), 'maria.sem.telefone@example.com');
    await userEvent.type(screen.getByLabelText(/senha temporária/i), 'senha123456');
    await userEvent.type(screen.getByLabelText(/confirmar senha/i), 'senha123456');

    await userEvent.click(screen.getByRole('button', { name: /criar usuário/i }));

    await waitFor(() => {
      expect(createUserMock).toHaveBeenCalledWith({
        name: 'Maria sem Telefone',
        email: 'maria.sem.telefone@example.com',
        phone: null,
        password: 'senha123456',
        isAdmin: false,
      });
      expect(replaceMock).toHaveBeenCalledWith('/admin/users/user-123?created=true');
    });
  });
});
