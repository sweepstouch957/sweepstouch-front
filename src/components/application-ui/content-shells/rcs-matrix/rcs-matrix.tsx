'use client';

import { useRcsMatrix } from '@/hooks/fetching/rcs-matrix/useRcsMatrix';
import { centsToUsd, todayInNY, type MatrixRow } from '@/services/rcs-matrix.service';
import DownloadRounded from '@mui/icons-material/DownloadRounded';
import RefreshRounded from '@mui/icons-material/RefreshRounded';
import SearchRounded from '@mui/icons-material/SearchRounded';
import {
  Alert,
  Box,
  Button,
  Card,
  Container,
  Grid,
  InputAdornment,
  MenuItem,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import React, { useMemo, useState } from 'react';
import { OPEN_STATUSES, STATUS_OPTIONS, prettyPhone, searchBlob, statusMeta, timeShort } from './constants';
import { StoreBranch } from './store-branch';

/** Tarjeta de número grande del encabezado. */
function Kpi({ label, value }: { label: string; value: string | number }): React.JSX.Element {
  return (
    <Card sx={{ p: 2 }}>
      <Typography variant="h4" fontWeight={800}>
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    </Card>
  );
}

/** Descarga lo que se está viendo, para repartir la lista de llamadas. */
function downloadCsv(rows: MatrixRow[], date: string) {
  const head = [
    'Tienda',
    'Cliente',
    'Telefono',
    'WhatsApp',
    'Orden',
    'Hora',
    'Estado',
    'Pago',
    'Entrega',
    'Pickup',
    'Direccion',
    'Articulos',
    'Total',
  ];
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const body = rows.map((r) =>
    [
      r.storeName,
      r.customerName,
      prettyPhone(r.customerPhone),
      r.contact?.whatsapp || '',
      r.orderNumber,
      timeShort(r.createdAt),
      statusMeta(r.fulfillmentStatus).label,
      r.paymentStatus,
      r.deliveryMethod,
      timeShort(r.pickupAt),
      r.address,
      r.itemCount,
      centsToUsd(r.subtotalCents - r.refundTotalCents),
    ]
      .map(esc)
      .join(',')
  );
  const blob = new Blob(['﻿' + [head.map(esc).join(','), ...body].join('\n')], {
    type: 'text/csv;charset=utf-8;',
  });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `matriz-rcs-${date}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

/**
 * Matriz RCS — el árbol de llamadas del día.
 *
 * Junta las órdenes de TODAS las tiendas (el vendor site solo muestra la suya)
 * y las cuelga de su tienda con los datos de contacto de cada persona: WhatsApp
 * directo, llamada, SMS y el estado en que quedó su orden. Abre en el día de
 * hoy en hora de Nueva York, que es el turno que se está trabajando.
 */
export default function RcsMatrix(): React.JSX.Element {
  const [date, setDate] = useState(todayInNY());
  const [store, setStore] = useState('all');
  const [status, setStatus] = useState('all');
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [q, setQ] = useState('');

  // El filtro de tienda y estado se manda al backend; el texto se filtra acá,
  // que es instantáneo y no dispara una consulta por tecla.
  const { data, isPending, isError, isFetching, refetch } = useRcsMatrix({ date, store, status });

  const rows = useMemo(() => {
    const list = data?.items ?? [];
    const needle = q.trim().toLowerCase();
    const bySearch = needle ? list.filter((r) => searchBlob(r).includes(needle)) : list;
    return onlyOpen ? bySearch.filter((r) => OPEN_STATUSES.includes(r.fulfillmentStatus)) : bySearch;
  }, [data, q, onlyOpen]);

  // Agrupadas por tienda: es el árbol. Más órdenes arriba — ahí está el trabajo.
  const branches = useMemo(() => {
    const map = new Map<string, MatrixRow[]>();
    for (const r of rows) {
      const key = r.storeName || r.storeSlug || '—';
      const prev = map.get(key);
      if (prev) prev.push(r);
      else map.set(key, [r]);
    }
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [rows]);

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* ── Filtros ── */}
      <Card sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }}>
          <TextField
            type="date"
            size="small"
            label="Día"
            value={date}
            onChange={(e) => setDate(e.target.value || todayInNY())}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 170 }}
          />
          <Button size="small" variant="outlined" onClick={() => setDate(todayInNY())}>
            Hoy
          </Button>

          <TextField
            select
            size="small"
            label="Tienda"
            value={store}
            onChange={(e) => setStore(e.target.value)}
            sx={{ minWidth: 220 }}
          >
            <MenuItem value="all">Todas las tiendas</MenuItem>
            {(data?.stores ?? []).map((s) => (
              <MenuItem key={s.key} value={s.storeId || s.slug}>
                {s.name} ({s.orders})
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            size="small"
            label="Estado"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            sx={{ minWidth: 190 }}
          >
            {STATUS_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            size="small"
            placeholder="Nombre, teléfono, orden…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            sx={{ flex: 1, minWidth: 200 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRounded fontSize="small" />
                </InputAdornment>
              ),
            }}
          />

          <Button
            size="small"
            variant={onlyOpen ? 'contained' : 'outlined'}
            color="warning"
            onClick={() => setOnlyOpen((v) => !v)}
          >
            Por atender
          </Button>
          <Button size="small" startIcon={<RefreshRounded />} onClick={() => refetch()} disabled={isFetching}>
            Actualizar
          </Button>
          <Button
            size="small"
            startIcon={<DownloadRounded />}
            onClick={() => downloadCsv(rows, date)}
            disabled={!rows.length}
          >
            CSV
          </Button>
        </Stack>
      </Card>

      {/* ── Resumen del día ── */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {[
          { label: 'Órdenes', value: data?.kpis.orders ?? 0 },
          { label: 'Personas', value: data?.kpis.customers ?? 0 },
          { label: 'Tiendas', value: data?.kpis.stores ?? 0 },
          { label: 'Por atender', value: data?.kpis.pending ?? 0 },
          { label: 'Venta', value: centsToUsd(data?.kpis.grossCents) },
        ].map((k) => (
          <Grid item key={k.label} xs={6} sm={4} md={2.4}>
            {isPending ? <Skeleton variant="rounded" height={92} /> : <Kpi label={k.label} value={k.value} />}
          </Grid>
        ))}
      </Grid>

      {/* ── Árbol ── */}
      {isError ? (
        <Alert severity="error">No se pudo cargar la matriz. Reintenta en unos segundos.</Alert>
      ) : isPending ? (
        <Stack spacing={1}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} variant="rounded" height={64} />
          ))}
        </Stack>
      ) : branches.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" fontWeight={700}>
            Sin órdenes ese día
          </Typography>
          <Typography variant="body2" color="text.secondary">
            No hay a quién llamar con estos filtros.
          </Typography>
        </Card>
      ) : (
        <Box>
          {branches.map(([name, list], i) => (
            <StoreBranch key={name} storeName={name} rows={list} defaultExpanded={i === 0} />
          ))}
        </Box>
      )}
    </Container>
  );
}
