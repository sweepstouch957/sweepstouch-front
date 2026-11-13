'use client';

/**
 * Detalle de una lista: quién, cuándo vence y qué lleva. Desde acá se valida entera o
 * sólo lo que el cliente sí compró (casillas), se corre la vigencia a la fecha que haga
 * falta y se reabre una mal validada.
 */
import type { AdminShoppingList } from '@/services/shopping-lists.service';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { fmtDate, money, parsePriceNum, statusChip } from '../shared';
import { expiryText } from './ListRow';

/** ISO → valor de <input type="datetime-local"> en hora local. */
const toLocalInput = (iso?: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};

export default function ListDetailDialog({
  list,
  onClose,
  onValidate,
  onReopen,
  onExtend,
  onSetExpiry,
  savingExpiry,
}: {
  list: AdminShoppingList | null;
  onClose: () => void;
  onValidate: (l: AdminShoppingList, picked?: string[]) => void;
  onReopen: (l: AdminShoppingList) => void;
  onExtend: (l: AdminShoppingList) => void;
  onSetExpiry: (l: AdminShoppingList, expiresAtIso: string) => void;
  savingExpiry: boolean;
}) {
  const items = list?.items ?? [];
  const validated = list?.status === 'validated';
  const done = useMemo(
    () => new Set((list?.validatedItems ?? []).map((n) => n.toLowerCase())),
    [list?.validatedItems]
  );

  // Casillas: arrancan todas marcadas (lo normal es validar todo).
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [expiry, setExpiry] = useState('');
  useEffect(() => {
    setPicked(new Set((list?.items ?? []).map((it) => it.name)));
    setExpiry(toLocalInput(list?.expiresAt));
    // Sólo al cambiar de lista o cuando el servidor trae otra vigencia.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list?.qrCode, list?.expiresAt]);

  const toggle = (name: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });

  const total = items.reduce((sum, it) => sum + parsePriceNum(it.price) * (it.quantity || 1), 0);
  const expiryChanged = !!expiry && expiry !== toLocalInput(list?.expiresAt);
  const allPicked = picked.size === items.length;

  return (
    <Dialog
      open={!!list}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          gap={1.5}
        >
          <Box minWidth={0}>
            <Typography
              fontWeight={800}
              fontSize={18}
              noWrap
            >
              {list?.customerName || 'Sin nombre'}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
            >
              {list?.customerPhone || '—'} ·{' '}
              <span style={{ fontFamily: 'monospace' }}>{list?.qrCode}</span>
            </Typography>
          </Box>
          {list && (
            <Chip
              size="small"
              {...statusChip(list.status)}
            />
          )}
        </Stack>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{ p: 0 }}
      >
        {/* Fechas y vigencia editable */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          gap={2}
          sx={{ px: 2.5, py: 2 }}
        >
          <Box flex={1}>
            <Typography
              variant="caption"
              color="text.secondary"
            >
              Creada
            </Typography>
            <Typography variant="body2">{fmtDate(list?.createdAt)}</Typography>
            {validated && (
              <Typography
                variant="body2"
                color="success.main"
                fontWeight={600}
                sx={{ mt: 0.5 }}
              >
                Validada el {fmtDate(list?.validatedAt)} · +{list?.pointsAwarded || 0} pts
              </Typography>
            )}
          </Box>
          {!validated && (
            <Box flex={1.3}>
              <Stack
                direction="row"
                gap={1}
                alignItems="flex-start"
              >
                <TextField
                  size="small"
                  type="datetime-local"
                  label="Vence"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  helperText={list?.expiresAt ? `Hoy: ${expiryText(list.expiresAt)}` : undefined}
                  fullWidth
                />
                <Button
                  variant="outlined"
                  disabled={!expiryChanged || savingExpiry}
                  onClick={() => list && onSetExpiry(list, new Date(expiry).toISOString())}
                  sx={{ mt: 0.25, flexShrink: 0 }}
                >
                  {savingExpiry ? 'Guardando…' : 'Guardar'}
                </Button>
              </Stack>
            </Box>
          )}
        </Stack>
        <Divider />

        {/* Productos */}
        {items.length ? (
          <Stack divider={<Divider flexItem />}>
            {items.map((it, i) => {
              const wasDone = done.has(it.name.toLowerCase());
              return (
                <Stack
                  key={`${it.name}-${i}`}
                  component={validated ? 'div' : 'label'}
                  direction="row"
                  alignItems="center"
                  gap={1.25}
                  sx={{ px: 2.5, py: 1, cursor: validated ? 'default' : 'pointer' }}
                >
                  {validated ? (
                    <CheckCircleRoundedIcon
                      fontSize="small"
                      sx={{ color: wasDone ? 'success.main' : 'action.disabled' }}
                      titleAccess={wasDone ? 'Validado en caja' : 'No se validó'}
                    />
                  ) : (
                    <Checkbox
                      size="small"
                      checked={picked.has(it.name)}
                      onChange={() => toggle(it.name)}
                      sx={{ p: 0.25 }}
                    />
                  )}
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      flexShrink: 0,
                      borderRadius: 1.5,
                      bgcolor: 'action.hover',
                      overflow: 'hidden',
                      display: 'grid',
                      placeItems: 'center',
                    }}
                  >
                    {it.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={it.imageUrl}
                        alt=""
                        loading="lazy"
                        width={40}
                        height={40}
                        style={{ objectFit: 'contain' }}
                      />
                    )}
                  </Box>
                  <Box
                    flex={1}
                    minWidth={0}
                  >
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      sx={{ overflowWrap: 'anywhere' }}
                    >
                      {it.quantity > 1 ? `${it.quantity} × ` : ''}
                      {it.name}
                    </Typography>
                    {(it.category || it.unit) && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        {[it.category, it.unit].filter(Boolean).join(' · ')}
                      </Typography>
                    )}
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', fontWeight: 600 }}
                  >
                    {it.price || '—'}
                  </Typography>
                </Stack>
              );
            })}
            <Stack
              direction="row"
              justifyContent="space-between"
              sx={{ px: 2.5, py: 1.25, bgcolor: 'action.hover' }}
            >
              <Typography
                variant="body2"
                color="text.secondary"
              >
                {items.length} productos · total aproximado
              </Typography>
              <Typography
                variant="body2"
                fontWeight={800}
                sx={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {money(total)}
              </Typography>
            </Stack>
          </Stack>
        ) : (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ p: 2.5 }}
          >
            La lista no tiene productos.
          </Typography>
        )}
      </DialogContent>

      <DialogActions>
        <Button
          onClick={onClose}
          color="inherit"
          sx={{ mr: 'auto' }}
        >
          Cerrar
        </Button>
        {list && validated && (
          <Button
            color="warning"
            onClick={() => onReopen(list)}
          >
            Reabrir
          </Button>
        )}
        {list && !validated && (
          <>
            <Button
              color="inherit"
              onClick={() => onExtend(list)}
            >
              +24 h
            </Button>
            <Button
              variant="contained"
              disableElevation
              disabled={!picked.size}
              onClick={() => onValidate(list, allPicked ? undefined : [...picked])}
            >
              {allPicked ? 'Validar todo' : `Validar ${picked.size} de ${items.length}`}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
