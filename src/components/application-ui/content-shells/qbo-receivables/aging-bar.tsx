'use client';

import type { QboAging } from '@/services/qbo.service';
import { Box, Stack, Tooltip, Typography, alpha, useTheme } from '@mui/material';
import { memo } from 'react';
import { AGING_BUCKETS, money } from './constants';

type Props = {
  aging: QboAging;
  /** Con leyenda debajo. Sin ella queda como barra compacta para una fila de tabla. */
  showLegend?: boolean;
  height?: number;
};

/**
 * Barra apilada de antigüedad de saldos. Lee de un vistazo cuánto de la deuda
 * está al día y cuánto lleva más de 90 días — que es la que ya no se cobra sola.
 */
export const AgingBar = memo(function AgingBar({ aging, showLegend = false, height = 8 }: Props) {
  const theme = useTheme();
  const total = AGING_BUCKETS.reduce((s, b) => s + Number(aging[b.key] || 0), 0);

  if (total <= 0) {
    return (
      <Box
        sx={{
          height,
          borderRadius: 99,
          bgcolor: alpha(theme.palette.success.main, 0.18),
        }}
      />
    );
  }

  return (
    <Stack spacing={1}>
      <Box sx={{ display: 'flex', height, borderRadius: 99, overflow: 'hidden' }}>
        {AGING_BUCKETS.map((b) => {
          const value = Number(aging[b.key] || 0);
          if (value <= 0) return null;
          const pct = (value / total) * 100;
          return (
            <Tooltip
              key={b.key}
              title={`${b.label}: ${money(value)} (${pct.toFixed(0)}%)`}
              arrow
            >
              <Box
                sx={{
                  width: `${pct}%`,
                  bgcolor: theme.palette[b.color].main,
                  transition: 'filter .15s',
                  '&:hover': { filter: 'brightness(1.15)' },
                }}
              />
            </Tooltip>
          );
        })}
      </Box>

      {showLegend && (
        <Stack direction="row"
flexWrap="wrap"
gap={1.5}>
          {AGING_BUCKETS.map((b) => {
            const value = Number(aging[b.key] || 0);
            return (
              <Stack key={b.key}
direction="row"
alignItems="center"
spacing={0.75}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: theme.palette[b.color].main,
                    opacity: value > 0 ? 1 : 0.3,
                  }}
                />
                <Typography variant="caption"
color="text.secondary">
                  {b.short}
                </Typography>
                <Typography variant="caption"
fontWeight={600}>
                  {money(value)}
                </Typography>
              </Stack>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
});
