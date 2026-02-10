'use client';

import ChartBarIcon from '@heroicons/react/24/outline/ChartBarIcon';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import {
  Alert,
  Box,
  CircularProgress,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageHeading from 'src/components/base/page-heading';
import { AvatarState } from 'src/components/base/styles/avatar';
import { useCustomization } from 'src/hooks/use-customization';
import { campaignClient } from '@services/campaing.service';
import type { Campaing } from '@/models/campaing';
import type { PaginatedResponse } from '@/models/pagination';

function n(v?: number) {
  return Number.isFinite(v as number) ? (v as number) : 0;
}

function pad2(v: number) {
  return String(v).padStart(2, '0');
}

function ymdToLocalDate(ymd: string): Date | null {
  const m = ymd.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null;
  return new Date(y, mo - 1, d);
}

function localDateToYmd(date: Date | null): string {
  if (!date || Number.isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

function startOfMonthIso(year: number, month1to12: number) {
  // IMPORTANT: match the same format the Campaigns filters use (toISOString())
  // so the backend date filtering behaves identically.
  return new Date(Date.UTC(year, month1to12 - 1, 1, 0, 0, 0, 0)).toISOString();
}

function endOfMonthIso(year: number, month1to12: number) {
  // Use an inclusive end-of-month timestamp. This avoids missing campaigns if the backend
  // uses <= endDate.
  return new Date(Date.UTC(year, month1to12, 0, 23, 59, 59, 999)).toISOString();
}

function startOfDayIso(dateYmd: string) {
  // dateYmd: YYYY-MM-DD
  return new Date(`${dateYmd}T00:00:00.000Z`).toISOString();
}

function endOfDayIso(dateYmd: string) {
  return new Date(`${dateYmd}T23:59:59.999Z`).toISOString();
}

function startOfYearIso(year: number) {
  return new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0)).toISOString();
}

function endOfYearIso(year: number) {
  return new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999)).toISOString();
}

function daysInMonth(year: number, month1to12: number) {
  return new Date(year, month1to12, 0).getDate();
}

function getDayOfMonth(raw: unknown): number | null {
  if (!raw) return null;
  const s = String(raw);

  // ✅ Avoid timezone shifts entirely by using the date-part when available.
  // Many backends store dates like "2026-01-20T00:00:00.000Z"; converting to local time
  // can move it to the previous day, which makes buckets show 0.
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) {
    const day = Number(m[3]);
    return Number.isFinite(day) ? day : null;
  }

  // Fallback for non-ISO formats.
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.getDate();
}

function isMmsType(raw: unknown): boolean {
  const s = String(raw ?? '').toLowerCase();
  return s.includes('mms');
}

// Brand color used across Sweepstouch marketing assets.
// We do NOT use theme.palette.primary here because the admin theme can be blue.
const SWEEPSTOUCH_PINK = '#ff0f6e';

async function fetchAllCampaignsFromStartDate(startDate: string) {
  // NOTE: getFilteredCampaigns is paginated. For charts we must fetch ALL pages,
  // otherwise earlier days in the month will show as 0.
  //
  // We intentionally pass ONLY startDate (no endDate) to match the original behavior
  // the user requested and then apply month filtering client-side.
  const limit = 200;
  let page = 1;
  const rows: Campaing[] = [];

  // Robust loop (matches Campaigns export logic). Safety cap included.
  for (let guard = 0; guard < 5000; guard += 1) {
    const res = (await campaignClient.getFilteredCampaigns({
      page,
      limit,
      startDate,
      status: 'completed',
    })) as PaginatedResponse<Campaing>;

    const data = Array.isArray(res?.data) ? res.data : [];
    rows.push(...data);

    if (data.length < limit) break;
    page += 1;
  }

  return rows;
}

async function fetchAllCampaignsForRange(params: { startDate: string; endDate: string }) {
  // Same pagination behavior as the Campaigns list/export.
  const limit = 200;
  let page = 1;
  const rows: Campaing[] = [];

  for (let guard = 0; guard < 5000; guard += 1) {
    const res = (await campaignClient.getFilteredCampaigns({
      page,
      limit,
      startDate: params.startDate,
      endDate: params.endDate,
      status: 'completed',
    })) as PaginatedResponse<Campaing>;

    const data = Array.isArray(res?.data) ? res.data : [];
    rows.push(...data);

    if (data.length < limit) break;
    page += 1;
  }

  return rows;
}


