import {
  otterService,
  type OtterChannel,
  type OtterConversation,
  type OtterListResponse,
  type OtterStatus,
  type OtterTranscript,
} from '@/services/otter.service';
import { useQuery } from '@tanstack/react-query';

/** Salud de la integración. Si esto falla no tiene sentido pedir listas. */
export function useOtterStatus() {
  return useQuery<OtterStatus>({
    queryKey: ['otter', 'status'],
    queryFn: otterService.status,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}

export function useOtterConversations(
  params: { workspaceId?: string; channelId?: string; cursor?: string; limit?: number },
  enabled = true
) {
  return useQuery<OtterListResponse<OtterConversation>>({
    queryKey: ['otter', 'conversations', JSON.stringify(params)],
    queryFn: () => otterService.listConversations(params),
    enabled,
    staleTime: 1000 * 60,
    retry: false,
  });
}

export function useOtterChannels(enabled = true) {
  return useQuery<OtterListResponse<OtterChannel>>({
    queryKey: ['otter', 'channels'],
    queryFn: () => otterService.listChannels({ limit: 100 }),
    enabled,
    staleTime: 1000 * 60 * 10,
    retry: false,
  });
}

export function useOtterConversation(id: string | null) {
  return useQuery({
    queryKey: ['otter', 'conversation', id],
    queryFn: () => otterService.getConversation(id as string),
    enabled: !!id,
    staleTime: 1000 * 60 * 10,
    retry: false,
  });
}

export function useOtterTranscript(id: string | null, enabled = true) {
  return useQuery<OtterTranscript>({
    queryKey: ['otter', 'transcript', id],
    queryFn: () => otterService.getTranscript(id as string),
    enabled: !!id && enabled,
    // El transcript de una reunión cerrada no cambia nunca.
    staleTime: Infinity,
    retry: false,
  });
}

export function useOtterActionItems(id: string | null, enabled = true) {
  return useQuery({
    queryKey: ['otter', 'action-items', id],
    queryFn: () => otterService.getActionItems(id as string),
    enabled: !!id && enabled,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}
