/**
 * Normalización de lo que llega de la IA y del textarea manual.
 *
 * La revisión humana es obligatoria por diseño, pero cuanto más limpio llegue
 * el dato al editor, menos correcciones hace el diseñador.
 */
import {
  clampCents,
  clampDollars,
  clampFreeOffer,
  clampQty,
  clampUnit,
  computeSave,
} from './price';
import type { FreeOffer, PhotoBox, ShelfSignProduct } from './types';

export const uid = (): string => Math.random().toString(36).slice(2, 9);

const asText = (v: unknown): string => (typeof v === 'string' ? v : '');

function normalizePhotoBox(raw: any): PhotoBox | null {
  if (!raw || typeof raw !== 'object') return null;
  const x = Number(raw.x);
  const y = Number(raw.y);
  const w = Number(raw.w);
  const h = Number(raw.h);
  if ([x, y, w, h].some((n) => !Number.isFinite(n))) return null;
  if (w <= 0 || h <= 0) return null;
  return { x, y, w, h };
}

/**
 * JSON crudo del modelo → productos del editor.
 *
 * El `priceType` que devuelve la IA se descarta a propósito: el formato se
 * deriva de qty/dollars/cents en `price.ts`, así que una mala clasificación del
 * modelo no llega al cartón.
 */
export function toProducts(raw: unknown[] | undefined): ShelfSignProduct[] {
  return (raw || [])
    .map((item: any): ShelfSignProduct => ({
      id: uid(),
      name: asText(item?.name),
      details: asText(item?.details),
      name2: asText(item?.name2),
      details2: asText(item?.details2),
      extras: toExtras(item),
      qty: clampQty(item?.qty),
      dollars: clampDollars(item?.dollars),
      cents: clampCents(item?.cents),
      unit: clampUnit(item?.unit),
      regularPrice: asText(item?.regularPrice),
      save: asText(item?.save),
      conditions: asText(item?.conditions),
      freeOffer: clampFreeOffer(item?.freeOffer) || undefined,
      photo: null,
      photoBox: normalizePhotoBox(item?.photoBox),
    }))
    .map(detectFreeOffer)
    .map(withComputedSave)
    .map(dropVipLabels)
    .map(dedupeShared);
}

/**
 * Palabras que puede tener una etiqueta de VIP y nada más. Si la línea entera
 * sale de acá y menciona VIP, es la etiqueta; si trae cualquier otra palabra
 * ("WITH VIP CARD", "LIMIT 2 PER VIP CUSTOMER") dice algo más y se queda.
 */
const VIP_WORDS = new Set([
  'vip',
  'customer',
  'customers',
  'cliente',
  'clientes',
  'member',
  'members',
  'socio',
  'socios',
  'only',
  'price',
  'precio',
  'solo',
  'sólo',
  'para',
  'for',
]);

/**
 * Frases del aviso de pie del flyer: "para obtener estos precios debes ser
 * cliente VIP y mostrar este anuncio al cajero".
 *
 * Es de la página entera, no de una oferta, pero la lectura lo encuentra abajo
 * de todo y se lo reparte a TODOS los cartones. Además sobra: el cartón ya lleva
 * la franja VIP con el QR para hacerse socio.
 *
 * Son frases largas y concretas a propósito. Una condición real de producto
 * ("LIMIT 2 PER FAMILY", "WITH CLUB CARD") no se parece a ninguna.
 */
const PAGE_DISCLAIMER = [
  /\bshow\s+th(?:is|e)\s+ad\b/i,
  /\bmostrar\s+este\s+anuncio\b/i,
  /\bin\s+order\s+to\s+get\s+these\s+prices\b/i,
  /\bpara\s+obtener\s+estos\s+precios\b/i,
  /\bmust\s+be\s+(?:an?\s+)?vip\b/i,
  /\bdebes?\s+ser\s+(?:un\s+)?cliente\s+vip\b/i,
];

/**
 * Carteles de servicio del local, no condiciones de una oferta: "FREE TAXI",
 * "FREE DELIVERY", "WE ACCEPT EBT", "PARTICIPATE FOR FREE" del sorteo.
 *
 * Viven en la cenefa de arriba o en la banda de abajo del flyer, lejos de
 * cualquier producto, pero la lectura los encuentra y se los cuelga a un cartón
 * cualquiera. Que digan FREE no los hace una oferta: se descartan por lo que
 * acompaña a esa palabra, nunca por la palabra sola —si no, caerían "LACTOSE
 * FREE MILK", "GLUTEN FREE" y "SUGAR FREE", que sí son del producto.
 */
const SERVICE_BANNER = [
  /\bfree\s+(?:delivery|taxi|parking|shipping|wi-?fi)\b/i,
  /\b(?:delivery|taxi|estacionamiento|env[ií]o|entrega)\s+gratis\b/i,
  /\bparticipate\s+for\s+free\b/i,
  /\bparticipa\s+gratis\b/i,
  /\bwe\s+accept\b/i,
  /\baceptamos\b/i,
];

