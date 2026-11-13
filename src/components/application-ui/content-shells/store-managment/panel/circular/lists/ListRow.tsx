'use client';

import type { AdminShoppingList } from '@/services/shopping-lists.service';
import { Button, Chip, Stack, TableCell, TableRow, Tooltip, Typography } from '@mui/material';
import { memo } from 'react';
import { cell, fmtDate, statusChip } from '../shared';

export type ListRowActions = {
  onOpen: (l: AdminShoppingList) => void;
  onValidate: (l: AdminShoppingList) => void;
  onExtend: (l: AdminShoppingList) => void;
  onReopen: (l: AdminShoppingList) => void;
};

type Props = ListRowActions & { list: AdminShoppingList; extending: boolean };

/** "vence en 5 h" / "venció hace 2 d": la fecha sola obligaba a hacer la cuenta. */
export function expiryText(iso?: string | null) {
  if (!iso) return '—';
  const diff = new Date(iso).getTime() - Date.now();
  const abs = Math.abs(diff);
  const n = abs < 3600_000 ? `${Math.max(1, Math.round(abs / 60_000))} min` : abs < 86_400_000 ? `${Math.round(abs / 3600_000)} h` : `${Math.round(abs / 86_400_000)} d`;
  return diff >= 0 ? `en ${n}` : `hace ${n}`;
}

/** Una lista de cliente. Clic (o Enter) en la fila = ver productos; las acciones no abren el detalle. */
function ListRow({ list: l, extending, onOpen, onValidate, onExtend, onReopen }: Props) {
  const expired = l.status !== 'validated' && !!l.expiresAt && new Date(l.expiresAt) <= new Date();
  return (
    <TableRow
      hover
      tabIndex={0}
      sx={{ cursor: 'pointer', '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: -2 } }}
      onClick={() => onOpen(l)}
      onKeyDown={(e) => e.key === 'Enter' && onOpen(l)}
    >
      <TableCell sx={cell}>
        <Typography
          variant="body2"
          fontWeight={700}
        >
          {l.customerName || 'Sin nombre'}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontSize: 12 }}
        >
          {l.customerPhone || '—'} · <span style={{ fontFamily: 'monospace' }}>{l.qrCode}</span>
        </Typography>
      </TableCell>
      <TableCell sx={cell}>
        <Chip
          size="small"
          {...statusChip(l.status)}
        />
      </TableCell>
      <TableCell
        sx={cell}
        align="right"
      >
        {l.status === 'validated' && l.validatedItems?.length
          ? `${l.validatedItems.length} / ${l.totalItems}`
          : l.totalItems}
      </TableCell>
      <TableCell
        sx={cell}
        align="right"
      >
        {l.pointsAwarded || '—'}
      </TableCell>
      <TableCell sx={cell}>{fmtDate(l.createdAt)}</TableCell>
      <TableCell sx={cell}>
        {l.status === 'validated' ? (
          '—'
        ) : (
          <Tooltip title={fmtDate(l.expiresAt)}>
            <Typography
              component="span"
              variant="body2"
              color={expired ? 'error.main' : 'text.primary'}
              fontWeight={expired ? 700 : 400}
            >
              {expired ? 'Venció ' : 'Vence '}
              {expiryText(l.expiresAt)}
            </Typography>
          </Tooltip>
        )}
      </TableCell>
      <TableCell
        sx={cell}
        align="right"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <Stack
          direction="row"
          justifyContent="flex-end"
          gap={0.5}
        >
          {l.status !== 'validated' && (
            <Tooltip title="Validar todos los productos y acreditar puntos">
              <Button
                size="small"
                variant="outlined"
                onClick={() => onValidate(l)}
              >
                Validar
              </Button>
            </Tooltip>
          )}
          {expired && (
            <Tooltip title="Le da 24 horas más desde ahora">
              <span>
                <Button
                  size="small"
                  color="inherit"
                  onClick={() => onExtend(l)}
                  disabled={extending}
                >
                  {extending ? '…' : '+24 h'}
                </Button>
              </span>
            </Tooltip>
          )}
          {l.status === 'validated' && (
            <Button
              size="small"
              color="warning"
              onClick={() => onReopen(l)}
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
