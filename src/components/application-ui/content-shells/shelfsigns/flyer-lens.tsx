'use client';

import { Box } from '@mui/material';
import React from 'react';

/**
 * El flyer al lado de los cartones, con lupa al pasar el mouse.
 *
 * Revisar un cartón es compararlo contra el papel: precio, letra chica y foto.
 * Abrirlo en un modal obliga a ir y volver por cada uno, así que acá queda
 * siempre a la vista, y la lupa resuelve que al tamaño de una hoja la letra
 * chica del flyer no se lee.
 *
 * La lupa se mueve escribiendo directo en el DOM, SIN estado de React.
 * Con estado iba a los tirones: cada `mousemove` re-renderizaba, y como el
 * estilo salía por `sx`, emotion generaba una clase CSS nueva por movimiento
 * con la imagen del flyer incrustada en el `background-image`. Acá el
 * `background-image` se escribe una sola vez y lo único que cambia es un
 * `transform` y el `background-position`, que el navegador resuelve en el
 * compositor.
 */

/** Cuánto agranda. El flyer entero al alto de una hoja deja la letra chica ilegible. */
const ZOOM = 3.5;

/**
 * Medidas de la lupa, en px de pantalla.
 *
 * Apaisada a propósito: en el flyer el texto corre a lo ancho (nombre, precio y
 * letra chica en la misma franja), así que lo que falta para leer una oferta
 * entera es ancho, no alto.
 */
const LENS_W = 440;
const LENS_H = 280;

interface Props {
  src: string;
  /** Alto máximo: el mismo que una hoja de cartones, para que vayan a la par. */
  maxHeight: string;
}

export function FlyerLens({ src, maxHeight }: Props): React.JSX.Element {
  const boxRef = React.useRef<HTMLDivElement>(null);
  const lensRef = React.useRef<HTMLDivElement>(null);

  const onMove = (e: React.MouseEvent) => {
    const box = boxRef.current;
    const lens = lensRef.current;
    if (!box || !lens) return;

    const r = box.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;

    lens.style.visibility = 'visible';
    // `transform` y no left/top: no dispara layout en cada movimiento.
    lens.style.transform = `translate(${x - LENS_W / 2}px, ${y - LENS_H / 2}px)`;
    lens.style.backgroundSize = `${r.width * ZOOM}px ${r.height * ZOOM}px`;
    // En píxeles y centrado, no en porcentaje.
    //
    // Con porcentajes el navegador alinea el X% de la imagen con el X% de la
    // lupa: en el medio queda bien, pero contra un borde el punto que estás
    // señalando aparece pegado al canto de la lupa y no hay forma de mirar el
    // borde de frente. Así el punto bajo el cursor cae siempre en el centro, y
    // lo que sobra fuera de la imagen se ve blanco.
    lens.style.backgroundPosition = `${LENS_W / 2 - x * ZOOM}px ${LENS_H / 2 - y * ZOOM}px`;
  };

  const hide = () => {
    if (lensRef.current) lensRef.current.style.visibility = 'hidden';
  };

  return (
    <Box
      ref={boxRef}
      onMouseMove={onMove}
      onMouseLeave={hide}
      sx={{
        position: 'relative',
        display: 'inline-block',
        lineHeight: 0,
        cursor: 'zoom-in',
        // Sin `overflow: hidden`: contra un borde del flyer, la mitad de la lupa
        // cae fuera del marco y recortarla es justo lo que impide mirar el borde.
        // El marco va en la imagen, que además lo necesita para no sobrar aire:
        // la lupa mide contra este rectángulo y apuntaría corrido.
      }}
    >
      <img
        src={src}
        alt="Flyer"
        style={{
          display: 'block',
          maxHeight,
          maxWidth: '100%',
          width: 'auto',
          height: 'auto',
          border: '1px solid rgba(0,0,0,.18)',
          borderRadius: 4,
        }}
      />
      {/* Estilos en línea, no `sx`: el `background-image` del flyer no debe
          pasar por emotion ni regenerarse al moverse. */}
      <div
        ref={lensRef}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: LENS_W,
          height: LENS_H,
          visibility: 'hidden',
          pointerEvents: 'none',
          borderRadius: 4,
          border: '2px solid #3b82f6',
          boxShadow: '0 4px 16px rgba(0,0,0,.35)',
          backgroundImage: `url("${src}")`,
          backgroundRepeat: 'no-repeat',
          // Lo que queda fuera de la imagen, al asomarse por un borde.
          backgroundColor: '#fff',
          willChange: 'transform',
        }}
      />
    </Box>
  );
}

export default FlyerLens;
