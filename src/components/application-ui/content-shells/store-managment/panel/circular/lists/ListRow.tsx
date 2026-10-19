'use client';

import type { AdminShoppingList } from '@/services/shopping-lists.service';
import { Button, Chip, Stack, TableCell, TableRow, Tooltip, Typography } from '@mui/material';
import { memo } from 'react';
import { cell, fmtDate, statusChip } from '../shared';

export type ListRowActions = {
  onOpen: (l: AdminShoppingList) => void;
  onValidate: (qrCode: string) => void;
  onExtend: (qrCode: string) => void;
  onReopen: (qrCode: string) => void;
};

type Props = ListRowActions & {
  list: AdminShoppingList;
  validating: boolean;
  extending: boolean;
  reopening: boolean;
};

/** Una lista de cliente. Clic en la fila = ver productos; las acciones no abren el detalle. */
function ListRow({
  list: l,
  validating,
  extending,
  reopening,
  onOpen,
  onValidate,
  onExtend,
  onReopen,
}: Props) {
  return (
    <TableRow
      hover
      sx={{ cursor: 'pointer' }}
      onClick={() => onOpen(l)}
    >
      <TableCell sx={{ ...cell, fontFamily: 'monospace' }}>{l.qrCode}</TableCell>
      <TableCell sx={cell}>
        <Typography
          variant="body2"
          fontWeight={600}
        >
          {l.customerName || '—'}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontSize: 12 }}
        >
          {l.customerPhone}
        </Typography>
      </TableCell>
      <TableCell
        sx={cell}
        align="right"
      >
        {l.totalItems}
      </TableCell>
      <TableCell
        sx={cell}
        align="right"
      >
        {l.pointsAwarded || '—'}
      </TableCell>
      <TableCell sx={cell}>
        <Chip
          size="small"
          {...statusChip(l.status)}
        />
      </TableCell>
      <TableCell sx={cell}>{fmtDate(l.createdAt)}</TableCell>
      <TableCell
        sx={cell}
        align="right"
        onClick={(e) => e.stopPropagation()}
      >
        <Stack
          direction="row"
          justifyContent="flex-end"
          gap={0.5}
        >
          {l.status !== 'validated' && (
            <Tooltip title="Validar todos los productos y acreditar puntos">
              <span>
                <Button
                  size="small"
                  onClick={() => onValidate(l.qrCode)}
                  disabled={validating}
                >
                  Validar
                </Button>
              </span>
            </Tooltip>
          )}
          {l.status === 'expired' && (
            <Button
              size="small"
              color="inherit"
              onClick={() => onExtend(l.qrCode)}
              disabled={extending}
            >
              +24h
            </Button>
          )}
          {l.status === 'validated' && (
            <Button
              size="small"
              color="warning"
              onClick={() => onReopen(l.qrCode)}
              disabled={reopening}
            >
              Reabrir
            </Button>
          )}
        </Stack>
      </TableCell>
    </TableRow>
  );
}

export default memo(ListRow);
