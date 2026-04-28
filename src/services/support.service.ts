import { api } from '@/libs/axios';

/* ═══════════════════════════════════
   Types
   ═══════════════════════════════════ */

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';
export type TicketType =
  | 'software'
  | 'hardware'
  | 'connectivity'
  | 'peripheral'
  | 'remote'
  | 'installation'
  | 'uninstallation'
  | 'reconfiguration'
  | 'other';

export type VisitStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type VisitType =
  | 'visita_rutina'
  | 'visita_extraordinaria'
  | 'instalacion'
  | 'desinstalacion'
  | 'reconfiguracion'
  | 'soporte_remoto';

export interface SupportTicket {
  _id: string;
  identifier: string;
  title: string;
  description: string;
  type: TicketType;
  status: TicketStatus;
  priority: TicketPriority;
  storeId: string | null;
  storeName: string;
  storeAddress: string;
  assigneeId: string | null;
  assigneeName: string;
  reporterId: string | null;
  reporterName: string;
  notes: string;
  resolvedAt: string | null;
  closedAt: string | null;
  visitId: string | null;
  evidenceUrls: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SupportVisit {
  _id: string;
  identifier: string;
  type: VisitType;
  status: VisitStatus;
  technicianId: string | null;
  technicianName: string;
  storeId: string | null;
  storeName: string;
  storeAddress: string;
  storeLocation: { lat: number | null; lng: number | null };
  scheduledDate: string;
  weekNumber: number;
  year: number;
  arrivalTime: string | null;
  departureTime: string | null;
  notes: string;
  reportNotes: string;
  evidenceUrls: string[];
  ticketId: string | null;
  isEmergency: boolean;
  postponedFrom: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SupportMetrics {
  tickets: {
    open: number;
    inProgress: number;
    resolvedThisMonth: number;
    critical: number;
  };
  visits: {
    thisWeek: number;
    completedThisWeek: number;
    pendingThisWeek: number;
  };
  typeDistribution: { _id: string; count: number }[];
  weeklyVisits: { _id: { week: number; year: number }; total: number; completed: number }[];
}

export interface GetTicketsParams {
  status?: TicketStatus | 'all';
  type?: TicketType | 'all';
  priority?: TicketPriority | 'all';
  assigneeId?: string;
  storeId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface GetVisitsParams {
  status?: VisitStatus | 'all';
  type?: VisitType | 'all';
  technicianId?: string;
  storeId?: string;
  week?: number;
  year?: number;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  ok: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface WeeklyVisitsResult {
  ok: boolean;
  data: SupportVisit[];
  summary: {
    scheduled: number;
    inProgress: number;
    completed: number;
    cancelled: number;
    total: number;
  };
  week: number;
  year: number;
}

/* ═══════════════════════════════════
   Lookup — Technicians & Stores
   ═══════════════════════════════════ */

export interface Technician {
  _id: string;
  id: string;
  name: string;
  email: string;
  profileImage?: string;
}

export interface StoreOption {
  _id: string;
  id: string;
  name: string;
  address: string;
}

export const getTechnicians = async (): Promise<Technician[]> => {
  const res = await api.get('/support/technicians');
  return res.data.data ?? [];
};

export const getSupportStores = async (search?: string): Promise<StoreOption[]> => {
  const res = await api.get('/support/stores', { params: search ? { search } : undefined });
  return res.data.data ?? [];
};

/* ═══════════════════════════════════
   Metrics
   ═══════════════════════════════════ */

export const getSupportMetrics = async (): Promise<SupportMetrics> => {
  const res = await api.get('/support/metrics');
  return res.data.data;
};

/* ═══════════════════════════════════
   Tickets
   ═══════════════════════════════════ */

export const getTickets = async (params?: GetTicketsParams): Promise<PaginatedResult<SupportTicket>> => {
  const res = await api.get('/support/tickets', { params });
  return res.data;
};

export const getTicketById = async (id: string): Promise<SupportTicket> => {
  const res = await api.get(`/support/tickets/${id}`);
  return res.data.data;
};

export const createTicket = async (data: Partial<SupportTicket>): Promise<SupportTicket> => {
  const res = await api.post('/support/tickets', data);
  return res.data.data;
};

export const updateTicket = async (id: string, data: Partial<SupportTicket>): Promise<SupportTicket> => {
  const res = await api.patch(`/support/tickets/${id}`, data);
  return res.data.data;
};

export const deleteTicket = async (id: string): Promise<void> => {
  await api.delete(`/support/tickets/${id}`);
};

/* ═══════════════════════════════════
   Visits
   ═══════════════════════════════════ */

export const getVisits = async (params?: GetVisitsParams): Promise<PaginatedResult<SupportVisit>> => {
  const res = await api.get('/support/visits', { params });
  return res.data;
};

export const getWeeklyVisits = async (week?: number, year?: number): Promise<WeeklyVisitsResult> => {
  const res = await api.get('/support/visits/weekly', { params: { week, year } });
  return res.data;
};

export const getVisitById = async (id: string): Promise<SupportVisit> => {
  const res = await api.get(`/support/visits/${id}`);
  return res.data.data;
};

export const createVisit = async (data: Partial<SupportVisit>): Promise<SupportVisit> => {
  const res = await api.post('/support/visits', data);
  return res.data.data;
};

export const updateVisit = async (id: string, data: Partial<SupportVisit>): Promise<SupportVisit> => {
  const res = await api.patch(`/support/visits/${id}`, data);
  return res.data.data;
};

export const deleteVisit = async (id: string): Promise<void> => {
  await api.delete(`/support/visits/${id}`);
};

const supportService = {
  getTechnicians,
  getSupportStores,
  getSupportMetrics,
  getTickets,
  getTicketById,
  createTicket,
  updateTicket,
  deleteTicket,
  getVisits,
  getWeeklyVisits,
  getVisitById,
  createVisit,
  updateVisit,
  deleteVisit,
};

export default supportService;
