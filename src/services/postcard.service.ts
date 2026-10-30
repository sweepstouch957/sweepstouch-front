// Postcard de la tienda — tracking-service.
// /tracking/list-admin exige JWT (lectura con cifras + guardado).
// El QR es fijo por tienda: …/postal?slug=<slug> (PNG en /tracking/shopping-list/postcard/qr/:slug).

import { api } from '@/libs/axios';

export interface PostcardItem {
  _id?: string;
  name: string;
  price: string;
  originalPrice?: string;
  unit?: string;
  imageUrl?: string;
  category?: string;
}

export interface PostcardData {
  items: PostcardItem[];
  updatedAt: string | null;
  stats: { scans: number; lists: number; validated: number; newCustomers: number };
}

export const postcardService = {
  async get(storeSlug: string): Promise<PostcardData> {
    const { data } = await api.get(`/tracking/list-admin/postcard/${storeSlug}`);
    return data;
  },
  async save(storeSlug: string, items: PostcardItem[]): Promise<PostcardData> {
    const { data } = await api.put(`/tracking/list-admin/postcard/${storeSlug}`, { items });
    return data;
  },
  async qrBlob(storeSlug: string): Promise<Blob> {
    const { data } = await api.get(`/tracking/shopping-list/postcard/qr/${storeSlug}`, { responseType: 'blob' });
    return data;
  },
};
