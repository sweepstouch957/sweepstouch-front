import { sweepstakesClient, type EventStoresResponse } from '@/services/sweepstakes.service';
import { useQuery } from '@tanstack/react-query';

/** Módulo Eventos: totales, serie diaria y filas en una sola llamada. */
export function useEventStores(days: number) {
  return useQuery<EventStoresResponse>({
    queryKey: ['event-stores', days],
    queryFn: () => sweepstakesClient.listEventStores(days),
    // Un evento dura horas: durante el tradeshow se quiere ver el contador subir.
    refetchInterval: 60_000,
  });
}
