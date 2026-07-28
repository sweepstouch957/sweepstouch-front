// services/product.service.ts — Product Repository API layer
import { api } from '@/libs/axios';

export interface SupabaseProduct {
  id: string;
  id_product: number;
  desc_full_product: string;
  brand: string;
  url_image?: string;
  has_image?: boolean;
  status_active?: boolean;
  score_product?: number;
  id_category?: number;
  id_subcategory?: number;
  search_text?: string;
  size_product?: string;
  upc?: string;
}

export interface BrandCount {
  brand: string;
  count: number;
  first_letter: string;
  total_count: number;
}

export interface ProductSearchParams {
  q?: string;
  page?: number;
  limit?: number;
  category?: number;
  brand?: string;
  hasImage?: boolean;
}

export interface ProductSearchResponse {
  data: SupabaseProduct[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    has_more: boolean;
  };
}

/**
 * Search products in the Supabase product repository
 */
export async function searchProducts(params: ProductSearchParams): Promise<ProductSearchResponse> {
  const searchParams = new URLSearchParams();
  if (params.q) searchParams.set('q', params.q);
  if (params.page !== undefined) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.category) searchParams.set('category', String(params.category));
  if (params.brand) searchParams.set('brand', params.brand);
  if (params.hasImage !== undefined) searchParams.set('hasImage', String(params.hasImage));

  const res = await api.get(`/products?${searchParams.toString()}`);
  return res.data;
}

/**
 * Get brand counts filtered by first letter
 */
export async function getBrands(letter: string = 'A'): Promise<BrandCount[]> {
  const res = await api.get(`/products/brands?letter=${encodeURIComponent(letter)}`);
  return res.data;
}

/**
 * Find the best matching product image for a given product name
 */
export async function findProductImage(productName: string): Promise<string | null> {
  try {
    const searchTerm = productName.split(' ').slice(0, 2).join(' ');
    const result = await searchProducts({ q: searchTerm, page: 0, limit: 1, hasImage: true });
    const match = result?.data?.[0];
    return match?.url_image || null;
  } catch {
    return null;
  }
}
