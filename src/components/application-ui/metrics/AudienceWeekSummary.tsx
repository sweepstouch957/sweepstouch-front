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
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import {
  endOfWeek as _endOfWeek,
  startOfWeek as _startOfWeek,
  addDays,
  format,
  formatISO,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { useMemo, useState } from 'react';

type Props = {
  storeId: string;
  startDate: string; // ISO
  endDate: string; // ISO
  onChange: (startISO: string, endISO: string) => void;
};

const startOfWeek = (d: Date) => _startOfWeek(d, { weekStartsOn: 1 });
const endOfWeek = (d: Date) => _endOfWeek(d, { weekStartsOn: 1 });

// Orden fijo para normalizar la gráfica L-D
const DAY_ORDER = ['LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO', 'DOMINGO'];

export default function AudienceWeekSummaryCompact({
  storeId,
  startDate,
  endDate,
  onChange,
}: Props) {
  const theme = useTheme();

  const initialStart = startOfWeek(new Date(startDate));
  const initialEnd = endOfWeek(new Date(endDate));

  const [range, setRange] = useState([
    { startDate: initialStart, endDate: initialEnd, key: 'selection' as const },
  ]);

  // Estado temporal para el Popover (lo que el usuario va eligiendo)
  const [pendingRange, setPendingRange] = useState([
    { startDate: initialStart, endDate: initialEnd, key: 'selection' as const },
  ]);

  // Popover calendario
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const openPopover = (e: React.MouseEvent<HTMLElement>) => {
    setPendingRange(range); // abre con la semana actual
    setAnchorEl(e.currentTarget);
  };
  const closePopover = () => setAnchorEl(null);

  // Normalizamos a ISO “completo” (para el query)
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
    placeholderData: () => ({
      storeId,
      dateRange: { startDate: startISO, endDate: endISO },
      audience: { initial: 0, final: 0, delta: 0, newInRange: 0 },
      byWeekday: [],
    }),
  });

  // Fallbacks seguros
  const audienceInitial = audienceResp?.audience?.initial ?? 0;
  const audienceFinal = audienceResp?.audience?.final ?? 0;
  const audienceDelta = audienceResp?.audience?.delta ?? 0;
  const audienceNew = audienceResp?.audience?.newInRange ?? 0;

  // Normalización para el chart
  const byWeekday = Array.isArray(audienceResp?.byWeekday) ? audienceResp!.byWeekday : [];
  const weekdayLabels = DAY_ORDER;
  const weekdayTotals = DAY_ORDER.map((lbl) => {
    const found = byWeekday.find((d: any) => d?.label === lbl);
    return Number(found?.total ?? 0);
  });

  const goPrevWeek = () => {
    const s = addDays(range[0].startDate!, -7);
    const n = [{ startDate: startOfWeek(s), endDate: endOfWeek(s), key: 'selection' as const }];
    setRange(n);
    onChange(
      formatISO(n[0].startDate!, { representation: 'date' }),
      formatISO(n[0].endDate!, { representation: 'date' })
    );
  };
  const goNextWeek = () => {
    const s = addDays(range[0].startDate!, 7);
    const n = [{ startDate: startOfWeek(s), endDate: endOfWeek(s), key: 'selection' as const }];
    setRange(n);
    onChange(
      formatISO(n[0].startDate!, { representation: 'date' }),
      formatISO(n[0].endDate!, { representation: 'date' })
    );
  };

  // ⛳️ Forzar que el usuario solo pueda elegir una SEMANA (Lun–Dom) sin cerrar
  const onRangeChange = (ranges: any) => {
    const sel = ranges.selection || ranges['selection'];
    const base = sel?.startDate ? new Date(sel.startDate) : new Date();

    const s = startOfWeek(base);
    const e = endOfWeek(base);

    const n = [{ startDate: s, endDate: e, key: 'selection' as const }];
    setPendingRange(n); // ← solo actualiza lo que se ve en el calendario, sin aplicar aún
  };

  // Aplica la semana seleccionada y cierra
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
      {/* Header compacto */}
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
        <Typography
          variant="subtitle1"
          fontWeight={800}
        >
          Resumen semanal de audiencia
        </Typography>

        <Stack
          direction="row"
          gap={1}
          sx={{ ml: 'auto' }}
          alignItems="center"
        >
          <Tooltip title="Semana anterior">
            <span>
              <IconButton
                size="small"
                onClick={goPrevWeek}
              >
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

          <Tooltip title="Siguiente semana">
            <span>
              <IconButton
                size="small"
                onClick={goNextWeek}
              >
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
            Cambiar semana
          </Button>
        </Stack>
      </Box>

      <CardContent sx={{ pt: 1.5, px: 2 }}>
        <Grid
          container
          spacing={2}
          alignItems="stretch"
        >
          {/* Chart a la izquierda */}
          <Grid
            item
            xs={12}
            md={8}
          >
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
                  <Typography
                    variant="body2"
                    fontWeight={700}
                  >
                    No se pudieron cargar los datos.
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    {(error as any)?.message ?? 'Error desconocido'}
                  </Typography>
                </Box>
              ) : (
                <BarChart
                  xAxis={[
                    { scaleType: 'band', data: weekdayLabels, tickLabelStyle: { fontWeight: 600 } },
                  ]}
                  series={[
                    {
                      data: weekdayTotals,
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
                      fill: "url('#weekdayGradient')",
                    },
                    '.MuiChartsAxis-left': { display: 'none' },
                    '.MuiChartsTooltip-root': { borderRadius: 8 },
                  }}
                >
                  <defs>
                    <linearGradient
                      id="weekdayGradient"
                      gradientTransform="rotate(90)"
                    >
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

          {/* KPIs a la derecha */}
          <Grid
            item
            xs={12}
            md={4}
          >
            <Stack
              gap={1.25}
              height="100%"
              justifyContent="center"
            >
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
                    AUDIENCIA INICIAL
                  </Typography>
                  <Typography
                    variant="h5"
                    fontWeight={900}
                    sx={{ color: theme.palette.info.main }}
                  >
                    {isFetching ? '…' : audienceInitial.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>

              <Card
                sx={{
                  borderRadius: 2,
                  borderLeft: `5px solid ${theme.palette.success.main}`,
                  bgcolor:
                    theme.palette.mode === 'dark'
                      ? alpha(theme.palette.success.main, 0.09)
                      : alpha(theme.palette.success.light, 0.14),
                  boxShadow: 'none',
                }}
              >
                <CardContent sx={{ py: 1.25 }}>
                  <Typography
                    variant="caption"
                    sx={{ color: theme.palette.success.main, fontWeight: 800 }}
                  >
                    AUDIENCIA FINAL
                  </Typography>
                  <Typography
                    variant="h5"
                    fontWeight={900}
                    sx={{ color: theme.palette.success.main }}
                  >
                    {isFetching ? '…' : audienceFinal.toLocaleString()}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: theme.palette.success.main,
                      fontWeight: 700,
                      mt: 0.25,
                      display: 'block',
                    }}
                  >
                    {isFetching
                      ? '…'
                      : `${
                          audienceDelta >= 0 ? '+' : ''
                        }${audienceDelta.toLocaleString()} en el período`}
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
                    NÚMEROS NUEVOS EN LA SEMANA
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

        {/* Footer compacto */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography
            variant="caption"
            color="text.secondary"
          >
            Ventana: Semana (Lun–Dom). Los valores faltantes se normalizan a 0.
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
          >
            Última actualización: {format(new Date(), 'dd LLL yyyy, HH:mm', { locale: es })}
          </Typography>
        </Stack>
      </CardContent>

      {/* Popover del calendario (forzado a semanas) */}
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
          onChange={onRangeChange} // ← fija la SEMANA (Lun–Dom), no cierra
          moveRangeOnFirstSelection={false}
          showDateDisplay={false}
          weekdayDisplayFormat="EEEEEE"
          showMonthAndYearPickers={false}
          editableDateInputs={false}
          dragSelectionEnabled={false} // ← evita rangos arbitrarios
          rangeColors={[theme.palette.primary.main]}
        />

        {/* Acciones del calendario */}
        <Stack
          direction="row"
          justifyContent="flex-end"
          gap={1}
          sx={{ pt: 1 }}
        >
          <Button
            size="small"
            onClick={closePopover}
          >
            Cancelar
          </Button>
          <Button
            size="small"
            variant="contained"
            onClick={applyPending}
          >
            Aplicar semana
          </Button>
        </Stack>
      </Popover>
    </Card>
  );
}
