/** Imports automáticos de arte de campaña: cuándo merecen aviso. Puro. */
import type { CampaignImportJob } from '@/services/circular';

/** Imports que merecen aviso: fallidos, corriendo o esperando cuota más de un minuto. */
export function jobsNeedingAttention(jobs: CampaignImportJob[], now = Date.now()) {
  const soon = now + 60_000;
  return jobs.filter(
    (j) =>
      j.status === 'failed' ||
      j.status === 'running' ||
      (j.status === 'queued' && new Date(j.runAfter as string).getTime() > soon)
  );
}

export const hasActiveJobs = (jobs: CampaignImportJob[] = []) =>
  jobs.some((j) => j.status === 'queued' || j.status === 'running');
