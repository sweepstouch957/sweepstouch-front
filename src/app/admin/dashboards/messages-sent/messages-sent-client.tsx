'use client';

import ChartBarIcon from '@heroicons/react/24/outline/ChartBarIcon';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  FormControl,
  InputLabel,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateCalendar, LocalizationProvider } from '@mui/x-date-pickers';
import { PickersDay } from '@mui/x-date-pickers/PickersDay';
import type { PickersDayProps } from '@mui/x-date-pickers/PickersDay';
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

type RangePickerValue = {
  startYmd: string;
  endYmd: string;
};

function RangePickerField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: RangePickerValue;
  onChange: (next: RangePickerValue) => void;
}) {
  const { t } = useTranslation();
  const { startYmd, endYmd } = value;
  const [open, setOpen] = useState(false);

  const startDate = ymdToLocalDate(startYmd);
  const endDate = ymdToLocalDate(endYmd);

  const [draftStart, setDraftStart] = useState<Date | null>(startDate);
  const [draftEnd, setDraftEnd] = useState<Date | null>(endDate);
  const [anchorMonth, setAnchorMonth] = useState<Date>(() => startDate ?? new Date());

  const openDialog = () => {
    setDraftStart(startDate);
    setDraftEnd(endDate);
    setAnchorMonth(startDate ?? new Date());
    setOpen(true);
  };

  const closeDialog = () => setOpen(false);

  const apply = () => {
    const s = localDateToYmd(draftStart);
    const e = localDateToYmd(draftEnd ?? draftStart);
    if (!s) return;
    if (!e) return;
    const nextStart = s <= e ? s : e;
    const nextEnd = s <= e ? e : s;
    onChange({ startYmd: nextStart, endYmd: nextEnd });
    setOpen(false);
  };

  const display = startYmd && endYmd ? `${startYmd} — ${endYmd}` : '';

  const CustomDay = (props: PickersDayProps<Date>) => {
    const { day, outsideCurrentMonth, ...other } = props;
    const s = draftStart;
    const e = draftEnd ?? draftStart;
    const time = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
    const startTime = s ? new Date(s.getFullYear(), s.getMonth(), s.getDate()).getTime() : null;
    const endTime = e ? new Date(e.getFullYear(), e.getMonth(), e.getDate()).getTime() : null;

    const inRange =
      startTime != null &&
      endTime != null &&
      time >= Math.min(startTime, endTime) &&
      time <= Math.max(startTime, endTime);

    const isStart = startTime != null && time === startTime;
    const isEnd = endTime != null && time === endTime;

    return (
      <PickersDay
        {...(other as any)}
        day={day}
        outsideCurrentMonth={outsideCurrentMonth}
        sx={{
          ...(inRange && {
            bgcolor: 'action.selected',
            borderRadius: 0,
            '&:hover': { bgcolor: 'action.selected' },
          }),
          ...(isStart && {
            borderTopLeftRadius: 16,
            borderBottomLeftRadius: 16,
          }),
          ...(isEnd && {
            borderTopRightRadius: 16,
            borderBottomRightRadius: 16,
          }),
        }}
      />
    );
  };

  const onPick = (date: Date | null) => {
    if (!date || Number.isNaN(date.getTime())) return;
    // 1st click sets start; 2nd click sets end.
    if (!draftStart || (draftStart && draftEnd)) {
      setDraftStart(date);
      setDraftEnd(null);
      return;
    }
    setDraftEnd(date);
  };

  return (
    <>
      <TextField
        label={label}
        value={display}
        size="small"
        fullWidth
        onClick={openDialog}
        InputProps={{
          readOnly: true,
          endAdornment: (
            <InputAdornment position="end">
              <CalendarMonthIcon fontSize="small" />
            </InputAdornment>
          ),
        }}
      />

      <Dialog open={open} onClose={closeDialog} maxWidth="xs" fullWidth>
        <DialogContent>
          <Stack spacing={2}>
            <Stack direction="row" spacing={1} justifyContent="space-between">
              <TextField
                size="small"
                label={t('From')}
                value={localDateToYmd(draftStart)}
                InputProps={{ readOnly: true }}
                fullWidth
              />
              <TextField
                size="small"
                label={t('To')}
                value={localDateToYmd(draftEnd ?? draftStart)}
                InputProps={{ readOnly: true }}
                fullWidth
              />
            </Stack>

            <DateCalendar
              value={anchorMonth}
              onChange={(v) => {
                if (v && !Number.isNaN(v.getTime())) {
                  setAnchorMonth(v);
                  onPick(v);
                }
              }}
              slots={{ day: CustomDay as any }}
              referenceDate={anchorMonth}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>{t('Cancel')}</Button>
          <Button variant="contained" onClick={apply} disabled={!draftStart}>
            {t('Apply')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
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

  // Comparison range (used to compare the same date-range across previous months)
  const cmpDefaultStartYmd = useMemo(() => `${currentYear}-${pad2(currentMonthNumber)}-01`, [currentYear, currentMonthNumber]);
  const cmpDefaultEndYmd = useMemo(() => {
    // Default: from the 1st of the current month up to today.
    const day = now.getDate();
    return `${currentYear}-${pad2(currentMonthNumber)}-${pad2(day)}`;
  }, [currentYear, currentMonthNumber, now]);

  const [cmpRangeStartYmd, setCmpRangeStartYmd] = useState<string>(cmpDefaultStartYmd);
  const [cmpRangeEndYmd, setCmpRangeEndYmd] = useState<string>(cmpDefaultEndYmd);

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

  function addMonthsClamped(ymd: string, deltaMonths: number): string {
    const m = ymd.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return ymd;
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);

    const monthIndex = mo - 1;
    const total = y * 12 + monthIndex + deltaMonths;
    const ty = Math.floor(total / 12);
    const tm = total % 12;
    const month1to12 = tm + 1;
    const dim = daysInMonth(ty, month1to12);
    const dd = Math.min(d, dim);
    return `${ty}-${pad2(month1to12)}-${pad2(dd)}`;
  }

  async function getTotalsForRange(startYmd: string, endYmd: string): Promise<{ sms: number; mms: number; total: number }> {
    const rows = await fetchAllCampaignsForRange({
      startDate: startOfDayIso(startYmd),
      endDate: endOfDayIso(endYmd),
    });

    let sms = 0;
    let mms = 0;
    for (const c of rows) {
      const audience = n((c as any)?.audience);
      if (isMmsType((c as any)?.type)) mms += audience;
      else sms += audience;
    }
    return { sms, mms, total: sms + mms };
  }

  const comparePrevQ = useQuery<{ selected: CompareTotals; prev: CompareTotals[]; avg: CompareTotals }>({
    queryKey: ['dashboards', 'messages-sent', 'compare-prev3', { start: cmpRangeStartYmd, end: cmpRangeEndYmd, lang: i18n.language }],
    queryFn: async () => {
      const baseStart = cmpRangeStartYmd;
      const baseEnd = cmpRangeEndYmd;

      const selectedTotals = await getTotalsForRange(baseStart, baseEnd);

      const offsets = [-1, -2, -3];
      const prev: CompareTotals[] = [];

      for (const off of offsets) {
        const s = addMonthsClamped(baseStart, off);
        const e = addMonthsClamped(baseEnd, off);
        const totals = await getTotalsForRange(s, e);
        prev.push({
          label: `${fmtYmdLabel(s)} – ${fmtYmdLabel(e)}`,
          ...totals,
        });
      }

      const avgSms = prev.reduce((acc, r) => acc + r.sms, 0) / prev.length;
      const avgMms = prev.reduce((acc, r) => acc + r.mms, 0) / prev.length;
      const avgTotal = prev.reduce((acc, r) => acc + r.total, 0) / prev.length;

      return {
        selected: {
          label: `${fmtYmdLabel(baseStart)} – ${fmtYmdLabel(baseEnd)}`,
          ...selectedTotals,
        },
        prev,
        avg: {
          label: t('Average (last 3 months)'),
          sms: avgSms,
          mms: avgMms,
          total: avgTotal,
        },
      };
    },
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
            {/* Compare section first */}
            <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    {t('Compare ranges')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('Pick a date range and compare it with the same range in the previous 3 months.')}
                  </Typography>
                </Box>

                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <RangePickerField
                      label={t('Range (YYYY-MM-DD — YYYY-MM-DD)')}
                      value={{ startYmd: cmpRangeStartYmd, endYmd: cmpRangeEndYmd }}
                      onChange={(next) => {
                        setCmpRangeStartYmd(next.startYmd);
                        setCmpRangeEndYmd(next.endYmd);
                      }}
                    />
                  </LocalizationProvider>

                  <Box sx={{ flex: 1 }} />

                  <Typography variant="body2" sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>
                    {t('Selected range')}: {fmtYmdLabel(cmpRangeStartYmd)} – {fmtYmdLabel(cmpRangeEndYmd)}
                  </Typography>
                </Stack>

                <Box sx={{ mt: 1 }}>
                  {comparePrevQ.isLoading ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240 }}>
                      <CircularProgress size={26} />
                    </Box>
                  ) : comparePrevQ.isError ? (
                    <Alert severity="error" icon={<ErrorOutlineRoundedIcon />}>
                      {t('Could not load comparison data.')}
                    </Alert>
                  ) : comparePrevQ.data ? (
                    <Stack spacing={2}>
                      <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={2}
                        justifyContent="space-between"
                        alignItems={{ xs: 'flex-start', sm: 'center' }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 800 }}>
                          {t('Selected range total')}: {comparePrevQ.data.selected.total.toLocaleString()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
                          {comparePrevQ.data.selected.label}
                        </Typography>
                      </Stack>

                      {/* Chart 1: Selected range vs Promedio trimestre anterior */}
                      <Box sx={{ width: '100%', overflowX: 'auto' }}>
                        <Box sx={{ minWidth: 520 }}>
                          {(() => {
                            const xLabels = [t('Selected range'), t('Average (last 3 months)')];
                            const selectedSms = n(comparePrevQ.data.selected.sms);
                            const selectedMms = n(comparePrevQ.data.selected.mms);
                            const selectedTotal = n(comparePrevQ.data.selected.total);
                            const avgSms = n(comparePrevQ.data.avg.sms);
                            const avgMms = n(comparePrevQ.data.avg.mms);
                            const avgTotal = n(comparePrevQ.data.avg.total);

                            return (
                              <BarChart
                                height={260}
                                xAxis={[{ scaleType: 'band', data: xLabels } as any]}
                                series={[
                                  { data: [selectedSms, avgSms], label: t('SMS'), color: theme.palette.grey[400] } as any,
                                  { data: [selectedMms, avgMms], label: t('MMS'), color: theme.palette.grey[700] } as any,
                                  { data: [selectedTotal, avgTotal], label: t('Total'), color: SWEEPSTOUCH_PINK } as any,
                                ]}
                                grid={{ horizontal: true }}
                              />
                            );
                          })()}
                        </Box>
                      </Box>

                      {/* Chart 2: the 3 months used for the promedio */}
                      <Box sx={{ width: '100%', overflowX: 'auto' }}>
                        <Box sx={{ minWidth: 760 }}>
                          {(() => {
                            const prev = comparePrevQ.data.prev;
                            const cats = [
                              { short: t('Previous month'), full: prev[0]?.label ?? '', v: prev[0] },
                              { short: t('2 months ago'), full: prev[1]?.label ?? '', v: prev[1] },
                              { short: t('3 months ago'), full: prev[2]?.label ?? '', v: prev[2] },
                            ].filter((c) => c.v);

                            const xLabels = cats.map((c) => c.short);
                            const sms = cats.map((c) => n(c.v?.sms));
                            const mms = cats.map((c) => n(c.v?.mms));
                            const totals = cats.map((c) => n(c.v?.total));
                            const fullLabels = cats.map((c) => c.full);

                            return (
                              <BarChart
                                height={260}
                                xAxis={[
                                  {
                                    scaleType: 'band',
                                    data: xLabels,
                                    valueFormatter: (value: any, ctx: any) => {
                                      const idx = xLabels.indexOf(String(value));
                                      const detail = fullLabels[idx] ?? '';
                                      if (ctx?.location === 'tooltip' && detail) return `${value}: ${detail}`;
                                      return String(value);
                                    },
                                  } as any,
                                ]}
                                series={[
                                  { data: sms, label: t('SMS'), color: theme.palette.grey[400] } as any,
                                  { data: mms, label: t('MMS'), color: theme.palette.grey[700] } as any,
                                  { data: totals, label: t('Total'), color: SWEEPSTOUCH_PINK } as any,
                                ]}
                                grid={{ horizontal: true }}
                              />
                            );
                          })()}
                        </Box>
                      </Box>
                    </Stack>
                  ) : null}
                </Box>
              </Stack>
            </Paper>

            {/* Daily section second */}
            <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
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

            {/* Year view last */}
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
          </Stack>
        </Box>
      </Container>
    </>
  );
}
