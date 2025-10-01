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
  baseLink: string; // confirmationLink base (sin slug)
  link: string;     // base + ?slug=<slug>
  qr: QrImage;
  createdAt: string;
  updatedAt: string;
}

/* ====== Endpoints ====== */

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

// GET /qr/sweepstake/:sweepstakeId/store/:storeId → SweepstakeQr completo
export const getSweepstakeOptinQr = async (
  sweepstakeId: string,
  storeId: string,
  opts?: { populate?: boolean }
): Promise<SweepstakeQr> => {
  const { data } = await api.get(
    `${basePath}/sweepstake/${sweepstakeId}/store/${storeId}`,
    { params: { populate: opts?.populate ? 1 : undefined } }
  );
  return data.data as SweepstakeQr;
};
