'use client';

import {
  Box,
  Card,
  CardContent,
  Chip,
  MenuItem,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import React from 'react';
import { RATING_META } from './constants';
import { useDesignStore } from './store';
import { elaborationMinutes, finishedRating, formatDuration } from './timing';
import type { DesignCard } from './types';
import { qualityFor } from './ui-helpers';

/**
 * Perfil / KPI por diseñador.
 *
 * Los updates del cliente no entran en ninguna de estas métricas: no son culpa
 * del diseñador. Sí aparecen en el reporte general del dashboard.
 */

export type Period = 'day' | 'week' | 'month';

const PERIOD_DAYS: Record<Period, number> = { day: 1, week: 7, month: 30 };

export const withinPeriod = (iso: string | null, period: Period): boolean => {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t <= PERIOD_DAYS[period] * 86_400_000;
};

/** Etiquetas de los últimos N días, de más viejo a más nuevo. */
function lastDays(n: number): { key: string; label: string }[] {
  const out: { key: string; label: string }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000);
    out.push({
      key: d.toISOString().slice(0, 10),
      label: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`,
    });
  }
  return out;
}

const dayKey = (iso: string | null): string | null => (iso ? iso.slice(0, 10) : null);

export function DesignerProfile(): React.JSX.Element {
  const theme = useTheme();
  const cards = useDesignStore((s) => s.cards);
  const designers = useDesignStore((s) => s.designers);

  const [designerId, setDesignerId] = React.useState(designers[0]?.id ?? '');

  // El equipo se edita desde Configuración: si el seleccionado ya no está, se
  // cae al primero en vez de mostrar un perfil vacío.
  React.useEffect(() => {
    if (designers.length && !designers.some((d) => d.id === designerId)) {
      setDesignerId(designers[0].id);
    }
  }, [designers, designerId]);
  const [period, setPeriod] = React.useState<Period>('week');

  const mine = React.useMemo(
    () => cards.filter((c) => c.designerId === designerId),
    [cards, designerId]
  );

  const inPeriod = React.useMemo(
    () => mine.filter((c) => withinPeriod(c.timestamps.assignedAt, period) || withinPeriod(c.timestamps.approvedAt, period)),
    [mine, period]
  );

  const days = React.useMemo(() => lastDays(PERIOD_DAYS[period] === 1 ? 7 : PERIOD_DAYS[period]), [period]);

  const assignedByDay = React.useMemo(
    () => days.map((d) => mine.filter((c) => dayKey(c.timestamps.assignedAt) === d.key).length),
    [days, mine]
  );

  const completedByDay = React.useMemo(
    () => days.map((d) => mine.filter((c) => dayKey(c.timestamps.approvedAt) === d.key).length),
    [days, mine]
  );

  /* Puntualidad: sólo las que llegaron a auditoría tienen tiempo medido. */
  const punctuality = React.useMemo(() => {
    const counts = { on_time: 0, late: 0, over: 0 };
    inPeriod.forEach((c) => {
      const rating = finishedRating(c);
      if (rating) counts[rating] += 1;
    });
    return counts;
  }, [inPeriod]);

  const measured = punctuality.on_time + punctuality.late + punctuality.over;

  /* Calidad: errores de auditoría por diseño. Los updates no cuentan. */
  const errors = React.useMemo(
    () => inPeriod.reduce((sum, c: DesignCard) => sum + c.auditIssues.length, 0),
    [inPeriod]
  );
  const quality = qualityFor(errors, Math.max(1, inPeriod.length));

  const avgTime = React.useMemo(() => {
    const times = inPeriod
      .map((c) => elaborationMinutes(c))
      .filter((m): m is number => m !== null && !!inPeriod.length);
    if (!times.length) return null;
    return times.reduce((a, b) => a + b, 0) / times.length;
  }, [inPeriod]);

  return (
    <Stack spacing={2.5}>
      <Stack
        direction="row"
        spacing={2}
        flexWrap="wrap"
        useFlexGap
      >
        <TextField
          select
          size="small"
          label="Diseñador"
          value={designerId}
          onChange={(e) => setDesignerId(e.target.value)}
          sx={{ minWidth: 180 }}
        >
          {designers.map((d) => (
            <MenuItem
              key={d.id}
              value={d.id}
            >
              {d.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Período"
          value={period}
          onChange={(e) => setPeriod(e.target.value as Period)}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="day">Diario</MenuItem>
          <MenuItem value="week">Semanal</MenuItem>
          <MenuItem value="month">Mensual</MenuItem>
        </TextField>
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' },
          gap: 2,
        }}
      >
        {[
          { label: 'Diseños en el período', value: String(inPeriod.length) },
          { label: 'Tiempo promedio', value: formatDuration(avgTime) },
          { label: 'Errores de auditoría', value: String(errors) },
          { label: 'Calidad', value: `${quality.emoji} ${quality.label}` },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent>
              <Typography
                variant="caption"
                color="text.secondary"
              >
                {kpi.label}
              </Typography>
              <Typography
                variant="h5"
                fontWeight={800}
              >
                {kpi.value}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Card>
        <CardContent>
          <Typography
            variant="subtitle1"
            fontWeight={700}
            gutterBottom
          >
            Diseños asignados y completados por día
          </Typography>
          <BarChart
            height={280}
            xAxis={[{ scaleType: 'band', data: days.map((d) => d.label) }]}
            series={[
              { data: assignedByDay, label: 'Asignados', color: theme.palette.info.main },
              { data: completedByDay, label: 'Completados', color: theme.palette.success.main },
            ]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography
            variant="subtitle1"
            fontWeight={700}
            gutterBottom
          >
            Puntualidad
          </Typography>
          {measured === 0 ? (
            <Typography
              variant="body2"
              color="text.secondary"
            >
              Todavía no hay diseños con tiempo medido en este período.
            </Typography>
          ) : (
            <Stack
              direction="row"
              spacing={1.5}
              flexWrap="wrap"
              useFlexGap
            >
              {(['on_time', 'late', 'over'] as const).map((key) => {
                const meta = RATING_META[key];
                const value = punctuality[key];
                return (
                  <Chip
                    key={key}
                    label={`${meta.emoji} ${meta.label}: ${value} (${Math.round(
                      (value / measured) * 100
                    )}%)`}
                    color={meta.role === 'secondary' ? 'default' : meta.role}
                    variant="outlined"
                    sx={{ fontWeight: 700 }}
                  />
                );
              })}
            </Stack>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
}

export default DesignerProfile;
