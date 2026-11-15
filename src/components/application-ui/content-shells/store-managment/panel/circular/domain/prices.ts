/** Precios tal como vienen del flyer. Puro. */

/** Precio por unidad desde el string del flyer: "$2.99", "99¢/lb", "2/$5". */
export function parsePriceNum(price?: string | null): number {
  if (!price) return 0;
  const s = String(price);
  const multi = s.match(/(\d+)\s*\/\s*\$?([\d.]+)/);
  if (multi) {
    const n = parseInt(multi[1], 10);
    const t = parseFloat(multi[2]);
    return n > 0 ? t / n : t;
  }
  if (s.includes('¢')) return (parseFloat(s.replace(/[^0-9.]/g, '')) || 0) / 100;
  return parseFloat(s.replace(/[^0-9.]/g, '')) || 0;
}

/** Regular estimado = oferta × 1.25 — misma regla que circular-service. */
export function regularFromPrice(price?: string | null): string | null {
  const unit = parsePriceNum(price);
  return unit > 0 ? `$${(unit * 1.25).toFixed(2)}` : null;
}
