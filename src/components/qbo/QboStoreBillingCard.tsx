'use client';

import {
  daysSince,
  fmtDate,
  money,
  overdueColor,
} from '@/components/application-ui/content-shells/qbo-receivables/constants';
import { AgingBar } from '@/components/application-ui/content-shells/qbo-receivables/aging-bar';
import { useQboStoreDetail } from '@hooks/fetching/qbo/useQbo';
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import {
  Alert,
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Collapse,
  Divider,
  IconButton,
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

type Props = { storeId: string };

/**
 * Cartera de la tienda según QuickBooks, para la pestaña de facturación del panel.
 *
 * Complementa —no reemplaza— las facturas de Mongo que ya muestra el panel:
 * el contador emite cargos a mano (Design Fee, Merchant Set-Up) que el pipeline
 * nunca vio, y esos también son deuda.
 */
export function QboStoreBillingCard({ storeId }: Props) {
  const { data, isLoading, isError, error } = useQboStoreDetail(storeId);
  const [openInvoices, setOpenInvoices] = useState(false);

  if (isLoading) {
    return <Skeleton variant="rounded"
height={220}
sx={{ borderRadius: 2 }} />;
  }

  if (isError) {
    return (
      <Alert severity="warning">
        {(error as Error)?.message || 'No se pudo leer QuickBooks.'}
      </Alert>
    );
  }

  if (!data || !data.linked) {
    return (
      <Alert severity="info">
        {data && 'reason' in data && data.reason === 'not_linked'
          ? 'Esta tienda no está vinculada a un cliente de QuickBooks. Vincúlala desde la cartera para ver su saldo real.'
          : 'Sin datos de QuickBooks para esta tienda.'}
      </Alert>
    );
  }

  const since = daysSince(data.lastPayment?.date);
  const open = data.invoices.filter((i) => i.balance > 0);

  return (
    <Card>
      <CardHeader
        avatar={<AccountBalanceRoundedIcon color="primary" />}
        title="Cartera en QuickBooks"
        subheader="Saldo real según los libros del contador"
        titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
        action={
          <Chip
            size="small"
            label={data.maxDaysOverdue > 0 ? `${data.maxDaysOverdue} días de atraso` : 'Al día'}
            color={overdueColor(data.maxDaysOverdue)}
            variant="outlined"
            sx={{ mt: 1, mr: 1 }}
          />
        }
      />
      <CardContent sx={{ pt: 0 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          divider={<Divider orientation="vertical"
flexItem />}
          spacing={2.5}
          sx={{ mb: 2.5 }}
        >
          <Box flex={1}>
            <Typography variant="caption"
color="text.secondary"
fontWeight={600}>
              DEBE
            </Typography>
            <Typography variant="h3"
fontWeight={700}>
              {money(data.balance)}
            </Typography>
            <Typography variant="caption"
color="text.secondary">
              {`${data.openInvoices} factura${data.openInvoices === 1 ? '' : 's'} abierta${
                data.openInvoices === 1 ? '' : 's'
              }`}
            </Typography>
          </Box>

          <Box flex={1}>
            <Typography variant="caption"
color="text.secondary"
fontWeight={600}>
              ÚLTIMO PAGO
            </Typography>
            {data.lastPayment ? (
              <>
                <Typography variant="h3"
fontWeight={700}>
                  {money(data.lastPayment.amount)}
                </Typography>
                <Typography variant="caption"
color="text.secondary">
                  {`${fmtDate(data.lastPayment.date)}${since !== null ? ` · hace ${since} días` : ''}`}
                </Typography>
              </>
            ) : (
              <>
                <Typography variant="h3"
fontWeight={700}
color="text.secondary">
                  —
                </Typography>
                <Typography variant="caption"
color="text.secondary">
                  Sin pagos registrados
                </Typography>
              </>
            )}
          </Box>
        </Stack>

        <Box sx={{ mb: 1 }}>
          <Typography variant="caption"
color="text.secondary"
fontWeight={600}>
            ANTIGÜEDAD
          </Typography>
        </Box>
        <AgingBar aging={data.aging}
showLegend
height={10} />

        {open.length > 0 && (
          <>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ mt: 2.5, cursor: 'pointer' }}
              onClick={() => setOpenInvoices((v) => !v)}
            >
              <Typography variant="subtitle2"
fontWeight={600}>
                {`Facturas abiertas (${open.length})`}
              </Typography>
              <IconButton size="small">
                <ExpandMoreRoundedIcon
                  fontSize="small"
                  sx={{
                    transform: openInvoices ? 'rotate(180deg)' : 'none',
                    transition: 'transform .2s',
                  }}
                />
              </IconButton>
            </Stack>

            <Collapse in={openInvoices}>
              <Table size="small"
sx={{ mt: 1 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Nº</TableCell>
                    <TableCell>Emitida</TableCell>
                    <TableCell>Vence</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell align="right">Debe</TableCell>
                    <TableCell align="center">Atraso</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {open.map((i) => (
                    <TableRow key={i.qboId}>
                      <TableCell>{i.docNumber || i.qboId}</TableCell>
                      <TableCell>{fmtDate(i.txnDate)}</TableCell>
                      <TableCell>{fmtDate(i.dueDate)}</TableCell>
                      <TableCell align="right">{money(i.total)}</TableCell>
                      <TableCell align="right">
                        <Typography variant="body2"
fontWeight={600}>
                          {money(i.balance)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          size="small"
                          label={i.daysOverdue > 0 ? `${i.daysOverdue} d` : 'Al día'}
                          color={overdueColor(i.daysOverdue)}
                          variant="outlined"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Collapse>
          </>
        )}

        {data.payments.length > 0 && (
          <Box sx={{ mt: 2.5 }}>
            <Typography variant="subtitle2"
fontWeight={600}
sx={{ mb: 1 }}>
              Últimos pagos
            </Typography>
            <Stack spacing={0.75}>
              {data.payments.slice(0, 5).map((p) => (
                <Stack
                  key={p.qboId}
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography variant="body2"
color="text.secondary">
                    {fmtDate(p.date)}
                  </Typography>
                  <Typography variant="body2"
fontWeight={600}>
                    {money(p.amount)}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default QboStoreBillingCard;
