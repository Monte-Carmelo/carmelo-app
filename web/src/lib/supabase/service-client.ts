import 'server-only';

import { createClient } from '@supabase/supabase-js';

import { assertSupabaseEnv, env } from '../env';
import type { Database } from './types';

let serviceClient: ReturnType<typeof createClient<Database>> | null = null;

export const getSupabaseServiceClient = () => {
  assertSupabaseEnv('inicializar o cliente de serviço');

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
