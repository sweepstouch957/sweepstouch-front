// src/services/analytics.service.ts — Campaign Analytics Service
import { api } from '@/libs/axios';

const TRACKING_BASE = '/tracking/analytics';

/* ─── Types ─────────────────────────────────────────────── */

export interface AnalyticsOverview {
  kpis: {
    totalScans: number;
    uniqueCustomers: number;
    confirmedPurchases: number;
    totalPoints: number;
    totalProductsPurchased: number;
    totalProductsInCampaign: number;
    conversionRate: number;
  };
  shoppingLists: {
    total: number;
    validated: number;
    pending: number;
    totalItems: number;
    uniqueCustomers: number;
  };
  messaging: {
    total: number;
    delivered: number;
    errors: number;
    mms: number;
    sms: number;
    deliveryRate: number;
  };
}

export interface CampaignAnalytics {
  circularId: string;
  storeId: string;
  storeSlug: string;
  totalScans: number;
  uniqueCustomers: number;
  confirmedPurchases: number;
  totalPoints: number;
  productsPurchased: number;
  conversionRate: number;
  firstScan: string;
  lastScan: string;
}

export interface CustomerAnalytics {
  customerId: string;
  customerName: string;
  customerPhone: string;
  totalScans: number;
  totalPoints: number;
  confirmedPurchases: number;
  productsPurchased: number;
  storeCount: number;
  firstVisit: string;
  lastVisit: string;
}

export interface ProductAnalytics {
  product: string;
  category: string;
  price: string;
  imageUrl?: string;
  timesPurchased?: number;
  timesSelected?: number;
  uniqueCustomers: number;
  matched?: boolean;
}

export interface ProductDetail {
  circularId?: string;
  storeSlug?: string;
  product: string;
  category: string;
  price: string;
  emoji?: string;
  imageUrl?: string;
  quantity: number;
  uniqueCustomers: number;
  lastPurchased?: string;
  matched?: boolean;
}

export interface TimelinePoint {
  date: string;
  scans: number;
  customers: number;
  points: number;
  confirmed: number;
}

export interface ListTimelinePoint {
  _id: string;
  lists: number;
  validated: number;
  items: number;
}

export interface AnalyticsStore {
  _id: string;
  storeSlug: string;
  storeName: string;
  totalScans: number;
}

export interface AnalyticsFilters {
  storeId?: string;
  from?: string;
  to?: string;
  groupBy?: 'day' | 'week' | 'month';
  limit?: number;
}

/* ─── API Calls ─────────────────────────────────────────── */

function buildParams(filters: AnalyticsFilters): Record<string, string> {
  const p: Record<string, string> = {};
  if (filters.storeId) p.storeId = filters.storeId;
  if (filters.from) p.from = filters.from;
  if (filters.to) p.to = filters.to;
  if (filters.groupBy) p.groupBy = filters.groupBy;
  if (filters.limit) p.limit = String(filters.limit);
  return p;
}

export async function fetchOverview(filters: AnalyticsFilters = {}): Promise<AnalyticsOverview> {
  const { data } = await api.get(`${TRACKING_BASE}/overview`, { params: buildParams(filters) });
  return data;
}

export interface MessagingStats {
  total: number;
  delivered: number;
  errors: number;
  mms: number;
  sms: number;
  deliveryRate: number;
}

/** Enviados/entregados por tienda (sent/delivered de los SMS/MMS de sus campañas). */
export async function fetchMessaging(filters: AnalyticsFilters = {}): Promise<MessagingStats> {
  const { data } = await api.get(`${TRACKING_BASE}/messaging`, { params: buildParams(filters) });
  return data;
}

export async function fetchCampaigns(filters: AnalyticsFilters = {}): Promise<CampaignAnalytics[]> {
  const { data } = await api.get(`${TRACKING_BASE}/campaigns`, { params: buildParams(filters) });
  return data.campaigns;
}

export async function fetchCustomers(filters: AnalyticsFilters = {}): Promise<CustomerAnalytics[]> {
  const { data } = await api.get(`${TRACKING_BASE}/customers`, { params: buildParams(filters) });
  return data.customers;
}

export async function fetchProducts(filters: AnalyticsFilters = {}): Promise<{ purchased: ProductAnalytics[]; selected: ProductAnalytics[] }> {
  const { data } = await api.get(`${TRACKING_BASE}/products`, { params: buildParams(filters) });
  return { purchased: data.purchased, selected: data.selected };
}

export async function fetchTimeline(filters: AnalyticsFilters = {}): Promise<{ scans: TimelinePoint[]; shoppingLists: ListTimelinePoint[] }> {
  const { data } = await api.get(`${TRACKING_BASE}/timeline`, { params: buildParams(filters) });
  return { scans: data.scans, shoppingLists: data.shoppingLists };
}

export async function fetchAnalyticsStores(): Promise<AnalyticsStore[]> {
  const { data } = await api.get(`${TRACKING_BASE}/stores`);
  return data.stores;
}

export interface StoreShortlink {
  code: string;
  url: string;        // url destino larga (.../rcs/{customerId}?store=...)
  hits: number;       // clicks
  createdAt: string;
  shortUrl: string;   // swtrcs.com/s/CODE
}

export interface StoreShortlinksResponse {
  storeSlug: string;
  count: number;
  totalClicks: number;
  clickedLinks: number;
  links: StoreShortlink[];
}

/** Shortlinks generados para una tienda (filtrados por el slug embebido en la url destino). */
export async function fetchStoreShortlinks(slug: string, limit = 100): Promise<StoreShortlinksResponse> {
  const { data } = await api.get(`/tracking/short-link/by-store/${encodeURIComponent(slug)}`, { params: { limit } });
  return data;
}

export interface CampaignClicks {
  campaignId: string;
  links: number;
  clicks: number;
  clicked: number;
  clickRate: number; // % de links con al menos un click
}

/** Clicks de shortlink agregados por campaña para una tienda. */
export async function fetchStoreCampaignClicks(slug: string): Promise<{ storeSlug: string; campaigns: CampaignClicks[] }> {
  const { data } = await api.get(`/tracking/short-link/stats/campaigns/${encodeURIComponent(slug)}`);
  return data;
}

/** Mapa campaignId → título (para etiquetar los charts de clicks por campaña). Best-effort. */
export async function fetchStoreCampaignTitles(storeId: string): Promise<Record<string, string>> {
  try {
    const { data } = await api.get('/campaigns/filter', { params: { storeId, limit: 200 } });
    const list: any[] = data?.data || data?.campaigns || [];
    const map: Record<string, string> = {};
    for (const c of list) map[c._id] = c.title || c.name || c._id;
    return map;
  } catch {
    return {};
  }
}

export async function fetchCampaignProducts(filters: AnalyticsFilters = {}): Promise<{
  purchased: ProductDetail[];
  selected: ProductDetail[];
  byCampaign: Record<string, { storeSlug: string; products: ProductDetail[] }>;
}> {
  const { data } = await api.get(`${TRACKING_BASE}/campaigns/products`, { params: buildParams(filters) });
  return { purchased: data.purchased || [], selected: data.selected || [], byCampaign: data.byCampaign || {} };
}
