import type { Campaing } from '@/models/campaing';
import type { CampaignLog } from '@/services/campaing.service';

/** Todos los números de la página en formato local (14.005, 91,8%). */
export const num = (n?: number | null) => Number(n || 0).toLocaleString('es');
export const pct = (n: number, base: number, digits = 1) =>
  base > 0 ? `${((n / base) * 100).toLocaleString('es', { maximumFractionDigits: digits })}%` : '0%';
export const money = (n?: number | null, digits = 2) =>
  `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;

export type Tone = 'success' | 'warning' | 'error' | 'info' | 'neutral';

/** Umbrales de la entrega: los mismos que usaba la vista anterior (90 / 75). */
export function deliveryGrade(rate: number): { label: string; tone: Tone } {
  if (rate >= 90) return { label: 'Excelente', tone: 'success' };
  if (rate >= 75) return { label: 'Bueno', tone: 'warning' };
  return { label: 'Mejorable', tone: 'error' };
}

export const isMixedCampaign = (c?: Campaing) => c?.type === 'MIXED' || c?.channel === 'mixed';
/** Campaña con números elegidos para RCS: mixta, canal rcs o tipo RCS. */
export const isRcsCampaign = (c?: Campaing) =>
  isMixedCampaign(c) || c?.type === 'RCS' || c?.channel === 'rcs';

export function typeLabel(c?: Campaing) {
  if (isMixedCampaign(c)) return 'Mixta';
  return String(c?.type || '—').toUpperCase();
}

/** "por SMS", "por MMS" o "por SMS, MMS y RCS": cómo salió la campaña. */
export function channelsPhrase(c?: Campaing) {
  if (isMixedCampaign(c)) return 'por SMS, MMS y RCS';
  if (c?.type === 'RCS' || c?.channel === 'rcs') return 'por RCS';
  return `por ${String(c?.type || 'SMS').toUpperCase()}`;
}

export const STATUS_META: Record<string, { label: string; tone: Tone }> = {
  completed: { label: 'Completada', tone: 'success' },
  active: { label: 'Enviando', tone: 'info' },
  progress: { label: 'En curso', tone: 'info' },
  scheduled: { label: 'Programada', tone: 'warning' },
  draft: { label: 'Borrador', tone: 'neutral' },
  cancelled: { label: 'Cancelada', tone: 'error' },
};

/** "sms_failover" → "SMS (failover)". */
export function channelName(ch: string) {
  const [base, ...rest] = String(ch || '').split('_');
  return `${base.toUpperCase()}${rest.includes('failover') ? ' (failover)' : ''}`;
}

export function formatPhone(tn?: string) {
  const d = String(tn || '').replace(/\D/g, '').slice(-10);
  return d.length === 10 ? `1 (${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : tn || '';
}

/* ─── Destinatarios RCS ─────────────────────────────────────────────────── */

export type RcsOutcome = 'delivered' | 'seen' | 'failover' | 'failed';

/**
 * Qué le pasó a un número elegido para RCS. Failover = llegó pero conserva el código
 * del RCS (7002…): un RCS entregado nunca trae código. messageType no sirve, el
 * webhook etiqueta "sms" a RCS reales.
 */
export function outcomeOf(row: CampaignLog): { key: RcsOutcome | 'pending'; label: string; tone: Tone } {
  const code = String(row.errorCode || '');
  if (row.status === 'sent' && code && code !== '0') return { key: 'failover', label: 'Llegó por SMS/MMS', tone: 'warning' };
  if (row.status === 'sent') return row.seenAt
    ? { key: 'seen', label: 'Entregado · visto', tone: 'info' }
    : { key: 'delivered', label: 'RCS entregado', tone: 'success' };
  if (String(row.status) === 'error') return { key: 'failed', label: 'No llegó', tone: 'error' };
  return { key: 'pending', label: 'Pendiente', tone: 'neutral' };
}

export const last10 = (p?: string) => String(p || '').replace(/\D/g, '').slice(-10);
