// src/hooks/fetching/cashiers/useCashierRewards.ts
"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { rewardsService } from "@/services/rewards.service";

export function useCashierRewardProgress(cashierId?: string, storeId?: string) {
  return useQuery({
    queryKey: ["rewards", "progress", cashierId, storeId],
    queryFn: () => rewardsService.getProgress(cashierId!, storeId!),
    enabled: Boolean(cashierId && storeId),
    refetchInterval: 30_000,
  });
}

export function useCashierRewards(cashierId?: string, storeId?: string) {
  return useQuery({
    queryKey: ["rewards", "list", cashierId, storeId],
    queryFn: () => rewardsService.listRewards(cashierId!, storeId!),
    enabled: Boolean(cashierId && storeId),
    staleTime: 15_000,
  });
}

export function useMarkRewardPaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: rewardsService.markPaid,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rewards"] });
    },
  });
}
