'use client';

import type { QboBalanceRow } from '@/services/qbo.service';
import LinkOffRoundedIcon from '@mui/icons-material/LinkOffRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import {
  Box,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
  Typography,
  alpha,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { memo, useState } from 'react';
import { AgingBar } from './aging-bar';
import { ReceivablesCards } from './receivables-cards';
import { DRIFT_EPSILON, daysSince, fmtDate, money, overdueColor } from './constants';

type Props = {
  rows: QboBalanceRow[];
  onSelect?: (row: QboBalanceRow) => void;
};

/** Oculta columnas secundarias bajo el breakpoint dado. */
const hideBelow = (bp: 'md' | 'lg' | 'xl') => ({
  display: { xs: 'none', [bp]: 'table-cell' },
});

/**
 * Anchos fijos y ajustados. Antes sumaban más que el ancho del card y la última
 * columna quedaba cortada contra el borde; ahora el total cabe y el sobrante lo
 * absorbe la columna de tienda.
 */
const W = {
  debe: 96,
  facturas: 56,
  atraso: 66,
  aging: 96,
  lastPayment: 116,
  drift: 78,
} as const;

const cell = { py: 0.75, px: 1 } as const;

const Row = memo(function Row({
  row,
  onSelect,
}: {
  row: QboBalanceRow;
  onSelect?: (row: QboBalanceRow) => void;
}) {
  const theme = useTheme();
  const since = daysSince(row.lastPayment?.date);
  const hasDrift = row.drift !== null && Math.abs(row.drift) >= DRIFT_EPSILON;

  return (
    <TableRow
      hover
      onClick={onSelect ? () => onSelect(row) : undefined}
      sx={{ cursor: onSelect ? 'pointer' : 'default', '& td': { borderColor: 'divider' } }}
    >
      <TableCell sx={{ ...cell, minWidth: 180 }}>
        <Stack direction="row"
alignItems="center"
spacing={0.75}>
          <Box minWidth={0}
flex={1}>
            <Typography variant="body2"
fontWeight={600}
noWrap
lineHeight={1.35}>
              {row.storeName || row.qboName}
            </Typography>
            {/* El nombre del contador solo cuando difiere del de Mongo: repetirlo
                doblaba la altura de cada fila sin aportar nada. */}
            {row.storeName && row.storeName !== row.qboName && (
              <Typography
                variant="caption"
                color="text.secondary"
                noWrap
                sx={{ display: 'block', fontSize: '0.68rem', lineHeight: 1.3 }}
              >
                {row.qboName}
              </Typography>
            )}
          </Box>
          {!row.linked && (
            <Tooltip title="Este cliente de QuickBooks no está vinculado a ninguna tienda">
              <LinkOffRoundedIcon sx={{ fontSize: 15, color: 'error.main', flexShrink: 0 }} />
            </Tooltip>
          )}
          {row.linked && row.storeActive === false && (
            <Tooltip title="La tienda está dada de baja. Si tiene saldo, sigue siendo cobrable.">
              <StorefrontRoundedIcon sx={{ fontSize: 15, color: 'warning.main', flexShrink: 0 }} />
            </Tooltip>
          )}
        </Stack>
      </TableCell>

      <TableCell align="right"
sx={{ ...cell, width: W.debe, whiteSpace: 'nowrap' }}>
        <Typography
          variant="body2"
          fontWeight={700}
          color={row.balance > 0 ? 'text.primary' : 'text.secondary'}
        >
          {money(row.balance)}
        </Typography>
      </TableCell>

      <TableCell align="center"
sx={{ ...cell, ...hideBelow('lg'), width: W.facturas }}>
        <Typography variant="body2"
color="text.secondary">
          {row.openInvoices || '—'}
        </Typography>
      </TableCell>

      <TableCell align="center"
sx={{ ...cell, width: W.atraso }}>
        {row.balance > 0 ? (
          <Chip
            size="small"
            label={row.maxDaysOverdue > 0 ? `${row.maxDaysOverdue} d` : 'Al día'}
            color={overdueColor(row.maxDaysOverdue)}
            variant="outlined"
            sx={{ height: 20, '& .MuiChip-label': { px: 0.75, fontSize: '0.68rem' } }}
          />
        ) : (
          <Typography variant="body2"
color="text.secondary">
            —
          </Typography>
        )}
      </TableCell>

      <TableCell sx={{ ...cell, ...hideBelow('lg'), width: W.aging }}>
        <AgingBar aging={row.aging}
height={6} />
      </TableCell>

      <TableCell sx={{ ...cell, ...hideBelow('md'), width: W.lastPayment }}>
        {row.lastPayment ? (
          <Box sx={{ whiteSpace: 'nowrap' }}>
            <Typography variant="body2"
fontWeight={600}
lineHeight={1.3}>
              {money(row.lastPayment.amount)}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontSize: '0.68rem', lineHeight: 1.3 }}
            >
              {fmtDate(row.lastPayment.date)}
              {since !== null && (
                <Box component="span"
sx={{ opacity: 0.7 }}>{` · ${since}d`}</Box>
              )}
            </Typography>
          </Box>
        ) : (
          <Typography variant="caption"
color="text.secondary">
            Sin pagos
          </Typography>
        )}
      </TableCell>

      <TableCell align="right"
sx={{ ...cell, ...hideBelow('xl'), width: W.drift }}>
        {hasDrift ? (
          <Tooltip
            title={`QuickBooks ${money(row.balance)} · Mongo ${money(row.mongoPending)}`}
            arrow
          >
            <Chip
              size="small"
              label={`${row.drift! > 0 ? '+' : ''}${money(row.drift)}`}
              sx={{
                height: 20,
                bgcolor: alpha(theme.palette.warning.main, 0.12),
                color: 'warning.dark',
                '& .MuiChip-label': { px: 0.75, fontSize: '0.68rem', fontWeight: 600 },
              }}
            />
          </Tooltip>
        ) : (
          <Typography variant="caption"
color="text.secondary">
            {row.mongoPending === null ? '—' : 'OK'}
          </Typography>
        )}
      </TableCell>
    </TableRow>
  );
});

