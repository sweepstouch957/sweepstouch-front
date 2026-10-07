'use client';

import { Box } from '@mui/material';
import React from 'react';

/**
 * Columna que acompaña el scroll sin salirse de su lugar en la fila.
 *
 * No usa `position: sticky` porque en este panel no funciona: el shell del admin
 * envuelve la página en un contenedor con `overflow: hidden`, que para el
 * navegador es una caja de scroll. Un sticky se anclaría a esa caja, y como la
 * que scrollea es la ventana, el panel se iría igual que el resto.
 *
 * Tampoco sirve `position: fixed`: saca al panel del flujo y entonces hay que
 * reservarle el hueco a mano, lo que corre toda la página a la izquierda.
 *
 * Así que la columna queda en el flujo —ocupa su lugar en la fila— y lo único
 * que se mueve es su contenido, con un `transform` acotado al alto de la
 * columna. Se recalcula desde los rectángulos reales, así que da igual qué
 * elemento esté scrolleando.
 */

/** A cuántos px del borde superior de la ventana se despega el contenido. */
const TOP_GAP = 96;

interface Props {
  children: React.ReactNode;
}

export function StickyColumn({ children }: Props): React.JSX.Element {
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const innerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      const wrap = wrapRef.current;
      const inner = innerRef.current;
      if (!wrap || !inner) return;

      // El rect del envoltorio no lo afecta el transform del hijo, así que
      // medirlo acá no se realimenta.
      const r = wrap.getBoundingClientRect();
      const max = Math.max(0, r.height - inner.offsetHeight);
      const offset = Math.min(Math.max(TOP_GAP - r.top, 0), max);
      inner.style.transform = offset ? `translateY(${Math.round(offset)}px)` : '';
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    // `capture` para enterarse también si el que scrollea es un contenedor
    // interno y no la ventana.
    window.addEventListener('scroll', schedule, true);
    window.addEventListener('resize', schedule);

    // Las hojas cambian de alto al retocar fotos: hay que volver a acotar.
    const observer = new ResizeObserver(schedule);
    if (wrapRef.current) observer.observe(wrapRef.current);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule, true);
      window.removeEventListener('resize', schedule);
      observer.disconnect();
    };
  }, []);

  return (
    <Box
      ref={wrapRef}
      sx={{ flexShrink: 0, alignSelf: 'stretch' }}
    >
      <Box
        ref={innerRef}
        sx={{ willChange: 'transform' }}
      >
        {children}
      </Box>
    </Box>
  );
}

export default StickyColumn;
