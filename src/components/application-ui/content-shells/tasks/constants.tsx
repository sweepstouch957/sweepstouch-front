import type { Recurrence } from '@/services/task.service';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import type { Theme } from '@mui/material/styles';
import { severityColor, tint, type SemanticRole } from 'src/theme/semantic';

export type TaskFormState = {
  title: string;
  description: string;
  priority: string;
  assigneeId: string;
  assigneeName: string;
  assigneeAvatar: string;
  dueDate: string;
  /** Manual de Cowork: una línea que diga cómo sabremos que quedó lista. */
  closureCriteria: string;
  /** Opcionales: suman contexto, nunca frenan el guardado. */
  beneficiary: string;
  nextStep: string;
  impact: string;
  /** Sólo se manda cuando se mueve la fecha de una tarea que ya existía. */
  rescheduleReason: string;
  /** Sólo cuando el estado es "blocked". */
  blockedReason: string;
  blockerOwner: string;
  aiContext: string;
  tags: string;
  progress: number;
  recurrence: Recurrence;
};

export type ProjectFormState = {
  name: string;
  description: string;
  color: string;
};

export const EMPTY_TASK_FORM: TaskFormState = {
  title: '',
  description: '',
  priority: 'medium',
  assigneeId: '',
  assigneeName: '',
  assigneeAvatar: '',
  dueDate: '',
  closureCriteria: '',
  beneficiary: '',
  nextStep: '',
  impact: '',
  rescheduleReason: '',
  blockedReason: '',
  blockerOwner: '',
  aiContext: '',
  tags: '',
  progress: 0,
  recurrence: 'none',
};

/** Los 4 campos que hacen válida una tarea (Manual de Cowork, secc. 3). */
export function missingTaskFields(form: TaskFormState): string[] {
  const missing: string[] = [];
  if (!form.title.trim()) missing.push('título');
  if (!form.assigneeId) missing.push('responsable');
  if (!form.dueDate && form.recurrence === 'none') missing.push('fecha límite');
  if (!form.closureCriteria.trim()) missing.push('criterio de cierre');
  return missing;
}

/** Un título sin verbo es un recordatorio, no una tarea ("Evento NSA"). */
export function titleLacksVerb(title: string): boolean {
  const t = title.trim();
  if (!t) return false;
  return !/^[a-záéíóúñ]+(ar|er|ir)\b/i.test(t) && t.split(/\s+/).length < 3;
}

export const IMPACT_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Sin especificar" },
  { value: "ingreso", label: "💵 Ingreso" },
  { value: "campanas", label: "📣 Campañas" },
  { value: "audiencia", label: "👥 Audiencia" },
  { value: "interno", label: "🏢 Interno" },
];

export const PRIORITY_CONFIG: Record<string, { label: string; icon: string }> = {
  critical: { label: 'Critical', icon: '🔴' },
  high: { label: 'High', icon: '🟠' },
  medium: { label: 'Medium', icon: '🟡' },
  low: { label: 'Low', icon: '🟢' },
};

/**
 * Estos metadatos sólo dependen del theme, pero se piden en cada render de cada
 * tarjeta y columna. Se calculan una vez por theme y se reutilizan: además de
 * ahorrar el cálculo, la referencia estable no rompe los `memo` de abajo.
 */
type PriorityMeta = { label: string; icon: string; color: string };
type StatusMeta = { label: string; color: string; bg: string };

type ThemeMetaCache = {
  priority: Record<string, PriorityMeta>;
  status: Record<string, StatusMeta>;
  priorityEntries: readonly (readonly [string, PriorityMeta])[];
  statusEntries: readonly (readonly [string, StatusMeta])[];
  boardStatusEntries: readonly (readonly [string, StatusMeta])[];
};

const themeMetaCache = new WeakMap<Theme, ThemeMetaCache>();

function buildPriorityMeta(theme: Theme, key: string): PriorityMeta {
  const cfg = PRIORITY_CONFIG[key] ?? PRIORITY_CONFIG.medium;
  return { ...cfg, color: severityColor(theme, key) };
}

function buildStatusMeta(theme: Theme, key: string): StatusMeta {
  const role = STATUS_ROLE[key] ?? 'info';
  return {
    label: STATUS_LABEL[key] ?? key,
    color: theme.palette[role].main,
    bg: tint(theme, role, 0.08),
  };
}

function themeMeta(theme: Theme): ThemeMetaCache {
  const hit = themeMetaCache.get(theme);
  if (hit) return hit;

  const priority: Record<string, PriorityMeta> = {};
  Object.keys(PRIORITY_CONFIG).forEach((k) => {
    priority[k] = buildPriorityMeta(theme, k);
  });
  const status: Record<string, StatusMeta> = {};
  Object.keys(STATUS_LABEL).forEach((k) => {
    status[k] = buildStatusMeta(theme, k);
  });

  const built: ThemeMetaCache = {
    priority,
    status,
    priorityEntries: Object.keys(PRIORITY_CONFIG).map((k) => [k, priority[k]] as const),
    statusEntries: Object.keys(STATUS_LABEL).map((k) => [k, status[k]] as const),
    boardStatusEntries: BOARD_STATUSES.map((k) => [k, status[k]] as const),
  };
  themeMetaCache.set(theme, built);
  return built;
}

/** Color de prioridad: sale del design system (`severityColor`), no de hex. */
export function priorityMeta(theme: Theme, key: string): PriorityMeta {
  return themeMeta(theme).priority[key] ?? themeMeta(theme).priority.medium;
}

export function priorityEntries(theme: Theme) {
  return themeMeta(theme).priorityEntries;
}

/** Nombres del Manual de Cowork — el tablero habla el mismo idioma que el manual. */
export const STATUS_LABEL: Record<string, string> = {
  backlog: 'Respaldo',
  todo: 'Pendiente',
  in_progress: 'En curso',
  blocked: 'Bloqueada',
  in_review: 'En revisión',
  done: 'Cerrada',
  cancelled: 'Cancelada',
};

/**
 * Columnas del tablero. "Cancelada" se puede elegir en el diálogo pero no tiene
 * columna: una tarea cancelada desaparece del board en vez de quedarse ahí
 * vencida para siempre.
 */
export const BOARD_STATUSES = ['backlog', 'todo', 'in_progress', 'blocked', 'in_review', 'done'];

const STATUS_ROLE: Record<string, SemanticRole> = {
  backlog: 'secondary',
  todo: 'info',
  in_progress: 'warning',
  blocked: 'error',
  in_review: 'primary',
  done: 'success',
  cancelled: 'secondary',
};

export function statusMeta(theme: Theme, key: string): StatusMeta {
  return themeMeta(theme).status[key] ?? buildStatusMeta(theme, key);
}

/** Todos los estados — para el selector del diálogo. */
export function statusEntries(theme: Theme) {
  return themeMeta(theme).statusEntries;
}

/** Sólo los que son columna del tablero. */
export function boardStatusEntries(theme: Theme) {
  return themeMeta(theme).boardStatusEntries;
}

export const cbIcon = <CheckBoxOutlineBlankIcon fontSize="small" />;
export const cbChecked = <CheckBoxIcon fontSize="small" />;

/**
 * Paleta del selector de color del proyecto. NO es design system: el valor
 * elegido se PERSISTE en la BD (`project.color`), así que debe ser estable e
 * independiente del theme activo / dark mode.
 */
export const PROJECT_COLORS = [
  '#5569ff',
  '#E91E63',
  '#FF9800',
  '#4CAF50',
  '#9C27B0',
  '#00BCD4',
  '#F44336',
  '#795548',
];
