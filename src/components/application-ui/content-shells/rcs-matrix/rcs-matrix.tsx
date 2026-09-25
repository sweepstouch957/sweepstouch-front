'use client';

import { useRcsMatrix } from '@/hooks/fetching/rcs-matrix/useRcsMatrix';
import { centsToUsd, todayInNY, type MatrixRow } from '@/services/rcs-matrix.service';
import DownloadRounded from '@mui/icons-material/DownloadRounded';
import PaymentsRounded from '@mui/icons-material/PaymentsRounded';
import PeopleAltRounded from '@mui/icons-material/PeopleAltRounded';
import PhoneInTalkRounded from '@mui/icons-material/PhoneInTalkRounded';
import ReceiptLongRounded from '@mui/icons-material/ReceiptLongRounded';
import RefreshRounded from '@mui/icons-material/RefreshRounded';
import SearchRounded from '@mui/icons-material/SearchRounded';
import StorefrontRounded from '@mui/icons-material/StorefrontRounded';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import React, { useMemo, useState } from 'react';
import { OPEN_STATUSES, STATUS_OPTIONS, prettyPhone, searchBlob, statusMeta, timeShort } from './constants';
import { StoreBranch } from './store-branch';

/**
 * Tarjeta de número del encabezado.
 *
 * `accent` es para el único dato accionable del día ("Por atender"): el resto
 * son de contexto y no deben competir por la atención. Cuando la tarjeta filtra
 * la lista se comporta como botón — con foco visible y estado activo.
 */
