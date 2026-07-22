// Catálogo de columnas exportables de tiendas + helpers.
// Única fuente de verdad: el modal pinta los checkboxes desde aquí y el
// generador de XLSX arma las filas con los mismos accessors.

export type StoreExportField = {
  key: string;
  /** Encabezado de la columna en el Excel */
  label: string;
  group: string;
  /** Marcado por defecto al abrir el modal */
  default?: boolean;
  width?: number;
  value: (s: any) => any;
};

/**
 * Marca de la tienda. Usa la relación `brand` si existe; si no, la deriva del
 * nombre cortando en el primer token numérico (el número de calle):
 *   "Key Food 12 W"                    → "Key Food"
 *   "Antillana Meat Market 490 W 207th" → "Antillana Meat Market"
 * ponytail: heurística simple; si el nombre empieza con número (ej. "7-Eleven")
 * devuelve el nombre completo. Asignar la relación `brand` siempre gana.
 */
export function deriveBrand(s: any): string {
  if (s?.brand?.name) return s.brand.name;
  const name = String(s?.name || '').trim();
  if (!name) return '';
  const tokens = name.split(/\s+/);
  const cutAt = tokens.findIndex((t, i) => i > 0 && /^\d/.test(t));
  return cutAt > 0 ? tokens.slice(0, cutAt).join(' ') : name;
}

/** Nombre sin la marca (lo que queda tras el corte), útil para ver la sucursal. */
export function deriveBranch(s: any): string {
  const name = String(s?.name || '').trim();
  const brand = deriveBrand(s);
  if (!name || !brand || name === brand) return '';
  return name.startsWith(brand) ? name.slice(brand.length).trim() : '';
}

const fmtDate = (d: any) => (d ? new Date(d).toISOString().slice(0, 10) : '');

const statusLabel = (s: any) =>
  s?.status === 'suspended'
    ? 'Suspended'
    : s?.status === 'cancelled'
      ? 'Cancelled'
      : s?.status === 'inactive'
        ? 'Inactive'
        : 'Active';

export const STORE_EXPORT_FIELDS: StoreExportField[] = [
  // ── Identificación ──
  { key: 'brand',   label: 'Brand',    group: 'Identificación', default: true, width: 20, value: deriveBrand },
  { key: 'store',   label: 'Store',    group: 'Identificación', default: true, width: 34, value: (s) => s?.name || '' },
  { key: 'branch',  label: 'Branch',   group: 'Identificación', width: 20, value: deriveBranch },
  { key: 'address', label: 'Address',  group: 'Identificación', default: true, width: 30, value: (s) => s?.address || '' },
  { key: 'city',    label: 'City',     group: 'Identificación', width: 16, value: (s) => s?.city || '' },
  { key: 'state',   label: 'State',    group: 'Identificación', width: 8,  value: (s) => s?.state || '' },
  { key: 'zip',     label: 'Zip code', group: 'Identificación', width: 10, value: (s) => s?.zipCode || '' },
  { key: 'access',  label: 'Access code', group: 'Identificación', width: 16, value: (s) => s?.accessCode || '' },

  // ── Estado y audiencia ──
  { key: 'status',    label: 'Status',    group: 'Estado y audiencia', default: true, width: 11, value: statusLabel },
  { key: 'customers', label: 'Customers', group: 'Estado y audiencia', default: true, width: 12, value: (s) => s?.customerCount ?? 0 },

  // ── Campañas ──
  { key: 'sendsCampaigns', label: 'Sends campaigns', group: 'Campañas', default: true, width: 16, value: (s) => (s?.sendsCampaigns ? 'Yes' : 'No') },
  { key: 'campaignsTotal', label: 'Campaigns total', group: 'Campañas', default: true, width: 16, value: (s) => s?.campaignsTotal ?? 0 },
  { key: 'lastCampaign',   label: 'Last campaign',   group: 'Campañas', default: true, width: 14, value: (s) => fmtDate(s?.lastCampaignAt) },

  // ── Comercial ──
  { key: 'membership', label: 'Membership',     group: 'Comercial', width: 12, value: (s) => s?.membershipType || '' },
  { key: 'payment',    label: 'Payment method', group: 'Comercial', width: 15, value: (s) => s?.paymentMethod || '' },
  { key: 'provider',   label: 'Provider',       group: 'Comercial', width: 11, value: (s) => s?.provider || '' },
  { key: 'createdAt',  label: 'Created',        group: 'Comercial', width: 12, value: (s) => fmtDate(s?.createdAt) },

  // ── Contacto ──
  { key: 'email', label: 'Email', group: 'Contacto', width: 26, value: (s) => s?.email || '' },
  { key: 'phone', label: 'Phone', group: 'Contacto', width: 16, value: (s) => [s?.countryCode, s?.phoneNumber].filter(Boolean).join(' ') },

  // ── Facturación ──
  { key: 'pending',      label: 'Balance pending', group: 'Facturación', width: 15, value: (s) => s?.billing?.totalPending ?? 0 },
  { key: 'daysOverdue',  label: 'Days overdue',    group: 'Facturación', width: 13, value: (s) => s?.billing?.maxDaysOverdue ?? 0 },
  { key: 'installments', label: 'Installments',    group: 'Facturación', width: 12, value: (s) => s?.billing?.installmentsNeeded ?? '' },
];

export const STORE_EXPORT_GROUPS = Array.from(
  new Set(STORE_EXPORT_FIELDS.map((f) => f.group))
);

export const DEFAULT_EXPORT_KEYS = STORE_EXPORT_FIELDS.filter((f) => f.default).map((f) => f.key);

/** Arma las filas del Excel respetando el orden del catálogo y las columnas elegidas. */
export function buildExportRows(stores: any[], selectedKeys: string[]) {
  const fields = STORE_EXPORT_FIELDS.filter((f) => selectedKeys.includes(f.key));
  const rows = stores.map((s) =>
    fields.reduce<Record<string, any>>((row, f) => {
      row[f.label] = f.value(s);
      return row;
    }, {})
  );
  return { rows, cols: fields.map((f) => ({ wch: f.width ?? 14 })) };
}
