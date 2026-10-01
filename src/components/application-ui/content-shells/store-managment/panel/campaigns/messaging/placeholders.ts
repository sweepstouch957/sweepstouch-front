/**
 * Placeholders que se ofrecen al escribir un mensaje (formulario de campaña y plantillas).
 * Distinguen mayúsculas: "#storename" NO se reemplaza. La vista previa real los resuelve con
 * el mismo pipeline del envío (campaign-service POST /templates/preview).
 */
export interface PlaceholderDef {
  key: string;
  label: string;
}

export const PLACEHOLDERS: readonly PlaceholderDef[] = [
  { key: '#n', label: 'Salto de línea' },
  // Por cliente en el envío: cada quien recibe su nombre; sin nombre real se omite limpio.
  {
    key: '#name',
    label: 'Nombre del cliente — personalizado para cada uno; si no tiene, se omite',
  },
  { key: '#storeName', label: 'Nombre de la tienda con dirección' },
  // Marca sola y calle sola: "Super Supermarket" / "31 Memorial Dr, Paterson, NJ 07505".
  { key: '#brand', label: 'Nombre de la tienda sin dirección (ej. Super Supermarket)' },
  { key: '#address', label: 'Sólo la dirección (ej. 31 Memorial Dr, Paterson, NJ 07505)' },
  // Ocultos por ahora (sep 2026): no se usan en las campañas nuevas. El backend los sigue
  // reemplazando si una campaña vieja los tiene; para volver a ofrecerlos, descomentar.
  // { key: '#referralLink', label: 'Link de referido' },
  { key: '#disclaimer', label: 'Texto legal' },
  { key: '#linktree', label: 'Linktree de la tienda' },
  // Mismo destino que #linktree por el short permanente (swtrcs.com/s/…): ~60 caracteres menos.
  {
    key: '#linktreeShort',
    label: 'Linktree corto — swtrcs.com/s/… (mismo link, 60 caracteres menos)',
  },
  // { key: '#lead', label: 'Lead / Completar perfil' },
  // { key: '#linkrcs', label: 'Link RCS único por cliente (activa el flujo RCS)' },
  { key: '#linkprercs', label: 'Link Pre-RCS único por cliente (sólo ofertas + QR de caja)' },
  // Linktree CON la sesión del cliente: entra sin que le pidan el código. Vence a los 30 días.
  {
    key: '#linklogin',
    label: 'Linktree con sesión — entra sin código (link corto, vence en 30 días)',
  },
  { key: '#ahorro', label: 'Ahorro semanal de la tienda ($)' },
];

/**
 * Marca y calle de una tienda (misma regla que campaign-service utils/storeIdentity.js):
 * "Super Supermarket 31 Memorial Dr, Paterson, NJ 07505, USA" → "Super Supermarket" /
 * "31 Memorial Dr, Paterson, NJ 07505". Para las vistas previas del panel.
 */
export function storeBrandOf(name?: string): string {
  const n = String(name || '').trim();
  const m = n.match(/^(.*?\D)\s+(\d[\s\S]*)$/);
  return (m ? m[1] : n).trim();
}
export function storeStreetOf(address?: string): string {
  const src = String(address || '').trim();
  const m = src.match(/(^|\s)(\d[\s\S]*)$/);
  return (m ? m[2] : src).replace(/,?\s*USA\s*$/i, '').trim();
}
