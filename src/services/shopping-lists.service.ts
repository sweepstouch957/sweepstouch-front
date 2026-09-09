// Consola de listas Pre-RCS y compras por recibo — tracking-service.
// /tracking/list-admin exige JWT (esta pantalla es de staff);
// /tracking/shopping-list/:qr/validate es el mismo endpoint que usa la tablet.

import { api } from '@/libs/axios';

export type ShoppingListStatus = 'pending' | 'validated' | 'expired';

export interface AdminShoppingListItem {
  name: string;
  price: string;
  quantity: number;
  unit?: string;
  imageUrl?: string;
  category?: string;
  sku?: string;
}

export interface AdminShoppingList {
  _id: string;
  qrCode: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  storeSlug: string;
  status: ShoppingListStatus;
  items: AdminShoppingListItem[];
  totalItems: number;
  pointsAwarded: number;
  validatedAt: string | null;
  validatedBy?: string;
  validatedItems?: string[];
  expiresAt: string | null;
  createdAt: string;
}

export interface ShoppingListSummary {
  validated: number;
  pending: number;
  expired: number;
  total: number;
  pointsAwarded: number;
}

export interface AdminReceiptProduct {
  name: string;
  price: number;
  quantity: number;
  matched: boolean;
}

export interface AdminReceipt {
  _id: string;
  qrCode: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  /** false = el cliente no existe en la base; la compra cuenta igual. */
  inDatabase: boolean;
  status: 'success' | 'failed';
  rejectionReason: string | null;
  receiptDate: string | null;
  receiptTotal: number | null;
  transactionId: string | null;
  pointsAwarded: number;
  products: AdminReceiptProduct[];
  matchedCount: number;
  productCount: number;
  createdAt: string;
}

export interface PurchasesByCustomer {
  customerId: string;
  customerName: string;
  customerPhone: string;
  inDatabase: boolean;
  receipts: number;
  successReceipts: number;
  points: number;
  spend: number;
  products: number;
  lastReceiptAt: string;
}

export interface PurchasesResponse {
  ok: boolean;
  totals: {
    receipts: number;
    success: number;
    failed: number;
    pointsAwarded: number;
    spend: number;
  };
  customers: PurchasesByCustomer[];
  topProducts: Array<{
    name: string;
    quantity: number;
    receipts: number;
    matchedReceipts: number;
    revenue: number;
  }>;
}

const BASE = '/tracking';

export const shoppingListsService = {
  lists: async (params: {
    storeSlug: string;
    status?: ShoppingListStatus;
    q?: string;
    page?: number;
    limit?: number;
  }): Promise<{ ok: boolean; total: number; items: AdminShoppingList[] }> => {
    const { data } = await api.get(`${BASE}/list-admin`, { params });
    return data;
  },

  summary: async (storeSlug: string): Promise<ShoppingListSummary> => {
    const { data } = await api.get(`${BASE}/list-admin/summary`, { params: { storeSlug } });
    return data;
  },

  /** +horas de vigencia o reabrir una lista mal validada. */
  update: async (
    qrCode: string,
    body: { extendHours?: number; expiresAt?: string; status?: ShoppingListStatus }
  ) => {
    const { data } = await api.patch(`${BASE}/list-admin/${qrCode}`, body);
    return data;
  },

  /** Valida la lista y acredita puntos — mismo endpoint que la tablet de caja. */
  validate: async (qrCode: string, validatedItems?: string[]) => {
    const { data } = await api.post(`${BASE}/shopping-list/${qrCode}/validate`, {
      validatedItems,
      cashierId: 'admin-panel',
    });
    return data as { ok: boolean; pointsAwarded: number; smsSent: boolean };
  },

  receipts: async (params: {
    storeSlug: string;
    status?: 'success' | 'failed';
    page?: number;
    limit?: number;
  }): Promise<{ ok: boolean; total: number; items: AdminReceipt[] }> => {
    const { data } = await api.get(`${BASE}/list-admin/receipts`, { params });
    return data;
  },

  purchases: async (storeSlug: string): Promise<PurchasesResponse> => {
    const { data } = await api.get(`${BASE}/list-admin/purchases`, { params: { storeSlug } });
    return data;
  },

  timeline: async (storeSlug: string, days = 30): Promise<{ ok: boolean; days: ListsTimelineDay[] }> => {
    const { data } = await api.get(`${BASE}/list-admin/timeline`, { params: { storeSlug, days } });
    return data;
  },

  surveys: async (storeSlug: string): Promise<SurveyResults> => {
    const { data } = await api.get(`${BASE}/list-admin/surveys`, { params: { storeSlug } });
    return data;
  },
};

export interface SurveyResults {
  ok: boolean;
  totals: { responses: number; customers: number; pointsAwarded: number; last7d: number };
  questions: Array<{
    question: string;
    total: number;
    answers: Array<{ answer: string; count: number }>;
  }>;
  recent: Array<{
    customerId: string;
    customerName: string;
    answers: Array<{ question: string; answer: string }>;
    pointsAwarded: number;
    createdAt: string;
  }>;
}

export interface ListsTimelineDay {
  date: string;
  listsCreated: number;
  listsValidated: number;
  points: number;
  receipts: number;
  receiptsOk: number;
}

export const shoppingListsQK = {
  lists: (storeSlug: string, status?: string, q?: string) =>
    ['shopping-lists', storeSlug, status ?? 'all', q ?? ''] as const,
  summary: (storeSlug: string) => ['shopping-lists', 'summary', storeSlug] as const,
  receipts: (storeSlug: string, status?: string) =>
    ['shopping-lists', 'receipts', storeSlug, status ?? 'all'] as const,
  purchases: (storeSlug: string) => ['shopping-lists', 'purchases', storeSlug] as const,
};
