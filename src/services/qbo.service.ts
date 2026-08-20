// sweepstouch-front/src/services/qbo.service.ts
//
// Cartera de QuickBooks Online. El contador factura ahí a mano desde hace años
// (Design Fee, Merchant Set-Up, Sweepstakes...), así que QBO tiene la deuda completa
// y Mongo solo la parte que genera el pipeline. Para "cuánto deben", manda QBO.

import { api } from '@/libs/axios';

/* ══════════ Types ══════════ */

export interface QboAging {
  current: number;
  d1_30: number;
  d31_60: number;
  d61_90: number;
  d90plus: number;
}

export interface QboLastPayment {
  date: string; // YYYY-MM-DD
  amount: number;
  qboId: string;
}

export interface QboBalanceRow {
  qboCustomerId: string;
  qboName: string;

  storeId: string | null;
  storeName: string | null;
  storeSlug: string | null;
  /** `active` de la tienda en Mongo. null = sin vincular. */
  storeActive: boolean | null;
  /** { itemId: saldo prorrateado }. Alimenta el filtro por categoría en cliente. */
  byCategory: Record<string, number>;
  membershipType: string | null;
  paymentMethod: string | null;
  /** false = el Customer existe en QBO pero ninguna tienda de Mongo lo reclama */
  linked: boolean;

  balance: number;
  openInvoices: number;
  maxDaysOverdue: number;
  aging: QboAging;

  lastPayment: QboLastPayment | null;

  /** Pendiente según Mongo. null si la tienda no está vinculada. */
  mongoPending: number | null;
  /** balance(QBO) − mongoPending. null si no hay con qué comparar. */
  drift: number | null;
}

export interface QboTotals {
  /** Saldo neto: suma de Customer.Balance, ya descontados créditos sin aplicar. */
  balance: number;
  /** Suma de facturas abiertas. Es la base de la antigüedad y es ≥ balance. */
  invoiceTotal: number;
  /** invoiceTotal − balance. Créditos y pagos que el contador no aplicó a una factura. */
  unappliedCredits: number;
  /** Facturas abiertas con vencimiento pasado. Se calcula sobre invoiceTotal. */
  overdue: number;
  openInvoices: number;
  customers: number;
  linked: number;
  unlinked: number;
  withDrift: number;
  aging: QboAging;
}

/** Item de QuickBooks presente en facturas abiertas. `full` = "Padre:Hijo". */
export interface QboCategory {
  id: string;
  group: string;
  label: string;
  full: string;
  amount: number;
  invoices: number;
}

export interface QboDateRange {
  /** YYYY-MM-DD. null = sin límite. */
  from: string | null;
  to: string | null;
  /** true = los saldos salen de las facturas del rango, no de Customer.Balance. */
  ranged: boolean;
  /** 'service' = se filtró por la fecha del servicio, no por la de emisión. */
  basis?: 'issue' | 'service';
}

export interface QboBalancesResponse {
  ok: boolean;
  range: QboDateRange;
  /** Solo las categorías con saldo abierto: un checkbox que no filtra nada es ruido. */
  categories: QboCategory[];
  totals: QboTotals;
  stores: QboBalanceRow[];
  /** El backend cachea 3 min: son 3 queries a QuickBooks y ~5 s en frío. */
  cached?: boolean;
  cachedAt?: string;
}

export interface QboInvoiceRow {
  /** Categorías que toca la factura, en formato "Padre:Hijo". */
  categories?: string[];
  /** Porción atribuible a las categorías filtradas. null si no hay filtro. */
  filtered?: { total: number; balance: number } | null;
  qboId: string;
  docNumber: string | null;
  txnDate: string | null;
  dueDate: string | null;
  total: number;
  balance: number;
  paid: number;
  status: 'open' | 'partial' | 'paid';
  daysOverdue: number;
}

export interface QboPaymentRow {
  qboId: string;
  date: string | null;
  amount: number;
  note: string | null;
}

