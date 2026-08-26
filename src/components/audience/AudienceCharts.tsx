'use client';

/**
 * Las dos gráficas de la página.
 *
 * Qué cambió y por qué:
 *
 * - El movimiento semanal tenía `yAxis.min = 0` con series apiladas. Una semana
 *   con más bajas que altas da neto negativo, y con ese eje la barra
 *   simplemente no se dibujaba: la semana mala se veía igual que una semana sin
 *   datos. Ahora el dominio sale de los datos, hay línea de cero y las series
 *   van agrupadas en vez de apiladas (apilar un positivo con un negativo suma
 *   una barra que no significa nada).
 * - Los fondos con `radial-gradient` detrás del donut y del área del chart se
 *   fueron: bajaban el contraste de los datos sin aportar información.
 * - Todo en español, como el resto del panel.
 */
import { alpha, Box, Skeleton, Stack, Typography, useMediaQuery, useTheme } from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { PieChart } from '@mui/x-charts/PieChart';
import { useMemo } from 'react';
import { num } from './audience-utils';
import { numeric, PanelCard, TonePill } from './ui';

type Props = {
  summary?: any;
  weekly?: any;
  loading?: boolean;
  weeklyError?: boolean;
};

function safeNum(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** El backend manda `netGrowth` en unos endpoints y `delta` en otros. */
function pickGrowth(obj: any): number {
  return safeNum(obj?.netGrowth ?? obj?.delta ?? 0);
}

function shortWeekLabel(label: string) {
  const m = label.match(/(\d{4})-(\d{2})-(\d{2}).*?(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return label;
  const [, , mm1, dd1, , mm2, dd2] = m;
  return `${mm1}/${dd1}–${mm2}/${dd2}`;
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));
}

function pct01(n01: number) {
  return `${Math.round(clamp01(n01) * 100)}%`;
}

function fmtSigned(v: number) {
  const n = safeNum(v);
  return `${n > 0 ? '+' : ''}${num(n)}`;
}

/** El legend propio: el de x-charts no deja poner el valor ni la proporción. */
function LegendRow(props: {
  label: string;
  value: number;
  percent: number;
  color: string;
  subtitle?: string;
}) {
  const { label, value, percent, color, subtitle } = props;

  return (
    <Stack gap={0.75}>
      <Stack
        direction="row"
        alignItems="baseline"
        justifyContent="space-between"
        gap={1}
      >
        <Stack
          direction="row"
          alignItems="center"
          gap={1}
          minWidth={0}
        >
          <Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: color, flexShrink: 0 }} />
          <Typography
            variant="body2"
            fontWeight={600}
            noWrap
          >
            {label}
          </Typography>
        </Stack>

        <Stack
          direction="row"
          alignItems="baseline"
          gap={0.75}
          flexShrink={0}
        >
          <Typography
            variant="body2"
            fontWeight={700}
            sx={numeric}
          >
            {num(value)}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={numeric}
          >
            {pct01(percent)}
          </Typography>
        </Stack>
      </Stack>

      {/* La barra da la proporción de un vistazo; el número de arriba, el dato. */}
      <Box
        sx={(t) => ({
          height: 6,
          borderRadius: 3,
          overflow: 'hidden',
          bgcolor: alpha(t.palette.text.primary, t.palette.mode === 'dark' ? 0.12 : 0.06),
        })}
      >
        <Box
          sx={{
            width: `${clamp01(percent) * 100}%`,
            height: '100%',
            bgcolor: color,
            borderRadius: 3,
          }}
        />
      </Box>

      {subtitle ? (
        <Typography
          variant="caption"
          color="text.secondary"
        >
          {subtitle}
        </Typography>
      ) : null}
    </Stack>
  );
}

