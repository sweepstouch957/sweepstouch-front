'use client';

import type { QboTotals } from '@/services/qbo.service';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import LinkOffRoundedIcon from '@mui/icons-material/LinkOffRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import type { SvgIconComponent } from '@mui/icons-material';
import {
  Avatar,
  Box,
  Grid,
  Paper,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import { AgingBar } from './aging-bar';
import { money } from './constants';

type Props = {
  totals?: QboTotals;
  isLoading: boolean;
};

type Tile = {
  label: string;
  value: string;
  hint: string;
  /** Texto largo del tooltip. El hint se trunca; esto no. */
  detail?: string;
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
lg={3}>
            <Skeleton variant="rounded"
height={116}
sx={{ borderRadius: 2 }} />
          </Grid>
        ))}
      </Grid>
    );
  }

  const needsAttention = totals.unlinked + totals.withDrift;

  const tiles: Tile[] = [
    {
      label: 'Deuda total',
      value: money(totals.balance),
      hint: `${totals.customers} clientes en QuickBooks`,
      detail:
        totals.unappliedCredits > 0
          ? `Saldo neto. Las facturas abiertas suman ${money(totals.invoiceTotal)}; la diferencia de ${money(totals.unappliedCredits)} son créditos y pagos sin aplicar que QuickBooks ya descuenta.`
          : undefined,
      icon: AccountBalanceWalletRoundedIcon,
      color: 'primary',
    },
    {
      label: 'Vencido',
      value: money(totals.overdue),
      hint: `${money(totals.aging.d90plus)} con más de 90 días`,
      detail: `Suma de facturas abiertas con fecha de vencimiento pasada. Se calcula sobre facturas (${money(totals.invoiceTotal)}), no sobre el saldo neto.`,
      icon: WarningAmberRoundedIcon,
      color: totals.overdue > 0 ? 'warning' : 'info',
    },
    {
      label: 'Facturas abiertas',
      value: String(totals.openInvoices),
      hint: `${totals.linked} de ${totals.customers} tiendas vinculadas`,
      icon: ReceiptLongRoundedIcon,
      color: 'info',
    },
    {
      label: 'Requieren atención',
      value: String(needsAttention),
      hint: `${totals.unlinked} sin vincular · ${totals.withDrift} descuadradas`,
      icon: LinkOffRoundedIcon,
      color: needsAttention > 0 ? 'error' : 'info',
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
            // lg={3} en vez de md={3}: a 900–1200px cuatro columnas dejan ~200px por
            // tarjeta y "$141,966.19" no cabe. Dos columnas hasta lg.
            <Grid key={t.label}
item
xs={12}
sm={6}
lg={3}>
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
                      flexShrink: 0,
                      bgcolor: alpha(color, 0.12),
                      color,
                      borderRadius: 1.5,
                    }}
                  >
                    <Icon fontSize="small" />
                  </Avatar>

                  {/* minWidth:0 es lo que permite que el hijo se encoja dentro del flex.
                      Sin esto el texto largo empuja la tarjeta y se sale del borde. */}
                  <Box minWidth={0}
flex={1}>
                    <Typography
                      variant="caption"
                      fontWeight={600}
                      color="text.secondary"
                      sx={{ textTransform: 'uppercase', letterSpacing: 0.5, display: 'block' }}
                      noWrap
                    >
                      {t.label}
                    </Typography>

                    <Tooltip title={t.value}>
                      <Typography
                        fontWeight={700}
                        sx={{
                          mt: 0.25,
                          lineHeight: 1.15,
                          // Escala con el ancho disponible: a 200px no rompe la tarjeta
                          fontSize: { xs: '1.75rem', sm: '1.5rem', lg: '1.6rem', xl: '1.9rem' },
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {t.value}
                      </Typography>
                    </Tooltip>

                    <Tooltip title={t.detail || t.hint}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          minHeight: 32, // dos líneas fijas: las 4 tarjetas quedan a la misma altura
                        }}
                      >
                        {t.hint}
                      </Typography>
                    </Tooltip>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      <Paper variant="outlined"
sx={{ p: 2.5, borderRadius: 2 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'baseline' }}
          spacing={0.5}
          sx={{ mb: 1.5 }}
        >
          <Typography
            variant="caption"
            fontWeight={600}
            color="text.secondary"
            sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
          >
            Antigüedad de la cartera
          </Typography>
          <Typography variant="caption"
color="text.secondary">
            {totals.unappliedCredits > 0
              ? `Sobre ${money(totals.invoiceTotal)} en facturas · ${money(totals.unappliedCredits)} en créditos sin aplicar`
              : `Sobre ${money(totals.invoiceTotal)} en facturas`}
          </Typography>
        </Stack>

        <AgingBar aging={totals.aging}
showLegend
height={10} />
      </Paper>
    </Stack>
  );
}
