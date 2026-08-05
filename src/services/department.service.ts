import { api } from "@/libs/axios";

/* ══════════ Types ══════════ */
/** project = tareas con entregable · queue = cola con plazo · recurring = números diarios */
export type WorkType = 'project' | 'queue' | 'recurring';

export const WORK_TYPE_LABEL: Record<WorkType, string> = {
  project: 'Proyecto',
  queue: 'Cola de solicitudes',
  recurring: 'Operación recurrente',
};

export const WORK_TYPE_HINT: Record<WorkType, string> = {
  project: 'Se mide por tareas: cerradas, vencidas y antigüedad del pendiente más viejo.',
  queue: 'Se mide por tickets y plazos: recibidas, entregadas, en riesgo y vencidas.',
  recurring: 'Se mide por números diarios contra meta. Mostrar 0 tareas cerradas es correcto.',
};

export interface Department {
  _id: string;
  name: string;
  slug: string;
  color: string;
  description: string;
  icon: string;
  /** userId del encargado del área — es a quien el bot manda cuando alguien pide ayuda */
  lead: string | null;
  leadName?: string;
  deputy?: string | null;
  deputyName?: string;
  workType: WorkType;
  /** Palabras con las que un colaborador llega a esta área por WhatsApp */
  helpTopics?: string[];
  metricLabel?: string;
  weeklyGoal?: number;
  defaultSlaDays?: number;
  activeTaskLimit?: number;
  order?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDepartmentDto {
  name: string;
  color: string;
  description?: string;
  icon?: string;
  lead?: string | null;
  deputy?: string | null;
  workType?: WorkType;
  helpTopics?: string[];
  metricLabel?: string;
  weeklyGoal?: number;
  activeTaskLimit?: number;
}

export interface UpdateDepartmentDto extends Partial<CreateDepartmentDto> {
  isActive?: boolean;
}

/* ══════════ API ══════════ */
const BASE = '/tasks/departments';

export const departmentService = {
  /** Get all active departments */
  list: async (): Promise<Department[]> => {
    const { data } = await api.get(BASE);
    return data.data;
  },

  /** Get a single department */
  get: async (id: string): Promise<Department> => {
    const { data } = await api.get(`${BASE}/${id}`);
    return data.data;
  },

  /** Create a new department */
  create: async (dto: CreateDepartmentDto): Promise<Department> => {
    const { data } = await api.post(BASE, dto);
    return data.data;
  },

  /** Update a department */
  update: async (id: string, dto: UpdateDepartmentDto): Promise<Department> => {
    const { data } = await api.patch(`${BASE}/${id}`, dto);
    return data.data;
  },

  /** Delete (soft) a department */
  remove: async (id: string): Promise<void> => {
    await api.delete(`${BASE}/${id}`);
  },

  /** Seed default departments */
  seed: async (): Promise<{ created: number; data: Department[] }> => {
    const { data } = await api.post(`${BASE}/seed`);
    return data;
  },

  /** Assign (or clear with null) a department for a user */
  assignUserToDepartment: async (userId: string, departmentId: string | null): Promise<void> => {
    await api.patch(`/auth/users/profile/${userId}`, { departmentId });
  },

  /** Encargado del área. Es lo que responde el bot en "¿a quién le escribo?" */
  setLead: async (departmentId: string, userId: string | null): Promise<Department> => {
    const { data } = await api.patch(`${BASE}/${departmentId}`, { lead: userId });
    return data.data;
  },

  /** Áreas + encargado + contacto, ya resuelto (lo mismo que usa el bot) */
  directory: async (): Promise<
    (Department & { lead: any; deputy: any })[]
  > => {
    const { data } = await api.get(`${BASE}/directory`);
    return data.data;
  },

  /** Asigna los encargados definidos en el catálogo del equipo */
  syncLeads: async (): Promise<{ assigned: any[]; skipped: any[] }> => {
    const { data } = await api.post(`${BASE}/sync-leads`);
    return data;
  },

  /** Registra el número del día de un área recurrente (Audience, Campañas) */
  logMetric: async (
    departmentId: string,
    payload: { value: number; dateKey?: string; note?: string; reportedBy?: string; reportedByName?: string }
  ): Promise<void> => {
    await api.post(`${BASE}/${departmentId}/metrics`, payload);
  },
};
