// src/components/audience/AudienceSummaryExecutive.tsx
'use client';

import LaunchRoundedIcon from '@mui/icons-material/LaunchRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import {
  alpha,
  Box,
  Button,
  Chip,
  Divider,
  LinearProgress,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import  { useMemo, useState } from 'react';
import { GlassCard } from './ui';

/* ===================== Types (mínimos, no te amarro) ===================== */
type StoreRow = {
  storeId: string;
  name: string;
  slug?: string;
  active?: boolean;
  isSender?: boolean;
  audiencePrev?: number;
  audienceCurr?: number;
  growthAbs?: number;
  growthPct?: number;
  newInPeriod?: number;
  churnInPeriod?: number;
  netGrowth?: number;
};

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
  rankingNonSenders?: StoreRow[];
  topNonSendersByAudience?: StoreRow[];
  chart?: any;
};

type Props = {
  data?: AudienceSummaryResponse;
  loading?: boolean;
  error?: boolean;
};

function fmt(n: any) {
  const num = Number(n ?? 0);
  if (!Number.isFinite(num)) return '0';
  return new Intl.NumberFormat('en-US').format(num);
}
function fmtPct(n: any) {
  const num = Number(n ?? 0);
  if (!Number.isFinite(num)) return '0%';
  return `${num.toFixed(2)}%`;
}
function shortDate(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
}

function Pill(props: {
  label: string;
  value: string;
  tone?: 'primary' | 'info' | 'success' | 'warning';
}) {
  const { label, value, tone = 'primary' } = props;
  return (
    <Stack
      sx={(t) => ({
        px: 1.25,
        py: 0.9,
        borderRadius: 999,
        border: `1px solid ${alpha(t.palette[tone].main, 0.22)}`,
        bgcolor: alpha(t.palette[tone].main, 0.08),
        minWidth: 150,
      })}
      spacing={0.25}
    >
      <Typography
        variant="caption"
        sx={{ color: 'text.secondary', fontWeight: 800, letterSpacing: 0.2 }}
      >
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{ fontWeight: 950, letterSpacing: -0.2 }}
      >
        {value}
      </Typography>
    </Stack>
  );
}

