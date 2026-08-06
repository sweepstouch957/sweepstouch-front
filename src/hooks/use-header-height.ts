'use client';

import { useEffect, type RefObject } from 'react';
import { HEADER_HEIGHT_VAR } from 'src/theme/utils';

/**
 * Publica el alto real del navbar en `--app-header-h`.
 *
 * La usa la cabecera de cada shell. A partir de ahí, el shell reserva espacio y
 * las páginas pegan sus barras leyendo esa variable, así que nadie más necesita
 * saber cuánto mide la cabecera ni si crece al hacer scroll.
 */
export function usePublishHeaderHeight(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const publicar = () => {
      const alto = Math.round(el.getBoundingClientRect().height);
      // 0 mientras el elemento está oculto: escribirlo dejaría el contenido
      // debajo del navbar hasta la próxima medición.
      if (alto > 0) {
        document.documentElement.style.setProperty(HEADER_HEIGHT_VAR, `${alto}px`);
      }
    };

    publicar();
    const ro = new ResizeObserver(publicar);
    ro.observe(el);

    return () => {
      ro.disconnect();
      // Al desmontar el shell la variable dejaría de tener sentido: el
      // siguiente que monte publica la suya, y mientras tanto vale el fallback.
      document.documentElement.style.removeProperty(HEADER_HEIGHT_VAR);
    };
  }, [ref]);
}