type YearBlockProps = {
  year: number;
  campaigns?: Campaing[];
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
  limitToMonthNumber?: number; // inclusive
  headerControls?: React.ReactNode;
};

function YearBlock({
  year,
  campaigns,
  isLoading,
  isError,
  error,
  limitToMonthNumber,
  headerControls,
}: YearBlockProps) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();

  const months = useMemo(() => {
    // Aggregate ONLY completed campaigns by month (based on startDate).
    const smsByMonth = new Array(12).fill(0);
    const mmsByMonth = new Array(12).fill(0);

    (campaigns ?? []).forEach((c) => {
      const start = String((c as any)?.startDate ?? '');
      let monthIdx: number | null = null;

      // ISO preferred: YYYY-MM-...
      if (/^\d{4}-\d{2}-\d{2}/.test(start)) {
        const m = Number(start.slice(5, 7));
        monthIdx = Number.isFinite(m) ? m - 1 : null;
      } else {
        const dt = new Date(start);
        if (!Number.isNaN(dt.getTime())) monthIdx = dt.getUTCMonth();
      }

      if (monthIdx == null || monthIdx < 0 || monthIdx > 11) return;

      const aud = n((c as any)?.audience);
      if (isMmsType((c as any)?.type)) mmsByMonth[monthIdx] += aud;
      else smsByMonth[monthIdx] += aud;
    });

    const totalsByMonth = smsByMonth.map((v, i) => v + mmsByMonth[i]);

    const all = Array.from({ length: 12 }, (_, i) => ({
      monthNumber: i + 1,
      sms: smsByMonth[i],
      mms: mmsByMonth[i],
      total: totalsByMonth[i],
    }));

    if (typeof limitToMonthNumber === 'number') {
      return all.filter((m) => m.monthNumber <= limitToMonthNumber);
    }
    return all;
  }, [campaigns, limitToMonthNumber]);

  const labels = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(i18n.language || undefined, { month: 'short', timeZone: 'UTC' });
    return months.map((m) =>
      fmt.format(new Date(Date.UTC(year, m.monthNumber - 1, 1))).toUpperCase()
    );
  }, [months, year, i18n.language]);

  const totals = months.map((m) => n(m.total));
  const sms = months.map((m) => n(m.sms));
  const mms = months.map((m) => n(m.mms));

  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 2, sm: 3 },
        borderRadius: 3,
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
        spacing={1}
        sx={{ mb: 2 }}
      >
        <Box>
          <Typography
            variant="h6"
            sx={{ fontWeight: 800 }}
          >
            {t('Messages sent')} · {year}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
          >
            {t('Total messages sent per month (completed campaigns)')}
          </Typography>
        </Box>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }}>
          {headerControls ?? null}
          {campaigns ? (
            <Typography
              variant="h6"
              sx={{ fontWeight: 800, lineHeight: 1.1, fontSize: { xs: '1.05rem', sm: '1.2rem' } }}
            >
              {t('Year Total')}: {totals.reduce((a, b) => a + b, 0).toLocaleString()}
            </Typography>
          ) : null}
        </Stack>
      </Stack>

      {isLoading ? (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 260,
          }}
        >
          <CircularProgress />
        </Box>
      ) : isError ? (
        <Alert
          severity="error"
          icon={<ErrorOutlineRoundedIcon />}
        >
          {t('Could not load data for')} {year}.
          {error ? (
            <Box component="span" sx={{ ml: 1, opacity: 0.9 }}>
              {String((error as any)?.message ?? error)}
            </Box>
          ) : null}
        </Alert>
      ) : months.length === 0 ? (
        <Alert severity="info">{t('No data available for this year.')}</Alert>
      ) : (
        <Box sx={{ width: '100%', overflowX: 'auto' }}>
          <Box sx={{ minWidth: 720 }}>
            <BarChart
              height={320}
              xAxis={[{ scaleType: 'band', data: labels }]}
              series={[
                { data: sms, label: t('SMS'), color: theme.palette.grey[400] } as any,
                { data: mms, label: t('MMS'), color: theme.palette.grey[700] } as any,
                { data: totals, label: t('Total'), color: SWEEPSTOUCH_PINK } as any,
              ]}
              grid={{ horizontal: true }}
            />
          </Box>
        </Box>
      )}
    </Paper>
  );
}

