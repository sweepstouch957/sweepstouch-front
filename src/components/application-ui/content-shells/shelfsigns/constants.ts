/**
 * Constantes del módulo Shelfsigns: prompt de extracción, datos demo y valores
 * por defecto de la plantilla master.
 */
import { uid } from './parse';
import type { ShelfSignConfig, ShelfSignProduct } from './types';

/** Logos oficiales. Arte de marca: NO se recolorean con el color primario. */
export const VIP_LOGO_SRC = '/shelfsigns/vip-customer.png';
export const POWERED_BY_LOGO_SRC = '/shelfsigns/powered-by-sweepstouch.png';

/** Rosa Sweepstouch. Editable por el diseñador en el paso 1. */
export const DEFAULT_PRIMARY_COLOR = '#EC0F8B';

/** Lado máximo al que se reduce el flyer antes de mandarlo al modelo.
 *  Los recortes finales se hacen sobre la imagen original, en resolución completa. */
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

/**
 * Prompt de extracción. Validado contra /ai/chat con `model: 'claude'`: la
 * respuesta llega sin preámbulo, sin fences y con JSON.parse directo, así que
 * NO hay que endurecerlo. Si algún día se toca, revalidar esas tres cosas.
 *
 * El `priceType` que pide el esquema se descarta al normalizar (el formato se
 * deriva de los valores), pero se deja en el prompt: obliga al modelo a razonar
 * el tipo de precio antes de completar qty/dollars/cents, y sin él clasifica
 * peor los casos de centavos.
 */
export const EXTRACT_PROMPT = `Analiza esta imagen de un flyer de supermercado y extrae TODOS los productos con sus precios y la ubicación de su FOTO.

Responde ÚNICAMENTE con JSON válido, sin markdown, sin backticks, sin texto adicional. Esquema:
{"products":[{
 "name":"NOMBRE PRODUCTO 1 EN MAYÚSCULAS",
 "details":"detalles/volúmenes del producto 1 separados por \\n (ej: 10 OZ BRICK PACK)",
 "name2":"nombre del producto 2 SOLO si la promo es combinada tipo OR / MIX & MATCH; SIN la palabra OR; cadena vacía si no aplica",
 "details2":"detalles/volúmenes del producto 2 separados por \\n; vacía si no aplica",
 "priceType":"simple|multi|cents",
 "qty":numero,
 "dollars":numero entero,
 "cents":numero entero,
 "unit":"LB"|"EA"|"",
 "regularPrice":"ej $2.99 LB",
 "save":"ej 70¢ PER LB",
 "conditions":"LIMIT, MUST BUY, WITH CLUB CARD... separadas por \\n; vacía si no hay",
 "photoBox":{"x":num,"y":num,"w":num,"h":num} o null
}]}

Reglas:
- priceType "simple": $2.29 LB o $12.99 EA. "multi": 4/$15.99 (qty=4, dollars=15, cents=99). "cents": 2/95¢ o 49¢ LB (dollars=0).
- unit: SOLO si la unidad (LB/EA) aparece impresa JUNTO al precio de oferta grande. Si la promo es tipo "5/$10" sin unidad visible, unit="" aunque el regular price diga EA o LB. NUNCA deduzcas la unidad del regular price.
- "qty" SIEMPRE es 1, salvo en promos múltiples: 4/$15.99 => qty 4; 2/95¢ => qty 2.
- En "multi", unit va VACÍA ("") salvo que la unidad aparezca EXPLÍCITA junto al precio de oferta (ej "4/$15.99 LB"). NUNCA infieras la unidad desde el regular price: "3/$5" es unit vacía aunque el regular price diga $2.99 EA.
- Cada detalle/volumen va con SU producto: details con name, details2 con name2. NUNCA mezcles los volúmenes de ambos.
- Si un atributo aplica a AMBOS productos por igual (ej "MINIMUM 1 LB", "LIMIT 1 OFFER PER FAMILY"), va UNA SOLA vez en "conditions" y NO se repite en details ni details2.
- photoBox: recorte de la FOTO del producto dentro del flyer, en PORCENTAJES 0-100 relativos al ancho y alto totales de la imagen (x,y = esquina superior izquierda del recorte; w,h = ancho y alto). Sé preciso y ajustado a la foto, sin incluir textos ni precios. Si el producto no tiene foto, usa null.
- Extrae también produce y grocery si existen.
- Devuelve el JSON MINIFICADO en UNA sola línea, sin espacios innecesarios ni saltos de línea, para aprovechar el espacio de respuesta.`;

/**
 * Sufijo para "Continuar análisis": el flyer entero no siempre entra en una
 * respuesta porque `max_tokens` lo fija AIConfig en el backend y no se puede
 * pasar por request (ver deuda técnica, fase 2).
 */
export const continuePromptSuffix = (extractedNames: string[]): string =>
  `\n\nIMPORTANTE: Estos productos YA fueron extraídos, NO los repitas: ${extractedNames.join(
    '; '
  )}. Devuelve SOLO los productos RESTANTES del flyer, mismo esquema JSON.`;

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
