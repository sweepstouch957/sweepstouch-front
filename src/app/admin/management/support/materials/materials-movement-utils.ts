import type { Equipment } from '@/services/material-control.service';
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
