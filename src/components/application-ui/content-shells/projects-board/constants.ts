/** Estados del flujo, paleta de colores y valores iniciales del formulario de proyecto. */
import { type ProjectType, type WorkflowStatus } from '@/services/task.service';

/* ─── Constants ─── */

export const STATUS_MAP: Record<
  WorkflowStatus,
  { label: string; color: 'error' | 'info' | 'success' | 'warning' | 'default' }
> = {
  not_started: { label: 'Not started', color: 'error' },
  in_progress: { label: 'In progress', color: 'info' },
  completed: { label: 'Completed', color: 'success' },
};

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
  '#607D8B',
];

export const statusOptions: { id: WorkflowStatus; name: string }[] = [
  { id: 'not_started', name: 'Not started' },
  { id: 'in_progress', name: 'In Progress' },
  { id: 'completed', name: 'Completed' },
];

export const EMPTY_FORM = {
  name: '',
  description: '',
  color: PROJECT_COLORS[0],
  tags: '',
  workflowStatus: 'not_started' as WorkflowStatus,
  startDate: '',
  dueDate: '',
  // Cómo se lleva y qué área lo dueña (Manual de Cowork)
  type: 'project' as ProjectType,
  departmentId: '' as string,
};
