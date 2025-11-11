// src/services/cashier.service.ts
import { api } from '@/libs/axios';
import { QueryKey, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/* =========================
 * Constantes
 * ======================= */
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
  phoneNumber?: string;
  accessCode?: string;
  role: 'cashier' | string;
  store?: string; // ObjectId string
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
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
}

export interface CashierCreateResponse {
  message: string;
  user: CashierUser;
  credentials: {
    accessCode: string;
    password: string; // visible solo una vez
  };
}

export interface CashierCountResponse {
  storeId: string;
  role: 'cashier';
  filters: { active: 'true' | 'false' | 'any' };
  total: number;
}

export interface CashierRankingItem {
  cashierId: string;
  name: string | null;
  email: string | null;
  phoneNumber: string | null;
  accessCode: string | null;
  active: boolean;
  store: string | null;
  count: number; // total (fuente ranking)
  newNumbers?: number; // opcional si el backend lo incluye
  existingNumbers?: number; // opcional si el backend lo incluye
}

export interface CashierRankingResponse {
  total: number; // total de NUEVOS (según tu controller)
  totalCashiers: number;
  page: number;
  limit: number;
  dateRange: { startDate: string; endDate: string };
  filters: { storeId: string; active: string; q: string };
  totals?: {
    participantsNew?: number;
    participantsFromListedCashiers?: number;
  };
  warning?: string | null;
  data: CashierRankingItem[];
}

/** ✨ Stats por cajera (nuevo) */
export type CashierStatsResponse = {
  cashierId: string;
  range: { startDate: string; endDate: string };
  totals: {
    total: number;
    newNumbers: number;
    existingNumbers: number;
  };
  breakdown?: Array<{
    date: string; // 'YYYY-MM-DD'
    total: number;
    newNumbers: number;
    existingNumbers: number;
  }>;
  user?: {
    firstName?: string;
    lastName?: string;
    name?: string;
    email?: string | null;
    accessCode?: string | null;
    profileImage?: string | null;
  };
};

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

/** GET /auth/cashiers/ranking */
export async function getCashierRanking(params: {
  startDate: string; // 'YYYY-MM-DD'
  endDate: string; // 'YYYY-MM-DD'
  storeId?: string; // "all" o específico
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

/** 🆕 GET /auth/cashiers/:cashierId/stats  (hereda rango y opcional storeId) */
export async function getCashierStats(params: {
  cashierId: string;
  startDate: string; // 'YYYY-MM-DD'
  endDate: string; // 'YYYY-MM-DD'
  storeId?: string;
}): Promise<CashierStatsResponse> {
  const { cashierId, startDate, endDate, storeId } = params;
  const res = await api.get<CashierStatsResponse>(
    `${BASE}/${encodeURIComponent(cashierId)}/stats`,
    {
      withCredentials: true,
      params: {
        startDate,
        endDate,
        ...(storeId ? { storeId } : {}),
      },
    }
  );
  return res.data;
}

/* =========================
 * Hooks (React Query)
 * ======================= */

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

export function useCashierCount(storeId?: string, active?: boolean) {
  const enabled = Boolean(storeId);
  const key: QueryKey = ['cashiers', 'count', storeId, active ?? 'any'];
  return useQuery({
    queryKey: key,
    queryFn: () => getCashierCountByStore({ storeId: storeId!, active }),
    enabled,
  });
}

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

/** ✅ Hook NUEVO: stats por cajera con rango (y store opcional) */
export function useCashierStats(
  cashierId?: string,
  params?: { startDate: string; endDate: string; storeId?: string },
  options?: any
):any {
  const enabled = Boolean(cashierId) && Boolean(params?.startDate) && Boolean(params?.endDate);

  const key: QueryKey = ['cashiers', 'stats', cashierId, params] as const;

  return useQuery({
    queryKey: key,
    queryFn: () =>
      getCashierStats({
        cashierId: cashierId!,
        startDate: params!.startDate,
        endDate: params!.endDate,
        storeId: params?.storeId,
      }),
    enabled,
    staleTime: 60_000,
    ...(options ?? {}),
  });
}
