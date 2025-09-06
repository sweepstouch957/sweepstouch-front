// services/budget.service.ts
import { api } from '@/libs/axios';

// ---------- Tipos ----------
export interface BudgetWeek {
  weekKey: string;
  tz: string;
  startsAt: string;    // ISO
  endsAt: string;      // ISO
  budgetUsd: number;
  heldUsd: number;
  consumedUsd: number;
  status: string;      // 'open' | 'closed' | etc.
  updatedAt: string;   // ISO
}

export interface CurrentBudgetResponse {
  ok: boolean;
  weekKey: string;
  tz: string;
  startsAt: string;
  endsAt: string;
  budgetUsd: number;
  heldUsd: number;
  consumedUsd: number;
  availableUsd: number;
  status: string;
  updatedAt: string;
}

export interface AdjustBudgetPayload {
  budgetUsd?: number; // valor absoluto
  deltaUsd?: number;  // ajuste incremental (+/-)
  note?: string;
}

export interface AdjustBudgetResponse {
  ok: boolean;
  week: BudgetWeek;
  prevBudgetUsd: number;
  newBudgetUsd: number;
  availableUsd: number;
}

// ---------- Servicio ----------
class BudgetService {
  // GET /budget/current
  async getCurrent(): Promise<CurrentBudgetResponse> {
    const { data } = await api.get<CurrentBudgetResponse>('/promoter/budget/current');
    return data;
  }

  // POST /budget/adjust
  async adjust(payload: AdjustBudgetPayload): Promise<AdjustBudgetResponse> {
    const { data } = await api.post<AdjustBudgetResponse>('/promoter/budget/adjust', payload);
    return data;
  }

  // Helpers convenientes
  async setAbsolute(budgetUsd: number, note?: string) {
    return this.adjust({ budgetUsd, note });
  }
  async increase(deltaUsd: number, note?: string) {
    return this.adjust({ deltaUsd: Math.abs(deltaUsd), note });
  }
  async decrease(deltaUsd: number, note?: string) {
    return this.adjust({ deltaUsd: -Math.abs(deltaUsd), note });
  }
}

export const budgetService = new BudgetService();
