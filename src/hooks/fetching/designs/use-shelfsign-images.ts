'use client';

import designsService, {
  type DetectedBox,
  type ExtractResponse,
  type PhotoBoxDto,
  type ProductImage,
  type SaveProductImageDto,
} from '@/services/designs.service';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/**
 * React Query del módulo Designs Studio. Toda lectura es `useQuery`, toda
 * escritura `useMutation`; los componentes no hablan con axios.
 *
 * La librería de productos se cachea con `staleTime` largo a propósito: dentro
 * de una sesión de diseño los mismos slugs se consultan varias veces (extraer,
 * mejorar una foto, volver al paso 2) y no cambia sola.
 */

const LIBRARY_STALE_TIME = 1000 * 60 * 10;

export const shelfsignKeys = {
  all: ['designs', 'shelfsigns'] as const,
  productImages: (slugs: string[]) =>
    ['designs', 'shelfsigns', 'product-images', [...slugs].sort().join(',')] as const,
};

/* ══════════ Lecturas ══════════ */

/** Imágenes ya disponibles en la librería para esos slugs. */
export function useShelfsignProductImages(slugs: string[]) {
  return useQuery<ProductImage[]>({
    queryKey: shelfsignKeys.productImages(slugs),
    queryFn: () => designsService.getProductImages(slugs),
    enabled: slugs.length > 0,
    staleTime: LIBRARY_STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

/**
 * Consulta la librería bajo demanda (los slugs sólo se conocen después de
 * extraer, así que no hay una key estable para `useQuery`). Igual pasa por la
 * caché de React Query: la segunda corrida del mismo flyer no vuelve a pedir.
 */
export function useProductImageLookup() {
  const queryClient = useQueryClient();

  return (slugs: string[]) =>
    queryClient.fetchQuery({
      queryKey: shelfsignKeys.productImages(slugs),
      queryFn: () => designsService.getProductImages(slugs),
      staleTime: LIBRARY_STALE_TIME,
    });
}

/* ══════════ Escrituras ══════════ */

export function useExtractFlyer() {
  return useMutation<ExtractResponse, unknown, string>({
    mutationFn: (imageUrl) => designsService.extractFlyer(imageUrl),
  });
}

export function useDetectPhotoBoxes() {
  return useMutation<
    DetectedBox[],
    unknown,
    { imageUrl: string; products: string[]; refine?: boolean }
  >({
    mutationFn: ({ imageUrl, products, refine }) =>
      designsService.detectBoxes(imageUrl, products, refine),
  });
}

/** Invalidar la librería después de escribir: el recorte nuevo queda disponible. */
function useLibraryInvalidator() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: shelfsignKeys.all });
}

interface CutoutVars {
  imageUrl: string;
  box?: PhotoBoxDto | null;
  slug?: string;
  name?: string;
}

export function useRemoveProductBackground() {
  const invalidate = useLibraryInvalidator();
  return useMutation<string, unknown, CutoutVars>({
    mutationFn: (vars) => designsService.removeBackground(vars),
    onSuccess: invalidate,
  });
}

/** El paso caro: sólo desde el botón "Mejorar con IA" de un cartón. */
export function useEnhanceProductImage() {
  const invalidate = useLibraryInvalidator();
  return useMutation<string, unknown, CutoutVars>({
    mutationFn: (vars) => designsService.enhance(vars),
    onSuccess: invalidate,
  });
}

export function useSaveProductImages() {
  const invalidate = useLibraryInvalidator();
  return useMutation<ProductImage[], unknown, SaveProductImageDto[]>({
    mutationFn: (items) => designsService.saveProductImages(items),
    onSuccess: invalidate,
  });
}
