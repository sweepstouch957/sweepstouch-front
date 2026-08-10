/**
 * Espejo de STAFF_ROLES + roles externos del user model
 * (backend/packages/@sweepstouch/mongoose-kit/src/user.model.js).
 * Si agregás un rol allá, agregalo acá: `roleMenus` en use-routes.tsx es un
 * Record completo, así que TypeScript no compila hasta que tenga menú. Sin eso
 * el rol nuevo entra al panel sin sección Management y parece que no existe.
 */
export type UserRole =
  | 'admin'
  | 'design'
  | 'cashier'
  | 'merchant'
  | 'promotor'
  | 'campaign_manager'
  | 'promotor_manager'
  | 'general_manager'
  | 'merchant_manager'
  | 'marketing'
  | 'tecnico'
  | 'it'
  | 'support'
  | 'billing'
  | 'operations'
  | 'assistant';


export interface User {
  id: string;
  avatar: string | null;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  role: UserRole;
  phoneNumber?: string;
  countryCode?: string;
  profileImage?: string;
  address?: string;
  storeId?: string;
  departmentId?: string;
  department?: { _id: string; name: string; color: string; icon: string };
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastLogin?: string;
}
