export { OPEN_STATUSES } from './matrix-model';

/** Meta de cada estado de la orden: etiqueta en español y color del chip. */
export const STATUS_META: Record<
  string,
  { label: string; color: 'default' | 'warning' | 'info' | 'success' | 'error' | 'secondary' }
> = {
  awaiting_payment: { label: 'Sin pagar', color: 'warning' },
  paid: { label: 'Pagada', color: 'info' },
  preparing: { label: 'Preparando', color: 'secondary' },
  ready: { label: 'Lista', color: 'success' },
  completed: { label: 'Entregada', color: 'default' },
  cancelled: { label: 'Cancelada', color: 'error' },
  list_pending: { label: 'Vigente', color: 'warning' },
  list_validated: { label: 'Validada', color: 'success' },
  list_expired: { label: 'Vencida', color: 'default' },
};

/**
 * Estado del cobro en español. El backend manda el enum de Stripe
 * ("requires_confirmation"), que en pantalla se leía como un error de sistema.
 */
export const PAYMENT_META: Record<
  string,
  { label: string; tone: 'ok' | 'warn' | 'bad' | 'muted' }
> = {
  requires_confirmation: { label: 'Sin cobrar', tone: 'warn' },
  processing: { label: 'Procesando', tone: 'muted' },
  succeeded: { label: 'Pagado', tone: 'ok' },
  failed: { label: 'Pago rechazado', tone: 'bad' },
  refunded: { label: 'Reembolsada', tone: 'muted' },
  partially_refunded: { label: 'Reembolso parcial', tone: 'muted' },
};

export function paymentMeta(status: string) {
  return PAYMENT_META[status] || { label: status || '—', tone: 'muted' as const };
}

/**
 * El nombre de la tienda trae la dirección pegada ("Super Supermarket 31 Memorial
 * Dr, Paterson, NJ 07505"). Se parte en el número de la calle para poder darle
 * jerarquía: nombre grande, dirección chica. Sin número, se deja tal cual.
 */
export function splitStoreTitle(name: string): { title: string; address: string } {
  const m = String(name || '').match(/^(.*?)[,\s]+(\d+\s.*)$/);
  return m && m[1].trim()
    ? { title: m[1].trim(), address: m[2].trim() }
    : { title: name || '—', address: '' };
}

const statusOptions = (keys: string[]) => [
  { value: 'all', label: 'Todos los estados' },
  ...keys.map((value) => ({ value, label: STATUS_META[value].label })),
];

export const STATUS_OPTIONS = statusOptions(
  Object.keys(STATUS_META).filter((k) => !k.startsWith('list_'))
);
export const LIST_STATUS_OPTIONS = statusOptions([
  'list_pending',
  'list_validated',
  'list_expired',
]);

export function statusMeta(status: string) {
  return STATUS_META[status] || { label: status, color: 'default' as const };
}

/** (555) 555-5555 a partir del E.164 que manda el backend. */
export function prettyPhone(e164: string): string {
  const d = String(e164 || '').replace(/\D/g, '');
  const n = d.length === 11 && d.startsWith('1') ? d.slice(1) : d;
  if (n.length !== 10) return e164 || '—';
  return `(${n.slice(0, 3)}) ${n.slice(3, 6)}-${n.slice(6)}`;
}

export function timeShort(iso?: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/New_York',
  });
}

/** Suma días a un YYYY-MM-DD sin pasar por la zona horaria del navegador. */
export function shiftYmd(ymd: string, days: number): string {
  const d = new Date(`${ymd}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** "Sep 24 · 9:00 AM" — para cuando el rango abarca más de un día. */
export function dateTimeShort(iso?: string | null): string {
  if (!iso) return '—';
  const day = new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'America/New_York',
  });
  return `${day} · ${timeShort(iso)}`;
}
