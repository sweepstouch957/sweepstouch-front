/**
 * Constantes del módulo Shelfsigns: datos demo y valores por defecto de la
 * plantilla master. El prompt de extracción vive en el backend (módulo designs
 * de ai-service): la IA se llama server-side.
 */
import { uid } from './parse';
import type { ShelfSignConfig, ShelfSignProduct } from './types';

/** Logos oficiales. Arte de marca: NO se recolorean con el color primario. */
export const VIP_LOGO_SRC = '/shelfsigns/vip-customer.png';
export const POWERED_BY_LOGO_SRC = '/shelfsigns/powered-by-sweepstouch.png';

/** Rosa Sweepstouch. Editable por el diseñador en el paso 1. */
export const DEFAULT_PRIMARY_COLOR = '#EC0F8B';

/** Lado máximo al que se reduce el flyer si no pasa el límite de subida.
 *  Lo normal es subir el original: el backend recorta las fotos en resolución completa. */
export const AI_MAX_IMAGE_SIDE = 1600;

export const defaultConfig = (): ShelfSignConfig => ({
  color: DEFAULT_PRIMARY_COLOR,
  showSaveBox: true,
  storeId: '',
  storeName: '',
  qrUrl: null,
  dateFrom: '',
  dateTo: '',
});

/** Datos de ejemplo del botón "demo" y del preview de la plantilla master. */
export const demoProducts = (): ShelfSignProduct[] => [
  {
    id: uid(),
    name: 'BONELESS CHICKEN BREAST',
    details: 'FAMILY PACK',
    name2: '',
    details2: '',
    qty: 1,
    dollars: 2,
    cents: 29,
    unit: 'LB',
    regularPrice: '$2.99 LB',
    save: '70¢ PER LB.',
    conditions: '',
    photo: null,
    photoBox: null,
  },
  {
    id: uid(),
    name: 'RONZONI PASTA',
    details: 'SELECT VARIETIES\n12-16 OZ BOX',
    name2: 'BRUNSWICK SARDINES',
    details2: 'IN SOYBEAN OIL\n3.75 OZ CAN\nMIX & MATCH!',
    qty: 1,
    dollars: 12,
    cents: 99,
    unit: 'EA',
    regularPrice: '$2.29 LB.',
    save: '30¢ PER LB.',
    conditions: '',
    photo: null,
    photoBox: null,
  },
  {
    id: uid(),
    name: 'CAFÉ CARIBE COFFEE',
    details: '10 OZ BRICK PACK',
    name2: 'SUPREMO COFFEE',
    details2: '8 OZ BRICK PACK',
    qty: 3,
    dollars: 10,
    cents: 0,
    unit: 'EA',
    regularPrice: '$4.99 EA',
    save: '$4.97 PER OFFER',
    conditions: 'LIMIT 1 OFFER PER FAMILY',
    photo: null,
    photoBox: null,
  },
  {
    id: uid(),
    name: 'TROPICANA ORANGE JUICE',
    details: '16 FL. OZ. BTL.\nPLUS TAX & DEPOSIT',
    name2: '',
    details2: '',
    qty: 2,
    dollars: 0,
    cents: 95,
    unit: '',
    regularPrice: '4 LB./$25.99',
    save: '$5.00 PER OFFER',
    conditions:
      "WITH CLUB CARD & ADD'L $79 PURCHASE\nLIMIT 4 OFFERS PER FAMILY\nMUST BUY 2",
    photo: null,
    photoBox: null,
  },
];

/** Producto del preview de la plantilla master (el mix & match muestra más partes del layout). */
export const masterPreviewProduct = (): ShelfSignProduct => demoProducts()[1];
