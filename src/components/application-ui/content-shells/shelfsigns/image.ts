/**
 * Pipeline de imágenes del flyer, todo en el navegador:
 * archivo → dataURL → versión reducida para la IA → recortes en resolución original.
 */
import { AI_MAX_IMAGE_SIDE } from './constants';
import type { PhotoBox, ShelfSignProduct } from './types';

export function readAsDataURL(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
    reader.readAsDataURL(file);
  });
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudo cargar la imagen'));
    img.src = src;
  });
}

/**
 * Reduce el flyer antes de mandarlo al modelo: los originales de imprenta pesan
 * decenas de MB y la subida se vuelve el cuello de botella. Los recortes NO
 * salen de acá, salen del original en resolución completa.
 */
export async function downscaleToFile(dataURL: string, fileName: string): Promise<File> {
  const img = await loadImage(dataURL);
  const scale = Math.min(1, AI_MAX_IMAGE_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.round(img.naturalWidth * scale);
  const h = Math.round(img.naturalHeight * scale);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d')?.drawImage(img, 0, 0, w, h);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', 0.85)
  );
  if (!blob) throw new Error('No se pudo procesar la imagen');

  const base = fileName.replace(/\.[^/.]+$/, '') || 'flyer';
  return new File([blob], `${base}.jpg`, { type: 'image/jpeg' });
}

/** Recorta una caja (porcentajes 0-100) de la imagen y devuelve un PNG dataURL. */
export function cropFromImage(img: HTMLImageElement, box: PhotoBox): string | null {
  try {
    const W = img.naturalWidth;
    const H = img.naturalHeight;
    const x = Math.max(0, (box.x / 100) * W);
    const y = Math.max(0, (box.y / 100) * H);
    const w = Math.max(4, Math.min(W - x, (box.w / 100) * W));
    const h = Math.max(4, Math.min(H - y, (box.h / 100) * H));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d')?.drawImage(img, x, y, w, h, 0, 0, w, h);
    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}

/**
 * Recorta la foto de cada producto desde el flyer original.
 *
 * Las cajas de Claude son aproximadas — a veces salen bastante más grandes que
 * la foto (ver deuda técnica: refinar con Gemini es fase 2). Por eso el editor
 * deja quitar o reemplazar la foto cartón por cartón.
 */
export async function attachPhotos(
  items: ShelfSignProduct[],
  fullResDataURL: string
): Promise<ShelfSignProduct[]> {
  try {
    const img = await loadImage(fullResDataURL);
    if (!img.naturalWidth) return items;
    return items.map((p) => (p.photoBox ? { ...p, photo: cropFromImage(img, p.photoBox) } : p));
  } catch {
    return items;
  }
}
