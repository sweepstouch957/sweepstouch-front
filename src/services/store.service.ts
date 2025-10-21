// src/services/stores.service.ts

import { api } from '@/libs/axios';
import { Customer } from '@/models/customer';
import { PaginatedResponse } from '@/models/pagination';
import { AxiosResponse } from 'axios';

export interface Store {
  id: string;
  _id: string;
  name: string;
  address: string;
  zipCode: string;
  type: 'elite' | 'basic' | 'free';
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };
  ownerId: string;
  description?: string;
  slug?: string;
  image: string;
  active: boolean;
  subscription?: string;
  phoneNumber?: string;
  twilioPhoneNumber?: string;
  twilioPhoneNumberSid?: string;
  twilioPhoneNumberFriendlyName?: string;
  verifiedByTwilio?: boolean;
  bandwidthPhoneNumber?: string;
  customerCount: number;
  provider: 'twilio' | 'bandwidth';
  createdAt: string;
  updatedAt: string;
  accessCode?: string;
  membershipType?: 'mensual' | 'semanal' | 'especial';
  paymentMethod?: 'central_billing' | 'card' | 'quickbooks' | 'ach' | 'wire' | 'cash';
  startContractDate?: string | null; // ISO o null
}

export interface UpdateStoreBody {
  name?: string;
  address?: string;
  zipCode?: string;
  type?: 'elite' | 'basic' | 'free';
  active?: boolean;
  phoneNumber?: string;
  provider?: 'twilio' | 'bandwidth';
  bandwidthPhoneNumber?: string;
  twilioPhoneNumber?: string;
  twilioPhoneNumberSid?: string;
  twilioPhoneNumberFriendlyName?: string;
  verifiedByTwilio?: boolean;
  location?: { type: 'Point'; coordinates: [number, number] };
  membershipType?: 'mensual' | 'semanal' | 'especial';
  paymentMethod?: 'central_billing' | 'card' | 'quickbooks' | 'ach' | 'wire' | 'cash';
  startContractDate?: string | null; // ISO o null
}

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

export const emptyStore: Store = {
  id: '',
  _id: '',
  name: '',
  address: '',
  zipCode: '',
  type: 'free',
  location: { type: 'Point', coordinates: [0, 0] },
  ownerId: '',
  description: '',
  slug: '',
  image: '',
  active: false,
  phoneNumber: '',
  provider: 'twilio',
  createdAt: '',
  updatedAt: '',
  customerCount: 0,
};

export interface GetStoresParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: 'elite' | 'basic' | 'free' | '';
  sortBy?: 'customerCount' | 'name'; // puedes ampliar si ordenas por otros campos
  order?: 'asc' | 'desc';
  status?: 'all' | 'active' | 'inactive';

  audienceLt?: string;
}

export const getStores = async ({
  page = 1,
  limit = 25,
  search = '',
  type = '',
  status = 'all',
  sortBy = 'customerCount',
  order = 'desc',
  audienceLt = '',
}: GetStoresParams): Promise<GetStoresResponse> => {
  const params: Record<string, any> = {
    page,
    limit,
    search,
    sortBy,
    order,
  };

  // Normaliza type y status
  if (type) params.type = type;
  if (status !== 'all') params.status = status;

  // 👇 agrega lt solo si viene con valor válido (> 0)
  if (!!audienceLt) {
    params.lt = audienceLt;
  }

  const res = await api.get<GetStoresResponse>('/store/filter', { params });
  return res.data;
};

export const getAllStores = async (): Promise<Store[]> => {
  const res: AxiosResponse<Store[]> = await api.get('/store');
  return res.data;
};

export const getStoreById = async (id: string): Promise<Store> => {
  const res = await api.get(`/store/${id}`);
  return res.data;
};

export const getStoreCustomers = async (
  storeId: string,
  page: number = 1,
  limit: number = 10
): Promise<PaginatedResponse<Customer>> => {
  const res = await api.get(`/store/${storeId}/customers?page=${page}&limit=${limit}`);
  return res.data;
};

export const createStore = async (store: Store): Promise<Store> => {
  const res = await api.post<Store>('/store', store);
  return res.data;
};

export const updateStore = async (id: string, store: Store): Promise<Store> => {
  const res = await api.patch<Store>(`/store/${id}`, store);
  return res.data;
};

export async function updateStorePatch(id: string, body: UpdateStoreBody) {
  const res = await api.patch(`/store/${id}`, body);
  return res.data;
}

export const deleteStore = async (id: string): Promise<void> => {
  await api.delete(`/store/${id}`);
};

export const getStoreByOwnerId = async (ownerId: string): Promise<Store[]> => {
  const res = await api.get<Store[]>(`/store/owner/${ownerId}`);
  return res.data;
};

export const getStoreByName = async (name: string): Promise<Store[]> => {
  const res = await api.get<Store[]>(`/store/name/${name}`);
  return res.data;
};

export const getStoreByAddress = async (address: string): Promise<Store[]> => {
  const res = await api.get<Store[]>(`/store/address/${address}`);
  return res.data;
};

export const getStoreByZipCode = async (zipCode: string): Promise<Store[]> => {
  const res = await api.get<Store[]>(`/store/zipCode/${zipCode}`);
  return res.data;
};

export const getStoreByActive = async (active: boolean): Promise<Store[]> => {
  const res = await api.get<Store[]>(`/store/active/${active}`);
  return res.data;
};

export const getStoreByCreatedAt = async (createdAt: string): Promise<Store[]> => {
  const res = await api.get<Store[]>(`/store/createdAt/${createdAt}`);
  return res.data;
};

export const getStoreByUpdatedAt = async (updatedAt: string): Promise<Store[]> => {
  const res = await api.get<Store[]>(`/store/updatedAt/${updatedAt}`);
  return res.data;
};

export const getStoreByImage = async (image: string): Promise<Store[]> => {
  const res = await api.get<Store[]>(`/store/image/${image}`);
  return res.data;
};

export const getStoreByDescription = async (description: string): Promise<Store[]> => {
  const res = await api.get<Store[]>(`/store/description/${description}`);
  return res.data;
};

export const getStoreByIdAndOwnerId = async (id: string, ownerId: string): Promise<Store[]> => {
  const res = await api.get<Store[]>(`/store/${id}/owner/${ownerId}`);
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
