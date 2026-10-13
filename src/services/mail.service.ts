import { api } from '@/libs/axios';

export interface SendCampaignEmailInput {
  storeId: string;
  to: string;
  subject: string;
  sorteo_winner: string;
}

export interface SendCampaignEmailResponse {
  ok: boolean;
  storeId: string;
  campaignId: string;
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
    },
    // Authentication uses the shared Bearer interceptor. The mail response
    // allows origin "*", which browsers reject when cookies are requested.
    { withCredentials: false }
  );
  return data;
}
