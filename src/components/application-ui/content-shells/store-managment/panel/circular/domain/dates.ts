/** Rangos de fechas "YYYY-MM-DD" (se comparan como texto: el formato ordena igual). */

/** Las dos fechas puestas y el fin no antes del inicio. */
export const validRange = (start?: string, end?: string) => !!start && !!end && end >= start;

/** Las dos fechas puestas y el fin antes del inicio (vacío no es error todavía). */
export const isBadRange = (start?: string, end?: string) => !!start && !!end && end < start;
