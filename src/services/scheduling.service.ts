import { api } from '@/libs/axios';

// ===== Types representing Scheduling Service Models =====

export interface Slot {
  _id: string;
  agentId?: string;
  agentEmail?: string;
  agentName?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  timezone?: string;
  available: boolean;
  appointmentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  _id: string;
  slotId: string | Slot; // depending on whether it's populated
  storeRequestId?: string; // If applicable/linked
  storeName: string;
  contactName: string;
  contactEmail?: string;
  phoneNumber?: string;
  language?: 'es' | 'en';
  timezone?: string;
  scheduledAt?: string;
  calendarEventId?: string;
  meetingLink?: string;
  status: 'scheduled' | 'cancelled' | 'completed';
  promoterId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSlotPayload {
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  agentId: string;
  agentEmail: string;
  agentName?: string;
  timezone?: string;
}

// ===== API Services =====

class SchedulingService {
  /**
   * SLOTS
   */

  async getSlots(params?: { agentId?: string; date?: string; available?: boolean }): Promise<Slot[]> {
    const res = await api.get('/scheduling/slots', { params });
    return res.data?.data || []; // unwrapping standard response {success, count, data}
  }

  async getAvailableSlots(params?: { date?: string; agentId?: string }): Promise<Slot[]> {
    const res = await api.get('/scheduling/slots/available', { params });
    return res.data?.data || [];
  }

  async createSlot(data: CreateSlotPayload): Promise<Slot> {
    const res = await api.post('/scheduling/slots', data);
    return res.data?.data || res.data;
  }

  async createSlotsBulk(data: { slots: CreateSlotPayload[] }): Promise<{ message: string; slots: Slot[] }> {
    const res = await api.post('/scheduling/slots/bulk', data);
    return res.data;
  }

  async updateSlot(id: string, data: Partial<Slot>): Promise<Slot> {
    const res = await api.patch(`/scheduling/slots/${id}`, data);
    return res.data;
  }

  async deleteSlot(id: string): Promise<{ message: string }> {
    const res = await api.delete(`/scheduling/slots/${id}`);
    return res.data;
  }

  /**
   * APPOINTMENTS
   */

  async getAppointments(params?: { promoterId?: string; slotId?: string; status?: string }): Promise<Appointment[]> {
    const res = await api.get('/scheduling/appointments', { params });
    return res.data?.data || [];
  }

  async getAppointmentById(id: string): Promise<Appointment> {
    const res = await api.get(`/scheduling/appointments/${id}`);
    return res.data?.data || res.data;
  }

  async createAppointment(data: Partial<Appointment>): Promise<Appointment> {
    const res = await api.post('/scheduling/appointments', data);
    return res.data?.data || res.data;
  }

  async cancelAppointment(id: string): Promise<Appointment> {
    const res = await api.patch(`/scheduling/appointments/${id}/cancel`);
    return res.data;
  }
}

export const schedulingService = new SchedulingService();
export default schedulingService;
