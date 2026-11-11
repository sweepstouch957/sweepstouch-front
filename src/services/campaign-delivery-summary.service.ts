import { api } from '@/libs/axios';
import type { SendCampaignEmailResponse } from './mail.service';

export interface CampaignDeliverySummaryInput {
  storeId: string;
  to: string;
  subject: string;
  contact_name?: string;
  support_phone?: string;
  other_services?: Array<{ name: string; cost: number }>;
  startDate?: string;
  endDate?: string;
  timeZone?: string;
}

export interface CampaignDeliverySummaryResponse
  extends Omit<SendCampaignEmailResponse, 'campaignId' | 'reportDate'> {
  campaignIds: string[];
  campaignsCount: number;
  period: { start: string; end: string; startDate?: string; endDate?: string; timeZone: string };
}

export async function sendCampaignDeliverySummary(input: CampaignDeliverySummaryInput) {
  const { data } = await api.post<CampaignDeliverySummaryResponse>(
    '/mail/campaign-delivery-summary/send',
    {
      storeId: input.storeId,
      to: input.to.trim(),
      subject: input.subject.trim(),
      ...(input.startDate ? { startDate: input.startDate } : {}),
      ...(input.endDate ? { endDate: input.endDate } : {}),
      ...(input.timeZone ? { timeZone: input.timeZone } : {}),
      ...(input.contact_name?.trim() ? { contact_name: input.contact_name.trim() } : {}),
      ...(input.support_phone?.trim() ? { support_phone: input.support_phone.trim() } : {}),
      other_services: (input.other_services || []).map((service) => ({
        name: service.name.trim(),
        cost: service.cost,
      })),
    },
    { withCredentials: false }
  );
  return data;
}
