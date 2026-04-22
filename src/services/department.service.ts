import { api } from "@/libs/axios";

/* ══════════ Types ══════════ */
export interface Department {
  _id: string;
  name: string;
  slug: string;
  color: string;
  description: string;
  icon: string;
  lead: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDepartmentDto {
  name: string;
  color: string;
  description?: string;
  icon?: string;
  lead?: string;
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
};
