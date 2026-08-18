'use client';

import React from 'react';
import { ShelfSign } from './shelf-sign';
import type { ShelfSignConfig, ShelfSignProduct } from './types';

/**
 * Hoja carta vertical con dos cartones y la línea de corte al medio.
 * N productos → ceil(N/2) hojas, todas en el mismo PDF.
 */

/** Agrupa los productos de a dos: cada par es una hoja. */
export function paginate(products: ShelfSignProduct[]): ShelfSignProduct[][] {
  const pages: ShelfSignProduct[][] = [];
  for (let i = 0; i < products.length; i += 2) pages.push(products.slice(i, i + 2));
  return pages;
}

interface Props {
  pair: ShelfSignProduct[];
  config: ShelfSignConfig;
  /** Sombra en pantalla; en impresión se anula por CSS. */
  shadow?: boolean;
}

export function Sheet({ pair, config, shadow = false }: Props): React.JSX.Element {
  return (
    <div
      className="ss-sheet"
      style={shadow ? { boxShadow: '0 2px 14px rgba(0,0,0,.15)' } : undefined}
    >
      <ShelfSign
        product={pair[0]}
        config={config}
      />
      {/* Producto impar: la mitad de abajo va vacía pero conserva la línea de
          corte, así la hoja se recorta igual que las demás. */}
      {pair[1] ? (
        <ShelfSign
          product={pair[1]}
          config={config}
          isBottom
        />
      ) : (
        <div className="ss-sheet-half">
          <div className="ss-cutline" />
        </div>
      )}
    </div>
  );
}

export default Sheet;
