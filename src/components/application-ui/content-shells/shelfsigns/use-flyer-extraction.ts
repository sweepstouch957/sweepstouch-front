'use client';

import {
  useDetectPhotoBoxes,
  useProductImageLookup,
  useRemoveProductBackground,
} from '@/hooks/fetching/designs/use-shelfsign-images';
import designsService, {
  productSlug,
  type DetectedBox,
  type ProductImage,
  type RawExtractedProduct,
  type StoreHintDto,
} from '@/services/designs.service';
import React from 'react';
import { cropFromImage, downscaleToFile, loadImage, readAsDataURL } from './image';
import { toProducts } from './parse';
import type { ShelfSignProduct } from './types';

/**
 * Orquesta el paso 2, todo progresivo.
 *
 * El flyer real de un supermercado trae 40+ productos. Hecho en fases
 * bloqueantes (extraer TODO → localizar TODO → recortar TODO) el diseñador
 * miraba una pantalla vacía tres minutos. Acá:
 *
 *   - la extracción llega por SSE: cada cartón se pinta en cuanto el modelo
 *     termina de escribirlo, con skeleton en su foto;
 *   - los productos se juntan en lotes chicos y cada lote busca sus fotos
 *     MIENTRAS el resto sigue extrayéndose.
 *
 * Para la foto de cada producto se baja por costo hasta que uno acierta:
 *   1. Librería  — ya tiene PNG limpio de otra semana. Gratis, instantáneo.
 *   2. Gemini    — localiza la foto en el flyer. Fracciones de centavo.
 *   3. Backend   — recorta en resolución original; si el producto ya está sobre
 *                  blanco se salta la segmentación y sólo recorta márgenes.
 *   4. Recorte local del navegador — red de seguridad si el backend falla.
 * El paso caro (Nano Banana) no está acá: lo dispara el diseñador por cartón.
 */

/**
 * Productos por lote. Chico para que el primer cartón tenga foto rápido; no de
 * a uno, porque detect-boxes es UNA llamada a Gemini por lote y en batch localiza
 * mejor (ve los productos vecinos y no confunde una foto con otra).
 */
const PHOTO_BATCH_SIZE = 5;

/** Recortes simultáneos. El backend igual los serializa en su worker. */
const CUTOUT_CONCURRENCY = 3;

/** Más allá de esto /ai/upload rechaza el archivo (multer, 20 MB). */
const MAX_UPLOAD_BYTES = 18 * 1024 * 1024;

interface Options {
  /** `replace` limpia la lista, `append` agrega los que van llegando. */
  onProducts: (items: ShelfSignProduct[], mode: 'replace' | 'append') => void;
  onPatchProduct: (id: string, patch: Partial<ShelfSignProduct>) => void;
}

interface PhotoCounters {
  library: number;
  cut: number;
  local: number;
  none: number;
}

/** Corre tareas con un tope de concurrencia. */
async function mapLimit<T>(items: T[], limit: number, task: (item: T) => Promise<void>) {
  const queue = [...items];
  const workers = Array.from({ length: Math.min(limit, queue.length) }, async () => {
    while (queue.length) {
      const next = queue.shift();
      if (next !== undefined) await task(next);
    }
  });
  await Promise.all(workers);
}