export function AudienceCharts(props: Props) {
  const { summary, weekly, loading, weeklyError } = props;
  const theme = useTheme();
  const mdDown = useMediaQuery(theme.breakpoints.down('md'));
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  const cSenders = theme.palette.success.main;
  const cNon = theme.palette.warning.main;

  const donut = useMemo(() => {
    const senders = safeNum(summary?.senders?.audienceCurr ?? summary?.chart?.values?.[0]);
    const non = safeNum(summary?.nonSenders?.audienceCurr ?? summary?.chart?.values?.[1]);
    const total = senders + non;

    return {
      senders,
      non,
      total,
      sp: clamp01(total ? senders / total : 0),
      np: clamp01(total ? non / total : 0),
      data: [
        { id: 0, value: senders, label: 'Con campañas', color: cSenders },
        { id: 1, value: non, label: 'Sin campañas', color: cNon },
      ],
    };
  }, [summary, cSenders, cNon]);

  const weeklyChart = useMemo(() => {
    const data = weekly?.data ?? [];
    const labels = data.map((x: any) => shortWeekLabel(x.label ?? ''));

    const sendersGrowth = data.map((x: any) => pickGrowth(x.senders));
    const nonGrowth = data.map((x: any) => pickGrowth(x.nonSenders));

    // Dominio a partir de los datos reales. Con min fijo en 0 las semanas
    // negativas desaparecían del gráfico.
    const all = [...sendersGrowth, ...nonGrowth].map(safeNum);
    const rawMax = all.length ? Math.max(...all) : 0;
    const rawMin = all.length ? Math.min(...all) : 0;
    const pad = Math.max(1, Math.ceil(Math.max(Math.abs(rawMax), Math.abs(rawMin)) * 0.12));

    return {
      labels,
      sendersGrowth,
      nonGrowth,
      max: Math.max(rawMax + pad, 1),
      min: rawMin < 0 ? rawMin - pad : 0,
      hasNegative: rawMin < 0,
    };
  }, [weekly]);

  const weeklyTotals = useMemo(() => {
    const s = weeklyChart.sendersGrowth.reduce((a: number, b: any) => a + safeNum(b), 0);
    const n = weeklyChart.nonGrowth.reduce((a: number, b: any) => a + safeNum(b), 0);
    return { senders: s, non: n, total: s + n };
  }, [weeklyChart]);

  const hasWeeklyData =
    weeklyChart.sendersGrowth.some((v: any) => safeNum(v) !== 0) ||
    weeklyChart.nonGrowth.some((v: any) => safeNum(v) !== 0);

  const axisSx = {
    '& .MuiChartsAxis-line, & .MuiChartsAxis-tick': {
      stroke: alpha(theme.palette.text.primary, 0.15),
    },
    '& .MuiChartsAxis-tickLabel': { fill: theme.palette.text.secondary, fontSize: 11 },
    '& .MuiChartsGrid-line': {
      stroke: alpha(theme.palette.text.primary, 0.08),
      strokeDasharray: '3 3',
    },
  } as const;

  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2.5,
        gridTemplateColumns: { xs: '1fr', lg: '5fr 7fr' },
        alignItems: 'stretch',
      }}
    >
      {/* ===================== Reparto de la audiencia ===================== */}
      <PanelCard
        title="Reparto de la audiencia"
        subtitle="Cuánta se está usando y cuánta está parada"
        right={
          <TonePill
            label={`Total ${num(donut.total)}`}
            tone="primary"
          />
        }
      >
        {loading && !donut.total ? (
          <Skeleton
            variant="rounded"
            height={260}
          />
        ) : donut.total === 0 ? (
          <Stack
            alignItems="center"
            justifyContent="center"
            sx={{ height: 260 }}
          >
            <Typography
              variant="body2"
              color="text.secondary"
            >
              Todavía no hay audiencia registrada en este período.
            </Typography>
          </Stack>
        ) : (
          <Stack gap={2}>
            <Box
              sx={{
                position: 'relative',
                height: 240,
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <PieChart
                height={240}
                hideLegend
                skipAnimation={reduceMotion}
                series={[
                  {
                    data: donut.data,
                    innerRadius: 74,
                    outerRadius: 104,
                    paddingAngle: 2,
                    cornerRadius: 3,
                    valueFormatter: (v: any) => num(safeNum(v?.value ?? v)),
                  },
                ]}
                margin={{ top: 8, bottom: 8, left: 8, right: 8 }}
              />

              {/* Total al centro: es el número que se busca primero. */}
              <Stack
                alignItems="center"
                sx={{
                  position: 'absolute',
                  inset: 0,
                  justifyContent: 'center',
                  pointerEvents: 'none',
                }}
              >
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 700, lineHeight: 1, ...numeric }}
                >
                  {num(donut.total)}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  contactos
                </Typography>
              </Stack>
            </Box>

            <Stack gap={1.75}>
              <LegendRow
                label="Con campañas"
                value={donut.senders}
                percent={donut.sp}
                color={cSenders}
                subtitle="Negocios que enviaron al menos una campaña en el período"
              />
              <LegendRow
                label="Sin campañas"
                value={donut.non}
                percent={donut.np}
                color={cNon}
                subtitle="Audiencia parada: está cargada pero no recibe nada"
              />
            </Stack>
          </Stack>
        )}
      </PanelCard>

      {/* ===================== Movimiento semanal ===================== */}
      <PanelCard
        title="Movimiento semanal"
        subtitle="Neto de altas menos bajas, semana por semana"
        right={
          <Stack
            direction="row"
            gap={0.75}
            flexWrap="wrap"
          >
            <TonePill
              label={`Con campañas ${fmtSigned(weeklyTotals.senders)}`}
              tone="success"
            />
            <TonePill
              label={`Sin campañas ${fmtSigned(weeklyTotals.non)}`}
              tone="warning"
            />
            <TonePill
              label={`Neto ${fmtSigned(weeklyTotals.total)}`}
              tone={weeklyTotals.total >= 0 ? 'primary' : 'error'}
            />
          </Stack>
        }
      >
        {weeklyError ? (
          <Stack
            alignItems="center"
            justifyContent="center"
            gap={0.5}
            sx={{ height: 300 }}
          >
            <Typography
              variant="body2"
              color="error"
            >
              No se pudo cargar el desglose semanal.
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
            >
              El resto de la página sigue funcionando.
            </Typography>
          </Stack>
        ) : loading && !hasWeeklyData ? (
          <Skeleton
            variant="rounded"
            height={mdDown ? 280 : 320}
          />
        ) : !hasWeeklyData ? (
          <Stack
            alignItems="center"
            justifyContent="center"
            sx={{ height: 300 }}
          >
            <Typography
              variant="body2"
              color="text.secondary"
              textAlign="center"
            >
              Ninguna semana del período tuvo altas ni bajas.
            </Typography>
          </Stack>
        ) : (
          <>
            <Box sx={axisSx}>
              <BarChart
                height={mdDown ? 280 : 320}
                hideLegend
                skipAnimation={reduceMotion}
                grid={{ horizontal: true }}
                borderRadius={4}
                xAxis={[{ scaleType: 'band', data: weeklyChart.labels }]}
                yAxis={[
                  {
                    min: weeklyChart.min,
                    max: weeklyChart.max,
                    valueFormatter: (v: any) => num(safeNum(v)),
                  },
                ]}
                series={[
                  {
                    data: weeklyChart.sendersGrowth,
                    label: 'Con campañas',
                    color: cSenders,
                    valueFormatter: (v: any) => fmtSigned(safeNum(v)),
                  },
                  {
                    data: weeklyChart.nonGrowth,
                    label: 'Sin campañas',
                    color: cNon,
                    valueFormatter: (v: any) => fmtSigned(safeNum(v)),
                  },
                ]}
                margin={{ left: 62, right: 12, top: 8, bottom: 44 }}
              />
            </Box>

            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              gap={1}
              flexWrap="wrap"
              sx={{ mt: 1 }}
            >
              <Stack
                direction="row"
                gap={1.5}
                flexWrap="wrap"
              >
                {[
                  { label: 'Con campañas', color: cSenders },
                  { label: 'Sin campañas', color: cNon },
                ].map((s) => (
                  <Stack
                    key={s.label}
                    direction="row"
                    alignItems="center"
                    gap={0.75}
                  >
                    <Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: s.color }} />
                    <Typography
                      variant="caption"
                      color="text.secondary"
                    >
                      {s.label}
                    </Typography>
                  </Stack>
                ))}
              </Stack>

              <Typography
                variant="caption"
                color="text.disabled"
              >
                {weeklyChart.hasNegative
                  ? 'Las barras bajo la línea de cero son semanas con más bajas que altas.'
                  : 'Pasá el mouse por una barra para ver el valor exacto.'}
              </Typography>
            </Stack>
          </>
        )}
      </PanelCard>
    </Box>
  );
}