/** Libro de un cliente de QuickBooks: sirva o no una tienda de Mongo. */
export interface QboCustomerLedger {
  ok: boolean;
  found: boolean;
  /** El mismo rango que filtra la tabla; el modal ya no muestra todo el histórico. */
  range: QboDateRange;
  /** Categorías aplicadas y cuántas facturas quedaron fuera por ellas. */
  filters: {
    items: string[];
    hiddenByCategory: number;
    /** Suma de la porción filtrada sobre lo mostrado. null si no hay filtro. */
    totals: { total: number; balance: number } | null;
  };
  qboCustomerId: string;
  qboName: string;
  /** Neto de créditos, tal como lo calcula QuickBooks. */
  balance: number;
  /** Suma de facturas abiertas. Puede ser mayor que `balance`. */
  invoiceBalance: number;
  openInvoices: number;
  totalInvoices: number;
  totalPaid: number;
  maxDaysOverdue: number;
  aging: QboAging;
  lastPayment: QboPaymentRow | null;
  invoices: QboInvoiceRow[];
  payments: QboPaymentRow[];
}

export type QboStoreDetail =
  | {
      ok: boolean;
      linked: true;
      storeId: string;
      storeName: string;
      qboCustomerId: string;
      balance: number;
      openInvoices: number;
      maxDaysOverdue: number;
      aging: QboAging;
      lastPayment: QboPaymentRow | null;
      invoices: QboInvoiceRow[];
      payments: QboPaymentRow[];
    }
  | {
      ok: boolean;
      linked: false;
      reason: 'not_linked' | 'store_not_found';
      storeId?: string;
      storeName?: string;
    };

export interface QboInvoiceLine {
  description: string | null;
  item: string | null;
  itemId: string | null;
  qty: number | null;
  unitPrice: number | null;
  amount: number;
}

export interface QboInvoiceDetail {
  ok: boolean;
  found: boolean;
  qboId: string;
  docNumber: string | null;
  txnDate: string | null;
  dueDate: string | null;
  customer: { qboCustomerId: string | null; name: string | null; email: string | null };
  billAddr: string | null;
  terms: string | null;
  memo: string | null;
  privateNote: string | null;
  currency: string;
  lines: QboInvoiceLine[];
  subtotal: number;
  total: number;
  balance: number;
  paid: number;
  status: 'open' | 'partial' | 'paid';
  daysOverdue: number;
  applied: Array<{ type: string; qboId: string }>;
}

export interface QboStatus {
  ok: boolean;
  connected: boolean;
  companyName?: string | null;
  realmId: string | null;
  env?: 'sandbox' | 'production';
  error?: string;
}

/** Candidato de QuickBooks para una tienda, con la evidencia que lo sostiene. */
export interface QboCandidate {
  qboCustomerId: string;
  qboName: string;
  balance: number;
  address: string;
  /** El número de calle coincide — es la señal fuerte. */
  streetHit: boolean;
  zipHit: boolean;
  /** 0–1. Similitud de la marca (texto antes del número). */
  brandSim: number;
  score: number;
}

export interface QboProposal {
  storeId: string;
  storeName: string;
  storeAddress: string;
  /** auto = vinculable sin revisar · review = empate o marca floja · none = ni la calle casa */
  confidence: 'auto' | 'review' | 'none';
  margin: number;
  /** El mejor candidato ya pertenece a otra tienda. */
  conflict: boolean;
  candidates: QboCandidate[];
}

export interface QboLinkResult {
  ok: boolean;
  dryRun: boolean;
  qboCustomers: number;
  summary: { total: number; auto: number; review: number; none: number };
  proposals: QboProposal[];
}

export interface QboCustomerRow {
  qboCustomerId: string;
  qboName: string;
  address: string;
  balance: number;
  linkedStoreId: string | null;
  linkedStoreName: string | null;
}

export interface QboCustomersResponse {
  ok: boolean;
  customers: QboCustomerRow[];
  total: number;
}

export interface QboSyncLedger {
  invoices: number;
  payments: number;
  invoicedTotal: number;
  paidTotal: number;
  pending: number;
}

export interface QboSyncPreview {
  ok: boolean;
  storeId: string;
  storeName: string;
  qboCustomerId: string;
  willDelete: QboSyncLedger;
  willImport: QboSyncLedger;
  sample: Array<{
    docNumber: string | null;
    txnDate: string | null;
    dueDate: string | null;
    total: number;
    balance: number;
    lines: Array<{ description: string | null; amount: number; kind: string; item: string | null }>;
  }>;
}

