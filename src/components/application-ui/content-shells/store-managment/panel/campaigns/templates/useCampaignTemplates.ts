'use client';

/** Plantillas de mensaje de una tienda: lectura + altas/bajas/cambios con la caché al día. */
import {
  campaignTemplatesService,
  type CampaignTemplate,
  type CampaignTemplateInput,
} from '@/services/campaignTemplates.service';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

export const templatesKey = (storeId?: string) => ['campaign-templates', storeId] as const;

const errMsg = (e: any, fallback: string) => e?.response?.data?.error || e?.message || fallback;

export function useCampaignTemplates(storeId?: string) {
  const qc = useQueryClient();
  const key = templatesKey(storeId);
  const refresh = () => qc.invalidateQueries({ queryKey: key });

  const list = useQuery({
    queryKey: key,
    queryFn: () => campaignTemplatesService.list(storeId as string),
    enabled: !!storeId,
    staleTime: 60_000,
  });

  const create = useMutation({
    mutationFn: (input: CampaignTemplateInput) =>
      campaignTemplatesService.create(storeId as string, input),
    onSuccess: (t) => {
      toast.success(`Plantilla guardada: ${t.name}`);
      refresh();
    },
    onError: (e) => toast.error(errMsg(e, 'No se pudo guardar la plantilla')),
  });

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<CampaignTemplateInput> }) =>
      campaignTemplatesService.update(id, patch),
    onSuccess: () => {
      toast.success('Plantilla actualizada');
      refresh();
    },
    onError: (e) => toast.error(errMsg(e, 'No se pudo actualizar la plantilla')),
  });

  const remove = useMutation({
    mutationFn: (t: CampaignTemplate) => campaignTemplatesService.remove(t._id),
    // Optimista: desaparece al toque; si falla, vuelve con la recarga.
    onMutate: (t) => {
      qc.setQueryData<CampaignTemplate[]>(key, (old) => old?.filter((x) => x._id !== t._id));
    },
    onSuccess: (_d, t) => toast.success(`Plantilla eliminada: ${t.name}`),
    onError: (e) => toast.error(errMsg(e, 'No se pudo eliminar la plantilla')),
    onSettled: refresh,
  });

  // Silencioso: sólo ordena el menú, no merece un error en pantalla.
  const markUsed = (id: string) => {
    campaignTemplatesService.markUsed(id).then(refresh, () => undefined);
  };

  return {
    templates: list.data ?? [],
    isLoading: list.isLoading,
    create,
    update,
    remove,
    markUsed,
  };
}
