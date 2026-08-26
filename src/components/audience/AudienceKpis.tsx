'use client';

/**
 * Fila de KPIs de audiencia.
 *
 * Antes eran dos tarjetas en inglés con un degradado radial de fondo y pesos
 * 950. Ahora son cuatro cifras que se leen juntas y responden a la pregunta de
 * la página: cuánta audiencia hay, cuánta se está usando, cuánta está parada y
 * si el neto del período fue para arriba o para abajo.
 */
import CampaignRoundedIcon from '@mui/icons-material/CampaignRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import SwapVertRoundedIcon from '@mui/icons-material/SwapVertRounded';
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded';
import TrendingFlatRoundedIcon from '@mui/icons-material/TrendingFlatRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import { Box, Card, CardContent, Skeleton, Stack, Typography } from '@mui/material';
import React from 'react';
import { tint, toneText, type SemanticRole } from 'src/theme/semantic';
import { num, pct } from './audience-utils';
import { IconTile, numeric } from './ui';

/** Chip de variación. Lleva icono además del color: el signo no se lee sólo en verde/rojo. */
export function GrowthChip({ value }: { value: number }) {
  const v = Number.isFinite(value) ? value : 0;
  const tone: SemanticRole = v > 0 ? 'success' : v < 0 ? 'error' : 'secondary';
  const Icon =
    v > 0 ? TrendingUpRoundedIcon : v < 0 ? TrendingDownRoundedIcon : TrendingFlatRoundedIcon;

  return (
    <Stack
      direction="row"
      alignItems="center"
      gap={0.25}
      sx={(t) => ({
        px: 0.75,
        py: 0.25,
        borderRadius: 1,
        bgcolor: tint(t, tone),
        color: toneText(t, tone),
      })}
    >
      <Icon sx={{ fontSize: 15 }} />
      <Typography
        variant="caption"
        fontWeight={700}
        sx={numeric}
      >
        {v > 0 ? '+' : ''}
        {pct(v)}
      </Typography>
    </Stack>
  );
}

export function StatCard(props: {
  title: string;
  value: string;
  subtitle?: string;
  icon?: React.ReactNode;
  accent?: SemanticRole;
  right?: React.ReactNode;
  loading?: boolean;
}) {
  const { title, value, subtitle, icon, accent = 'primary', right, loading } = props;

  return (
    <Card
      variant="outlined"
      sx={{ height: '100%', boxShadow: 'none' }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          gap={1}
          sx={{ mb: 1.5 }}
        >
          <Stack
            direction="row"
            alignItems="center"
            gap={1}
            minWidth={0}
          >
            {icon ? <IconTile tone={accent}>{icon}</IconTile> : null}
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={600}
              sx={{ minWidth: 0 }}
            >
              {title}
            </Typography>
          </Stack>
          {right}
        </Stack>

        {loading ? (
          <Skeleton
            variant="text"
            width="60%"
            height={36}
          />
        ) : (
          <Typography
            variant="h4"
            sx={{ fontWeight: 700, lineHeight: 1.1, ...numeric }}
            noWrap
          >
            {value}
          </Typography>
        )}

        {subtitle ? (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mt: 0.5 }}
          >
            {subtitle}
          </Typography>
        ) : null}
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

const EMPTY: AudienceSummaryGroup = {
  storesCount: 0,
  audiencePrev: 0,
  audienceCurr: 0,
  growthAbs: 0,
  growthPct: 0,
  newInPeriod: 0,
  churnInPeriod: 0,
  netGrowth: 0,
};

export function AudienceKpis(props: {
  senders?: AudienceSummaryGroup;
  nonSenders?: AudienceSummaryGroup;
  loading?: boolean;
}) {
  const { loading } = props;
  const senders = props.senders ?? EMPTY;
  const nonSenders = props.nonSenders ?? EMPTY;

  const totalCurr = senders.audienceCurr + nonSenders.audienceCurr;
  const totalPrev = senders.audiencePrev + nonSenders.audiencePrev;
  const totalPct = totalPrev ? ((totalCurr - totalPrev) / totalPrev) * 100 : 0;
  const activePct = totalCurr ? (senders.audienceCurr / totalCurr) * 100 : 0;

  const newTotal = senders.newInPeriod + nonSenders.newInPeriod;
  const churnTotal = senders.churnInPeriod + nonSenders.churnInPeriod;
  const netTotal = newTotal - churnTotal;

  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' },
      }}
    >
      <StatCard
        title="Audiencia total"
        value={num(totalCurr)}
        subtitle={`Período anterior ${num(totalPrev)}`}
        icon={<GroupsRoundedIcon fontSize="small" />}
        accent="primary"
        right={<GrowthChip value={totalPct} />}
        loading={loading}
      />

      <StatCard
        title="Con campañas"
        value={num(senders.audienceCurr)}
        subtitle={`${num(senders.storesCount)} negocios · ${pct(activePct)} del total`}
        icon={<CampaignRoundedIcon fontSize="small" />}
        accent="success"
        right={<GrowthChip value={senders.growthPct} />}
        loading={loading}
      />

      <StatCard
        title="Sin campañas"
        value={num(nonSenders.audienceCurr)}
        subtitle={`${num(nonSenders.storesCount)} negocios sin enviar en el período`}
        icon={<StorefrontRoundedIcon fontSize="small" />}
        accent="warning"
        right={<GrowthChip value={nonSenders.growthPct} />}
        loading={loading}
      />

      <StatCard
        title="Altas y bajas"
        value={`${netTotal >= 0 ? '+' : ''}${num(netTotal)}`}
        subtitle={`${num(newTotal)} altas · ${num(churnTotal)} bajas`}
        icon={<SwapVertRoundedIcon fontSize="small" />}
        accent={netTotal >= 0 ? 'info' : 'error'}
        loading={loading}
      />
    </Box>
  );
}