function isPageDisclaimer(line: string): boolean {
  if (PAGE_DISCLAIMER.some((re) => re.test(line))) return true;
  if (SERVICE_BANNER.some((re) => re.test(line))) return true;
  // "...VIP CUSTOMER ... TO THE CASHIER": las dos juntas sólo pasan en el aviso.
  return /\bvip\b/i.test(line) && /\b(?:cashier|cajero)\b/i.test(line);
}

function isVipLabel(line: string): boolean {
  const words = line
    .toLowerCase()
    .replace(/[^a-záéíóúüñ]+/g, ' ')
    .split(' ')
    .filter(Boolean);
  return words.includes('vip') && words.every((w) => VIP_WORDS.has(w));
}

/**
 * Saca del texto del cartón lo que es del flyer y no del producto: la etiqueta
 * "VIP CUSTOMER ONLY" y el aviso de pie de página.
 *
 * El cartón ya lleva la franja VIP abajo, con el logo y el QR para hacerse
 * socio: repetirlo bajo el nombre del producto no agrega nada y le come una
 * línea. Algunos flyers lo imprimen y la IA lo trae como condición o como
 * detalle, así que se limpia de los dos lados.
 *
 * Se hace al normalizar y no al dibujar: lo que el diseñador ve en el editor es
 * lo que se imprime, y si alguna vez hace falta ponerlo, se escribe a mano.
 */
export function dropVipLabels(p: ShelfSignProduct): ShelfSignProduct {
  const clean = (text: string) =>
    (text || '')
      .split('\n')
      .filter((l) => !isVipLabel(l) && !isPageDisclaimer(l))
      .join('\n');

  return {
    ...p,
    details: clean(p.details),
    details2: clean(p.details2),
    conditions: clean(p.conditions),
    extras: p.extras?.map((e) => ({ ...e, details: clean(e.details) })),
  };
}


/* ── Ofertas sin precio (BOGO / gratis) ───────────────────────────────────── */

/** "BUY 1 GET 2 FREE", "BUY ONE GET ONE FREE", "BUY 1, GET 1 FREE". */
const BOGO = /\bBUY\s+(\d+|ONE|TWO|THREE)\b[\s,.-]*\bGET\s+(\d+|ONE|TWO|THREE)\s+FREE\b/i;

/** Una línea que no dice más que "FREE". */
const JUST_FREE = /^FREE[!.]?$/i;

const WORD_NUMBER: Record<string, number> = { one: 1, two: 2, three: 3 };

const toCount = (token: string): number => {
  const word = WORD_NUMBER[token.toLowerCase()];
  if (word) return word;
  const n = Math.floor(Number(token));
  return Number.isFinite(n) && n > 0 ? n : 0;
};

/**
 * Reconoce un BOGO en lo que leyó la IA y lo saca del texto.
 *
 * Un flyer de BOGO no imprime precio, así que la extracción devuelve dólares y
 * centavos en cero y el cartón salía con **0¢** — un precio que no existe, en
 * góndola, al lado de un producto que en realidad es dos por uno.
 *
 * Sólo se mira cuando NO hay precio: "BUY 1 GET 1 FREE" escrito al pie de una
 * oferta de $3.99 es una condición, no el precio, y ahí se deja donde está.
 *
 * La línea reconocida se saca del detalle porque pasa a imprimirse en grande en
 * el bloque de precio; "WITH CLUB CARD" o "LIMIT 4 OFFERS PER FAMILY" se quedan,
 * que es lo que el cliente necesita leer al lado del nombre.
 */
export function detectFreeOffer(p: ShelfSignProduct): ShelfSignProduct {
  if (p.freeOffer) return p;
  if (clampDollars(p.dollars) > 0 || clampCents(p.cents) > 0) return p;

  let found: FreeOffer | null = null;

  const scan = (text: string): string =>
    (text || '')
      .split('\n')
      .filter((line) => {
        const clean = line.trim();
        if (!clean) return true;

        const bogo = clean.match(BOGO);
        if (bogo) {
          const buy = toCount(bogo[1]);
          const free = toCount(bogo[2]);
          if (free > 0) {
            found = found || { buy, free };
            // Sólo se saca si la línea es la oferta y nada más.
            return clean.replace(BOGO, '').replace(/[\s,.!-]/g, '') !== '';
          }
        }

        if (JUST_FREE.test(clean)) {
          found = found || { buy: 0, free: 1 };
          return false;
        }

        return true;
      })
      .join('\n');

  const next: ShelfSignProduct = {
    ...p,
    details: scan(p.details),
    details2: scan(p.details2),
    conditions: scan(p.conditions),
  };

  return found ? { ...next, freeOffer: found } : p;
}

/** Tope de referencias por cartón: 1 principal + 4 alternativas. */
export const MAX_PRODUCTS_PER_SIGN = 5;

/**
 * Productos 3-5 del JSON crudo.
 *
 * Hoy el prompt sólo pide name/name2, así que casi siempre esto viene vacío y
 * los extras los agrega el diseñador a mano. Se leen igual las dos formas en
 * que un modelo los devolvería (`extras: []` o `name3`/`details3`…) para que el
 * día que el prompt los pida no haya que tocar el parseo.
 */
