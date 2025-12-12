// services/rewards.service.ts

import { api } from "@/libs/axios";

export type RewardStatus = "pending" | "paid";

export interface CashierReward {
  _id: string;
  cashierId: string;
  storeId: string;
  periodStart: string; // ISO
  achievedAt?: string; // ISO
  countAtAchievement: number; // 500, 1000, ...
  status: RewardStatus;
  paidAt?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CashierProgress {
  current: number; // p.ej. 34
  goal: number; // 500
  percent: number; // 0..100
  earnedRewards: number; // premios totales (pending+paid)
  totalNewSinceBaseline: number; // números nuevos desde la línea base
  since: string; // "2025-11-03"
}

export const rewardsService = {
  async getProgress(
    cashierId: string,
    storeId: string
  ): Promise<CashierProgress> {
    const { data } = await api.get("/sweepstakes/rewards/cashier/progress", {
      params: { cashierId, storeId },
    });
    return data;
  },

  async listRewards(
    cashierId: string,
    storeId: string
  ): Promise<CashierReward[]> {
    const { data } = await api.get("/sweepstakes/rewards/cashier/rewards", {
      params: { cashierId, storeId },
    });
    return data;
  },

  async markPaid(rewardId: string): Promise<CashierReward> {
    const { data } = await api.post(`/sweepstakes/rewards/cashier/rewards/${rewardId}/pay`);
    return data;
  },
};
