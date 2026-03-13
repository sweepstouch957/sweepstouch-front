import { api } from '@/libs/axios';

export interface Brand {
  id?: string;
  _id?: string;
  name: string;
  slug?: string;
  image?: string;
  active?: boolean;
}

export const getBrands = async () => {
  const res = await api.get('/store/meta/brand');
  return res.data?.docs || res.data || [];
};

export const createBrand = async (data: Partial<Brand>) => {
  const res = await api.post('/store/meta/brand', data);
  return res.data;
};

export const updateBrand = async (id: string, data: Partial<Brand>) => {
  const res = await api.patch(`/store/meta/brand/${id}`, data);
  return res.data;
};

const brandService = {
  getBrands,
  createBrand,
  updateBrand,
};

export default brandService;
