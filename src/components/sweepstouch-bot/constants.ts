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
export const speakable = (text: string) =>
  text
    .split(/\n\s*-{3,}\s*(?:\n|$)/)[0]
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[*_`#|>]/g, '')
    .slice(0, 1200)
    .trim();

/** Parte un texto en frases (Chrome corta las lecturas largas si van en un solo bloque). */
export const sentences = (text: string) =>
  (text.match(/[^.!?\n]+[.!?]*/g) ?? [text]).flatMap((s) => (s.trim() ? [s.trim()] : []));
