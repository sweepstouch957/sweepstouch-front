// src/services/stores.service.ts

import { api } from '@/libs/axios';
import { Customer } from '@/models/customer';
import { PaginatedResponse } from '@/models/pagination';
import { AxiosResponse } from 'axios';

export interface Store {
  id: string;
  name: string;
  address: string;
  zipCode: string;
  image: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  description: string;
  type: string;

}

// services/stores.service.ts
export interface GetStoresResponse {
  success: boolean;
  count: number;
  total: number;
  pagination?: {
    next?: { page: number; limit: number };
    prev?: { page: number; limit: number };
  };
  data: Store[];
}

export interface GetStoresParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: 'elite' | 'basic' | 'free' | '';
}

export const getStores = async ({
  page = 1,
  limit = 25,
  search = '',
  type = '',
}: GetStoresParams): Promise<GetStoresResponse> => {
  const res = await api.get<GetStoresResponse>('/store/filter', {
    params: {
      page,
      limit,
      search,
      type: type || undefined, // evita enviar vacío si no hay filtro
    },
  });

  return res.data;
};
export const getStoreById = async (id: string): Promise<Store> => {
  const res = await api.get<AxiosResponse<Store>>(`/stores/${id}`);

  return res.data.data;
};

export const getStoreCustomers = async (
  storeId: string,
  page: number = 1,
  limit: number = 10
): Promise<PaginatedResponse<Customer>> => {
  const res = await api.get(`/stores/${storeId}/customers?page=${page}&limit=${limit}`);
  return res.data;
};

export const createStore = async (store: Store): Promise<Store> => {
  const res = await api.post<Store>('/stores', store);

  return res.data;
};
export const updateStore = async (id: string, store: Store): Promise<Store> => {
  const res = await api.put<Store>(`/stores/${id}`, store);

  return res.data;
};
export const deleteStore = async (id: string): Promise<void> => {
  await api.delete(`/stores/${id}`);
};
export const getStoreByOwnerId = async (ownerId: string): Promise<Store[]> => {
  const res = await api.get<Store[]>(`/stores/owner/${ownerId}`);

  return res.data;
};
export const getStoreByName = async (name: string): Promise<Store[]> => {
  const res = await api.get<Store[]>(`/stores/name/${name}`);

  return res.data;
};
export const getStoreByAddress = async (address: string): Promise<Store[]> => {
  const res = await api.get<Store[]>(`/stores/address/${address}`);

  return res.data;
};
export const getStoreByZipCode = async (zipCode: string): Promise<Store[]> => {
  const res = await api.get<Store[]>(`/stores/zipCode/${zipCode}`);

  return res.data;
};
export const getStoreByActive = async (active: boolean): Promise<Store[]> => {
  const res = await api.get<Store[]>(`/stores/active/${active}`);

  return res.data;
};
export const getStoreByCreatedAt = async (createdAt: string): Promise<Store[]> => {
  const res = await api.get<Store[]>(`/stores/createdAt/${createdAt}`);

  return res.data;
};
export const getStoreByUpdatedAt = async (updatedAt: string): Promise<Store[]> => {
  const res = await api.get<Store[]>(`/stores/updatedAt/${updatedAt}`);

  return res.data;
};
export const getStoreByImage = async (image: string): Promise<Store[]> => {
  const res = await api.get<Store[]>(`/stores/image/${image}`);

  return res.data;
};
export const getStoreByDescription = async (description: string): Promise<Store[]> => {
  const res = await api.get<Store[]>(`/stores/description/${description}`);

  return res.data;
};
export const getStoreByIdAndOwnerId = async (id: string, ownerId: string): Promise<Store[]> => {
  const res = await api.get<Store[]>(`/stores/${id}/owner/${ownerId}`);

  return res.data;
};

const storesService = {
  getStores,
  getStoreById,
  createStore,
  updateStore,
  deleteStore,
  getStoreByOwnerId,
  getStoreByName,
  getStoreCustomers,
  getStoreByAddress,
  getStoreByZipCode,
  getStoreByActive,
  getStoreByCreatedAt,
  getStoreByUpdatedAt,
  getStoreByImage,
  getStoreByDescription,
  getStoreByIdAndOwnerId,
};
export default storesService;
