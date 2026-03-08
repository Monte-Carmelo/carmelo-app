const requiredClientEnv = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};

export const missingSupabaseEnvVars = Object.entries(requiredClientEnv)
  .filter(([, value]) => !value)
  .map(([key]) => key);

export const env = {
  supabaseUrl: requiredClientEnv.NEXT_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: requiredClientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  posthogKey: process.env.NEXT_PUBLIC_POSTHOG_KEY,
  posthogHost: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  sentryDsn: process.env.SENTRY_DSN,
};

export const isEnvReady = missingSupabaseEnvVars.length === 0;

let hasWarnedAboutMissingSupabaseEnv = false;

export function getMissingSupabaseEnvMessage(context = 'executar a aplicação') {
  return [
    `Supabase não configurado para ${context}.`,
    `Defina ${missingSupabaseEnvVars.join(', ')} em .env.local ou no ambiente de execução.`,
  ].join(' ');
}

export function assertSupabaseEnv(context?: string) {
  if (!isEnvReady) {
    throw new Error(getMissingSupabaseEnvMessage(context));
  }
}

if (
  !isEnvReady &&
  !hasWarnedAboutMissingSupabaseEnv &&
  typeof window === 'undefined' &&
  process.env.NODE_ENV !== 'test'
) {
  hasWarnedAboutMissingSupabaseEnv = true;
  console.warn(
    getMissingSupabaseEnvMessage('iniciar o app'),
  );
}
