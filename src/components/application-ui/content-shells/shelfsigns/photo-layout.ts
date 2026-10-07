/**
 * Encuadre libre de la foto dentro del cartón.
 *
 * Por defecto la foto vive en una caja fija de la columna derecha y entra con
 * `contain`: eso mantiene parejos los cartones de una misma hoja, que es lo que
 * se quiere casi siempre. Pero cuando el recorte trae margen muerto —un producto
 * suelto sobre fondo blanco, una foto con varios artículos— el producto se
 * dibuja chico y no hay forma de arreglarlo sin salir de esa caja.
 *
 * `ShelfSignProduct.photoLayout` saca la foto de la caja: pasa a ser una capa
 * absoluta sobre el cartón, que el diseñador arrastra y estira desde las puntas
 * en la vista previa. Mientras no lo toque, el campo es `undefined` y el cartón
 * se dibuja exactamente como siempre.
 *
 * Todo en % del cartón (media hoja carta), nunca en píxeles: la vista previa se
 * muestra escalada y la hoja impresa no, y el mismo número tiene que servir
 * para las dos.
 */

export interface PhotoLayout {
  /** Borde izquierdo y superior, en % del cartón. */
  x: number;
  y: number;
  /** Ancho y alto, en % del cartón. La proporción la mantiene el editor. */
  w: number;
  h: number;
}

/**
 * Hasta dónde puede salirse del cartón.
 *
 * Se permite sangrar bastante —a veces el producto tiene que irse al borde— pero
 * no tanto como para que quede fuera de la vista y sin forma de agarrarlo de
 * nuevo. Para eso igual está "Restablecer".
 */
const POS_MIN = -40;
const POS_MAX = 120;
const SIZE_MIN = 5;
const SIZE_MAX = 300;

const round = (v: number): number => Math.round(v * 100) / 100;

const clamp = (v: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, v));

export function clampPhotoLayout(l: PhotoLayout): PhotoLayout {
  return {
    x: round(clamp(l.x, POS_MIN, POS_MAX)),
    y: round(clamp(l.y, POS_MIN, POS_MAX)),
    w: round(clamp(l.w, SIZE_MIN, SIZE_MAX)),
    h: round(clamp(l.h, SIZE_MIN, SIZE_MAX)),
  };
}

/** Las 4 puntas. El arrastre ancla siempre la opuesta. */
export type PhotoHandle = 'nw' | 'ne' | 'sw' | 'se';

export const PHOTO_HANDLES: PhotoHandle[] = ['nw', 'ne', 'sw', 'se'];

export const HANDLE_CURSOR: Record<PhotoHandle, string> = {
  nw: 'nwse-resize',
  ne: 'nesw-resize',
  sw: 'nesw-resize',
  se: 'nwse-resize',
};

/**
 * Nuevo encuadre al arrastrar una punta.
 *
 * El ancho manda y el alto lo sigue para no deformar el producto: una foto
 * estirada en góndola se nota más que una chica. `dx`/`dy` vienen en % del
 * cartón, así que el zoom de la vista previa no entra en la cuenta.
 */
export function resizeByHandle(
  start: PhotoLayout,
  handle: PhotoHandle,
  dx: number,
  dy: number
): PhotoLayout {
  const growX = handle === 'ne' || handle === 'se' ? dx : -dx;
  const growY = handle === 'sw' || handle === 'se' ? dy : -dy;

  // La punta sigue al puntero por el eje que más se movió: arrastrar en
  // diagonal se siente natural y en recto no pelea con el otro eje.
  const byWidth = Math.abs(growX) >= Math.abs(growY);
  const factor = byWidth
    ? (start.w + growX) / start.w
    : (start.h + growY) / start.h;

  const w = clamp(start.w * factor, SIZE_MIN, SIZE_MAX);
  const h = start.h * (w / start.w);

  // Anclar la punta opuesta: la que arrastro es la que se mueve, la otra no.
  const x = handle === 'nw' || handle === 'sw' ? start.x + (start.w - w) : start.x;
  const y = handle === 'nw' || handle === 'ne' ? start.y + (start.h - h) : start.y;

  return clampPhotoLayout({ x, y, w, h });
}

/* ── Recorte ─────────────────────────────────────────────────────────────── */

/**
 * Qué parte de la imagen original se ve, en % de la imagen.
 *
 * Reencuadrar no alcanza cuando lo que sobra es la foto misma: un PNG con el
 * producto chiquito en medio de mucho blanco se agranda hasta que el producto
 * se lee, pero entonces el blanco invade medio cartón. Recortando, la caja se
 * queda sólo con el producto.
 */
