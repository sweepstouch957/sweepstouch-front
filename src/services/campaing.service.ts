import { api } from '@/libs/axios';
import type { Campaing } from '@/models/campaing';
import type { PaginatedResponse } from '@/models/pagination';

interface FilterCampaignParams {
  page?: number;
  limit?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
  storeId?: string;
  title?: string;
}

class CampaignClient {
  async getCampaigns(page: number = 1, limit: number = 10): Promise<PaginatedResponse<Campaing>> {
    const res = await api.get(`/campaigns/filter`, {
      params: { page, limit },
    });
    return res.data;
  }

  async getCampaignsCount(): Promise<number> {
    const res = await api.get(`/campaigns/messages/sent/total`);
    return res.data.totalSent;
  }

  async getFilteredCampaigns({
    page = 1,
    limit = 10,
    status,
    startDate,
    endDate,
    storeId,
    title,
  }: FilterCampaignParams) {
    const res = await api.get('/campaigns/filter', {
      params: { page, limit, status, startDate, endDate, storeId, title },
    });
    return res.data;
  }

  async getCampaignById(id: string): Promise<Campaing> {
    const res = await api.get(`/campaigns/${id}`);
    return res.data;
  }

  async createCampaign(data: Partial<Campaing>, storeId: string): Promise<Campaing> {
    const payload = {
      ...data,
      store: storeId,
    };

    const res = await api.post(`/campaigns`, payload);
    return res.data;
  }

  async updateCampaign(id: string, data: Campaing): Promise<Campaing> {
    const res = await api.put(`/campaigns/old/${id}`, data);
    return res.data;
  }

  async deleteCampaign(id: string): Promise<Campaing> {
    const res = await api.delete(`/campaigns/${id}`);
    return res.data;
  }
}

export const campaignClient = new CampaignClient();
