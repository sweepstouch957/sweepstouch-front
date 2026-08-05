import { api } from '@/libs/axios';

/**
 * Plantilla de tarea — el molde que cada área arma a su gusto.
 *
 * No es la "tarea rutinaria" vieja: de la plantilla sale una tarea normal, que
 * se ve en el board y de la que se sabe cuándo se empezó y cuándo se cerró. Y
 * se puede usar a mano ("crear a partir de esta plantilla") además de agendarse
 * sola los días que toque.
 */
export interface TaskTemplate {
  _id: string;
  name: string;
  description: string;
  icon: string;
  color: string;

  departmentId: string | null;
  departmentName: string;
  projectId: string | null;
  epicId: string | null;

  // Lo que se copia a la tarea
  title: string;
  taskDescription: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  closureCriteria: string;
  beneficiary: string;
  nextStep: string;
  impact: string;
  tags: string[];
  assigneeId: string | null;
  assigneeName: string;
  assigneeAvatar: string;
  requestType: string | null;
  /** Días hábiles hasta el vencimiento. 0 = mismo día. */
  dueInDays: number;
  /** "HH:mm" opcional. */
  dueTime: string;
  /** Pide tienda al crear (tablets, reparación, visita). */
  requiresStore: boolean;

  // Agenda
  scheduleEnabled: boolean;
  /** 0=domingo … 6=sábado. Vacío con agenda encendida = todos los días. */
  scheduleDays: number[];
  lastGeneratedFor: string | null;

  usageCount: number;
  lastUsedAt: string | null;
  active: boolean;
  createdAt: string;
  /** Lo calcula el back con días hábiles: el panel no lo recalcula. */
  nextDueDate?: string;
}

export type TemplateDto = Partial<Omit<TaskTemplate, '_id' | 'createdAt' | 'usageCount' | 'lastUsedAt' | 'lastGeneratedFor' | 'nextDueDate'>>;

export interface TagOption {
  tag: string;
  count: number;
}

/** Qué se ha hecho en una tienda: cuántas veces se fue y qué quedó abierto. */
export interface StoreHistory {
  storeId: string;
  total: number;
  shown: number;
  closed: number;
  open: number;
  lastVisit: string | null;
  tasks: {
    _id: string;
    identifier: string;
    title: string;
    status: string;
    priority: string;
    dueDate: string | null;
    startedAt: string | null;
    completedAt: string | null;
    assigneeName: string;
    tags: string[];
    createdAt: string;
  }[];
}

export const WEEKDAYS = [
  { value: 1, label: 'Lun' },
  { value: 2, label: 'Mar' },
  { value: 3, label: 'Mié' },
  { value: 4, label: 'Jue' },
  { value: 5, label: 'Vie' },
  { value: 6, label: 'Sáb' },
  { value: 0, label: 'Dom' },
];

export const TEMPLATE_ICONS = ['📋', '🎨', '📣', '🛠️', '📱', '💵', '📦', '👥', '🧾', '🚚'];

export const templateService = {
  list: async (params?: { departmentId?: string; scheduled?: boolean; all?: boolean }): Promise<TaskTemplate[]> => {
    const { data } = await api.get('/tasks/templates', {
      params: {
        ...(params?.departmentId ? { departmentId: params.departmentId } : {}),
        ...(params?.scheduled ? { scheduled: 'true' } : {}),
        ...(params?.all ? { all: 'true' } : {}),
      },
    });
    return data.data;
  },

  create: async (dto: TemplateDto): Promise<TaskTemplate> => {
    const { data } = await api.post('/tasks/templates', dto);
    return data.data;
  },

  update: async (id: string, dto: TemplateDto): Promise<TaskTemplate> => {
    const { data } = await api.patch(`/tasks/templates/${id}`, dto);
    return data.data;
  },

  /** Desactiva, no borra: las tareas que salieron de ella siguen apuntándole. */
  remove: async (id: string): Promise<void> => {
    await api.delete(`/tasks/templates/${id}`);
  },

  /** Catálogo real de tags: lo que el equipo ya usa. */
  tags: async (): Promise<TagOption[]> => {
    const { data } = await api.get('/tasks/tags');
    return data.data;
  },

  storeHistory: async (storeId: string): Promise<StoreHistory> => {
    const { data } = await api.get(`/tasks/stores/${storeId}/history`);
    return data.data;
  },

  /** Renombrar una etiqueta en todas las tareas y plantillas a la vez. */
  renameTag: async (from: string, to: string): Promise<void> => {
    await api.patch('/tasks/tags', { from, to });
  },

  removeTag: async (tag: string): Promise<void> => {
    await api.delete(`/tasks/tags/${encodeURIComponent(tag)}`);
  },
};
