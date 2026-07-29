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
  aiContext: '',
  tags: '',
  progress: 0,
  recurrence: 'none',
};

export const PRIORITY_CONFIG: Record<string, { label: string; icon: string }> = {
  critical: { label: 'Critical', icon: '🔴' },
  high: { label: 'High', icon: '🟠' },
  medium: { label: 'Medium', icon: '🟡' },
  low: { label: 'Low', icon: '🟢' },
};

/** Color de prioridad: sale del design system (`severityColor`), no de hex. */
export function priorityMeta(theme: Theme, key: string) {
  const cfg = PRIORITY_CONFIG[key] ?? PRIORITY_CONFIG.medium;
  return { ...cfg, color: severityColor(theme, key) };
}

export function priorityEntries(theme: Theme) {
  return Object.keys(PRIORITY_CONFIG).map((k) => [k, priorityMeta(theme, k)] as const);
}

export const STATUS_LABEL: Record<string, string> = {
  backlog: 'Backlog',
  todo: 'To Do',
  in_progress: 'In Progress',
  in_review: 'In Review',
  done: 'Done',
};

const STATUS_ROLE: Record<string, SemanticRole> = {
  backlog: 'secondary',
  todo: 'info',
  in_progress: 'warning',
  in_review: 'primary',
  done: 'success',
};

export function statusMeta(theme: Theme, key: string) {
  const role = STATUS_ROLE[key] ?? 'info';
  return {
    label: STATUS_LABEL[key] ?? key,
    color: theme.palette[role].main,
    bg: tint(theme, role, 0.08),
  };
}

export function statusEntries(theme: Theme) {
  return Object.keys(STATUS_LABEL).map((k) => [k, statusMeta(theme, k)] as const);
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
