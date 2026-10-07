/**
 * Generación automática de Savings sobre la lista de productos.
 *
 * Funcional real desde fase 1: no depende del backend. Opera sobre el HTML del
 * editor enriquecido, respetando las imágenes pegadas (se saltan, no se tocan).
 *
 * Formato de entrada: bloques de producto separados por línea en blanco. Dentro
 * de cada bloque hay una línea de precio regular (REG…) y una de precio de
 * oferta; el resto son descriptivas y se ignoran.
 *
 *   Savings = (precio unitario regular × cantidad de la oferta) − precio total de la oferta
 */

export const SAVING_PREFIX = 'SAVING';

/** Un precio leído de una línea: "2/$8.00" → { qty: 2, total: 8 }. */
export interface ParsedPrice {
  qty: number;
  total: number;
}

/**
 * Exige el símbolo $. Así "12 PACK 144 FL OZ" o "LIMIT 2 OFFERS PER FAMILY"
 * —que tienen números pero no son precios— no se confunden con una oferta.
 */
export function parsePrice(text: string): ParsedPrice | null {
  if (!text.includes('$')) return null;
  const clean = text.replace(/,(\d{2})\b/g, '.$1');

  // N/$Y — N unidades por $Y
  const multi = clean.match(/(\d+)\s*\/\s*\$\s*(\d+(?:\.\d{1,2})?)/);
  if (multi) {
    const qty = Number(multi[1]);
    const total = Number(multi[2]);
    if (qty > 0 && Number.isFinite(total)) return { qty, total };
  }

  // $X.XX — con o sin sufijo EA/LB/CT…
  const simple = clean.match(/\$\s*(\d+(?:\.\d{1,2})?)/);
  if (simple) {
    const total = Number(simple[1]);
    if (Number.isFinite(total)) return { qty: 1, total };
  }
  return null;
}

/** Línea de precio regular: REG, REGULAR, R o R/ al principio, y con precio. */
export function isRegularLine(text: string): boolean {
  return /^\s*(REG|REGULAR|R\/|R)\b/i.test(text) && text.includes('$');
}

export function isSavingLine(text: string): boolean {
  // Literal de regex a propósito: dentro de un template literal `\b` es el
  // carácter backspace, no un límite de palabra, y la detección nunca matchea.
  return /^\s*SAVING\b/i.test(text);
}

/** Precio unitario del regular: "REG 2/$7.00" → 3.50 */
const unitPrice = (p: ParsedPrice): number => p.total / p.qty;

export const formatSaving = (value: number): string =>
  `${SAVING_PREFIX} $${value.toFixed(2)}`;

/* ── Modelo de líneas ──────────────────────────────────────────────────── */

interface Line {
  /** HTML original de la línea; se reinserta tal cual si no se toca. */
  html: string;
  text: string;
  /** Las imágenes pegadas no participan del cálculo. */
  isImage: boolean;
}

const isBlank = (l: Line): boolean => !l.isImage && l.text.trim() === '';

/**
 * El editor produce un <div> por línea. Un texto plano pegado sin formato
 * también tiene que funcionar, así que se contempla el caso sin elementos.
 */
function toLines(html: string): { lines: Line[]; plainText: boolean } {
  const doc = new DOMParser().parseFromString(html || '', 'text/html');
  const children = Array.from(doc.body.children);

  if (children.length === 0) {
    const text = doc.body.textContent || '';
    return {
      plainText: true,
      lines: text.split('\n').map((t) => ({ html: t, text: t, isImage: false })),
    };
  }

  return {
    plainText: false,
    lines: children.map((el) => ({
      html: el.outerHTML,
      text: el.textContent || '',
      isImage: el.tagName === 'IMG' || !!el.querySelector('img'),
    })),
  };
}

const wrapLine = (text: string, plainText: boolean): string =>
  plainText ? text : `<div>${text}</div>`;

/* ── Generación ────────────────────────────────────────────────────────── */

export interface SavingsResult {
  html: string;
  /** Bloques a los que se les agregó la línea SAVING en esta corrida. */
  added: number;
  /** Bloques salteados por datos incompletos (falta regular, oferta o precio). */
  skipped: number;
  /** Bloques que ya tenían su SAVING de una corrida anterior. */
  untouched: number;
}

/**
 * Recorre la lista y agrega `SAVING $X.XX` debajo de cada línea REG.
 *
 * Incremental por diseño: los bloques que ya tienen SAVING no se recalculan, de
 * modo que apretar el botón dos veces no duplica ni pisa nada. Un bloque
 * incompleto se saltea y nunca corta la generación de los demás.
 */
export function generateSavings(html: string): SavingsResult {
  const { lines, plainText } = toLines(html);

  const out: string[] = [];
  let added = 0;
  let skipped = 0;
  let untouched = 0;

  /** Índices del bloque actual dentro de `lines`. */
  let block: number[] = [];

  const flush = () => {
    if (!block.length) return;

    const texts = block.map((i) => lines[i].text);
    const emit = () => block.forEach((i) => out.push(lines[i].html));

    if (texts.some(isSavingLine)) {
      untouched++;
      emit();
      block = [];
      return;
    }

    const regIdx = texts.findIndex((t, i) => !lines[block[i]].isImage && isRegularLine(t));
    const regPrice = regIdx >= 0 ? parsePrice(texts[regIdx]) : null;

    // Precio de oferta: cualquier otra línea con precio. Se prefiere la más
    // cercana por arriba del regular, que es como llegan las listas del cliente.
    let offerIdx = -1;
    for (let i = 0; i < texts.length; i++) {
      if (i === regIdx || lines[block[i]].isImage) continue;
      if (!parsePrice(texts[i])) continue;
      if (i < regIdx) offerIdx = i;
      else if (offerIdx === -1) offerIdx = i;
    }
    const offerPrice = offerIdx >= 0 ? parsePrice(texts[offerIdx]) : null;

    if (!regPrice || !offerPrice) {
      skipped++;
      emit();
      block = [];
      return;
    }

    const saving = unitPrice(regPrice) * offerPrice.qty - offerPrice.total;
    // Un saving no positivo es dato mal cargado: se saltea igual que un bloque
    // incompleto, en vez de imprimir "SAVING $0.00" en el flyer.
    if (!(saving > 0)) {
      skipped++;
      emit();
      block = [];
      return;
    }

    block.forEach((lineIdx, i) => {
      out.push(lines[lineIdx].html);
      if (i === regIdx) out.push(wrapLine(formatSaving(saving), plainText));
    });
    added++;
    block = [];
  };

  for (let i = 0; i < lines.length; i++) {
    if (isBlank(lines[i])) {
      flush();
      out.push(lines[i].html);
    } else {
      block.push(i);
    }
  }
  flush();

  return { html: out.join(plainText ? '\n' : ''), added, skipped, untouched };
}

/** Cuántos bloques quedarían pendientes — para habilitar o no el botón. */
export function countPendingBlocks(html: string): number {
  const { lines } = toLines(html);
  let pending = 0;
  let block: number[] = [];

  const flush = () => {
    if (!block.length) return;
    const texts = block.map((i) => lines[i].text);
    if (!texts.some(isSavingLine)) {
      const regIdx = texts.findIndex(isRegularLine);
      const hasOffer = texts.some((t, i) => i !== regIdx && !!parsePrice(t));
      if (regIdx >= 0 && hasOffer) pending++;
    }
    block = [];
  };

  for (let i = 0; i < lines.length; i++) {
    if (isBlank(lines[i])) flush();
    else block.push(i);
  }
  flush();
  return pending;
}
