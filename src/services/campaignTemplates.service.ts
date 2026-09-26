// services/campaignTemplates.service.ts — plantillas de mensaje por tienda (campaign-service /templates).
import { api } from '@/libs/axios';

export type TemplateChannel = 'sms' | 'mixed';

export interface CampaignTemplate {
  _id: string;
  store: string;
  name: string;
  title: string;
  content: string;
  description: string;
  channel: TemplateChannel;
  usageCount: number;
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CampaignTemplateInput = Pick<CampaignTemplate, 'name' | 'content'> &
  Partial<Pick<CampaignTemplate, 'title' | 'description' | 'channel'>>;

/** Vista previa real: el texto como lo recibe el cliente (mismo pipeline que el envío). */
export interface MessagePreview {
  text: string;
  segments: { encoding: 'GSM-7' | 'UCS-2'; length: number; segments: number; perSegment: number };
  placeholders: { used: string[]; unknown: { token: string; suggestion: string | null }[] };
  sample: { store: string; name: string; perCustomerLinks: string[] };
}

const BASE = '/campaigns/templates';

export const campaignTemplatesService = {
  async list(storeId: string): Promise<CampaignTemplate[]> {
    const res = await api.get(BASE, { params: { storeId } });
    return res.data?.items ?? [];
  },
  async create(storeId: string, input: CampaignTemplateInput): Promise<CampaignTemplate> {
    const res = await api.post(BASE, { storeId, ...input });
    return res.data.item;
  },
  async update(id: string, patch: Partial<CampaignTemplateInput>): Promise<CampaignTemplate> {
    const res = await api.patch(`${BASE}/${id}`, patch);
    return res.data.item;
  },
  async remove(id: string): Promise<void> {
    await api.delete(`${BASE}/${id}`);
  },
  async preview(storeId: string, content: string, signal?: AbortSignal): Promise<MessagePreview> {
    const res = await api.post(`${BASE}/preview`, { storeId, content }, { signal });
    return res.data;
  },
  /** Se usó en una campaña: sube en el menú. */
  async markUsed(id: string): Promise<void> {
    await api.post(`${BASE}/${id}/use`);
  },
};
