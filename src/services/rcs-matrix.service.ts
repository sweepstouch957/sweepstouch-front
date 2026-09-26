import { api } from '@/libs/axios';

/* ══════════ Types ══════════ */

export type FulfillmentStatus =
  | 'awaiting_payment'
  | 'paid'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled'
  // Listas: estado efectivo (vigente / validada en caja / vencida).
  | 'list_pending'
  | 'list_validated'
  | 'list_expired';

/** De dónde sale la fila: órdenes con checkout o listas que se llevan a la caja. */
export type MatrixKind = 'orders' | 'lists';

/**
 * Fila de la matriz. Órdenes (order-service/lib/matrix.js) y listas
 * (tracking-service/utils/listMatrix.js) comparten esta forma para colgar del
 * mismo árbol. Trae sólo lo que se pinta.
 */
export interface MatrixRow {
  /** Sólo viene en las listas. */
  kind?: 'list';
  _id: string;
  /** #ORD-… o SL-… */
  orderNumber: string;
  createdAt: string;
  pickupAt: string | null;
  storeId: string;
  storeSlug: string;
  storeName: string;
  storePhone: string;
  customerId: string;
  customerName: string;
  /** E.164 (+1XXXXXXXXXX); vacío si no hay teléfono. */
  customerPhone: string;
  fulfillmentStatus: FulfillmentStatus;
  paymentStatus: string;
  deliveryMethod: 'pickup' | 'delivery';
  address: string;
  itemCount: number;
  subtotalCents: number;
  refundTotalCents: number;
  /* Gestión (sólo órdenes) — qué falta hacer con ella */
  reviewed?: boolean;
  paymentMethod?: string;
  notifiedStoreAt?: string | null;
  pickupConfirmed?: boolean;
  estimatedReadyAt?: string | null;
  /* Listas */
  expiresAt?: string | null;
  pointsAwarded?: number;
  savingsCents?: number;
}

/** Ítem de una orden, como lo devuelve /orders/track/:id. */
export interface OrderItemDetail {
  name: string;
  unit?: string;
  quantity: number;
  lineCents: number;
  unitPriceCents?: number;
  priceLabel?: string;
  imageUrl?: string;
  available?: boolean;
  refundedCents?: number;
}

/** Orden completa para el panel de gestión. */
export interface OrderDetail {
  _id: string;
  orderNumber: string;
  createdAt: string;
  storeSlug?: string;
  storeName?: string;
  storePhone?: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  fulfillmentStatus: FulfillmentStatus;
  paymentStatus: string;
  paymentMethod?: string;
  reviewed?: boolean;
  pickupAt?: string | null;
  pickupConfirmed?: boolean;
  prepTimeMinutes?: number;
  estimatedReadyAt?: string | null;
  deliveryMethod?: 'pickup' | 'delivery';
  subtotalCents: number;
  refundTotalCents: number;
  shippingCostCents?: number;
  payNowCents?: number;
  payAtRegisterCents?: number;
  tenderMode?: 'card' | 'ebt';
  items: OrderItemDetail[];
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
  /** Rango consultado, YYYY-MM-DD en hora de Nueva York (inclusivo). */
  from: string;
  to: string;
  /** true si se llegó al tope de filas del backend (5000). */
  capped?: boolean;
  stores: MatrixStore[];
  items: MatrixRow[];
}

export interface MatrixParams {
  kind?: MatrixKind;
  /** YYYY-MM-DD (NY), inclusivos. Sin ellos, el backend responde hoy. */
  from?: string;
  to?: string;
  /** Slug de la tienda o 'all'. */
  store?: string;
}

/**
 * Matriz RCS — órdenes y listas de TODAS las tiendas en un rango. Período y
 * tienda se filtran en el backend; estado, búsqueda y KPIs en el panel.
 */
export const rcsMatrixService = {
  async list({ kind = 'orders', ...params }: MatrixParams = {}): Promise<MatrixResponse> {
    const url = kind === 'lists' ? '/tracking/list-admin/matrix' : '/orders/matrix';
    const { data } = await api.get<MatrixResponse>(url, { params });
    return data;
  },
};

/**
 * Gestión de una orden desde el panel. Son los MISMOS endpoints que usa el
 * vendor site: acá no hay un backend aparte, sólo otra pantalla encima.
 */
export const orderAdminService = {
  async detail(orderId: string): Promise<OrderDetail> {
    const { data } = await api.get(`/orders/track/${orderId}`);
    return data.order as OrderDetail;
  },
  /** Aprobar: la tienda confirma que puede armar el pedido. */
  async review(orderId: string): Promise<void> {
    await api.patch(`/orders/${orderId}/review`);
  },
  /**
   * Etapa del pedido. Volver atrás (Completado → Listo) lo pide el backend con
   * clave maestra; por eso `password` viaja sólo cuando se retrocede.
   */
  async setFulfillment(orderId: string, status: string, password?: string): Promise<void> {
    await api.patch(`/orders/${orderId}/fulfillment`, { status, ...(password ? { password } : {}) });
  },
  /** Producto que no había: se reembolsa esa línea. */
  async markUnavailable(orderId: string, index: number): Promise<void> {
    await api.patch(`/orders/${orderId}/items/${index}/unavailable`);
  },
  async confirmPickup(orderId: string): Promise<void> {
    await api.patch(`/orders/${orderId}/pickup-confirm`);
  },
  /** Cobrado en la caja (efectivo/EBT): cierra el pago sin pasarela. */
  async payInStore(orderId: string): Promise<void> {
    await api.post(`/orders/${orderId}/pay-in-store`);
  },
};

/** YYYY-MM-DD de hoy en hora de Nueva York — el día que abre la pantalla. */
export function todayInNY(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());
}

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
export function centsToUsd(cents?: number): string {
  return usd.format((cents ?? 0) / 100);
}

/** Links de contacto a partir del E.164. Se arman acá, no viajan en cada fila. */
export function contactLinks(e164: string) {
  if (!e164) return null;
  return {
    whatsapp: `https://wa.me/${e164.replace('+', '')}`,
    call: `tel:${e164}`,
    sms: `sms:${e164}`,
  };
}
