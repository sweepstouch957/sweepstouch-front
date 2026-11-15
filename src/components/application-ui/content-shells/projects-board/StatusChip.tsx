'use client';

import { type WorkflowStatus } from '@/services/task.service';
import { Chip } from '@mui/material';
import { STATUS_MAP } from './constants';

/* ─── Sub-components ─── */

export function StatusChip({ status }: { status: WorkflowStatus }) {
  const { label, color } = STATUS_MAP[status] || STATUS_MAP.not_started;
  return (
    <Chip
      size="small"
      variant="outlined"
      label={label}
      color={color}
      sx={{ borderRadius: (t) => t.shape.borderRadius, fontWeight: 600, fontSize: 11 }}
    />
  );
}
