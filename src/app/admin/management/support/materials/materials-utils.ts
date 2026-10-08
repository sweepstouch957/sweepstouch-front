import type {
  MaterialInput,
  MaterialStore,
  MovementInput,
  MovementKind,
  SerialKind,
} from '@/services/material-control.service';
import axios from 'axios';

export const tabs = ['Inventario', 'Registrar movimiento', 'IMEI y SIM', 'Tiendas', 'Historial'];
export const typeLabels = { entrada: 'Entrada', salida: 'Salida', retiro: 'Retiro' } as const;
export const stateLabels = { bodega: 'En bodega', tienda: 'En tienda', danado: 'Dañado' } as const;
export const reasons: Record<MovementKind, string[]> = {
  entrada: [
    'Compra a proveedor',
    'Recepción de envío',
    'Reparación terminada',
    'Transferencia interna',
    'Otro',
  ],
  salida: ['Instalación nueva', 'Reemplazo por daño', 'Soporte rutinario', 'Otro'],
  retiro: ['Reemplazo por daño', 'Desinstalación de tienda', 'Soporte rutinario', 'Otro'],
};
export const defaultCatalog: MaterialInput[] = [
  { id: 'tablet', nombre: 'Tablets', minimo: 5, serie: 'imei' },
  { id: 'router', nombre: 'Routers', minimo: 3, serie: 'imei' },
  { id: 'holder', nombre: 'Holders', minimo: 5, serie: '' },
  { id: 'base', nombre: 'Bases', minimo: 5, serie: '' },
  { id: 'cable', nombre: 'Cables', minimo: 10, serie: '' },
  { id: 'adaptador', nombre: 'Adaptadores de carga', minimo: 10, serie: '' },
  { id: 'impresora', nombre: 'Impresoras', minimo: 2, serie: '' },
  { id: 'chip', nombre: 'SIM (chips de internet)', minimo: 3, serie: 'sim' },
  { id: 'tornillo', nombre: 'Tornillos', minimo: 20, serie: '' },
];
export function localDate() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;
}
export const storeAddress = (store: MaterialStore) =>
  [store.direccion, store.ciudad, store.estado].filter(Boolean).join(', ') +
  (store.zip ? ` ${store.zip}` : '');
export const materialSlug = (name: string) =>
  name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    if (status === 401) return 'Tu sesión venció. Recupera la sesión y vuelve a intentar.';
    if (status === 403) return 'Tu rol no tiene permiso para acceder al control de materiales.';
    if (status === 502 || status === 503)
      return 'El servicio de materiales no está disponible. Intenta nuevamente.';
    const message = error.response?.data?.message || error.response?.data?.error;
    if (Array.isArray(message)) return message.join('. ');
    return typeof message === 'string' ? message : error.message;
  }
  return error instanceof Error ? error.message : 'No se pudo completar la operación.';
}
export function parseSeries(text: string, serial: SerialKind) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [value, iccid] = line.split(/[,;\t|]/).map((part) => part.trim());
      return serial === 'sim'
        ? { v: value.replace(/\D/g, ''), ...(iccid ? { iccid: iccid.replace(/\D/g, '') } : {}) }
        : { v: value.replace(/[^0-9A-Za-z]/g, '').toUpperCase() };
    });
}
export interface FormItem {
  id: number;
  material: string;
  quantity: number;
  condition: 'buena' | 'danado';
  serialText: string;
}
export function movementItems(
  items: FormItem[],
  materials: MaterialInput[],
  type: MovementKind
): MovementInput['items'] {
  if (!items.length) throw new Error('Agrega al menos un material.');
  const seen = new Set<string>();
  return items.map((item) => {
    const material = materials.find((row) => row.id === item.material);
    if (!material) throw new Error('Selecciona un material válido.');
    const series = material.serie ? parseSeries(item.serialText, material.serie) : [];
    if (material.serie && (!series.length || series.some((row) => !row.v)))
      throw new Error(`Completa los IMEI/SIM de ${material.nombre}.`);
    for (const row of series) {
      if (row.iccid !== undefined && !row.iccid) throw new Error('El ICCID debe contener números.');
      const key = JSON.stringify([material.id, row.v]);
      if (seen.has(key)) throw new Error(`Hay números de serie repetidos en ${material.nombre}.`);
      seen.add(key);
    }
    const quantity = material.serie ? series.length : item.quantity;
    if (!Number.isInteger(quantity) || quantity <= 0)
      throw new Error(`La cantidad de ${material.nombre} debe ser un entero positivo.`);
    if (type === 'retiro' && !['buena', 'danado'].includes(item.condition))
      throw new Error('Selecciona la condición del material retirado.');
    return {
      m: material.id,
      q: quantity,
      ...(material.serie ? { series } : {}),
      ...(type === 'retiro' ? { cond: item.condition } : {}),
    };
  });
}
