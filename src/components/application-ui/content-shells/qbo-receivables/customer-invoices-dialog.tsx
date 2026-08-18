'use client';

import type { QboBalanceRow } from '@/services/qbo.service';
import { useQboCustomerLedger } from '@hooks/fetching/qbo/useQbo';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
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
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { AgingBar } from './aging-bar';
import { fmtDate, money, overdueColor } from './constants';
import { InvoiceDialog } from './invoice-dialog';

type Props = {
  row: QboBalanceRow | null;
  onClose: () => void;
  /** Solo para las filas vinculadas: abre el panel de la tienda. */
  onOpenStore?: (storeId: string) => void;
};

type Scope = 'open' | 'all';

const STATUS: Record<string, { label: string; color: 'success' | 'warning' | 'error' }> = {
  paid: { label: 'Pagada', color: 'success' },
  partial: { label: 'Parcial', color: 'warning' },
  open: { label: 'Abierta', color: 'error' },
};

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Box minWidth={0}
flex={1}>
      <Typography variant="caption"
color="text.secondary"
fontWeight={600}
sx={{ textTransform: 'uppercase' }}>
        {label}
      </Typography>
      <Typography variant="h5"
fontWeight={700}
noWrap>
        {value}
      </Typography>
      {hint && (
        <Typography variant="caption"
color="text.secondary"
noWrap
sx={{ display: 'block' }}>
          {hint}
        </Typography>
      )}
    </Box>
  );
}

/**
 * Todas las facturas de un cliente, para cobranza.
 *
 * Entra por qboCustomerId y no por tienda: de los 270 clientes de QuickBooks solo
 * un puñado está vinculado a Mongo, y hay que poder revisar el detalle de todos.
 */
