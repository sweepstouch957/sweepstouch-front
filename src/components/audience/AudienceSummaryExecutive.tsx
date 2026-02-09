// src/components/audience/AudienceSummaryExecutive.tsx
'use client';

import { useAudienceStoresGrowth } from '@/hooks/fetching/campaigns/useAudienceStoresGrowth';
import type {
  AudienceStoreGrowthRow,
  AudienceStoresGrowthQueryParams,
  AudienceStoresGrowthSenderScope,
  AudienceStoresGrowthSort,
} from '@/services/campaing.service';
import DateRangeRoundedIcon from '@mui/icons-material/DateRangeRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import LaunchRoundedIcon from '@mui/icons-material/LaunchRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import {
  alpha,
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Popover,
  Select,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { addDays, format as fmtDate, parseISO } from 'date-fns';
import { saveAs } from 'file-saver';
import Link from 'next/link';
import React, { useMemo, useState } from 'react';
import { DateRange, type RangeKeyDict } from 'react-date-range';
import * as XLSX from 'xlsx';
import { GlassCard } from './ui';

/* ===================== Types (mínimos) ===================== */
type GroupSummary = {
  storesCount: number;
  audiencePrev: number;
  audienceCurr: number;
  growthAbs: number;
  growthPct: number;
  newInPeriod: number;
  churnInPeriod: number;
  netGrowth: number;
};

type AudienceSummaryResponse = {
  period?: { start: string; end: string };
  previousPeriod?: { start: string; end: string };
  senders?: GroupSummary;
  nonSenders?: GroupSummary;
};

type Props = {
  data?: AudienceSummaryResponse;
  loading?: boolean;
  error?: boolean;
  onExploreClick?: () => void;

  period?: AudienceStoresGrowthQueryParams['period'];
  year?: number;
  start?: string;
  end?: string;

  includeInactive?: boolean;
  status?: 'active' | 'inactive' | 'all';
};

function fmt(n: any) {
  const num = Number(n ?? 0);
  if (!Number.isFinite(num)) return '0';
  return new Intl.NumberFormat('en-US').format(num);
}
function fmtPct(n: any) {
  const num = Number(n ?? 0);
  if (!Number.isFinite(num)) return '0.00%';
  return `${num.toFixed(2)}%`;
}
function isoDateOnly(d: Date) {
  return fmtDate(d, 'yyyy-MM-dd');
}
function safeParseIsoDateOnly(s?: string) {
  if (!s) return null;
  try {
    const d = parseISO(s);
    return Number.isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

/* ===================== Sort presets ===================== */
const SORTS: Array<{ label: string; value: AudienceStoresGrowthSort }> = [
  { label: 'Least growth ↑ (abs)', value: 'growthAbsAsc' }, // ✅ default
  { label: 'Most growth ↓ (abs)', value: 'growthAbsDesc' },
  { label: 'Least growth ↑ (%)', value: 'growthPctAsc' },
  { label: 'Most growth ↓ (%)', value: 'growthPctDesc' },
  { label: 'Audience ↓', value: 'audienceDesc' },
  { label: 'Audience ↑', value: 'audienceAsc' },
  { label: 'Net growth ↑', value: 'netGrowthAsc' },
  { label: 'Net growth ↓', value: 'netGrowthDesc' },
  { label: 'New ↑', value: 'newAsc' },
  { label: 'New ↓', value: 'newDesc' },
  { label: 'Churn ↑', value: 'churnAsc' },
  { label: 'Churn ↓', value: 'churnDesc' },
  { label: 'Name A→Z', value: 'nameAsc' },
  { label: 'Name Z→A', value: 'nameDesc' },
];

const PAGE_SIZES = [10, 15, 20, 30, 50, 100, 200] as const;

/* ===================== Compact summary tile ===================== */
function SummaryTile(props: { label: string; value: string; tone: 'success' | 'warning' }) {
  const { label, value, tone } = props;

  return (
    <Stack
      sx={(t) => ({
        borderRadius: 999,
        border: `1px solid ${alpha(t.palette[tone].main, 0.22)}`,
        bgcolor: alpha(t.palette[tone].main, 0.08),
        px: 2,
        py: 1.1,
        minHeight: 60,
        justifyContent: 'center',
        overflow: 'hidden',
      })}
      spacing={0.2}
    >
      <Typography
        variant="caption"
        sx={{
          color: 'text.secondary',
          fontWeight: 950,
          letterSpacing: 0.35,
          textTransform: 'uppercase',
          lineHeight: 1.05,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {label}
      </Typography>

      <Typography
        variant="body1"
        sx={{
          fontWeight: 980,
          letterSpacing: -0.2,
          lineHeight: 1.05,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {value}
      </Typography>
    </Stack>
  );
}

/* ===================== Store row (no slug + clickable) ===================== */
function StoreRowItem({ row, idx }: { row: AudienceStoreGrowthRow; idx: number }) {
  const name = row.name || 'Unknown store';
  const id = row.storeId;

  // ✅ tu backend retorna "image"
  const image = (row as any).image || null;

  const aud = Number(row.audienceCurr || 0);
  const net = Number(row.netGrowth || 0);
  const pct = Number(row.growthPct || 0);

  return (
    <Link
      href={`/admin/management/stores/edit/${id}`}
      passHref
      legacyBehavior
    >
      <Box
        component="a"
        sx={(t) => ({
          display: 'block',
          textDecoration: 'none',
          color: 'inherit',
          outline: 'none',
          '&:focus-visible .row': {
            boxShadow: `0 0 0 3px ${alpha(t.palette.primary.main, 0.22)}`,
          },
        })}
      >
        <Stack
          className="row"
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          gap={1.25}
          sx={(t) => ({
            px: 1.25,
            py: 0.95,
            borderBottom: `1px solid ${alpha(t.palette.divider, 0.6)}`,
            '&:hover': { bgcolor: alpha(t.palette.primary.main, 0.045) },
            borderRadius: 0,
            minWidth: 0,
            transition: 'background-color 120ms ease, box-shadow 120ms ease',
          })}
        >
          <Stack
            direction="row"
            alignItems="center"
            gap={1.1}
            sx={{ minWidth: 0, flex: 1 }}
          >
            <Avatar
              src={image ?? undefined}
              variant="rounded"
              sx={(t) => ({
                width: 32,
                height: 32,
                borderRadius: 2,
                bgcolor: alpha(t.palette.primary.main, 0.12),
                fontWeight: 950,
                fontSize: 14,
                flexShrink: 0,
              })}
            >
              {String(name).trim().slice(0, 1).toUpperCase()}
            </Avatar>

            <Typography
              variant="body2"
              sx={{
                fontWeight: 950,
                lineHeight: 1.15,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={name}
            >
              {idx + 1}. {name}
            </Typography>
          </Stack>

          <Stack
            direction="row"
            gap={0.75}
            alignItems="center"
            sx={{ flexShrink: 0, flexWrap: 'wrap' }}
          >
            <Chip
              size="small"
              label={`Aud ${fmt(aud)}`}
              sx={(t) => ({
                fontWeight: 900,
                bgcolor: alpha(t.palette.info.main, 0.12),
                color: t.palette.info.dark,
              })}
            />
            <Chip
              size="small"
              label={`${net >= 0 ? '+' : ''}${fmt(net)}`}
              sx={(t) => ({
                fontWeight: 900,
                bgcolor: alpha(t.palette.success.main, 0.12),
                color: t.palette.success.dark,
              })}
            />
            <Chip
              size="small"
              label={`${fmtPct(pct)}`}
              sx={(t) => ({
                fontWeight: 950,
                bgcolor: alpha(t.palette.primary.main, 0.12),
                color: t.palette.primary.dark,
              })}
            />
          </Stack>
        </Stack>
      </Box>
    </Link>
  );
}

export function AudienceSummaryExecutive({
  data,
  loading: loadingSummary,
  error: errorSummary,
  onExploreClick,
  year,
  start,
  end,
  includeInactive = false,
  status,
}: Props) {
  const theme = useTheme();
  const mdDown = useMediaQuery(theme.breakpoints.down('md'));
  const smDown = useMediaQuery(theme.breakpoints.down('sm'));

  /* ===================== DateRange (react-date-range) ===================== */
  const initialStart =
    safeParseIsoDateOnly(start) ||
    safeParseIsoDateOnly(data?.period?.start) ||
    addDays(new Date(), -30);
  const initialEnd =
    safeParseIsoDateOnly(end) || safeParseIsoDateOnly(data?.period?.end) || new Date();

  const [dateAnchor, setDateAnchor] = useState<HTMLElement | null>(null);
  const dateOpen = Boolean(dateAnchor);

  const [range, setRange] = useState({
    startDate: initialStart,
    endDate: initialEnd,
    key: 'selection',
  });

  const rangeLabel = useMemo(() => {
    const a = range.startDate ? fmtDate(range.startDate, 'MMM dd, yyyy') : '—';
    const b = range.endDate ? fmtDate(range.endDate, 'MMM dd, yyyy') : '—';
    return `${a} → ${b}`;
  }, [range.startDate, range.endDate]);

  /* ===================== filtros list ===================== */
  const [senderScope, setSenderScope] = useState<AudienceStoresGrowthSenderScope>('all');
  const [sort, setSort] = useState<AudienceStoresGrowthSort>('growthAbsAsc'); // ✅ default: menos crecieron
  const [limit, setLimit] = useState<(typeof PAGE_SIZES)[number]>(20);
  const [page] = useState<number>(1);

  const storesGrowthParams = useMemo<AudienceStoresGrowthQueryParams>(() => {
    const p: AudienceStoresGrowthQueryParams = {
      period: 'custom',
      includeInactive,
      status,
      senderScope,
      sort,
      page,
      limit,
      start: isoDateOnly(range.startDate || new Date()),
      end: isoDateOnly(range.endDate || new Date()),
    };
    if (typeof year === 'number') p.year = year;
    return p;
  }, [
    includeInactive,
    status,
    senderScope,
    sort,
    page,
    limit,
    year,
    range.startDate,
    range.endDate,
  ]);

  const {
    data: growthRes,
    isLoading: loadingGrowth,
    isFetching: fetchingGrowth,
    isError: errorGrowth,
  } = useAudienceStoresGrowth(storesGrowthParams, {
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  const senders = data?.senders;
  const nonSenders = data?.nonSenders;

  const totalChurn = (senders?.churnInPeriod || 0) + (nonSenders?.churnInPeriod || 0);
  const rows = growthRes?.data || [];

  const anyLoading = loadingSummary || loadingGrowth;
  const anyError = !!errorSummary || !!errorGrowth;

  /* ===================== Export Excel ===================== */
  function exportToExcel() {
    const payload = rows.map((r) => ({
      storeId: r.storeId,
      name: r.name,
      active: r.active,
      isSender: r.isSender,
      image: (r as any).image ?? null,
      audiencePrev: r.audiencePrev,
      audienceCurr: r.audienceCurr,
      growthAbs: r.growthAbs,
      growthPct: r.growthPct,
      newInPeriod: r.newInPeriod,
      churnInPeriod: r.churnInPeriod,
      netGrowth: r.netGrowth,
    }));

    const ws = XLSX.utils.json_to_sheet(payload);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'stores_growth');

    const fileBase = `stores-growth_${storesGrowthParams.start}_${storesGrowthParams.end}_${senderScope}_${sort}_${limit}.xlsx`;
    const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(
      new Blob([out], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }),
      fileBase
    );
  }

  const takeaway = useMemo(() => {
    const ns = fmtPct(nonSenders?.growthPct);
    const s = fmtPct(senders?.growthPct);
    if (senderScope === 'nonSenders')
      return `Non-senders ${ns} vs senders ${s}. Target the laggards first.`;
    if (senderScope === 'senders') return `Senders growth ${s}. Keep cadence + replicate.`;
    return `Non-senders ${ns} vs senders ${s}. Compare, then act.`;
  }, [nonSenders?.growthPct, senders?.growthPct, senderScope]);

  const listTitle = useMemo(() => {
    const scopeLabel =
      senderScope === 'senders'
        ? 'senders'
        : senderScope === 'nonSenders'
          ? 'non-senders'
          : 'all stores';
    const sortLabel = SORTS.find((x) => x.value === sort)?.label ?? sort;
    return `Stores (${scopeLabel}) · ${sortLabel}`;
  }, [senderScope, sort]);

  return (
    <GlassCard
      title="Executive Summary"
      right={
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          gap={1}
          alignItems={{ xs: 'stretch', sm: 'center' }}
        >
          <Chip
            size="small"
            icon={<DateRangeRoundedIcon />}
            label={rangeLabel}
            onClick={(e) => setDateAnchor(e.currentTarget)}
            sx={(t) => ({
              fontWeight: 900,
              bgcolor: alpha(t.palette.primary.main, 0.08),
              cursor: 'pointer',
              '&:hover': { bgcolor: alpha(t.palette.primary.main, 0.12) },
            })}
          />

          <Button
            size="small"
            variant="outlined"
            endIcon={!smDown ? <LaunchRoundedIcon /> : undefined}
            onClick={onExploreClick}
            sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900 }}
          >
            Explore
          </Button>
        </Stack>
      }
    >
      <Popover
        open={dateOpen}
        anchorEl={dateAnchor}
        onClose={() => setDateAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{
          sx: (t) => ({
            p: 1,
            borderRadius: 3,
            border: `1px solid ${alpha(t.palette.divider, 0.6)}`,
            bgcolor: alpha(t.palette.background.paper, 0.98),
          }),
        }}
      >
        <DateRange
          ranges={[range]}
          onChange={(item: RangeKeyDict) => {
            const sel = item.selection;
            setRange((prev) => ({
              ...prev,
              startDate: sel.startDate || prev.startDate,
              endDate: sel.endDate || prev.endDate,
            }));
          }}
          months={mdDown ? 1 : 2}
          direction={mdDown ? 'vertical' : 'horizontal'}
          moveRangeOnFirstSelection={false}
          showDateDisplay={false}
          rangeColors={[theme.palette.primary.main]}
        />

        <Stack
          direction="row"
          gap={1}
          justifyContent="flex-end"
          sx={{ px: 1, pb: 0.5 }}
        >
          <Button
            size="small"
            onClick={() => setDateAnchor(null)}
            sx={{ textTransform: 'none', fontWeight: 900 }}
          >
            Done
          </Button>
        </Stack>
      </Popover>

      {anyLoading ? <LinearProgress sx={{ mb: 1.25 }} /> : null}
      {fetchingGrowth && !loadingGrowth ? (
        <Typography
          variant="caption"
          sx={{ color: 'text.secondary', display: 'block', mb: 1 }}
        >
          Updating list…
        </Typography>
      ) : null}

      {anyError ? (
        <Typography
          color="error"
          variant="body2"
          sx={{ mb: 1 }}
        >
          Failed to load summary.
        </Typography>
      ) : null}

      {/* ===================== TOP: ✅ compact (ONLY growth) ===================== */}
      <Stack
        spacing={1}
        sx={(t) => ({
          p: 1.1,
          borderRadius: 3,
          border: `1px solid ${alpha(t.palette.divider, 0.7)}`,
          bgcolor: alpha(t.palette.background.paper, 0.35),
        })}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 1,
          }}
        >
          <SummaryTile
            label="Senders growth"
            value={`${fmt(senders?.growthAbs)} · ${fmtPct(senders?.growthPct)}%`}
            tone="success"
          />
          <SummaryTile
            label="Non-senders growth"
            value={`${fmt(nonSenders?.growthAbs)} · ${fmtPct(nonSenders?.growthPct)}%`}
            tone="warning"
          />
        </Box>

        <Stack
          direction={{ xs: 'column', md: 'row' }}
          gap={1}
          alignItems={{ xs: 'stretch', md: 'center' }}
          justifyContent="space-between"
          sx={(t) => ({
            borderRadius: 3,
            px: 1.1,
            py: 0.9,
            border: `1px solid ${alpha(t.palette.divider, 0.55)}`,
            background: `linear-gradient(180deg, ${alpha(
              t.palette.primary.main,
              0.06
            )}, transparent)`,
          })}
        >
          <Stack
            spacing={0.35}
            sx={{ minWidth: 0 }}
          >
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 980, letterSpacing: -0.2, lineHeight: 1.1 }}
            >
              Takeaway
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: 'text.secondary', lineHeight: 1.25 }}
            >
              {takeaway}
            </Typography>
          </Stack>

          <Stack
            direction="row"
            gap={1}
            flexWrap="wrap"
            justifyContent={{ xs: 'flex-start', md: 'flex-end' }}
          >
            <Chip
              size="small"
              label={`Senders +${fmt(senders?.netGrowth)}`}
              sx={(t) => ({
                fontWeight: 900,
                bgcolor: alpha(t.palette.success.main, 0.12),
                color: t.palette.success.dark,
              })}
            />
            <Chip
              size="small"
              label={`Non-senders +${fmt(nonSenders?.netGrowth)}`}
              sx={(t) => ({
                fontWeight: 900,
                bgcolor: alpha(t.palette.info.main, 0.12),
                color: t.palette.info.dark,
              })}
            />
            <Chip
              size="small"
              label={`Churn ${fmt(totalChurn)}`}
              sx={(t) => ({
                fontWeight: 900,
                bgcolor: alpha(t.palette.warning.main, 0.14),
                color: t.palette.warning.dark,
              })}
            />
          </Stack>
        </Stack>
      </Stack>

      <Divider sx={{ my: 1.5 }} />

      {/* ===================== BOTTOM: filters + list ===================== */}
      <Stack spacing={1.1}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          gap={1}
          alignItems={{ xs: 'stretch', md: 'center' }}
          justifyContent="space-between"
          sx={{ minWidth: 0 }}
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            gap={1}
            sx={{ minWidth: 0, flexWrap: 'wrap' }}
          >
            <FormControl
              size="small"
              sx={{ minWidth: { xs: '100%', sm: 220 } }}
            >
              <InputLabel id="sender-scope-label">Scope</InputLabel>
              <Select
                labelId="sender-scope-label"
                label="Scope"
                value={senderScope}
                onChange={(e) => setSenderScope(e.target.value as AudienceStoresGrowthSenderScope)}
              >
                <MenuItem value="all">All stores</MenuItem>
                <MenuItem value="senders">Senders</MenuItem>
                <MenuItem value="nonSenders">Non-senders</MenuItem>
              </Select>
            </FormControl>

            <FormControl
              size="small"
              sx={{ minWidth: { xs: '100%', sm: 260 } }}
            >
              <InputLabel id="sort-label">Sort</InputLabel>
              <Select
                labelId="sort-label"
                label="Sort"
                value={sort}
                onChange={(e) => setSort(e.target.value as any)}
              >
                {SORTS.map((opt) => (
                  <MenuItem
                    key={opt.value}
                    value={opt.value}
                  >
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl
              size="small"
              sx={{ minWidth: { xs: '100%', sm: 160 } }}
            >
              <InputLabel id="limit-label">Show</InputLabel>
              <Select
                labelId="limit-label"
                label="Show"
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value) as any)}
              >
                {PAGE_SIZES.map((n) => (
                  <MenuItem
                    key={n}
                    value={n}
                  >
                    {n} rows
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              size="small"
              variant="outlined"
              startIcon={<DownloadRoundedIcon />}
              onClick={exportToExcel}
              disabled={loadingGrowth || rows.length === 0}
              sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900 }}
            >
              Export
            </Button>
          </Stack>

          <Stack
            direction="row"
            gap={1}
            alignItems="center"
            justifyContent={{ xs: 'flex-start', md: 'flex-end' }}
          >
            <Chip
              size="small"
              icon={<TrendingUpRoundedIcon />}
              label={listTitle}
              sx={(t) => ({
                fontWeight: 900,
                bgcolor: alpha(t.palette.primary.main, 0.08),
                '& .MuiChip-label': { maxWidth: 380, overflow: 'hidden', textOverflow: 'ellipsis' },
              })}
            />
            <Chip
              size="small"
              label={`${rows.length} shown`}
              sx={{ fontWeight: 900 }}
            />
          </Stack>
        </Stack>

        <Stack
          sx={(t) => ({
            border: `1px solid ${alpha(t.palette.divider, 0.7)}`,
            borderRadius: 3,
            overflow: 'hidden',
            bgcolor: alpha(t.palette.background.paper, 0.5),
          })}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={(t) => ({
              px: 1.25,
              py: 1.0,
              bgcolor: alpha(t.palette.background.paper, 0.6),
            })}
          >
            <Stack
              direction="row"
              gap={1}
              alignItems="center"
              sx={{ minWidth: 0 }}
            >
              <TrendingUpRoundedIcon fontSize="small" />
              <Typography
                sx={{
                  fontWeight: 950,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={listTitle}
              >
                {listTitle}
              </Typography>
            </Stack>

            <Chip
              size="small"
              label={loadingGrowth ? 'Loading…' : `${rows.length} shown`}
              sx={{ fontWeight: 900 }}
            />
          </Stack>

          <Divider />

          <Box sx={{ maxHeight: { xs: 440, md: 520 }, overflow: 'auto' }}>
            {loadingGrowth ? (
              <Stack sx={{ p: 2 }}>
                <Typography
                  variant="body2"
                  sx={{ color: 'text.secondary' }}
                >
                  Loading stores…
                </Typography>
              </Stack>
            ) : null}

            {!loadingGrowth && rows.length === 0 ? (
              <Stack sx={{ p: 2 }}>
                <Typography
                  variant="body2"
                  sx={{ color: 'text.secondary' }}
                >
                  No stores found for these filters.
                </Typography>
              </Stack>
            ) : null}

            {rows.map((r, idx) => (
              <StoreRowItem
                key={`${r.storeId}-${idx}`}
                row={r}
                idx={idx}
              />
            ))}
          </Box>
        </Stack>
      </Stack>
    </GlassCard>
  );
}
