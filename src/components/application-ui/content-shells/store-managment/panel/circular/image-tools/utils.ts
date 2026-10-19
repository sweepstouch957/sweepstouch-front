import type { StoreProduct } from '@/services/circular.service';
import type { ProductFormValues } from './constants';

/** Imagen dentro de un evento de pegado (captura de pantalla, "copiar imagen"…). */
export function imageFromPaste(e: ClipboardEvent | React.ClipboardEvent): File | null {
  const items = (e as ClipboardEvent).clipboardData?.items;
  if (!items) return null;
  for (const it of Array.from(items)) {
    if (it.kind === 'file' && it.type.startsWith('image/')) {
      const f = it.getAsFile();
      if (f)
        return new File(
          [f],
          f.name && f.name !== 'image.png' ? f.name : `pegada-${Date.now()}.png`,
          { type: f.type }
        );
    }
  }
  return null;
}

/** ¿El foco está en un campo de texto? Ahí Ctrl+V es del campo, no nuestro. */
export const isTypingTarget = (t: EventTarget | null) => {
  const el = t as HTMLElement | null;
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
};

export const errMsg = (e: any, fallback: string) =>
  e?.response?.data?.error || e?.message || fallback;

/** ISO → "YYYY-MM-DD" del día en la hora de las tiendas (lo que muestra un <input type=date>). */
export const toDayInput = (iso: string) =>
  new Date(iso).toLocaleDateString('en-CA', { timeZone: 'America/New_York' });

/** Precio pendiente del producto (si todavía no sale), o null. */
export const pendingOf = (product: StoreProduct | null) =>
  product?.pending?.from ? product.pending : null;

/** Valores iniciales del formulario. Con precio pendiente se edita el que VA a salir. */
export function productDefaults(product: StoreProduct | null): ProductFormValues {
  const pend = pendingOf(product);
  return {
    name: product?.name ?? '',
    price: (pend ? pend.price : product?.price) ?? '',
    regular: (pend ? pend.originalPrice : product?.originalPrice) ?? '',
    pendingDay: pend ? toDayInput(pend.from) : '',
    condition: product?.offerCondition ?? '',
    packQty: product?.packQty ? String(product.packQty) : '',
    packUnit: product?.packUnit ?? '',
    counterOnly: !!product?.counterOnly,
    maxPerCustomer: product?.maxPerCustomer ? String(product.maxPerCustomer) : '',
    aliases: (product?.aliases || []).join(', '),
    aiPrompt: '',
  };
}

/** Cuerpo que se guarda: lo que tipea la persona, normalizado. */
export function productBody(v: ProductFormValues, imageUrl: string) {
  const qty = Number(v.packQty);
  const max = Number(v.maxPerCustomer);
  return {
    name: v.name.trim(),
    price: v.price.trim(),
    originalPrice: v.regular.trim(),
    imageUrl,
    offerCondition: v.condition.trim(),
    packQty: qty > 1 ? Math.floor(qty) : 0,
    packUnit: qty > 1 ? v.packUnit.trim() : '',
    counterOnly: v.counterOnly,
    maxPerCustomer: max > 0 ? Math.floor(max) : null,
    aliases: v.aliases
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  };
}

export type ProductBody = ReturnType<typeof productBody>;
