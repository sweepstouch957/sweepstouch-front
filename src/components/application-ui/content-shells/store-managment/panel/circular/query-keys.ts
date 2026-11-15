/**
 * Claves de React Query del tab Circular & Listas. Única fuente: ningún archivo del módulo
 * escribe una key a mano. Los valores son los históricos (otras pantallas invalidan algunas),
 * así que cambiar un string acá es cambiar la caché de toda la app.
 *
 * Jerarquía: la primera posición es la entidad; invalidar `circularKeys.allCirculars()`
 * refresca todos los circulares sueltos, `shoppingListsQK.all()` todas las listas, etc.
 */
export { shoppingListsQK } from '@/services/shopping-lists.service';

export const circularKeys = {
  // Tienda (dominio stores; el panel la invalida al cambiar ajustes).
  store: (storeId: string) => ['store', storeId] as const,

  // Circulares
  circulars: (slug: string) => ['store-circulars', slug] as const,
  allCirculars: () => ['circular'] as const,
  circular: (id?: string) => ['circular', id] as const,
  circularThumb: (id?: string) => ['circular', id, 'thumb'] as const,
  flyer: (slug: string) => ['store-flyer-image', slug] as const,
  lastCampaign: (storeId: string) => ['store-last-campaign-image', storeId] as const,

  // Catálogo
  catalog: (slug: string) => ['store-catalog-admin', slug] as const,
  catalogPage: (slug: string, page: number, search: string, show: string) =>
    ['store-catalog-admin', slug, page, search, show] as const,
  catalogSummary: (slug: string) => ['store-catalog-summary', slug] as const,
  categories: (slug: string) => ['store-categories', slug] as const,
  rescanJob: (slug: string) => ['catalog-rescan', slug] as const,
  detailsJob: (slug: string) => ['catalog-details', slug] as const,

  // Próximos e imports
  upcoming: (slug: string) => ['store-upcoming', slug] as const,
  campaignImport: (campaignId?: string) => ['campaign-import', campaignId] as const,
  importJobs: (slug: string) => ['import-jobs', slug] as const,

  // Banners y postal
  banners: (slug: string) => ['store-banners', slug] as const,
  postcard: (slug: string) => ['postcard', slug] as const,
  postcardSearch: (slug: string, q: string) => ['postcard-catalog-search', slug, q] as const,

  // Agentes IA
  pipeline: (circularId?: string | null) => ['circular-pipeline', circularId] as const,
  audit: (circularId?: string) => ['circular-audit', circularId] as const,
  profile: (slug: string) => ['store-profile', slug] as const,
  review: (slug: string) => ['product-review', slug] as const,
};

/** Claves de mutación compartidas: el "ocupado" se lee con useIsMutating desde otra sección. */
export const circularMutationKeys = {
  extract: (slug: string) => ['circular-extract', slug] as const,
  addMissing: (slug: string) => ['circular-add-missing', slug] as const,
  loadCatalog: (slug: string) => ['circular-load-catalog', slug] as const,
};
