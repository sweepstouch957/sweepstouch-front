// hooks/useBudget.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { budgetService, AdjustBudgetPayload } from '@/services/budget.service';

export function useCurrentBudget() {
  return useQuery({
    queryKey: ['budget', 'current'],
    queryFn: () => budgetService.getCurrent(),
    staleTime: 1000 * 60 * 5, // 5 minutos
    refetchOnWindowFocus: false,
  });
}

export function useAdjustBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AdjustBudgetPayload) => budgetService.adjust(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budget', 'current'] });
    },
  });
}
