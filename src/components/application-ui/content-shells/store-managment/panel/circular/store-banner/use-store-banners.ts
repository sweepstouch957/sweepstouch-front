'use client';

/** Datos del banner de las listas: la query (con sondeo sólo mientras la IA trabaja) y sus mutaciones. */
import { circularService } from '@/services/circular.service';
import { uploadCampaignImage } from '@/services/upload.service';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { qk, useCampaignImportJob, useCircularBusy, useLastCampaignArt } from '../hooks';
import type { BannerValues } from './utils';

const errorText = (e: any, fallback: string) => e?.response?.data?.error || fallback;

export function useStoreBanners(storeSlug: string, storeId?: string) {
  // Arte de la última campaña: misma query (y caché) que el bloque de automatización.
  const { campaign, image: campaignImage } = useLastCampaignArt(storeId);
  const job = useCampaignImportJob(campaign?._id);
  const { busy } = useCircularBusy(storeSlug);
  // Un banner automático sólo aparece mientras la IA trabaja (extracción o import de
  // campaña): recién ahí se consulta seguido. Antes era cada 20 s siempre.
  const aiWorking = busy || job.data?.status === 'queued' || job.data?.status === 'running';
  const banners = useQuery({
    queryKey: qk.banners(storeSlug),
    queryFn: () => circularService.getStoreBanners(storeSlug),
    enabled: !!storeSlug,
    staleTime: 30_000,
    refetchInterval: aiWorking ? 20_000 : false,
  });
  return {
    campaignImage,
    isLoading: banners.isLoading,
    active: banners.data?.active ?? null,
    items: banners.data?.items ?? [],
  };
}

/** La IA recorta el encabezado del flyer (o del arte de campaña si se pasa `sourceUrl`). */
export function useBannerFromFlyer(storeSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sourceUrl?: string) => circularService.bannerFromFlyer(storeSlug, sourceUrl),
    onSuccess: () => {
      toast.success('Banner sacado del flyer');
      qc.invalidateQueries({ queryKey: qk.banners(storeSlug) });
    },
    onError: (e: any) => toast.error(errorText(e, 'No se pudo sacar el banner')),
  });
}

export function useSaveBanner(storeSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ values, id }: { values: BannerValues; id?: string }) =>
      circularService.saveStoreBanner(
        storeSlug,
        {
          imageUrl: values.imageUrl,
          title: values.title.trim(),
          startDate: values.startDate,
          endDate: values.endDate,
        },
        id || undefined
      ),
    onSuccess: (_d, { id }) => {
      toast.success(id ? 'Banner actualizado' : 'Banner guardado');
      qc.invalidateQueries({ queryKey: qk.banners(storeSlug) });
    },
    onError: (e: any) => toast.error(errorText(e, 'No se pudo guardar el banner')),
  });
}

export function useDeleteBanner(storeSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => circularService.deleteStoreBanner(id),
    onSuccess: () => {
      toast.success('Banner eliminado');
      qc.invalidateQueries({ queryKey: qk.banners(storeSlug) });
    },
    onError: (e: any) => toast.error(errorText(e, 'No se pudo eliminar')),
  });
}

/** Sube la imagen del banner y devuelve su URL. */
export function useUploadBannerImage() {
  return useMutation({
    mutationFn: async (file: File) => (await uploadCampaignImage(file, 'store-banners')).url,
    onError: (e: any) => toast.error(errorText(e, 'No se pudo subir la imagen')),
  });
}
