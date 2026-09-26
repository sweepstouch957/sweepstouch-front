'use client';

/** Compras por recibo: métricas por cliente y productos más comprados. */
import { shoppingListsQK, shoppingListsService } from '@/services/shopping-lists.service';
import {
  Alert,
  Box,
  Chip,
  Grid,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { cell, fmtDate, money } from './shared';
import { KpiSkeleton, ListRowsSkeleton } from './skeletons';

export default function PurchasesSection({ storeSlug }: { storeSlug: string }) {
  const purchases = useQuery({
    queryKey: shoppingListsQK.purchases(storeSlug),
    queryFn: () => shoppingListsService.purchases(storeSlug),
    enabled: !!storeSlug,
  });

  if (purchases.isLoading) {
    return (
      <Stack spacing={2}>
        <KpiSkeleton />
        <ListRowsSkeleton rows={6} />
      </Stack>
    );
  }
  const d = purchases.data;
  if (!d) return <Alert severity="warning">No se pudieron leer las compras.</Alert>;

  return (
    <Stack spacing={2}>
      <Grid
        container
        spacing={1.5}
      >
        {(
          [
            ['Recibos escaneados', d.totals.receipts],
            ['Validados', d.totals.success],
            ['Rechazados', d.totals.failed],
            ['Puntos acreditados', d.totals.pointsAwarded],
            ['Gasto detectado', money(d.totals.spend)],
          ] as const
        ).map(([label, value]) => (
          <Grid
            item
            xs={6}
            sm={2.4}
            key={label}
          >
            <Paper
              variant="outlined"
              sx={{ p: 1.5, borderRadius: 2, textAlign: 'center' }}
            >
              <Typography
                variant="h6"
                fontWeight={800}
              >
                {value}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
              >
                {label}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Typography
        variant="subtitle2"
        fontWeight={700}
      >
        Qué compró cada cliente
        <Typography
          component="span"
          variant="caption"
          color="text.secondary"
          sx={{ ml: 1 }}
        >
          tenga o no puntos, esté o no en la base
        </Typography>
      </Typography>
      <Box sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={cell}>Cliente</TableCell>
              <TableCell
                sx={cell}
                align="right"
              >
                Recibos
              </TableCell>
              <TableCell
                sx={cell}
                align="right"
              >
                Productos
              </TableCell>
              <TableCell
                sx={cell}
                align="right"
              >
                Puntos
              </TableCell>
              <TableCell
                sx={cell}
                align="right"
              >
                Gasto
              </TableCell>
              <TableCell sx={cell}>Último recibo</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {d.customers.map((c) => (
              <TableRow
                key={c.customerId}
                hover
              >
                <TableCell sx={cell}>
                  <Typography
                    variant="body2"
                    fontWeight={600}
                  >
                    {c.customerName || c.customerPhone || c.customerId}
                  </Typography>
                  {!c.inDatabase && (
                    <Chip
                      size="small"
                      label="fuera de la base"
                      sx={{ height: 18, fontSize: 11 }}
                    />
                  )}
                </TableCell>
                <TableCell
                  sx={cell}
                  align="right"
                >
                  {c.receipts}
                </TableCell>
                <TableCell
                  sx={cell}
                  align="right"
                >
                  {c.products}
                </TableCell>
                <TableCell
                  sx={cell}
                  align="right"
                >
                  {c.points}
                </TableCell>
                <TableCell
                  sx={cell}
                  align="right"
                >
                  {money(c.spend)}
                </TableCell>
                <TableCell sx={cell}>{fmtDate(c.lastReceiptAt)}</TableCell>
              </TableRow>
            ))}
            {!d.customers.length && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  sx={{ py: 3, textAlign: 'center' }}
                >
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Todavía no hay recibos escaneados.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Box>

      {d.topProducts.length > 0 && (
        <>
          <Typography
            variant="subtitle2"
            fontWeight={700}
          >
            Productos más comprados (según recibos)
          </Typography>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={cell}>Producto</TableCell>
                  <TableCell
                    sx={cell}
                    align="right"
                  >
                    Unidades
                  </TableCell>
                  <TableCell
                    sx={cell}
                    align="right"
                  >
                    Recibos
                  </TableCell>
                  <TableCell
                    sx={cell}
                    align="right"
                  >
                    En oferta
                  </TableCell>
                  <TableCell
                    sx={cell}
                    align="right"
                  >
                    Ingreso
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {d.topProducts.map((p) => (
                  <TableRow
                    key={p.name}
                    hover
                  >
                    <TableCell sx={{ ...cell, maxWidth: 280 }}>
                      <Typography
                        variant="body2"
                        noWrap
                      >
                        {p.name}
                      </Typography>
                    </TableCell>
                    <TableCell
                      sx={cell}
                      align="right"
                    >
                      {p.quantity}
                    </TableCell>
                    <TableCell
                      sx={cell}
                      align="right"
                    >
                      {p.receipts}
                    </TableCell>
                    <TableCell
                      sx={cell}
                      align="right"
                    >
                      {p.matchedReceipts}
                    </TableCell>
                    <TableCell
                      sx={cell}
                      align="right"
                    >
                      {money(p.revenue)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </>
      )}
    </Stack>
  );
}
