// src/services/calendar.service.ts — calendario de eventos y activaciones (task-service /calendar)
import { api } from '@/libs/axios';

/* ═══════════════ Types ═══════════════ */

export type EventType =
  | 'aniversario'
  | 'activacion'
  | 'visita'
  | 'reunion'
  | 'feriado'
  | 'festividad'
  | 'cultural'
  | 'comercial'
  | 'otro';

export type EventStatus = 'confirmado' | 'por_confirmar' | 'cancelado' | 'finalizado';

/** event = propio del calendario · task = tarea de Cowork con tienda · visit = visita de soporte */
export type EventSource = 'event' | 'task' | 'visit';

export interface EventStore {
  storeId: string | null;
  storeName: string;
  storeAddress: string;
  contact: string;
  confirmed: boolean;
}

export interface EventParticipant {
  userId: string;
  name: string;
  email: string;
  phone: string;
  /** owner | area | direccion | manual */
  source: string;
}

export interface EventReport {
  numbers: number | null;
  note: string;
  evidence: string[];
  at: string | null;
}

export interface CalendarEvent {
  _id: string;
  source: EventSource;
  type: EventType;
  title: string;
  identifier?: string;
  /** YYYY-MM-DD */
  date: string;
  endDate: string;
  startTime: string;
  endTime: string;
  status: EventStatus;
  description: string;
  stores: EventStore[];
  ownerId: string | null;
  ownerName: string;
  createdBy?: string;
  createdById?: string | null;
  /** El backend lo calcula: admin o quien lo creó */
  canEdit?: boolean;
  departmentId: string | null;
  departmentName?: string;
  extraUserIds?: string[];
  /** Quitados a mano de los involucrados automáticos */
  excludedUserIds?: string[];
  checklist?: ChecklistItem[];
  participants: EventParticipant[];
  cancelReason?: string;
  report?: EventReport;
  remindersSent?: { stage: string; at: string; to: number }[];
  link: string;
  taskId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type ChecklistStatus = 'pendiente' | 'listo' | 'emergencia';
export interface ChecklistItem {
  label: string;
  status: ChecklistStatus;
  note?: string;
  /** URLs de fotos/archivos que prueban que quedó listo */
  evidence?: string[];
}

export interface ChecklistTemplate {
  _id: string;
  name: string;
  items: string[];
}

export interface EventPayload {
  title: string;
  type: EventType;
  date: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  status: EventStatus;
  description?: string;
  stores?: EventStore[];
  extraUserIds?: string[];
  /** Quitados a mano de los involucrados automáticos */
  excludedUserIds?: string[];
  checklist?: ChecklistItem[];
  cancelReason?: string;
  report?: { numbers: number | null; note: string; evidence: string[] };
  ownerId?: string | null;
  ownerName?: string;
  /** Quien lo carga (sólo al crear) */
  createdBy?: string;
  /** false = guardar sin avisar a los involucrados */
  notify?: boolean;
}

export interface ImportCandidate {
  _id: string;
  title: string;
  identifier?: string;
  date: string;
  type: EventType;
  /** done = ya hecha (entra como confirmado) */
  status?: string;
  assigneeName?: string;
}

/* ═══════════════ API ═══════════════ */

const BASE = '/tasks/calendar';

export const calendarService = {
  /** Feed unificado (eventos + tareas de tienda + visitas) entre dos fechas. */
  feed: async (from: string, to: string): Promise<CalendarEvent[]> => {
    const { data } = await api.get(`${BASE}/events`, { params: { from, to } });
    return data.data;
  },

  upcoming: async (days = 14): Promise<CalendarEvent[]> => {
    const { data } = await api.get(`${BASE}/upcoming`, { params: { days } });
    return data.data;
  },

  get: async (id: string): Promise<CalendarEvent> => {
    const { data } = await api.get(`${BASE}/events/${id}`);
    return data.data;
  },

  create: async (payload: EventPayload): Promise<CalendarEvent> => {
    const { data } = await api.post(`${BASE}/events`, payload);
    return data.data;
  },

  update: async (id: string, payload: Partial<EventPayload>): Promise<CalendarEvent> => {
    const { data } = await api.patch(`${BASE}/events/${id}`, payload);
    return data.data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`${BASE}/events/${id}`);
  },

  /** Reenvía el aviso por WhatsApp y correo a todos los involucrados. */
  notify: async (
    id: string,
    message?: string
  ): Promise<{ sent: number; people: EventParticipant[] }> => {
    const { data } = await api.post(`${BASE}/events/${id}/notify`, { message });
    return data;
  },

  /** Tareas que parecen eventos y aún no están en el calendario (sólo admin/Dirección: 403 si no). */
  importCandidates: async (): Promise<ImportCandidate[]> => {
    const { data } = await api.get(`${BASE}/import-candidates`);
    return data.data;
  },

  importTasks: async (taskIds: string[]): Promise<{ created: number }> => {
    const { data } = await api.post(`${BASE}/import-tasks`, { taskIds });
    return data;
  },

  /** Plantillas de checklist (la primera vez el backend crea 3 de base). */
  checklistTemplates: async (): Promise<ChecklistTemplate[]> => {
    const { data } = await api.get(`${BASE}/checklist-templates`);
    return data.data;
  },

  /** Crea o reemplaza por nombre: así se edita una plantilla. */
  saveChecklistTemplate: async (t: { name: string; items: string[]; updatedBy?: string }) => {
    const { data } = await api.put(`${BASE}/checklist-templates`, t);
    return data.data as ChecklistTemplate;
  },

  removeChecklistTemplate: async (id: string) => {
    await api.delete(`${BASE}/checklist-templates/${id}`);
  },

  seed: async (): Promise<{ created: number }> => {
    const { data } = await api.post(`${BASE}/seed`);
    return data;
  },
};
