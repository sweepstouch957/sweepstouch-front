// app/(dashboard)/audience/page.tsx
'use client';

import { AudienceCharts } from '@/components/audience/AudienceCharts';
import { AudienceKpis } from '@/components/audience/AudienceKpis';
import { AudienceSummaryExecutive } from '@/components/audience/AudienceSummaryExecutive';
import {
  useAudienceAlerts,
  useAudienceSeries,
  useAudienceSimulation,
  useAudienceSummary,
  useAudienceWeekly,
} from '@/hooks/fetching/campaigns/useAudience';
import type {
  AudienceAlertsQueryParams,
  AudienceMonthlySeriesQueryParams,
  AudiencePeriod,
  AudienceQueryParams,
  AudienceSimulatorQueryParams,
  WeeklyBreakdownQueryParams,
} from '@/services/campaing.service';
import AutoGraphRoundedIcon from '@mui/icons-material/AutoGraphRounded';
import BubbleChartRoundedIcon from '@mui/icons-material/BubbleChartRounded';
import FilterAltRoundedIcon from '@mui/icons-material/FilterAltRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import {
  alpha,
  Avatar,
  Box,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import React, { useMemo, useState } from 'react';

function clampDateISO(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
function defaultCustomRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 30);
  return { start: clampDateISO(start), end: clampDateISO(end) };
}

