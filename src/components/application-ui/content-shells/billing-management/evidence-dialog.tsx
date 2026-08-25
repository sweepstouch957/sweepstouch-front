'use client';

import { fmtDate, money } from '@/components/application-ui/content-shells/qbo-receivables/constants';
import { InvoicePdfButton } from '@/components/application-ui/content-shells/qbo-receivables/invoice-pdf-button';
import { type QboNotBilled, type QboWithDiff } from '@/services/qbo.service';
import CampaignRoundedIcon from '@mui/icons-material/CampaignRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Paper,
  Stack,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import { useRouter } from 'next/navigation';

export type EvidenceTarget =
  | ({ view: 'withDiff' } & QboWithDiff)
  | ({ view: 'notBilled' } & QboNotBilled);

type Props = { target: EvidenceTarget | null; onClose: () => void };

function Side({
  title,
  icon,
  tone,
  rows,
}: {
  title: string;
  icon: React.ReactNode;
  tone: 'primary' | 'success' | 'warning';
  rows: Array<[string, string]>;
}) {
  const theme = useTheme();
  return (
    <Paper
      variant="outlined"
      sx={{ p: 1.75, borderRadius: 2, flex: 1, borderColor: alpha(theme.palette[tone].main, 0.5) }}
    >
      <Stack direction="row"
alignItems="center"
spacing={0.75}
sx={{ mb: 1 }}>
        <Box sx={{ color: `${tone}.main`, display: 'flex' }}>{icon}</Box>
        <Typography variant="caption"
fontWeight={700}
color={`${tone}.main`}
sx={{ textTransform: 'uppercase' }}>
          {title}
        </Typography>
      </Stack>
      <Stack gap={0.5}>
        {rows.map(([k, v]) => (
          <Stack key={k}
direction="row"
justifyContent="space-between"
spacing={1}>
            <Typography variant="caption"
color="text.secondary">
              {k}
            </Typography>
            <Typography variant="caption"
fontWeight={600}
sx={{ fontVariantNumeric: 'tabular-nums' }}>
              {v}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Paper>
  );
}

/**
 * Evidencia de un desajuste: los dos lados enfrentados, con acceso al documento
 * de QuickBooks y a la campaña.
 *
 * Sin esto la conciliación solo dice "no cuadra" y hay que salir a buscar la
 * factura a mano en QuickBooks para entender por qué.
 */
export function EvidenceDialog({ target, onClose }: Props) {
  const router = useRouter();
  const isDiff = target?.view === 'withDiff';
  const d = target as (QboWithDiff & { view: 'withDiff' }) | null;
  const n = target as (QboNotBilled & { view: 'notBilled' }) | null;

  // El precio unitario es lo que explica casi todas las diferencias: tarifa
  // negociada por tienda contra el 0.0585 fijo del sistema.
  const priceGap =
    isDiff && d?.billedUnitPrice != null && d?.systemUnitPrice != null
      ? Math.abs(d.billedUnitPrice - d.systemUnitPrice) > 0.0005
      : false;

  // Una factura trae la línea de SMS y la de MMS del mismo día con la misma
  // audiencia. Si el pareo cruzó los tipos, comparar los importes no dice nada.
  const typeGap = isDiff && Boolean(d?.typeMismatch);

  const audGap =
    isDiff && d?.billedAudience != null && d?.systemAudience != null
      ? d.billedAudience !== d.systemAudience
      : false;

  return (
    <Dialog open={Boolean(target)}
onClose={onClose}
maxWidth="sm"
fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row"
alignItems="center"
spacing={1}
flexWrap="wrap"
useFlexGap>
          <span>{isDiff ? 'Diferencia' : 'Campaña sin facturar'}</span>
          <Chip size="small"
variant="outlined"
label={target?.type} />
          <Chip size="small"
variant="outlined"
label={fmtDate(target?.serviceDate ?? null)} />
        </Stack>
        <Typography variant="body2"
color="text.secondary"
sx={{ mt: 0.5 }}>
          {target?.storeName}
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        {isDiff && d && (
          <>
            {/* El diagnóstico primero: sin esto son dos números que no cuadran
                y cada quien saca su conclusión. */}
            <Alert severity={typeGap ? 'error' : priceGap ? 'warning' : 'info'}
sx={{ mb: 2 }}>
              <AlertTitle sx={{ mb: 0.25 }}>
                {typeGap
                  ? 'Se están comparando cosas distintas'
                  : priceGap
                    ? 'Tarifa distinta'
                    : audGap
                      ? 'Audiencia distinta'
                      : 'Diferencia de redondeo'}
              </AlertTitle>
              <Typography variant="body2">
                {typeGap
                  ? `La factura cobra ${d.type} y la campaña del sistema es ${d.systemType}. Ese día no había ninguna campaña de ${d.type} para esta tienda, así que se pareó con la que había. La diferencia es el precio entre un tipo y otro, no un error de cobro.`
                  : priceGap
                    ? `QuickBooks cobró a $${d.billedUnitPrice} por mensaje y el sistema calcula a $${d.systemUnitPrice}. Es una tarifa negociada para esta tienda, no un error de conteo.`
                    : audGap
                      ? `La factura cobra ${d.billedAudience?.toLocaleString()} destinatarios y el sistema registró ${d.systemAudience?.toLocaleString()}.`
                      : 'Los montos difieren por centavos: redondeo entre el cálculo del sistema y el de QuickBooks.'}
              </Typography>
            </Alert>

            <Stack direction={{ xs: 'column', sm: 'row' }}
spacing={1.5}
sx={{ mb: 2 }}>
              <Side
                title="QuickBooks"
                icon={<ReceiptLongRoundedIcon fontSize="small" />}
                tone="primary"
                rows={[
                  ['Factura', d.docNumber],
                  ['Tipo', d.type],
                  ['Emitida', fmtDate(d.issuedAt)],
                  ['Audiencia', d.billedAudience?.toLocaleString() ?? '—'],
                  ['Precio unit.', d.billedUnitPrice != null ? `$${d.billedUnitPrice}` : '—'],
                  ['Importe', money(d.billedAmount)],
                ]}
              />
              <Side
                title="Sistema"
                icon={<CampaignRoundedIcon fontSize="small" />}
                tone="success"
                rows={[
                  ['Campaña', d.campaignName || '—'],
                  ['Tipo', d.systemType || '—'],
                  ['Servicio', fmtDate(d.serviceDate)],
                  ['Audiencia', d.systemAudience?.toLocaleString() ?? '—'],
                  ['Precio unit.', d.systemUnitPrice != null ? `$${d.systemUnitPrice}` : '—'],
                  ['Costo', money(d.systemCost)],
                ]}
              />
            </Stack>

            <Divider sx={{ mb: 1.5 }} />

            <Stack direction="row"
justifyContent="space-between"
alignItems="baseline">
              <Typography variant="body2"
color="text.secondary">
                {d.lagDays != null ? `Facturada ${d.lagDays} días después del servicio` : ''}
              </Typography>
              <Typography
                variant="h6"
                fontWeight={700}
                color={d.diff > 0 ? 'success.main' : 'error.main'}
              >
                {`${d.diff > 0 ? '+' : ''}${money(d.diff)}`}
              </Typography>
            </Stack>

            {/* Cómo se supo que esta factura corresponde a esta campaña: si se
                dedujo, la fecha del servicio no está escrita en ningún lado. */}
            {d.matchedBy === 'emision' && (
              <Alert severity="info"
sx={{ mt: 1.5 }}>
                <Typography variant="body2">
                  Esta factura no dice a qué día corresponde el servicio, solo la audiencia. Se
                  emparejó con la campaña del mismo tamaño y tipo más cercana antes de la
                  emisión.
                </Typography>
              </Alert>
            )}

            {d.description && (
              <Typography variant="caption"
color="text.secondary"
sx={{ display: 'block', mt: 1.5 }}>
                {`Descripción en la factura: “${d.description}”`}
              </Typography>
            )}
          </>
        )}

        {!isDiff && n && (
          <>
            <Alert severity={n.ageDays > 30 ? 'error' : 'info'}
sx={{ mb: 2 }}>
              <AlertTitle sx={{ mb: 0.25 }}>
                {`${n.ageDays} días sin facturar`}
              </AlertTitle>
              <Typography variant="caption">
                {n.ageDays > 30
                  ? 'Muy por encima del atraso normal de facturación (4 a 7 días). Conviene revisar si se emitió en una línea sin fecha en la descripción, que no se puede parear.'
                  : 'Dentro o cerca del atraso normal de facturación.'}
              </Typography>
            </Alert>

            <Side
              title="Sistema"
              icon={<CampaignRoundedIcon fontSize="small" />}
              tone="success"
              rows={[
                ['Campaña', n.campaignName || '—'],
                ['Servicio', fmtDate(n.serviceDate)],
                ['Tipo', n.type],
                ['Audiencia', n.audience?.toLocaleString() ?? '—'],
                ['Estado', n.status || '—'],
                ['Costo', money(n.systemCost)],
              ]}
            />
          </>
        )}
      </DialogContent>

      <DialogActions>
        {target?.storeId && (
          <Button
            startIcon={<StorefrontRoundedIcon />}
            onClick={() => {
              router.push(`/admin/management/stores/edit/${target.storeId}?tag=quickbooks`);
              onClose();
            }}
          >
            Tienda
          </Button>
        )}
        {target?.campaignId && (
          <Button
            startIcon={<CampaignRoundedIcon />}
            onClick={() => {
              router.push(`/admin/management/campaings/stats/${target.campaignId}`);
              onClose();
            }}
          >
            Campaña
          </Button>
        )}
        {isDiff && d?.invoiceQboId && (
          <InvoicePdfButton
            qboId={d.invoiceQboId}
            docNumber={d.docNumber}
            variant="contained"
            size="medium"
            endIcon={<OpenInNewRoundedIcon fontSize="small" />}
          >
            Ver factura
          </InvoicePdfButton>
        )}
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}

export default EvidenceDialog;
