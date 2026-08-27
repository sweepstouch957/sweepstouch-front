'use client';

import { useSecretSaleLeads } from '@/hooks/fetching/secret-sales/useSecretSales';
import type { SecretSale } from '@/services/secret-sale.service';
import DownloadRounded from '@mui/icons-material/DownloadRounded';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { format } from 'date-fns';
import React from 'react';
import { formatUsPhone } from './constants';

interface Props {
  sale: SecretSale | null;
  onClose: () => void;
}

/** CSV a mano: son cinco columnas, no vale una dependencia. */
function toCsv(rows: Record<string, string>[]): string {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v: string) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [headers.join(','), ...rows.map((r) => headers.map((h) => escape(r[h])).join(','))].join('\n');
}

export function LeadsDialog({ sale, onClose }: Props) {
  const { data: leads, isPending } = useSecretSaleLeads(sale?._id ?? null);

  const download = () => {
    const csv = toCsv(
      (leads ?? []).map((l) => ({
        Nombre: l.firstName,
        Apellido: l.lastName,
        Email: l.email,
        Teléfono: formatUsPhone(l.phone),
        Desbloqueos: String(l.unlockCount),
        Último: format(new Date(l.lastUnlockAt), 'yyyy-MM-dd HH:mm'),
      }))
    );
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `contactos-${sale?.title.replace(/\s+/g, '-').toLowerCase()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={!!sale} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 700 }}>
        Contactos — {sale?.title}
        <Typography variant="body2" color="text.secondary">
          Quien escaneó el QR y completó el perfil para ver este flyer.
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        {isPending ? (
          <Stack spacing={1}>
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rounded" height={44} />
            ))}
          </Stack>
        ) : !leads?.length ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <Typography variant="subtitle1" fontWeight={600}>
              Todavía no hay contactos
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Aparecen acá apenas alguien escanee el QR y complete su perfil.
            </Typography>
          </Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Teléfono</TableCell>
                <TableCell align="right">Veces</TableCell>
                <TableCell align="right">Último</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {leads.map((l) => (
                <TableRow key={l._id} hover>
                  <TableCell>{`${l.firstName} ${l.lastName}`}</TableCell>
                  <TableCell>{l.email}</TableCell>
                  <TableCell>{formatUsPhone(l.phone)}</TableCell>
                  <TableCell align="right">{l.unlockCount}</TableCell>
                  <TableCell align="right">{format(new Date(l.lastUnlockAt), 'dd/MM/yy HH:mm')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          startIcon={<DownloadRounded />}
          onClick={download}
          disabled={!leads?.length}
          sx={{ textTransform: 'none' }}
        >
          Exportar CSV
        </Button>
        <Button onClick={onClose} variant="contained" sx={{ textTransform: 'none', borderRadius: 2 }}>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
