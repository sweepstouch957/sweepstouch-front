
import { api } from '@/libs/axios';
import { QueryKey, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Cookies from 'js-cookie';

// Ajusta el base si en tu backend no usas /auth
const BASE = '/auth/cashiers';

/* =========================
 * Tipos
 * ======================= */
export interface CashierUser {
  _id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phone?: string;
  accessCode?: string;
  role: 'cashier' | string;
  store?: string; // ObjectId string
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
  // agrega aquí cualquier otro campo de tu User que necesites
}

export interface CashierListResponse {
  total: number;
  page: number;
  limit: number;
  data: CashierUser[];
}

export interface CashierCreatePayload {
  firstName: string;
  lastName: string;
  storeId: string;
  email?: string;
  phoneNumber?: string;
  active?: boolean;
  // otros campos que acepte tu backend...
}

export interface CashierCreateResponse {
  message: string;
  user: CashierUser; // password ya removido en el controller
  credentials: {
    accessCode: string;
    password: string; // se muestra solo una vez
  };
}

export interface CashierCountResponse {
  storeId: string;
  role: 'cashier';
  filters: { active: 'true' | 'false' | 'any' };
  total: number;
}

/* ===== Ranking ===== */
export interface CashierRankingItem {
  cashierId: string;
  name: string | null;
  email: string | null;
  phoneNumber: string | null;
  accessCode: string | null;
  active: boolean;
  store: string | null;
  count: number; // participaciones registradas por la cajera
}

export interface CashierRankingResponse {
  total: number;
  page: number;
  limit: number;
  dateRange: { startDate: string; endDate: string };
  filters: { storeId: string; active: string; q: string };
  totals: { participants: number };
  warning?: string | null;
  data: CashierRankingItem[];
}

/* =========================
 * HTTP Services
 * ======================= */

/** GET /auth/cashiers (listar) */
export async function listCashiers(params: {
  storeId?: string;
  active?: boolean; // undefined => any
  q?: string;
  limit?: number;
  page?: number;
}): Promise<CashierListResponse> {
  const { storeId, active, q, limit = 20, page = 1 } = params ?? {};
  const res = await api.get<CashierListResponse>(`${BASE}`, {
    withCredentials: true,
    params: {
      ...(storeId ? { storeId } : {}),
      ...(typeof active === 'boolean' ? { active: String(active) } : {}),
      ...(q ? { q } : {}),
      limit,
      page,
    },
  });
  return res.data;
}

/** POST /auth/cashiers (crear) */
export async function createCashier(payload: CashierCreatePayload): Promise<CashierCreateResponse> {
  const res = await api.post<CashierCreateResponse>(`${BASE}`, payload, {
    withCredentials: true,
  });
  return res.data;
}

/** GET /auth/cashiers/count/store/:storeId (conteo) */
export async function getCashierCountByStore(params: {
  storeId: string;
  active?: boolean; // undefined => any
}): Promise<CashierCountResponse> {
  const { storeId, active } = params;
  const res = await api.get<CashierCountResponse>(
    `${BASE}/count/store/${encodeURIComponent(storeId)}`,
    {
      withCredentials: true,
      params: typeof active === 'boolean' ? { active: String(active) } : {},
    }
  );
  return res.data;
}

/** 🔥 GET /auth/cashiers/ranking (nuevo) */
export async function getCashierRanking(params: {
  startDate: string;
  endDate: string;
  storeId?: string; // "all" para todas si quieres
  active?: boolean; // undefined => any
  q?: string;
  page?: number;
  limit?: number;
}): Promise<CashierRankingResponse> {
  const { startDate, endDate, storeId, active, q, page = 1, limit = 20 } = params;
  const res = await api.get<CashierRankingResponse>(`${BASE}/ranking`, {
    withCredentials: true,
    params: {
      startDate,
      endDate,
      ...(storeId ? { storeId } : {}),
      ...(typeof active === 'boolean' ? { active: String(active) } : {}),
      ...(q ? { q } : {}),
      page,
      limit,
    },
  });
  return res.data;
}

/* =========================
 * React Query Hooks
 * ======================= */

/** Hook de lista (GET /auth/cashiers) */
export function useCashiers(
  params: {
    storeId?: string;
    active?: boolean;
    q?: string;
    limit?: number;
    page?: number;
  },
  options?: any
): any {
  const key: QueryKey = ['cashiers', 'list', params] as const;
  return useQuery({
    queryKey: key,
    queryFn: () => listCashiers(params),
    enabled: true,
    ...(options ?? {}),
  });
}

/** Hook de creación (POST /auth/cashiers) */
export function useCreateCashier(options?: {
  onSuccess?: (data: CashierCreateResponse) => void;
  onError?: (err: unknown) => void;
}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CashierCreatePayload) => createCashier(payload),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['cashiers', 'list'] });
      qc.invalidateQueries({ queryKey: ['cashiers', 'count'] });
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });
}

/** Hook de conteo (GET /auth/cashiers/count/store/:storeId) */
export function useCashierCount(storeId?: string, active?: boolean) {
  const enabled = Boolean(storeId);
  const key: QueryKey = ['cashiers', 'count', storeId, active ?? 'any'];
  return useQuery({
    queryKey: key,
    queryFn: () => getCashierCountByStore({ storeId: storeId!, active }),
    enabled,
  });
}

/** 🔥 Hook de ranking (GET /auth/cashiers/ranking) */
export function useCashierRanking(
  params: {
    startDate: string;
    endDate: string;
    storeId?: string;
    active?: boolean;
    q?: string;
    page?: number;
    limit?: number;
  },
  options?: any
): any {
  const key: QueryKey = ['cashiers', 'ranking', params] as const;
  return useQuery({
    queryKey: key,
    queryFn: () => getCashierRanking(params),
    enabled: Boolean(params?.startDate && params?.endDate),
    ...(options ?? {}),
  });
}