function toExtras(item: any): { name: string; details: string }[] {
  const out: { name: string; details: string }[] = [];

  if (Array.isArray(item?.extras)) {
    for (const e of item.extras) {
      const name = asText(e?.name);
      if (name) out.push({ name, details: asText(e?.details) });
    }
  }

  for (let n = 3; n <= MAX_PRODUCTS_PER_SIGN; n++) {
    const name = asText(item?.[`name${n}`]);
    if (name) out.push({ name, details: asText(item?.[`details${n}`]) });
  }

  return out.slice(0, MAX_PRODUCTS_PER_SIGN - 2);
}

/**
 * Rellena "Save" cuando el flyer traía el regular price pero no el ahorro.
 *
 * Sólo cuando está vacío: si el flyer imprime su propio texto de ahorro, ese
 * gana — es el que el cliente va a comparar contra la góndola. Y si no hay
 * regular price no se inventa nada.
 */
function withComputedSave(p: ShelfSignProduct): ShelfSignProduct {
  if (p.save.trim()) return p;
  const save = computeSave(p);
  return save ? { ...p, save } : p;
}

/**
 * Atributos compartidos ("MINIMUM 1 LB", "LIMIT 1 OFFER PER FAMILY") repetidos
 * en details, details2 y conditions: quedan UNA sola vez, en conditions.
 *
 * Se aplica siempre post-extracción — en un mix & match el modelo tiende a
 * repetir la condición bajo cada producto y el cartón queda con la misma línea
 * tres veces.
 */
export function dedupeShared(p: ShelfSignProduct): ShelfSignProduct {
  const norm = (l: string) => l.trim().toUpperCase();
  const lines = (t: string) => (t || '').split('\n').map((x) => x.trim()).filter(Boolean);
  const uniq = (arr: string[]) =>
    arr.filter((l, i) => arr.findIndex((x) => norm(x) === norm(l)) === i);

  let d1 = uniq(lines(p.details));
  let d2 = uniq(lines(p.details2));
  const cond = uniq(lines(p.conditions));

  if (p.name2) {
    const shared = d1.filter((l) => d2.some((x) => norm(x) === norm(l)));
    if (shared.length) {
      d1 = d1.filter((l) => !shared.some((x) => norm(x) === norm(l)));
      d2 = d2.filter((l) => !shared.some((x) => norm(x) === norm(l)));
      shared.forEach((l) => {
        if (!cond.some((x) => norm(x) === norm(l))) cond.push(l);
      });
    }
  }

  d1 = d1.filter((l) => !cond.some((x) => norm(x) === norm(l)));
  d2 = d2.filter((l) => !cond.some((x) => norm(x) === norm(l)));

  return { ...p, details: d1.join('\n'), details2: d2.join('\n'), conditions: cond.join('\n') };
}

/**
 * Una línea de texto libre → un cartón.
 * Reconoce: "JUMBO WHITE EGGS 3/$5" · "POLLO $2.29 LB" · "JUGO 2/95¢" · "49¢"
 */
export function parseManualLine(line: string): ShelfSignProduct | null {
  const t = line.trim();
  if (!t) return null;

  let qty = 1;
  let dollars = 0;
  let cents = 0;
  let rest = t;
  let m: RegExpMatchArray | null;

  if (/¢/.test(t)) {
    const multi = t.match(/(\d+)\s*\/\s*(\d+)\s*¢/);
    if (multi) {
      qty = Math.max(1, Number(multi[1]));
      cents = Number(multi[2]);
      rest = t.replace(multi[0], ' ');
    } else if ((m = t.match(/(\d+)\s*¢/))) {
      cents = Number(m[1]);
      rest = t.replace(m[0], ' ');
    }
  } else if ((m = t.match(/(\d+)\s*\/\s*\$?\s*(\d+)(?:[.,](\d{1,2}))?/))) {
    qty = Math.max(1, Number(m[1]));
    dollars = Number(m[2]);
    cents = m[3] ? Number(m[3].padEnd(2, '0')) : 0;
    rest = t.replace(m[0], ' ');
  } else if ((m = t.match(/\$\s*(\d+)(?:[.,](\d{1,2}))?/))) {
    dollars = Number(m[1]);
    cents = m[2] ? Number(m[2].padEnd(2, '0')) : 0;
    rest = t.replace(m[0], ' ');
  }

  const unitMatch = rest.match(/\b(LB|EA)\b/i);
  const unit = unitMatch ? (unitMatch[1].toUpperCase() as 'LB' | 'EA') : '';
  if (unitMatch) rest = rest.replace(unitMatch[0], ' ');

  const name =
    rest
      .replace(/[|;,\-]+\s*$/, '')
      .replace(/^\s*[|;,\-]+/, '')
      .replace(/\s{2,}/g, ' ')
      .trim()
      .toUpperCase() || 'PRODUCTO';

  return {
    id: uid(),
    name,
    details: '',
    name2: '',
    details2: '',
    qty: clampQty(qty),
    dollars: clampDollars(dollars),
    cents: clampCents(cents),
    unit,
    regularPrice: '',
    save: '',
    conditions: '',
    photo: null,
    photoBox: null,
  };
}
