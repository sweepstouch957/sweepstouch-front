/* eslint-disable react/jsx-max-props-per-line */
// src/components/sweepstakes/AudienceWeekSummaryCompact.tsx
'use client';

import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import {
  alpha,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  IconButton,
  Popover,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { sweepstakesClient } from '@services/sweepstakes.service';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { addDays, format, formatISO } from 'date-fns';
import { es } from 'date-fns/locale';

type Props = {
  storeId: string;
  startDate: string; // ISO inicial
  endDate: string;   // ISO inicial
  onChange: (startISO: string, endISO: string) => void;
  cusomerCount?: number;
};

// 🔒 Fecha mínima permitida
const MIN_DATE = new Date('2025-11-03T00:00:00');

// Meses cortos en español para formatear el string YYYY-MM-DD sin usar Date
const MONTH_LABELS = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
];

export default function AudienceWeekSummaryCompact({
  storeId,
  startDate,
  endDate,
  onChange,
  cusomerCount,
}: Props) {
  const theme = useTheme();

  // rango inicial: tal cual viene en props (ya NO se fuerza a semana)
  const initialStart = new Date(startDate);
  const initialEnd = new Date(endDate);

  const [range, setRange] = useState([
    { startDate: initialStart, endDate: initialEnd, key: 'selection' as const },
  ]);

  // Estado temporal para el Popover
  const [pendingRange, setPendingRange] = useState([
    { startDate: initialStart, endDate: initialEnd, key: 'selection' as const },
  ]);

  // Popover calendario
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const openPopover = (e: React.MouseEvent<HTMLElement>) => {
    setPendingRange(range);
    setAnchorEl(e.currentTarget);
  };
  const closePopover = () => setAnchorEl(null);

  // ISO completos para el query
  const startISO = useMemo(
    () => (range[0].startDate ? formatISO(range[0].startDate, { representation: 'complete' }) : ''),
    [range]
  );
  const endISO = useMemo(
    () => (range[0].endDate ? formatISO(range[0].endDate, { representation: 'complete' }) : ''),
    [range]
  );

  const {
    data: audienceResp,
    isFetching,
    isError,
    error,
  } = useQuery({
    queryKey: ['audience-windows', storeId, startISO, endISO],
    queryFn: () => sweepstakesClient.getAudienceWindows(String(storeId), startISO, endISO),
    enabled: Boolean(storeId && startISO && endISO),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const audienceNew = audienceResp?.audience?.newInRange ?? 0;

  // Normalización para el chart basado en byDay
  type ByDayPoint = { date: string; total: number };

  const byDay: ByDayPoint[] = Array.isArray(audienceResp?.byDay)
    ? (audienceResp!.byDay as ByDayPoint[])
    : [];

  // ⛔️ Sin Date, puro string: "YYYY-MM-DD" → "dd mes"
  const dayLabels = byDay.map((d) => {
    // Esperamos formato "YYYY-MM-DD"
    const [yearStr, monthStr, dayStr] = d.date.split('-');
    const monthIndex = Number(monthStr) - 1;
    const monthLabel = MONTH_LABELS[monthIndex] ?? '';
    return `${dayStr} ${monthLabel}`; // ej: "11 nov"
  });

  const dayTotals = byDay.map((d) => Number(d.total ?? 0));

  // Utilidad para desplazar el rango manteniendo su tamaño actual
  const shiftRange = (days: number) => {
    const s = range[0].startDate!;
    const e = range[0].endDate!;
    const ns = addDays(s, days);
    const ne = addDays(e, days);
    setRange([{ startDate: ns, endDate: ne, key: 'selection' as const }]);
    onChange(
      formatISO(ns, { representation: 'date' }),
      formatISO(ne, { representation: 'date' })
    );
  };

  // Tamaño actual del rango en días (redondeado)
  const rangeDays = Math.max(
    1,
    Math.round((range[0].endDate!.getTime() - range[0].startDate!.getTime()) / 86_400_000) + 1
  );

  const goPrev = () => shiftRange(-rangeDays);
  const goNext = () => shiftRange(rangeDays);

  // Ahora el calendario NO fuerza semana: deja elegir libremente
  const onRangeChange = (ranges: any) => {
    const sel = ranges.selection || ranges['selection'];
    if (!sel) return;

    // Asegurar límite inferior (minDate)
    const s = sel.startDate ? new Date(sel.startDate) : new Date();
    const e = sel.endDate ? new Date(sel.endDate) : s;
    const startClamped = s < MIN_DATE ? MIN_DATE : s;
    const endClamped = e < MIN_DATE ? MIN_DATE : e;

    setPendingRange([{ startDate: startClamped, endDate: endClamped, key: 'selection' as const }]);
  };

  const applyPending = () => {
    setRange(pendingRange);
    onChange(
      formatISO(pendingRange[0].startDate!, { representation: 'date' }),
      formatISO(pendingRange[0].endDate!, { representation: 'date' })
    );
    closePopover();
  };

  const periodLabel = `${format(range[0].startDate!, 'dd LLL yyyy', { locale: es })} — ${format(
    range[0].endDate!,
    'dd LLL yyyy',
    { locale: es }
  )}`;

  return (
    <Card
      sx={{
        mb: 2,
        borderRadius: 3,
        overflow: 'hidden',
        border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
        boxShadow: theme.shadows[1],
        background:
          theme.palette.mode === 'dark'
            ? alpha(theme.palette.background.default, 0.9)
            : alpha('#fff', 0.9),
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.7)}`,
          background:
            theme.palette.mode === 'dark'
              ? alpha(theme.palette.primary.dark, 0.08)
              : alpha(theme.palette.primary.light, 0.08),
        }}
      >
        <CalendarTodayIcon fontSize="small" />
        <Typography variant="subtitle1" fontWeight={800}>
          Resumen de audiencia por rango
        </Typography>

        <Stack direction="row" gap={1} sx={{ ml: 'auto' }} alignItems="center">
          <Tooltip title="Rango anterior">
            <span>
              <IconButton size="small" onClick={goPrev}>
                <ArrowBackIosNewIcon fontSize="inherit" />
              </IconButton>
            </span>
          </Tooltip>

          <Chip
            label={periodLabel}
            size="small"
            variant="outlined"
            sx={{ fontWeight: 700, borderColor: alpha(theme.palette.primary.main, 0.3) }}
          />

          <Tooltip title="Rango siguiente">
            <span>
              <IconButton size="small" onClick={goNext}>
                <ArrowForwardIosIcon fontSize="inherit" />
              </IconButton>
            </span>
          </Tooltip>

          <Button
            size="small"
            variant="outlined"
            startIcon={<CalendarTodayIcon fontSize="inherit" />}
            onClick={openPopover}
            sx={{ ml: 0.5 }}
          >
            Cambiar rango
          </Button>
        </Stack>
      </Box>

      <CardContent sx={{ pt: 1.5, px: 2 }}>
        <Grid container spacing={2} alignItems="stretch">
          {/* Chart */}
          <Grid item xs={12} md={8}>
            <Box
              sx={{
                width: '100%',
                height: 300,
                p: 1.25,
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                background:
                  theme.palette.mode === 'dark' ? alpha('#101418', 0.6) : alpha('#fff', 0.85),
              }}
            >
              {isFetching ? (
                <Skeleton
                  variant="rectangular"
                  height={300}
                  sx={{ borderRadius: 2 }}
                />
              ) : isError ? (
                <Box
                  sx={{
                    height: 300,
                    borderRadius: 2,
                    border: `1px dashed ${alpha(theme.palette.error.main, 0.5)}`,
                    display: 'grid',
                    placeItems: 'center',
                    color: theme.palette.error.main,
                  }}
                >
                  <Typography variant="body2" fontWeight={700}>
                    No se pudieron cargar los datos.
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {(error as any)?.message ?? 'Error desconocido'}
                  </Typography>
                </Box>
              ) : (
                <BarChart
                  xAxis={[
                    {
                      scaleType: 'band',
                      data: dayLabels,
                      tickLabelStyle: { fontWeight: 600 },
                    },
                  ]}
                  series={[
                    {
                      data: dayTotals,
                      label: 'Participaciones',
                      color: theme.palette.primary.main,
                    },
                  ]}
                  height={292}
                  slotProps={{ legend: { hidden: true } }}
                  margin={{ left: 8, right: 8, top: 10, bottom: 16 }}
                  sx={{
                    '.MuiBarElement-root': {
                      fillOpacity: theme.palette.mode === 'dark' ? 0.9 : 1,
                      rx: 10,
                      ry: 10,
                      fill: "url('#audienceGradient')",
                    },
                    '.MuiChartsAxis-left': { display: 'none' },
                    '.MuiChartsTooltip-root': { borderRadius: 8 },
                  }}
                >
                  <defs>
                    <linearGradient id="audienceGradient" gradientTransform="rotate(90)">
                      <stop
                        offset="0%"
                        stopColor={alpha(theme.palette.primary.light, 0.95)}
                      />
                      <stop
                        offset="100%"
                        stopColor={alpha(theme.palette.primary.dark, 0.95)}
                      />
                    </linearGradient>
                  </defs>
                </BarChart>
              )}
            </Box>
          </Grid>

          {/* KPIs */}
          <Grid item xs={12} md={4}>
            <Stack gap={1.25} height="100%" justifyContent="center">
              <Card
                sx={{
                  borderRadius: 2,
                  borderLeft: `5px solid ${theme.palette.info.main}`,
                  bgcolor:
                    theme.palette.mode === 'dark'
                      ? alpha(theme.palette.info.main, 0.09)
                      : alpha(theme.palette.info.light, 0.14),
                  boxShadow: 'none',
                }}
              >
                <CardContent sx={{ py: 1.25 }}>
                  <Typography
                    variant="caption"
                    sx={{ color: theme.palette.info.main, fontWeight: 800 }}
                  >
                    AUDIENCIA TOTAL
                  </Typography>
                  <Typography
                    variant="h5"
                    fontWeight={900}
                    sx={{ color: theme.palette.info.main }}
                  >
                    {cusomerCount || '…'}
                  </Typography>
                </CardContent>
              </Card>

              <Card
                sx={{
                  borderRadius: 2,
                  borderLeft: `5px solid ${theme.palette.secondary.main}`,
                  bgcolor:
                    theme.palette.mode === 'dark'
                      ? alpha(theme.palette.secondary.main, 0.09)
                      : alpha(theme.palette.secondary.light, 0.14),
                  boxShadow: 'none',
                }}
              >
                <CardContent sx={{ py: 1.25 }}>
                  <Typography
                    variant="caption"
                    sx={{ color: theme.palette.secondary.main, fontWeight: 800 }}
                  >
                    NÚMEROS NUEVOS EN EL PERÍODO
                  </Typography>
                  <Typography
                    variant="h5"
                    fontWeight={900}
                    sx={{ color: theme.palette.secondary.main }}
                  >
                    {isFetching ? '…' : audienceNew.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Stack>
          </Grid>
        </Grid>

        <Divider sx={{ my: 1.25 }} />

        {/* Footer */}
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="caption" color="text.secondary">
            Rango libre. Los días sin datos se normalizan a 0 desde el backend. Fechas anteriores
            al 03-nov-2025 están bloqueadas.
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Última actualización: {format(new Date(), 'dd LLL yyyy, HH:mm', { locale: es })}
          </Typography>
        </Stack>
      </CardContent>

      {/* Popover del calendario (rango libre, con minDate) */}
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={closePopover}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { borderRadius: 2, p: 1.5 } } }}
      >
        <DateRange
          ranges={pendingRange}
          onChange={onRangeChange}
          moveRangeOnFirstSelection={false}
          showDateDisplay={false}
          weekdayDisplayFormat="EEEEEE"
          editableDateInputs
          dragSelectionEnabled
          minDate={MIN_DATE}
          rangeColors={[theme.palette.primary.main]}
        />

        <Stack direction="row" justifyContent="flex-end" gap={1} sx={{ pt: 1 }}>
          <Button size="small" onClick={closePopover}>
            Cancelar
          </Button>
          <Button size="small" variant="contained" onClick={applyPending}>
            Aplicar rango
          </Button>
        </Stack>
      </Popover>
    </Card>
  );
}
