import { createBrowserClient } from '@supabase/ssr';
import { env, isEnvReady } from '../env';
import type { Database } from './types';

let browserClient: ReturnType<typeof createBrowserClient<Database>>;

export const getSupabaseBrowserClient = () => {
  if (!browserClient) {
    if (!isEnvReady) {
      throw new Error(
        'Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.',
      );
    }

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
