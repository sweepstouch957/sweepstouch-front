'use client';

import GlobalStyles from '@mui/material/GlobalStyles';
import React from 'react';

/**
 * CSS global del módulo Shelfsigns: tipografía del cartón, medidas de la hoja
 * y reglas de impresión. Se monta sólo dentro de la herramienta, así que nada
 * de esto afecta al resto del panel.
 *
 * Poppins va self-hosteada desde /public: la CSP declara `font-src 'self' data:`
 * (sin fonts.googleapis.com), así que el @import del prototipo no cargaría y el
 * cartón saldría con la fuente del sistema. Como archivo local además queda
 * embebida en el PDF.
 */

const weights = [400, 500, 600, 700, 800, 900];

const fontFaces = weights
  .map(
    (w) => `
@font-face {
  font-family: 'Poppins ST';
  font-style: normal;
  font-display: block;
  font-weight: ${w};
  src: url('/shelfsigns/fonts/poppins-latin-${w}-normal.woff2') format('woff2');
}`
  )
  .join('\n');

/**
 * `font-display: block` a propósito: con `swap`, imprimir antes de que cargue
 * la fuente saca el cartón con la métrica del fallback y el precio se corre.
 */
const css = `
${fontFaces}

.ss-shelfsign {
  font-family: 'Poppins ST', 'Poppins', sans-serif;
  color: #111;
}

/* Los navegadores omiten los fondos al imprimir salvo que se pida lo contrario:
   sin esto salían en blanco la franja VIP, la caja regular/save y la columna
   del logo. Va en el cartón y en todos sus hijos, no sólo en @media print,
   porque Chrome lo evalúa sobre el árbol renderizado. */
.ss-sheet,
.ss-shelfsign,
.ss-shelfsign * {
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
  color-adjust: exact;
}

.ss-sheet {
  width: 8.5in;
  height: 11in;
  background: #fff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.ss-sheet-half {
  height: 5.5in;
  position: relative;
  display: flex;
  flex-direction: column;
}

.ss-cutline {
  border-top: 3px dashed #b9b9b9;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
}

/* Fuera de pantalla: es lo que se manda a la impresora, no lo que se ve. */
.ss-print-area {
  position: absolute;
  left: -9999px;
  top: 0;
}

@media print {
  /* El panel entero (sidebar, header, drawers) se oculta sin desmontarlo:
     ocultando por visibilidad no se pierde el layout de las hojas. */
  body * { visibility: hidden; }
  .ss-print-area, .ss-print-area * { visibility: visible; }

  .ss-print-area {
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
  }

  /* Repetido dentro de @media print a propósito: algunos motores sólo lo
     respetan cuando aparece en el contexto de impresión. */
  .ss-print-area,
  .ss-print-area * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }

  /* El shell del admin recorta el scroll; en impresión eso truncaba
     todo lo que pasara de la primera hoja. */
  html, body {
    height: auto !important;
    overflow: visible !important;
    background: #fff !important;
  }

  .ss-sheet {
    page-break-after: always;
    break-after: page;
    box-shadow: none !important;
  }
  .ss-sheet:last-child {
    page-break-after: auto;
    break-after: auto;
  }

  .ss-no-print { display: none !important; }
}

@page {
  size: letter portrait;
  margin: 0;
}
`;

export function ShelfSignPrintStyles(): React.JSX.Element {
  return <GlobalStyles styles={css} />;
}

export default ShelfSignPrintStyles;
