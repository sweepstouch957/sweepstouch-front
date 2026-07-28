'use client';

import BugReportTwoToneIcon from '@mui/icons-material/BugReportTwoTone';
import CheckCircleTwoToneIcon from '@mui/icons-material/CheckCircleTwoTone';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import EventAvailableTwoToneIcon from '@mui/icons-material/EventAvailableTwoTone';
import {
  alpha,
  Box,
  LinearProgress,
  Skeleton,
  Stack,
  Theme,
  Typography,
  Unstable_Grid2 as Grid,
  useTheme,
} from '@mui/material';
import Link from 'next/link';
import React from 'react';
import { SupportMetrics } from '@/services/support.service';
import { routes } from 'src/router/routes';

interface Props {
  metrics: SupportMetrics | undefined;
  loading: boolean;
}

interface CardDef {
  key: string;
  label: string;
  icon: React.ElementType;
  color: 'warning' | 'primary' | 'success' | 'error';
  getValue: (m: SupportMetrics) => number;
  getSub: (m: SupportMetrics) => string;
  getProgress: (m: SupportMetrics) => number | null;
  urgentWhen?: (v: number) => boolean;
  /** A dónde lleva la card al hacer click. */
  href?: string;
}

const cardDefs: CardDef[] = [
  {
    key: 'open',
    label: 'Tickets Abiertos',
    href: routes.admin.management.support.tickets,
    icon: BugReportTwoToneIcon,
    color: 'warning',
    getValue: (m) => m.tickets.open + m.tickets.inProgress,
    getSub: (m) => `${m.tickets.inProgress} en progreso · ${m.tickets.open} sin iniciar`,
    getProgress: (m) => {
      const total = m.tickets.open + m.tickets.inProgress;
      return total > 0 ? Math.round((m.tickets.inProgress / total) * 100) : 0;
    },
  },
  {
    key: 'visits',
    label: 'Visitas Esta Semana',
    href: routes.admin.management.support.visits,
    icon: EventAvailableTwoToneIcon,
    color: 'primary',
    getValue: (m) => m.visits.thisWeek,
    getSub: (m) =>
      m.visits.thisWeek > 0
        ? `${m.visits.completedThisWeek} completadas de ${m.visits.thisWeek}`
        : 'Sin visitas programadas',
    getProgress: (m) =>
      m.visits.thisWeek > 0
        ? Math.round((m.visits.completedThisWeek / m.visits.thisWeek) * 100)
        : null,
  },
  {
    key: 'resolved',
    label: 'Resueltos Este Mes',
    href: routes.admin.management.support.tickets,
    icon: CheckCircleTwoToneIcon,
    color: 'success',
    getValue: (m) => m.tickets.resolvedThisMonth,
    getSub: () => 'tickets cerrados o resueltos',
    getProgress: () => null,
  },
  {
    key: 'critical',
    label: 'Críticos Activos',
    href: routes.admin.management.support.tickets,
    icon: ErrorOutlineRoundedIcon,
    color: 'error',
    getValue: (m) => m.tickets.critical,
    getSub: (m) =>
      m.tickets.critical > 0
        ? 'Requieren atención inmediata'
        : 'Sin tickets críticos pendientes',
    getProgress: () => null,
    urgentWhen: (v) => v > 0,
  },
];

function MetricCard({ def, metrics, loading, theme }: {
  def: CardDef;
  metrics: SupportMetrics | undefined;
  loading: boolean;
  theme: Theme;
}) {
  const palette = (theme.palette[def.color] as any);
  const value = metrics ? def.getValue(metrics) : 0;
  const subText = metrics ? def.getSub(metrics) : '';
  const progress = metrics ? def.getProgress(metrics) : null;
  const isUrgent = def.urgentWhen?.(value) ?? false;

  return (
    <Box
      // Si la card tiene destino, se renderiza como <a> real: click, ctrl+click,
      // "abrir en pestaña nueva" y navegación por teclado funcionan gratis.
      {...(def.href
        ? { component: Link, href: def.href, 'aria-label': `${def.label}: ${value}` }
        : {})}
      sx={{
        p: 2.5,
        borderRadius: 2,
        border: '1px solid',
        borderColor: isUrgent ? alpha(palette.main, 0.45) : 'divider',
        bgcolor: isUrgent ? alpha(palette.main, 0.04) : 'background.paper',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        textDecoration: 'none',
        color: 'inherit',
        cursor: def.href ? 'pointer' : 'default',
        transition: 'border-color .15s, background-color .15s',
        ...(def.href && {
          '&:hover': {
            borderColor: alpha(palette.main, 0.45),
            bgcolor: alpha(palette.main, 0.06),
          },
        }),
      }}
    >
      {/* Label row */}
      <Stack direction="row" alignItems="center" spacing={0.75}>
        <def.icon sx={{ fontSize: 15, color: palette.main, flexShrink: 0 }} />
        <Typography
          variant="caption"
          fontWeight={600}
          sx={{ letterSpacing: 0.3, color: 'text.secondary', textTransform: 'uppercase', fontSize: 10.5 }}
        >
          {def.label}
        </Typography>
        {isUrgent && (
          <Box
            sx={{
              ml: 'auto',
              width: 7,
              height: 7,
              borderRadius: '50%',
              bgcolor: palette.main,
              animation: 'pulse 1.6s ease-in-out infinite',
              '@keyframes pulse': {
                '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                '50%': { opacity: 0.5, transform: 'scale(1.4)' },
              },
            }}
          />
        )}
      </Stack>

      {/* Value */}
      {loading ? (
        <Skeleton variant="text" width={56} height={44} sx={{ transform: 'none' }} />
      ) : (
        <Typography
          variant="h3"
          fontWeight={800}
          lineHeight={1}
          color={isUrgent ? palette.main : 'text.primary'}
        >
          {value}
        </Typography>
      )}

      {/* Progress bar — shown only when meaningful */}
      {progress !== null && !loading && (
        <Box>
          <LinearProgress
            variant="determinate"
            value={progress}
            color={def.color}
            sx={{
              height: 4,
              borderRadius: 2,
              bgcolor: alpha(palette.main, 0.12),
              '& .MuiLinearProgress-bar': { borderRadius: 2 },
            }}
          />
        </Box>
      )}
      {progress !== null && loading && (
        <Skeleton variant="rectangular" height={4} sx={{ borderRadius: 1 }} />
      )}

      {/* Sub text */}
      <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4 }}>
        {loading ? <Skeleton width={100} /> : subText}
      </Typography>
    </Box>
  );
}

export default React.memo(function SupportMetricCards({ metrics, loading }: Props) {
  const theme = useTheme();

  return (
    <Grid container spacing={{ xs: 2, sm: 2.5 }}>
      {cardDefs.map((def) => (
        <Grid key={def.key} xs={12} sm={6} lg={3}>
          <MetricCard def={def} metrics={metrics} loading={loading} theme={theme} />
        </Grid>
      ))}
    </Grid>
  );
});
