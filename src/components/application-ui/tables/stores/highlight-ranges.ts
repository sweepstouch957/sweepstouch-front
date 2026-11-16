/** Dónde marcar una búsqueda en un texto, ignorando acentos y mayúsculas. Puro. */
const fold = (c: string) => c.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Rangos [inicio, fin) del texto donde aparece alguna palabra de la búsqueda. */
export function highlightRanges(text: string, query: string): [number, number][] {
  const tokens = fold(query)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 2);
  if (!text || !tokens.length) return [];
  // Un carácter del texto → un carácter "plegado": los índices coinciden 1 a 1.
  const folded = Array.from(text, (c) => fold(c)[0] ?? c).join('');
  const ranges: [number, number][] = [];
  for (const t of tokens) {
    for (let i = folded.indexOf(t); i !== -1; i = folded.indexOf(t, i + t.length)) {
      ranges.push([i, i + t.length]);
    }
  }
  ranges.sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const r of ranges) {
    const last = merged[merged.length - 1];
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
    else merged.push([...r]);
  }
  return merged;
}
