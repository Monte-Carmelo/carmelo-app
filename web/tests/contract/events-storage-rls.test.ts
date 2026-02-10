import { describe, expect, it } from 'vitest';
import { supabaseReachable } from '../supabase';

const describeIf = supabaseReachable ? describe : describe.skip;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

describeIf('Event Banners Storage RLS Contract Tests', () => {
  it(
    'bloqueia upload para usuário não autenticado',
    async () => {
      const path = `event-banners/rls-test/${Date.now()}-anon.txt`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      try {
        const response = await fetch(`${supabaseUrl}/storage/v1/object/${path}`, {
          method: 'POST',
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'text/plain',
          },
          body: 'anon',
          signal: controller.signal,
        });

        expect(response.ok).toBe(false);
      } finally {
        clearTimeout(timeout);
      }
    },
    10_000
  );
});
