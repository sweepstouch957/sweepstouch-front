/** Helpers puros del estado de la lista (sin React). */
import type {
  CampaignImportJob,
  CatalogSummary,
} from '@/services/circular.service';
import { fmtDate } from '../shared';

export type Ruling = NonNullable<CatalogSummary['ruling']>;

/** "12 del flyer · 3 a mano": de dónde salen los visibles. */
export function sourceSummary(src: CatalogSummary['bySource']) {
  return [
    src.flyer ? `${src.flyer} del flyer` : '',
    src.circular ? `${src.circular} del circular` : '',
    src.manual ? `${src.manual} a mano` : '',
  ]
    .filter(Boolean)
    .join(' · ');
}

export const rulingKind = (r: Ruling | null) =>
  r?.kind === 'circular' ? 'circular' : 'flyer';

/** Hoy en NY (YYYY-MM-DD): el caso típico es "el flyer dice hasta hoy y ya no sale nada". */
export const todayInNY = () => new Date(Date.now() - 4 * 3600 * 1000).toISOString().slice(0, 10);

/** Imports que merecen aviso: fallidos, corriendo o esperando cuota más de un minuto. */
export function jobsNeedingAttention(jobs: CampaignImportJob[]) {
  const soon = Date.now() + 60_000;
  return jobs.filter(
    (j) =>
      j.status === 'failed' ||
      j.status === 'running' ||
      (j.status === 'queued' && new Date(j.runAfter as string).getTime() > soon)
  );
}

export const hasActiveJobs = (jobs: CampaignImportJob[] = []) =>
  jobs.some((j) => j.status === 'queued' || j.status === 'running');

export function jobMessage(j: CampaignImportJob) {
  if (j.status === 'failed')
    return `No se pudo leer el arte de "${j.title || 'la campaña'}" (sale ${fmtDate(j.startDate)})`;
  if (j.status === 'running')
    return `Leyendo el arte de "${j.title || 'la campaña'}"… intento ${j.attempts}`;
  const at = new Date(j.runAfter as string).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `"${j.title || 'La campaña'}" espera: la IA se quedó sin cuota, se reintenta sola a las ${at}`;
}
