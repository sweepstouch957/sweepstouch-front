import { type SemanticRole } from 'src/theme/semantic';

/* ─── Helpers ─────────────────────────────────────────────── */
export function isImageUrl(url: string) {
  return /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(url);
}

export function getAudienceInfo(
  count: number | undefined
): { label: string; role: SemanticRole } | null {
  if (!count || count === 0) return null;
  const k = count >= 1000 ? `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}k` : `${count}`;
  if (count >= 30000) return { label: `${k} · Crítico`, role: 'error' };
  if (count >= 10000) return { label: `${k} · Urgente`, role: 'warning' };
  return { label: k, role: 'success' };
}
