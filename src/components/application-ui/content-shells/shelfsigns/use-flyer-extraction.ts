'use client';

import {
  useDetectPhotoBoxes,
  useExtractFlyer,
  useProductImageLookup,
  useRemoveProductBackground,
} from '@/hooks/fetching/designs/use-shelfsign-images';
import designsService, {
  productSlug,
  type DetectedBox,
  type ProductImage,
} from '@/services/designs.service';
import React from 'react';
import { cropFromImage, downscaleToFile, loadImage, readAsDataURL } from './image';
import { toProducts } from './parse';
import type { ShelfSignProduct } from './types';

/**
 * Orquesta el paso 2: subir el flyer, extraer, y conseguir la foto de cada
 * producto por el camino más barato disponible.
 *
 * Orden del pipeline (el costo baja en cada escalón):
 *   1. Librería  — el producto ya tiene PNG limpio de otra semana. Gratis.
 *   2. Gemini    — localiza la foto en el flyer. Fracciones de centavo.
 *   3. imgly     — recorta en resolución original y quita el fondo. Local, gratis.
 *   4. Recorte local del navegador — red de seguridad si el backend falla.
 * El paso caro (Nano Banana) NO está acá: lo dispara el diseñador cartón por
 * cartón desde "Mejorar con IA".
 */

/** Cuántos recortes en paralelo. Cada uno corre segmentación en el servidor. */
const CUTOUT_CONCURRENCY = 3;

/** Más allá de esto /ai/upload rechaza el archivo (multer, 20 MB). */
const MAX_UPLOAD_BYTES = 18 * 1024 * 1024;

interface Options {
  /** `replace` en el análisis, `append` en la carga manual. */
  onProducts: (items: ShelfSignProduct[], mode: 'replace' | 'append') => void;
  /** Las fotos llegan de a una: el diseñador ya puede revisar precios mientras. */
  onPatchProduct: (id: string, patch: Partial<ShelfSignProduct>) => void;
}

/** Corre tareas con un límite de concurrencia. */
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
  /** Flyer en Cloudinary: el backend recorta desde acá, y también lo usa "Mejorar con IA". */
  const [flyerUrl, setFlyerUrl] = React.useState<string | null>(null);

  /** Original en resolución completa, para el recorte local de emergencia. */
  const originalRef = React.useRef<string | null>(null);

  const extract = useExtractFlyer();
  const detectBoxes = useDetectPhotoBoxes();
  const removeBackground = useRemoveProductBackground();
  const lookupLibrary = useProductImageLookup();

  const analyze = React.useCallback(
    async (file: File) => {
      setLoading(true);
      setError('');
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

        setStatus('Leyendo productos y precios del flyer…');
        const { products: raw, truncated } = await extract.mutateAsync(attachment.url);
        const items = toProducts(raw);
        onProducts(items, 'replace');

        if (!items.length) {
          setStatus('La IA no encontró productos. Probá con un recorte del flyer o cargalos a mano.');
          return;
        }

        /* ── 1 · Librería ── */
        setStatus(`${items.length} producto(s). Buscando fotos en la librería…`);
        const slugs = items.map((p) => productSlug(p.name));
        const library = await lookupLibrary(slugs).catch((): ProductImage[] => []);
        const bySlug = new Map(library.map((img) => [img.slug, img.url]));

        const missing: ShelfSignProduct[] = [];
        let fromLibrary = 0;
        items.forEach((p, i) => {
          const url = bySlug.get(slugs[i]);
          if (url) {
            fromLibrary++;
            onPatchProduct(p.id, { photo: url });
          } else {
            missing.push(p);
          }
        });

        if (!missing.length) {
          setStatus(
            `${items.length} producto(s), las ${fromLibrary} fotos salieron de la librería. Revisá precios antes de generar.`
          );
          return;
        }

        /* ── 2 · Gemini localiza las fotos que faltan ── */
        setStatus(
          `${fromLibrary} foto(s) de librería. Localizando ${missing.length} foto(s) en el flyer…`
        );
        let boxes: DetectedBox[] = [];
        try {
          boxes = await detectBoxes.mutateAsync({
            imageUrl: attachment.url,
            products: missing.map((p) => p.name),
            refine: true,
          });
        } catch {
          // Sin Gemini se sigue con la caja aproximada que devolvió la extracción.
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

        /* ── 3 · Recorte sin fondo (local en el servidor, gratis) ── */
        let done = 0;
        let failed = 0;
        const withBox = targets.filter((t) => t.box);

        setStatus(`Recortando ${withBox.length} foto(s) y quitando el fondo…`);
        await mapLimit(withBox, CUTOUT_CONCURRENCY, async ({ product, box }) => {
          try {
            const url = await removeBackground.mutateAsync({
              imageUrl: attachment.url,
              box,
              slug: productSlug(product.name),
              name: product.name,
            });
            if (!url) throw new Error('sin url');
            onPatchProduct(product.id, { photo: url });
            done++;
          } catch {
            /* ── 4 · Red de seguridad: recorte local, con el fondo del flyer ── */
            failed++;
            if (!originalRef.current || !box) return;
            try {
              const img = await loadImage(originalRef.current);
              const photo = cropFromImage(img, box);
              if (photo) onPatchProduct(product.id, { photo });
            } catch {
              /* se queda sin foto; el diseñador puede subirla a mano */
            }
          }
          setStatus(
            `Recortando fotos… ${done + failed}/${withBox.length}` +
              (fromLibrary ? ` · ${fromLibrary} de librería` : '')
          );
        });

        const noPhoto = items.length - fromLibrary - done - failed;
        setStatus(
          [
            `${items.length} producto(s)`,
            fromLibrary ? `${fromLibrary} de librería` : '',
            done ? `${done} recortadas sin fondo` : '',
            failed ? `${failed} con recorte local (revisar)` : '',
            noPhoto > 0 ? `${noPhoto} sin foto` : '',
            truncated ? '⚠️ la respuesta se cortó: puede faltar algún producto' : '',
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
        setLoading(false);
      }
    },
    [detectBoxes, extract, lookupLibrary, onPatchProduct, onProducts, removeBackground]
  );

  return {
    loading,
    status,
    error,
    flyerPreview,
    flyerUrl,
    analyze,
    clearError: () => setError(''),
    setStatus,
  };
}
