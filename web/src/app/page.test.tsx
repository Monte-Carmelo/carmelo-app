import { redirect } from 'next/navigation';
import Home from './page';

vi.mock('next/navigation', () => ({
  redirect: vi.fn(() => {
    throw new Error('NEXT_REDIRECT');
  }),
}));

describe('Home', () => {
  it('redireciona direto para o login', () => {
    expect(() => Home()).toThrow('NEXT_REDIRECT');
    expect(redirect).toHaveBeenCalledWith('/login');
  });
});
