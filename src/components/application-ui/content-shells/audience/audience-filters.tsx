'use client';

/** Barra de filtros del dashboard de audiencia. Presentacional: todo por props. */

import type { AudiencePeriod } from '@/services/campaing.service';
import {
  Card,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import React from 'react';

const PERIODS: { value: AudiencePeriod; label: string }[] = [
  { value: '7d', label: '7d' },
  { value: '14d', label: '14d' },
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
  { value: 'ytd', label: 'Año' },
  { value: 'custom', label: 'Rango' },
];

export type AudienceFiltersProps = {
  period: AudiencePeriod;
  onPeriodChange: (p: AudiencePeriod) => void;
  customStart: string;
  customEnd: string;
  onCustomStartChange: (v: string) => void;
  onCustomEndChange: (v: string) => void;
  includeInactive: boolean;
  onIncludeInactiveChange: (v: boolean) => void;
};

export default function AudienceFilters({
  period,
  onPeriodChange,
  customStart,
  customEnd,
  onCustomStartChange,
  onCustomEndChange,
  includeInactive,
  onIncludeInactiveChange,
}: AudienceFiltersProps) {
  return (
    <Card sx={{ p: 1.75 }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        alignItems={{ md: 'center' }}
        justifyContent="space-between"
        gap={1.5}
        flexWrap="wrap"
      >
        {/* Seis períodos en un select escondían la opción detrás de un click.
            Como botones se ve cuál está activo sin abrir nada. */}
        <ToggleButtonGroup
          size="small"
          exclusive
          value={period}
          onChange={(_, v) => v && onPeriodChange(v as AudiencePeriod)}
          aria-label="Período"
        >
          {PERIODS.map((p) => (
            <ToggleButton
              key={p.value}
              value={p.value}
              sx={{ px: 1.5 }}
            >
              {p.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          gap={1.5}
          alignItems={{ sm: 'center' }}
        >
          {period === 'custom' && (
            <>
              <TextField
                size="small"
                type="date"
                label="Desde"
                value={customStart}
                onChange={(e) => onCustomStartChange(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ width: 165 }}
              />
              <TextField
                size="small"
                type="date"
                label="Hasta"
                value={customEnd}
                onChange={(e) => onCustomEndChange(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ width: 165 }}
              />
            </>
          )}

          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={includeInactive}
                onChange={(e) => onIncludeInactiveChange(e.target.checked)}
              />
            }
            label="Incluir inactivas"
            slotProps={{ typography: { variant: 'body2' } }}
          />
        </Stack>
      </Stack>
    </Card>
  );
}
