import type { KioskDevice } from '@/services/kiosk.service';
import type { MaterialStore } from '@/services/material-control.service';
import { storeAddress } from './materials-utils';

export interface InstalledKioskTablet {
  key: string;
  device: KioskDevice;
  stores: MaterialStore[];
}

/** Limit store requests and keep successful results when one store is unavailable. */
export async function collectInstalledKioskTablets(
  stores: MaterialStore[],
  load: (storeId: string) => Promise<KioskDevice[]>,
  signal?: AbortSignal
) {
  const linkedStores = [
    ...new Map(
      stores.filter((store) => store.store).map((store) => [store.store!, store])
    ).values(),
  ];
  const batches: { store: MaterialStore; devices: KioskDevice[] }[] = [];
  const failedStores: MaterialStore[] = [];
  let cursor = 0;
  const worker = async () => {
    while (cursor < linkedStores.length) {
      signal?.throwIfAborted();
      const store = linkedStores[cursor++];
      try {
        const devices = await load(store.store!);
        signal?.throwIfAborted();
        batches.push({ store, devices });
      } catch (error) {
        signal?.throwIfAborted();
        failedStores.push(store);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(4, linkedStores.length) }, worker));
  const rows = new Map<string, InstalledKioskTablet>();
  for (const { store, devices } of batches) {
    devices.forEach((device, index) => {
      const key =
        device.identifier?.trim() || JSON.stringify([store.id, device.imei, device.serial, index]);
      const existing = rows.get(key);
      if (existing) {
        if (!existing.stores.some((row) => row.id === store.id)) existing.stores.push(store);
      } else rows.set(key, { key, device, stores: [store] });
    });
  }
  return {
    rows: [...rows.values()].sort(
      (a, b) =>
        (a.device.name || '').localeCompare(b.device.name || '', 'es', { numeric: true }) ||
        a.key.localeCompare(b.key)
    ),
    failedStores,
  };
}

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

export function matchesKioskTablet(row: InstalledKioskTablet, query: string) {
  const { device, stores } = row;
  const text = normalize(
    [
      device.imei,
      device.serial,
      device.identifier,
      device.name,
      device.brand,
      device.model,
      device.simSerial,
      ...stores.map((store) => `${store.nombre} ${storeAddress(store)}`),
    ]
      .filter(Boolean)
      .join(' ')
  );
  return normalize(query)
    .split(/\s+/)
    .every((term) => text.includes(term));
}
