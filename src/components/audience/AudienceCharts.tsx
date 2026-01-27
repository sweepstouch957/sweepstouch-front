'use client';

import {
  alpha,
  Box,
  Chip,
  Divider,
  LinearProgress,
  Stack,
  styled,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { PieChart } from '@mui/x-charts/PieChart';
import React, { useMemo } from 'react';
import { num } from './AudienceKpis';
import { GlassCard, MetricPill } from './ui';

/* ============================== Types ============================== */
type Props = {
  summary?: any;
  weekly?: any;
  loading?: boolean;
  weeklyError?: boolean;
};

type LegendRowProps = {
  label: string;
  value: number;
  percent: number; // 0..1
  color: string;
  subtitle?: string;
};

/* ============================== Helpers ============================== */
function safeNum(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function pickGrowth(obj: any): number {
  // backend puede mandar netGrowth o delta
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
  const sign = n > 0 ? '+' : '';
  return `${sign}${num(n)}`;
}

/* ============================== Styled bits ============================== */
export const Dot = styled('span')<{ color: string }>(({ color }) => ({
  display: 'inline-block',
  width: 10,
  height: 10,
  borderRadius: 999,
  background: color,
}));

function LegendRow(props: {
  label: string;
  value: number;
  percent: number;
  color: string;
  subtitle?: string;
}) {
  const { label, value, percent, color, subtitle } = props;

  return (
    <Stack spacing={0.4}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ gap: 1 }}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
        >
          <Box sx={{ width: 10, height: 10, borderRadius: 999, bgcolor: color }} />
          <Typography
            fontWeight={900}
            variant="body2"
          >
            {label}
          </Typography>
        </Stack>

        <Typography
          fontWeight={800}
          variant="body2"
          color="text.secondary"
        >
          {num(value)}
        </Typography>
      </Stack>

      {subtitle ? (
        <Typography
          variant="caption"
          sx={{ color: 'text.secondary', ml: 2.2 }}
        >
          {subtitle}
        </Typography>
      ) : null}
    </Stack>
  );
}

/** Footer compacto SIEMPRE bonito debajo del split */
function SplitFooter(props: { senders: number; non: number; sp: number; np: number }) {
  const { senders, non, sp, np } = props;

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      alignItems={{ xs: 'flex-start', sm: 'center' }}
      justifyContent="space-between"
      spacing={{ xs: 0.6, sm: 1.2 }}
      sx={{ width: '100%' }}
    >
      <Typography
        variant="caption"
        sx={{ color: 'text.secondary', fontWeight: 850 }}
      >
        SENDERS <b>{num(senders)}</b> • {pct01(sp)}
      </Typography>

      <Typography
        variant="caption"
        sx={{ color: 'text.secondary', fontWeight: 850 }}
      >
        NON-SENDERS <b>{num(non)}</b> • {pct01(np)}
      </Typography>

      <Typography
        variant="caption"
        sx={{ color: 'text.secondary', fontWeight: 850 }}
      >
        SPLIT{' '}
        <b>
          {pct01(sp)} / {pct01(np)}
        </b>
      </Typography>
    </Stack>
  );
}

