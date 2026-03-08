import { createBrowserClient } from '@supabase/ssr';
import { assertSupabaseEnv, env } from '../env';
import type { Database } from './types';

let browserClient: ReturnType<typeof createBrowserClient<Database>>;

export const getSupabaseBrowserClient = () => {
  if (!browserClient) {
    assertSupabaseEnv('inicializar o cliente do navegador');

    browserClient = createBrowserClient<Database>(
      env.supabaseUrl,
      env.supabaseAnonKey,
      {
        auth: {
          persistSession: true,
        },
      },
    );
  }

  return browserClient;
};
