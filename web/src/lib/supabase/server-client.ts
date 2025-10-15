import 'server-only'; import { createServerClient } from '@supabase/ssr'; import { cookies } from 'next/headers'; import { env, isEnvReady } from '../env';
import type { Database } from './types';

export const createSupabaseServerClient = async (cookieStoreArg?: unknown) => {
  if (!isEnvReady) {
    throw new Error(
      'Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.',
    );
  }

  // Allow callers (Server Actions / Route Handlers) to pass the cookie store
  // when they are running in a context that permits modifying cookies.
  // If no cookie store is provided we still read cookies() for getAll(), but
  // guard set operations so they don't throw in contexts where mutation is
  // disallowed (this prevents the app from crashing with an unhandled
  // exception). Call-sites that need to modify cookies should pass the
  // `cookies()` store explicitly.
  const cookieStore = cookieStoreArg ?? (await cookies());
  const allowSet = cookieStoreArg != null;
  type CookiePair = { name: string; value: string };
  type CookieStoreLike = { getAll?: () => CookiePair[] | null | Promise<CookiePair[] | null>; set?: (name: string, value: string, options?: Record<string, unknown>) => void };
  const cs = cookieStore as unknown as CookieStoreLike;

  return createServerClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        // Prefer the provided API, fall back to getAll if available
        try {
          const res = cs.getAll ? cs.getAll() : [];
          return res as CookiePair[] | null;
        } catch (err) {
          // Be defensive — return empty array if something unexpected happens
          console.warn('Failed to read cookies.getAll():', String(err));
          return [];
        }
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          try {
            // Only attempt to set cookies when the caller explicitly passed
            // a cookie store (Server Action / Route Handler). In other server
            // contexts the Next runtime will throw when trying to modify
            // cookies; avoid that by no-op'ing here.
            if (allowSet && typeof cs.set === 'function') {
              // Some implementations expect (name, value, options)
              cs.set(name, value, options);
            } else {
              // No-op if not allowed
              if (!allowSet) {
                // Intentionally silent in normal server components, but
                // warn in development to aid debugging.
                if (process.env.NODE_ENV !== 'production') {
                  console.warn('Skipping cookie.set in non-Server-Action context for', name);
                }
              } else {
                console.warn('cookieStore.set is not available in this context; cookie not set', name);
              }
            }
          } catch (err) {
            // Common Next.js error message when trying to set cookies in
            // unsupported contexts. Don't rethrow — just log so app keeps running.
            console.warn(`Ignored cookie set for "${name}" because it cannot be modified in this context:`, String(err));
          }
        });
      },
    },
  });
};
