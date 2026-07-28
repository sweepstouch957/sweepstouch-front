export function pct(n: number) {
  if (!Number.isFinite(n)) return '0%';
  const v = Math.round(n * 10) / 10;
  return `${v}%`;
}

// Intl instance allocated once at module scope (literal locale, no options)
const enUsNumberFmt = new Intl.NumberFormat('en-US');

export function num(n: number) {
  return enUsNumberFmt.format(Math.round(n || 0));
}
