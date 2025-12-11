/**
 * Mapa de roles a español
 */
export const roleLabels: Record<string, string> = {
  superadmin: 'Super Administrador',
  admin: 'Administrador',
  client: 'Validador',
};

/**
 * Obtiene la etiqueta en español de un rol
 */
export function getRoleLabel(role: string): string {
  return roleLabels[role] || role;
}

