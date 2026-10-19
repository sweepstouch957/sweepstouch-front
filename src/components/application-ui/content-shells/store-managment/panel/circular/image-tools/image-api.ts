/**
 * Toda imagen que entra por las herramientas termina como URL alojada. "Quitar fondo", el
 * recorte del circular y el pegado pasan por la limpieza IA (ai-service /product-image-edit):
 * solo el producto, sin precio ni texto, fondo transparente, HD, WebP liviano. El recorte del
 * circular se hace EN EL SERVIDOR (caja en %): el flyer es de otro origen y un canvas del
 * navegador quedaría bloqueado por CORS.
 */
import { circularService } from '@/services/circular.service';
import { uploadCampaignImage } from '@/services/upload.service';
import type { PctBox } from './constants';

/** Limpieza IA: deja SOLO el producto (sin precio, texto ni fondo), en HD, sobre su tabla si
 *  es comida fresca. Es la misma que usa la extracción del circular. El recortador local
 *  gratis sólo borraba el fondo: el precio y las letras quedaban pegados al producto. */
export async function aiClean(
  imageUrl: string,
  name?: string,
  box?: PctBox,
  instructions?: string
): Promise<string> {
  const r = await circularService.aiCleanProductImage(
    imageUrl,
    name,
    box,
    instructions || undefined
  );
  if (!r?.imageUrl) throw new Error('La IA no devolvió la imagen');
  return r.imageUrl;
}

/** Sube el archivo y, si se pide, lo limpia con IA. Devuelve la URL final. */
export async function hostImage(
  file: File,
  opts: { clean: boolean; name?: string }
): Promise<string> {
  const up = await uploadCampaignImage(file, 'store-products');
  return opts.clean ? aiClean(up.url, opts.name) : up.url;
}
