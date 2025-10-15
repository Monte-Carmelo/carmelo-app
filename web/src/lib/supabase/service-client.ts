import 'server-only';

import { createClient } from '@supabase/supabase-js';

import { env, isEnvReady } from '../env';
import type { Database } from './types';

let serviceClient: ReturnType<typeof createClient<Database>> | null = null;

export const getSupabaseServiceClient = () => {
  if (!isEnvReady) {
    throw new Error(
      'Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.',
    );
  }

  if (!env.serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY não configurada.');
  }

  if (!serviceClient) {
    serviceClient = createClient<Database>(env.supabaseUrl, env.serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return serviceClient;
};