export function useFlyerExtraction({ onProducts, onPatchProduct }: Options) {
  const [loading, setLoading] = React.useState(false);
  const [status, setStatus] = React.useState('');
  const [error, setError] = React.useState('');
  const [flyerPreview, setFlyerPreview] = React.useState<string | null>(null);
  /** Flyer en Cloudinary: el backend recorta desde acá, y lo usa "Mejorar con IA". */
  const [flyerUrl, setFlyerUrl] = React.useState<string | null>(null);
  /** Cartones esperando su foto: el editor les muestra un skeleton. */
  const [pendingPhotoIds, setPendingPhotoIds] = React.useState<string[]>([]);
  /** Tienda que dice el flyer. El paso 3 la preselecciona; el diseñador manda. */
  const [storeHint, setStoreHint] = React.useState<StoreHintDto | null>(null);

  /** Original en resolución completa, para el recorte local de emergencia. */
  const originalRef = React.useRef<string | null>(null);

  const detectBoxes = useDetectPhotoBoxes();
  const removeBackground = useRemoveProductBackground();
  const lookupLibrary = useProductImageLookup();

  const clearPending = React.useCallback(
    (id: string) => setPendingPhotoIds((ids) => ids.filter((x) => x !== id)),
    []
  );

  /**
   * Consigue la foto de un lote. Corre mientras la extracción sigue, así que no
   * puede asumir que ya llegaron todos los productos.
   */
  const resolvePhotos = React.useCallback(
    async (batch: ShelfSignProduct[], imageUrl: string, counters: PhotoCounters) => {
      /* ── 1 · Librería ── */
      const slugs = batch.map((p) => productSlug(p.name));
      const library = await lookupLibrary(slugs).catch((): ProductImage[] => []);
      const bySlug = new Map(library.map((img) => [img.slug, img.url]));

      const missing: ShelfSignProduct[] = [];
      batch.forEach((p, i) => {
        const url = bySlug.get(slugs[i]);
        if (url) {
          counters.library++;
          onPatchProduct(p.id, { photo: url });
          clearPending(p.id);
        } else {
          missing.push(p);
        }
      });
      if (!missing.length) return;

      /* ── 2 · Gemini localiza las que faltan ── */
      let boxes: DetectedBox[] = [];
      try {
        boxes = await detectBoxes.mutateAsync({
          imageUrl,
          products: missing.map((p) => p.name),
          refine: true,
        });
      } catch {
        // Sin Gemini se sigue con la caja aproximada de la extracción.
      }

      const boxBySlug = new Map(boxes.map((b) => [productSlug(b.product), b]));
      const targets = missing.map((p) => {
        const detected = boxBySlug.get(productSlug(p.name));
        const box = detected
          ? { x: detected.x, y: detected.y, w: detected.w, h: detected.h }
          : p.photoBox;
        if (detected) onPatchProduct(p.id, { photoBox: box });
        return { product: p, box };
      });

      // Producto sin foto en el flyer: no tiene sentido dejarle el skeleton.
      for (const t of targets) {
        if (!t.box) {
          counters.none++;
          clearPending(t.product.id);
        }
      }

      /* ── 3 · Recorte sin fondo en el backend ── */
      await mapLimit(
        targets.filter((t) => t.box),
        CUTOUT_CONCURRENCY,
        async ({ product, box }) => {
          try {
            const url = await removeBackground.mutateAsync({
              imageUrl,
              box,
              slug: productSlug(product.name),
              name: product.name,
            });
            if (!url) throw new Error('sin url');
            onPatchProduct(product.id, { photo: url });
            counters.cut++;
          } catch {
            /* ── 4 · Red de seguridad: recorte local, con el fondo del flyer ── */
            counters.local++;
            if (originalRef.current && box) {
              try {
                const img = await loadImage(originalRef.current);
                const photo = cropFromImage(img, box);
                if (photo) onPatchProduct(product.id, { photo });
              } catch {
                /* se queda sin foto; el diseñador puede subirla a mano */
              }
            }
          } finally {
            clearPending(product.id);
          }
        }
      );
    },
    [clearPending, detectBoxes, lookupLibrary, onPatchProduct, removeBackground]
  );

  const analyze = React.useCallback(
    async (file: File) => {
      setLoading(true);
      setError('');
      setPendingPhotoIds([]);
      setStoreHint(null);
      onProducts([], 'replace');

      const counters: PhotoCounters = { library: 0, cut: 0, local: 0, none: 0 };
      let extracted = 0;

      try {
        setStatus('Preparando imagen…');
        const original = await readAsDataURL(file);
        originalRef.current = original;
        setFlyerPreview(original);

        // El original va tal cual: el backend recorta las fotos desde él en
        // resolución completa. Sólo se reduce si no pasa el límite de subida.
        const toUpload =
          file.size > MAX_UPLOAD_BYTES ? await downscaleToFile(original, file.name) : file;

        setStatus('Subiendo flyer…');
        const attachment = await designsService.uploadFlyer(toUpload);
        setFlyerUrl(attachment.url);

        // En paralelo con la extracción: es una llamada corta y su resultado no
        // bloquea nada. Si falla, el selector de tienda queda como siempre.
        designsService
          .detectStore(attachment.url)
          .then(setStoreHint)
          .catch(() => undefined);

        setStatus('Leyendo el flyer… los cartones van apareciendo abajo.');

        /* ── Cola de lotes: corre en paralelo con la extracción ── */
        const waiting: ShelfSignProduct[] = [];
        const batches: Promise<void>[] = [];

        const flush = (force: boolean) => {
          while (waiting.length >= PHOTO_BATCH_SIZE || (force && waiting.length)) {
            const batch = waiting.splice(0, PHOTO_BATCH_SIZE);
            batches.push(
              resolvePhotos(batch, attachment.url, counters).catch(() => {
                // Un lote caído no frena a los demás: esos cartones quedan sin
                // foto y el diseñador la sube a mano.
                batch.forEach((p) => clearPending(p.id));
              })
            );
          }
        };

        const summary = await designsService.extractFlyerStream(
          attachment.url,
          (raw: RawExtractedProduct) => {
            const [item] = toProducts([raw]);
            if (!item?.name) return;
            extracted++;
            onProducts([item], 'append');
            setPendingPhotoIds((ids) => [...ids, item.id]);
            waiting.push(item);
            flush(false);
            setStatus(`${extracted} producto(s) leídos, buscando sus fotos…`);
          }
        );

        flush(true);

        if (!extracted) {
          setStatus(
            'La IA no encontró productos. Probá con un recorte del flyer o cargalos a mano.'
          );
          return;
        }

        setStatus(`${extracted} producto(s) leídos. Terminando las fotos…`);
        await Promise.all(batches);

        setStatus(
          [
            `${extracted} producto(s)`,
            counters.library ? `${counters.library} de librería` : '',
            counters.cut ? `${counters.cut} recortadas` : '',
            counters.local ? `${counters.local} con recorte local (revisar)` : '',
            counters.none ? `${counters.none} sin foto en el flyer` : '',
            summary.truncated ? '⚠️ la respuesta se cortó: puede faltar algún producto' : '',
          ]
            .filter(Boolean)
            .join(' · ') + '. Revisá precios y fotos antes de generar.'
        );
      } catch (e: any) {
        setError(
          `No se pudo analizar el flyer: ${
            e?.response?.data?.error || e?.message || e
          }. Reintentá, subí un recorte más chico, o cargá los productos a mano.`
        );
        setStatus('');
      } finally {
        setPendingPhotoIds([]);
        setLoading(false);
      }
    },
    [clearPending, onProducts, resolvePhotos]
  );

  return {
    loading,
    status,
    error,
    flyerPreview,
    flyerUrl,
    pendingPhotoIds,
    storeHint,
    analyze,
    clearError: () => setError(''),
    setStatus,
  };
}