export default function AudienceInsightsPage() {
  const theme = useTheme();
  const mdDown = useMediaQuery(theme.breakpoints.down('md'));
  const isDark = theme.palette.mode === 'dark';
  const accent = theme.palette.primary.main;
  const { common } = theme.palette;

  const [period, setPeriod] = useState<AudiencePeriod>('30d');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [includeInactive, setIncludeInactive] = useState<boolean>(false);

  const initial = useMemo(() => defaultCustomRange(), []);
  const [customStart, setCustomStart] = useState<string>(initial.start);
  const [customEnd, setCustomEnd] = useState<string>(initial.end);

  const [minGrowthPct, setMinGrowthPct] = useState<number>(20);
  const [minNetGrowth, setMinNetGrowth] = useState<number>(200);

  const [simStoreId, setSimStoreId] = useState<string>('');
  const [assumedCampaignsPerMonth, setAssumedCampaignsPerMonth] = useState<number>(2);
  const [assumedLiftPct, setAssumedLiftPct] = useState<number>(10);
  const [assumedChurnReductionPct, setAssumedChurnReductionPct] = useState<number>(8);

  const baseParams: AudienceQueryParams = useMemo(() => {
    const p: AudienceQueryParams = { period, year, includeInactive };
    if (period === 'custom') {
      p.start = customStart;
      p.end = customEnd;
    }
    return p;
  }, [period, year, includeInactive, customStart, customEnd]);

  const weeklyParams: WeeklyBreakdownQueryParams = useMemo(
    () => ({
      ...baseParams,
      weeks: period === '7d' ? 2 : period === '14d' ? 4 : period === '30d' ? 8 : 12,
    }),
    [baseParams, period]
  );

  const seriesParams: AudienceMonthlySeriesQueryParams = useMemo(
    () => ({
      ...baseParams,
      year,
    }),
    [baseParams, year]
  );

  const alertsParams: AudienceAlertsQueryParams = useMemo(
    () => ({
      ...baseParams,
      onlyNonSenders: true,
      limit: 50,
      minGrowthPct,
      minNetGrowth,
    }),
    [baseParams, minGrowthPct, minNetGrowth]
  );

  const simParams: AudienceSimulatorQueryParams | undefined = useMemo(() => {
    if (!simStoreId?.trim()) return undefined;
    return {
      ...baseParams,
      storeId: simStoreId.trim(),
      assumedCampaignsPerMonth,
      assumedLiftPct,
      assumedChurnReductionPct,
    };
  }, [baseParams, simStoreId, assumedCampaignsPerMonth, assumedLiftPct, assumedChurnReductionPct]);

  const summary: any = useAudienceSummary(baseParams);
  const weekly = useAudienceWeekly(weeklyParams);
  const series = useAudienceSeries(seriesParams);
  const alerts = useAudienceAlerts(alertsParams);
  const simulator: any = useAudienceSimulation(simParams);

  const isLoadingAny =
    summary.isLoading ||
    weekly.isLoading ||
    series.isLoading ||
    alerts.isLoading ||
    simulator.isLoading;

  const senders = summary.data?.senders;
  const nonSenders = summary.data?.nonSenders;

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Stack
        direction="row"
        alignItems="flex-start"
        justifyContent="space-between"
        gap={2}
        sx={{ mb: 2 }}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.5}
        >
          <Avatar
            sx={{
              width: 40,
              height: 40,
              bgcolor: alpha(accent, 0.12),
              color: accent,
              borderRadius: 2,
            }}
          >
            <InsightsRoundedIcon fontSize="small" />
          </Avatar>
          <Box>
            <Typography
              variant="h5"
              sx={{ fontWeight: 700, letterSpacing: -0.3, lineHeight: 1.2 }}
            >
              Audience Intelligence
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: 'text.secondary', mt: 0.25 }}
            >
              Executive-ready split of growth: <b>senders</b> vs <b>non-senders</b>, churn, trends,
              and scenario planning.
            </Typography>
          </Box>
        </Stack>

        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ display: { xs: 'none', md: 'flex' }, flexShrink: 0 }}
        >
          <Chip
            icon={<InsightsRoundedIcon />}
            label={period === 'custom' ? `${customStart} → ${customEnd}` : period.toUpperCase()}
            size="small"
            sx={{
              fontWeight: 700,
              bgcolor: alpha(accent, 0.1),
              color: theme.palette.primary.dark,
              borderRadius: 999,
            }}
          />
          <Chip
            icon={<BubbleChartRoundedIcon />}
            label="Leadership view"
            size="small"
            sx={{
              fontWeight: 700,
              bgcolor: alpha(theme.palette.success.main, 0.12),
              color: theme.palette.success.dark,
              borderRadius: 999,
            }}
          />
        </Stack>
      </Stack>

      {/* Loading bar */}
      {isLoadingAny && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

      {/* Filter card */}
      <Paper
        elevation={0}
        sx={{
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        {/* Card header */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{
            px: 2.5,
            py: 2,
            borderBottom: `1px solid ${theme.palette.divider}`,
            bgcolor: isDark ? alpha(common.black, 0.15) : alpha(common.black, 0.015),
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
          >
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: alpha(accent, 0.12),
                color: accent,
                borderRadius: 1,
              }}
            >
              <FilterAltRoundedIcon sx={{ fontSize: 17 }} />
            </Avatar>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 700 }}
            >
              Filters
            </Typography>
          </Stack>

          <Chip
            size="small"
            icon={<AutoGraphRoundedIcon />}
            label="Realtime metrics"
            sx={{
              fontWeight: 700,
              bgcolor: alpha(theme.palette.info.main, 0.12),
              color: theme.palette.info.dark,
            }}
          />
        </Stack>

        {/* Card body */}
        <Box sx={{ p: 2.5 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            flexWrap="wrap"
          >
            <FormControl
              size="small"
              sx={{ minWidth: 170 }}
            >
              <InputLabel>Period</InputLabel>
              <Select
                label="Period"
                value={period}
                onChange={(e) => setPeriod(e.target.value as AudiencePeriod)}
              >
                <MenuItem value="7d">Last 7 days</MenuItem>
                <MenuItem value="14d">Last 14 days</MenuItem>
                <MenuItem value="30d">Last 30 days</MenuItem>
                <MenuItem value="90d">Last 90 days</MenuItem>
                <MenuItem value="ytd">Year to date</MenuItem>
                <MenuItem value="custom">Custom</MenuItem>
              </Select>
            </FormControl>

            <TextField
              size="small"
              label="Year"
              value={year}
              onChange={(e) => setYear(Number(e.target.value || new Date().getFullYear()))}
              type="number"
              inputProps={{ min: 2020, max: 2100 }}
              sx={{ width: 140 }}
            />

            {period === 'custom' ? (
              <>
                <TextField
                  size="small"
                  type="date"
                  label="Start"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ width: 175 }}
                />
                <TextField
                  size="small"
                  type="date"
                  label="End"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ width: 175 }}
                />
              </>
            ) : null}

            <FormControl
              size="small"
              sx={{ minWidth: 210 }}
            >
              <InputLabel>Include inactive</InputLabel>
              <Select
                label="Include inactive"
                value={includeInactive ? 'yes' : 'no'}
                onChange={(e) => setIncludeInactive(e.target.value === 'yes')}
              >
                <MenuItem value="no">No</MenuItem>
                <MenuItem value="yes">Yes</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Box>
      </Paper>

      {/* KPIs */}
      <Box sx={{ mt: 3 }}>
        <AudienceKpis
          senders={senders}
          nonSenders={nonSenders}
        />
      </Box>

      {/* Charts */}
      <Box sx={{ mt: 3 }}>
        <AudienceCharts
          summary={summary.data}
          weekly={weekly.data}
          loading={summary.isLoading || weekly.isLoading}
          weeklyError={weekly.isError}
        />
      </Box>

      {/* Executive Summary */}
      <Box sx={{ mt: 3 }}>
        <AudienceSummaryExecutive
          data={summary.data}
          loading={summary.isLoading}
          error={summary.isError}
        />
      </Box>

      {/* Error display */}
      {(summary.isError || weekly.isError || series.isError) && (
        <Box sx={{ mt: 2 }}>
          <Typography
            color="error"
            variant="body2"
          >
            Some sections failed to load — double check the audience router mounting and params
            mapping.
          </Typography>
        </Box>
      )}
    </Box>
  );
}
