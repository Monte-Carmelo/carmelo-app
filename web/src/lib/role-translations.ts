/**
 * Tradução de papéis (roles) do sistema para português brasileiro
 */

type Role = 'leader' | 'member' | 'supervisor' | 'coordinator' | string;

const roleTranslations: Record<string, string> = {
  leader: 'Líder',
  member: 'Membro',
  supervisor: 'Supervisor',
  coordinator: 'Coordenador',
};

/**
 * Traduz um papel (role) do inglês para português brasileiro
 * @param role - O papel em inglês
 * @returns O papel traduzido em português, ou o valor original se não houver tradução
 */
export function translateRole(role: Role): string {
  return roleTranslations[role.toLowerCase()] || role;
}

/**
 * Traduz e formata um papel para exibição
 * @param role - O papel em inglês
 * @returns O papel traduzido e formatado
 */
export function formatRole(role: Role): string {
  return translateRole(role);
}
