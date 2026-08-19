'use client';

import React from 'react';
import { POWERED_BY_LOGO_SRC, VIP_LOGO_SRC } from './constants';
import { fmtOfferDate } from './dates';
import { PriceBlock } from './price-block';
import type { ShelfSignConfig, ShelfSignProduct } from './types';

/**
 * Un shelf sign: media hoja carta (8.5 × 5.5 in).
 *
 * Layout aprobado, portado del prototipo sin recalibrar:
 *  - columna izquierda: precio arriba (30px de respiro), caja regular/save +
 *    OFFER VALID ANCLADOS al fondo — no siguen al precio, así dos cartones con
 *    precios de distinto alto tienen la caja a la misma altura;
 *  - columna derecha: foto arriba, nombres y detalles alineados a la derecha;
 *  - franja VIP al pie, sangrando a los bordes de la hoja.
 *
 * Estilos en línea igual que en PriceBlock: el cartón no debe heredar el tema
 * del panel (ni el dark mode) porque se imprime.
 */

interface Props {
  product: ShelfSignProduct;
  config: ShelfSignConfig;
  /** El de abajo lleva la línea de corte punteada en su borde superior. */
  isBottom?: boolean;
}

/** Marca de posición del QR mientras no haya tienda elegida. */
function QrPlaceholder(): React.JSX.Element {
  return (
    <div
      style={{
        width: 92,
        height: 92,
        border: '2px dashed #bbb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 11,
        fontWeight: 700,
        color: '#999',
        textAlign: 'center',
        lineHeight: 1.2,
      }}
    >
      QR DE LA
      <br />
      TIENDA
    </div>
  );
}

