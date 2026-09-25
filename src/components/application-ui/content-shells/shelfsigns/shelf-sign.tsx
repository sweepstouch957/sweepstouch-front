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

/**
 * Marco fijo de la foto, el mismo en TODOS los cartones.
 *
 * Antes la foto vivía en un `flex: 1` y además tenía tope de zoom sobre su
 * tamaño real: el alto dependía de cuántas líneas de detalle traía el producto,
 * y un PNG chico se dibujaba chico. Resultado: en la misma hoja un producto
 * enorme al lado de uno diminuto. Con una caja de medida fija y `contain`, cada
 * producto ocupa el mismo espacio y sólo su proporción decide si llena a lo
 * ancho o a lo alto.
 *
 * 2.25in sobre las ~3.8in útiles del cartón: queda sitio para nombre, detalles
 * y condiciones sin que el texto empuje la foto.
 */
const PHOTO_BOX_HEIGHT = '2.25in';

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
  const withOr = (name: string) =>
    name.trim().toUpperCase().startsWith('OR ') ? name : `OR ${name}`;

  const orName2 = p.name2 ? withOr(p.name2) : '';

  /** Productos 3-5: mismo tratamiento que el 2, con su "OR" y sus detalles. */
  const extras = (p.extras || []).filter((e) => e.name.trim());

  /**
   * La caja gris sólo se imprime si tiene algo adentro.
   *
   * Un flyer que no publica precio regular (las ofertas de carnicería casi
   * nunca lo traen) dejaba el cartón con el recuadro "regular price / save"
   * vacío en góndola. El switch de la plantilla sigue mandando: esto sólo
   * agrega "y además hay dato".
   */
  const showSaveBox = cfg.showSaveBox && Boolean(p.regularPrice?.trim() || p.save?.trim());

  /* Con 4 o 5 referencias en el mismo cartón los nombres a 22px se salen de la
     media hoja. Bajan de tamaño según cuántos haya, no por un alto fijo: un
     mix & match de dos sigue viéndose como el diseño aprobado. */
  const productCount = 1 + (orName2 ? 1 : 0) + extras.length;
  const nameSize = productCount >= 4 ? 16 : productCount === 3 ? 19 : 22;
  const subNameSize = Math.max(13, nameSize - 2);

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
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginTop: 30 }}>
            <PriceBlock
              product={p}
              color={color}
            />
          </div>

          {/* Anclado al fondo, justo arriba de la franja VIP */}
          <div style={{ marginTop: 'auto', paddingBottom: 10 }}>
            {showSaveBox && (
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
            // La foto arranca arriba y siempre en el mismo sitio; el texto se
            // ancla abajo con su `marginTop: auto`. Antes todo iba pegado al
            // fondo y la foto subía o bajaba según cuánto texto tuviera.
            justifyContent: 'flex-start',
            textAlign: 'right',
            paddingBottom: 10,
            minWidth: 0,
            // Más ancho para el producto: el precio ya se lee de lejos solo.
            flexGrow: 1.15,
          }}
        >
          {/* Caja fija: el alto NO depende del texto del cartón. El backend ya
              entrega el recorte sin margen muerto y reescalado a un mínimo, así
              que lo que llena la caja es el producto y no su marco. */}
          {p.photo && (
            <div
              style={{
                flex: '0 0 auto',
                height: PHOTO_BOX_HEIGHT,
                width: '100%',
                boxSizing: 'border-box',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                paddingBottom: 8,
              }}
            >
              {/* Sin tope por tamaño real: el PNG chico también llena la caja, y
                  `contain` le respeta la proporción. Un cartón se mira a tres
                  metros en góndola. */}
              <img
                src={p.photo}
                alt=""
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  objectPosition: 'right center',
                }}
              />
            </div>
          )}
          <div style={{ marginTop: 'auto' }}>
            <div style={{ fontWeight: 800, fontSize: nameSize, color: '#111', lineHeight: 1.05 }}>
              {p.name}
            </div>
            {p.details && p.details.split('\n').map(detailLine)}

            {orName2 && (
              <div
                style={{
                  fontWeight: 800,
                  fontSize: subNameSize,
                  color: '#111',
                  lineHeight: 1.1,
                  marginTop: 3,
                }}
              >
                {orName2}
              </div>
            )}
            {orName2 && p.details2 && p.details2.split('\n').map(detailLine)}

            {/* Productos 3-5 del mix & match */}
            {extras.map((e, i) => (
              <React.Fragment key={i}>
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: subNameSize,
                    color: '#111',
                    lineHeight: 1.1,
                    marginTop: 3,
                  }}
                >
                  {withOr(e.name)}
                </div>
                {e.details && e.details.split('\n').map(detailLine)}
              </React.Fragment>
            ))}

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
