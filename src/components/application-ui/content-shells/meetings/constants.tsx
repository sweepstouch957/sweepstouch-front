import type { OtterConversation, OtterStatus } from '@/services/otter.service';
import { speakerName, toDate } from '@/services/otter.service';
import type { SemanticRole } from 'src/theme/semantic';

/** Impacto de un bloqueo → color semántico del theme (nunca un hex acá). */
export const IMPACT_ROLE: Record<string, SemanticRole> = {
  alto: 'error',
  medio: 'warning',
  bajo: 'info',
};

export const IMPACT_LABEL: Record<string, string> = {
  alto: 'Alto',
  medio: 'Medio',
  bajo: 'Bajo',
};

/** Qué le decimos al usuario según por qué falló la integración. */
export const STATUS_COPY: Record<string, { title: string; detail: string }> = {
  no_key: {
    title: 'Falta la API key de Otter',
    detail:
      'El ai-service no tiene OTTER_AI_KEY. Cargala en el .env del backend y reiniciá el servicio.',
  },
  unauthorized: {
    title: 'La API key de Otter es inválida',
    detail:
      'Otter rechazó la key (401). Generá una nueva en Otter → Integrations → Developer y actualizá OTTER_AI_KEY.',
  },
  forbidden: {
    title: 'El Public API no está habilitado en la cuenta',
    detail:
      'La key es válida pero Otter responde 403 en todos los endpoints. El Public API es un add-on de plan Business/Enterprise: hay que activarlo desde la cuenta de Otter para que esta pantalla traiga datos.',
  },
  rate_limited: {
    title: 'Otter está limitando las llamadas',
    detail: 'Se pasó el límite de 10 requests por segundo. Probá de nuevo en unos segundos.',
  },
  network: {
    title: 'No se pudo contactar a Otter',
    detail: 'El ai-service no llegó a api.otter.ai. Revisá salida a internet del contenedor.',
  },
};

export const fallbackStatusCopy = (status?: OtterStatus) => ({
  title: 'Otter no está respondiendo',
  detail: status?.message || 'Error desconocido al consultar la API de Otter.',
});

/* ══════════ Derivados de una reunión ══════════ */

export const meetingTitle = (m: OtterConversation) => m.title?.trim() || 'Reunión sin título';

export const meetingDate = (m: OtterConversation) =>
  toDate(m.start_time ?? m.created_at ?? m.end_time);

export const meetingSpeakers = (m: OtterConversation) =>
  (m.speakers || []).map(speakerName).filter(Boolean);

/** Otter manda duración en segundos; algunas cuentas mandan start/end y nada más. */
export function meetingDuration(m: OtterConversation): number | null {
  if (typeof m.duration === 'number' && m.duration > 0) return m.duration;
  const start = toDate(m.start_time);
  const end = toDate(m.end_time);
  if (start && end) return Math.round((end.getTime() - start.getTime()) / 1000);
  return null;
}

export function formatDuration(seconds: number | null): string {
  if (!seconds || seconds < 0) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m} min`;
}

export function formatWhen(date: Date | null): string {
  if (!date) return 'Sin fecha';
  return date.toLocaleString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Iniciales para el avatar del participante. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() || '').join('') || '?';
}
