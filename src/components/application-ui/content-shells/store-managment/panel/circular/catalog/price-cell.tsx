'use client';

/** Celda de precio editable (oferta / regular / ahorro). Con precio esperando fecha, edita el
 *  FUTURO (pending) y el de hoy se muestra abajo, sólo lectura. Sin pendiente, edita el de hoy
 *  como siempre. */
import type { StoreProduct } from '@/services/circular.service';
import { Button, TableCell, TextField, Tooltip, Typography } from '@mui/material';
import { cell, fmtDate, regularFromPrice } from '../shared';
import type { PendingPatch, ProductPatch } from './constants';

type PriceField = 'price' | 'originalPrice' | 'savings';

export function PriceCell({
  p,
  field,
  label,
  onPatch,
  onPatchPending,
}: {
  p: StoreProduct;
  field: PriceField;
  /** Rótulo de la celda en vista angosta (data-label). */
  label: string;
  onPatch: (id: string, body: ProductPatch) => void;
  onPatchPending: (id: string, body: PendingPatch) => void;
}) {
  const pend = p.pending?.from ? p.pending : null;
  const today = p[field];
  const save = (v: string) => {
    if (pend) {
      // El precio de oferta futuro no se puede vaciar; regular y ahorro sí.
      if (field === 'price' && !v) return;
      if (v !== String(pend[field] ?? '')) onPatchPending(p._id, { [field]: v });
    } else if (v !== String(today ?? '')) {
      onPatch(
        p._id,
        field === 'originalPrice' && v ? { originalPrice: v, hasOffer: true } : { [field]: v }
      );
    }
  };
  // Sin regular: se estima con la misma regla del backend (+25%)
  const estimate =
    field === 'originalPrice' && !pend && !p.originalPrice?.trim() ? regularFromPrice(p.price) : null;

  return (
    <TableCell
      sx={cell}
      data-label={label}
    >
      <TextField
        key={pend ? `pend-${pend.from}` : 'today'}
        size="small"
        variant="standard"
        label={pend ? `Sale el ${fmtDate(pend.from)}` : undefined}
        color={pend ? 'warning' : undefined}
        focused={pend ? true : undefined}
        defaultValue={(pend ? pend[field] : today) ?? ''}
        fullWidth
        inputProps={{ 'aria-label': `${label} de ${p.name}` }}
        onBlur={(e) => save(e.target.value.trim())}
      />
      {pend && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ display: 'block', fontSize: 12, lineHeight: 1.2, mt: 0.25 }}
        >
          Hoy: {today?.trim() || '—'}
        </Typography>
      )}
      {estimate && (
        <Tooltip title={`Calcular: ${estimate} (oferta + 25%)`}>
          <Button
            size="small"
            sx={{ ml: 0.5, minWidth: 0, px: 0.75 }}
            onClick={() => onPatch(p._id, { originalPrice: estimate, hasOffer: true })}
          >
            +25%
          </Button>
        </Tooltip>
      )}
    </TableCell>
  );
}
