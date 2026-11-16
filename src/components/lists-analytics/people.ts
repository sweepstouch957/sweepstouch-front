/** Cómo se muestra un cliente: nombre, si no teléfono con formato; nunca el id. */

/** +12015551234 / 2015551234 → (201) 555-1234; otros formatos tal cual. */
export function formatPhone(raw?: string | null): string {
  const d = String(raw ?? '').replace(/\D/g, '');
  const ten = d.length === 11 && d.startsWith('1') ? d.slice(1) : d;
  if (ten.length === 10) return `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}`;
  return String(raw ?? '').trim();
}

export function displayName(name?: string | null, phone?: string | null): string {
  return (name ?? '').trim() || formatPhone(phone) || 'Cliente sin nombre';
}
