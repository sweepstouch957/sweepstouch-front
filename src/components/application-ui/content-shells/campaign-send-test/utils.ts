/** Formato de teléfono y detección de PDF (no se manda como MMS). */
/* ────────────────────────────── helpers ────────────────────────────── */
export const formatPhone = (p: string) => {
  const d = p.replace(/\D/g, '');
  if (d.length === 11 && d.startsWith('1'))
    return `+1 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `+1 (${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  return `+${d}`;
};

/** Returns true if the URL points to a PDF (can't be sent as MMS image) */
export const isPdfUrl = (url?: string | null): boolean => !!url && /\.pdf(\?.*)?$/i.test(url);
