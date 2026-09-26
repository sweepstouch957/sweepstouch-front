import { api } from '@/libs/axios';

export interface UploadResponse {
  url: string;
  public_id: string;
}

export interface S3UploadResponse {
  ok: boolean;
  key: string;
  url: string;
}

// Cloudinary — field name must be "image" (matches multer.single("image") on the service)
// Content-Type must be undefined so axios auto-adds multipart/form-data + boundary from FormData
// (the api instance defaults to application/json which would break FormData uploads)
export const uploadCampaignImage = async (
  image: File,
  folder: string = 'campaigns',
  onProgress?: (pct: number) => void
): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('image', image);
  formData.append('folder', folder);
  const response = await api.post('/upload', formData, {
    headers: { 'Content-Type': undefined },
    onUploadProgress: onProgress
      ? (e) => e.total && onProgress(Math.round((e.loaded / e.total) * 100))
      : undefined,
  });
  return response.data;
};

// ─── Arte de campaña pesado (hasta 100 MB) ───────────────────────────────────
// El MMS exige < 500 KB, pero de un arte liviano la IA lee mal los productos. Entonces:
//   1. el ORIGINAL sube directo del navegador a Cloudinary (firma del backend; el proxy
//      corta a 25 MB, así que no puede pasar por /upload), en trozos si es grande;
//   2. el backend saca de ahí la copia < 500 KB que viaja en el MMS.
// La campaña guarda las dos: `image` (MMS) y `sourceImage` (de donde se leen los productos).
export const MMS_MAX_BYTES = 500 * 1024;
export const CAMPAIGN_ART_MAX_BYTES = 100 * 1024 * 1024;
const CHUNK_BYTES = 10 * 1024 * 1024; // Cloudinary pide trozos ≥ 5 MB (salvo el último)
// Si el plan de Cloudinary rechaza el original por peso, se sube un "maestro" en alta
// hecho en el navegador. Bajo 10 MB entra en cualquier plan.
const MASTER_MAX_BYTES = 9.5 * 1024 * 1024;
// El proxy del backend corta a 25 MB: hasta acá el original entra por /upload.
const VIA_BACKEND_MAX_BYTES = 24 * 1024 * 1024;
// Carpeta de originales: /upload/compress sólo acepta public_ids de acá.
const ORIGINAL_FOLDER = 'campaigns-original';

export interface CampaignArtUpload extends UploadResponse {
  /** Arte original (vacío si el archivo ya era liviano y no hizo falta comprimir). */
  originalUrl: string;
  originalPublicId: string;
  /** Peso de la copia que viaja en el MMS. */
  bytes: number;
  /** Medidas y formato de la copia MMS (sin compresión: undefined, son las del archivo). */
  width?: number;
  height?: number;
  format?: string;
  /** false = el archivo ya pesaba menos de 500 KB y viaja tal cual. */
  compressed: boolean;
}

/** Fases de la subida, para mostrar el progreso real en el formulario. */
export type ArtUploadPhase = 'uploading' | 'compressing';

interface CloudinarySignature {
  cloudName: string;
  apiKey: string;
  folder: string;
  timestamp: number;
  signature: string;
}

