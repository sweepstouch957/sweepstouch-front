import { api } from "@/libs/axios";
import type { AxiosResponse } from "axios";

/* ========================= Tipos compartidos ========================= */

export type WeekStart = "mon" | "sun";

export type WeekItem = {
  start: string; // ISO
  end: string;   // ISO
  breakdown: {
    campaignsTotal: number;
    storesFee: number;
  };
  total: number;
};

/* ---------- /billing/weekly ---------- */
export interface WeeklyBillingParams {
  start?: string;      // YYYY-MM-DD (inicio de semana opcional)
  weekStart?: WeekStart;
}
export interface WeeklyBillingResponse {
  ok: boolean;
  range: { start: string; end: string; weekStart: WeekStart };
  metrics: { activeStores: number; storeWeeklyFeePerStore: number };
  breakdown: { campaignsTotal: number; storesFee: number };
  total: number;
}

/* ---------- /billing/monthly ---------- */
export interface MonthlyBillingParams {
  from?: string;       // YYYY-MM  (default server: 2025-07)
  to?: string;         // YYYY-MM  (default server: mes actual)
  weekStart?: WeekStart;
}
export interface MonthlyRow {
  month: string; // YYYY-MM
  range: { start: string; end: string };
  weeksInMonth: number;
  campaignsTotal: number;
  storesFee: number;
  total: number;
}
export interface MonthlyBillingResponse {
  ok: boolean;
  config: {
    from: string;
    to: string;
    weekStart: WeekStart;
    storeWeeklyFeePerStore: number;
    activeStoresUsedForCalc: number;
  };
  monthly: MonthlyRow[];
  totals: {
    campaigns: number;
    storesFee: number;
    grandTotal: number;
  };
}

/* ---------- /billing/weeks-range ---------- */
export interface WeeklyRangeParams {
  start: string;       // YYYY-MM-DD (requerido)
  end: string;         // YYYY-MM-DD (requerido)
  weekStart?: WeekStart;
}
export interface WeeklyRangeResponse {
  ok: boolean;
  config: {
    start: string;
    end: string;
    weekStart: WeekStart;
    storeWeeklyFeePerStore: number;
    activeStoresUsedForCalc: number;
  };
  weeks: WeekItem[];
  totals: {
    campaigns: number;
    storesFee: number;
    grandTotal: number;
  };
}

/* ---------- /billing/weeks-by-month ---------- */
export interface WeeklyByMonthParams {
  month: string;       // YYYY-MM (requerido)
  weekStart?: WeekStart;
}
export interface WeeklyByMonthResponse {
  ok: boolean;
  config: {
    month: string;
    range: { start: string; end: string };
    weekStart: WeekStart;
    storeWeeklyFeePerStore: number;
    activeStoresUsedForCalc: number;
  };
  weeks: WeekItem[];
  totals: {
    campaigns: number;
    storesFee: number;
    grandTotal: number;
  };
}

/* ========================= Servicio ========================= */

export class BillingService {
  // GET /billing/weekly
  async getWeeklyBilling(
    params?: WeeklyBillingParams
  ): Promise<AxiosResponse<WeeklyBillingResponse>> {
    return api.get("/tracking/billing/weekly", { params });
  }

  // GET /billing/monthly
  async getMonthlyBillingSummary(
    params?: MonthlyBillingParams
  ): Promise<AxiosResponse<MonthlyBillingResponse>> {
    return api.get("/tracking/billing/monthly", { params });
  }

  // GET /billing/weeks-range
  async getWeeklyRangeBilling(
    params: WeeklyRangeParams
  ): Promise<AxiosResponse<WeeklyRangeResponse>> {
    return api.get("/tracking/billing/weeks-range", { params });
  }

  // GET /billing/weeks-by-month
  async getMonthWeeklyBilling(
    params: WeeklyByMonthParams
  ): Promise<AxiosResponse<WeeklyByMonthResponse>> {
    return api.get("/tracking/billing/weeks-by-month", { params });
  }
}

export const billingService = new BillingService();

/* ========================= Query Keys ========================= */

export const billingQK = {
  weekly: (p?: WeeklyBillingParams) => [
    "billing",
    "weekly",
    p?.start ?? "current",
    p?.weekStart ?? "mon",
  ] as const,

  monthly: (p?: MonthlyBillingParams) => [
    "billing",
    "monthly",
    p?.from ?? "2025-07",
    p?.to ?? "current",
    p?.weekStart ?? "mon",
  ] as const,

  range: (p: WeeklyRangeParams) => [
    "billing",
    "weeks-range",
    p.start,
    p.end,
    p.weekStart ?? "mon",
  ] as const,

  byMonth: (p: WeeklyByMonthParams) => [
    "billing",
    "weeks-by-month",
    p.month,
    p.weekStart ?? "mon",
  ] as const,
};
