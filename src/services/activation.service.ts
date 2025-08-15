// src/services/activation.service.ts
import { api } from '@/libs/axios';

export type ActivationStatus = 'pendiente' | 'aprobado' | 'rechazado';

export interface ActivationUserSummary {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  avatarUrl?: string;
  status?: 'pending' | 'active' | 'disabled' | string;
}

export interface ActivationRequestPayload {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  zipcode?: string;
  role?: string;      // default 'promotor'
  avatarUrl?: string; // url de la foto
}

export interface ActivationRequest {
  _id: string;
  userId: string | ActivationUserSummary;
  payload: {
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    email: string;
    zipcode?: string;
    role?: string;
    avatarUrl?: string;
  };
  status: ActivationStatus;
  statusHistory?: Array<{
    status: ActivationStatus | string;
    timestamp: string;
    reason?: string;
    changedBy?: string | null;
  }>;
  reviewedBy?: string | null;
  rejectionReason?: string | null;
  responseDate?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export interface CreateActivationResponse {
  success: boolean;
  message: string;
  data: { requestId: string; userId: string };
}

export interface ApproveActivationResponse {
  success: boolean;
  message: string;
  data: { userId: string; previewSetPasswordLink?: string };
}

export interface RejectActivationResponse {
  success: boolean;
  message: string;
}

export interface GetActivationRequestsResponse {
  success: boolean;
  data: ActivationRequest[];
  pagination: Pagination;
}

export interface ActivationRequestDetailResponse {
  success: boolean;
  data: ActivationRequest;
}

export interface ResendSetPasswordLinkResponse {
  success: boolean;
  message: string;
}

export interface ActivationFilters {
  status?: ActivationStatus;
  email?: string;
  page?: number;
  limit?: number;
  sortBy?: string;        // por defecto createdAt en el backend
  sortOrder?: 'asc' | 'desc';
}

export class ActivationService {
  // Crear solicitud
  async createActivationRequest(
    payload: ActivationRequestPayload
  ): Promise<CreateActivationResponse> {
    const res = await api.post('/promoter/activation/activation-requests', {
      ...payload,
      role: payload.role ?? 'promotor',
    });
    return res.data;
  }

  // Aprobar (POST según tus rutas)
  async approveActivationRequest(
    id: string,
    body?: { reviewedBy?: string; adminComments?: string }
  ): Promise<ApproveActivationResponse> {
    const res = await api.post(`/promoter/activation/activation-requests/${id}/approve`, body ?? {});
    return res.data;
  }

  // Rechazar (POST según tus rutas)
  async rejectActivationRequest(
    id: string,
    body?: { reviewedBy?: string; rejectionReason?: string }
  ): Promise<RejectActivationResponse> {
    const res = await api.post(`/promoter/activation/activation-requests/${id}/reject`, body ?? {});
    return res.data;
  }

  // Listar con filtros y paginación
  async getActivationRequests(
    filters?: ActivationFilters
  ): Promise<GetActivationRequestsResponse> {
    const res = await api.get('/promoter/activation/activation-requests', { params: filters });
    return res.data;
  }

  // Detalle por ID
  async getActivationRequestById(id: string): Promise<ActivationRequest> {
    const res = await api.get(`/promoter/activation/activation-requests/${id}`);
    // backend: { success, data }
    return (res.data?.data ?? res.data) as ActivationRequest;
  }

  // Reenviar link set-password
  async resendSetPasswordLink(userId: string): Promise<ResendSetPasswordLinkResponse> {
    const res = await api.post('/promoter/activation/activation-requests/resend-link', { userId });
    return res.data;
  }
}

export const activationService = new ActivationService();
