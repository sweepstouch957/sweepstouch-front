'use client';

/**
 * Mutaciones de la pestaña Próximos. Los toasts viven acá; cerrar diálogos o abrir el editor
 * lo decide el contenedor con el `onSuccess` de cada llamada.
 */
import {
  circularService,
  type StoreProduct,
  type UpcomingGroup,
} from '@/services/circular.service';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useRefreshStoreData } from '../hooks';
import { errMsg, type AgentsOptions, type Confirm, type EditorTarget } from './utils';

// Imagen para recortar: la del arte/circular del que salió ESTE producto (no el vigente).
// Si es PDF se pide la portada renderizada (queda cacheada en el servidor).
async function flyerFor(g: UpcomingGroup) {
  if (!g.circular) return '';
  if (g.circular.flyerUrl) return g.circular.flyerUrl;
  if (!g.circular.hasFile) return '';
  return (
    (await circularService.getPreviewImage(g.circular._id).catch(() => ({ url: '' }))).url || ''
  );
}

export function useUpcomingActions(storeSlug: string) {
  const refresh = useRefreshStoreData(storeSlug);

  const openEditor = useMutation({
    mutationFn: async ({
      product,
      group,
    }: {
      product: StoreProduct;
      group: UpcomingGroup;
    }): Promise<EditorTarget> => ({
      product,
      flyerUrl: await flyerFor(group),
      fromCampaign: !!group.circular?.fromCampaign,
    }),
  });

  const openArt = useMutation({
    mutationFn: flyerFor,
    onSuccess: (url) => {
      if (!url) toast('Este grupo no tiene arte para mostrar');
    },
  });

  // "Poner a los agentes a trabajar" sobre un flyer que todavía no salió: Atenea audita el
  // circular contra el arte y, si se pide, Iris rehace las fotos de sus productos (mode ids).
  const agents = useMutation({
    mutationFn: async ({ group, photos, missing }: AgentsOptions & { group: UpcomingGroup }) => {
      const id = group.circular?._id;
      let added = 0;
      if (id && missing) added = (await circularService.addMissingProducts(id)).added || 0;
      if (id) await circularService.runAudit(id);
      if (photos && group.items.length) {
        await circularService.rescanPhotos(
          storeSlug,
          'ids',
          group.items.map((p) => p._id)
        );
      }
      return { added };
    },
    onSuccess: (d, v) => {
      refresh();
      toast.success(
        [
          v.missing ? `Argos sumó ${d.added} productos que faltaban.` : '',
          'Atenea audita el flyer contra el arte.',
          v.photos ? `Iris rehace ${v.group.items.length} fotos.` : '',
          'Míralos en Agentes IA.',
        ]
          .filter(Boolean)
          .join(' '),
        { duration: 9000 }
      );
    },
    onError: (e) => toast.error(errMsg(e, 'No se pudo arrancar a los agentes')),
  });

  // Una sola foto: Iris la busca de nuevo en su página (≈ 1 min) y la card se actualiza.
  const rephoto = useMutation({
    mutationFn: (id: string) => circularService.rescanProductPhoto(id),
    onSuccess: (d) => {
      toast.success(d.relocated ? 'Foto rehecha desde el arte' : 'Foto generada');
      refresh();
    },
    onError: (e) => toast.error(errMsg(e, 'No se pudo rehacer la foto')),
  });

  // Nombre, marca y tamaño editables en la card: lo corregido a mano queda protegido de relecturas.
  const patch = useMutation({
    mutationFn: ({ id, body }: { id: string; body: { name?: string; brand?: string; size?: string } }) =>
      circularService.updateStoreProduct(id, body),
    onSuccess: refresh,
    onError: (e) => toast.error(errMsg(e, 'No se pudo guardar')),
  });

  /** Publicar ya (grupo o producto) o que no salga. */
  const act = useMutation({
    mutationFn: async (c: Confirm) => {
      if (c.kind === 'group') {
        return circularService.publishUpcomingNow(storeSlug, {
          day: c.group.day,
          ...(c.group.circular ? { circularId: c.group.circular._id } : {}),
        });
      }
      if (c.kind === 'publish') return circularService.publishPendingNow(c.product._id);
      return circularService.cancelPending(c.product._id);
    },
    onSuccess: (_d, c) => {
      toast.success(
        c.kind === 'cancel'
          ? c.product.pending?.isNew
            ? 'Producto quitado: no va a salir'
            : 'Cambio de precio descartado: queda el precio de hoy'
          : 'Publicado: ya se ve en las listas de los clientes'
      );
      refresh();
    },
    onError: (e) => toast.error(errMsg(e, 'No se pudo completar')),
  });

  return { refresh, openEditor, openArt, agents, rephoto, patch, act };
}
