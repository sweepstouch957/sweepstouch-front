// hooks/useActivationRequestsStats.ts
import { useQuery } from "@tanstack/react-query";

import { ActivationFilters, ActivationRequestsStats, activationService, GetActivationRequestsDataResponse } from "@/services/activation.service";

const DEFAULT_STATS: ActivationRequestsStats = {
  total: 0,
  pendiente: 0,
  aprobado: 0,
  rechazado: 0,
};

export function useActivationRequestsStats(filters?: ActivationFilters) {
  return useQuery<GetActivationRequestsDataResponse, Error>({
    queryKey: ["activation-requests-stats", filters],
    queryFn: () => activationService.getActivationRequestsStats(filters),
    select: (r) => ({ success: r.success, data: r.data ?? DEFAULT_STATS }),
    // valor inicial opcional para evitar flicker en primera carga
    initialData: { success: true, data: DEFAULT_STATS },
  });
}
