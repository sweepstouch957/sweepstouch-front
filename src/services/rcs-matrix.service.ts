import { api } from '@/libs/axios';

/* ══════════ Types ══════════ */

export type FulfillmentStatus =
  | 'awaiting_payment'
  | 'paid'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled'
  // Pestaña Listas: estado efectivo de la lista (vigente / validada en caja / vencida).
  | 'list_pending'
  | 'list_validated'
  | 'list_expired';

/** Qué se está mirando: órdenes con checkout o listas que se llevan a la caja. */
export type MatrixKind = 'orders' | 'lists';

/** Links ya armados por el backend: el panel no vuelve a formatear el teléfono. */
export interface MatrixContact {
  whatsapp: string;
  call: string;
  sms: string;
}

export interface MatrixRow {
  /** Sólo viene en las listas. */
  kind?: 'list';
  expiresAt?: string | null;
  pointsAwarded?: number;
  savingsCents?: number;
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
  /** Último día del rango (YYYY-MM-DD, NY). */
  to?: string;
  range: { from: string; to: string };
  kpis: {
    orders: number;
    customers: number;
    stores: number;
    grossCents: number;
    pending: number;
    /* Listas */
    validated?: number;
    expired?: number;
    points?: number;
    savingsCents?: number;
    itemsTotal?: number;
    /* Órdenes */
    unpaid?: number;
    unpaidCents?: number;
    collectedCents?: number;
    completed?: number;
    cancelled?: number;
    avgTicketCents?: number;
  };
  byStatus: Record<string, number>;
  stores: MatrixStore[];
  items: MatrixRow[];
}

export interface MatrixParams {
  kind?: MatrixKind;
  /** YYYY-MM-DD (NY), inclusivos. Sin ellos, el backend responde hoy. */
  from?: string;
  to?: string;
  store?: string;
  status?: string;
}

/**
 * Matriz RCS — órdenes de TODAS las tiendas de un día, con los datos de
 * contacto de cada cliente. Es la misma colección que ve el vendor site, pero
 * sin filtrar por tienda.
 */
export const rcsMatrixService = {
  async list({ kind = 'orders', ...params }: MatrixParams = {}): Promise<MatrixResponse> {
    // Las listas viven en tracking-service, con el mismo formato de fila.
    const url = kind === 'lists' ? '/tracking/list-admin/matrix' : '/orders/matrix';
    const { data } = await api.get<MatrixResponse>(url, { params });
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
