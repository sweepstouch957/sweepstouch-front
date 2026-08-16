'use client';

import {
  fmtDate,
  money,
} from '@/components/application-ui/content-shells/qbo-receivables/constants';
import { useQboSyncPreview, useQboSyncStore } from '@hooks/fetching/qbo/useQbo';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  LinearProgress,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useState } from 'react';

type Props = {
  open: boolean;
  storeId: string;
  onClose: () => void;
};

function LedgerColumn({
  title,
  tone,
  ledger,
}: {
  title: string;
  tone: 'error' | 'success';
  ledger: { invoices: number; payments: number; invoicedTotal: number; paidTotal: number; pending: number };
}) {
  return (
    <Paper variant="outlined"
sx={{ p: 2, borderRadius: 2, flex: 1, borderColor: `${tone}.main` }}>
      <Typography variant="caption"
fontWeight={700}
color={`${tone}.main`}
sx={{ textTransform: 'uppercase' }}>
        {title}
      </Typography>
      <Stack spacing={0.5}
sx={{ mt: 1 }}>
        <Stack direction="row"
justifyContent="space-between">
          <Typography variant="body2"
color="text.secondary">Facturas</Typography>
          <Typography variant="body2"
fontWeight={600}>{ledger.invoices}</Typography>
        </Stack>
        <Stack direction="row"
justifyContent="space-between">
          <Typography variant="body2"
color="text.secondary">Pagos</Typography>
          <Typography variant="body2"
fontWeight={600}>{ledger.payments}</Typography>
        </Stack>
        <Divider sx={{ my: 0.5 }} />
        <Stack direction="row"
justifyContent="space-between">
          <Typography variant="body2"
color="text.secondary">Facturado</Typography>
          <Typography variant="body2">{money(ledger.invoicedTotal)}</Typography>
        </Stack>
        <Stack direction="row"
justifyContent="space-between">
          <Typography variant="body2"
color="text.secondary">Pagado</Typography>
          <Typography variant="body2">{money(ledger.paidTotal)}</Typography>
        </Stack>
        <Stack direction="row"
justifyContent="space-between">
          <Typography variant="body2"
fontWeight={700}>Pendiente</Typography>
          <Typography variant="body2"
fontWeight={700}>{money(ledger.pending)}</Typography>
        </Stack>
      </Stack>
    </Paper>
  );
}

/**
 * Confirmación de una operación irreversible: borra las facturas y pagos de la tienda
 * en Mongo y los reemplaza por los de QuickBooks.
 *
 * El preview se pide fresco cada vez que se abre. Enseñar números cacheados de una
 * operación destructiva es cómo se borra lo que no era.
 */
export function SyncFromQboDialog({ open, storeId, onClose }: Props) {
  const preview = useQboSyncPreview(storeId, { enabled: open });
  const sync = useQboSyncStore(storeId);
  const [understood, setUnderstood] = useState(false);

  const data = preview.data;
  const losingData = Boolean(
    data && data.willDelete.invoices > 0 && data.willImport.invoices < data.willDelete.invoices
  );

  const handleClose = () => {
    setUnderstood(false);
    onClose();
  };

  return (
    <Dialog open={open}
onClose={handleClose}
maxWidth="md"
fullWidth>
      <DialogTitle>
        <Stack direction="row"
alignItems="center"
spacing={1}>
          <WarningAmberRoundedIcon color="warning" />
          <span>Reemplazar facturación con la de QuickBooks</span>
        </Stack>
      </DialogTitle>

      {(preview.isFetching || sync.isPending) && <LinearProgress />}

      <DialogContent dividers>
        {preview.isLoading && <Skeleton variant="rounded"
height={220} />}

        {preview.isError && (
          <Alert severity="error">
            {(preview.error as any)?.response?.data?.message ||
              (preview.error as Error)?.message ||
              'No se pudo calcular el preview.'}
          </Alert>
        )}

        {data && (
          <>
            <Alert severity="warning"
sx={{ mb: 2.5 }}>
              <AlertTitle>Esto no se puede deshacer</AlertTitle>
              Se borran las {data.willDelete.invoices} facturas y {data.willDelete.payments} pagos
              de <strong>{data.storeName}</strong> en Sweepstouch, y se reemplazan por los de
              QuickBooks. Los archivos adjuntos en S3 de las facturas borradas quedan huérfanos.
            </Alert>

            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              alignItems="center"
              sx={{ mb: 2.5 }}
            >
              <LedgerColumn title="Se borra (Sweepstouch)"
tone="error"
ledger={data.willDelete} />
              <ArrowForwardRoundedIcon color="action" />
              <LedgerColumn title="Entra (QuickBooks)"
tone="success"
ledger={data.willImport} />
            </Stack>

            {losingData && (
              <Alert severity="error"
sx={{ mb: 2 }}>
                QuickBooks tiene <strong>menos</strong> facturas que Sweepstouch
                ({data.willImport.invoices} vs {data.willDelete.invoices}). Si el cliente de
                QuickBooks está duplicado, aquí se pierde historial. Revisa los duplicados antes.
              </Alert>
            )}

            {data.sample.length > 0 && (
              <>
                <Typography variant="subtitle2"
fontWeight={600}
sx={{ mb: 1 }}>
                  Últimas facturas que entrarían
                </Typography>
                <Box sx={{ overflowX: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Nº</TableCell>
                        <TableCell>Fecha</TableCell>
                        <TableCell>Concepto</TableCell>
                        <TableCell align="right">Total</TableCell>
                        <TableCell align="right">Debe</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.sample.map((inv) => (
                        <TableRow key={`${inv.docNumber}-${inv.txnDate}`}>
                          <TableCell>{inv.docNumber || '—'}</TableCell>
                          <TableCell>{fmtDate(inv.txnDate)}</TableCell>
                          <TableCell>
                            {inv.lines.length
                              ? inv.lines.map((l, i) => (
                                  <Typography key={i}
variant="caption"
display="block">
                                    {`${l.kind} · ${l.description || l.item || '—'}`}
                                  </Typography>
                                ))
                              : '—'}
                          </TableCell>
                          <TableCell align="right">{money(inv.total)}</TableCell>
                          <TableCell align="right">{money(inv.balance)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              </>
            )}

            <FormControlLabel
              sx={{ mt: 2 }}
              control={
                <Checkbox
                  checked={understood}
                  onChange={(e) => setUnderstood(e.target.checked)}
                  color="warning"
                />
              }
              label={`Entiendo que se borran ${data.willDelete.invoices} facturas y ${data.willDelete.payments} pagos de esta tienda`}
            />
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}
disabled={sync.isPending}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          color="warning"
          disabled={!data || !understood || sync.isPending}
          onClick={() => sync.mutate(undefined, { onSuccess: handleClose })}
        >
          Reemplazar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default SyncFromQboDialog;
