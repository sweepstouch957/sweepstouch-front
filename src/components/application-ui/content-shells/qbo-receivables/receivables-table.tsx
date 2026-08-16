'use client';

import type { QboBalanceRow } from '@/services/qbo.service';
import LinkOffRoundedIcon from '@mui/icons-material/LinkOffRounded';
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
  useTheme,
} from '@mui/material';
import { memo, useState } from 'react';
import useMediaQuery from '@mui/material/useMediaQuery';
import { AgingBar } from './aging-bar';
import { DRIFT_EPSILON, daysSince, fmtDate, money, overdueColor } from './constants';

type Props = {
  rows: QboBalanceRow[];
  onSelect?: (row: QboBalanceRow) => void;
};

/** Oculta columnas secundarias bajo el breakpoint dado. */
const hideBelow = (bp: 'sm' | 'md' | 'lg') => ({
  display: { xs: 'none', [bp]: 'table-cell' },
});

const Row = memo(function Row({
  row,
  onSelect,
  compact,
}: {
  row: QboBalanceRow;
  onSelect?: (row: QboBalanceRow) => void;
  compact: boolean;
}) {
  const theme = useTheme();
  const sinceLastPayment = daysSince(row.lastPayment?.date);
  const hasDrift = row.drift !== null && Math.abs(row.drift) >= DRIFT_EPSILON;

  return (
    <TableRow
      hover
      onClick={onSelect ? () => onSelect(row) : undefined}
      sx={{
        cursor: onSelect ? 'pointer' : 'default',
        '& td': { borderColor: 'divider' },
      }}
    >
      <TableCell>
        <Stack direction="row"
alignItems="center"
spacing={1}>
          <Box minWidth={0}>
            <Typography variant="body2"
fontWeight={600}
noWrap>
              {row.storeName || row.qboName}
            </Typography>
            {/* El nombre en QBO manda para el contador; si difiere del de Mongo, mostrarlo */}
            {row.storeName && row.storeName !== row.qboName && (
              <Typography variant="caption"
color="text.secondary"
noWrap>
                {`QBO: ${row.qboName}`}
              </Typography>
            )}
          </Box>
          {!row.linked && (
            <Tooltip title="Este cliente de QuickBooks no está vinculado a ninguna tienda">
              <LinkOffRoundedIcon fontSize="small"
color="error" />
            </Tooltip>
          )}
        </Stack>

        {compact && row.lastPayment && (
          <Typography variant="caption"
color="text.secondary">
            {`Últ. pago ${money(row.lastPayment.amount)} · ${fmtDate(row.lastPayment.date)}`}
          </Typography>
        )}
      </TableCell>

      <TableCell align="right">
        <Typography
          variant="body2"
          fontWeight={700}
          color={row.balance > 0 ? 'text.primary' : 'text.secondary'}
        >
          {money(row.balance)}
        </Typography>
      </TableCell>

      <TableCell align="center"
sx={hideBelow('md')}>
        <Typography variant="body2"
color="text.secondary">
          {row.openInvoices || '—'}
        </Typography>
      </TableCell>

      <TableCell align="center">
        {row.balance > 0 ? (
          <Chip
            size="small"
            label={row.maxDaysOverdue > 0 ? `${row.maxDaysOverdue} d` : 'Al día'}
            color={overdueColor(row.maxDaysOverdue)}
            variant="outlined"
          />
        ) : (
          <Typography variant="body2"
color="text.secondary">
            —
          </Typography>
        )}
      </TableCell>

      <TableCell sx={{ minWidth: 130, ...hideBelow('lg') }}>
        <AgingBar aging={row.aging} />
      </TableCell>

      <TableCell sx={hideBelow('md')}>
        {row.lastPayment ? (
          <Box>
            <Typography variant="body2"
fontWeight={600}>
              {money(row.lastPayment.amount)}
            </Typography>
            <Typography variant="caption"
color="text.secondary">
              {`${fmtDate(row.lastPayment.date)}${
                sinceLastPayment !== null ? ` · hace ${sinceLastPayment} d` : ''
              }`}
            </Typography>
          </Box>
        ) : (
          <Typography variant="body2"
color="text.secondary">
            Sin pagos
          </Typography>
        )}
      </TableCell>

      <TableCell align="right"
sx={hideBelow('lg')}>
        {hasDrift ? (
          <Tooltip
            title={`QuickBooks ${money(row.balance)} · Mongo ${money(row.mongoPending)}`}
            arrow
          >
            <Chip
              size="small"
              label={`${row.drift! > 0 ? '+' : ''}${money(row.drift)}`}
              sx={{
                bgcolor: alpha(theme.palette.warning.main, 0.12),
                color: 'warning.dark',
                fontWeight: 600,
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
  const compact = useMediaQuery((t: any) => t.breakpoints.down('md'));

  // Paginación en cliente: son ~200 tiendas, no vale un endpoint paginado.
  const visible = rows.slice(page * perPage, page * perPage + perPage);

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
      <TableContainer>
        <Table size="small"
stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Tienda</TableCell>
              <TableCell align="right">Debe</TableCell>
              <TableCell align="center"
sx={hideBelow('md')}>Facturas</TableCell>
              <TableCell align="center">Atraso</TableCell>
              <TableCell sx={hideBelow('lg')}>Antigüedad</TableCell>
              <TableCell sx={hideBelow('md')}>Último pago</TableCell>
              <TableCell align="right"
sx={hideBelow('lg')}>vs. Mongo</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visible.map((r) => (
              <Row key={r.qboCustomerId}
row={r}
onSelect={onSelect}
compact={compact} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>

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
      />
    </>
  );
}
