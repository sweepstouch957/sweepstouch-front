'use client';

import { useQboCustomerLedger } from '@hooks/fetching/qbo/useQbo';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import FilterAltRoundedIcon from '@mui/icons-material/FilterAltRounded';
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

/** Lo mínimo para abrir el libro: el cliente de QBO y, si la hay, la tienda. */
export type LedgerTarget = {
  qboCustomerId: string;
  qboName: string;
  storeId?: string | null;
  storeName?: string | null;
  linked?: boolean;
};

type Props = {
  row: LedgerTarget | null;
  /** El mismo rango de la tabla. Sin esto el modal contradecía a la fila de atrás. */
  range?: { from: string | null; to: string | null };
  /** Ids de categoría activos en la tabla. Vacío = sin filtrar. */
  categories?: string[];
  /** Etiquetas legibles de esas categorías, solo para el aviso. */
  categoryLabels?: string[];
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
export function CustomerInvoicesDialog({
  row,
  range,
  categories,
  categoryLabels,
  onClose,
  onOpenStore,
}: Props) {
  const { data, isLoading, isError, error } = useQboCustomerLedger(row?.qboCustomerId ?? null, {
    from: range?.from ?? null,
    to: range?.to ?? null,
    items: categories,
  });
  const [scope, setScope] = useState<Scope>('open');
  const [invoiceId, setInvoiceId] = useState<string | null>(null);

  const invoices = useMemo(() => {
    const all = data?.invoices ?? [];
    return scope === 'open' ? all.filter((i) => i.balance > 0) : all;
  }, [data, scope]);

  // Con categorías activas se muestran las dos cifras: el total de la factura
  // (que cuadra con el PDF) y la parte que corresponde al filtro.
  const showFiltered = (data?.filters?.items?.length ?? 0) > 0;
  const filteredTotals = data?.filters?.totals ?? null;

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
            {row && row.linked === false && (
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

          {data?.found && (data.range?.ranged || (data.filters?.items?.length ?? 0) > 0) && (
            <Alert severity="info"
sx={{ mb: 2, py: 0.25 }}
icon={<FilterAltRoundedIcon fontSize="small" />}>
              <Stack direction="row"
flexWrap="wrap"
useFlexGap
spacing={0.75}
alignItems="center">
                <Typography variant="caption">Filtros de la tabla aplicados:</Typography>
                {data.range?.ranged && (
                  <Chip
                    size="small"
                    variant="outlined"
                    label={`${data.range.from ? fmtDate(data.range.from) : '…'} – ${
                      data.range.to ? fmtDate(data.range.to) : 'hoy'
                    }`}
                    sx={{ height: 18, '& .MuiChip-label': { px: 0.6, fontSize: '0.65rem' } }}
                  />
                )}
                {(categoryLabels ?? []).map((c) => (
                  <Chip
                    key={c}
                    size="small"
                    variant="outlined"
                    color="primary"
                    label={c}
                    sx={{ height: 18, '& .MuiChip-label': { px: 0.6, fontSize: '0.65rem' } }}
                  />
                ))}
                {(data.filters?.hiddenByCategory ?? 0) > 0 && (
                  <Typography variant="caption"
color="text.secondary">
                    {`· ${data.filters.hiddenByCategory} factura${
                      data.filters.hiddenByCategory === 1 ? '' : 's'
                    } sin esas categorías quedan fuera`}
                  </Typography>
                )}
              </Stack>
            </Alert>
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
                  <ToggleButton value="all">
                    {(data.range?.ranged || (data.filters?.items?.length ?? 0) > 0)
                      ? `Del filtro (${data.totalInvoices})`
                      : `Todas (${data.totalInvoices})`}
                  </ToggleButton>
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
                        {showFiltered && (
                          <TableCell align="right"
sx={{ color: 'primary.main' }}>
                            De filtro
                          </TableCell>
                        )}
                        <TableCell align="right"
sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                          Pagado
                        </TableCell>
                        <TableCell align="right">Debe</TableCell>
                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                          Categoría
                        </TableCell>
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
                          {showFiltered && (
                            <TableCell align="right">
                              <Typography variant="body2"
fontWeight={600}
color="primary.main">
                                {money(i.filtered?.total ?? 0)}
                              </Typography>
                            </TableCell>
                          )}
                          <TableCell align="right"
sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
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
                          <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                            <Stack direction="row"
spacing={0.5}
flexWrap="wrap"
useFlexGap>
                              {(i.categories ?? []).map((c) => (
                                <Chip
                                  key={c}
                                  size="small"
                                  variant="outlined"
                                  label={c.includes(':') ? c.split(':')[1] : c}
                                  sx={{ height: 18, '& .MuiChip-label': { px: 0.6, fontSize: '0.62rem' } }}
                                />
                              ))}
                            </Stack>
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

              {showFiltered && filteredTotals && (
                <Stack
                  direction="row"
                  justifyContent="flex-end"
                  alignItems="baseline"
                  spacing={1}
                  sx={{ mt: 1.5, pt: 1.5, borderTop: 1, borderColor: 'divider' }}
                >
                  <Typography variant="caption"
color="text.secondary">
                    De las categorías filtradas:
                  </Typography>
                  <Typography variant="subtitle2"
fontWeight={700}
color="primary.main">
                    {money(filteredTotals.balance)}
                  </Typography>
                  <Typography variant="caption"
color="text.secondary">
                    {`abierto · ${money(filteredTotals.total)} facturado`}
                  </Typography>
                </Stack>
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
