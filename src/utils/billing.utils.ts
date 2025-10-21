// components/billing/billing-page.utils.ts
import { format } from 'date-fns';

export function toYYYYMMDD(d: Date | null | undefined) {
  if (!d) return undefined;
  return format(d, 'yyyy-MM-dd');
}

export function toYYYYMM(d: Date | null | undefined) {
  if (!d) return undefined;
  return format(d, 'yyyy-MM');
}

export function startOfWeekMon(d: Date) {
  const date = new Date(d);
  const day = date.getDay(); // 0=Sun..6=Sat
  const diff = (day + 6) % 7;
  date.setDate(date.getDate() - diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

export const usd = (n: number | undefined) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n ?? 0);

// Preferimos los totales de `range`; si no hay, usamos los de `byMonth`.
export function pickTotalsForUI(
  rangeTotals?: { sms?: number; mms?: number; storesFee?: number; grandTotal?: number },
  monthTotals?: { sms?: number; mms?: number; storesFee?: number; grandTotal?: number }
) {
  const src = rangeTotals ?? monthTotals ?? { sms: 0, mms: 0, storesFee: 0, grandTotal: 0 };
  const sms = src.sms ?? 0;
  const mms = src.mms ?? 0;
  return {
    sms,
    mms,
    campaignsTotal: sms + mms,
    storesFee: src.storesFee ?? 0,
    grandTotal: src.grandTotal ?? sms + mms + (src.storesFee ?? 0),
  };
}
