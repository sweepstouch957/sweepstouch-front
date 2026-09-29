'use client';

import { panelDivider } from '@/components/application-ui/content-shells/store-managment/panel-kit';
import { tint, toneText } from '@/theme/semantic';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import { Box, Stack, Typography, useTheme } from '@mui/material';
import { channelName, money, num } from './constants';
import { Bar, soft, StatsCard } from './ui';

export type CampaignCost = {
  totalCost: number;
  messages: number;
  estimatedPrices: number;
  rcsPricePerMessage: number | null;
  rates: { sms: number; mms: number; rcs: number };
  channels: Array<{ channel: string; messages: number; cost: number; avgPerMessage: number }>;
};

const COLS = 'minmax(0,1.4fr) minmax(0,1fr) minmax(0,1fr) minmax(0,.9fr)';

export function BillingCard({ charged, cost }: { charged: number; cost: CampaignCost }) {
  const theme = useTheme();
  const diff = charged - cost.totalCost;
  const maxMsgs = Math.max(1, ...cost.channels.map((c) => c.messages));
  const line = panelDivider(theme);
  const perMsg = (c: number, m: number) => (m > 0 ? `$${(c / m).toFixed(c / m < 0.1 ? 4 : 3)}` : '—');

  const cell = (label: string, value: string, role?: 'error' | 'success') => (
    <Stack
      gap={0.5}
      sx={{ bgcolor: role ? tint(theme, role) : 'background.paper', p: 1.75 }}
    >
      <Typography sx={{ fontSize: 12, color: role ? toneText(theme, role) : 'text.secondary' }}>{label}</Typography>
      <Typography
        sx={{
          fontSize: 20,
          fontWeight: 800,
          color: role ? `${role}.main` : 'text.primary',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </Typography>
    </Stack>
  );

  return (
    <StatsCard
      title="Facturación"
      subtitle="Lo que se cobró a la tienda frente a lo que cobró Infobip"
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: '1px',
          bgcolor: line,
          border: `1px solid ${line}`,
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        {cell('Cobrado', money(charged))}
        {cell('Costo Infobip', money(cost.totalCost))}
        {cell('Diferencia', `${diff < 0 ? '−' : '+'}${money(Math.abs(diff))}`, diff < 0 ? 'error' : 'success')}
      </Box>

      <Box sx={{ overflowX: 'auto' }}>
        <Box sx={{ minWidth: 360 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: COLS,
              gap: 1,
              fontSize: 12,
              fontWeight: 600,
              color: 'text.secondary',
              pb: 1,
              borderBottom: `1px solid ${line}`,
            }}
          >
            <span>Canal</span>
            <Box sx={{ textAlign: 'right' }}>Mensajes</Box>
            <Box sx={{ textAlign: 'right' }}>Costo</Box>
            <Box sx={{ textAlign: 'right' }}>Por msj</Box>
          </Box>
          {cost.channels.map((c) => (
            <Box
              key={c.channel}
              sx={{
                display: 'grid',
                gridTemplateColumns: COLS,
                gap: 1,
                py: 1.5,
                borderBottom: `1px solid ${line}`,
                alignItems: 'center',
                fontSize: 14,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              <Stack gap={0.75}>
                <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{channelName(c.channel)}</Typography>
                <Bar
                  value={(c.messages / maxMsgs) * 100}
                  color={theme.palette.primary.main}
                  height={4}
                />
              </Stack>
              <Box sx={{ textAlign: 'right' }}>{num(c.messages)}</Box>
              <Box sx={{ textAlign: 'right', fontWeight: 600 }}>{money(c.cost)}</Box>
              <Box sx={{ textAlign: 'right', color: 'text.secondary' }}>{perMsg(c.cost, c.messages)}</Box>
            </Box>
          ))}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: COLS,
              gap: 1,
              py: 1.5,
              fontWeight: 700,
              fontSize: 14,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <span>Total</span>
            <Box sx={{ textAlign: 'right' }}>{num(cost.messages)}</Box>
            <Box sx={{ textAlign: 'right' }}>{money(cost.totalCost)}</Box>
            <Box sx={{ textAlign: 'right' }}>{perMsg(cost.totalCost, cost.messages)}</Box>
          </Box>
        </Box>
      </Box>

      {cost.estimatedPrices > 0 && (
        <Stack
          direction="row"
          gap={1.25}
          alignItems="flex-start"
          sx={{ bgcolor: soft(theme), borderRadius: 2.5, px: 1.75, py: 1.5 }}
        >
          <InfoRoundedIcon sx={{ fontSize: 16, color: 'text.secondary', mt: '1px' }} />
          <Typography sx={{ fontSize: 12, color: 'text.secondary', lineHeight: 1.5 }}>
            {num(cost.estimatedPrices)} mensajes aún sin precio de Infobip: se estimaron a tarifa (SMS $
            {cost.rates.sms} · MMS ${cost.rates.mms} · RCS ${cost.rates.rcs}). El costo final puede cambiar.
          </Typography>
        </Stack>
      )}
    </StatsCard>
  );
}
