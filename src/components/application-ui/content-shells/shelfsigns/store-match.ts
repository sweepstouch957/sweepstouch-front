/**
 * Empareja lo que dice el flyer con una tienda del catálogo.
 *
 * Lo que Gemini lee del papel ("KEY FOOD", "1234 Main St") casi nunca es igual
 * al nombre registrado ("Key Food Paterson #12"), así que comparar strings
 * enteros no sirve: se comparan palabras.
 *
 * Deliberadamente conservador. Preseleccionar la tienda equivocada es peor que
 * no preseleccionar nada: el cartón saldría con el QR de otra tienda y nadie lo
 * nota hasta que está impreso en góndola. Por eso pide un mínimo de evidencia y
 * ante un empate no elige.
 */
import type { Store } from '@/services/store.service';

export interface StoreHint {
  name: string;
  address: string;
  city: string;
  state: string;
}

/** Palabras que aparecen en casi todos los nombres y no distinguen nada. */
const STOP_WORDS = new Set([
  'supermarket',
  'supermarkets',
  'market',
  'store',
  'food',
  'foods',
  'grocery',
  'the',
  'de',
  'la',
  'el',
  'inc',
  'llc',
  'corp',
  'st',
  'street',
  'ave',
  'avenue',
  'rd',
  'road',
  'blvd',
]);

function tokens(text: string): string[] {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
}

/** Cuántas palabras del flyer aparecen en la tienda. */
function overlap(a: string[], b: Set<string>): number {
  return a.reduce((n, word) => n + (b.has(word) ? 1 : 0), 0);
}

/**
 * Devuelve la mejor tienda para el hint, o null si no hay evidencia suficiente.
 *
 * El nombre pesa el doble que la dirección: dos sucursales de la misma cadena
 * comparten nombre pero no calle, y dos tiendas distintas pueden estar en calles
 * con el mismo número.
 */
export function matchStoreByHint(hint: StoreHint | null, stores: Store[]): Store | null {
  if (!hint || !stores.length) return null;

  const nameWords = tokens(hint.name);
  const placeWords = tokens([hint.address, hint.city, hint.state].filter(Boolean).join(' '));
  if (!nameWords.length && !placeWords.length) return null;

  let best: Store | null = null;
  let bestScore = 0;
  let tied = false;

  for (const store of stores) {
    const storeWords = new Set([
      ...tokens(store.name),
      ...tokens((store as any).address || ''),
      ...tokens((store as any).city || ''),
    ]);
    if (!storeWords.size) continue;

    const score = overlap(nameWords, storeWords) * 2 + overlap(placeWords, storeWords);

    if (score > bestScore) {
      bestScore = score;
      best = store;
      tied = false;
    } else if (score === bestScore && score > 0) {
      tied = true;
    }
  }

  // Una sola palabra coincidente (score 2 por nombre) es lo mínimo aceptable, y
  // un empate significa que el flyer no distingue entre sucursales: mejor que
  // el diseñador elija.
  if (!best || bestScore < 2 || tied) return null;
  return best;
}