export default function MessagesSentClient(): React.JSX.Element {
  const customization = useCustomization();
  const theme = useTheme();
  const { t, i18n } = useTranslation();

  const now = new Date();
  const currentYear = now.getFullYear();
  const previousYear = currentYear - 1;
  const currentMonthNumber = now.getMonth() + 1; // 1..12

  const [yearSelected, setYearSelected] = useState<number>(currentYear);

  const [dailyYear, setDailyYear] = useState<number>(currentYear);
  const [dailyMonth, setDailyMonth] = useState<number>(currentMonthNumber);

  const todayYmd = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [cmpMode, setCmpMode] = useState<'day' | 'month' | 'year'>('day');

  // Comparison selection A
  const [cmpADay, setCmpADay] = useState<string>(todayYmd);
  const [cmpAYear, setCmpAYear] = useState<number>(currentYear);
  const [cmpAMonth, setCmpAMonth] = useState<number>(currentMonthNumber);

  // Comparison selection B
  const [cmpBDay, setCmpBDay] = useState<string>(todayYmd);
  const [cmpBYear, setCmpBYear] = useState<number>(previousYear);
  const [cmpBMonth, setCmpBMonth] = useState<number>(currentMonthNumber);

  const monthOptions = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(2000, i, 1);
      return {
        value: i + 1,
        label: d.toLocaleString(undefined, { month: 'long' }),
      };
    });
  }, []);

  const yearOptions = useMemo(() => {
    // Simple, predictable list: previous + current. Expand later if needed.
    return [previousYear, currentYear];
  }, [previousYear, currentYear]);

  function fmtYmdLabel(ymd: string) {
    // Render YYYY-MM-DD as a readable label without relying on local timezone.
    // Example: 2026-02-06 -> Feb 6, 2026
    const m = ymd.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return ymd;
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    const date = new Date(Date.UTC(y, mo - 1, d));
    return new Intl.DateTimeFormat(i18n.language || undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    }).format(date);
  }

  function fmtYearMonthLabel(year: number, month1to12: number) {
    const date = new Date(Date.UTC(year, month1to12 - 1, 1));
    return new Intl.DateTimeFormat(i18n.language || undefined, {
      year: 'numeric',
      month: 'long',
      timeZone: 'UTC',
    }).format(date);
  }

  type CompareTotals = {
    label: string;
    sms: number;
    mms: number;
    total: number;
  };

  async function getCompareTotals(which: 'A' | 'B'): Promise<CompareTotals> {
    if (cmpMode === 'day') {
      const ymd = which === 'A' ? cmpADay : cmpBDay;
      const startDate = startOfDayIso(ymd);
      const endDate = endOfDayIso(ymd);
      const rows = await fetchAllCampaignsForRange({ startDate, endDate });

      let sms = 0;
      let mms = 0;
      for (const c of rows) {
        const audience = n((c as any)?.audience);
        if (isMmsType((c as any)?.type)) mms += audience;
        else sms += audience;
      }
      return { label: fmtYmdLabel(ymd), sms, mms, total: sms + mms };
    }

    if (cmpMode === 'month') {
      const year = which === 'A' ? cmpAYear : cmpBYear;
      const month = which === 'A' ? cmpAMonth : cmpBMonth;
      const startDate = startOfMonthIso(year, month);
      const endDate = endOfMonthIso(year, month);
      const rows = await fetchAllCampaignsForRange({ startDate, endDate });

      let sms = 0;
      let mms = 0;
      for (const c of rows) {
        const audience = n((c as any)?.audience);
        if (isMmsType((c as any)?.type)) mms += audience;
        else sms += audience;
      }
      return { label: fmtYearMonthLabel(year, month), sms, mms, total: sms + mms };
    }

    // year
    const year = which === 'A' ? cmpAYear : cmpBYear;
    const startDate = startOfYearIso(year);
    const endDate = endOfYearIso(year);
    const rows = await fetchAllCampaignsForRange({ startDate, endDate });

    let sms = 0;
    let mms = 0;
    for (const c of rows) {
      const audience = n((c as any)?.audience);
      if (isMmsType((c as any)?.type)) mms += audience;
      else sms += audience;
    }
    return { label: String(year), sms, mms, total: sms + mms };
  }

  const compareAQ = useQuery<CompareTotals>({
    queryKey: ['dashboards', 'messages-sent', 'compare', 'A', { cmpMode, cmpADay, cmpAYear, cmpAMonth, lang: i18n.language }],
    queryFn: () => getCompareTotals('A'),
    staleTime: 1000 * 60 * 5,
  });

  const compareBQ = useQuery<CompareTotals>({
    queryKey: ['dashboards', 'messages-sent', 'compare', 'B', { cmpMode, cmpBDay, cmpBYear, cmpBMonth, lang: i18n.language }],
    queryFn: () => getCompareTotals('B'),
    staleTime: 1000 * 60 * 5,
  });

  const dailyQ = useQuery<{
    days: string[];
    weekdays: string[];
    sms: number[];
    mms: number[];
    total: number[];
    monthTotal: number;
    year: number;
    month: number;
  }>(
    {
      queryKey: ['dashboards', 'messages-sent', 'daily', { year: dailyYear, month: dailyMonth, lang: i18n.language }],
      queryFn: async () => {
        const start = startOfMonthIso(dailyYear, dailyMonth);
        const ym = `${dailyYear}-${pad2(dailyMonth)}`;

        const all = await fetchAllCampaignsFromStartDate(start);
        // Keep only campaigns whose startDate falls within the selected year-month.
        // This avoids depending on endDate range filtering on the backend.
        const campaigns = all.filter((c) => {
          const s = String((c as any)?.startDate ?? '');
          return s.startsWith(ym);
        });

        const dim = daysInMonth(dailyYear, dailyMonth);
        const smsBucket = Array.from({ length: dim }, () => 0);
        const mmsBucket = Array.from({ length: dim }, () => 0);

        for (const c of campaigns) {
          // Bucket strictly by startDate (the real send date in this project).
          const day = getDayOfMonth((c as any)?.startDate);
          if (!day) continue;
          if (day < 1 || day > dim) continue;

          const audience = n((c as any)?.audience);
          if (isMmsType((c as any)?.type)) {
            mmsBucket[day - 1] += audience;
          } else {
            smsBucket[day - 1] += audience;
          }
        }

        // IMPORTANT: specify timeZone='UTC' to avoid local-timezone shifting the weekday
        // (e.g. Date.UTC midnight rendered in UTC-6 could show the previous day).
        const weekdayFmt = new Intl.DateTimeFormat(i18n.language || undefined, {
          weekday: 'long',
          timeZone: 'UTC',
        });
        const days = Array.from({ length: dim }, (_, i) => String(i + 1));
        const weekdays = Array.from({ length: dim }, (_, i) => {
          const day = i + 1;
          return weekdayFmt.format(new Date(Date.UTC(dailyYear, dailyMonth - 1, day)));
        });
        const totalBucket = smsBucket.map((v, i) => v + mmsBucket[i]);
        const monthTotal = totalBucket.reduce((a, b) => a + b, 0);
        return {
          days,
          weekdays,
          sms: smsBucket,
          mms: mmsBucket,
          total: totalBucket,
          monthTotal,
          year: dailyYear,
          month: dailyMonth,
        };
      },
      staleTime: 1000 * 60 * 10,
    }
  );

  const pageMeta = {
    title: 'Messages sent',
    description: 'Month-by-month overview of total messages sent by campaigns',
    icon: <ChartBarIcon />,
  };

  const yearQ = useQuery<Campaing[]>({
    queryKey: ['dashboards', 'messages-sent', { year: yearSelected, status: 'completed' }],
    queryFn: async () => {
      // Fetch ALL completed campaigns for the selected year (paginated).
      const start = new Date(Date.UTC(yearSelected, 0, 1, 0, 0, 0, 0)).toISOString();
      const end = new Date(Date.UTC(yearSelected, 11, 31, 23, 59, 59, 999)).toISOString();
      return fetchAllCampaignsForRange({ startDate: start, endDate: end });
    },
    staleTime: 1000 * 60 * 10,
  });

