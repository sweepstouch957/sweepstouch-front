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
import React, { useMemo, useState } from 'react';
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
  onExploreClick?: () => void;
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
        px: 1.15,
        py: 0.9,
        borderRadius: 999,
        border: `1px solid ${alpha(t.palette[tone].main, 0.22)}`,
        bgcolor: alpha(t.palette[tone].main, 0.08),
        minWidth: { xs: '100%', sm: 200 },
        flex: { xs: '1 1 100%', sm: '0 0 auto' },
      })}
      spacing={0.25}
    >
      <Typography
        variant="caption"
        sx={{ color: 'text.secondary', fontWeight: 850, letterSpacing: 0.15 }}
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

function RowCard({
  title,
  items,
  emptyLabel = 'No data',
}: {
  title: string;
  items: StoreRow[];
  emptyLabel?: string;
}) {
  return (
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
          px: 1.5,
          py: 1.1,
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
            title={title}
          >
            {title}
          </Typography>
        </Stack>

        <Chip
          size="small"
          label={`${items.length} shown`}
          sx={{ fontWeight: 900, flexShrink: 0 }}
        />
      </Stack>

      <Divider />

      <Stack
        sx={{
          maxHeight: { xs: 320, md: 380 },
          overflow: 'auto',
        }}
      >
        {items.length === 0 ? (
          <Stack sx={{ p: 2 }}>
            <Typography
              variant="body2"
              sx={{ color: 'text.secondary' }}
            >
              {emptyLabel}
            </Typography>
          </Stack>
        ) : null}

        {items.map((s, idx) => {
          const aud = Number(s.audienceCurr || 0);
          const pct = Number(s.growthPct || 0);
          const net = Number(s.netGrowth || 0);

          return (
            <Stack
              key={`${s.storeId}-${idx}`}
              direction={{ xs: 'column', sm: 'row' }}
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              justifyContent="space-between"
              gap={{ xs: 0.9, sm: 2 }}
              sx={(t) => ({
                px: 1.5,
                py: 1.1,
                borderBottom: `1px solid ${alpha(t.palette.divider, 0.6)}`,
                '&:hover': { bgcolor: alpha(t.palette.primary.main, 0.04) },
              })}
            >
              <Stack
                spacing={0.2}
                sx={{ minWidth: 0, width: '100%' }}
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
                  title={s.slug || s.storeId}
                >
                  {s.slug || s.storeId}
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
                  label={`+${fmt(net)}`}
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

export function AudienceSummaryExecutive({ data, loading, error, onExploreClick }: Props) {
  const theme = useTheme();
  const mdDown = useMediaQuery(theme.breakpoints.down('md'));
  const smDown = useMediaQuery(theme.breakpoints.down('sm'));

  const [view, setView] = useState<'audience' | 'growth'>('audience');

  const periodLabel = useMemo(() => {
    const p1 = shortDate(data?.period?.start);
    const p2 = shortDate(data?.period?.end);
    const q1 = shortDate(data?.previousPeriod?.start);
    const q2 = shortDate(data?.previousPeriod?.end);
    if (!p1 || !p2) return '—';
    if (!q1 || !q2) return `${p1} → ${p2}`;
    return `${p1} → ${p2} · prev ${q1} → ${q2}`;
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

  const totalChurn = (senders?.churnInPeriod || 0) + (nonSenders?.churnInPeriod || 0);

  // Copy ultra-corto, sin abrumar
  const growthLine = useMemo(() => {
    const ns = fmtPct(nonSenders?.growthPct);
    const s = fmtPct(senders?.growthPct);
    return `Non-senders ${ns} vs senders ${s}.`;
  }, [nonSenders?.growthPct, senders?.growthPct]);

  const actionLine = useMemo(() => {
    return 'Focus: largest non-senders already trending up.';
  }, []);

  return (
    <GlassCard
      title="Executive Summary"
      right={
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          gap={1}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          <Chip
            size="small"
            label={periodLabel}
            sx={(t) => ({
              fontWeight: 900,
              bgcolor: alpha(t.palette.primary.main, 0.08),
              alignSelf: { xs: 'flex-start', sm: 'center' },
              maxWidth: { xs: '100%', sm: 520 },
              '& .MuiChip-label': {
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: 'block',
              },
            })}
          />

          <Button
            size="small"
            variant="outlined"
            endIcon={!smDown ? <LaunchRoundedIcon /> : undefined}
            onClick={onExploreClick}
            sx={{
              borderRadius: 999,
              textTransform: 'none',
              fontWeight: 900,
              minWidth: { xs: '100%', sm: 'auto' },
            }}
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
        {/* Pills */}
        <Stack
          direction={{ xs: 'column', lg: 'row' }}
          spacing={1.25}
          alignItems={{ xs: 'stretch', lg: 'center' }}
          justifyContent="space-between"
          sx={{ gap: 1.25 }}
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            flexWrap="wrap"
            sx={{
              width: '100%',
              '& > *': { flexGrow: { xs: 1, sm: 0 } },
            }}
          >
            <Pill
              label="Senders audience"
              value={fmt(senders?.audienceCurr)}
              tone="primary"
            />
            <Pill
              label="Senders growth"
              value={`${fmt(senders?.growthAbs)} · ${fmtPct(senders?.growthPct)}`}
              tone="success"
            />
            <Pill
              label="Non-senders audience"
              value={fmt(nonSenders?.audienceCurr)}
              tone="info"
            />
            <Pill
              label="Non-senders growth"
              value={`${fmt(nonSenders?.growthAbs)} · ${fmtPct(nonSenders?.growthPct)}`}
              tone="warning"
            />
          </Stack>

          {/* Toggle chips */}
          <Stack
            direction="row"
            spacing={1}
            justifyContent={{ xs: 'flex-start', lg: 'flex-end' }}
            sx={{ flexWrap: 'wrap' }}
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
          alignItems="stretch"
        >
          {/* Left: narrative (super corto) */}
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
              Key takeaways
            </Typography>

            <Typography
              variant="body2"
              sx={{ color: 'text.secondary' }}
            >
              {growthLine}
            </Typography>

            <Typography
              variant="body2"
              sx={{ color: 'text.secondary' }}
            >
              {actionLine}
            </Typography>

            <Divider />

            <Stack
              direction="row"
              gap={1}
              flexWrap="wrap"
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

            <Typography
              variant="caption"
              sx={{ color: 'text.secondary' }}
            >
              Audience = biggest • Growth = fastest
            </Typography>
          </Stack>

          {/* Right: list */}
          <Box sx={{ flex: 1.2, minWidth: 0 }}>
            <RowCard
              title={
                view === 'audience' ? 'Top non-senders (audience)' : 'Top non-senders (growth)'
              }
              items={list}
              emptyLabel={loading ? 'Loading…' : 'No stores to show for this view.'}
            />
          </Box>
        </Stack>
      </Stack>
    </GlassCard>
  );
}
