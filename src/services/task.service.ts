// src/services/task.service.ts
import { api } from '@/libs/axios';

/* ═══════════════ Types ═══════════════ */

export type WorkflowStatus = 'not_started' | 'in_progress' | 'completed';

/**
 * Cómo se lleva el proyecto. RCS es `milestones`: es un PROYECTO por hitos, no
 * un área ni un cargo.
 */
export type ProjectType = 'project' | 'milestones' | 'queue';

export const PROJECT_TYPE_LABEL: Record<ProjectType, string> = {
  project: 'Proyecto (tareas con entregable)',
  milestones: 'Por hitos (hito con fecha y criterio de cierre)',
  queue: 'Cola de solicitudes (con plazo comprometido)',
};

export interface ProjectMember {
  id: string;
  name: string;
  avatar: string | null;
}

export interface Project {
  _id: string;
  identifier: string; // SW-P-0001
  name: string;
  description: string;
  slug: string;
  color: string;
  status: string; // 'active' | 'archived'
  workflowStatus: WorkflowStatus;
  /** milestones = se lleva por hitos (ej. RCS) · queue = cola de solicitudes */
  type?: ProjectType;
  /** Área dueña del proyecto. Las tareas la heredan. */
  departmentId?: string | null;
  startDate: string | null;
  dueDate: string | null;
  memberIds: string[];
  ownerId: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  // Computed by API
  progress?: number;
  taskStats?: { total: number; done: number; in_progress: number };
  members?: ProjectMember[];
}

/** Estados del Manual de Cowork: backlog = respaldo, done = cerrada. */
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'blocked' | 'in_review' | 'done';

/** Tipo de solicitud de cola (Diseño / Customer Service) — define el plazo. */
export type RequestType =
  | 'messaging_art'
  | 'social_art'
  | 'event_material'
  | 'identity'
  | 'minor_fix'
  | 'support_case';

export const REQUEST_TYPE_LABEL: Record<RequestType, string> = {
  messaging_art: 'Arte de campaña (SMS/MMS/RCS) — 48 h hábiles',
  social_art: 'Pieza para redes — 48 h hábiles',
  event_material: 'Material para evento — 5 días hábiles',
  identity: 'Identidad / proyecto mayor — mín. 10 días',
  minor_fix: 'Ajuste menor — 24 h hábiles',
  support_case: 'Caso de atención — 24 h hábiles',
};

export interface TaskFile {
  url: string;
  name: string;
  type: string;
  size: number;
  at: string;
  by: string;
}

export interface Task {
  _id: string;
  identifier: string; // SW-0001
  title: string;
  description: string;
  status: TaskStatus;
  priority: 'low' | 'medium' | 'high' | 'critical';
  projectId: string;
  listId: string;
  position: number;
  assigneeId: string | null;
  assigneeName: string;
  assigneeAvatar: string;
  reporterId: string | null;
  reporterName: string;
  dueDate: string | null;
  completedAt: string | null;
  /** Cuarto campo obligatorio: cómo sabremos que quedó lista. */
  closureCriteria?: string;
  departmentId?: string | null;
  // ── Bloqueo
  blockedReason?: string;
  blockerOwner?: string;
  blockedAt?: string | null;
  wasBlocked?: boolean;
  // ── Cola de solicitudes
  requestType?: RequestType | null;
  slaDueAt?: string | null;
  requestComplete?: boolean;
  isUrgent?: boolean;
  urgentBy?: string;
  revisionRounds?: number;
  tags: string[];
  /** Evidencias subidas (imágenes/archivos). `attachments` es sólo el contador. */
  files?: TaskFile[];
  attachments: number;
  comments: number;
  progress: number;
  sub_items: number;
  aiContext: string;
  createdAt: string;
  updatedAt: string;
  /** !== 'none' ⇒ es una plantilla rutinaria: no sale en el board, se clona sola */
  recurrence?: Recurrence;
  recurrenceTemplateId?: string | null;
}

export type Recurrence = 'none' | 'daily' | 'weekdays' | 'weekly';

export const RECURRENCE_LABEL: Record<Recurrence, string> = {
  none: 'No se repite',
  daily: 'Todos los días',
  weekdays: 'Lunes a viernes',
  weekly: 'Cada semana',
};

export type RoutineTask = Task & { runsToday: boolean };

export interface BoardMember {
  id: string;
  name: string;
  avatar: string;
  role: string;
}

export interface BoardData {
  project: Project;
  lists: { id: string; name: string; color: string; taskIds: string[] }[];
  tasks: Record<string, Task>;
  members: BoardMember[];
  /** El board trae las últimas cerradas, no el histórico completo. */
  doneTotal?: number;
  doneShown?: number;
}

/** Reporte diario de Cowork (secc. 10 del manual) — datos, no texto. */
export interface CoworkReport {
  header: {
    dateKey: string;
    yesterdayKey: string;
    comparedTo: string;
    closedYesterday: number;
    closedDayBefore: number;
    delta: number;
    overdue: number;
    noDueDate: number;
    noAssignee: number;
    blocked: number;
    urgentActive: number;
    urgentLimit: number;
  };
  areas: any[];
  incomplete: { identifier: string; title: string; area: string; missing: string[] }[];
  wipViolations: { userId: string; name: string; inProgress: number; limit: number }[];
  alerts: { level: 'critical' | 'warning'; area: string; message: string }[];
  orphanTasks: number;
  isFriday: boolean;
}

