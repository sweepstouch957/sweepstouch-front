// src/services/billing.service.ts
import { api } from '@/libs/axios';
import type { AxiosResponse } from 'axios';

/* ========================= Tipos compartidos ========================= */

export type MembershipType = 'mensual' | 'semanal' | 'especial';
export type PaymentMethod = 'central_billing' | 'card' | 'quickbooks' | 'ach' | 'wire' | 'cash';

export type CampaignTotals = {
  sms: number;
  mms: number;
  total: number;
};

/* ---------- /billing/range ---------- */
export interface RangeBillingParams {
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
  /** Multiplicador de membresía (entero, opcional). Ej: 4 */
  periods?: number;
  paymentMethod?: PaymentMethod;
  membershipType?: MembershipType;
}

export interface MembershipPerTypeSubtotal {
  mensual: number;
  semanal: number;
  especial: number;
}

export interface MembershipUnitFees {
  mensual: number;
  semanal: number;
  especial: number;
}

export interface MembershipCounts {
  mensual: number;
  semanal: number;
  especial: number;
  other: number;
}

export interface MembershipMeta {
  periods: number; // periods efectivos usados (0 si no aplica)
  totalStores: number; // tiendas activas consideradas
  counts: MembershipCounts; // conteo por tipo
  unitFees: MembershipUnitFees; // fee unitario por tipo
  perTypeSubtotal: MembershipPerTypeSubtotal; // suma por tipo (unit * periods)
}

export interface RangeBillingResponse {
  ok: boolean;
  range: {
    start: string; // ISO
    end: string; // ISO
    paymentMethod: PaymentMethod | null;
    membershipType: MembershipType | null;
  };
  breakdown: {
    campaigns: CampaignTotals;
    membership: MembershipMeta & { subtotal: number }; // subtotal membresía
    optin:{
      cost: number; // costo total opt-in SMS
      count: number; // cantidad total opt-in SMS
      unitPrice: number; // precio unitario opt-in SMS
    }
  };
  total: number; // campaigns.total + membership.subtotal
}

/* ---------- /billing/stores-report ---------- */
export interface StoresReportParams {
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
  /** Multiplicador de membresía por tienda (entero, opcional). Ej: 3 */
  periods?: number;
  paymentMethod?: PaymentMethod;
  membershipType?: MembershipType;
}

export interface StoreMembershipBreakdown {
  unitFee: number; // fee unitario según membershipType
  periods: number; // periods efectivos aplicados
  subtotal: number; // unitFee * periods
}

export interface StoreReportRow {
  storeId: string;
  name: string | null;
  membershipType: MembershipType | null;
  paymentMethod: PaymentMethod | null;
  campaigns: CampaignTotals; // por tienda en rango
  membership: StoreMembershipBreakdown;
  total: number; // campaigns.total + membership.subtotal
}

export interface StoresReportResponse {
  ok: boolean;
  range: {
    start: string; // ISO
    end: string; // ISO
    periods: number; // periods efectivos usados
    paymentMethod: PaymentMethod | null;
    membershipType: MembershipType | null;
  };
  stores: StoreReportRow[];
  totals: {
    campaigns: CampaignTotals; // agregados globales
    membership: number; // suma de membership.subtotal
    grandTotal: number; // campaigns.total + membership
    optin: {
      cost: number; // costo total opt-in SMS
      count: number; // cantidad total opt-in SMS
      unitPrice: number; // precio unitario opt-in SMS
    };
  };
}

/* ========================= Servicio ========================= */

export class BillingService {
  /** Global: campañas del rango + membresía × periods (si viene) */
  async getRangeBilling(params: RangeBillingParams): Promise<AxiosResponse<RangeBillingResponse>> {
    return api.get('/billing/range', { params });
  }

  /** Por tienda: campañas del rango + membresía × periods (si viene) */
  async getStoresRangeReport(
    params: StoresReportParams
  ): Promise<AxiosResponse<StoresReportResponse>> {
    return api.get('/billing/stores-report', { params });
  }

  /* ===== [DEPRECATED] Métodos anteriores (eliminados del backend) =====
   * Si los tenías usados en UI, cámbialos a getRangeBilling o getStoresRangeReport.
   */
  // async getWeeklyBilling() { throw new Error('Deprecated: use getRangeBilling'); }
  // async getMonthlyBillingSummary() { throw new Error('Deprecated: use getRangeBilling'); }
  // async getWeeklyRangeBilling() { throw new Error('Deprecated: use getRangeBilling'); }
  // async getMonthWeeklyBilling() { throw new Error('Deprecated: use getRangeBilling'); }
}

export const billingService = new BillingService();

/* ========================= Query Keys ========================= */

const norm = (v: unknown) => (v ?? 'all').toString();

export const billingQK = {
  /** Global */
  range: (p: RangeBillingParams) =>
    [
      'billing',
      'range',
      p.start,
      p.end,
      norm(p.periods ?? 0),
      norm(p.paymentMethod),
      norm(p.membershipType),
    ] as const,

  /** Por tienda */
  storesReport: (p: StoresReportParams) =>
    [
      'billing',
      'stores-report',
      p.start,
      p.end,
      norm(p.periods ?? 0),
      norm(p.paymentMethod),
      norm(p.membershipType),
    ] as const,
};
