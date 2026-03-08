import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const pingTimeoutMs = 2000;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and anon key are required.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export const supabaseReachable = await (async () => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), pingTimeoutMs);
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'HEAD',
      headers: {
        apikey: supabaseAnonKey,
      },
      signal: controller.signal,
    });
    return Boolean(response);
  } catch (error) {
    console.warn('Supabase não acessível para testes de contrato. Rode `supabase start` e tente novamente.');
    return false;
  } finally {
    clearTimeout(timeout);
  }
})();
