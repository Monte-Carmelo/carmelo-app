import 'server-only';
import { createSupabaseServerClient } from './server-client';

/**
 * Obtém o usuário autenticado de forma segura.
 * Usa auth.getUser() que valida o token com o servidor Supabase,
 * ao invés de getSession() que apenas lê do storage local.
 *
 * @returns User object ou null se não autenticado
 */
export async function getAuthenticatedUser() {
  const supabase = await createSupabaseServerClient();

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * Requer autenticação - lança erro se usuário não estiver autenticado.
 * Útil para páginas que DEVEM ter um usuário logado.
 *
 * @throws Error se não autenticado
 * @returns User object garantido
 */
export async function requireAuth() {
  const user = await getAuthenticatedUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  return user;
}

/**
 * Verifica se há um usuário autenticado.
 * Útil para layouts que precisam saber se há sessão ativa.
 *
 * @returns true se autenticado, false caso contrário
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getAuthenticatedUser();
  return user !== null;
}
