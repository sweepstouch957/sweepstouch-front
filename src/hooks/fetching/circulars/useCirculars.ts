// hooks/useCirculars.js
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { circularService } from "@services/circular.service";

/** KPIs + último circular por tienda */
export function useCircularOverview() {
  return useQuery({
    queryKey: ["circulars", "overview"],
    queryFn: () => circularService.getOverview(),
    staleTime: 60 * 1000, // 1 min
  });
}

/** Alertas: expira pronto / gap warning */
export function useCircularAlerts(hours = 48) {
  return useQuery({
    queryKey: ["circulars", "alerts", hours],
    queryFn: () => circularService.getAlerts(hours),
    refetchInterval: 60 * 1000, // refresca cada minuto
  });
}