export function ReceivablesTable({ rows, onSelect }: Props) {
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(25);
  const isMobile = useMediaQuery((t: any) => t.breakpoints.down('md'));

  // Paginación en cliente: son ~270 filas, no vale un endpoint paginado.
  const visible = rows.slice(page * perPage, page * perPage + perPage);

  const pager = (
    <TablePagination
      component="div"
      count={rows.length}
      page={page}
      onPageChange={(_, p) => setPage(p)}
      rowsPerPage={perPage}
      onRowsPerPageChange={(e) => {
        setPerPage(Number(e.target.value));
        setPage(0);
      }}
      rowsPerPageOptions={[25, 50, 100]}
      labelRowsPerPage="Por página"
      sx={{
        '& .MuiTablePagination-toolbar': { minHeight: 44, px: 0 },
        '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
          fontSize: '0.78rem',
        },
      }}
    />
  );

  // Abajo de md se cambia de componente: siete columnas en un teléfono obligan a
  // scrollear en horizontal para leer una sola fila.
  if (isMobile) {
    return (
      <>
        <ReceivablesCards rows={visible}
onSelect={onSelect} />
        {rows.length > perPage && pager}
      </>
    );
  }

  if (!rows.length) {
    return (
      <Box py={6}
textAlign="center">
        <Typography color="text.secondary">Ninguna tienda coincide con el filtro.</Typography>
      </Box>
    );
  }

  return (
    <>
      <TableContainer sx={{ overflowX: 'auto' }}>
        {/* tableLayout fixed: sin esto el navegador reparte el ancho según el
            contenido y las columnas se mueven al cambiar de filtro. */}
        <Table size="small"
stickyHeader
sx={{ tableLayout: 'fixed', minWidth: 560 }}>
          <TableHead>
            <TableRow
              sx={{
                '& th': {
                  ...cell,
                  bgcolor: 'background.paper',
                  fontWeight: 600,
                  fontSize: '0.68rem',
                  textTransform: 'uppercase',
                  letterSpacing: 0.3,
                  color: 'text.secondary',
                  borderColor: 'divider',
                  whiteSpace: 'nowrap',
                },
              }}
            >
              <TableCell sx={{ minWidth: 180 }}>Tienda</TableCell>
              <TableCell align="right"
sx={{ width: W.debe }}>Debe</TableCell>
              <TableCell align="center"
sx={{ ...hideBelow('lg'), width: W.facturas }}>
                Fact.
              </TableCell>
              <TableCell align="center"
sx={{ width: W.atraso }}>Atraso</TableCell>
              <TableCell sx={{ ...hideBelow('lg'), width: W.aging }}>Antigüedad</TableCell>
              <TableCell sx={{ ...hideBelow('md'), width: W.lastPayment }}>Último pago</TableCell>
              <TableCell align="right"
sx={{ ...hideBelow('xl'), width: W.drift }}>
                vs. Mongo
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visible.map((r) => (
              <Row key={r.qboCustomerId}
row={r}
onSelect={onSelect} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {pager}
    </>
  );
}
