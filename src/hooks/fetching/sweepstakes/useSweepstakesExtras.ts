import { sweepstakesClient } from "@/services/sweepstakes.service";
import { useQuery } from "@tanstack/react-query";

// ✅ Hook: sample phones
export function useParticipantsSamplePhones(params: {
  sweepstakeId?: string;
  storeId?: string;
}) {
  const { sweepstakeId, storeId } = params;

  return useQuery({
    queryKey: ["sweepstakes", "participants", "sample-phones", sweepstakeId, storeId ?? "all"],
    queryFn: () => {
      if (!sweepstakeId) throw new Error("missing sweepstakeId");
      return sweepstakesClient.getParticipantsSamplePhones(sweepstakeId, storeId);
    },
    enabled: !!sweepstakeId,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

// ✅ Hook: count-by-sweepstake
export function useSweepstakeRegistrationsCount(params: {
  sweepstakeId?: string;
  startDate?: string;
  endDate?: string;
  promotorId?: string;
  method?: "qr" | "pinpad" | "tablet" | "web" | "referral" | "promotor";
}) {
  const { sweepstakeId, startDate, endDate, promotorId, method } = params;

  // regla: si mandas startDate o endDate, mandá ambos
  const hasValidRange =
    (!startDate && !endDate) || (Boolean(startDate) && Boolean(endDate));

  return useQuery({
    queryKey: [
      "sweepstakes",
      "participants",
      "count-by-sweepstake",
      sweepstakeId,
      startDate ?? "all",
      endDate ?? "all",
      promotorId ?? "all",
      method ?? "all",
    ],
    queryFn: () => {
      if (!sweepstakeId) throw new Error("missing sweepstakeId");
      if (!hasValidRange) throw new Error("startDate and endDate must be provided together");

      return sweepstakesClient.getSweepstakeRegistrationsCount({
        sweepstakeId,
        startDate,
        endDate,
        promotorId,
        method,
      });
    },
    enabled: !!sweepstakeId && hasValidRange,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
