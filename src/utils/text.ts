/** Sin acentos ni mayúsculas: "campana" encuentra "Campañas". */
export const norm = (s: unknown) =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

/**
 * Búsqueda de texto del panel: no distingue acentos ni mayúsculas y aguanta nulos.
 * Reemplaza a `x.toLowerCase().includes(q)`, con el que "pena" no encontraba "Peña"
 * ni "jose" a "José".
 */
export const textHas = (haystack: unknown, needle: unknown) => norm(haystack).includes(norm(needle));
