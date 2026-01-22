'use client';

import type { AudienceSummaryResponse, WeeklyBreakdownResponse } from '@/services/campaing.service';
import { Box, Chip, Divider, LinearProgress, Stack, Typography } from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { PieChart } from '@mui/x-charts/PieChart';
import { useMemo } from 'react';
import { num } from './AudienceKpis';
import { GlassCard, MetricPill } from './ui';

export function AudienceCharts(props: {
  summary?: any;
  weekly?: any;
  loading?: boolean;
  weeklyError?: boolean;
}) {
  const { summary, weekly, loading, weeklyError } = props;

  /* ----------------------------- Donut dataset ---------------------------- */
  const donutData = useMemo(() => {
    // ✅ en tu summary real vienen senders/nonSenders con audienceCurr
    const sA = summary?.senders?.audienceCurr ?? summary?.chart?.values?.[0] ?? 0;
    const nA = summary?.nonSenders?.audienceCurr ?? summary?.chart?.values?.[1] ?? 0;

    return [
      { id: 0, value: sA, label: 'Senders' },
      { id: 1, value: nA, label: 'Non-senders' },
    ];
  }, [summary]);

  /* ------------------------------ Weekly chart ---------------------------- */
  const weeklyChart = useMemo(() => {
    const data = weekly?.data ?? [];

    const labels = data.map((x) => x.label);

    const sendersDelta = data.map((x) => x.senders?.delta ?? 0);
    const nonSendersDelta = data.map((x) => x.nonSenders?.delta ?? 0);
    const totalDelta = data.map((x) => (x.senders?.delta ?? 0) + (x.nonSenders?.delta ?? 0));

    return { labels, sendersDelta, nonSendersDelta, totalDelta };
  }, [weekly]);

  const weeklyTotals = useMemo(() => {
    const data = weekly?.data ?? [];
    const senders = data.reduce((acc, x) => acc + (x.senders?.delta ?? 0), 0);
    const nonSenders = data.reduce((acc, x) => acc + (x.nonSenders?.delta ?? 0), 0);
    return { senders, nonSenders, total: senders + nonSenders };
  }, [weekly]);

  const hasWeeklyData =
    weeklyChart.sendersDelta.some((v) => v !== 0) ||
    weeklyChart.nonSendersDelta.some((v) => v !== 0) ||
    weeklyChart.totalDelta.some((v) => v !== 0);

  return (
    <Stack spacing={2.25}>
      {loading ? <LinearProgress /> : null}

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2.25}
      >
        {/* Donut */}
        <Box sx={{ flex: { xs: '1 1 auto', md: '0 0 42%' } }}>
          <GlassCard
            title="Audience Split"
            right={
              <Chip
                size="small"
                label="Senders vs Non-senders"
                sx={{ fontWeight: 900, borderRadius: 999 }}
              />
            }
          >
            <Divider sx={{ mb: 1.25 }} />
            <Box sx={{ height: 300, display: 'grid', placeItems: 'center' }}>
              <PieChart
                series={[
                  {
                    data: donutData,
                    innerRadius: 74,
                    outerRadius: 118,
                    paddingAngle: 2,
                    cornerRadius: 6,
                  },
                ]}
                height={300}
                margin={{ top: 10, bottom: 10, left: 10, right: 10 }}
              />
            </Box>

            <Typography
              variant="caption"
              sx={{ color: 'text.secondary' }}
            >
              Current period audience totals split by group.
            </Typography>
          </GlassCard>
        </Box>

        {/* Weekly */}
        <Box sx={{ flex: 1 }}>
          <GlassCard
            title="Weekly Movement"
            right={
              <Chip
                size="small"
                label="Δ Growth by group"
                sx={{ fontWeight: 900, borderRadius: 999 }}
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
                label={`Senders Δ ${num(weeklyTotals.senders)}`}
                tone="primary"
              />
              <MetricPill
                label={`Non-senders Δ ${num(weeklyTotals.nonSenders)}`}
                tone="info"
              />
              <MetricPill
                label={`Total Δ ${num(weeklyTotals.total)}`}
                tone="success"
              />
            </Stack>

            {!hasWeeklyData ? (
              <Typography
                variant="body2"
                sx={{ color: 'text.secondary', p: 2 }}
              >
                No weekly deltas for this period.
              </Typography>
            ) : (
              <Box sx={{ height: 320 }}>
                <BarChart
                  height={320}
                  xAxis={[{ scaleType: 'band', data: weeklyChart.labels }]}
                  series={[
                    { data: weeklyChart.sendersDelta, label: 'Senders Δ' },
                    { data: weeklyChart.nonSendersDelta, label: 'Non-senders Δ' },
                    { data: weeklyChart.totalDelta, label: 'Total Δ' },
                  ]}
                  margin={{ left: 50, right: 20, top: 10, bottom: 60 }}
                />
              </Box>
            )}

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
