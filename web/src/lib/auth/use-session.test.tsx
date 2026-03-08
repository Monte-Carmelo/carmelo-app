import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { User } from '@supabase/supabase-js';
import { SessionProvider, useSession, type SessionContextValue } from './session-context';

const userStub = {
  id: 'user-1',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
} as User;

describe('W020 - useSession', () => {
  it('dispara erro quando usado fora do SessionProvider', () => {
    expect(() => renderHook(() => useSession())).toThrowError(/SessionProvider/);
  });

  it('retorna contexto quando usado dentro do SessionProvider', () => {
    const value: SessionContextValue = {
      user: userStub,
      roles: null,
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SessionProvider value={value}>{children}</SessionProvider>
    );

    const { result } = renderHook(() => useSession(), { wrapper });
    expect(result.current.user.id).toBe('user-1');
    expect(result.current.roles).toBeNull();
  });
});
