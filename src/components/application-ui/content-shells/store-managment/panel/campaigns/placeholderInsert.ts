/**
 * Inserta un placeholder (#name, #linktree…) en el texto del mensaje sin sembrar espacios.
 * Antes el chip insertaba " #name " siempre: al tocar dos seguidos quedaban dobles espacios,
 * y cada espacio de más es un carácter pagado en el SMS.
 *
 * Sólo pone el espacio que HACE FALTA para que el placeholder no se pegue a una palabra:
 *  · antes, si el carácter anterior no es espacio/salto (y no es el inicio);
 *  · después, si el siguiente es una letra/número o "#" (otro placeholder).
 * Pegado a puntuación ("#name," / "¡#name!") queda pegado, que es como se escribe.
 */
export function smartInsert(text: string, start: number, end: number, token: string) {
  const before = text.slice(0, start);
  const after = text.slice(end);
  const prev = before.slice(-1);
  const next = after.slice(0, 1);
  const padBefore = prev !== '' && !/\s/.test(prev) && !/[¡¿("'“]/.test(prev) ? ' ' : '';
  const padAfter = /[\p{L}\p{N}#]/u.test(next) ? ' ' : '';
  const inserted = padBefore + token + padAfter;
  return { text: before + inserted + after, caret: before.length + padBefore.length + token.length };
}
