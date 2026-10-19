/** Helpers puros de la pestaña Agentes IA (sin React). */
import type { Pipeline } from '@/services/circular.service';
import type { AgentStatus, Tone } from './constants';

/** Efectividad de la lectura → color: ≥95 bien, ≥85 mirar, menos = revisar. */
export const accuracyTone = (accuracy: number): Tone =>
  accuracy >= 95 ? 'success' : accuracy >= 85 ? 'warning' : 'error';

const NY = 'America/New_York';
const timeFmt = new Intl.DateTimeFormat('es', { hour: '2-digit', minute: '2-digit', timeZone: NY });
const stampFmt = new Intl.DateTimeFormat('es', {
  hour: '2-digit',
  minute: '2-digit',
  day: '2-digit',
  month: 'short',
  timeZone: NY,
});
/** Hora de la tienda (Este), como el resto del tab. */
export const fmtTime = (iso?: string) => (iso ? timeFmt.format(new Date(iso)) : '');
/** Día + hora de la tienda. */
export const fmtStamp = (iso?: string) => (iso ? stampFmt.format(new Date(iso)) : '');

/** "precio: $2.99 · unidad: lb" para los cambios propuestos por la revisión. */
export const showFields = (v: Record<string, any>) =>
  Object.entries(v || {})
    .filter(([, x]) => x !== '' && x !== null && x !== undefined)
    .map(([k, x]) => `${k}: ${String(x)}`)
    .join(' · ') || '—';

/** Estado de un agente en la bitácora (sin paso = esperando). */
export const statusOfStep = (step?: { status: string }): AgentStatus =>
  (step?.status as AgentStatus) || 'waiting';

/** Último movimiento de una bitácora (ms), para elegir entre circular y flyer. */
export const lastStepAt = (d?: { steps: { at: string }[] } | null) =>
  Math.max(0, ...(d?.steps || []).map((s) => Date.parse(s.at) || 0));

/** Bitácora vacía con el equipo dado: la oficina se pinta igual sin circular. */
export const emptyPipeline = (agents: Pipeline['agents']): Pipeline => ({
  ok: true,
  agents,
  steps: [],
  running: false,
  accuracy: null,
});
