import { api } from '@/libs/axios';

/* ══════════ Types ══════════ */

export type FulfillmentStatus =
  | 'awaiting_payment'
  | 'paid'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled';

/** Links ya armados por el backend: el panel no vuelve a formatear el teléfono. */
export interface MatrixContact {
  whatsapp: string;
  call: string;
  sms: string;
}

export interface MatrixRow {
  _id: string;
  orderNumber: string;
  channel: string;
  createdAt: string;
  paidAt: string | null;
  pickupAt: string | null;
  pickupConfirmed: boolean;
  qrValidatedAt: string | null;
  reviewed: boolean;
  storeId: string;
  storeSlug: string;
  storeName: string;
  storePhone: string;
  circularId: string;
  groupCode: string;
  customerId: string;
  customerName: string;
  /** E.164 (+1XXXXXXXXXX); vacío si la orden no trae teléfono. */
  customerPhone: string;
  contact: MatrixContact | null;
  fulfillmentStatus: FulfillmentStatus;
  paymentStatus: string;
  paymentMethod: string;
  deliveryMethod: 'pickup' | 'delivery';
  address: string;
  itemCount: number;
  subtotalCents: number;
  refundTotalCents: number;
  payNowCents: number;
  ebtCents: number;
  shippingCostCents: number;
}

export interface MatrixStore {
  key: string;
  storeId: string;
  slug: string;
  name: string;
  orders: number;
}

export interface MatrixResponse {
  ok: boolean;
  /** Día consultado, YYYY-MM-DD en hora de Nueva York. */
  date: string;
  range: { from: string; to: string };
  kpis: {
    orders: number;
    customers: number;
    stores: number;
    grossCents: number;
    pending: number;
  };
  byStatus: Record<string, number>;
  stores: MatrixStore[];
  items: MatrixRow[];
}

export interface MatrixParams {
  /** YYYY-MM-DD. Sin él, el backend responde el día de hoy en NY. */
  date?: string;
  store?: string;
  status?: string;
}

/**
 * Matriz RCS — órdenes de TODAS las tiendas de un día, con los datos de
 * contacto de cada cliente. Es la misma colección que ve el vendor site, pero
 * sin filtrar por tienda.
 */
export const rcsMatrixService = {
  async list(params: MatrixParams = {}): Promise<MatrixResponse> {
    const { data } = await api.get<MatrixResponse>('/orders/matrix', { params });
    return data;
  },
};

/** YYYY-MM-DD de hoy en hora de Nueva York — el día que abre la pantalla. */
export function todayInNY(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());
}

export function centsToUsd(cents?: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    (cents ?? 0) / 100
  );
}