/* ============================== Main ============================== */
export function AudienceCharts(props: Props) {
  const { summary, weekly, loading, weeklyError } = props;
  const theme = useTheme();
  const mdDown = useMediaQuery(theme.breakpoints.down('md'));

  const cSenders = theme.palette.primary.main;
  const cNon = theme.palette.warning.main;

  // Oculta el legend interno de x-charts (porque hacemos el nuestro)
  const hideInternalLegendSx = {
    '& .MuiChartsLegend-root': { display: 'none !important' },
    '& .MuiChartsLegend-series': { display: 'none !important' },
    '& .MuiChartsLegend-label': { display: 'none !important' },
  } as const;

  /* ----------------------------- Donut dataset ---------------------------- */
  const donut = useMemo(() => {
    const senders = safeNum(summary?.senders?.audienceCurr ?? summary?.chart?.values?.[0]);
    const non = safeNum(summary?.nonSenders?.audienceCurr ?? summary?.chart?.values?.[1]);
    const total = senders + non;

    const sp = total ? senders / total : 0;
    const np = total ? non / total : 0;

    return {
      senders,
      non,
      total,
      sp: clamp01(sp),
      np: clamp01(np),
      data: [
        { id: 0, value: senders, label: 'Senders' },
        { id: 1, value: non, label: 'Non-senders' },
      ],
    };
  }, [summary]);

  /* ------------------------------ Weekly chart ---------------------------- */
  const weeklyChart = useMemo(() => {
    const data = weekly?.data ?? [];
    const labels = data.map((x: any) => shortWeekLabel(x.label ?? ''));

    const sendersGrowth = data.map((x: any) => pickGrowth(x.senders));
    const nonGrowth = data.map((x: any) => pickGrowth(x.nonSenders));
    const totalGrowth = data.map((x: any) => pickGrowth(x.senders) + pickGrowth(x.nonSenders));

    const maxTotal = totalGrowth.reduce((m, v) => Math.max(m, safeNum(v)), 0);
    const maxY = Math.max(1, Math.ceil(maxTotal * 1.15));

    return { labels, sendersGrowth, nonGrowth, totalGrowth, maxY };
  }, [weekly]);

  const weeklyTotals = useMemo(() => {
    const s = weeklyChart.sendersGrowth.reduce((a, b) => a + safeNum(b), 0);
    const n = weeklyChart.nonGrowth.reduce((a, b) => a + safeNum(b), 0);
    return { senders: s, non: n, total: s + n };
  }, [weeklyChart]);

  const hasWeeklyData =
    weeklyChart.sendersGrowth.some((v) => safeNum(v) !== 0) ||
    weeklyChart.nonGrowth.some((v) => safeNum(v) !== 0);

  const donutBg = `radial-gradient(900px circle at 15% 0%, ${alpha(
    theme.palette.primary.main,
    0.09
  )}, transparent 55%),
  radial-gradient(900px circle at 95% 5%, ${alpha(
    theme.palette.warning.main,
    0.08
  )}, transparent 55%)`;

  return (
    <Stack spacing={2.25}>
      {loading ? <LinearProgress /> : null}

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2.25}
        alignItems="stretch"
      >
        {/* ============================== Audience Split ============================== */}
        <Box sx={{ flex: { xs: '1 1 auto', md: '0 0 46%' }, minWidth: 0 }}>
          <GlassCard
            title="Audience Split"
            right={
              <Chip
                size="small"
                label={`Total: ${num(donut.total)}`}
                sx={{
                  fontWeight: 950,
                  borderRadius: 999,
                  bgcolor: alpha(theme.palette.common.white, 0.55),
                }}
              />
            }
          >
            <Divider sx={{ mb: 1.25 }} />

            {/* donut a la izquierda + info a la derecha */}
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              alignItems="stretch"
            >
              {/* LEFT: donut */}
              <Box
                sx={{
                  ...hideInternalLegendSx,
                  position: 'relative',
                  flex: { xs: '1 1 auto', sm: '0 0 300px' },
                  height: { xs: 300, sm: 300 },
                  borderRadius: 3,
                  background: donutBg,
                  display: 'grid',
                  placeItems: 'center',
                  overflow: 'hidden',
                }}
              >
                {/* Center overlay */}
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    display: 'grid',
                    placeItems: 'center',
                    pointerEvents: 'none',
                    zIndex: 2,
                    textAlign: 'center',
                    px: 2,
                  }}
                >
                  <Stack
                    alignItems="center"
                    spacing={0.55}
                  >
                    <Typography
                      sx={{
                        fontWeight: 1000,
                        fontSize: { xs: 28, sm: 30 },
                        letterSpacing: -0.9,
                        lineHeight: 1,
                      }}
                    >
                      {num(donut.total)}
                    </Typography>

                    <Typography
                      variant="caption"
                      sx={{ color: 'text.secondary', fontWeight: 850, letterSpacing: 0.6 }}
                    >
                      TOTAL AUDIENCE
                    </Typography>

                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ mt: 0.2, flexWrap: 'wrap', justifyContent: 'center' }}
                    >
                      <Chip
                        size="small"
                        label={`Senders ${pct01(donut.sp)}`}
                        sx={{
                          fontWeight: 950,
                          borderRadius: 999,
                          bgcolor: alpha(cSenders, 0.12),
                          color: theme.palette.primary.dark,
                        }}
                      />
                      <Chip
                        size="small"
                        label={`Non ${pct01(donut.np)}`}
                        sx={{
                          fontWeight: 950,
                          borderRadius: 999,
                          bgcolor: alpha(cNon, 0.14),
                          color: theme.palette.warning.dark,
                        }}
                      />
                    </Stack>
                  </Stack>
                </Box>

                {/* Donut (sin cx/cy fijos para que no se corte) */}
                <Box sx={{ width: '100%', maxWidth: 420, mx: 'auto' }}>
                  <PieChart
                    height={300}
                    series={[
                      {
                        data: donut.data,
                        innerRadius: 92,
                        outerRadius: 140,
                        paddingAngle: 3,
                        cornerRadius: 12,
                        valueFormatter: (v: any) => num(safeNum(v)),
                      },
                    ]}
                    margin={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  />
                </Box>
              </Box>

              {/* RIGHT: legend/info */}
              <Stack
                spacing={1.4}
                sx={{
                  flex: 1,
                  minWidth: 0,
                  justifyContent: 'center',
                }}
              >
                <Stack
                  spacing={1.2}
                  sx={{ mt: 1.4 }}
                >
                  <LegendRow
                    label="Senders"
                    value={donut.senders}
                    percent={donut.sp}
                    color={cSenders}
                    subtitle="Audience generated by campaign-active stores"
                  />

                  <LegendRow
                    label="Non-senders"
                    value={donut.non}
                    percent={donut.np}
                    color={cNon}
                    subtitle="Audience from stores without campaigns"
                  />
                </Stack>
              </Stack>
            </Stack>

            {/* Footer EXACTAMENTE abajo del split */}
            <Divider sx={{ my: 1.25 }} />
            <SplitFooter
              senders={donut.senders}
              non={donut.non}
              sp={donut.sp}
              np={donut.np}
            />
          </GlassCard>
        </Box>

        {/* ============================== Weekly Movement ============================== */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <GlassCard
            title="Weekly Movement"
            right={
              <Chip
                size="small"
                label={`Weeks: ${weekly?.meta?.weeks || weeklyChart.labels.length || 0}`}
                sx={{
                  fontWeight: 900,
                  borderRadius: 999,
                  bgcolor: alpha(theme.palette.common.white, 0.55),
                }}
              />
            }
          >
            <Divider sx={{ mb: 1.25 }} />

            <Stack
              direction="row"
              spacing={1}
              flexWrap="wrap"
              sx={{ mb: 1 }}
            >
              <MetricPill
                label={`Senders ${fmtSigned(weeklyTotals.senders)}`}
                tone="primary"
              />
              <MetricPill
                label={`Non-senders ${fmtSigned(weeklyTotals.non)}`}
                tone="info"
              />
              <MetricPill
                label={`Total ${fmtSigned(weeklyTotals.total)}`}
                tone="success"
              />
            </Stack>

            {!hasWeeklyData ? (
              <Typography
                variant="body2"
                sx={{ color: 'text.secondary', p: 2 }}
              >
                No weekly net growth for this period.
              </Typography>
            ) : (
              <Box
                sx={{
                  ...hideInternalLegendSx,
                  borderRadius: 3,
                  p: 1,
                  background: `linear-gradient(180deg, ${alpha(
                    theme.palette.common.white,
                    0.35
                  )}, transparent)`,
                }}
              >
                <BarChart
                  height={mdDown ? 300 : 340}
                  xAxis={[
                    {
                      scaleType: 'band',
                      data: weeklyChart.labels,
                      tickLabelStyle: { fontSize: 11 },
                    },
                  ]}
                  yAxis={[
                    {
                      min: 0,
                      max: weeklyChart.maxY,
                      valueFormatter: (v) => fmtSigned(safeNum(v)),
                    },
                  ]}
                  series={[
                    {
                      data: weeklyChart.sendersGrowth,
                      label: 'Senders (net)',
                      stack: 'growth',
                      valueFormatter: (v) => fmtSigned(safeNum(v)),
                    },
                    {
                      data: weeklyChart.nonGrowth,
                      label: 'Non-senders (net)',
                      stack: 'growth',
                      valueFormatter: (v) => fmtSigned(safeNum(v)),
                    },
                  ]}
                  margin={{ left: 75, right: 18, top: 14, bottom: 50 }}
                />
              </Box>
            )}

            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', mt: 1, display: 'block' }}
            >
              Hover bars to see exact values.
            </Typography>

            {weeklyError ? (
              <Typography
                color="error"
                variant="body2"
                sx={{ mt: 1 }}
              >
                Weekly breakdown failed — verify /campaigns/audience/weekly.
              </Typography>
            ) : null}
          </GlassCard>
        </Box>
      </Stack>
    </Stack>
  );
}
