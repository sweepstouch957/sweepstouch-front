// src/services/monitor.service.ts — datos extra para el Monitor (order-service vía gateway).
import { api } from '@/libs/axios';

export interface OrderStats {
  ok: boolean;
  kpis: {
    orders: number;
    netRevenueCents: number;
    grossRevenueCents: number;
    refundCents: number;
    uniqueCustomers: number;
  };
  byStatus: Record<string, number>;
  byPaymentMethod: Record<string, { count: number; netCents: number }>;
  topProducts: { _id: string; qty: number; revenueCents: number; imageUrl?: string }[];
  topCustomers: { _id: string; name?: string; phone?: string; orders: number; spentCents: number }[];
}

export interface OrderTimelinePoint {
  date: string;
  orders: number;
  netCents: number;
  customers: number;
}

export interface MonitorOrder {
  _id: string;
  orderNumber: string;
  fulfillmentStatus: string;
  paymentStatus?: string;
  paymentMethod?: string;
  customerName?: string;
  customerPhone?: string;
  subtotalCents: number;
  refundTotalCents: number;
  paidAt?: string;
  createdAt: string;
}

export async function fetchOrderStats(storeId: string): Promise<OrderStats> {
  const { data } = await api.get(`/orders/store/${storeId}/stats`);
  return data;
}

export async function fetchOrderTimeline(storeId: string, days = 30): Promise<{ ok: boolean; timeline: OrderTimelinePoint[] }> {
  const { data } = await api.get(`/orders/store/${storeId}/timeline`, { params: { days } });
  // El backend devuelve { ok, timeline } o { ok, rows } según versión — normalizamos.
  const timeline: OrderTimelinePoint[] = (data.timeline || data.rows || []).map((r: any) => ({
    date: r.date || r._id,
    orders: r.orders || 0,
    netCents: r.netCents || 0,
    customers: Array.isArray(r.customers) ? r.customers.length : (r.customers || 0),
  }));
  return { ok: data.ok !== false, timeline };
}

export async function fetchStoreOrders(storeId: string, opts: { status?: string; limit?: number } = {}): Promise<MonitorOrder[]> {
  const { data } = await api.get(`/orders/store/${storeId}`, { params: { status: opts.status, limit: opts.limit || 50 } });
  return data.items || [];
}

/** Health ping for a gateway endpoint. Throws on failure so callers can time/handle it. */
export async function pingHealthTarget(url: string, params?: Record<string, unknown>): Promise<void> {
  await api.get(url, { params, timeout: 8000 });
}
