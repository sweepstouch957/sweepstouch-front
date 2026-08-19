'use client';

import type { QboBalanceRow } from '@/services/qbo.service';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import LinkOffRoundedIcon from '@mui/icons-material/LinkOffRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import {
  Box,
  Chip,
  Divider,
  Stack,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import { memo } from 'react';
import { AgingBar } from './aging-bar';
import { DRIFT_EPSILON, daysSince, fmtDate, money, overdueColor } from './constants';

type Props = {
  rows: QboBalanceRow[];
  onSelect?: (row: QboBalanceRow) => void;
};

/**
 * Vista de móvil. Una tabla de 7 columnas en un teléfono obliga a scrollear en
 * horizontal para leer una sola fila; acá cada tienda es una tarjeta y lo que se
 * consulta de pie —cuánto debe y cuánto lleva de atraso— queda a la vista sin
 * mover nada.
 */
const Card = memo(function Card({
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
    <Box
      onClick={onSelect ? () => onSelect(row) : undefined}
      sx={{
        px: 2,
        py: 1.5,
        cursor: onSelect ? 'pointer' : 'default',
        '&:active': { bgcolor: 'action.hover' },
      }}
    >
      <Stack direction="row"
alignItems="flex-start"
spacing={1}>
        <Box flex={1}
minWidth={0}>
          {/* Nombre + banderas de estado */}
          <Stack direction="row"
alignItems="center"
spacing={0.75}>
            <Typography variant="body2"
fontWeight={600}
noWrap>
              {row.storeName || row.qboName}
            </Typography>
            {!row.linked && (
              <Tooltip title="Sin tienda vinculada">
                <LinkOffRoundedIcon sx={{ fontSize: 15, color: 'error.main', flexShrink: 0 }} />
              </Tooltip>
            )}
            {row.linked && row.storeActive === false && (
              <Tooltip title="Tienda dada de baja">
                <StorefrontRoundedIcon sx={{ fontSize: 15, color: 'warning.main', flexShrink: 0 }} />
              </Tooltip>
            )}
          </Stack>

          {/* Monto y atraso: lo que se consulta de pie */}
          <Stack direction="row"
alignItems="center"
spacing={1}
sx={{ mt: 0.5 }}>
            <Typography variant="h6"
fontWeight={700}
lineHeight={1.2}>
              {money(row.balance)}
            </Typography>
            {row.balance > 0 && (
              <Chip
                size="small"
                label={row.maxDaysOverdue > 0 ? `${row.maxDaysOverdue} d` : 'Al día'}
                color={overdueColor(row.maxDaysOverdue)}
                variant="outlined"
                sx={{ height: 20, '& .MuiChip-label': { px: 0.75, fontSize: '0.68rem' } }}
              />
            )}
            {hasDrift && (
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
            )}
          </Stack>

          <Box sx={{ mt: 0.75, mb: 0.75 }}>
            <AgingBar aging={row.aging}
height={5} />
          </Box>

          <Typography variant="caption"
color="text.secondary"
noWrap
sx={{ display: 'block' }}>
            {`${row.openInvoices} fact.`}
            {row.lastPayment
              ? ` · últ. pago ${money(row.lastPayment.amount)} ${fmtDate(row.lastPayment.date)}${
                  since !== null ? ` (${since} d)` : ''
                }`
              : ' · sin pagos'}
          </Typography>
        </Box>

        {onSelect && (
          <ChevronRightRoundedIcon sx={{ fontSize: 18, color: 'text.disabled', mt: 0.5 }} />
        )}
      </Stack>
    </Box>
  );
});

export function ReceivablesCards({ rows, onSelect }: Props) {
  if (!rows.length) {
    return (
      <Box py={5}
textAlign="center">
        <Typography color="text.secondary"
variant="body2">
          Ninguna tienda coincide con el filtro.
        </Typography>
      </Box>
    );
  }

  return (
    <Stack divider={<Divider />}
sx={{ mx: -2 }}>
      {rows.map((r) => (
        <Card key={r.qboCustomerId}
row={r}
onSelect={onSelect} />
      ))}
    </Stack>
  );
}

export default ReceivablesCards;
