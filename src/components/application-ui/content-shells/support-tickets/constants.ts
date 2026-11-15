/** Etiquetas y colores de estado, prioridad, tipo y área de los tickets. */
import { type Theme } from '@mui/material/styles';
import { chartPalette } from 'src/theme/semantic';

/* ─── Lookup maps ─────────────────────────────────────────── */
export const STATUS_COLOR: Record<string, 'warning' | 'info' | 'error' | 'success' | 'default'> = {
  open: 'warning',
  in_progress: 'info',
  resolved: 'success',
  closed: 'default',
};
export const STATUS_LABEL: Record<string, string> = {
  open: 'Abierto',
  in_progress: 'En Progreso',
  resolved: 'Resuelto',
  closed: 'Cerrado',
};
export const PRIORITY_COLOR: Record<string, 'error' | 'warning' | 'info' | 'success'> = {
  critical: 'error',
  high: 'warning',
  medium: 'info',
  low: 'success',
};
export const PRIORITY_LABEL: Record<string, string> = {
  critical: 'Crítico',
  high: 'Alto',
  medium: 'Medio',
  low: 'Bajo',
};
export const TYPE_LABEL: Record<string, string> = {
  software: 'Software',
  hardware: 'Hardware',
  connectivity: 'Conectividad',
  peripheral: 'Periféricos',
  remote: 'Remoto',
  installation: 'Instalación',
  uninstallation: 'Desinstalación',
  reconfiguration: 'Reconfiguración',
  other: 'Otro',
};
export const AREA_LABEL: Record<string, string> = {
  it: 'IT / Sistemas',
  support: 'Soporte Técnico',
  hardware: 'Hardware',
  networking: 'Redes',
  sales: 'Ventas',
  operations: 'Operaciones',
  management: 'Gerencia',
  other: 'Otro',
};
/** Áreas: color CATEGÓRICO (hay que distinguirlas entre sí, no significan estado). */
const AREA_ORDER = [
  'it',
  'hardware',
  'networking',
  'sales',
  'operations',
  'management',
  'support',
  'other',
];
export const areaColor = (theme: Theme, area?: string) => {
  const palette = chartPalette(theme);
  const idx = AREA_ORDER.indexOf(area ?? '');
  return idx >= 0 ? palette[idx % palette.length] : theme.palette.text.disabled;
};
const STORE_TYPE_ORDER = ['elite', 'basic', 'free'];
export const storeTypeColor = (theme: Theme, type?: string) => {
  const palette = chartPalette(theme);
  const idx = STORE_TYPE_ORDER.indexOf(type ?? '');
  return idx >= 0 ? palette[idx % palette.length] : theme.palette.primary.main;
};