function RowCard({ title, items }: { title: string; items: StoreRow[] }) {
  return (
    <Stack
      sx={(t) => ({
        border: `1px solid ${alpha(t.palette.divider, 0.7)}`,
        borderRadius: 3,
        overflow: 'hidden',
      })}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={(t) => ({
          px: 1.5,
          py: 1.1,
          bgcolor: alpha(t.palette.background.paper, 0.6),
        })}
      >
        <Stack
          direction="row"
          gap={1}
          alignItems="center"
        >
          <TrendingUpRoundedIcon fontSize="small" />
          <Typography sx={{ fontWeight: 950 }}>{title}</Typography>
        </Stack>

        <Chip
          size="small"
          label={`${items.length} shown`}
          sx={{ fontWeight: 900 }}
        />
      </Stack>

      <Divider />

      <Stack sx={{ maxHeight: 380, overflow: 'auto' }}>
        {items.map((s, idx) => {
          const aud = Number(s.audienceCurr || 0);
          const pct = Number(s.growthPct || 0);
          const net = Number(s.netGrowth || 0);

          return (
            <Stack
              key={`${s.storeId}-${idx}`}
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              gap={2}
              sx={(t) => ({
                px: 1.5,
                py: 1.1,
                borderBottom: `1px solid ${alpha(t.palette.divider, 0.6)}`,
                '&:hover': { bgcolor: alpha(t.palette.primary.main, 0.04) },
              })}
            >
              <Stack
                spacing={0.2}
                sx={{ minWidth: 0 }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 950,
                    lineHeight: 1.2,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={s.name}
                >
                  {idx + 1}. {s.name}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={s.slug}
                >
                  {s.slug || s.storeId}
                </Typography>
              </Stack>

              <Stack
                direction="row"
                gap={1}
                alignItems="center"
                sx={{ flexShrink: 0 }}
              >
                <Chip
                  size="small"
                  label={`Audience ${fmt(aud)}`}
                  sx={(t) => ({
                    fontWeight: 900,
                    bgcolor: alpha(t.palette.info.main, 0.12),
                    color: t.palette.info.dark,
                  })}
                />
                <Chip
                  size="small"
                  label={`+${fmt(net)} net`}
                  sx={(t) => ({
                    fontWeight: 900,
                    bgcolor: alpha(t.palette.success.main, 0.12),
                    color: t.palette.success.dark,
                  })}
                />
                <Chip
                  size="small"
                  label={fmtPct(pct)}
                  sx={(t) => ({
                    fontWeight: 950,
                    bgcolor: alpha(t.palette.primary.main, 0.12),
                    color: t.palette.primary.dark,
                  })}
                />
              </Stack>
            </Stack>
          );
        })}
      </Stack>
    </Stack>
  );
}

export function AudienceSummaryExecutive({ data, loading, error }: Props) {
  const theme = useTheme();
  const mdDown = useMediaQuery(theme.breakpoints.down('md'));

  const [view, setView] = useState<'audience' | 'growth'>('audience');

  const periodLabel = useMemo(() => {
    const p1 = shortDate(data?.period?.start);
    const p2 = shortDate(data?.period?.end);
    const q1 = shortDate(data?.previousPeriod?.start);
    const q2 = shortDate(data?.previousPeriod?.end);
    if (!p1 || !p2) return '';
    if (!q1 || !q2) return `${p1} → ${p2}`;
    return `${p1} → ${p2} (prev ${q1} → ${q2})`;
  }, [
    data?.period?.start,
    data?.period?.end,
    data?.previousPeriod?.start,
    data?.previousPeriod?.end,
  ]);

  const senders = data?.senders;
  const nonSenders = data?.nonSenders;

  const listAudience = data?.topNonSendersByAudience || [];
  const listGrowth = data?.rankingNonSenders || [];

  const list = view === 'audience' ? listAudience : listGrowth;

  return (
    <GlassCard
      title="Executive Summary"
      right={
        <Stack
          direction="row"
          gap={1}
          alignItems="center"
        >
          <Chip
            size="small"
            label={periodLabel || '—'}
            sx={(t) => ({
              fontWeight: 900,
              bgcolor: alpha(t.palette.primary.main, 0.08),
            })}
          />
          <Button
            size="small"
            variant="outlined"
            endIcon={<LaunchRoundedIcon />}
            onClick={() => {
              // placeholder: si querés después lo conectamos a /stores o /campaigns
            }}
            sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900 }}
          >
            Explore
          </Button>
        </Stack>
      }
    >
      {loading ? <LinearProgress sx={{ mb: 1.5 }} /> : null}

      {error ? (
        <Typography
          color="error"
          variant="body2"
        >
          Failed to load summary.
        </Typography>
      ) : null}

      <Stack spacing={2}>
        {/* Top pills */}
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1.25}
          alignItems={{ xs: 'stretch', md: 'center' }}
          justifyContent="space-between"
        >
          <Stack
            direction="row"
            spacing={1}
            flexWrap="wrap"
          >
            <Pill
              label="Senders audience"
              value={fmt(senders?.audienceCurr)}
              tone="primary"
            />
            <Pill
              label="Senders growth"
              value={`${fmt(senders?.growthAbs)} (${fmtPct(senders?.growthPct)})`}
              tone="success"
            />
            <Pill
              label="Non-senders audience"
              value={fmt(nonSenders?.audienceCurr)}
              tone="info"
            />
            <Pill
              label="Non-senders growth"
              value={`${fmt(nonSenders?.growthAbs)} (${fmtPct(nonSenders?.growthPct)})`}
              tone="warning"
            />
          </Stack>

          <Stack
            direction="row"
            spacing={1}
            justifyContent={{ xs: 'flex-start', md: 'flex-end' }}
          >
            <Chip
              clickable
              onClick={() => setView('audience')}
              label="Top by audience"
              sx={(t) => ({
                fontWeight: 950,
                borderRadius: 999,
                bgcolor:
                  view === 'audience'
                    ? alpha(t.palette.info.main, 0.14)
                    : alpha(t.palette.action.hover, 0.25),
                color: view === 'audience' ? t.palette.info.dark : t.palette.text.secondary,
              })}
            />
            <Chip
              clickable
              onClick={() => setView('growth')}
              label="Top by growth"
              sx={(t) => ({
                fontWeight: 950,
                borderRadius: 999,
                bgcolor:
                  view === 'growth'
                    ? alpha(t.palette.success.main, 0.14)
                    : alpha(t.palette.action.hover, 0.25),
                color: view === 'growth' ? t.palette.success.dark : t.palette.text.secondary,
              })}
            />
          </Stack>
        </Stack>

        {/* Split + list */}
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
        >
          {/* Left: quick narrative */}
          <Stack
            sx={(t) => ({
              flex: 1,
              borderRadius: 3,
              border: `1px solid ${alpha(t.palette.divider, 0.7)}`,
              p: 1.75,
              background: `linear-gradient(180deg, ${alpha(
                t.palette.primary.main,
                0.06
              )}, transparent)`,
            })}
            spacing={1}
          >
            <Typography
              variant={mdDown ? 'h6' : 'h5'}
              sx={{ fontWeight: 980, letterSpacing: -0.3 }}
            >
              What this means
            </Typography>

            <Typography
              variant="body2"
              sx={{ color: 'text.secondary' }}
            >
              Non-senders are growing <b>{fmtPct(nonSenders?.growthPct)}</b> vs senders{' '}
              <b>{fmtPct(senders?.growthPct)}</b>. That suggests <b>organic growth</b> is strong in
              a few large stores — great targets to push campaigns.
            </Typography>

            <Divider />

            <Stack
              direction="row"
              gap={1}
              flexWrap="wrap"
            >
              <Chip
                size="small"
                label={`Senders: +${fmt(senders?.netGrowth)} net`}
                sx={(t) => ({
                  fontWeight: 900,
                  bgcolor: alpha(t.palette.success.main, 0.12),
                  color: t.palette.success.dark,
                })}
              />
              <Chip
                size="small"
                label={`Non-senders: +${fmt(nonSenders?.netGrowth)} net`}
                sx={(t) => ({
                  fontWeight: 900,
                  bgcolor: alpha(t.palette.info.main, 0.12),
                  color: t.palette.info.dark,
                })}
              />
              <Chip
                size="small"
                label={`Churn (both): ${fmt(
                  (senders?.churnInPeriod || 0) + (nonSenders?.churnInPeriod || 0)
                )}`}
                sx={(t) => ({
                  fontWeight: 900,
                  bgcolor: alpha(t.palette.warning.main, 0.14),
                  color: t.palette.warning.dark,
                })}
              />
            </Stack>

            <Typography
              variant="caption"
              sx={{ color: 'text.secondary' }}
            >
              Tip: use “Top by audience” to focus on the biggest wins, and “Top by growth” to catch
              breakouts.
            </Typography>
          </Stack>

          {/* Right: Top list */}
          <Box sx={{ flex: 1.2 }}>
            <RowCard
              title={
                view === 'audience' ? 'Top non-senders by audience' : 'Top non-senders by growth'
              }
              items={list}
            />
          </Box>
        </Stack>
      </Stack>
    </GlassCard>
  );
}
