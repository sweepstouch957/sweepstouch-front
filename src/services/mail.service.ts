import { api } from '@/libs/axios';

export interface SendCampaignEmailInput {
  storeId: string;
  to: string;
  subject: string;
  sorteo_winner: string;
  startDate?: string;
  endDate?: string;
  timeZone?: string;
}

export interface SendCampaignEmailResponse {
  ok: boolean;
  storeId: string;
  campaignId: string;
  campaignIds?: string[];
  campaignsCount?: number;
  period?: { start: string; end: string; timeZone?: string };
  reportDate: string;
  result: Array<{
    email: string;
    status: 'sent' | 'queued' | 'scheduled' | 'rejected' | 'invalid';
    _id: string;
    reject_reason: string | null;
    queued_reason: string | null;
  }>;
}

export async function sendCampaignEmail(input: SendCampaignEmailInput) {
  const { data } = await api.post<SendCampaignEmailResponse>(
    '/mail/database-status/send',
    {
      storeId: input.storeId,
      to: input.to.trim(),
      subject: input.subject.trim(),
      sorteo_winner: input.sorteo_winner.trim(),
      ...(input.startDate ? { startDate: input.startDate } : {}),
      ...(input.endDate ? { endDate: input.endDate } : {}),
      ...(input.timeZone ? { timeZone: input.timeZone } : {}),
    },
    // Authentication uses the shared Bearer interceptor. The mail response
    // allows origin "*", which browsers reject when cookies are requested.
    { withCredentials: false }
  );
  return data;
}

export function sendHistoricalCampaignEmail(input: SendCampaignEmailInput) {
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  return sendCampaignEmail({
    ...input,
    startDate: '1970-01-01',
    endDate: tomorrow.toISOString().slice(0, 10),
    timeZone: 'UTC',
  });
}
