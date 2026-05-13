/**
 * hooks/fetching/kiosk/useKioskDevices.ts
 * React Query hooks for Android Kiosk Remote Management API.
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
} from '@tanstack/react-query';

import {
  getKioskDevices,
  getKioskConfigurations,
  getKioskFileSets,
  patchKioskDevice,
  patchKioskConfiguration,
  pushToDevice,
  deviceAction,
  type KioskDevice,
  type KioskConfiguration,
  type KioskFileset,
  type PushType,
  type DeviceActionName,
} from '@/services/kiosk.service';

// ─── Query keys ──────────────────────────────────────────────────────────────

export const kioskKeys = {
  devices:        (storeId: string) => ['kiosk', storeId, 'devices']        as const,
  device:         (storeId: string, id: string) => ['kiosk', storeId, 'device', id] as const,
  configurations: (storeId: string) => ['kiosk', storeId, 'configurations'] as const,
  filesets:       (storeId: string) => ['kiosk', storeId, 'filesets']       as const,
};

// ─── Devices ─────────────────────────────────────────────────────────────────

/** Fetch all kiosk devices linked to this store account */
export function useKioskDevices(storeId: string) {
  return useQuery<KioskDevice[]>({
    queryKey: kioskKeys.devices(storeId),
    queryFn:  () => getKioskDevices(storeId),
    enabled:  !!storeId,
    staleTime: 1000 * 60 * 2, // 2 min — devices status can change often
    refetchInterval: 1000 * 60 * 2, // auto-refresh every 2 min
  });
}

/** Patch a single device */
export function usePatchKioskDevice(storeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ identifier, payload }: {
      identifier: string;
      payload: Partial<Pick<KioskDevice, 'name'> & { configurationid: number }>;
    }) => patchKioskDevice(storeId, identifier, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: kioskKeys.devices(storeId) });
    },
  });
}

// ─── Push / Actions ───────────────────────────────────────────────────────────

/** Send a push action to a specific device. Returns mutation. */
export function usePushToDevice(storeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ identifier, type }: { identifier: string; type: PushType }) =>
      pushToDevice(storeId, identifier, type),
    onSuccess: () => {
      // Refresh device statuses after action
      setTimeout(() => {
        qc.invalidateQueries({ queryKey: kioskKeys.devices(storeId) });
      }, 3000);
    },
  });
}

/**
 * Primary hook for named device actions (reboot, screenshot, clear-cache…).
 * Automatically refreshes the device list 4 s after the command is sent
 * to pick up the updated status from the tablet.
 */
export function useDeviceAction(storeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ action, identifier }: { action: DeviceActionName; identifier: string }) =>
      deviceAction(storeId, action, identifier),
    onSuccess: (_data, { identifier }) => {
      setTimeout(() => {
        qc.invalidateQueries({ queryKey: kioskKeys.devices(storeId) });
        qc.invalidateQueries({ queryKey: kioskKeys.device(storeId, identifier) });
      }, 4000);
    },
  });
}

// ─── Configurations ───────────────────────────────────────────────────────────

export function useKioskConfigurations(storeId: string) {
  return useQuery<KioskConfiguration[]>({
    queryKey: kioskKeys.configurations(storeId),
    queryFn:  () => getKioskConfigurations(storeId),
    enabled:  !!storeId,
    staleTime: 1000 * 60 * 10,
  });
}

export function usePatchKioskConfiguration(storeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: { name?: string; filesetid?: number } }) =>
      patchKioskConfiguration(storeId, id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: kioskKeys.configurations(storeId) });
    },
  });
}

// ─── File Sets ────────────────────────────────────────────────────────────────

export function useKioskFileSets(storeId: string) {
  return useQuery<KioskFileset[]>({
    queryKey: kioskKeys.filesets(storeId),
    queryFn:  () => getKioskFileSets(storeId),
    enabled:  !!storeId,
    staleTime: 1000 * 60 * 10,
  });
}
