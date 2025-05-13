import { api } from "@/libs/axios";
import type { Campaing } from "@/models/campaing";
import type { PaginatedResponse } from "@/models/pagination";

class CampaignClient {
  async getCampaigns(page: number = 1, limit: number = 10): Promise<PaginatedResponse<Campaing>> {
    const res = await api.get(`/campaigns/filter`, {
      params: { page, limit },
    });
    return res.data;
  }
    async getCampaignsCount(): Promise<number> {
      const res = await api.get(`/campaigns/count`);
      return res  .data.total;
    }
  async getFilteredCampaigns({ page = 1, limit = 10, status, storeName, startDate, endDate }) {
    const res = await api.get('/campaigns/filter', {
      params: { page, limit, status, storeName, startDate, endDate }
    });
    return res.data;
  }

  async getCampaignById(id: string): Promise<Campaing> {
    const res = await api.get(`/campaigns/${id}`);
    return res.data.data;
  }

  async createCampaign(data: Campaing): Promise<Campaing> {
    const res = await api.post(`/campaigns`, data);
    return res.data;
  }

  async updateCampaign(id: string, data: Campaing): Promise<Campaing> {
    const res = await api.put(`/campaigns/${id}`, data);
    return res.data;
  }

  async deleteCampaign(id: string): Promise<Campaing> {
    const res = await api.delete(`/campaigns/${id}`);
    return res.data;
  }
}

export const campaignClient = new CampaignClient();
