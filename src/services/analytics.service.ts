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

export async function fetchCampaignProducts(filters: AnalyticsFilters = {}): Promise<{
  purchased: ProductDetail[];
  selected: ProductDetail[];
  byCampaign: Record<string, { storeSlug: string; products: ProductDetail[] }>;
}> {
  const { data } = await api.get(`${TRACKING_BASE}/campaigns/products`, { params: buildParams(filters) });
  return { purchased: data.purchased || [], selected: data.selected || [], byCampaign: data.byCampaign || {} };
}