export interface QboSyncResult {
  ok: boolean;
  storeId: string;
  storeName: string;
  deleted: { invoices: number; payments: number };
  imported: { invoices: number; payments: number };
  unlinkedPayments: number;
}

export interface QboRetryResult {
  ok: boolean;
  invoices: { pushed: number; failed: number; skipped: number };
  payments: { pushed: number; failed: number; pending: number };
}

/* ══════════ API ══════════ */

const BASE = '/billing/invoices/qbo';

export const qboService = {
  status: async (): Promise<QboStatus> => {
    const { data } = await api.get(`${BASE}/status`);
    return data;
  },

  /** `force` salta el cache de 10 min del backend. Solo para el botón de actualizar. */
  balances: async (
    params: {
      from?: string | null;
      to?: string | null;
      force?: boolean;
      basis?: 'issue' | 'service';
    } = {}
  ): Promise<QboBalancesResponse> => {
    const qs = new URLSearchParams();
    if (params.from) qs.set('from', params.from);
    if (params.to) qs.set('to', params.to);
    if (params.basis === 'service') qs.set('basis', 'service');
    if (params.force) qs.set('force', '1');
    const suffix = qs.toString();
    const { data } = await api.get(`${BASE}/balances${suffix ? `?${suffix}` : ''}`);
    return data;
  },

  customerLedger: async (
    qboCustomerId: string,
    opts?: { from?: string | null; to?: string | null; items?: string[] }
  ): Promise<QboCustomerLedger> => {
    const qs = new URLSearchParams();
    if (opts?.from) qs.set('from', opts.from);
    if (opts?.to) qs.set('to', opts.to);
    if (opts?.items?.length) qs.set('items', opts.items.join(','));
    const suffix = qs.toString();
    const { data } = await api.get(
      `${BASE}/customers/${qboCustomerId}/ledger${suffix ? `?${suffix}` : ''}`
    );
    return data;
  },

  invoice: async (qboId: string): Promise<QboInvoiceDetail> => {
    const { data } = await api.get(`${BASE}/invoices/${qboId}`);
    return data;
  },

  /**
   * Descarga el export.
   *
   * Va por axios y no por window.open: la API pide Bearer token en cabecera y
   * una ventana nueva no lo lleva — devolvía UNAUTHORIZED. Se trae como blob y
   * se dispara la descarga con un enlace temporal.
   */
  downloadExport: async (opts: {
    scope: 'stores' | 'invoices' | 'lines';
    format: 'csv' | 'xlsx';
    from?: string | null;
    to?: string | null;
    items?: string[];
    includePaid?: boolean;
    /** 'issue' = fecha de emisión de la factura · 'service' = fecha del servicio */
    basis?: 'issue' | 'service';
  }): Promise<void> => {
    const params: Record<string, string> = { scope: opts.scope, format: opts.format };
    if (opts.from) params.from = opts.from;
    if (opts.to) params.to = opts.to;
    if (opts.items?.length) params.items = opts.items.join(',');
    if (opts.includePaid) params.all = '1';
    if (opts.basis === 'service') params.basis = 'service';

    const res = await api.get(`${BASE}/export`, { params, responseType: 'blob' });

    // El nombre lo manda el backend en Content-Disposition; si falta, uno decente
    const disp = String(res.headers?.['content-disposition'] ?? '');
    const match = disp.match(/filename="?([^"]+)"?/);
    const filename = match?.[1] || `cartera_${opts.scope}.${opts.format}`;

    const url = URL.createObjectURL(res.data as Blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Sin revoke, el blob queda en memoria hasta recargar la página
    URL.revokeObjectURL(url);
  },

  /**
   * Resumen ejecutivo. `md` se descarga como archivo (es el formato que una IA
   * lee sin perder las tablas); `html` se abre en pestaña con el diálogo de
   * impresión listo, de donde sale el PDF.
   *
   * Va por axios como el export: window.open no lleva el Bearer token.
   */
  summary: async (opts: {
    format: 'md' | 'html';
    from?: string | null;
    to?: string | null;
    basis?: 'issue' | 'service';
    top?: number;
  }): Promise<void> => {
    const params: Record<string, string> = { format: opts.format };
    if (opts.from) params.from = opts.from;
    if (opts.to) params.to = opts.to;
    if (opts.basis === 'service') params.basis = 'service';
    if (opts.top) params.top = String(opts.top);
    if (opts.format === 'html') params.print = '1';

    const res = await api.get(`${BASE}/summary`, { params, responseType: 'blob' });
    const stamp = new Date().toISOString().slice(0, 10);

    if (opts.format === 'html') {
      // Blob en pestaña nueva: hereda el origen, así que el auto-print del HTML
      // se dispara y el usuario solo elige "Guardar como PDF".
      const url = URL.createObjectURL(new Blob([res.data as Blob], { type: 'text/html' }));
      window.open(url, '_blank', 'noopener');
      // Revoke diferido: revocar de inmediato deja la pestaña en blanco
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      return;
    }

    const url = URL.createObjectURL(res.data as Blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cartera_${stamp}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },

  /** URL del PDF que sirve QuickBooks. Se abre en pestaña nueva, no pasa por React. */
  invoicePdfUrl: (qboId: string, download = false) =>
    `${api.defaults.baseURL ?? ''}${BASE}/invoices/${qboId}/pdf${download ? '?download=1' : ''}`,

  storeDetail: async (storeId: string): Promise<QboStoreDetail> => {
    const { data } = await api.get(`${BASE}/stores/${storeId}`);
    return data;
  },

  /** Catálogo completo de QuickBooks, para elegir a mano. */
  customers: async (search = ''): Promise<QboCustomersResponse> => {
    const { data } = await api.get(`${BASE}/customers`, { params: search ? { search } : undefined });
    return data;
  },

  /** Sin `apply` solo reporta qué vincularía. Con apply=true escribe las de confianza 'auto'. */
  linkCustomers: async (apply = false, storeId?: string): Promise<QboLinkResult> => {
    const params = new URLSearchParams();
    if (apply) params.set('apply', '1');
    if (storeId) params.set('storeId', storeId);
    const qs = params.toString();
    const { data } = await api.post(`${BASE}/link-customers${qs ? `?${qs}` : ''}`);
    return data;
  },

  linkStore: async (storeId: string, qboCustomerId: string) => {
    const { data } = await api.post(`${BASE}/stores/${storeId}/link`, { qboCustomerId });
    return data;
  },

  unlinkStore: async (storeId: string) => {
    const { data } = await api.delete(`${BASE}/stores/${storeId}/link`);
    return data;
  },

  syncPreview: async (storeId: string): Promise<QboSyncPreview> => {
    const { data } = await api.get(`${BASE}/stores/${storeId}/sync-preview`);
    return data;
  },

  /** ⚠️ Borra las facturas y pagos de la tienda en Mongo y trae los de QuickBooks. */
  syncFromQbo: async (storeId: string): Promise<QboSyncResult> => {
    const { data } = await api.post(`${BASE}/stores/${storeId}/sync`, { confirm: true });
    return data;
  },

  retryPending: async (limit = 200): Promise<QboRetryResult> => {
    const { data } = await api.post(`${BASE}/retry-pending?limit=${limit}`);
    return data;
  },

  /** Guarda el refresh token del consentimiento inicial. Devuelve el status recalculado. */
  saveRefreshToken: async (refreshToken: string): Promise<QboStatus> => {
    const { data } = await api.post(`${BASE}/refresh-token`, { refreshToken });
    return data;
  },
};

/* ══════════ Query Keys ══════════ */

export const qboQK = {
  status: () => ['qbo', 'status'] as const,
  balances: (from?: string | null, to?: string | null, basis?: string) =>
    ['qbo', 'balances', from ?? '*', to ?? '*', basis ?? 'issue'] as const,
  invoice: (qboId: string) => ['qbo', 'invoice', qboId] as const,
  customerLedger: (
    qboCustomerId: string,
    from?: string | null,
    to?: string | null,
    items?: string[]
  ) => ['qbo', 'ledger', qboCustomerId, from ?? '*', to ?? '*', (items ?? []).join(',')] as const,
  storeDetail: (storeId: string) => ['qbo', 'store', storeId] as const,
  customers: (search: string) => ['qbo', 'customers', search] as const,
  proposals: (storeId?: string) => ['qbo', 'proposals', storeId ?? 'all'] as const,
  syncPreview: (storeId: string) => ['qbo', 'sync-preview', storeId] as const,
};
