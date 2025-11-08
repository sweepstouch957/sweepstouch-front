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
  /** PDF file */
  file: File | Blob;
  /** Si no lo mandas, se infiere del nombre del PDF (new_rochelle.pdf -> new-rochelle) */
  storeSlug?: string;
  /** "current" | "next"  */
  schedule?: 'current' | 'next';
  /** O rango explícito */
  startDate?: string; // ISO
  endDate?: string; // ISO
  title?: string;
}

export interface ScheduleCircularPayload {
  storeSlug: string;
  startDate: string; // ISO
  endDate: string; // ISO
  title?: string;
}

export interface OverviewResponse {
  totals: { active: number; scheduled: number; expired: number };
  byStore: Array<{ _id: string; last: Circular }>;
}

export class CircularService {
  /** Sube un PDF y crea el circular. Devuelve el documento creado */
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

  /** Agenda un circular sin archivo (luego puedes adjuntar con attachFile) */
  async schedule(payload: ScheduleCircularPayload): Promise<{ ok: boolean; circular: Circular }> {
    const res = await api.post('/circulars/schedule', payload);
    return res.data;
  }

  /** Adjunta/actualiza el PDF de un circular existente */
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

  /** KPIs y resumen por tienda (para las cards del dashboard) */
  async getOverview(): Promise<OverviewResponse> {
    const res = await api.get('/circulars/status/overview');
    return res.data;
  }

  /** Lista de circulares por tienda (ordenados desc por startDate) */
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
  // quita extensión
  const base = fileName.replace(/\.[^/.]+$/, '');
  // normaliza underscores/espacios a guiones
  const norm = base
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, '-');
  // deja solo [a-z0-9-]
  const slug = norm
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return slug.length ? slug : null;
}

export function inferTitleFromFilename(fileName: string): string {
  const base = fileName.replace(/\.[^/.]+$/, '');
  const cleaned = base.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  // Capitaliza simple
  return cleaned.replace(/\b\w/g, (m) => m.toUpperCase());
}

export const circularService = new CircularService();
