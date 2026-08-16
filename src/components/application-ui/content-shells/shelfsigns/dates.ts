/**
 * Fechas: del date picker (ISO yyyy-mm-dd) al formato del cartón.
 *   "2026-04-17" → "FRI. APRIL 17TH"
 *   "2026-04-20" → "MON. APRIL 20TH, 2026"   (el año sólo en la fecha final)
 *
 * El día va a 2 dígitos y el ordinal en inglés (ST/ND/RD/TH). Se construye a
 * mano y no con date-fns porque el formato del cartón no es el de ninguna
 * locale: mes abreviado con punto salvo los cortos, día con cero a la izquierda
 * y ordinal en mayúsculas.
 */

const DAY_ABBR = ['SUN.', 'MON.', 'TUE.', 'WED.', 'THU.', 'FRI.', 'SAT.'];

const MONTH_ABBR = [
  'JAN.', 'FEB.', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUG.', 'SEPT.', 'OCT.', 'NOV.', 'DEC.',
];

export function ordinal(day: number): string {
  const teens = day % 100;
  if (teens >= 11 && teens <= 13) return 'TH';
  switch (day % 10) {
    case 1: return 'ST';
    case 2: return 'ND';
    case 3: return 'RD';
    default: return 'TH';
  }
}

/**
 * @param iso      fecha yyyy-mm-dd del input nativo
 * @param withYear agrega ", 2026" — sólo se usa en la fecha "hasta"
 */
export function fmtOfferDate(iso: string, withYear = false): string {
  if (!iso) return '';
  // Mediodía local: con "T00:00:00" un huso al oeste de UTC podía retroceder un día.
  const dt = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(dt.getTime())) return iso;

  const dd = String(dt.getDate()).padStart(2, '0');
  const year = withYear ? `, ${dt.getFullYear()}` : '';
  return `${DAY_ABBR[dt.getDay()]} ${MONTH_ABBR[dt.getMonth()]} ${dd}${ordinal(dt.getDate())}${year}`;
}