export interface PhotoCrop {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const FULL_CROP: PhotoCrop = { x: 0, y: 0, w: 100, h: 100 };

const CROP_MIN = 5;

export const isFullCrop = (c: PhotoCrop): boolean =>
  c.x === 0 && c.y === 0 && c.w === 100 && c.h === 100;

export function clampPhotoCrop(c: PhotoCrop): PhotoCrop {
  const w = clamp(c.w, CROP_MIN, 100);
  const h = clamp(c.h, CROP_MIN, 100);
  return {
    x: round(clamp(c.x, 0, 100 - w)),
    y: round(clamp(c.y, 0, 100 - h)),
    w: round(w),
    h: round(h),
  };
}

export const photoCropOf = (c?: PhotoCrop): PhotoCrop => (c ? clampPhotoCrop(c) : FULL_CROP);

/**
 * Mueve la caja del cartón para que lo que quedó del recorte siga dibujándose
 * donde ya estaba. Sin esto, recortar daría un salto: la foto se achicaría pero
 * también se correría, porque la caja sigue anclada a su esquina.
 */
function remapLayout(layout: PhotoLayout, from: PhotoCrop, to: PhotoCrop): PhotoLayout {
  // Cuánto cartón ocupa un 1% de la imagen. Se mantiene: recortar no re-escala.
  const sx = layout.w / from.w;
  const sy = layout.h / from.h;
  return clampPhotoLayout({
    x: layout.x + (to.x - from.x) * sx,
    y: layout.y + (to.y - from.y) * sy,
    w: to.w * sx,
    h: to.h * sy,
  });
}

/**
 * Arrastrar una punta en modo recorte: come o devuelve borde por ese lado.
 *
 * A diferencia de redimensionar, acá los ejes van sueltos —recortar de ancho no
 * tiene por qué recortar de alto— y el producto no cambia de tamaño: sólo se le
 * saca marco.
 */
export function cropByHandle(
  layout: PhotoLayout,
  crop: PhotoCrop,
  handle: PhotoHandle,
  dx: number,
  dy: number
): { layout: PhotoLayout; crop: PhotoCrop } {
  const sx = layout.w / crop.w;
  const sy = layout.h / crop.h;
  const west = handle === 'nw' || handle === 'sw';
  const north = handle === 'nw' || handle === 'ne';

  // El puntero se mueve en % del cartón; pasarlo a % de la imagen.
  const w = crop.w + (west ? -dx : dx) / sx;
  const h = crop.h + (north ? -dy : dy) / sy;
  const next = clampPhotoCrop({
    x: west ? crop.x + crop.w - w : crop.x,
    y: north ? crop.y + crop.h - h : crop.y,
    w,
    h,
  });

  return { crop: next, layout: remapLayout(layout, crop, next) };
}

/**
 * Estilos para pintar un recorte: el contenedor es la ventana y la imagen va
 * adentro agrandada y corrida, de modo que por la ventana se vea justo el
 * recorte. Con el recorte completo no hace falta nada de esto.
 */
export function cropStyles(crop: PhotoCrop): {
  width: string;
  height: string;
  left: string;
  top: string;
} {
  return {
    width: `${(100 / crop.w) * 100}%`,
    height: `${(100 / crop.h) * 100}%`,
    left: `${(-crop.x / crop.w) * 100}%`,
    top: `${(-crop.y / crop.h) * 100}%`,
  };
}

/**
 * Dónde se está dibujando REALMENTE la foto, en % del cartón.
 *
 * No alcanza con el rectángulo del <img>: con `object-fit: contain` lo pintado
 * suele ser más chico que el elemento, y las puntas tienen que quedar pegadas al
 * producto y no a un marco vacío. Sirve igual para la foto en su caja y para la
 * ya desprendida, así que al empezar a arrastrar no da ningún salto.
 */
export function paintedPhotoLayout(el: HTMLElement, root: HTMLElement): PhotoLayout | null {
  const box = el.getBoundingClientRect();
  const area = root.getBoundingClientRect();
  if (!box.width || !box.height || !area.width || !area.height) return null;

  // Una foto recortada o ya desprendida llena su elemento: ahí el rectángulo del
  // elemento ES lo pintado. La que sigue en su caja entra con `contain`, y lo
  // pintado es más chico; para esa hay que descontar el marco vacío.
  const img = el instanceof HTMLImageElement ? el : null;
  const nw = img?.naturalWidth || 0;
  const nh = img?.naturalHeight || 0;
  const fits = nw > 0 && nh > 0;

  const scale = fits ? Math.min(box.width / nw, box.height / nh) : 1;
  const w = fits ? nw * scale : box.width;
  const h = fits ? nh * scale : box.height;

  // Como en el cartón: pegada a la derecha de su caja y centrada en vertical.
  const left = box.left + (box.width - w);
  const top = box.top + (box.height - h) / 2;

  return {
    x: round(((left - area.left) / area.width) * 100),
    y: round(((top - area.top) / area.height) * 100),
    w: round((w / area.width) * 100),
    h: round((h / area.height) * 100),
  };
}
