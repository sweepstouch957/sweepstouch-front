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
  { key: '#storeName', label: 'Nombre de la tienda' },
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
