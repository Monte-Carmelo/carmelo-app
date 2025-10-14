const requiredEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};

export const env = {
  supabaseUrl: requiredEnv.supabaseUrl ?? '',
  supabaseAnonKey: requiredEnv.supabaseAnonKey ?? '',
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  posthogKey: process.env.NEXT_PUBLIC_POSTHOG_KEY,
  posthogHost: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  sentryDsn: process.env.SENTRY_DSN,
};

export const isEnvReady = Boolean(env.supabaseUrl && env.supabaseAnonKey);

if (!isEnvReady && typeof window === 'undefined') {
  console.warn(
    'Variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY não definidas. Configure-as antes de iniciar o app.',
  );
}
