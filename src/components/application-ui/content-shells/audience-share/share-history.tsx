'use client';

/**
 * Historial de bases compartidas, con la reversa.
 *
 * Es la mitad que hace que compartir sea una decisión y no una apuesta: cada
 * operación guarda los ids exactos que tocó, así que revertir saca la tienda
 * destino sólo de esos contactos y no toca a los que ya estaban ahí.
 */

import ConfirmDialog from '@/components/base/confirm-dialog';
import { PanelCard, numeric, TonePill } from '@/components/audience/ui';
import { useRevertShare, useShareHistory } from '@/hooks/fetching/customers/useCustomerShare';
import type { ShareRecord } from '@/services/customerShare.service';
import EastRoundedIcon from '@mui/icons-material/EastRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import UndoRoundedIcon from '@mui/icons-material/UndoRounded';
import {
  Alert,
  Box,
  Button,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';

const nf = new Intl.NumberFormat('es-US');
const dtf = new Intl.DateTimeFormat('es-US', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

function fmtDate(iso?: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : dtf.format(d);
}

type StatusFilter = 'all' | 'applied' | 'reverted';

export default function ShareHistory() {
  const [status, setStatus] = useState<StatusFilter>('all');
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [toRevert, setToRevert] = useState<ShareRecord | null>(null);

  const history = useShareHistory({
    page: page + 1,
    limit,
    ...(status === 'all' ? {} : { status }),
  });

  const revert = useRevertShare();
  const rows = history.data?.data ?? [];

  const handleRevert = () => {
    if (!toRevert) return;
    revert.mutate(toRevert.id, { onSettled: () => setToRevert(null) });
  };

  const revertError =
    (revert.error as any)?.response?.data?.error ||
    (revert.isError ? 'No se pudo revertir la operación.' : null);

  return (
    <PanelCard
      title="Historial"
      subtitle="Cada operación se puede deshacer: los contactos vuelven a estar sólo en su negocio"
      icon={<HistoryRoundedIcon fontSize="small" />}
      tone="info"
      right={
        <ToggleButtonGroup
          size="small"
          exclusive
          value={status}
          onChange={(_, v) => {
            if (!v) return;
            setStatus(v as StatusFilter);
            setPage(0);
          }}
          aria-label="Filtrar por estado"
        >
          <ToggleButton value="all">Todas</ToggleButton>
          <ToggleButton value="applied">Activas</ToggleButton>
          <ToggleButton value="reverted">Revertidas</ToggleButton>
        </ToggleButtonGroup>
      }
    >
      {revertError && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
        >
          {revertError}
        </Alert>
      )}

      {history.isLoading ? (
        <Stack gap={1}>
          {[0, 1, 2].map((i) => (
            <Skeleton
              key={i}
              variant="rounded"
              height={52}
            />
          ))}
        </Stack>
      ) : history.isError ? (
        <Alert severity="error">No se pudo cargar el historial.</Alert>
      ) : rows.length === 0 ? (
        <Stack
          alignItems="center"
          gap={0.5}
          py={5}
        >
          <HistoryRoundedIcon sx={{ color: 'text.disabled' }} />
          <Typography
            variant="body2"
            color="text.secondary"
            textAlign="center"
          >
            {status === 'all'
              ? 'Todavía no se compartió ninguna base.'
              : 'Ninguna operación en ese estado.'}
          </Typography>
        </Stack>
      ) : (
        <>
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Operación</TableCell>
                  <TableCell align="right">Contactos</TableCell>
                  <TableCell>Cuándo</TableCell>
                  <TableCell>Quién</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="right">Acción</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r) => (
                  <TableRow
                    key={r.id}
                    hover
                  >
                    <TableCell sx={{ maxWidth: 320 }}>
                      <Stack
                        direction="row"
                        alignItems="center"
                        gap={0.75}
                        minWidth={0}
                      >
                        <Typography
                          variant="body2"
                          noWrap
                          title={r.fromStore.name}
                        >
                          {r.fromStore.name}
                        </Typography>
                        <EastRoundedIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          noWrap
                          title={r.toStore.name}
                        >
                          {r.toStore.name}
                        </Typography>
                      </Stack>
                      {r.note && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          {r.note}
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell
                      align="right"
                      sx={numeric}
                    >
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        sx={numeric}
                      >
                        {nf.format(r.customersCount)}
                      </Typography>
                      {r.status === 'reverted' && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={numeric}
                        >
                          {nf.format(r.revertedCount)} devueltos
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell>
                      <Typography variant="caption">{fmtDate(r.appliedAt)}</Typography>
                      {r.revertedAt && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block' }}
                        >
                          revertida {fmtDate(r.revertedAt)}
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell>
                      <Typography variant="caption">
                        {r.appliedBy?.name || 'Sin registrar'}
                      </Typography>
                      {r.revertedBy?.name && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block' }}
                        >
                          revertida por {r.revertedBy.name}
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell>
                      <TonePill
                        label={r.status === 'applied' ? 'Activa' : 'Revertida'}
                        tone={r.status === 'applied' ? 'success' : 'secondary'}
                      />
                    </TableCell>

                    <TableCell align="right">
                      {r.status === 'applied' ? (
                        <Button
                          size="small"
                          color="warning"
                          startIcon={<UndoRoundedIcon sx={{ fontSize: 16 }} />}
                          onClick={() => setToRevert(r)}
                          disabled={revert.isPending}
                          sx={{ textTransform: 'none', fontWeight: 600 }}
                        >
                          Revertir
                        </Button>
                      ) : (
                        <Typography
                          variant="caption"
                          color="text.disabled"
                        >
                          —
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <TablePagination
              component="div"
              count={history.data?.total ?? 0}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={limit}
              onRowsPerPageChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(0);
              }}
              rowsPerPageOptions={[10, 25, 50]}
              labelRowsPerPage="Filas"
              labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
            />
          </Box>
        </>
      )}

      <ConfirmDialog
        open={Boolean(toRevert)}
        title="Revertir esta operación"
        severity="warning"
        confirmLabel="Sí, revertir"
        cancelLabel="Cancelar"
        loading={revert.isPending}
        onClose={() => setToRevert(null)}
        onConfirm={handleRevert}
        description={
          toRevert ? (
            <>
              Se le va a sacar <b>{toRevert.toStore.name}</b> a los{' '}
              <b>{nf.format(toRevert.customersCount)}</b> contactos que esta operación agregó.
              Vuelven a estar sólo en <b>{toRevert.fromStore.name}</b> y dejan de recibir esas
              campañas.
              <br />
              <br />
              Los contactos que ya pertenecían al destino antes de compartir no se tocan.
            </>
          ) : null
        }
      />
    </PanelCard>
  );
}
