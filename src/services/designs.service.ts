/**
 * designs.service.ts
 *
 * Designs Studio (Shelfsigns). Único punto de salida HTTP del módulo, sobre el
 * cliente axios compartido (`@/libs/axios`).
 *
 * Backend: módulo `designs` de ai-service, expuesto por el gateway en
 * `/api/designs` sólo para roles `admin` y `design`. Nada de esto pasa por el
 * pipeline del AI Assistant, así que no deja conversaciones en el historial.
 */
import { api } from '@/libs/axios';
import { uploadFile, type Attachment } from '@/services/ai.service';

const BASE = '/designs/shelfsigns';

/* ══════════ Types ══════════ */

/** Recorte dentro del flyer, en porcentajes 0-100 del ancho/alto. */
export interface PhotoBoxDto {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Producto crudo tal como lo devuelve el modelo. Se normaliza en `parse.ts`. */
export interface RawExtractedProduct {
  name?: string;
  details?: string;
  name2?: string;
  details2?: string;
  qty?: number;
  dollars?: number;
  cents?: number;
  unit?: string;
  regularPrice?: string;
  save?: string;
  conditions?: string;
  photoBox?: PhotoBoxDto | null;
}

export interface ExtractResponse {
  products: RawExtractedProduct[];
  /** El modelo se quedó sin espacio: faltan productos del flyer. */
  truncated?: boolean;
  inputTokens?: number;
  outputTokens?: number;
}

export interface DetectedBox extends PhotoBoxDto {
  product: string;
}

export type ProductImageSource = 'imgly' | 'enhance' | 'designer';

export interface ProductImage {
  _id?: string;
  slug: string;
  name: string;
  url: string;
  source: ProductImageSource;
  updatedAt?: string;
}

export interface SaveProductImageDto {
  slug?: string;
  name?: string;
  url: string;
  source?: ProductImageSource;
}

interface CutoutDto {
  /** Flyer completo (se recorta con `box`) o un recorte ya hecho (sin `box`). */
  imageUrl: string;
  box?: PhotoBoxDto | null;
  slug?: string;
  name?: string;
}

/* ══════════ Slug ══════════ */

/**
 * Clave de la librería de productos. Mismo criterio que `slugify` del backend:
 * si los dos lados no coinciden, la librería nunca acierta y todo se re-recorta.
 */
export const productSlug = (name: string): string =>
  String(name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);

/* ══════════ API ══════════ */

export const designsService = {
  /**
   * Sube el flyer a Cloudinary. Reusa `/ai/upload` (mismo Cloudinary, mismo
   * límite de 20 MB) — el backend necesita una URL, no el archivo.
   */
  uploadFlyer: async (file: File): Promise<Attachment> => {
    const attachment = await uploadFile(file);
    return { ...attachment, type: 'image' };
  },

  /** Flyer → productos con precios y caja de foto aproximada. Una sola pasada. */
  extractFlyer: async (imageUrl: string): Promise<ExtractResponse> => {
    const { data } = await api.post(`${BASE}/extract`, { imageUrl });
    return { products: data?.products || [], truncated: !!data?.truncated, ...data };
  },

  /** Gemini localiza la foto de cada producto. `refine` = segunda pasada, más precisa. */
  detectBoxes: async (
    imageUrl: string,
    products: string[],
    refine = false
  ): Promise<DetectedBox[]> => {
    const { data } = await api.post(`${BASE}/detect-boxes`, { imageUrl, products, refine });
    return data?.boxes || [];
  },

  /** Recorte en resolución original + fondo quitado localmente. Gratis, sin APIs pagas. */
  removeBackground: async (dto: CutoutDto): Promise<string> => {
    const { data } = await api.post(`${BASE}/remove-background`, dto);
    return data?.url || '';
  },

  /** Nano Banana. Sólo por acción explícita del diseñador: es el paso caro. */
  enhance: async (dto: CutoutDto): Promise<string> => {
    const { data } = await api.post(`${BASE}/enhance`, dto);
    return data?.url || '';
  },

  /** Librería: las que ya existen. Se consulta ANTES de recortar nada. */
  getProductImages: async (slugs: string[]): Promise<ProductImage[]> => {
    if (!slugs.length) return [];
    const { data } = await api.get(`${BASE}/product-images`, {
      params: { slugs: slugs.join(',') },
    });
    return data?.images || [];
  },

  /** Alta/actualización manual — así el equipo de diseño carga sus PNG limpios. */
  saveProductImages: async (items: SaveProductImageDto[]): Promise<ProductImage[]> => {
    const { data } = await api.post(`${BASE}/product-images`, { items });
    return data?.images || [];
  },

  deleteProductImage: async (slug: string): Promise<void> => {
    await api.delete(`${BASE}/product-images/${encodeURIComponent(slug)}`);
  },
};

export default designsService;
