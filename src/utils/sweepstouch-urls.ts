/**
 * Los dominios públicos de Sweepstouch, en un solo lugar.
 *
 * Estaban hardcodeados en ~15 archivos con cuatro nombres distintos para lo
 * mismo (`KIOSK_BASE`, `KIOSKO_BASE`, `kioskBase`, `LINKS_BASE`, `LINKTREE_URL`)
 * y sólo algunos respetaban el env: cambiar un dominio obligaba a buscarlos de a
 * uno y el que se olvidara quedaba apuntando al viejo.
 *
 * Si agregás un subdominio, va acá. Nunca escribas `https://…sweepstouch.com`
 * suelto en un componente.
 */

/** Sin barra final: todos los builders la ponen ellos. */
const origin = (envValue: string | undefined, fallback: string): string =>
  (envValue || fallback).replace(/\/+$/, '');

/** Kiosko de piso — la tablet. */
export const KIOSK_ORIGIN = origin(process.env.NEXT_PUBLIC_KIOSK_ORIGIN, 'https://kiosko.sweepstouch.com');

/** Linktree público de la tienda y páginas RCS. */
export const LINKTREE_ORIGIN = origin(process.env.NEXT_PUBLIC_LINKTREE_URL, 'https://links.sweepstouch.com');

/** Portal del comerciante. */
export const MERCHANT_ORIGIN = origin(process.env.NEXT_PUBLIC_MERCHANT_ORIGIN, 'https://merchant.sweepstouch.com');

/** Opt-in público: el destino de los QR impresos. */
export const OPTIN_ORIGIN = origin(process.env.NEXT_PUBLIC_OPTIN_ORIGIN, 'https://st.sweepstouch.com');

/**
 * Link del kiosko para una tienda. Es el que carga soporte técnico en las
 * tablets. Devuelve '' sin slug para que el caller decida qué mostrar.
 */
export function kioskUrl(slug?: string | null): string {
  return slug ? `${KIOSK_ORIGIN}/?slug=${encodeURIComponent(slug)}` : '';
}

/** Kiosko por accessCode: el fallback cuando la tienda todavía no tiene slug. */
export function kioskUrlByAccessCode(storeId: string): string {
  return `${KIOSK_ORIGIN}/?ac=${encodeURIComponent(storeId)}`;
}

/** Linktree público de la tienda. */
export function linktreeUrl(slug?: string | null): string {
  return slug ? `${LINKTREE_ORIGIN}/?slug=${encodeURIComponent(slug)}` : '';
}

/** Opt-in público de la tienda (QR impreso, tablet). */
export function optinUrl(slug?: string | null): string {
  return slug ? `${OPTIN_ORIGIN}/?slug=${encodeURIComponent(slug)}` : '';
}

/**
 * Plantilla de la página RCS. `{customerId}` queda literal a propósito: lo
 * reemplaza el proveedor al enviar, no nosotros. Sin `storeSlug` devuelve la
 * plantilla completa con `{storeSlug}` también sin resolver.
 */
export function rcsTemplateUrl(storeSlug?: string, circularId?: string): string {
  if (!storeSlug) return `${LINKTREE_ORIGIN}/rcs/{customerId}?store={storeSlug}`;
  const circular = circularId ? `&circular=${circularId}` : '';
  return `${LINKTREE_ORIGIN}/rcs/{customerId}?store=${storeSlug}${circular}`;
}

/** Entrar al portal del comerciante como esa tienda (impersonar por accessCode). */
export function merchantSwitchUrl(storeId: string): string {
  return `${MERCHANT_ORIGIN}/?ac=${encodeURIComponent(storeId)}`;
}
