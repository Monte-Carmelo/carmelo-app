import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { Session } from '@supabase/supabase-js';
import { SessionProvider, useSession, type SessionContextValue } from './session-context';

const sessionStub = {
  access_token: 'token',
  refresh_token: 'refresh',
  expires_in: 3600,
  token_type: 'bearer',
  user: {
    id: 'user-1',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  },
} as Session;

describe('W020 - useSession', () => {
  it('dispara erro quando usado fora do SessionProvider', () => {
    expect(() => renderHook(() => useSession())).toThrowError(/SessionProvider/);
  });

  it('retorna contexto quando usado dentro do SessionProvider', () => {
    const value: SessionContextValue = {
      session: sessionStub,
      roles: null,
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SessionProvider value={value}>{children}</SessionProvider>
    );

    const { result } = renderHook(() => useSession(), { wrapper });
    expect(result.current.session.user.id).toBe('user-1');
    expect(result.current.roles).toBeNull();
  });
});
