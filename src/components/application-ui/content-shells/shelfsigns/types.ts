/**
 * Modelo de datos de un shelf sign (cartón de precio).
 *
 * Nota sobre el precio: NO existe un campo "tipo de precio". El formato impreso
 * ($2.29 LB, 4/$10, 95¢…) se deriva siempre de los valores — ver `price.ts`.
 * La IA sí devuelve un `priceType` en su JSON, pero se descarta al normalizar:
 * si el modelo se equivoca al clasificar, el cartón igual sale bien.
 */

export type PriceUnit = 'LB' | 'EA' | '';

/** Recorte de la foto dentro del flyer, en porcentajes 0-100 de la imagen. */
export interface PhotoBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ShelfSignProduct {
  id: string;

  /** Producto 1 */
  name: string;
  details: string;

  /** Producto 2 — sólo en promos combinadas (OR / mix & match). "" si no aplica.
   *  El "OR" NO se guarda acá: lo agrega el render. */
  name2: string;
  details2: string;

  /** Precio: cantidad ≥ 1, dólares ≥ 0, centavos 0-99. */
  qty: number;
  dollars: number;
  cents: number;
  unit: PriceUnit;

  /** Caja gris "regular price / save" — texto libre tal como sale del flyer. */
  regularPrice: string;
  save: string;

  /** Condiciones (LIMIT, MUST BUY, WITH CLUB CARD…), una por línea. */
  conditions: string;

  /** Foto ya recortada (dataURL) y la caja de la que salió. */
  photo: string | null;
  photoBox: PhotoBox | null;
}

/** Configuración de la plantilla master, común a todos los cartones. */
export interface ShelfSignConfig {
  /** Color primario: números de precio, franja VIP, acentos. */
  color: string;
  /** Mostrar u ocultar la caja "regular price / save". */
  showSaveBox: boolean;

  /** Tienda seleccionada: sólo determina el QR y organiza. NO se imprime. */
  storeId: string;
  storeName: string;
  /** QR genérico de la tienda (Cloudinary). null hasta elegir tienda. */
  qrUrl: string | null;

  /** Vigencia de la oferta (ISO yyyy-mm-dd), una sola para todos los cartones. */
  dateFrom: string;
  dateTo: string;
}
