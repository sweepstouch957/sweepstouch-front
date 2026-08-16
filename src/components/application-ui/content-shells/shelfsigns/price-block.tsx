'use client';

import React from 'react';
import { priceValues } from './price';
import type { ShelfSignProduct } from './types';

/**
 * Bloque de precio del cartón — los cuatro formatos.
 *
 * Estilos en línea a propósito: estos tamaños están calibrados y aprobados
 * sobre la hoja carta impresa. Con `sx` quedarían expuestos al tema del panel
 * (tipografía, spacing, dark mode) y el cartón dejaría de ser el mismo objeto
 * en pantalla y en papel.
 */

/** Alto visual del número grande: ancla la unidad (LB./EA.) al pie del número. */
const NUM_H = 155;

interface Props {
  product: ShelfSignProduct;
  color: string;
}

export function PriceBlock({ product, color }: Props): React.JSX.Element {
  const { qty, dollars, cents, unit, format } = priceValues(product);

  const big: React.CSSProperties = {
    fontWeight: 800,
    color,
    lineHeight: 0.85,
    letterSpacing: '-5px',
    fontSize: 188,
  };

  /* 2/$12.95 — múltiple. Con unidad explícita, prefijo apilado 4/$ · LB. · FOR */
  if (format === 'multi') {
    const hasUnit = !!unit;
    return (
      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
        <div
          style={{
            color,
            fontWeight: 800,
            lineHeight: 0.9,
            // Sin unidad el prefijo es una sola línea: baja menos y crece un
            // punto para quedar nivelado con el "$" del formato simple.
            marginTop: hasUnit ? 8 : 18,
            marginRight: 3,
            textAlign: 'left',
          }}
        >
          <div style={{ fontSize: hasUnit ? 65 : 82, letterSpacing: '-2px' }}>{qty}/$</div>
          {hasUnit && <div style={{ fontSize: 48 }}>{`${unit}.`}</div>}
          {hasUnit && <div style={{ fontSize: 48 }}>FOR</div>}
        </div>
        <div style={big}>{dollars}</div>
        {cents > 0 && (
          <div
            style={{
              color,
              fontWeight: 800,
              fontSize: 70,
              lineHeight: 1,
              marginTop: 10,
              marginLeft: 8,
              letterSpacing: '-1px',
            }}
          >
            {String(cents).padStart(2, '0')}
          </div>
        )}
      </div>
    );
  }

  /* 95¢ · 89¢ LB · 2/95¢ — nunca "$0.xx" */
  if (format === 'cents') {
    return (
      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
        <div
          style={{
            color,
            fontWeight: 800,
            fontSize: 90,
            lineHeight: 1,
            marginTop: 30,
            marginRight: 5,
          }}
        >
          {qty > 1 ? `${qty}/` : ''}
        </div>
        <div style={big}>{cents}</div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: NUM_H,
            marginTop: 8,
            // Separación del número grande: pegado, dígitos como el 7 encimaban
            // el ¢. La unidad de abajo hereda este margen y queda alineada
            // debajo de los centavos.
            marginLeft: 8,
          }}
        >
          <div style={{ color, fontWeight: 800, fontSize: 75, lineHeight: 1 }}>¢</div>
          <div
            style={{ color, fontWeight: 800, fontSize: 38, lineHeight: 1, alignSelf: 'flex-start' }}
          >
            {unit ? `${unit}.` : ''}
          </div>
        </div>
      </div>
    );
  }

  /* $12.99 EA. — centavos en superíndice, unidad al pie del número */
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
      <div style={{ color, fontWeight: 800, fontSize: 80, lineHeight: 1, marginTop: 12, marginRight: 3 }}>
        $
      </div>
      <div style={big}>{dollars}</div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: NUM_H,
          marginTop: 8,
          marginLeft: 8,
          textAlign: 'left',
        }}
      >
        {cents > 0 ? (
          <div
            style={{ color, fontWeight: 800, fontSize: 70, lineHeight: 0.9, letterSpacing: '-1px' }}
          >
            {String(cents).padStart(2, '0')}
          </div>
        ) : (
          <div />
        )}
        <div
          style={{ color, fontWeight: 800, fontSize: 38, lineHeight: 1, alignSelf: 'flex-start' }}
        >
          {unit ? `${unit}.` : ''}
        </div>
      </div>
    </div>
  );
}

export default PriceBlock;
