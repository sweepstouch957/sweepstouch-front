import type { circularService, StoreProduct } from '@/services/circular.service';

// Filas por página del catálogo (un circular grande trae 2000 productos).
export const PAGE_SIZE = 50;

/** Cambios de un producto que se mandan tal cual al backend. */
export type ProductPatch = Record<string, unknown>;

/** Precio que espera fecha (pending): oferta / regular / ahorro del flyer que viene. */
export type PendingPatch = Parameters<typeof circularService.updatePending>[1];

/** Entradas futuras agrupadas por fecha (aviso arriba de la tabla). */
export type UpcomingSummaryRow = {
  date: string;
  title: string;
  total: number;
  nuevos: number;
  precios: number;
};

export type RescanMode = 'missing' | 'all' | 'flyer';
export type SourceKind = 'flyer' | 'circular';

/** Filtro de la tabla: sólo visibles, ocultos o los que esperan fecha (vacío = todos). */
export type CatalogShow = 'visible' | 'hidden' | 'pending';

/** Tag de origen del producto: flyer de campaña / circular / manual. */
export const SOURCE_TAG: Record<string, { label: string; color: 'secondary' | 'primary' | 'default' }> =
  {
    flyer: { label: 'Flyer', color: 'secondary' },
    circular: { label: 'Circular', color: 'primary' },
  };
export const sourceTag = (s: NonNullable<StoreProduct['source']>) =>
  SOURCE_TAG[s] || { label: 'Manual', color: 'default' as const };

export const PASTE_HINT =
  'Para cambiar una imagen rápido: pasa el mouse sobre el producto y pega (Ctrl+V) una captura o imagen copiada.';

export const DRAG_INSTRUCTIONS =
  'Presioná espacio para levantar el producto, usá las flechas para moverlo y espacio para soltarlo. Escape cancela.';

/** Chips chicos de las filas (letra chica, departamento, origen, fecha). */
export const miniChip = { height: 18, fontSize: 11 } as const;
