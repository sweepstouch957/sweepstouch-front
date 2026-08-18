'use client';

import { useAuth } from '@/hooks/use-auth';
import { extractFromFlyer, uploadFlyer, type ExtractionResponse } from '@/services/shelfsigns.service';
import type { Attachment } from '@/services/ai.service';
import React from 'react';
import { EXTRACT_PROMPT, continuePromptSuffix } from './constants';
import { attachPhotos, downscaleToFile, readAsDataURL } from './image';
import { salvageJSON, toProducts } from './parse';
import type { ShelfSignProduct } from './types';

/**
 * Orquesta el paso 2: subir el flyer, extraer con IA, recortar las fotos.
 *
 * El flyer se manda reducido (~1600px) para que la subida no sea el cuello de
 * botella, pero los recortes salen del ORIGINAL en resolución completa.
 */

interface PendingAnalysis {
  attachment: Attachment;
  names: string[];
}

interface Options {
  /** `replace` en el primer análisis, `append` al continuar. */
  onProducts: (items: ShelfSignProduct[], mode: 'replace' | 'append') => void;
}

/** Separa "se cortó la respuesta" de "el JSON vino mal". */
function parseExtraction(text: string): { products: unknown[]; truncated: boolean } {
  const trimmed = text.trim();
  const complete = trimmed.endsWith('}');

  let parsed: any = null;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    parsed = salvageJSON(trimmed);
  }

  if (!parsed || !Array.isArray(parsed.products)) {
    throw new Error('la respuesta de la IA no se pudo interpretar');
  }
  return { products: parsed.products, truncated: !complete };
}

export function useFlyerExtraction({ onProducts }: Options) {
  const { user } = useAuth();

  const [loading, setLoading] = React.useState(false);
  const [status, setStatus] = React.useState('');
  const [error, setError] = React.useState('');
  const [flyerPreview, setFlyerPreview] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState<PendingAnalysis | null>(null);

  /** Original en resolución completa: es de donde se recortan las fotos. */
  const originalRef = React.useRef<string | null>(null);

  const identity = React.useMemo(
    () => ({
      id: user?.id || '',
      name: [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Panel',
      role: user?.role || 'design',
    }),
    [user]
  );

  const run = React.useCallback(
    (attachment: Attachment, prompt: string): Promise<ExtractionResponse> =>
      extractFromFlyer(attachment, { prompt, user: identity }),
    [identity]
  );

  const analyze = React.useCallback(
    async (file: File) => {
      setLoading(true);
      setError('');
      setPending(null);
      try {
        setStatus('Preparando imagen…');
        const original = await readAsDataURL(file);
        originalRef.current = original;
        setFlyerPreview(original);

        const reduced = await downscaleToFile(original, file.name);

        setStatus('Subiendo flyer…');
        const attachment = await uploadFlyer(reduced);

        setStatus('Analizando flyer con IA…');
        const { text } = await run(attachment, EXTRACT_PROMPT);
        const { products, truncated } = parseExtraction(text);

        setStatus('Recortando fotos de productos…');
        const items = await attachPhotos(toProducts(products), original);
        onProducts(items, 'replace');

        const withPhoto = items.filter((p) => p.photo).length;
        if (truncated && items.length) {
          setPending({ attachment, names: items.map((i) => i.name) });
          setStatus(
            `${items.length} producto(s) extraídos (${withPhoto} con foto). La respuesta se cortó: pulsá "Continuar análisis" para el resto.`
          );
        } else {
          setStatus(
            `${items.length} producto(s) detectado(s), ${withPhoto} con foto. Revisá precios y recortes antes de generar.`
          );
        }
      } catch (e: any) {
        setError(
          `No se pudo analizar el flyer: ${e?.message || e}. Reintentá, subí un recorte más chico, o cargá los productos a mano.`
        );
        setStatus('');
      } finally {
        setLoading(false);
      }
    },
    [onProducts, run]
  );

  const continueAnalysis = React.useCallback(async () => {
    if (!pending) return;
    setLoading(true);
    setError('');
    try {
      setStatus('Extrayendo productos restantes…');
      const { text } = await run(
        pending.attachment,
        EXTRACT_PROMPT + continuePromptSuffix(pending.names)
      );
      const { products, truncated } = parseExtraction(text);

      // El modelo a veces repite algún producto pese a la lista de exclusión.
      const fresh = toProducts(products).filter((n) => !pending.names.includes(n.name));
      const items = originalRef.current
        ? await attachPhotos(fresh, originalRef.current)
        : fresh;

      if (items.length) onProducts(items, 'append');

      const names = [...pending.names, ...items.map((i) => i.name)];
      if (truncated && items.length) {
        setPending({ ...pending, names });
        setStatus(`+${items.length} producto(s). Todavía quedan: pulsá "Continuar análisis" otra vez.`);
      } else {
        setPending(null);
        setStatus(`Análisis completo: +${items.length} producto(s) agregados.`);
      }
    } catch (e: any) {
      setError(`No se pudo continuar: ${e?.message || e}. Reintentá o agregá los faltantes a mano.`);
    } finally {
      setLoading(false);
    }
  }, [onProducts, pending, run]);

  return {
    loading,
    status,
    error,
    flyerPreview,
    canContinue: !!pending,
    analyze,
    continueAnalysis,
    clearError: () => setError(''),
    setStatus,
  };
}
