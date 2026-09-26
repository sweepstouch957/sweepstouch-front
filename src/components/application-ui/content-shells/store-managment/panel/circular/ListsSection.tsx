'use client';

/** Listas Pre-RCS de los clientes: validar, extender, reabrir. */
import {
  shoppingListsQK,
  shoppingListsService,
  type AdminShoppingList,
  type ShoppingListStatus,
} from '@/services/shopping-lists.service';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { cell, fmtDate, STATUS_CHIP } from './shared';
import { ListRowsSkeleton } from './skeletons';

export default function ListsSection({ storeSlug }: { storeSlug: string }) {
  const qc = useQueryClient();
  const [status, setStatus] = useState<ShoppingListStatus | 'all'>('all');
  const [detail, setDetail] = useState<AdminShoppingList | null>(null);

  const summary = useQuery({
    queryKey: shoppingListsQK.summary(storeSlug),
    queryFn: () => shoppingListsService.summary(storeSlug),
    enabled: !!storeSlug,
  });
  const lists = useQuery({
    queryKey: shoppingListsQK.lists(storeSlug, status),
    queryFn: () =>
      shoppingListsService.lists({
        storeSlug,
        status: status === 'all' ? undefined : status,
        limit: 50,
      }),
    enabled: !!storeSlug,
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['shopping-lists'] });
  };

  const validate = useMutation({
    mutationFn: (qrCode: string) => shoppingListsService.validate(qrCode),
    onSuccess: (d) => {
      toast.success(`Lista validada · +${d.pointsAwarded} pts acreditados`);
      refresh();
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'No se pudo validar'),
  });
  const extend = useMutation({
    mutationFn: (qrCode: string) => shoppingListsService.update(qrCode, { extendHours: 24 }),
    onSuccess: () => {
      toast.success('Vigencia extendida 24 h');
      refresh();
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'No se pudo extender'),
  });
  const reopen = useMutation({
    mutationFn: (qrCode: string) => shoppingListsService.update(qrCode, { status: 'pending' }),
    onSuccess: () => {
      toast.success('Lista reabierta');
      refresh();
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'No se pudo reabrir'),
  });

  const s = summary.data;

  return (
    <Stack spacing={1.5}>
      <Stack
        direction="row"
        flexWrap="wrap"
        gap={1}
      >
        {(
          [
            ['all', `Todas${s ? ` (${s.total})` : ''}`],
            ['pending', `Pendientes${s ? ` (${s.pending})` : ''}`],
            ['validated', `Validadas${s ? ` (${s.validated})` : ''}`],
            ['expired', `Vencidas${s ? ` (${s.expired})` : ''}`],
          ] as const
        ).map(([value, label]) => (
          <Chip
            key={value}
            size="small"
            label={label}
            color={status === value ? 'primary' : 'default'}
            onClick={() => setStatus(value)}
          />
        ))}
        {s && (
          <Chip
            size="small"
            variant="outlined"
            label={`${s.pointsAwarded} pts acreditados`}
            sx={{ ml: 'auto' }}
          />
        )}
      </Stack>

      {lists.isLoading ? (
        <ListRowsSkeleton rows={6} />
      ) : (
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={cell}>QR</TableCell>
                <TableCell sx={cell}>Cliente</TableCell>
                <TableCell
                  sx={cell}
                  align="right"
                >
                  Items
                </TableCell>
                <TableCell
                  sx={cell}
                  align="right"
                >
                  Puntos
                </TableCell>
                <TableCell sx={cell}>Estado</TableCell>
                <TableCell sx={cell}>Creada</TableCell>
                <TableCell
                  sx={cell}
                  align="right"
                >
                  Acciones
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(lists.data?.items ?? []).map((l) => (
                <TableRow
                  key={l._id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => setDetail(l)}
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
                      variant="caption"
                      color="text.secondary"
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
                      {...(STATUS_CHIP[l.status] || { label: l.status, color: 'default' })}
                    />
                  </TableCell>
                  <TableCell sx={cell}>{fmtDate(l.createdAt)}</TableCell>
                  <TableCell
                    sx={cell}
                    align="right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {l.status !== 'validated' && (
                      <Tooltip title="Validar todos los productos y acreditar puntos">
                        <Button
                          size="small"
                          onClick={() => validate.mutate(l.qrCode)}
                          disabled={validate.isPending}
                        >
                          Validar
                        </Button>
                      </Tooltip>
                    )}
                    {l.status === 'expired' && (
                      <Button
                        size="small"
                        onClick={() => extend.mutate(l.qrCode)}
                        disabled={extend.isPending}
                      >
                        +24h
                      </Button>
                    )}
                    {l.status === 'validated' && (
                      <Button
                        size="small"
                        color="warning"
                        onClick={() => reopen.mutate(l.qrCode)}
                        disabled={reopen.isPending}
                      >
                        Reabrir
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {!lists.data?.items?.length && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    sx={{ py: 3, textAlign: 'center' }}
                  >
                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      Sin listas.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      )}

      <Dialog
        open={!!detail}
        onClose={() => setDetail(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontFamily: 'monospace' }}>{detail?.qrCode}</DialogTitle>
        <DialogContent dividers>
          <Stack divider={<Divider flexItem />}>
            {(detail?.items ?? []).map((it, i) => (
              <Stack
                key={i}
                direction="row"
                justifyContent="space-between"
                sx={{ py: 0.75 }}
              >
                <Typography variant="body2">
                  {it.quantity}× {it.name}
                  {detail?.validatedItems?.some((n) => n.toLowerCase() === it.name.toLowerCase()) &&
                    ' ✓'}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  {it.price}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            size="small"
            onClick={() => setDetail(null)}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
