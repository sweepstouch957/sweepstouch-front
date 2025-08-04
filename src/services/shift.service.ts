import { api } from '@/libs/axios';
import { Store } from './store.service';

export interface Shift {
  _id: string;
  promoterId?: string;
  requestedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
  };
  storeId?: string;
  startTime: string;
  endTime: string;
  status: string;
  totalParticipations?: number;
  approvedByAdmin?: boolean;
  [key: string]: any;
  storeInfo?: Store;
}

export interface CreateShiftPayload {
  promoterId?: string;
  requestedBy?: string;
  storeId: string;
  startTime: string;
  endTime: string;
  status: string;
  approvedByAdmin?: boolean;
}

export interface ShiftFilters {
  status?: string;
  storeId?: string;
  promoterId?: string;
  startTime?: string;
  endTime?: string;
  page?: number;
  limit?: number;
  date?: string; // ISO date
}

export class ShiftService {
  async createShift(data: CreateShiftPayload): Promise<Shift> {
    const res = await api.post('/promoter/shifts', data);
    return res.data;
  }

  async getAllShifts(filters?: ShiftFilters): Promise<{ shifts: Shift[]; pagination: any }> {
    const res = await api.get('/promoter/shifts', { params: filters });
    return res.data;
  }

  async getAllRequests(page = 1, limit = 10): Promise<{ shifts: Shift[]; pagination: any }> {
    const res = await api.get(`/promoter/shifts/requests`, {
      params: { page, limit },
    });
    return res.data;
  }

  async getShiftById(id: string): Promise<{ shift: Shift; stats: any }> {
    const res = await api.get(`/promoter/shifts/${id}`);
    return res.data;
  }

  async updateShift(id: string, data: Partial<CreateShiftPayload>): Promise<Shift> {
    const res = await api.put(`/promoter/shifts/${id}`, data);
    return res.data;
  }

  async deleteShift(id: string): Promise<{ message: string }> {
    const res = await api.delete(`/promoter/shifts/${id}`);
    return res.data;
  }

  async assignShift(id: string, promoterId: string): Promise<Shift> {
    const res = await api.post(`/promoter/shifts/${id}/assign`, { promoterId });
    return res.data;
  }

  async requestShift(shiftId: string, promoterId: string): Promise<Shift> {
    const res = await api.post(`/promoter/shifts/${shiftId}/request`, { promoterId });
    return res.data;
  }

  async startShift(shiftId: string, promoterId: string): Promise<Shift> {
    const res = await api.post(`/promoter/shifts/${shiftId}/start`, { promoterId });
    return res.data;
  }

  async endShift(shiftId: string, promoterId: string, contactsCaptured: number): Promise<any> {
    const res = await api.post(`/promoter/shifts/${shiftId}/end`, { promoterId, contactsCaptured });
    return res.data;
  }

  async updateProgress(shiftId: string, contactsCaptured: number): Promise<any> {
    const res = await api.put(`/promoter/shifts/${shiftId}/progress`, { contactsCaptured });
    return res.data;
  }

  async getAvailableShifts(page: number = 1, limit: number = 10): Promise<any> {
    const res = await api.get(`/promoter/shifts/available`, { params: { page, limit } });
    return res.data;
  }

  async getShiftsByPromoter(promoterId: string, page = 1, limit = 10): Promise<any> {
    const res = await api.get(`/promoter/shifts/${promoterId}`, {
      params: { page, limit },
    });
    return res.data;
  }

  async getActiveShiftByPromoter(promoterId: string): Promise<any> {
    const res = await api.get(`/promoter/shifts/active/${promoterId}`);
    return res.data;
  }

  async getActiveShiftsByStore(storeId: string): Promise<any> {
    const res = await api.get(`/promoter/shifts/active/store/${storeId}`);
    return res.data;
  }

  async getShiftsByTime(startTime: string, endTime: string): Promise<Shift[]> {
    const res = await api.get(`/promoter/shifts/by-time`, {
      params: { startTime, endTime },
    });
    return res.data;
  }

  async createShiftRequest(payload: any): Promise<any> {
    const res = await api.post(`/promoter/shifts/requests`, payload);
    return res.data;
  }

  async getShiftRequests(filters?: any): Promise<any> {
    const res = await api.get(`/promoter/shifts/requests`, { params: filters });
    return res.data;
  }

  async getShiftRequestStats(): Promise<any> {
    const res = await api.get(`/promoter/shifts/requests/stats`);
    return res.data;
  }

  async getShiftRequestById(id: string): Promise<any> {
    const res = await api.get(`/promoter/shifts/requests/${id}`);
    return res.data;
  }

  async approveShiftRequest(id: string): Promise<any> {
    const res = await api.put(`/promoter/shifts/requests/${id}/approve`);
    return res.data;
  }

  async rejectShiftRequest(id: string, reason: string): Promise<any> {
    const res = await api.put(`/promoter/shifts/requests/${id}/reject`, { rejectionReason: reason });
    return res.data;
  }


  async cancelShiftRequest(id: string): Promise<any> {
    const res = await api.put(`/promoter/shifts/requests/${id}/cancel`);
    return res.data;
  }

  async markNotificationAsRead(id: string): Promise<any> {
    const res = await api.put(`/promoter/shifts/requests/${id}/mark-read`);
    return res.data;
  }
  async getShiftMetrics(): Promise<{
    total: number;
    inProgress: number;
    scheduled: number;
    unassigned: number;
  }> {
    const res = await api.get('/promoter/shifts/metrics');
    return res.data;
  }
}

export const shiftService = new ShiftService();