function Kpi({
  label,
  value,
  icon,
  accent,
  active,
  onClick,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent?: 'warning' | 'success';
  active?: boolean;
  onClick?: () => void;
}): React.JSX.Element {
  const theme = useTheme();
  const tone = accent ? theme.palette[accent].main : theme.palette.text.secondary;

  return (
    <Card
      {...(onClick ? { component: 'button', type: 'button', onClick, 'aria-pressed': !!active } : {})}
      sx={{
        p: 2.5,
        height: '100%',
        width: '100%',
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'column',
        gap: 1.25,
        borderRadius: 3,
        border: '1px solid',
        borderColor: active ? tone : 'divider',
        boxShadow: 'none',
        font: 'inherit',
        cursor: onClick ? 'pointer' : 'default',
        bgcolor: active ? alpha(tone, 0.06) : 'background.paper',
        transition: 'border-color .2s ease, background-color .2s ease',
        '&:hover': onClick ? { borderColor: tone, bgcolor: alpha(tone, 0.04) } : undefined,
        '&:focus-visible': { outline: `2px solid ${tone}`, outlineOffset: 2 },
      }}
    >
      <Box
        aria-hidden
        sx={{
          width: 34,
          height: 34,
          borderRadius: 2,
          display: 'grid',
          placeItems: 'center',
          color: tone,
          bgcolor: alpha(tone, 0.12),
          '& svg': { fontSize: 19 },
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography
          variant="h4"
          fontWeight={800}
          sx={{ lineHeight: 1.1, fontVariantNumeric: 'tabular-nums', color: accent ? tone : 'text.primary' }}
        >
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {label}
        </Typography>
      </Box>
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

  const filtered = q.trim() !== '' || store !== 'all' || status !== 'all' || onlyOpen;
  const clearFilters = () => {
    setQ('');
    setStore('all');
    setStatus('all');
    setOnlyOpen(false);
  };

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4 } }}>
      <Stack spacing={{ xs: 3, md: 4 }}>
        {/* ── Filtros: arriba el día que se trabaja, abajo cómo se busca dentro ── */}
        <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
          <Stack
            direction={{ xs: 'column', lg: 'row' }}
            spacing={2}
            alignItems={{ lg: 'center' }}
            sx={{ p: { xs: 2, md: 2.5 } }}
          >
            {/* Contexto: de qué día y de qué tienda estamos hablando */}
            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
              <TextField
                type="date"
                size="small"
                label="Día"
                value={date}
                onChange={(e) => setDate(e.target.value || todayInNY())}
                InputLabelProps={{ shrink: true }}
                sx={{ width: 168 }}
              />
              <Button
                variant="text"
                onClick={() => setDate(todayInNY())}
                disabled={date === todayInNY()}
                sx={{ height: 40, textTransform: 'none', fontWeight: 700, px: 2 }}
              >
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
                sx={{ minWidth: 176 }}
              >
                {STATUS_OPTIONS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>
                    {o.label}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>

            <Box sx={{ flexGrow: 1 }} />

            {/* Acciones sobre lo que ya está en pantalla */}
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <TextField
                size="small"
                placeholder="Nombre, teléfono, orden…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                sx={{ flexGrow: 1, minWidth: { xs: '100%', sm: 240 } }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRounded fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
              <Tooltip title="Actualizar">
                <span>
                  <IconButton
                    onClick={() => refetch()}
                    disabled={isFetching}
                    aria-label="Actualizar la matriz"
                    sx={{ width: 40, height: 40 }}
                  >
                    {isFetching ? <CircularProgress size={18} /> : <RefreshRounded />}
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Descargar lo que se está viendo">
                <span>
                  <IconButton
                    onClick={() => downloadCsv(rows, date)}
                    disabled={!rows.length}
                    aria-label="Descargar CSV"
                    sx={{ width: 40, height: 40 }}
                  >
                    <DownloadRounded />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          </Stack>

          {filtered ? (
            <>
              <Divider />
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                flexWrap="wrap"
                useFlexGap
                sx={{ px: { xs: 2, md: 2.5 }, py: 1.5 }}
              >
                <Typography variant="body2" color="text.secondary" sx={{ mr: 0.5 }}>
                  {rows.length} de {data?.items.length ?? 0} órdenes
                </Typography>
                {onlyOpen ? (
                  <Chip size="small" label="Por atender" color="warning" onDelete={() => setOnlyOpen(false)} />
                ) : null}
                {status !== 'all' ? (
                  <Chip
                    size="small"
                    label={STATUS_OPTIONS.find((o) => o.value === status)?.label}
                    onDelete={() => setStatus('all')}
                  />
                ) : null}
                {store !== 'all' ? (
                  <Chip
                    size="small"
                    label={(data?.stores ?? []).find((s) => (s.storeId || s.slug) === store)?.name || 'Tienda'}
                    onDelete={() => setStore('all')}
                  />
                ) : null}
                {q.trim() ? <Chip size="small" label={`“${q.trim()}”`} onDelete={() => setQ('')} /> : null}
                <Button size="small" onClick={clearFilters} sx={{ textTransform: 'none' }}>
                  Limpiar
                </Button>
              </Stack>
            </>
          ) : null}
        </Card>

        {/* ── Resumen del día. "Por atender" filtra la lista: es el trabajo pendiente ── */}
        <Grid container spacing={{ xs: 2, md: 2.5 }}>
          {[
            { label: 'Órdenes', value: data?.kpis.orders ?? 0, icon: <ReceiptLongRounded /> },
            { label: 'Personas', value: data?.kpis.customers ?? 0, icon: <PeopleAltRounded /> },
            { label: 'Tiendas', value: data?.kpis.stores ?? 0, icon: <StorefrontRounded /> },
            {
              label: 'Por atender',
              value: data?.kpis.pending ?? 0,
              icon: <PhoneInTalkRounded />,
              accent: 'warning' as const,
              active: onlyOpen,
              onClick: () => setOnlyOpen((v) => !v),
            },
            {
              label: 'Venta',
              value: centsToUsd(data?.kpis.grossCents),
              icon: <PaymentsRounded />,
              accent: 'success' as const,
            },
          ].map((k) => (
            <Grid item key={k.label} xs={6} sm={4} md={2.4}>
              {isPending ? <Skeleton variant="rounded" height={132} sx={{ borderRadius: 3 }} /> : <Kpi {...k} />}
            </Grid>
          ))}
        </Grid>

        {/* ── Árbol ── */}
        {isError ? (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            No se pudo cargar la matriz. Reintenta en unos segundos.
          </Alert>
        ) : isPending ? (
          <Stack spacing={1.5}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} variant="rounded" height={76} sx={{ borderRadius: 3 }} />
            ))}
          </Stack>
        ) : branches.length === 0 ? (
          <Card
            sx={{
              p: 6,
              textAlign: 'center',
              borderRadius: 3,
              border: '1px dashed',
              borderColor: 'divider',
              boxShadow: 'none',
            }}
          >
            <PhoneInTalkRounded sx={{ fontSize: 48, color: 'text.disabled' }} />
            <Typography variant="h6" fontWeight={700} sx={{ mt: 1 }}>
              {filtered ? 'Sin resultados con estos filtros' : 'Sin órdenes ese día'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: filtered ? 2 : 0 }}>
              {filtered ? 'Probá quitando algún filtro o cambiando el día.' : 'No hay a quién llamar todavía.'}
            </Typography>
            {filtered ? (
              <Button variant="outlined" onClick={clearFilters} sx={{ textTransform: 'none', borderRadius: 2 }}>
                Limpiar filtros
              </Button>
            ) : null}
          </Card>
        ) : (
          <Stack spacing={2}>
            {branches.map(([name, list], i) => (
              <StoreBranch key={name} storeName={name} rows={list} defaultExpanded={i === 0} />
            ))}
          </Stack>
        )}
      </Stack>
    </Container>
  );
}
