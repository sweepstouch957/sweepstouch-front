import { UserRole } from "@/contexts/auth/user";

export type MenuItem = {
  title: string;
  route?: string;
  icon?: React.ReactNode;
  subMenu?: MenuItem[];
  roles?: UserRole[]; // Roles permitidos para este ítem
  badgeCount?: number; // Contador opcional (ej. notificaciones)
  hidden?: boolean; // Controla si el ítem está visible
  order?: number;
};
