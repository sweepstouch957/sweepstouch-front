'use client';

import { uploadCampaignImage } from '@/services/upload.service';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';

export const MAX_REFERENCE_IMAGES = 5;

/** Sube fotos de referencia (hasta 5 en total) y devuelve sus URLs. */
export function useUploadReferences() {
  return useMutation({
    mutationFn: async (files: File[]) => {
      const urls: string[] = [];
      for (const f of files) urls.push((await uploadCampaignImage(f, 'circular-refs')).url);
      return urls;
    },
    onError: () => toast.error('No se pudo subir la foto de referencia'),
  });
}
