// src/services/qr.service.ts
import { api } from '@/libs/axios';

export type QrLevel = 'L' | 'M' | 'Q' | 'H';
export type QrFormat = 'png' | 'svg';

const basePath = '/qr';

/* ====== Tipos de respuestas ====== */
export interface CloudinaryRef {
  secure_url: string;
  public_id: string;
  url?: string;
}

export interface GenerateQrBody {
  url: string;
  size?: number;   // 128..2048 (default 512)
  margin?: number; // 0..8 (default 2)
  level?: QrLevel; // default 'M'
  format?: QrFormat; // default 'png'
  folder?: string; // ej: 'qr-codes/stores/<slug>'
}

export interface GenerateQrResponse {
  success: boolean;
  id: string;
  width: number;
  height: number;
  moduleCount: number;
  format: QrFormat;
  level: QrLevel;
  margin: number;
  url: string;
  cloudinary: CloudinaryRef;
  previewDataUrl?: string;
}

export interface QrImage {
  secureUrl: string;
  publicId: string;
  folder?: string;
  size?: number;
  format?: QrFormat;
  level?: QrLevel;
  generatedAt?: string; // ISO date
}

export interface StoreQr {
  _id: string;
  store: string | { _id: string; [k: string]: any };
  slug: string;
  link: string;   // https://st.sweepstouch.com/?slug=<slug>
  qr: QrImage;
  createdAt: string;
  updatedAt: string;
}

export interface SweepstakeQr {
  _id: string;
  sweepstake: string | { _id: string; [k: string]: any };
  store: string | { _id: string; [k: string]: any };
  slug: string;
  baseLink: string;
  link: string;
  qr: QrImage;
  createdAt: string;
  updatedAt: string;
}

export interface SweepstakeQrResponse {
  success: boolean;
  data: SweepstakeQr | null;
  isFallback?: boolean;
  fallbackLink?: string;
  slug?: string;
}

export type QrKind = 'store' | 'sweepstake';

export interface StorePopulated {
  _id: string;
  name?: string;
  slug?: string;
  image?: string;
}

// Unified item returned by GET /qr/list (store + sweepstake QRs merged)
export interface QrListItem {
  _id: string;
  kind: QrKind;
  store?: StorePopulated | string;
  slug: string;
  link: string;
  baseLink?: string;      // only sweepstake
  sweepstakeName?: string; // only sweepstake
  qr: QrImage;
  createdAt: string;
  updatedAt: string;
}

export interface QrListResponse {
  success: boolean;
  total: number;
  page: number;
  limit: number;
  data: QrListItem[];
}

/* ====== Endpoints ====== */

// GET /qr/list → todos los QR persistidos (tienda + sorteo), filtrable por store
export const listQrs = async (params?: {
  store?: string;
  kind?: 'all' | QrKind;
  page?: number;
  limit?: number;
}): Promise<QrListResponse> => {
  const { data } = await api.get(`${basePath}/list`, { params });
  return data as QrListResponse;
};

// POST /qr → genera/sube un QR
export const generateQr = async (payload: GenerateQrBody): Promise<GenerateQrResponse> => {
  const { data } = await api.post(`${basePath}`, payload);
  return data as GenerateQrResponse;
};

// GET /qr → genera vía query params (atajo)
export const generateQrViaGet = async (params: GenerateQrBody): Promise<GenerateQrResponse> => {
  const { data } = await api.get(`${basePath}`, { params });
  return data as GenerateQrResponse;
};

// GET /qr/store/:storeId/generic → StoreQr completo
export const getStoreGenericQr = async (
  storeId: string,
  opts?: { populate?: boolean }
): Promise<StoreQr> => {
  const { data } = await api.get(`${basePath}/store/${storeId}/generic`, {
    params: { populate: opts?.populate ? 1 : undefined },
  });
  // backend responde { success, data }
  return data.data as StoreQr;
};

// GET /qr/sweepstake/:sweepstakeId/store/:storeId → SweepstakeQr o fallback (nunca 404)
export const getSweepstakeOptinQr = async (
  sweepstakeId: string,
  storeId: string,
  opts?: { populate?: boolean }
): Promise<SweepstakeQrResponse> => {
  const { data } = await api.get(
    `${basePath}/sweepstake/${sweepstakeId}/store/${storeId}`,
    { params: { populate: opts?.populate ? 1 : undefined } }
  );
  return data as SweepstakeQrResponse;
};

// POST /qr/stores/:storeId/generic → genera/actualiza QR genérico de tienda
export const upsertStoreGenericQr = async (storeId: string): Promise<{ success: boolean; generic: StoreQr }> => {
  const { data } = await api.post(`${basePath}/stores/${storeId}/generic`);
  return data;
};

// POST /qr/sweepstake/:sweepstakeId/store/ → genera QR opt-in del sorteo para una tienda
export const upsertSweepstakeOptinQr = async (sweepstakeId: string, storeId: string): Promise<{ success: boolean; optin: SweepstakeQr }> => {
  const { data } = await api.post(`${basePath}/sweepstake/${sweepstakeId}/store/`, { storeId });
  return data;
};
