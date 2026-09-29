'use client';

import type { Campaing } from '@/models/campaing';
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded';
import SyncRoundedIcon from '@mui/icons-material/SyncRounded';
import { Box, Button, CircularProgress, Stack, Typography, useTheme } from '@mui/material';
import { formatInTimeZone } from 'date-fns-tz';
import { es } from 'date-fns/locale';
import { formatPhone, isMixedCampaign, num, STATUS_META, typeLabel } from './constants';
import { MetaChip, Pill, soft, StatsCard } from './ui';

export function SummaryCard({
  campaign,
  errors,
  syncing,
  onSync,
  onResend,
  onOpenFlyer,
}: {
  campaign: Campaing;
  errors: number;
  syncing: boolean;
  onSync: () => void;
  onResend: () => void;
  onOpenFlyer: () => void;
}) {
  const theme = useTheme();
  const status = STATUS_META[campaign.status] ?? { label: campaign.status, tone: 'neutral' as const };
  const start = campaign.startDate
    ? formatInTimeZone(campaign.startDate, 'America/New_York', "d MMM yyyy, hh:mm a 'NY'", { locale: es })
    : null;

  return (
    <StatsCard sx={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 2.5 }}>
      <Box
        onClick={campaign.image ? onOpenFlyer : undefined}
        sx={{
          width: 64,
          height: 64,
          borderRadius: 3.5,
          overflow: 'hidden',
          flex: 'none',
          bgcolor: soft(theme),
          border: 1,
          borderColor: 'divider',
          cursor: campaign.image ? 'zoom-in' : 'default',
        }}
      >
        {campaign.image && (
          <Box
            component="img"
            src={campaign.image}
            alt="Flyer"
            sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        )}
      </Box>

      <Stack
        gap={1.25}
        sx={{ flex: 1, minWidth: { xs: '100%', sm: 260 } }}
      >
        <Stack
          direction="row"
          alignItems="center"
          gap={1.5}
          flexWrap="wrap"
        >
          <Typography
            component="h1"
            sx={{ m: 0, fontSize: { xs: 20, sm: 24 }, fontWeight: 800, letterSpacing: '-.02em', lineHeight: 1.2 }}
          >
            {campaign.title}
          </Typography>
          <Pill
            label={status.label}
            tone={status.tone}
          />
        </Stack>
        <Stack
          direction="row"
          gap={0.75}
          flexWrap="wrap"
        >
          <MetaChip strong>{typeLabel(campaign)}</MetaChip>
          {isMixedCampaign(campaign) && <MetaChip>SMS + 10% RCS con nombre</MetaChip>}
          {campaign.platform && <MetaChip>Proveedor: {campaign.platform[0].toUpperCase() + campaign.platform.slice(1)}</MetaChip>}
          {campaign.sourceTn && <MetaChip>Número: {formatPhone(campaign.sourceTn)}</MetaChip>}
          {start && <MetaChip>Inicio: {start}</MetaChip>}
        </Stack>
      </Stack>

      <Stack
        direction="row"
        gap={1.25}
        flexWrap="wrap"
        sx={{ width: { xs: '100%', md: 'auto' } }}
      >
        <Button
          variant="outlined"
          color="inherit"
          onClick={onSync}
          disabled={syncing}
          startIcon={syncing ? <CircularProgress size={16}
color="inherit" /> : <SyncRoundedIcon />}
          sx={{ borderRadius: 2.5, fontWeight: 600, borderColor: 'divider', flex: { xs: 1, md: 'none' } }}
        >
          Actualizar métricas
        </Button>
        {errors > 0 && (
          <Button
            variant="contained"
            color="warning"
            disableElevation
            onClick={onResend}
            startIcon={<ReplayRoundedIcon />}
            sx={{ borderRadius: 2.5, fontWeight: 700, flex: { xs: 1, md: 'none' } }}
          >
            Reenviar {num(errors)} fallidos
          </Button>
        )}
      </Stack>
    </StatsCard>
  );
}
