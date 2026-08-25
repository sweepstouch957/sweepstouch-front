'use client';

import {
  KpiCard,
  KpiRow,
  PanelCard,
  SectionHeader,
} from '@/components/application-ui/content-shells/store-managment/panel-kit';
import type { QboTotals } from '@/services/qbo.service';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import LinkOffRoundedIcon from '@mui/icons-material/LinkOffRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import StackedBarChartRoundedIcon from '@mui/icons-material/StackedBarChartRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import { Box, Skeleton, Stack, Tooltip } from '@mui/material';
import { AgingBar } from './aging-bar';
import { money } from './constants';

type Props = {
  totals?: QboTotals;
  isLoading: boolean;
};

/**
 * Resumen de la cartera sobre el kit del panel.
 *
 * Se usa KpiCard/KpiRow en vez de Paper propios: el sistema de diseño ya define
 * la cifra (25/700, tracking −0.7, tabular-nums), el radio y el borde, y tenerlo
 * a mano acá hacía que esta pantalla se viera de otra app.
 */
export function QboSummaryCards({ totals, isLoading }: Props) {
  if (isLoading || !totals) {
    return (
      <Stack gap={2}>
        <KpiRow>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i}
variant="rounded"
height={92}
sx={{ borderRadius: '18px' }} />
          ))}
        </KpiRow>
        <Skeleton variant="rounded"
height={108}
sx={{ borderRadius: '18px' }} />
      </Stack>
    );
  }

  const needsAttention = totals.unlinked + totals.withDrift;
  const overduePct = totals.invoiceTotal > 0 ? (totals.overdue / totals.invoiceTotal) * 100 : 0;

  return (
    <Stack gap={2}>
      <KpiRow>
        <Tooltip
          title={
            totals.unappliedCredits > 0
              ? `Saldo neto. Las facturas abiertas suman ${money(totals.invoiceTotal)}; la diferencia de ${money(totals.unappliedCredits)} son créditos y pagos sin aplicar que QuickBooks ya descuenta.`
              : ''
          }
        >
          <Box>
            <KpiCard
              icon={<AccountBalanceWalletRoundedIcon />}
              label="Deuda total"
              value={money(totals.balance)}
              delta={`${totals.customers} clientes`}
            />
          </Box>
        </Tooltip>

        <Tooltip
          title={`Facturas abiertas con vencimiento pasado. Se mide sobre ${money(totals.invoiceTotal)} en facturas, no sobre el saldo neto.`}
        >
          <Box>
            <KpiCard
              icon={<WarningAmberRoundedIcon />}
              label="Vencido"
              value={money(totals.overdue)}
              // El porcentaje dice más que el monto suelto: 98% vencido es la
              // noticia, no los $166 mil.
              delta={`${overduePct.toFixed(0)}% de la cartera`}
              tone={overduePct > 50 ? 'error' : overduePct > 0 ? 'warning' : 'neutral'}
            />
          </Box>
        </Tooltip>

        <KpiCard
          icon={<ReceiptLongRoundedIcon />}
          label="Facturas abiertas"
          value={totals.openInvoices}
          delta={`${totals.linked} de ${totals.customers} vinculadas`}
        />

        <KpiCard
          icon={<LinkOffRoundedIcon />}
          label="Requieren atención"
          value={needsAttention}
          delta={`${totals.unlinked} sin vincular · ${totals.withDrift} descuadradas`}
          tone={needsAttention > 0 ? 'warning' : 'neutral'}
        />
      </KpiRow>

      <PanelCard>
        <SectionHeader
          icon={<StackedBarChartRoundedIcon />}
          title="Antigüedad de la cartera"
          hint={
            totals.unappliedCredits > 0
              ? `Sobre ${money(totals.invoiceTotal)} en facturas · ${money(totals.unappliedCredits)} en créditos sin aplicar`
              : `Sobre ${money(totals.invoiceTotal)} en facturas`
          }
        />
        <Box sx={{ px: 2.25, pb: 2.25 }}>
          <AgingBar aging={totals.aging}
showLegend
height={10} />
        </Box>
      </PanelCard>
    </Stack>
  );
}