export interface AiContextResponse {
  ok: boolean;
  context: string;
  stats: {
    projects: number;
    tasks: number;
    byStatus: Record<string, number>;
  };
}

/* ═══════════════ API Client ═══════════════ */

export const taskClient = {
  // ── Projects
  getProjects: async (status = 'active'): Promise<Project[]> => {
    const { data } = await api.get('/tasks/projects', { params: { status } });
    return data.data;
  },

  getProject: async (id: string): Promise<Project> => {
    const { data } = await api.get(`/tasks/projects/${id}`);
    return data.data;
  },

  createProject: async (payload: Partial<Project> & { workflowStatus?: WorkflowStatus; startDate?: string; dueDate?: string }): Promise<Project> => {
    const { data } = await api.post('/tasks/projects', payload);
    return data.data;
  },

  updateProject: async (id: string, payload: Partial<Project>): Promise<Project> => {
    const { data } = await api.patch(`/tasks/projects/${id}`, payload);
    return data.data;
  },

  deleteProject: async (id: string): Promise<void> => {
    await api.delete(`/tasks/projects/${id}`);
  },

  // ── Tasks
  getTasks: async (params?: Record<string, any>): Promise<{ data: Task[]; total: number }> => {
    const { data } = await api.get('/tasks/tasks', { params });
    return data;
  },

  getMyTasks: async (userId: string): Promise<Task[]> => {
    const { data } = await api.get('/tasks/tasks/my', { params: { userId } });
    return data.data;
  },

  getTask: async (id: string): Promise<Task> => {
    const { data } = await api.get(`/tasks/tasks/${id}`);
    return data.data;
  },

  createTask: async (payload: Partial<Task>): Promise<Task> => {
    const { data } = await api.post('/tasks/tasks', payload);
    return data.data;
  },

  updateTask: async (id: string, payload: Partial<Task>): Promise<Task> => {
    const { data } = await api.patch(`/tasks/tasks/${id}`, payload);
    return data.data;
  },

  moveTask: async (taskId: string, newStatus: string, newPosition: number): Promise<Task> => {
    const { data } = await api.post('/tasks/tasks/move', { taskId, newStatus, newPosition });
    return data.data;
  },

  deleteTask: async (id: string): Promise<void> => {
    await api.delete(`/tasks/tasks/${id}`);
  },

  // ── Rutinarias (plantillas)
  getRoutines: async (projectId?: string): Promise<RoutineTask[]> => {
    const { data } = await api.get('/tasks/tasks/routines', { params: projectId ? { projectId } : undefined });
    return data.data;
  },

  // ── Board
  getBoard: async (projectId: string, filters?: { assigneeIds?: string[]; departmentIds?: string[]; priority?: string; search?: string }): Promise<BoardData> => {
    const params: Record<string, string> = {};
    if (filters?.assigneeIds?.length) params.assigneeIds = filters.assigneeIds.join(',');
    if (filters?.departmentIds?.length) params.departmentIds = filters.departmentIds.join(',');
    if (filters?.priority && filters.priority !== 'all') params.priority = filters.priority;
    if (filters?.search) params.search = filters.search;
    const { data } = await api.get(`/tasks/board/${projectId}`, { params });
    return data.data;
  },

  /** Registra una evidencia ya subida al servicio de upload */
  addAttachment: async (
    taskId: string,
    file: { url: string; name?: string; type?: string; size?: number; by?: string }
  ): Promise<Task> => {
    const { data } = await api.post(`/tasks/tasks/${taskId}/attachments`, file);
    return data.data;
  },

  removeAttachment: async (taskId: string, url: string): Promise<Task> => {
    const { data } = await api.delete(`/tasks/tasks/${taskId}/attachments`, { params: { url } });
    return data.data;
  },

  /** "¿Cómo va RCS?" — reporte de un tema que cruza áreas y proyectos + PDF */
  getTopicReport: async (q: string): Promise<{ data: any; pdfUrl: string; text: string }> => {
    const { data } = await api.get('/tasks/reports/topic', { params: { q } });
    return data;
  },

  /** Los 2 enlaces de una tarea: panel (con login) y PDF de estado en vivo (sin login) */
  getTaskLinks: async (id: string): Promise<{ identifier: string; panel: string; pdf: string }> => {
    const { data } = await api.get(`/tasks/tasks/${id}/links`);
    return data.data;
  },

  // ── Reportes de Cowork
  getDailyReport: async (): Promise<CoworkReport> => {
    const { data } = await api.get('/tasks/reports/daily');
    return data.data;
  },

  // ── AI
  getAiContext: async (): Promise<AiContextResponse> => {
    const { data } = await api.get('/tasks/ai/context');
    return data;
  },
};
