/** Tipos, etiquetas y preferencias de Sweepstouch Bot. Sin React: se puede probar suelto. */
import type { BaseAIModel } from '@/components/application-ui/content-shells/ai-assistant/models';

export type Turn = {
  id: number;
  from: 'me' | 'ai';
  text: string;
  /** Pantalla a la que el bot propone ir. */
  route?: string;
  routeTitle?: string;
  /** Acciones ya ejecutadas (ej. tarea creada). */
  done?: string[];
};

export type ModelChoice = { provider: BaseAIModel; version: string };
export type BotPrefs = { model: ModelChoice; speak: boolean };
export type VoiceState = 'off' | 'listening' | 'thinking' | 'speaking';

export const PROVIDERS: BaseAIModel[] = ['claude', 'openai', 'gemini'];

export const VOICE_LABEL: Record<VoiceState, string> = {
  off: '',
  listening: 'Te escucho…',
  thinking: 'Consultando…',
  speaking: 'Respondiendo… (toca para interrumpir)',
};

/** Frases para salir del modo voz hablando. */
export const BYE =
  /^\s*(adi[oó]s|hasta luego|ap[aá]gate|eso es todo|salir|terminar|gracias,? eso es todo)\b/i;

/** Sólo pidió que se calle o espere: deja de hablar y sigue escuchando, sin preguntar nada. */
export const HOLD =
  /^\W*(p[eé]rate|esp[eé]rate|espera|espere|para|alto|silencio|c[aá]llate|detente|ya|un momento|momento|ok|okay)(\s+(un\s+)?(momento|tantito|poquito|bot|por favor))*\W*$/i;

export const MIC_DENIED = 'No tengo permiso para usar el micrófono. Actívalo en el navegador.';

/* ── Preferencias (modelo y lectura en voz alta), por navegador ── */

const PREFS_KEY = 'aiBuddy.prefs';
const DEFAULT_PREFS: BotPrefs = { model: { provider: 'claude', version: '' }, speak: false };

export const loadPrefs = (): BotPrefs => {
  try {
    const saved = JSON.parse(localStorage.getItem(PREFS_KEY) || 'null');
    return saved && PROVIDERS.includes(saved.model?.provider)
      ? { ...DEFAULT_PREFS, ...saved }
      : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS; // servidor o almacenamiento bloqueado
  }
};

export const savePrefs = (prefs: BotPrefs) => {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    /* sin almacenamiento: la preferencia dura lo que dure la pestaña */
  }
};

/* ── Qué está haciendo mientras consulta ── */

const TOOL_LABELS: [RegExp, string][] = [
  [/^(db_read|store_audience)$/, 'Consultando la base de datos…'],
  [/^create_task$/, 'Creando la tarea…'],
  [/^navigate$/, 'Buscando la pantalla…'],
  [/meeting/, 'Revisando reuniones…'],
  [/calendar/, 'Revisando el calendario…'],
];

export const toolLabel = (tool: string) =>
  TOOL_LABELS.find(([pattern]) => pattern.test(tool))?.[1] ?? 'Consultando datos…';

/* ── Texto para la voz ── */

/**
 * Lo que se lee en voz alta: sólo lo que va ANTES de la línea '---' (en modo voz el
 * modelo deja ahí el resumen hablado y después el reporte escrito), sin markdown ni enlaces.
 */
export const speakable = (text: string) => {
  const parts = text.split(/\n\s*-{3,}\s*(?:\n|$)/);
  const clean = parts[0]
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[*_`#|>]/g, '')
    .trim();
  // Respuesta larga sin separar lo hablado de lo escrito: se leen sólo las primeras
  // frases. Leerla entera deja a la persona esperando; el resto ya está en pantalla.
  if (parts.length > 1 || clean.length <= SPOKEN_MAX) return clean.slice(0, 1200);
  let spoken = '';
  for (const sentence of sentences(clean)) {
    if (spoken && spoken.length + sentence.length > SPOKEN_MAX) break;
    spoken += `${spoken ? ' ' : ''}${sentence}`;
  }
  return spoken.slice(0, 1200);
};

const SPOKEN_MAX = 420;

/** Parte un texto en frases (Chrome corta las lecturas largas si van en un solo bloque). */
export const sentences = (text: string) =>
  (text.match(/[^.!?\n]+[.!?]*/g) ?? [text]).flatMap((s) => (s.trim() ? [s.trim()] : []));