export function ShelfSign({ product: p, config: cfg, isBottom = false }: Props): React.JSX.Element {
  const color = cfg.color;

  // El "OR" del mix & match no viaja en el dato: se agrega acá, y sólo si el
  // nombre no lo trae ya (la IA a veces lo cuela pese al prompt).
  const orName2 = p.name2
    ? p.name2.trim().toUpperCase().startsWith('OR ')
      ? p.name2
      : `OR ${p.name2}`
    : '';

  const detailLine = (line: string, i: number) => (
    <div
      key={i}
      style={{ fontSize: 12.5, fontWeight: 500, color: '#111', lineHeight: 1.35 }}
    >
      {line}
    </div>
  );

  return (
    <div
      className="ss-shelfsign ss-sheet-half"
      style={{ padding: '0.22in 0.3in 0 0.3in' }}
    >
      {isBottom && <div className="ss-cutline" />}

      <div style={{ display: 'flex', flex: 1, gap: '0.15in', minHeight: 0 }}>
        {/* ── Columna izquierda ── */}
        <div style={{ flex: 1.15, display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginTop: 30 }}>
            <PriceBlock
              product={p}
              color={color}
            />
          </div>

          {/* Anclado al fondo, justo arriba de la franja VIP */}
          <div style={{ marginTop: 'auto', paddingBottom: 10 }}>
            {cfg.showSaveBox && (
              <div
                style={{
                  background: '#efefef',
                  borderRadius: 8,
                  padding: '6px 14px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 12,
                  width: 'fit-content',
                }}
              >
                <div style={{ lineHeight: 1.05 }}>
                  <div style={{ color, fontWeight: 700, fontSize: 12 }}>
                    regular price{' '}
                    <span style={{ color: '#555', fontWeight: 500, fontSize: 8 }}>
                      (precio regular)
                    </span>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: '#111' }}>
                    {p.regularPrice}
                  </div>
                </div>
                <div style={{ fontSize: 26, color: '#999', fontWeight: 300 }}>/</div>
                <div style={{ lineHeight: 1.05 }}>
                  <div style={{ color, fontWeight: 700, fontSize: 12 }}>
                    save{' '}
                    <span style={{ color: '#555', fontWeight: 500, fontSize: 8 }}>(Ahorre)</span>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: '#111' }}>{p.save}</div>
                </div>
              </div>
            )}

            <div
              style={{
                marginTop: 10,
                fontSize: 11.5,
                color: '#111',
                lineHeight: 1.3,
                maxWidth: '2.6in',
              }}
            >
              <b>OFFER VALID:</b> FROM {fmtOfferDate(cfg.dateFrom)},
              <br />
              TO {fmtOfferDate(cfg.dateTo, true)}.
            </div>
          </div>
        </div>

        {/* ── Columna derecha: foto + nombres ──
            Orden: nombre 1 → detalles 1 → OR nombre 2 → detalles 2 → condiciones */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            justifyContent: 'flex-end',
            textAlign: 'right',
            paddingBottom: 10,
            minWidth: 0,
          }}
        >
          {/* La foto se come TODO el alto libre que queda sobre los nombres, en
              vez de un tope fijo de 2.4in. El backend ya le recortó el margen
              muerto, así que lo que se escala es el producto y no su marco: un
              carton visto a 3 metros en gondola necesita la foto grande. */}
          {p.photo && (
            <div
              style={{
                flex: 1,
                minHeight: 0,
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                paddingBottom: 8,
              }}
            >
              <img
                src={p.photo}
                alt=""
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              />
            </div>
          )}
          <div>
            <div style={{ fontWeight: 800, fontSize: 22, color: '#111', lineHeight: 1.05 }}>
              {p.name}
            </div>
            {p.details && p.details.split('\n').map(detailLine)}

            {orName2 && (
              <div
                style={{
                  fontWeight: 800,
                  fontSize: 20,
                  color: '#111',
                  lineHeight: 1.1,
                  marginTop: 3,
                }}
              >
                {orName2}
              </div>
            )}
            {orName2 && p.details2 && p.details2.split('\n').map(detailLine)}

            {p.conditions &&
              p.conditions.split('\n').map((line, i) => (
                <div
                  key={i}
                  style={{ fontSize: 11.5, fontWeight: 600, color: '#111', lineHeight: 1.35 }}
                >
                  {line}
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* ── Franja VIP: sangra a los bordes compensando el padding del cartón ── */}
      <div
        style={{
          display: 'flex',
          height: '1.45in',
          marginLeft: '-0.3in',
          marginRight: '-0.3in',
        }}
      >
        <div
          style={{
            flex: 1,
            background: color,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '0 0.25in',
          }}
        >
          {/* Logos oficiales: arte de marca, nunca recoloreados con el primario. */}
          <img
            src={VIP_LOGO_SRC}
            alt="VIP CUSTOMER"
            style={{ height: '1in', width: 'auto' }}
          />
          <div style={{ background: '#fff', padding: 5, display: 'flex' }}>
            {cfg.qrUrl ? (
              <img
                src={cfg.qrUrl}
                alt="QR"
                style={{ width: 92, height: 92, display: 'block' }}
              />
            ) : (
              <QrPlaceholder />
            )}
          </div>
          <svg
            width="26"
            height="40"
            viewBox="0 0 26 40"
          >
            <path
              d="M2 2 L24 20 L2 38 Z"
              fill="#fff"
            />
          </svg>
          <div style={{ color: '#fff', lineHeight: 1.1 }}>
            <div style={{ fontWeight: 800, fontSize: 20 }}>SCAN ME!</div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>And become a</div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>VIP CUSTOMER</div>
          </div>
          <div style={{ width: 1, height: '60%', background: 'rgba(255,255,255,.6)' }} />
          <div style={{ color: '#fff', fontSize: 16, lineHeight: 1.2 }}>
            Participate in
            <br />
            <b>monthly sweepstakes</b>
          </div>
        </div>
        <div
          style={{
            width: '1.7in',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <img
            src={POWERED_BY_LOGO_SRC}
            alt="Powered by Sweepstouch"
            style={{ height: '1.25in', width: 'auto' }}
          />
        </div>
      </div>
    </div>
  );
}

export default ShelfSign;
