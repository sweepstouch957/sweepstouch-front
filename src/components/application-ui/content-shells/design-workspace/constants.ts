/**
 * Workspace › Diseño — constantes del tablero, etiquetas y tabla de tiempos.
 *
 * Los colores se expresan como rol semántico del theme (`primary`, `warning`…),
 * nunca como hex: así el selector de theme y el dark mode siguen funcionando.
 */
import type { SemanticRole } from 'src/theme/semantic';
import type { AuditorArea, CardStatus, CardTag, CardType, DesignRole, WeekDay } from './types';

/* ── Columnas del tablero, en orden ────────────────────────────────────── */

export interface StatusMeta {
  key: CardStatus;
  label: string;
  role: SemanticRole;
  /** Ayuda breve para la cabecera de la columna. */
  hint: string;
}

export const BOARD_STATUSES: StatusMeta[] = [
  {
    key: 'nuevo_requerimiento',
    label: 'Nuevo requerimiento',
    role: 'info',
    hint: 'Entra todo lo nuevo, manual o automático',
  },
  {
    key: 'productos_definidos',
    label: 'Productos definidos',
    role: 'info',
    hint: 'Lista cargada y diseñador asignado',
  },
  {
    key: 'disenandose',
    label: 'Diseñándose',
    role: 'primary',
    hint: 'Cronómetro de elaboración corriendo',
  },
  {
    key: 'on_hold',
    label: 'On Hold',
    role: 'warning',
    hint: 'Pausada por coordinación; el cronómetro se congela',
  },
  { key: 'auditoria', label: 'Auditoría', role: 'secondary', hint: 'Revisión de diseño y contenido' },
  {
    key: 'errores_updates',
    label: 'Errores / Updates',
    role: 'error',
    hint: 'Requiere causa: error del diseñador o update del cliente',
  },
  {
    key: 'esperando_aprobacion',
    label: 'Esperando aprobación',
    role: 'warning',
    hint: 'Auditoría pasada, falta el OK del coordinador',
  },
  { key: 'finalizado', label: 'Finalizado', role: 'success', hint: 'Aprobada y entregada' },
  {
    key: 'agendado',
    label: 'Agendado',
    role: 'success',
    hint: 'La campaña quedó agendada en la plataforma',
  },
];

const STATUS_BY_KEY = new Map(BOARD_STATUSES.map((s) => [s.key, s]));

export const statusMeta = (key: CardStatus): StatusMeta =>
  STATUS_BY_KEY.get(key) ?? BOARD_STATUSES[0];

/* ── Tipos y etiquetas ─────────────────────────────────────────────────── */

export const TYPE_LABEL: Record<CardType, string> = {
  mms: 'MMS',
  mms_circular: 'MMS',
  especial: 'Diseño Especial',
};

export const TAG_LABEL: Record<CardTag, string> = {
  lista_creada: 'Lista creada',
  shelfsigns: 'Shelfsigns',
  prioridad: 'Prioridad',
};

export const TAG_ROLE: Record<CardTag, SemanticRole> = {
  lista_creada: 'info',
  shelfsigns: 'secondary',
  prioridad: 'error',
};

export const ALL_TAGS: CardTag[] = ['lista_creada', 'shelfsigns', 'prioridad'];

export const ROLE_LABEL: Record<DesignRole, string> = {
  admin: 'Admin',
  designer: 'Diseñador',
};

export const AREA_LABEL: Record<AuditorArea, string> = {
  diseño: 'Diseño',
  contenido: 'Contenido',
};

export const CAUSE_LABEL = {
  error_disenador: 'Error del diseñador',
  update_cliente: 'Update del cliente',
} as const;

export const WEEKDAY_LABEL: Record<WeekDay, string> = {
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
};

export const WEEKDAYS: WeekDay[] = [1, 2, 3, 4, 5];

/* ── Tabla de valoración de tiempos ────────────────────────────────────── */

/**
 * Minutos base según cantidad de productos.
 * Regla general: 🟢 ≤ base · 🟡 base+1 a base+10 · 🔴 > base+10.
 */
export interface TimeBracket {
  /** Tope de productos del tramo. */
  maxProducts: number;
  label: string;
  base: number;
}

export const TIME_TABLE: TimeBracket[] = [
  { maxProducts: 4, label: '1–4', base: 30 },
  { maxProducts: 6, label: '5–6', base: 40 },
  { maxProducts: 8, label: '7–8', base: 45 },
  { maxProducts: 10, label: '9–10', base: 50 },
  { maxProducts: 14, label: '11–14', base: 70 },
  { maxProducts: 20, label: '15–20', base: 90 },
  { maxProducts: 30, label: '21–30', base: 120 },
];

/** Margen del tramo amarillo, en minutos. */
export const LATE_MARGIN = 10;

/* ── Calidad por errores de auditoría ──────────────────────────────────── */

/**
 * Umbrales pendientes de definición con Pedro (ver brief). Quedan como
 * constantes para poder moverlos sin tocar la lógica: son errores promedio
 * por diseño en el período mirado.
 */
export const QUALITY_THRESHOLDS = {
  /** ≤ este promedio: 🟢 Bueno */
  good: 0.5,
  /** ≤ este promedio: 🟡 Mejorable. Por encima: 🔴 Revisar */
  fair: 1.5,
};

export const QUALITY_META = {
  good: { label: 'Bueno', role: 'success' as SemanticRole, emoji: '🟢' },
  fair: { label: 'Mejorable', role: 'warning' as SemanticRole, emoji: '🟡' },
  poor: { label: 'Revisar', role: 'error' as SemanticRole, emoji: '🔴' },
};

export const RATING_META = {
  on_time: { label: 'A tiempo', role: 'success' as SemanticRole, emoji: '🟢' },
  late: { label: 'Tarde', role: 'warning' as SemanticRole, emoji: '🟡' },
  over: { label: 'Fuera de tiempo', role: 'error' as SemanticRole, emoji: '🔴' },
  running: { label: 'En curso', role: 'info' as SemanticRole, emoji: '⏳' },
  pending: { label: 'Sin iniciar', role: 'secondary' as SemanticRole, emoji: '—' },
};

/** Clave de persistencia del mock en localStorage. */
export const STORAGE_KEY = 'sweepstouch:design-workspace:v1';
