/**
 * Quién es "equipo interno" para departamentos, tareas y proyectos.
 *
 * El rol solo no alcanza: `promotor_manager` lo tienen tanto las Promotions
 * Managers del equipo (Daniela, María Fernanda) como todos los encargados de
 * promotoras de campo, que no llevan tareas ni pertenecen a un área.
 * El corte real es estar en el catálogo del equipo — es decir, tener `position`
 * (lo pone POST /internal/team/sync) o un área ya asignada a mano.
 */

/** Roles que SIEMPRE son equipo interno. */
export const CORE_STAFF_ROLES = [
  'admin', 'design', 'campaign_manager', 'general_manager', 'marketing',
  'tecnico', 'it', 'support', 'billing', 'operations', 'assistant',
];

/** Roles internos sólo si la persona está en el catálogo del equipo. */
const CONDITIONAL_STAFF_ROLES = ['promotor_manager', 'merchant_manager'];

/** Roles que nunca entran (clientes y personal de tienda/campo). */
export const NON_STAFF_ROLES = ['merchant', 'cashier', 'promotor'];

export function isInternalStaff(user: any): boolean {
  const role = user?.role || '';
  if (NON_STAFF_ROLES.includes(role)) return false;
  if (CORE_STAFF_ROLES.includes(role)) return true;
  if (CONDITIONAL_STAFF_ROLES.includes(role)) {
    return Boolean(user?.position || user?.departmentId);
  }
  return false;
}

/** Roles a pedirle al backend (después se afina con isInternalStaff). */
export const STAFF_ROLE_QUERY = [...CORE_STAFF_ROLES, ...CONDITIONAL_STAFF_ROLES];
