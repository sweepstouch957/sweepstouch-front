'use client';

import { Task } from '@/services/task.service';
import { formatDue } from '@/utils/due-date';
import { alpha, Box, Container, Skeleton, Stack, Typography, useTheme } from '@mui/material';
import { Unstable_Grid2 as Grid } from '@mui/material';
import React from 'react';

/** Entrada escalonada. Se apaga sola con prefers-reduced-motion. */
const RISE = {
  '@keyframes rise': {
    from: { opacity: 0, transform: 'translateY(8px)' },
    to: { opacity: 1, transform: 'none' },
  },
  animation: 'rise .32s cubic-bezier(.2,.8,.2,1) both',
  '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
};

/** Tarjeta del detalle. `role` la tiñe cuando el bloque es un estado, no un dato. */
export function Panel({
  title,
  role,
  accent,
  delay = 0,
  pad = true,
  children,
}: {
  title?: string;
  role?: 'error' | 'success';
  /** Hilo de color arriba del panel (prioridad de la tarea). */
  accent?: string;
  delay?: number;
  pad?: boolean;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const semantic = role ? theme.palette[role].main : null;

  return (
    <Box
      sx={{
        borderRadius: 3,
        overflow: 'hidden',
        bgcolor: semantic
          ? alpha(semantic, isDark ? 0.09 : 0.04)
          : theme.palette.background.paper,
        border: `1px solid ${alpha(semantic || theme.palette.divider, semantic ? 0.35 : 0.65)}`,
        ...RISE,
        animationDelay: `${delay * 45}ms`,
      }}
    >
      {accent && (
        <Box
          sx={{
            height: 3,
            background: `linear-gradient(90deg, ${accent}, ${alpha(accent, 0)})`,
          }}
        />
      )}
      <Box sx={pad ? { p: { xs: 2, md: 2.5 } } : undefined}>
        {title && (
          <Typography
            variant="caption"
            sx={{ display: 'block', mb: 1.5, fontSize: 10.5, fontWeight: 800, letterSpacing: 0.6 }}
            color={semantic ? role : 'text.secondary'}
          >
            {title.toUpperCase()}
          </Typography>
        )}
        {children}
      </Box>
    </Box>
  );
}

/** Par etiqueta–valor de la barra lateral. */
export function Meta({
  label,
  value,
  role,
}: {
  label: string;
  value: string;
  role?: 'success' | 'warning';
}) {
  return (
    <Stack
      direction="row"
      alignItems="baseline"
      spacing={1}
    >
      <Typography sx={{ fontSize: 11, color: 'text.disabled', width: 92, flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography
        sx={{ fontSize: 12, fontWeight: 600, minWidth: 0 }}
        color={role ? `${role}.main` : 'text.primary'}
      >
        {value}
      </Typography>
    </Stack>
  );
}

/**
 * Creada → Empezada → Cerrada. Es lo que la tarea rutinaria nunca dejó ver:
 * cuánto estuvo esperando y cuánto tardó de verdad.
 */
export function Timeline({ task }: { task: Task }) {
  const theme = useTheme();

  const gap = (from?: string | null, to?: string | null) => {
    if (!from || !to) return null;
    const h = (new Date(to).getTime() - new Date(from).getTime()) / 3_600_000;
    if (h < 1) return `${Math.max(1, Math.round(h * 60))} min`;
    if (h < 48) return `${h.toFixed(1)} h`;
    return `${Math.round(h / 24)} días`;
  };

  const steps = [
    { label: 'Creada', at: task.createdAt, color: theme.palette.text.disabled },
    { label: 'Empezada', at: task.startedAt, color: theme.palette.warning.main },
    { label: 'Cerrada', at: task.completedAt, color: theme.palette.success.main },
  ];

  return (
    <Stack spacing={0}>
      {steps.map((s, i) => {
        const prev = steps[i - 1];
        const between = prev?.at && s.at ? gap(prev.at, s.at) : null;
        const done = !!s.at;
        return (
          <Box key={s.label}>
            {i > 0 && (
              <Stack
                direction="row"
                alignItems="center"
                spacing={1.5}
                sx={{ pl: '5px', height: 26 }}
              >
                <Box
                  sx={{
                    width: 2,
                    height: '100%',
                    bgcolor: alpha(done ? s.color : theme.palette.divider, done ? 0.4 : 1),
                  }}
                />
                {between && (
                  <Typography sx={{ fontSize: 10, color: 'text.disabled' }}>{between}</Typography>
                )}
              </Stack>
            )}
            <Stack
              direction="row"
              alignItems="center"
              spacing={1.5}
            >
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  flexShrink: 0,
                  bgcolor: done ? s.color : 'transparent',
                  border: `2px solid ${done ? s.color : theme.palette.divider}`,
                  boxShadow: done ? `0 0 0 4px ${alpha(s.color, 0.14)}` : 'none',
                }}
              />
              <Box minWidth={0}>
                <Typography
                  sx={{ fontSize: 12, fontWeight: 700, lineHeight: 1.2 }}
                  color={done ? 'text.primary' : 'text.disabled'}
                >
                  {s.label}
                </Typography>
                <Typography sx={{ fontSize: 10.5, color: 'text.disabled' }}>
                  {s.at ? formatDue(s.at) : 'todavía no'}
                </Typography>
              </Box>
            </Stack>
          </Box>
        );
      })}
    </Stack>
  );
}

export function DetailSkeleton() {
  return (
    <Container
      maxWidth="xl"
      sx={{ py: 3 }}
    >
      <Skeleton
        variant="text"
        width={200}
        height={28}
      />
      <Grid
        container
        spacing={3}
        mt={0}
      >
        <Grid
          xs={12}
          md={8}
        >
          <Skeleton
            variant="rounded"
            height={190}
            sx={{ borderRadius: 3, mb: 2 }}
          />
          <Skeleton
            variant="rounded"
            height={240}
            sx={{ borderRadius: 3 }}
          />
        </Grid>
        <Grid
          xs={12}
          md={4}
        >
          <Skeleton
            variant="rounded"
            height={380}
            sx={{ borderRadius: 3 }}
          />
        </Grid>
      </Grid>
    </Container>
  );
}
