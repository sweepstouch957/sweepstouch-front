// services/circulars.service.ts
import { api } from '@/libs/axios';

export type CircularStatus = 'draft' | 'scheduled' | 'active' | 'expired' | 'archived';

export interface Circular {
  _id: string;
  store: string; // ObjectId
  storeSlug: string;
  title: string;
  fileKey: string;
  fileUrl: string;
  startDate: string; // ISO
  endDate: string; // ISO
  status: CircularStatus;
  expiringSoon?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UploadCircularPayload {
  file: File | Blob;
  storeSlug?: string;
  schedule?: 'current' | 'next';
  startDate?: string;
  endDate?: string;
  title?: string;
}

export interface ScheduleCircularPayload {
  storeSlug: string;
  startDate: string;
  endDate: string;
  title?: string;
}

export interface ReschedulePayload {
  circularId: string;
  startDate: string;
  endDate: string;
  title?: string;
}

export interface OverviewStoreInfo {
  _id: string; // slug
  last: Circular;
  store?: {
    _id: string;
    slug: string;
    name: string;
    image?: string;
    customerCount?: number;
    type?: string;
    address?: string;
    zipCode?: string;
    membershipType?: string;
  };
}

export interface OverviewResponse {
  totals: { active: number; scheduled: number; expired: number };
  byStore: OverviewStoreInfo[];
}

export class CircularService {
  async upload(payload: UploadCircularPayload): Promise<{ ok: boolean; circular: Circular }> {
    const form = new FormData();
    form.append('file', payload.file);
    if (payload.storeSlug) form.append('storeSlug', payload.storeSlug);
    if (payload.schedule) form.append('schedule', payload.schedule);
    if (payload.startDate) form.append('startDate', payload.startDate);
    if (payload.endDate) form.append('endDate', payload.endDate);
    if (payload.title) form.append('title', payload.title);

    const res = await api.post('/circulars/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  }

  async schedule(payload: ScheduleCircularPayload): Promise<{ ok: boolean; circular: Circular }> {
    const res = await api.post('/circulars/schedule', payload);
    return res.data;
  }

  /** Reprograma un circular existente (nuevas fechas o título) */
  async reschedule(payload: ReschedulePayload): Promise<{ ok: boolean; circular: Circular }> {
    const { circularId, ...body } = payload;
    const res = await api.patch(`/circulars/${circularId}/reschedule`, body);
    return res.data;
  }

  async attachFile(
    circularId: string,
    file: File | Blob
  ): Promise<{ ok: boolean; circular: Circular }> {
    const form = new FormData();
    form.append('file', file);
    const res = await api.patch(`/circulars/${circularId}/attach`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  }

  /** 🔍 Overview con filtro por slug o búsqueda por nombre/dirección (q) */
  async getOverview(params?: { slug?: string; q?: string }): Promise<OverviewResponse> {
    const res = await api.get('/circulars/status/overview', { params });
    return res.data;
  }

  async getByStore(storeSlug: string): Promise<{ storeSlug: string; items: Circular[] }> {
    const res = await api.get(`/circulars/store/${storeSlug}`);
    return res.data;
  }

  async getAlerts(hours = 48) {
    const res = await api.get('/circulars/alerts', { params: { hours } });
    return res.data;
  }
}

/** Helpers para filename -> slug/título */
export function inferStoreSlugFromFilename(fileName: string): string | null {
  const base = fileName.replace(/\.[^/.]+$/, '');
  const norm = base
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, '-');
  const slug = norm
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return slug.length ? slug : null;
}

export function inferTitleFromFilename(fileName: string): string {
  const base = fileName.replace(/\.[^/.]+$/, '');
  const cleaned = base.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  return cleaned.replace(/\b\w/g, (m) => m.toUpperCase());
}

export const circularService = new CircularService();
