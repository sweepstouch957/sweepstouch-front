import { api } from '@/libs/axios';

export type SerialKind = '' | 'imei' | 'sim';
export type MovementKind = 'entrada' | 'salida' | 'retiro';
export type EquipmentState = 'bodega' | 'tienda' | 'danado';
export interface PageResult<T> {
  docs: T[];
  total: number;
  page: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}
export interface Material {
  _id: string;
  id: string;
  nombre: string;
  minimo: number;
  serie: SerialKind;
}
export type MaterialInput = Omit<Material, '_id'>;
export interface MaterialStore {
  _id: string;
  id: string;
  nombre: string;
  direccion: string;
  ciudad: string;
  estado: string;
  zip: string;
  store: string | null;
}
export type StoreInput = Omit<MaterialStore, '_id' | 'id' | 'store'> & {
  id?: string;
  store?: string | null;
};
export interface MovementItem {
  m: string;
  q: number;
  cond?: 'buena' | 'danado';
  series?: { v: string; iccid?: string }[];
}
export interface MovementInput {
  tipo: MovementKind;
  fecha: string;
  motivo: string;
  responsable: string;
  tiendaId: string | null;
  items: MovementItem[];
  nota?: string;
}
export interface Movement extends MovementInput {
  _id: string;
  creadoPor: string | null;
  creadoEn: string;
}
export interface InventoryRow extends MaterialInput {
  bodega: number;
  tiendas: number;
  danados: number;
  estado: 'ok' | 'bajo_minimo' | 'sin_stock';
}
export interface Inventory {
  docs: InventoryRow[];
  totals: { bodega: number; tiendas: number; danados: number; bajoMinimo: number };
  porTienda: Record<string, Record<string, number>>;
}
export interface Equipment {
  m: string;
  v: string;
  iccid: string;
  estado: EquipmentState;
  tiendaId: string | null;
  tienda: MaterialStore | null;
  fecha: string;
  hist: {
    movimientoId: string;
    tipo: MovementKind;
    fecha: string;
    tiendaId: string | null;
    resp: string;
    motivo: string;
    cond?: 'buena' | 'danado';
  }[];
}
export interface ListParams {
  page?: number;
  limit?: number;
  q?: string;
}
export interface MovementParams extends ListParams {
  tipo?: MovementKind;
  material?: string;
  tiendaId?: string;
  desde?: string;
  hasta?: string;
}
export interface EquipmentParams extends ListParams {
  material?: string;
  estado?: EquipmentState;
  tiendaId?: string;
}

const BASE = '/material-control';
const idPath = (id: string) => encodeURIComponent(id);
export const getMaterials = async (params: ListParams = {}) =>
  (await api.get<PageResult<Material>>(`${BASE}/materiales`, { params })).data;
export const createMaterial = async (body: MaterialInput) =>
  (await api.post<Material>(`${BASE}/materiales`, body)).data;
export const patchMaterial = async (id: string, body: Partial<Omit<MaterialInput, 'id'>>) =>
  (await api.patch<Material>(`${BASE}/materiales/${idPath(id)}`, body)).data;
export const saveMinimums = async (items: MaterialInput[]) =>
  (await api.put<{ success: boolean }>(`${BASE}/materiales/minimos`, { items })).data;
export const getMaterialStores = async (params: ListParams & { estado?: string } = {}) =>
  (await api.get<PageResult<MaterialStore>>(`${BASE}/tiendas`, { params })).data;
export const createMaterialStore = async (body: StoreInput) =>
  (await api.post<MaterialStore>(`${BASE}/tiendas`, body)).data;
export const patchMaterialStore = async (id: string, body: Partial<Omit<StoreInput, 'id'>>) =>
  (await api.patch<MaterialStore>(`${BASE}/tiendas/${idPath(id)}`, body)).data;
export const getMovements = async (params: MovementParams = {}) =>
  (await api.get<PageResult<Movement>>(`${BASE}/movimientos`, { params })).data;
export const getMovement = async (id: string) =>
  (await api.get<Movement>(`${BASE}/movimientos/${idPath(id)}`)).data;
export const createMovement = async (body: MovementInput) =>
  (await api.post<Movement>(`${BASE}/movimientos`, body)).data;
export const deleteMovement = async (id: string) =>
  (await api.delete<{ success: boolean }>(`${BASE}/movimientos/${idPath(id)}`)).data;
export const getInventory = async () => (await api.get<Inventory>(`${BASE}/inventario`)).data;
export const getEquipment = async (params: EquipmentParams = {}) =>
  (await api.get<PageResult<Equipment>>(`${BASE}/equipos`, { params })).data;

export async function collectPages<T>(load: (page: number) => Promise<PageResult<T>>) {
  const docs: T[] = [];
  for (let page = 1; ; page++) {
    const result = await load(page);
    docs.push(...result.docs);
    if (!result.hasNextPage) return docs;
  }
}
export const getAllMaterials = () => collectPages((page) => getMaterials({ page, limit: 200 }));
export const getAllMaterialStores = () =>
  collectPages((page) => getMaterialStores({ page, limit: 200 }));
