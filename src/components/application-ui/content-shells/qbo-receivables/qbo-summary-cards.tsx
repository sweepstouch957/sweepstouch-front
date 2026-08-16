'use client';

import type { QboTotals } from '@/services/qbo.service';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import LinkOffRoundedIcon from '@mui/icons-material/LinkOffRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import { Avatar, Box, Grid, Paper, Skeleton, Stack, Typography, alpha, useTheme } from '@mui/material';
import type { SvgIconComponent } from '@mui/icons-material';
import { AgingBar } from './aging-bar';
import { money } from './constants';

type Props = {
  totals?: QboTotals;
  isLoading: boolean;
};

type Tile = {
  label: string;
  value: string;
  hint?: string;
  icon: SvgIconComponent;
  color: 'primary' | 'warning' | 'error' | 'info';
};

export function QboSummaryCards({ totals, isLoading }: Props) {
  const theme = useTheme();

  if (isLoading || !totals) {
    return (
      <Grid container
spacing={2}>
        {[0, 1, 2, 3].map((i) => (
          <Grid key={i}
item
xs={12}
sm={6}
md={3}>
            <Skeleton variant="rounded"
height={104}
sx={{ borderRadius: 2 }} />
          </Grid>
        ))}
      </Grid>
    );
  }

  const overdue =
    totals.aging.d1_30 + totals.aging.d31_60 + totals.aging.d61_90 + totals.aging.d90plus;

  const tiles: Tile[] = [
    {
      label: 'Deuda total',
      value: money(totals.balance),
      hint: `${totals.customers} clientes en QuickBooks`,
      icon: AccountBalanceWalletRoundedIcon,
      color: 'primary',
    },
    {
      label: 'Vencido',
      value: money(overdue),
      hint: `${money(totals.aging.d90plus)} con más de 90 días`,
      icon: WarningAmberRoundedIcon,
      color: overdue > 0 ? 'warning' : 'info',
    },
    {
      label: 'Facturas abiertas',
      value: String(totals.openInvoices),
      hint: `${totals.linked} tiendas vinculadas`,
      icon: ReceiptLongRoundedIcon,
      color: 'info',
    },
    {
      label: 'Requieren atención',
      value: String(totals.unlinked + totals.withDrift),
      hint: `${totals.unlinked} sin vincular · ${totals.withDrift} descuadradas`,
      icon: LinkOffRoundedIcon,
      color: totals.unlinked + totals.withDrift > 0 ? 'error' : 'info',
    },
  ];

  return (
    <Stack spacing={2}>
      <Grid container
spacing={2}>
        {tiles.map((t) => {
          const Icon = t.icon;
          const color = theme.palette[t.color].main;
          return (
            <Grid key={t.label}
item
xs={12}
sm={6}
md={3}>
              <Paper variant="outlined"
sx={{ p: 2.5, borderRadius: 2, height: '100%' }}>
                <Stack direction="row"
spacing={1.5}
alignItems="flex-start">
                  <Avatar
                    variant="rounded"
                    sx={{
                      width: 38,
                      height: 38,
                      bgcolor: alpha(color, 0.12),
                      color,
                      borderRadius: 1.5,
                    }}
                  >
                    <Icon fontSize="small" />
                  </Avatar>
                  <Box minWidth={0}>
                    <Typography
                      variant="caption"
                      fontWeight={600}
                      color="text.secondary"
                      sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
                    >
                      {t.label}
                    </Typography>
                    <Typography variant="h4"
fontWeight={700}
sx={{ mt: 0.25, lineHeight: 1.2 }}>
                      {t.value}
                    </Typography>
                    {t.hint && (
                      <Typography variant="caption"
color="text.secondary"
noWrap>
                        {t.hint}
                      </Typography>
                    )}
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      <Paper variant="outlined"
sx={{ p: 2.5, borderRadius: 2 }}>
        <Typography
          variant="caption"
          fontWeight={600}
          color="text.secondary"
          sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
        >
          Antigüedad de la cartera
        </Typography>
        <Box mt={1.5}>
          <AgingBar aging={totals.aging}
showLegend
height={10} />
        </Box>
      </Paper>
    </Stack>
  );
}
