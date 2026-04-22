// src/services/task.service.ts
import { api } from '@/libs/axios';

/* ═══════════════ Types ═══════════════ */

export type WorkflowStatus = 'not_started' | 'in_progress' | 'completed';

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

export interface Task {
  _id: string;
  identifier: string; // SW-0001
  title: string;
  description: string;
  status: 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done';
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
  tags: string[];
  attachments: number;
  comments: number;
  progress: number;
  sub_items: number;
  aiContext: string;
  createdAt: string;
  updatedAt: string;
}

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

  // ── AI
  getAiContext: async (): Promise<AiContextResponse> => {
    const { data } = await api.get('/tasks/ai/context');
    return data;
  },
};