async function uploadSignedToCloudinary(file: Blob, sig: CloudinarySignature, onProgress?: (pct: number) => void) {
  const endpoint = `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`;
  const uploadId = `art-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const total = file.size;
  let result: any = null;
  for (let start = 0; start < total; start += CHUNK_BYTES) {
    const end = Math.min(start + CHUNK_BYTES, total);
    const form = new FormData();
    form.append('file', file.slice(start, end));
    form.append('api_key', sig.apiKey);
    form.append('timestamp', String(sig.timestamp));
    form.append('signature', sig.signature);
    form.append('folder', sig.folder);
    const res = await fetch(endpoint, {
      method: 'POST',
      body: form,
      headers:
        total > CHUNK_BYTES
          ? { 'X-Unique-Upload-Id': uploadId, 'Content-Range': `bytes ${start}-${end - 1}/${total}` }
          : undefined,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.error?.message || `Cloudinary respondió ${res.status}`);
    result = json;
    onProgress?.(Math.round((end / total) * 100));
  }
  return result as { secure_url: string; public_id: string };
}

/** Copia en alta hecha en el navegador, para cuando el plan no acepta el archivo tal cual. */
async function makeMaster(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  for (const side of [6000, 4500, 3500]) {
    const scale = Math.min(1, side / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#fff'; // PNG con transparencia → fondo blanco, no negro
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    for (const q of [0.92, 0.85]) {
      const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', q));
      if (blob && blob.size <= MASTER_MAX_BYTES) return blob;
    }
  }
  throw new Error('No se pudo preparar la imagen: es demasiado grande.');
}

/**
 * Arte de campaña de cualquier peso (hasta 100 MB). Liviano → sube como siempre.
 * Pesado → original a Cloudinary + copia < 500 KB para el MMS.
 */
export const uploadCampaignArt = async (
  file: File,
  opts: { onProgress?: (pct: number) => void; onPhase?: (phase: ArtUploadPhase) => void } = {}
): Promise<CampaignArtUpload> => {
  const { onProgress, onPhase } = opts;
  if (file.size > CAMPAIGN_ART_MAX_BYTES) throw new Error('La imagen supera los 100 MB.');
  onPhase?.('uploading');
  if (file.size <= MMS_MAX_BYTES) {
    const up = await uploadCampaignImage(file, 'campaigns', onProgress);
    return { ...up, originalUrl: '', originalPublicId: '', bytes: file.size, compressed: false };
  }

  let original: { secure_url: string; public_id: string };
  if (file.size <= VIA_BACKEND_MAX_BYTES) {
    // Lo común (un arte de 1–20 MB): por el backend, como cualquier upload. No depende de
    // CORS/CSP del navegador hacia Cloudinary ("Failed to fetch").
    const up = await uploadCampaignImage(file, ORIGINAL_FOLDER, onProgress);
    original = { secure_url: up.url, public_id: up.public_id };
  } else {
    const { data: sig } = await api.post<CloudinarySignature>('/upload/sign', {});
    try {
      original = await uploadSignedToCloudinary(file, sig, onProgress);
    } catch (e: any) {
      // Plan de Cloudinary con tope de peso, o red/CSP que corta el pedido directo: se sube
      // un maestro en alta hecho en el navegador, y ese sí entra por el backend.
      if (!/too large|file size|failed to fetch|networkerror|load failed/i.test(String(e?.message))) throw e;
      const master = new File([await makeMaster(file)], 'arte.jpg', { type: 'image/jpeg' });
      const up = await uploadCampaignImage(master, ORIGINAL_FOLDER);
      original = { secure_url: up.url, public_id: up.public_id };
    }
  }

  onPhase?.('compressing');
  const { data: mms } = await api.post<{
    url: string;
    public_id: string;
    bytes: number;
    width?: number;
    height?: number;
    format?: string;
  }>('/upload/compress', { publicId: original.public_id });
  return {
    url: mms.url,
    public_id: mms.public_id,
    bytes: mms.bytes,
    width: mms.width,
    height: mms.height,
    format: mms.format,
    compressed: true,
    originalUrl: original.secure_url,
    originalPublicId: original.public_id,
  };
};

// Support evidence — images/PDFs to Cloudinary (folder: support-evidence)
export const uploadSupportEvidence = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('folder', 'support-evidence');
  const response = await api.post('/upload', formData, {
    headers: { 'Content-Type': undefined },
  });
  return response.data.url as string;
};

// Evidencias de tareas de Cowork — imágenes/archivos (folder: task-evidence)
export const uploadTaskEvidence = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('folder', 'task-evidence');
  const response = await api.post('/upload', formData, {
    headers: { 'Content-Type': undefined },
  });
  return response.data.url as string;
};

// Adjuntos del chat de una tarea (folder: task-comments)
export const uploadCommentFile = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('folder', 'task-comments');
  const response = await api.post('/upload', formData, {
    headers: { 'Content-Type': undefined },
  });
  return response.data.url as string;
};

// S3 — field name must be "file" (matches multer.single("file") on s3-service)
// Only accepts PDF files
export const uploadPdfToS3 = async (file: File): Promise<S3UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/s3-upload', formData, {
    headers: { 'Content-Type': undefined },
  });
  return response.data;
};
