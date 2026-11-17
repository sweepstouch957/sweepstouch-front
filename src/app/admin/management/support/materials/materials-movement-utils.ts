import type { Equipment, MaterialStore, MovementItem } from '@/services/material-control.service';
import { parseSeries } from './materials-utils';

export function warehouseImeis(equipment: Equipment[], materialId: string) {
  return [
    ...new Set(
      equipment
        .filter((row) => row.m === materialId && row.estado === 'bodega')
        .flatMap((row) => parseSeries(row.v, 'imei').map((serial) => serial.v))
        .filter(Boolean)
    ),
  ].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

export function toggleImei(text: string, imei: string, checked: boolean) {
  const normalized = parseSeries(imei, 'imei')[0]?.v;
  if (!normalized) return text;
  const existing = parseSeries(text, 'imei').some((serial) => serial.v === normalized);
  if (checked) return existing ? text : [text.trimEnd(), normalized].filter(Boolean).join('\n');
  return text
    .split(/\r?\n/)
    .filter((line) => parseSeries(line, 'imei')[0]?.v !== normalized)
    .join('\n');
}

export function movementReason(reason: string, otherReason: string) {
  const value = (reason === 'Otro' ? otherReason : reason).trim();
  if (!value)
    throw new Error(
      reason === 'Otro'
        ? 'Escribe el motivo del movimiento.'
        : 'Selecciona el motivo del movimiento.'
    );
  return value;
}

export function assertOutgoingEquipment(
  items: MovementItem[],
  equipment: Equipment[],
  stores: MaterialStore[]
) {
  const key = (material: string, value: string) =>
    JSON.stringify([material, value.replace(/[^0-9A-Za-z]/g, '').toUpperCase()]);
  const bySerial = new Map(equipment.map((row) => [key(row.m, row.v), row]));
  const storeNames = new Map(stores.map((store) => [store.id, store.nombre]));
  for (const item of items)
    for (const serial of item.series || []) {
      const unit = bySerial.get(key(item.m, serial.v));
      if (unit?.estado === 'tienda') {
        const store = storeNames.get(unit.tiendaId || '') || unit.tienda?.nombre || 'una tienda';
        throw new Error(
          `El IMEI/SIM ${serial.v} ya está instalado en ${store}. No se puede registrar otra salida, aunque sea a la misma tienda. Registra primero su retiro a bodega.`
        );
      }
      if (unit?.estado === 'danado')
        throw new Error(
          `El IMEI/SIM ${serial.v} está marcado como dañado y no está disponible para salida.`
        );
      if (!unit || unit.estado !== 'bodega')
        throw new Error(
          `El IMEI/SIM ${serial.v} no tiene una entrada registrada en bodega. Registra la entrada antes de realizar una salida.`
        );
    }
}
