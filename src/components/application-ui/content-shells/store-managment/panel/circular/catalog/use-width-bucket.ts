'use client';

import { useEffect, useRef, useState } from 'react';
import { widthBucket } from './utils';

/** Ancho del contenedor de la tabla en rangos (420 / 700 / 900 / 1000). Sólo importa en qué rango
 *  cae: guardar el número exacto re-renderizaba la tabla en cada píxel al redimensionar.
 *  Se usa en el componente que monta el contenedor (después del skeleton), así el
 *  observer siempre encuentra el elemento. */
export function useWidthBucket<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(1000);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(widthBucket(entry.contentRect.width)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return { ref, width };
}
