'use client';

import type { StoreProduct } from '@/services/circular.service';
import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { imageFromPaste } from '../ProductImageTools';

/** Ctrl+V sobre una fila: la fila "activa" es la última sobre la que pasó el mouse o
 *  recibió foco. Con una imagen en el portapapeles se abre la confirmación de reemplazo.
 *  Sólo un ref: guardar la fila en estado re-renderizaba toda la tabla al mover el mouse. */
export function useRowPaste(paused: boolean) {
  const [pasted, setPasted] = useState<{ file: File; product: StoreProduct } | null>(null);
  const activeRowRef = useRef<StoreProduct | null>(null);
  const onActivate = useCallback((p: StoreProduct) => {
    activeRowRef.current = p;
  }, []);
  useEffect(() => {
    if (paused || pasted) return; // el editor tiene su propio Ctrl+V
    const onPaste = (e: ClipboardEvent) => {
      const file = imageFromPaste(e);
      if (!file) return; // texto: lo maneja el campo enfocado
      const target = activeRowRef.current;
      e.preventDefault();
      if (!target) {
        toast(
          'Pasa el mouse sobre el producto al que le quieres cambiar la imagen y pega de nuevo.'
        );
        return;
      }
      setPasted({ file, product: target });
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [paused, pasted]);
  const clear = useCallback(() => setPasted(null), []);
  return { pasted, onActivate, clear };
}
