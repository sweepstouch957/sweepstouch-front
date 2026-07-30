import { api } from '@/libs/axios';

/* ══════════ Types ══════════ */

export interface TeamPerson {
  id: string;
  name: string;
  /** Cargo real (Jefe de Operaciones, Diseñador…). No es el rol de permisos. */
  position: string;
  role: string;
  roleLabel: string;
  department: string;
  departmentId: string | null;
  email: string;
  phone: string;
  reportsTo: string;
  supportAreas: string[];
  description: string;
  active: boolean;
}

export interface TeamSyncResult {
  applied: boolean;
  updated: number;
  people: { id: string; name: string; position: string; department: string }[];
  /** Cargos del catálogo que todavía no tienen usuario en la plataforma */
  notFound: { name: string; position: string }[];
  hint: string;
}

/* ══════════ API ══════════ */

const BASE = '/team';

export const teamService = {
  /** Organigrama resuelto contra la BD */
  org: async (): Promise<{ people: TeamPerson[]; missing: { name: string; position: string }[] }> => {
    const { data } = await api.get(`${BASE}/org`);
    return { people: data.people || [], missing: data.missing || [] };
  },

  /**
   * Escribe cargo, área, jefe y descripción sobre los usuarios del catálogo.
   * Sin `apply` es simulación: dice qué haría sin tocar nada.
   */
  sync: async (apply = false): Promise<TeamSyncResult> => {
    const { data } = await api.post(`${BASE}/sync${apply ? '?apply=true' : ''}`);
    return data;
  },
};
