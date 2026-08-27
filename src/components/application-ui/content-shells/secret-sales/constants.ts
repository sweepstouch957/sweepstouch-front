import type { SemanticRole } from '@/theme/semantic';
import type { SecretSale } from '@/services/secret-sale.service';

export type SaleStatus = 'active' | 'scheduled' | 'expired' | 'paused';

/**
 * El estado no se guarda: se deriva de las fechas. Guardarlo obligaría a un cron
 * que lo actualice y a que alguien se acuerde de mirarlo — la fecha ya lo dice.
 */
export function saleStatus(sale: SecretSale, now = new Date()): SaleStatus {
  if (!sale.isActive) return 'paused';
  if (new Date(sale.endDate) < now) return 'expired';
  if (new Date(sale.startDate) > now) return 'scheduled';
  return 'active';
}

export const STATUS_LABEL: Record<SaleStatus, string> = {
  active: 'Vigente',
  scheduled: 'Programada',
  expired: 'Vencida',
  paused: 'Pausada',
};

export const STATUS_ROLE: Record<SaleStatus, SemanticRole> = {
  active: 'success',
  scheduled: 'info',
  expired: 'error',
  paused: 'warning',
};

/** Días que faltan para el vencimiento. Negativo = ya venció. */
export function daysLeft(endDate: string, now = new Date()): number {
  const ms = new Date(endDate).getTime() - now.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

/** (305) 555-0123 a partir del E.164 que guarda el backend. */
export function formatUsPhone(e164: string): string {
  const d = (e164 || '').replace(/\D/g, '').slice(-10);
  if (d.length !== 10) return e164;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}