return (
    <>
      {pageMeta.title && (
        <Container
          sx={{
            py: {
              xs: 2,
              sm: 3,
            },
          }}
          maxWidth={customization.stretch ? false : 'xl'}
        >
          <PageHeading
            sx={{ px: 0 }}
            title={t(pageMeta.title)}
            description={t(pageMeta.description)}
            iconBox={
              pageMeta.icon ? (
                <AvatarState
                  isSoft
                  variant="rounded"
                  state="primary"
                  sx={{
                    height: theme.spacing(7),
                    width: theme.spacing(7),
                    svg: {
                      height: theme.spacing(4),
                      width: theme.spacing(4),
                      minWidth: theme.spacing(4),
                    },
                  }}
                >
                  {pageMeta.icon}
                </AvatarState>
              ) : undefined
            }
          />
        </Container>
      )}

      <Container
        disableGutters
        maxWidth={customization.stretch ? false : 'xl'}
      >
        <Box
          px={{ xs: 2, sm: 3 }}
          pb={{ xs: 2, sm: 3 }}
        >
          <Stack spacing={{ xs: 2, sm: 3 }}>
            <YearBlock
              year={yearSelected}
              campaigns={yearQ.data}
              isLoading={yearQ.isLoading}
              isError={yearQ.isError}
              error={yearQ.error}
              limitToMonthNumber={yearSelected === currentYear ? currentMonthNumber : undefined}
              headerControls={
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel id="year-select-label">{t('Year')}</InputLabel>
                  <Select
                    labelId="year-select-label"
                    label={t('Year')}
                    value={yearSelected}
                    onChange={(e) => setYearSelected(Number(e.target.value))}
                  >
                    {[previousYear, currentYear].map((y) => (
                      <MenuItem key={y} value={y}>
                        {y}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              }
            />

            <Paper
              variant="outlined"
              sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }}
            >
              <Stack spacing={2}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    {t('Messages sent per day')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('Pick a month to see total messages sent each day (grouped by campaign date).')}
                  </Typography>
                </Box>

                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={2}
                  alignItems={{ xs: 'stretch', sm: 'center' }}
                  justifyContent="space-between"
                >
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <FormControl size="small" sx={{ minWidth: 140 }}>
                      <InputLabel id="daily-year-label">{t('Year')}</InputLabel>
                      <Select
                        labelId="daily-year-label"
                        label={t('Year')}
                        value={dailyYear}
                        onChange={(e) => setDailyYear(Number(e.target.value))}
                      >
                        {[previousYear, currentYear].map((y) => (
                          <MenuItem key={y} value={y}>
                            {y}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ minWidth: 180 }}>
                      <InputLabel id="daily-month-label">{t('Month')}</InputLabel>
                      <Select
                        labelId="daily-month-label"
                        label={t('Month')}
                        value={dailyMonth}
                        onChange={(e) => setDailyMonth(Number(e.target.value))}
                      >
                        {monthOptions.map((m) => (
                          <MenuItem key={m.value} value={m.value}>
                            {m.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Stack>

                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 800, lineHeight: 1.1, fontSize: { xs: '1.05rem', sm: '1.2rem' } }}
                  >
                    {t('Month total')}: {n(dailyQ.data?.monthTotal).toLocaleString()}
                  </Typography>
                </Stack>

                {dailyQ.isLoading ? (
                  <Box
                    sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 260 }}
                  >
                    <CircularProgress />
                  </Box>
                ) : dailyQ.isError ? (
                  <Alert severity="error" icon={<ErrorOutlineRoundedIcon />}>
                    {t('Could not load daily data.')}
                    {dailyQ.error ? (
                      <Box component="span" sx={{ ml: 1, opacity: 0.9 }}>
                        {String((dailyQ.error as any)?.message ?? dailyQ.error)}
                      </Box>
                    ) : null}
                  </Alert>
                ) : (dailyQ.data?.days?.length ?? 0) === 0 ? (
                  <Alert severity="info">{t('No data available for this month.')}</Alert>
                ) : (
                  <Box sx={{ width: '100%', overflowX: 'auto' }}>
                    <Box sx={{ minWidth: 720 }}>
                      <BarChart
                        height={320}
                        xAxis={[
                          {
                            scaleType: 'band',
                            data: dailyQ.data!.days,
                            valueFormatter: (value: any, ctx: any) => {
                              const dayStr = String(value);
                              const idx = Number(dayStr) - 1;
                              const weekday = dailyQ.data!.weekdays[idx] ?? '';
                              if (ctx?.location === 'tooltip') {
                                return weekday ? `${dayStr} · ${weekday}` : dayStr;
                              }
                              return dayStr;
                            },
                          } as any,
                        ]}
                        series={[
                          { data: dailyQ.data!.sms, label: t('SMS'), color: theme.palette.grey[400] } as any,
                          { data: dailyQ.data!.mms, label: t('MMS'), color: theme.palette.grey[700] } as any,
                          { data: dailyQ.data!.total, label: t('Total'), color: SWEEPSTOUCH_PINK } as any,
                        ]}
                        grid={{ horizontal: true }}
                      />
                    </Box>
                  </Box>
                )}
              </Stack>
            </Paper>

            <Paper
              variant="outlined"
              sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }}
            >
              <Stack spacing={2}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    {t('Compare ranges')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('Select a day, month, or year to compare message volume between two ranges.')}
                  </Typography>
                </Box>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
                  <FormControl size="small" sx={{ minWidth: 180 }}>
                    <InputLabel id="cmp-mode-label">{t('Range')}</InputLabel>
                    <Select
                      labelId="cmp-mode-label"
                      label={t('Range')}
                      value={cmpMode}
                      onChange={(e) => setCmpMode(e.target.value as any)}
                    >
                      <MenuItem value="day">{t('Day')}</MenuItem>
                      <MenuItem value="month">{t('Month')}</MenuItem>
                      <MenuItem value="year">{t('Year')}</MenuItem>
                    </Select>
                  </FormControl>
                </Stack>

                <Stack
                  direction={{ xs: 'column', md: 'row' }}
                  spacing={2}
                  alignItems={{ xs: 'stretch', md: 'flex-start' }}
                >
                  {/* Selection A */}
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
                      {t('Selection A')}
                    </Typography>

                    {cmpMode === 'day' ? (
                      <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                          label={t('Date')}
                          value={ymdToLocalDate(cmpADay)}
                          onChange={(v) => {
                            const next = localDateToYmd(v as any);
                            if (next) setCmpADay(next);
                          }}
                          slotProps={{
                            textField: {
                              size: 'small',
                              fullWidth: true,
                            } as any,
                          }}
                        />
                      </LocalizationProvider>
                    ) : cmpMode === 'month' ? (
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <FormControl size="small" sx={{ minWidth: 140, flex: 1 }}>
                          <InputLabel id="cmp-a-year-label">{t('Year')}</InputLabel>
                          <Select
                            labelId="cmp-a-year-label"
                            label={t('Year')}
                            value={cmpAYear}
                            onChange={(e) => setCmpAYear(Number(e.target.value))}
                          >
                            {yearOptions.map((y) => (
                              <MenuItem key={y} value={y}>
                                {y}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>

                        <FormControl size="small" sx={{ minWidth: 180, flex: 1 }}>
                          <InputLabel id="cmp-a-month-label">{t('Month')}</InputLabel>
                          <Select
                            labelId="cmp-a-month-label"
                            label={t('Month')}
                            value={cmpAMonth}
                            onChange={(e) => setCmpAMonth(Number(e.target.value))}
                          >
                            {monthOptions.map((m) => (
                              <MenuItem key={m.value} value={m.value}>
                                {m.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Stack>
                    ) : (
                      <FormControl size="small" sx={{ minWidth: 140 }}>
                        <InputLabel id="cmp-a-only-year-label">{t('Year')}</InputLabel>
                        <Select
                          labelId="cmp-a-only-year-label"
                          label={t('Year')}
                          value={cmpAYear}
                          onChange={(e) => setCmpAYear(Number(e.target.value))}
                        >
                          {yearOptions.map((y) => (
                            <MenuItem key={y} value={y}>
                              {y}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}

                    <Box sx={{ mt: 2, width: '100%', overflowX: 'auto' }}>
                      {compareAQ.isLoading ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 220 }}>
                          <CircularProgress size={24} />
                        </Box>
                      ) : compareAQ.isError ? (
                        <Alert severity="error" icon={<ErrorOutlineRoundedIcon />}>
                          {t('Could not load comparison data.')}
                        </Alert>
                      ) : compareAQ.data ? (
                        <>
                          <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
                            {compareAQ.data.label}
                          </Typography>
                          <Box sx={{ minWidth: 320 }}>
                            <BarChart
                              height={240}
                              xAxis={[{ scaleType: 'band', data: [''] }]}
                              series={[
                                { data: [compareAQ.data.sms], label: t('SMS'), color: theme.palette.grey[400] } as any,
                                { data: [compareAQ.data.mms], label: t('MMS'), color: theme.palette.grey[700] } as any,
                                { data: [compareAQ.data.total], label: t('Total'), color: SWEEPSTOUCH_PINK } as any,
                              ]}
                              grid={{ horizontal: true }}
                            />
                          </Box>
                        </>
                      ) : null}
                    </Box>
                  </Box>

                  {/* Selection B */}
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
                      {t('Selection B')}
                    </Typography>

                    {cmpMode === 'day' ? (
                      <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                          label={t('Date')}
                          value={ymdToLocalDate(cmpBDay)}
                          onChange={(v) => {
                            const next = localDateToYmd(v as any);
                            if (next) setCmpBDay(next);
                          }}
                          slotProps={{
                            textField: {
                              size: 'small',
                              fullWidth: true,
                            } as any,
                          }}
                        />
                      </LocalizationProvider>
                    ) : cmpMode === 'month' ? (
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <FormControl size="small" sx={{ minWidth: 140, flex: 1 }}>
                          <InputLabel id="cmp-b-year-label">{t('Year')}</InputLabel>
                          <Select
                            labelId="cmp-b-year-label"
                            label={t('Year')}
                            value={cmpBYear}
                            onChange={(e) => setCmpBYear(Number(e.target.value))}
                          >
                            {yearOptions.map((y) => (
                              <MenuItem key={y} value={y}>
                                {y}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>

                        <FormControl size="small" sx={{ minWidth: 180, flex: 1 }}>
                          <InputLabel id="cmp-b-month-label">{t('Month')}</InputLabel>
                          <Select
                            labelId="cmp-b-month-label"
                            label={t('Month')}
                            value={cmpBMonth}
                            onChange={(e) => setCmpBMonth(Number(e.target.value))}
                          >
                            {monthOptions.map((m) => (
                              <MenuItem key={m.value} value={m.value}>
                                {m.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Stack>
                    ) : (
                      <FormControl size="small" sx={{ minWidth: 140 }}>
                        <InputLabel id="cmp-b-only-year-label">{t('Year')}</InputLabel>
                        <Select
                          labelId="cmp-b-only-year-label"
                          label={t('Year')}
                          value={cmpBYear}
                          onChange={(e) => setCmpBYear(Number(e.target.value))}
                        >
                          {yearOptions.map((y) => (
                            <MenuItem key={y} value={y}>
                              {y}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}

                    <Box sx={{ mt: 2, width: '100%', overflowX: 'auto' }}>
                      {compareBQ.isLoading ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 220 }}>
                          <CircularProgress size={24} />
                        </Box>
                      ) : compareBQ.isError ? (
                        <Alert severity="error" icon={<ErrorOutlineRoundedIcon />}>
                          {t('Could not load comparison data.')}
                        </Alert>
                      ) : compareBQ.data ? (
                        <>
                          <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
                            {compareBQ.data.label}
                          </Typography>
                          <Box sx={{ minWidth: 320 }}>
                            <BarChart
                              height={240}
                              xAxis={[{ scaleType: 'band', data: [''] }]}
                              series={[
                                { data: [compareBQ.data.sms], label: t('SMS'), color: theme.palette.grey[400] } as any,
                                { data: [compareBQ.data.mms], label: t('MMS'), color: theme.palette.grey[700] } as any,
                                { data: [compareBQ.data.total], label: t('Total'), color: SWEEPSTOUCH_PINK } as any,
                              ]}
                              grid={{ horizontal: true }}
                            />
                          </Box>
                        </>
                      ) : null}
                    </Box>
                  </Box>
                </Stack>
              </Stack>
            </Paper>
          </Stack>
        </Box>
      </Container>
    </>
  );
}
