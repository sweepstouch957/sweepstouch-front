import { api } from '@/libs/axios';
import type { AxiosResponse } from 'axios';

/* ========================= Tipos compartidos ========================= */

export type WeekStart = 'mon' | 'sun';
export type MembershipType = 'mensual' | 'semanal' | 'especial';
export type PaymentMethod = 'central_billing' | 'card' | 'quickbooks' | 'ach' | 'wire' | 'cash';

export type CampaignTotals = {
  sms: number;
  mms: number;
  total: number;
};

export type WeekItem = {
  start: string; // ISO
  end: string; // ISO
  breakdown: {
    campaigns: CampaignTotals; // SMS/MMS/total
    storesFee: number;
  };
  total: number;
};

/* ---------- /billing/weekly ---------- */
export interface WeeklyBillingParams {
  start?: string; // YYYY-MM-DD
  weekStart?: WeekStart;
  paymentMethod?: PaymentMethod;
  membershipType?: MembershipType;
}

export interface WeeklyBillingResponse {
  ok: boolean;
  range: { start: string; end: string; weekStart?: WeekStart };
  breakdown: { campaigns: CampaignTotals; storesFee: number };
  total: number;
  metrics?: { activeStores: number; storeWeeklyFeePerStore: number };
}

/* ---------- /billing/monthly ---------- */
export interface MonthlyBillingParams {
  from?: string; // YYYY-MM
  to?: string; // YYYY-MM
  weekStart?: WeekStart;
  paymentMethod?: PaymentMethod;
  membershipType?: MembershipType;
}

export interface MonthlyRow {
  month: string; // YYYY-MM
  range: { start: string; end: string };
  campaigns: CampaignTotals;
  storesFee: number;
  total: number;
  weeksInMonth?: number;
}

export interface MonthlyBillingResponse {
  ok: boolean;
  monthly: MonthlyRow[];
  totals: {
    sms: number;
    mms: number;
    storesFee: number;
    grandTotal: number;
  };
  config?: {
    from: string;
    to: string;
    weekStart: WeekStart;
    storeWeeklyFeePerStore: number;
    activeStoresUsedForCalc: number;
  };
}

/* ---------- /billing/weeks-range ---------- */
export interface WeeklyRangeParams {
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
  weekStart?: WeekStart;
  paymentMethod?: PaymentMethod;
  membershipType?: MembershipType;
}

export interface WeeklyRangeResponse {
  ok: boolean;
  activeStores?: number;
  weeks: WeekItem[];
  totals: {
    sms: number;
    mms: number;
    storesFee: number;
    grandTotal: number;
  };
  config?: {
    start: string;
    end: string;
    weekStart: WeekStart;
    storeWeeklyFeePerStore: number;
    activeStoresUsedForCalc: number;
  };
}

/* ---------- /billing/weeks-by-month ---------- */
export interface WeeklyByMonthParams {
  month: string; // YYYY-MM
  weekStart?: WeekStart;
  paymentMethod?: PaymentMethod;
  membershipType?: MembershipType;
}

export interface WeeklyByMonthResponse {
  ok: boolean;
  activeStores?: number;
  weeks: WeekItem[];
  totals: {
    sms: number;
    mms: number;
    storesFee: number;
    grandTotal: number;
  };
  config?: {
    month: string;
    range: { start: string; end: string };
    weekStart: WeekStart;
    storeWeeklyFeePerStore: number;
    activeStoresUsedForCalc: number;
  };
}

/* ---------- /billing/stores-report ---------- */
export interface StoresReportParams {
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
  weekStart?: WeekStart;
  paymentMethod?: PaymentMethod;
  membershipType?: MembershipType;
}

export interface StoreReportRow {
  storeId: string;
  storeName: string;
  membershipType: MembershipType;
  paymentMethod: PaymentMethod;
  sms: number;
  mms: number;
  campaignsTotal: number;
  storesFee: number;
  grandTotal: number;
}

export interface StoresReportResponse {
  ok: boolean;
  range: {
    start: string;
    end: string;
    weekStart: WeekStart;
    paymentMethod: PaymentMethod | null;
  };
  stores: StoreReportRow[];
  totals: {
    sms: number;
    mms: number;
    campaignsTotal: number;
    storesFee: number;
    grandTotal: number;
  };
}

/* ========================= Servicio ========================= */

export class BillingService {
  async getWeeklyBilling(
    params?: WeeklyBillingParams
  ): Promise<AxiosResponse<WeeklyBillingResponse>> {
    return api.get('/billing/weekly', { params });
  }

  async getMonthlyBillingSummary(
    params?: MonthlyBillingParams
  ): Promise<AxiosResponse<MonthlyBillingResponse>> {
    return api.get('/billing/monthly', { params });
  }

  async getWeeklyRangeBilling(
    params: WeeklyRangeParams
  ): Promise<AxiosResponse<WeeklyRangeResponse>> {
    return api.get('/billing/weeks-range', { params });
  }

  async getMonthWeeklyBilling(
    params: WeeklyByMonthParams
  ): Promise<AxiosResponse<WeeklyByMonthResponse>> {
    return api.get('/billing/weeks-by-month', { params });
  }

  async getStoresRangeReport(
    params: StoresReportParams
  ): Promise<AxiosResponse<StoresReportResponse>> {
    return api.get('/billing/stores-report', { params });
  }
}

export const billingService = new BillingService();

/* ========================= Query Keys ========================= */

const norm = (v: unknown) => (v ?? 'all').toString();

export const billingQK = {
  weekly: (p?: WeeklyBillingParams) =>
    [
      'billing',
      'weekly',
      p?.start ?? 'current',
      p?.weekStart ?? 'mon',
      norm(p?.paymentMethod),
      norm(p?.membershipType),
    ] as const,

  monthly: (p?: MonthlyBillingParams) =>
    [
      'billing',
      'monthly',
      p?.from ?? '2025-07',
      p?.to ?? 'current',
      p?.weekStart ?? 'mon',
      norm(p?.paymentMethod),
      norm(p?.membershipType),
    ] as const,

  range: (p: WeeklyRangeParams) =>
    [
      'billing',
      'weeks-range',
      p.start,
      p.end,
      p.weekStart ?? 'mon',
      norm(p?.paymentMethod),
      norm(p?.membershipType),
    ] as const,

  byMonth: (p: WeeklyByMonthParams) =>
    [
      'billing',
      'weeks-by-month',
      p.month,
      p.weekStart ?? 'mon',
      norm(p?.paymentMethod),
      norm(p?.membershipType),
    ] as const,

  storesReport: (p: StoresReportParams) =>
    [
      'billing',
      'stores-report',
      p.start,
      p.end,
      p.weekStart ?? 'mon',
      norm(p?.paymentMethod),
      norm(p?.membershipType),
    ] as const,
};
