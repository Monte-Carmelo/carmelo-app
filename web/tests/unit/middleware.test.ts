import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const originalSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const originalSupabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function importMiddleware() {
  vi.resetModules();
  return import('@/middleware');
}

afterEach(() => {
  if (originalSupabaseUrl) {
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalSupabaseUrl;
  } else {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  }

  if (originalSupabaseAnonKey) {
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalSupabaseAnonKey;
  } else {
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  }
});

describe('middleware', () => {
  it('redireciona rota protegida para login quando Supabase nao esta configurado', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const { middleware } = await importMiddleware();
    const response = await middleware(
      new NextRequest('http://localhost:3000/dashboard?tab=overview'),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/login?redirect=%2Fdashboard%3Ftab%3Doverview',
    );
  });

  it('mantem rota publica acessivel quando Supabase nao esta configurado', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const { middleware } = await importMiddleware();
    const response = await middleware(new NextRequest('http://localhost:3000/login'));

    expect(response.headers.get('location')).toBeNull();
  });
});
