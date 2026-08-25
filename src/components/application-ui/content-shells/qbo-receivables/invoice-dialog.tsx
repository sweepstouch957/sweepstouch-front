'use client';

import { InvoicePdfButton } from './invoice-pdf-button';
import { useQboInvoice } from '@hooks/fetching/qbo/useQbo';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { fmtDate, money, overdueColor } from './constants';

type Props = {
  qboId: string | null;
  onClose: () => void;
};

const STATUS_LABEL: Record<string, { label: string; color: 'success' | 'warning' | 'error' }> = {
  paid: { label: 'Pagada', color: 'success' },
  partial: { label: 'Pago parcial', color: 'warning' },
  open: { label: 'Abierta', color: 'error' },
};

function Field({ label, value }: { label: string; value: string }) {
  return (
    <Box minWidth={0}>
      <Typography variant="caption"
color="text.secondary"
fontWeight={600}
sx={{ textTransform: 'uppercase' }}>
        {label}
      </Typography>
      <Typography variant="body2"
fontWeight={600}>
        {value}
      </Typography>
    </Box>
  );
}

/**
 * Factura completa para cobranza: conceptos, montos y estado.
 *
 * El PDF no se reconstruye acá — se abre el que genera QuickBooks. Si el contador
 * cambia el diseño o los datos fiscales, el que ve cobranza sale actualizado solo.
 */
export function InvoiceDialog({ qboId, onClose }: Props) {
  const { data, isLoading, isError, error } = useQboInvoice(qboId);

  const found = data?.found ? data : null;
  const status = found ? STATUS_LABEL[found.status] : null;

  return (
    <Dialog open={Boolean(qboId)}
onClose={onClose}
maxWidth="md"
fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row"
alignItems="center"
spacing={1.5}
flexWrap="wrap"
useFlexGap>
          <span>{`Factura ${found?.docNumber || qboId || ''}`}</span>
          {status && <Chip size="small"
label={status.label}
color={status.color} />}
          {found && found.daysOverdue > 0 && (
            <Chip
              size="small"
              variant="outlined"
              color={overdueColor(found.daysOverdue)}
              label={`${found.daysOverdue} días de atraso`}
            />
          )}
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        {isLoading && <Skeleton variant="rounded"
height={260} />}

        {isError && (
          <Alert severity="error">
            {(error as any)?.response?.data?.message ||
              (error as Error)?.message ||
              'No se pudo leer la factura.'}
          </Alert>
        )}

        {data && !data.found && (
          <Alert severity="warning">
            Esta factura ya no existe en QuickBooks. Puede que el contador la haya anulado.
          </Alert>
        )}

        {found && (
          <>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={{ xs: 1.5, sm: 3 }}
              divider={<Divider orientation="vertical"
flexItem />}
              sx={{ mb: 2.5 }}
            >
              <Field label="Cliente"
value={found.customer.name || '—'} />
              <Field label="Emitida"
value={fmtDate(found.txnDate)} />
              <Field label="Vence"
value={fmtDate(found.dueDate)} />
              {found.terms && <Field label="Términos"
value={found.terms} />}
            </Stack>

            {(found.billAddr || found.customer.email) && (
              <Typography variant="caption"
color="text.secondary"
sx={{ display: 'block', mb: 2 }}>
                {[found.billAddr, found.customer.email].filter(Boolean).join(' · ')}
              </Typography>
            )}

            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Concepto</TableCell>
                    <TableCell>Producto</TableCell>
                    <TableCell align="right">Cant.</TableCell>
                    <TableCell align="right">P. unit.</TableCell>
                    <TableCell align="right">Importe</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {found.lines.map((l, i) => (
                    <TableRow key={i}>
                      <TableCell>{l.description || '—'}</TableCell>
                      <TableCell>
                        <Typography variant="caption"
color="text.secondary">
                          {l.item || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">{l.qty ?? '—'}</TableCell>
                      <TableCell align="right">
                        {l.unitPrice != null ? money(l.unitPrice) : '—'}
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2"
fontWeight={600}>
                          {money(l.amount)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>

            <Stack alignItems="flex-end"
sx={{ mt: 2 }}>
              <Box sx={{ minWidth: 240 }}>
                <Stack direction="row"
justifyContent="space-between">
                  <Typography variant="body2"
color="text.secondary">Total</Typography>
                  <Typography variant="body2">{money(found.total)}</Typography>
                </Stack>
                <Stack direction="row"
justifyContent="space-between">
                  <Typography variant="body2"
color="text.secondary">Pagado</Typography>
                  <Typography variant="body2"
color="success.main">
                    {money(found.paid)}
                  </Typography>
                </Stack>
                <Divider sx={{ my: 0.75 }} />
                <Stack direction="row"
justifyContent="space-between">
                  <Typography variant="subtitle2"
fontWeight={700}>Debe</Typography>
                  <Typography variant="subtitle2"
fontWeight={700}>
                    {money(found.balance)}
                  </Typography>
                </Stack>
              </Box>
            </Stack>

            {found.memo && (
              <Alert severity="info"
sx={{ mt: 2 }}>
                {found.memo}
              </Alert>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions>
        {found && (
          <>
            <InvoicePdfButton
              qboId={found.qboId}
              docNumber={found.docNumber}
              download
              variant="text"
              size="medium"
            >
              Descargar
            </InvoicePdfButton>
            <InvoicePdfButton
              qboId={found.qboId}
              docNumber={found.docNumber}
              variant="contained"
              size="medium"
              endIcon={<OpenInNewRoundedIcon fontSize="small" />}
            >
              Ver PDF
            </InvoicePdfButton>
          </>
        )}
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}

export default InvoiceDialog;
