import { api } from '@/libs/axios';

/**
 * Una épica agrupa tareas que persiguen lo mismo ("Manual de marca", "RCS").
 * No es un tablero aparte: las tareas siguen en su proyecto y su área.
 */
export interface Epic {
  _id: string;
  name: string;
  description: string;
  color: string;
  projectId: string | null;
  departmentId: string | null;
  ownerId: string | null;
  ownerName: string;
  dueDate: string | null;
  status: 'open' | 'done' | 'archived';
  createdAt: string;
  // Calculados por la API
  total: number;
  done: number;
  blocked: number;
  overdue: number;
  progress: number;
}

export type EpicDto = Partial<Pick<Epic,
  'name' | 'description' | 'color' | 'projectId' | 'departmentId' | 'ownerId' | 'ownerName' | 'status'
>> & { dueDate?: string | null };

export const EPIC_COLORS = [
  '#5569ff', '#E91E63', '#FF9800', '#4CAF50',
  '#9C27B0', '#00BCD4', '#F44336', '#795548',
];

export const epicService = {
  list: async (projectId?: string): Promise<Epic[]> => {
    const { data } = await api.get('/tasks/epics', { params: projectId ? { projectId } : undefined });
    return data.data;
  },

  get: async (id: string) => {
    const { data } = await api.get(`/tasks/epics/${id}`);
    return data.data;
  },

  create: async (dto: EpicDto): Promise<Epic> => {
    const { data } = await api.post('/tasks/epics', dto);
    return data.data;
  },

  update: async (id: string, dto: EpicDto): Promise<Epic> => {
    const { data } = await api.patch(`/tasks/epics/${id}`, dto);
    return data.data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/tasks/epics/${id}`);
  },
};
