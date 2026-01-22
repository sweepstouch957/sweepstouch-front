'use client';

import CampaignRoundedIcon from '@mui/icons-material/CampaignRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import { alpha, Box, Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import React from 'react';

export function pct(n: number) {
  if (!Number.isFinite(n)) return '0%';
  const v = Math.round(n * 10) / 10;
  return `${v}%`;
}

export function num(n: number) {
  return new Intl.NumberFormat('en-US').format(Math.round(n || 0));
}

export function GrowthChip({ value }: { value: number }) {
  const up = value >= 0;
  return (
    <Chip
      size="small"
      icon={up ? <TrendingUpRoundedIcon /> : <TrendingDownRoundedIcon />}
      label={pct(value)}
      sx={(t) => ({
        fontWeight: 900,
        borderRadius: 999,
        bgcolor: up ? alpha(t.palette.success.main, 0.12) : alpha(t.palette.error.main, 0.12),
        color: up ? t.palette.success.dark : t.palette.error.dark,
      })}
    />
  );
}

export function StatCard(props: {
  title: string;
  value: string;
  subtitle?: string;
  icon?: React.ReactNode;
  accent?: 'info' | 'success' | 'warning' | 'error' | 'primary';
  right?: React.ReactNode;
}) {
  const { title, value, subtitle, icon, accent = 'primary', right } = props;

  return (
    <Card
      variant="outlined"
      sx={(t) => ({
        borderRadius: 3,
        overflow: 'hidden',
        position: 'relative',
        borderColor: alpha(t.palette.divider, 0.9),
        bgcolor: alpha(t.palette.background.paper, 0.92),
        boxShadow: `0 12px 28px ${alpha(t.palette.common.black, 0.06)}`,
      })}
    >
      <Box
        sx={(t) => ({
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(1200px circle at 10% 0%, ${alpha(
            t.palette[accent].main,
            0.16
          )}, transparent 55%)`,
          pointerEvents: 'none',
        })}
      />
      <CardContent sx={{ p: 2.25, position: 'relative' }}>
        <Stack
          direction="row"
          alignItems="flex-start"
          justifyContent="space-between"
          spacing={1.5}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={1.25}
            sx={{ minWidth: 0 }}
          >
            <Box
              sx={(t) => ({
                width: 42,
                height: 42,
                borderRadius: 2.5,
                display: 'grid',
                placeItems: 'center',
                bgcolor: alpha(t.palette[accent].main, 0.14),
                color: t.palette[accent].dark,
                flex: '0 0 auto',
              })}
            >
              {icon}
            </Box>

            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="caption"
                sx={{ color: 'text.secondary', fontWeight: 800 }}
              >
                {title}
              </Typography>

              <Typography
                variant="h5"
                sx={{ fontWeight: 950, lineHeight: 1.1 }}
                noWrap
              >
                {value}
              </Typography>

              {subtitle ? (
                <Typography
                  variant="caption"
                  sx={{ color: 'text.secondary' }}
                  noWrap
                >
                  {subtitle}
                </Typography>
              ) : null}
            </Box>
          </Stack>

          {right}
        </Stack>
      </CardContent>
    </Card>
  );
}

/** ✅ MATCH EXACT summary.data.senders / summary.data.nonSenders */
export type AudienceSummaryGroup = {
  storesCount: number;
  audiencePrev: number;
  audienceCurr: number;
  growthAbs: number;
  growthPct: number;
  newInPeriod: number;
  churnInPeriod: number;
  netGrowth: number;
};

export function AudienceKpis(props: {
  senders?: AudienceSummaryGroup;
  nonSenders?: AudienceSummaryGroup;
}) {
  const { senders, nonSenders } = props;

  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      spacing={2.25}
    >
      <Box sx={{ flex: 1 }}>
        <StatCard
          title="Stores that SEND campaigns"
          value={num(senders?.audienceCurr ?? 0)}
          subtitle={`${num(senders?.storesCount ?? 0)} stores • prev ${num(
            senders?.audiencePrev ?? 0
          )} • net +${num(senders?.netGrowth ?? 0)}`}
          icon={<CampaignRoundedIcon />}
          accent="primary"
          right={<GrowthChip value={senders?.growthPct ?? 0} />}
        />
      </Box>

      <Box sx={{ flex: 1 }}>
        <StatCard
          title="Stores that DON’T send campaigns"
          value={num(nonSenders?.audienceCurr ?? 0)}
          subtitle={`${num(nonSenders?.storesCount ?? 0)} stores • prev ${num(
            nonSenders?.audiencePrev ?? 0
          )} • net +${num(nonSenders?.netGrowth ?? 0)}`}
          icon={<StorefrontRoundedIcon />}
          accent="warning"
          right={<GrowthChip value={nonSenders?.growthPct ?? 0} />}
        />
      </Box>
    </Stack>
  );
}
