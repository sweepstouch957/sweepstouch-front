'use client';

import React from 'react';
import { POWERED_BY_LOGO_SRC, VIP_LOGO_SRC } from './constants';
import { offerValidLines } from './dates';
import {
  clampPhotoLayout,
  cropByHandle,
  cropStyles,
  HANDLE_CURSOR,
  isFullCrop,
  paintedPhotoLayout,
  PHOTO_HANDLES,
  photoCropOf,
  resizeByHandle,
  type PhotoCrop,
  type PhotoHandle,
  type PhotoLayout,
} from './photo-layout';
import { remainingConditions } from './price';
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
  /**
   * Edición directa de la foto: arrastrar para mover, puntas para estirar.
   * Sólo la vista previa en pantalla lo pasa; la hoja que se imprime nunca.
   * `scale` es el zoom al que se muestra el cartón, para que las puntas midan
   * lo mismo en pantalla sin importar a qué tamaño esté la hoja.
   */
  edit?: {
    scale: number;
    /** `move` mueve y agranda la foto; `crop` le come el borde. */
    mode: 'move' | 'crop';
    onChange: (id: string, patch: Partial<ShelfSignProduct>) => void;
  };
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

export function ShelfSign({
  product: p,
  config: cfg,
  isBottom = false,
  edit,
}: Props): React.JSX.Element {
  const color = cfg.color;

  const rootRef = React.useRef<HTMLDivElement>(null);
  /** Lo que se ve de la foto: el <img> suelto, o la ventana si está recortada. */
  const photoRef = React.useRef<HTMLElement | null>(null);

  const crop = photoCropOf(p.photoCrop);

  /**
   * Dónde está la foto ahora mismo, medida del DOM. Es el punto de partida
   * cuando todavía no hay `photoLayout`: así el primer arrastre no da el salto
   * de pasar de la caja al encuadre libre.
   */
  const [painted, setPainted] = React.useState<PhotoLayout | null>(null);

  const measure = React.useCallback(() => {
    if (!edit || !photoRef.current || !rootRef.current) return;
    setPainted(paintedPhotoLayout(photoRef.current, rootRef.current));
  }, [edit]);

  React.useLayoutEffect(() => {
    measure();
  }, [measure, p.photo, p.photoLayout, p.photoCrop]);

  const frame = p.photoLayout || painted;

  /** Estado del arrastre en curso. En ref: cambia en cada pointermove. */
  const dragRef = React.useRef<{
    start: PhotoLayout;
    startCrop: PhotoCrop;
    handle: PhotoHandle | null;
    clientX: number;
    clientY: number;
    areaW: number;
    areaH: number;
  } | null>(null);

  const beginDrag = (e: React.PointerEvent, handle: PhotoHandle | null) => {
    if (!edit || !frame || !rootRef.current) return;
    const area = rootRef.current.getBoundingClientRect();
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      start: frame,
      startCrop: crop,
      handle,
      clientX: e.clientX,
      clientY: e.clientY,
      areaW: area.width,
      areaH: area.height,
    };
  };

  const onDrag = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d || !edit) return;
    // En % del cartón: el zoom de la vista previa afecta igual al puntero y al
    // cartón, así que al dividir por el ancho medido se cancela solo.
    const dx = ((e.clientX - d.clientX) / d.areaW) * 100;
    const dy = ((e.clientY - d.clientY) / d.areaH) * 100;
    if (d.handle && edit.mode === 'crop') {
      const next = cropByHandle(d.start, d.startCrop, d.handle, dx, dy);
      edit.onChange(p.id, { photoLayout: next.layout, photoCrop: next.crop });
      return;
    }
    edit.onChange(p.id, {
      photoLayout: d.handle
        ? resizeByHandle(d.start, d.handle, dx, dy)
        : clampPhotoLayout({ ...d.start, x: d.start.x + dx, y: d.start.y + dy }),
    });
  };

  const endDrag = (e: React.PointerEvent) => {
    dragRef.current = null;
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

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

  const validLines = offerValidLines(cfg.dateFrom, cfg.dateTo);

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
      ref={rootRef}
      className="ss-shelfsign ss-sheet-half"
      // La foto con encuadre libre puede pasarse del cartón: se corta en su
      // borde, que es exactamente hasta donde llega el papel.
      style={{ padding: '0.22in 0.3in 0 0.3in', overflow: 'hidden' }}
    >
      {isBottom && <div className="ss-cutline" />}

      {/* Precio, caja regular/save y nombres: siempre por delante de la foto. */}
      <div
        style={{
          display: 'flex',
          flex: 1,
          gap: '0.15in',
          minHeight: 0,
          position: 'relative',
          zIndex: 1,
        }}
      >
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

            {validLines.length > 0 && (
              <div
                style={{
                  marginTop: 10,
                  fontSize: 11.5,
                  color: '#111',
                  lineHeight: 1.3,
                  maxWidth: '2.6in',
                }}
              >
                <b>OFFER VALID:</b>{' '}
                {validLines.map((line, i) => (
                  <React.Fragment key={line}>
                    {i > 0 && <br />}
                    {line}
                  </React.Fragment>
                ))}
              </div>
            )}
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
          {p.photo && !p.photoLayout && (
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
                ref={(el) => {
                  photoRef.current = el;
                }}
                src={p.photo}
                alt=""
                onLoad={measure}
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

            {/* La condición de compra de un FREE no sale acá: se imprime grande
                debajo del FREE, en el bloque de precio. */}
            {remainingConditions(p).map((line, i) => (
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

      {/* ── Foto desprendida de su caja: va donde el diseñador la puso ── */}
      {p.photo && p.photoLayout && (
        <div
          ref={(el) => {
            photoRef.current = el;
          }}
          style={{
            position: 'absolute',
            left: `${p.photoLayout.x}%`,
            top: `${p.photoLayout.y}%`,
            width: `${p.photoLayout.w}%`,
            height: `${p.photoLayout.h}%`,
            // La ventana del recorte. Sin recortar no tapa nada: la imagen la
            // llena justa.
            overflow: 'hidden',
            // Al fondo de todo: el texto del cartón se lee siempre, por más que
            // la foto se agrande o se corra encima.
            zIndex: 0,
          }}
        >
          <img
            src={p.photo}
            alt=""
            onLoad={measure}
            style={
              isFullCrop(crop)
                ? { width: '100%', height: '100%', objectFit: 'contain' }
                : { position: 'absolute', objectFit: 'fill', ...cropStyles(crop) }
            }
          />
        </div>
      )}

      {/* ── Marco de edición: sólo en pantalla, nunca en la hoja impresa ── */}
      {edit && p.photo && frame && (
        <div
          className="ss-no-print"
          onPointerDown={(e) => beginDrag(e, null)}
          onPointerMove={onDrag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          style={{
            position: 'absolute',
            left: `${frame.x}%`,
            top: `${frame.y}%`,
            width: `${frame.w}%`,
            height: `${frame.h}%`,
            // Contra el zoom de la vista previa, para que el marco se vea igual
            // de fino con la hoja grande o chica.
            outline: `${1 / edit.scale}px solid ${edit.mode === 'crop' ? '#f59e0b' : '#3b82f6'}`,
            cursor: 'move',
            touchAction: 'none',
            zIndex: 4,
          }}
        >
          {PHOTO_HANDLES.map((h) => {
            const size = 10 / edit.scale;
            const west = h === 'nw' || h === 'sw';
            const north = h === 'nw' || h === 'ne';
            return (
              <div
                key={h}
                onPointerDown={(e) => beginDrag(e, h)}
                onPointerMove={onDrag}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                style={{
                  position: 'absolute',
                  width: size,
                  height: size,
                  background: '#fff',
                  border: `${1 / edit.scale}px solid ${
                    edit.mode === 'crop' ? '#f59e0b' : '#3b82f6'
                  }`,
                  borderRadius: 2 / edit.scale,
                  cursor: HANDLE_CURSOR[h],
                  touchAction: 'none',
                  left: west ? -size / 2 : undefined,
                  right: west ? undefined : -size / 2,
                  top: north ? -size / 2 : undefined,
                  bottom: north ? undefined : -size / 2,
                }}
              />
            );
          })}
        </div>
      )}

      {/* ── Franja VIP: sangra a los bordes compensando el padding del cartón ── */}
      <div
        style={{
          display: 'flex',
          height: '1.45in',
          marginLeft: '-0.3in',
          marginRight: '-0.3in',
          // Arte de marca: la foto pasa por detrás, nunca por encima.
          position: 'relative',
          zIndex: 2,
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
