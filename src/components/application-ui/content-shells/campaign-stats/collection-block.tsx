'use client';

/**
 * "¿Esta campaña ya se cobró?": la factura de QuickBooks que la cobró, cuánto se pagó,
 * cuánto falta y el saldo total de la tienda. Lo que necesita facturación de un vistazo.
 */

import { panelDivider } from '@/components/application-ui/content-shells/store-managment/panel-kit';
import { qboService, type QboCampaignBilling, type QboStoreDetail } from '@/services/qbo.service';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import { Box, Button, Skeleton, Stack, Typography, useTheme } from '@mui/material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { money, num, type Tone } from './constants';
import { Pill, soft } from './ui';

const day = (d?: string | null) => (d ? format(new Date(`${d.slice(0, 10)}T12:00:00`), 'd MMM yyyy', { locale: es }) : '—');

function statusOf(b: QboCampaignBilling): { label: string; tone: Tone } {
  if (!b.linked) return { label: 'Tienda sin QuickBooks', tone: 'neutral' };
  if (!b.billed) return { label: 'Sin facturar', tone: 'warning' };
  const inv = b.invoice!;
  if (inv.status === 'paid') return { label: 'Pagada', tone: 'success' };
  if (inv.daysOverdue > 0) return { label: `Vencida · ${inv.daysOverdue} días`, tone: 'error' };
  return { label: inv.status === 'partial' ? 'Pago parcial' : 'Pendiente de pago', tone: 'info' };
}

function Row({ label, value, strong, tone }: { label: string; value: React.ReactNode; strong?: boolean; tone?: string }) {
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      gap={2}
      sx={{ fontSize: 14 }}
    >
      <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{label}</Typography>
      <Typography sx={{ fontSize: 14, fontWeight: strong ? 800 : 600, color: tone, fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>
        {value}
      </Typography>
    </Stack>
  );
}

export function CollectionBlock({
  charged,
  audience,
  billing,
  loading,
  store,
}: {
  charged: number;
  audience: number;
  billing?: QboCampaignBilling;
  loading: boolean;
  store?: QboStoreDetail;
}) {
  const theme = useTheme();
  const line = panelDivider(theme);
  const st = billing ? statusOf(billing) : null;
  const inv = billing?.invoice;

  const openPdf = async () => {
    if (!inv) return;
    try {
      await qboService.openInvoicePdf(inv.qboId, { docNumber: inv.docNumber });
    } catch {
      toast.error('No se pudo abrir la factura.');
    }
  };

  return (
    <Stack
      gap={1.75}
      sx={{ border: `1px solid ${line}`, borderRadius: 3.5, p: 2 }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        gap={1}
        flexWrap="wrap"
      >
        <Typography sx={{ fontSize: 14, fontWeight: 700 }}>Cobro a la tienda</Typography>
        {st && (
          <Pill
            label={st.label}
            tone={st.tone}
          />
        )}
      </Stack>

      <Row
        label="Se le debe cobrar"
        value={money(charged)}
        strong
      />
      {audience > 0 && (
        <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: -1 }}>
          {num(audience)} mensajes × ${(charged / audience).toFixed(4)} (tarifa de la tienda)
        </Typography>
      )}

      {loading ? (
        <Skeleton
          variant="rounded"
          height={96}
        />
      ) : !billing?.ok ? (
        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
          No se pudo consultar QuickBooks{billing?.message ? `: ${billing.message}` : '.'}
        </Typography>
      ) : !billing.linked ? (
        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
          La tienda no está vinculada a un cliente de QuickBooks, así que no se puede saber si ya se facturó.
          Se vincula en Facturación → Vinculación.
        </Typography>
      ) : !billing.billed ? (
        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
          Todavía no aparece en ninguna factura
          {billing.ageDays != null ? ` (se envió hace ${num(billing.ageDays)} días)` : ''}. Hay que incluirla en la próxima
          factura de la tienda.
        </Typography>
      ) : (
        inv && (
          <Stack gap={1}>
            <Row
              label={`Factura #${inv.docNumber}`}
              value={`emitida ${day(inv.issuedAt)}`}
            />
            <Row
              label="Se facturó"
              value={money(billing.billedAmount)}
            />
            {Math.abs(billing.diff ?? 0) >= 0.01 && (
              <Typography sx={{ fontSize: 12, color: 'warning.main', fontWeight: 600 }}>
                {money(Math.abs(billing.diff!))} {billing.diff! > 0 ? 'más' : 'menos'} de lo que calcula el sistema
              </Typography>
            )}
            <Row
              label="Pagado de la factura"
              value={`${money(inv.paid)} de ${money(inv.total)}`}
              tone="success.main"
            />
            <Row
              label="Pendiente de la factura"
              value={money(inv.balance)}
              strong
              tone={inv.balance > 0 ? (inv.daysOverdue > 0 ? 'error.main' : 'text.primary') : 'success.main'}
            />
            {inv.dueDate && inv.balance > 0 && (
              <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Vence el {day(inv.dueDate)}</Typography>
            )}
            <Box>
              <Button
                size="small"
                startIcon={<OpenInNewRoundedIcon />}
                onClick={openPdf}
                sx={{ fontWeight: 600, px: 0 }}
              >
                Ver factura
              </Button>
            </Box>
          </Stack>
        )
      )}

      {store?.linked && (
        <Box sx={{ bgcolor: soft(theme), borderRadius: 2.5, px: 1.75, py: 1.5 }}>
          <Typography sx={{ fontSize: 13, lineHeight: 1.6 }}>
            {store.balance > 0 ? (
              <>
                La tienda debe en total <strong>{money(store.balance)}</strong> en {num(store.openInvoices)}{' '}
                {store.openInvoices === 1 ? 'factura abierta' : 'facturas abiertas'}
                {store.maxDaysOverdue > 0 ? ` (la más atrasada lleva ${num(store.maxDaysOverdue)} días vencida)` : ''}.
              </>
            ) : (
              <>La tienda está al día: no tiene saldo pendiente.</>
            )}
            {store.lastPayment && (
              <>
                {' '}
                Último pago: {money(store.lastPayment.amount)} el {day(store.lastPayment.date)}.
              </>
            )}
          </Typography>
        </Box>
      )}
    </Stack>
  );
}
