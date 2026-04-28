'use client';

import BugReportTwoToneIcon from '@mui/icons-material/BugReportTwoTone';
import CheckCircleTwoToneIcon from '@mui/icons-material/CheckCircleTwoTone';
import ErrorTwoToneIcon from '@mui/icons-material/ErrorTwoTone';
import EventAvailableTwoToneIcon from '@mui/icons-material/EventAvailableTwoTone';
import {
  alpha,
  Box,
  Card,
  CircularProgress,
  Skeleton,
  Typography,
  Unstable_Grid2 as Grid,
  useTheme,
} from '@mui/material';
import { SupportMetrics } from '@/services/support.service';

interface Props {
  metrics: SupportMetrics | undefined;
  loading: boolean;
}

const cards = [
  {
    key: 'open' as const,
    label: 'Tickets Abiertos',
    icon: BugReportTwoToneIcon,
    color: 'warning',
    getValue: (m: SupportMetrics) => m.tickets.open + m.tickets.inProgress,
    sub: (m: SupportMetrics) => `${m.tickets.inProgress} en progreso`,
  },
  {
    key: 'visits' as const,
    label: 'Visitas Esta Semana',
    icon: EventAvailableTwoToneIcon,
    color: 'primary',
    getValue: (m: SupportMetrics) => m.visits.thisWeek,
    sub: (m: SupportMetrics) => `${m.visits.completedThisWeek} completadas`,
  },
  {
    key: 'resolved' as const,
    label: 'Resueltos Este Mes',
    icon: CheckCircleTwoToneIcon,
    color: 'success',
    getValue: (m: SupportMetrics) => m.tickets.resolvedThisMonth,
    sub: () => 'tickets cerrados',
  },
  {
    key: 'critical' as const,
    label: 'Críticos Activos',
    icon: ErrorTwoToneIcon,
    color: 'error',
    getValue: (m: SupportMetrics) => m.tickets.critical,
    sub: () => 'requieren atención urgente',
  },
];

export default function SupportMetricCards({ metrics, loading }: Props) {
  const theme = useTheme();

  return (
    <Grid container spacing={{ xs: 2, sm: 3 }}>
      {cards.map(({ key, label, icon: Icon, color, getValue, sub }) => {
        const palette = theme.palette[color as keyof typeof theme.palette] as any;
        const value = metrics ? getValue(metrics) : 0;
        const subText = metrics ? sub(metrics) : '';

        return (
          <Grid key={key} xs={12} sm={6} lg={3}>
            <Card
              sx={{
                p: { xs: 2, sm: 2.5 },
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  bgcolor: alpha(palette.main, 0.12),
                  color: palette.main,
                }}
              >
                <Icon fontSize="medium" />
              </Box>
              <Box flex={1} minWidth={0}>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {label}
                </Typography>
                {loading ? (
                  <Skeleton variant="text" width={60} height={36} />
                ) : (
                  <Typography variant="h4" fontWeight={700} color={palette.main}>
                    {value}
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary" noWrap>
                  {loading ? <Skeleton width={80} /> : subText}
                </Typography>
              </Box>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
}
