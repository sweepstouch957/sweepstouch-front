/** Helpers puros del bloque "Subir el circular" (también los usa el circular de la semana). */

// Lo que se extrae solo al traer/agendar con archivo: TODOS los productos, por secciones.
// Antes eran los 20 de foto grande y la lista quedaba a medias; lo importante es que esté todo.
export const AUTO_EXTRACT = 0;
export const HISTORY_PREVIEW = 4;

export type ScheduleValues = {
  title: string;
  start: string;
  end: string;
  /** Varios archivos = páginas (página 1, página 2…) de un solo circular. */
  files: File[];
  guidance: string;
  referenceImages: string[];
};

/** El circular que estorba en esas fechas (el backend contesta 409 con esto). */
export type OverlapInfo = { title: string; startDate: string; endDate: string };

/** Hoy y hoy + 7 días en YYYY-MM-DD (hora local del navegador). */
export function defaultRange() {
  const iso = (d: Date) =>
    new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const today = new Date();
  const week = new Date(today.getTime() + 7 * 86400000);
  return { start: iso(today), end: iso(week) };
}

/** Valores iniciales del formulario: por defecto hoy → hoy + 7 días (el circular de esta semana). */
export function scheduleDefaults(): ScheduleValues {
  const { start, end } = defaultRange();
  return { title: '', start, end, files: [], guidance: '', referenceImages: [] };
}

export const isBadRange = (start?: string, end?: string) => !!start && !!end && end < start;

export const mb = (bytes: number) => `${(bytes / 1048576).toFixed(1)} MB`;

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

/** Páginas sueltas en orden natural por nombre (pagina-2 antes que pagina-10). */
export const sortFilesByName = (files: File[]) =>
  [...files].sort((a, b) => collator.compare(a.name, b.name));

/** El link de circularss a veces viene sin protocolo. */
export const externalUrl = (url: string) => (/^https?:\/\//i.test(url) ? url : `https://${url}`);
