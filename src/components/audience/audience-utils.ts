export function pct(n: number) {
  if (!Number.isFinite(n)) return '0%';
  const v = Math.round(n * 10) / 10;
  return `${v}%`;
}

export function num(n: number) {
  return new Intl.NumberFormat('en-US').format(Math.round(n || 0));
}