export function CustomerInvoicesDialog({ row, onClose, onOpenStore }: Props) {
  const { data, isLoading, isError, error } = useQboCustomerLedger(row?.qboCustomerId ?? null);
  const [scope, setScope] = useState<Scope>('open');
  const [invoiceId, setInvoiceId] = useState<string | null>(null);

  const invoices = useMemo(() => {
    const all = data?.invoices ?? [];
    return scope === 'open' ? all.filter((i) => i.balance > 0) : all;
  }, [data, scope]);

  const handleClose = () => {
    setScope('open');
    onClose();
  };

  return (
    <>
      <Dialog open={Boolean(row)}
onClose={handleClose}
maxWidth="lg"
fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row"
alignItems="center"
spacing={1.5}
flexWrap="wrap"
useFlexGap>
            <Box minWidth={0}>
              <Typography variant="h6"
fontWeight={700}
noWrap>
                {row?.storeName || row?.qboName}
              </Typography>
              {row?.storeName && row.storeName !== row.qboName && (
                <Typography variant="caption"
color="text.secondary">
                  {`En QuickBooks: ${row.qboName}`}
                </Typography>
              )}
            </Box>
            {row && !row.linked && (
              <Chip size="small"
color="warning"
variant="outlined"
label="Sin tienda vinculada" />
            )}
          </Stack>
        </DialogTitle>

        <DialogContent dividers>
          {isLoading && <Skeleton variant="rounded"
height={320} />}

          {isError && (
            <Alert severity="error">
              {(error as any)?.response?.data?.message ||
                (error as Error)?.message ||
                'No se pudo leer el detalle en QuickBooks.'}
            </Alert>
          )}

          {data && !data.found && (
            <Alert severity="warning">Este cliente ya no existe en QuickBooks.</Alert>
          )}

          {data?.found && (
            <>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                divider={<Divider orientation="vertical"
flexItem />}
                spacing={2}
                sx={{ mb: 2.5 }}
              >
                <Stat
                  label="Debe"
                  value={money(data.balance)}
                  hint={`${data.openInvoices} factura${data.openInvoices === 1 ? '' : 's'} abierta${data.openInvoices === 1 ? '' : 's'}`}
                />
                <Stat
                  label="Pagado histórico"
                  value={money(data.totalPaid)}
                  hint={`${data.payments.length} pagos`}
                />
                <Stat
                  label="Último pago"
                  value={data.lastPayment ? money(data.lastPayment.amount) : '—'}
                  hint={data.lastPayment ? fmtDate(data.lastPayment.date) : 'Sin pagos'}
                />
                <Stat
                  label="Atraso máximo"
                  value={data.maxDaysOverdue > 0 ? `${data.maxDaysOverdue} d` : 'Al día'}
                  hint={`${money(data.aging.d90plus)} a +90 días`}
                />
              </Stack>

              <Box sx={{ mb: 2.5 }}>
                <AgingBar aging={data.aging}
showLegend
height={9} />
              </Box>

              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 1 }}
              >
                <Typography variant="subtitle2"
fontWeight={700}>
                  Facturas
                </Typography>
                <ToggleButtonGroup
                  size="small"
                  exclusive
                  value={scope}
                  onChange={(_, v) => v && setScope(v as Scope)}
                >
                  <ToggleButton value="open">{`Abiertas (${data.openInvoices})`}</ToggleButton>
                  <ToggleButton value="all">{`Todas (${data.totalInvoices})`}</ToggleButton>
                </ToggleButtonGroup>
              </Stack>

              {invoices.length === 0 ? (
                <Box py={4}
textAlign="center">
                  <Typography color="text.secondary">
                    {scope === 'open' ? 'No tiene facturas abiertas.' : 'Sin facturas.'}
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ overflowX: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Nº</TableCell>
                        <TableCell>Emitida</TableCell>
                        <TableCell>Vence</TableCell>
                        <TableCell align="right">Total</TableCell>
                        <TableCell align="right">Pagado</TableCell>
                        <TableCell align="right">Debe</TableCell>
                        <TableCell align="center">Estado</TableCell>
                        <TableCell align="right" />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {invoices.map((i) => (
                        <TableRow
                          key={i.qboId}
                          hover
                          sx={{ cursor: 'pointer' }}
                          onClick={() => setInvoiceId(i.qboId)}
                        >
                          <TableCell>{i.docNumber || i.qboId}</TableCell>
                          <TableCell>{fmtDate(i.txnDate)}</TableCell>
                          <TableCell>{fmtDate(i.dueDate)}</TableCell>
                          <TableCell align="right">{money(i.total)}</TableCell>
                          <TableCell align="right">
                            <Typography variant="body2"
color="success.main">
                              {money(i.paid)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2"
fontWeight={700}>
                              {money(i.balance)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Stack direction="row"
spacing={0.5}
justifyContent="center">
                              <Chip
                                size="small"
                                label={STATUS[i.status].label}
                                color={STATUS[i.status].color}
                                variant={i.status === 'paid' ? 'outlined' : 'filled'}
                              />
                              {i.daysOverdue > 0 && (
                                <Chip
                                  size="small"
                                  variant="outlined"
                                  color={overdueColor(i.daysOverdue)}
                                  label={`${i.daysOverdue} d`}
                                />
                              )}
                            </Stack>
                          </TableCell>
                          <TableCell align="right">
                            <ChevronRightRoundedIcon fontSize="small"
color="action" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              )}

              {data.payments.length > 0 && (
                <>
                  <Typography variant="subtitle2"
fontWeight={700}
sx={{ mt: 3, mb: 1 }}>
                    {`Pagos recibidos (${data.payments.length})`}
                  </Typography>
                  <Box sx={{ overflowX: 'auto', maxHeight: 220, overflowY: 'auto' }}>
                    <Table size="small"
stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>Fecha</TableCell>
                          <TableCell align="right">Monto</TableCell>
                          <TableCell>Nota</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {data.payments.map((p) => (
                          <TableRow key={p.qboId}>
                            <TableCell>{fmtDate(p.date)}</TableCell>
                            <TableCell align="right">
                              <Typography variant="body2"
fontWeight={600}>
                                {money(p.amount)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption"
color="text.secondary">
                                {p.note || '—'}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                </>
              )}
            </>
          )}
        </DialogContent>

        <DialogActions>
          {row?.storeId && onOpenStore && (
            <Button
              startIcon={<OpenInNewRoundedIcon />}
              onClick={() => onOpenStore(row.storeId as string)}
            >
              Abrir tienda
            </Button>
          )}
          <Button onClick={handleClose}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Anidado: desde la lista se baja al detalle de una factura sin perder la lista */}
      <InvoiceDialog qboId={invoiceId}
onClose={() => setInvoiceId(null)} />
    </>
  );
}

export default CustomerInvoicesDialog;
