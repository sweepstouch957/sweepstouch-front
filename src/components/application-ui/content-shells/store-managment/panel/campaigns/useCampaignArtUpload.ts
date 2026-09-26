'use client';

/**
 * Sube y comprime el arte EN CUANTO se elige (no al guardar): así el formulario muestra el
 * resumen real de la conversión (original → MMS) antes de crear la campaña, y al guardar se
 * reutiliza el resultado sin volver a subir nada.
 *
 * Si se cambia la imagen a mitad de camino, el resultado viejo se descarta (token).
 */
import { uploadCampaignArt, type CampaignArtUpload } from '@/services/upload.service';
import { useCallback, useRef, useState } from 'react';

export type ArtOriginal = {
  bytes: number;
  width: number;
  height: number;
  type: string;
  name: string;
};

export type ArtUploadState =
  | { status: 'idle' }
  | { status: 'uploading' | 'compressing'; progress: number; original: ArtOriginal }
  | { status: 'done'; original: ArtOriginal; result: CampaignArtUpload }
  | { status: 'error'; original: ArtOriginal; error: string };

/** Medidas reales del archivo sin decodificarlo entero en un canvas. */
function readDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve({ width: 0, height: 0 });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

export function useCampaignArtUpload() {
  const [state, setState] = useState<ArtUploadState>({ status: 'idle' });
  const token = useRef(0);
  const lastFile = useRef<File | null>(null);

  const start = useCallback(async (file: File | null) => {
    const t = ++token.current;
    lastFile.current = file;
    if (!file) {
      setState({ status: 'idle' });
      return;
    }
    const dims = await readDimensions(file);
    if (t !== token.current) return;
    const original: ArtOriginal = { bytes: file.size, ...dims, type: file.type, name: file.name };
    setState({ status: 'uploading', progress: 0, original });
    try {
      const result = await uploadCampaignArt(file, {
        onProgress: (progress) => {
          if (t === token.current)
            setState((s) => (s.status === 'uploading' ? { ...s, progress } : s));
        },
        onPhase: (phase) => {
          if (t === token.current)
            setState({ status: phase, progress: phase === 'compressing' ? 100 : 0, original });
        },
      });
      if (t === token.current) setState({ status: 'done', original, result });
    } catch (e: any) {
      if (t !== token.current) return;
      const error = e?.response?.data?.error || e?.message || 'No se pudo procesar la imagen';
      setState({ status: 'error', original, error });
    }
  }, []);

  const retry = useCallback(() => {
    if (lastFile.current) void start(lastFile.current);
  }, [start]);

  const busy = state.status === 'uploading' || state.status === 'compressing';
  const result = state.status === 'done' ? state.result : null;
  return { state, start, retry, busy, result };
}

/* ── Formato del resumen (puro) ─────────────────────────────── */

export const fmtBytes = (b: number) =>
  b >= 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`;

/** "−98 %" de peso ahorrado; 0 si no hubo compresión. */
export const reductionPct = (from: number, to: number) =>
  from > 0 && to < from ? Math.round((1 - to / from) * 100) : 0;

export const fmtFormat = (mimeOrExt?: string) =>
  (mimeOrExt || '')
    .replace(/^image\//, '')
    .replace('jpeg', 'jpg')
    .toUpperCase() || '—';
