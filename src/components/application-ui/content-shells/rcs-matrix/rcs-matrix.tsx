'use client';

import RangePickerField from '@/components/base/range-picker-field';
import { useRcsMatrix } from '@/hooks/fetching/rcs-matrix/useRcsMatrix';
import { useShopperStatus } from '@/hooks/fetching/rcs-matrix/useShopperStatus';
import {
  centsToUsd,
  todayInNY,
  type MatrixKind,
  type MatrixRow,
} from '@/services/rcs-matrix.service';
import { phoneKey } from '@/services/shopper-whatsapp.service';
import DownloadRounded from '@mui/icons-material/DownloadRounded';
import PhoneInTalkRounded from '@mui/icons-material/PhoneInTalkRounded';
import RefreshRounded from '@mui/icons-material/RefreshRounded';
import SearchRounded from '@mui/icons-material/SearchRounded';
import WhatsApp from '@mui/icons-material/WhatsApp';
import {
  Alert,
  alpha,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Container,
  Divider,
  IconButton,
  InputAdornment,
  MenuItem,
  Skeleton,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import React, { useCallback, useMemo, useState } from 'react';
import {
  dateTimeShort,
  LIST_STATUS_OPTIONS,
  OPEN_STATUSES,
  prettyPhone,
  searchBlob,
  shiftYmd,
  STATUS_META,
  STATUS_OPTIONS,
  statusMeta,
  timeShort,
} from './constants';
import { StoreBranch } from './store-branch';
import {
  rowToTarget,
  SendWaDialog,
  WA_FILTERS,
  waState,
  type SendDialogState,
} from './whatsapp-bot';

type Range = { from: string; to: string };

/** Atajos de período. Se recalculan al click: "Hoy" siempre es hoy en NY. */
const PRESETS: { key: string; label: string; range: () => Range }[] = [
  { key: 'today', label: 'Hoy', range: () => ({ from: todayInNY(), to: todayInNY() }) },
  {
    key: 'yesterday',
    label: 'Ayer',
    range: () => ({ from: shiftYmd(todayInNY(), -1), to: shiftYmd(todayInNY(), -1) }),
  },
  {
    key: '7d',
    label: '7 días',
    range: () => ({ from: shiftYmd(todayInNY(), -6), to: todayInNY() }),
  },
  {
    key: '30d',
    label: '30 días',
    range: () => ({ from: shiftYmd(todayInNY(), -29), to: todayInNY() }),
  },
];

const pct = (n: number, d: number) => (d ? `${Math.round((n / d) * 100)}%` : '0%');

/**
 * Celda de la franja de KPIs. `accent` marca los números accionables; los que
 * filtran la lista se comportan como botón, con foco visible y estado activo.
 */
function Kpi({
  label,
  value,
  sub,
  accent,
  active,
  onClick,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: 'warning' | 'success' | 'error';
  active?: boolean;
  onClick?: () => void;
}): React.JSX.Element {
  const theme = useTheme();
  const tone = accent ? theme.palette[accent].main : theme.palette.text.primary;

  return (
    <Box
      {...(onClick
        ? { component: 'button', type: 'button', onClick, 'aria-pressed': !!active }
        : {})}
      sx={{
        px: 2,
        py: 1.5,
        minWidth: 0,
        textAlign: 'left',
        font: 'inherit',
        color: 'inherit',
        border: 0,
        borderRadius: 2,
        cursor: onClick ? 'pointer' : 'default',
        bgcolor: active ? alpha(tone, 0.08) : 'transparent',
        boxShadow: active ? `inset 0 0 0 1px ${alpha(tone, 0.5)}` : 'none',
        transition: 'background-color .15s ease',
        '&:hover': onClick ? { bgcolor: alpha(tone, 0.06) } : undefined,
        '&:focus-visible': { outline: `2px solid ${tone}`, outlineOffset: -2 },
      }}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        fontWeight={700}
        sx={{ textTransform: 'uppercase', letterSpacing: 0.4 }}
        noWrap
        display="block"
      >
        {label}
      </Typography>
      <Typography
        variant="h5"
        fontWeight={800}
        sx={{
          lineHeight: 1.25,
          fontVariantNumeric: 'tabular-nums',
          color: accent ? tone : 'text.primary',
        }}
        noWrap
      >
        {value}
      </Typography>
      {sub ? (
        <Typography
          variant="caption"
          color="text.secondary"
          noWrap
          display="block"
        >
          {sub}
        </Typography>
      ) : null}
    </Box>
  );
}

/** Barra apilada por estado: de un vistazo cuánto está abierto vs. cerrado. */
function StatusBar({ byStatus, total }: { byStatus: Record<string, number>; total: number }) {
  const theme = useTheme();
  const colorOf = (c: string) =>
    c === 'default'
      ? theme.palette.grey[400]
      : (theme.palette as any)[c]?.main ?? theme.palette.grey[400];
  const parts = Object.keys(STATUS_META)
    .filter((key) => byStatus[key])
    .map((key) => ({
      key,
      n: byStatus[key],
      label: STATUS_META[key].label,
      color: colorOf(STATUS_META[key].color),
    }));
  if (!total || !parts.length) return null;

  return (
    <Box sx={{ px: 2, pb: 1.5 }}>
      <Box
        sx={{
          display: 'flex',
          height: 6,
          borderRadius: 3,
          overflow: 'hidden',
          bgcolor: 'action.hover',
        }}
      >
        {parts.map((p) => (
          <Tooltip
            key={p.key}
            title={`${p.label}: ${p.n}`}
          >
            <Box sx={{ width: `${(p.n / total) * 100}%`, bgcolor: p.color }} />
          </Tooltip>
        ))}
      </Box>
      <Stack
        direction="row"
        spacing={1.5}
        flexWrap="wrap"
        useFlexGap
        sx={{ mt: 0.75 }}
      >
        {parts.map((p) => (
          <Stack
            key={p.key}
            direction="row"
            spacing={0.5}
            alignItems="center"
          >
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: p.color }} />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {p.label} {p.n}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}

/** Descarga lo que se está viendo, para repartir la lista de llamadas. */
function downloadCsv(rows: MatrixRow[], range: Range) {
  const head = [
    'Tienda',
    'Cliente',
    'Telefono',
    'WhatsApp',
    'Orden',
    'Fecha',
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
      dateTimeShort(r.createdAt),
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
  a.download = `matriz-rcs-${
    range.from === range.to ? range.from : `${range.from}_${range.to}`
  }.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

/**
 * Matriz RCS — el árbol de llamadas.
 *
 * Junta las órdenes de TODAS las tiendas (el vendor site solo muestra la suya)
 * y las cuelga de su tienda con los datos de contacto de cada persona: WhatsApp
 * directo, llamada, SMS y el estado en que quedó su orden. Abre en el día de
 * hoy en hora de Nueva York; el período se puede ampliar a un rango.
 */
export default function RcsMatrix(): React.JSX.Element {
  const [kind, setKind] = useState<MatrixKind>('orders');
  const [range, setRange] = useState<Range>(() => PRESETS[0].range());
  const [store, setStore] = useState('all');
  const [status, setStatus] = useState('all');
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [q, setQ] = useState('');
  const [waFilter, setWaFilter] = useState('all');
  const [sendDialog, setSendDialog] = useState<SendDialogState | null>(null);

  // Tienda, estado y período van al backend; el texto se filtra acá, que es
  // instantáneo y no dispara una consulta por tecla.
  const { data, isPending, isError, isFetching, refetch } = useRcsMatrix({
    kind,
    ...range,
    store,
    status,
  });

  // Qué pasó por WhatsApp con cada persona (bot de 3 opciones), por los últimos 10 dígitos.
  const phones = useMemo(
    () => [...new Set((data?.items ?? []).map((r) => r.customerPhone).filter(Boolean))],
    [data]
  );
  const { data: wa } = useShopperStatus(phones);

  const waCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const r of data?.items ?? []) {
      if (!r.customerPhone) continue;
      const st = waState(wa?.[phoneKey(r.customerPhone)]);
      c[st] = (c[st] || 0) + 1;
    }
    return c;
  }, [data, wa]);

  const rows = useMemo(() => {
    const list = data?.items ?? [];
    const needle = q.trim().toLowerCase();
    let out = needle ? list.filter((r) => searchBlob(r).includes(needle)) : list;
    if (onlyOpen) out = out.filter((r) => OPEN_STATUSES.includes(r.fulfillmentStatus));
    if (waFilter !== 'all') {
      out = out.filter(
        (r) => r.customerPhone && waState(wa?.[phoneKey(r.customerPhone)]) === waFilter
      );
    }
    return out;
  }, [data, q, onlyOpen, waFilter, wa]);

  const openSingle = useCallback(
    (r: MatrixRow) => setSendDialog({ mode: 'single', target: rowToTarget(r) }),
    []
  );

  /** Lanza el saludo a las personas que se están viendo (una vez por teléfono). */
  const openBulk = () => {
    const seen = new Set<string>();
    const list = rows.filter((r) => {
      const key = phoneKey(r.customerPhone);
      if (key.length < 10 || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    setSendDialog({
      mode: 'bulk',
      targets: list.map(rowToTarget),
      alreadySent: list.filter((r) => wa?.[phoneKey(r.customerPhone)]?.sentAt).length,
    });
  };

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

  const multiDay = range.from !== range.to;
  const presetKey = PRESETS.find((p) => {
    const r = p.range();
    return r.from === range.from && r.to === range.to;
  })?.key;
  const k = data?.kpis;
  const orders = k?.orders ?? 0;
  const isLists = kind === 'lists';
  const statusOptions = isLists ? LIST_STATUS_OPTIONS : STATUS_OPTIONS;

  // Tienda y estado no significan lo mismo en las dos pestañas: se limpian.
  const changeKind = (next: MatrixKind | null) => {
    if (!next || next === kind) return;
    setKind(next);
    setStore('all');
    setStatus('all');
    setOnlyOpen(false);
  };

  const filtered =
    q.trim() !== '' || store !== 'all' || status !== 'all' || onlyOpen || waFilter !== 'all';
  const clearFilters = () => {
    setQ('');
    setWaFilter('all');
    setStore('all');
    setStatus('all');
    setOnlyOpen(false);
  };

  return (
    <Container
      maxWidth="xl"
      sx={{ py: { xs: 2, md: 2.5 } }}
    >
      <Stack spacing={2}>
        {/* ── Barra única: período · tienda · estado · búsqueda · acciones ── */}
        <Card
          sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}
        >
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            flexWrap="wrap"
            useFlexGap
            sx={{ p: 1.5 }}
          >
            <ToggleButtonGroup
              size="small"
              exclusive
              value={kind}
              onChange={(_, v) => changeKind(v)}
              sx={{
                '& .MuiToggleButton-root': {
                  textTransform: 'none',
                  fontWeight: 700,
                  px: 1.75,
                  py: 0.5,
                },
              }}
            >
              <ToggleButton value="orders">Órdenes</ToggleButton>
              <ToggleButton value="lists">Listas</ToggleButton>
            </ToggleButtonGroup>
            <Stack
              direction="row"
              spacing={0.5}
              alignItems="center"
            >
              {PRESETS.map((p) => (
                <Chip
                  key={p.key}
                  label={p.label}
                  size="small"
                  onClick={() => setRange(p.range())}
                  color={presetKey === p.key ? 'primary' : 'default'}
                  variant={presetKey === p.key ? 'filled' : 'outlined'}
                  sx={{ fontWeight: 700 }}
                />
              ))}
            </Stack>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <RangePickerField
                label="Período"
                value={{ startYmd: range.from, endYmd: range.to }}
                onChange={(v) => setRange({ from: v.startYmd, to: v.endYmd })}
                fullWidth={false}
                sx={{ width: 230 }}
              />
            </LocalizationProvider>
            <TextField
              select
              size="small"
              label="Tienda"
              value={store}
              onChange={(e) => setStore(e.target.value)}
              sx={{ width: 210 }}
            >
              <MenuItem value="all">Todas las tiendas</MenuItem>
              {(data?.stores ?? []).map((s) => (
                <MenuItem
                  key={s.key}
                  value={s.storeId || s.slug}
                >
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
              sx={{ width: 170 }}
            >
              {statusOptions.map((o) => (
                <MenuItem
                  key={o.value}
                  value={o.value}
                >
                  {o.label}
                </MenuItem>
              ))}
            </TextField>

            <Box sx={{ flexGrow: 1 }} />

            <TextField
              size="small"
              placeholder="Nombre, teléfono, orden…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              sx={{ width: { xs: '100%', sm: 240 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRounded fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            <Tooltip title="Mandar el saludo del bot (3 opciones) a las personas que se están viendo">
              <span>
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  startIcon={<WhatsApp />}
                  onClick={openBulk}
                  disabled={!rows.some((r) => r.customerPhone)}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 700,
                    borderRadius: 2,
                    boxShadow: 'none',
                  }}
                >
                  Lanzar WhatsApp
                </Button>
              </span>
            </Tooltip>
            <Button
              size="small"
              variant="outlined"
              color="success"
              onClick={() => setSendDialog({ mode: 'single' })}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
            >
              A un número
            </Button>
            <Tooltip title="Actualizar">
              <span>
                <IconButton
                  size="small"
                  onClick={() => refetch()}
                  disabled={isFetching}
                  aria-label="Actualizar la matriz"
                >
                  {isFetching ? (
                    <CircularProgress size={18} />
                  ) : (
                    <RefreshRounded fontSize="small" />
                  )}
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Descargar lo que se está viendo">
              <span>
                <IconButton
                  size="small"
                  onClick={() => downloadCsv(rows, range)}
                  disabled={!rows.length}
                  aria-label="Descargar CSV"
                >
                  <DownloadRounded fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
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
                sx={{ px: 1.5, py: 1 }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mr: 0.5 }}
                >
                  {rows.length} de {data?.items.length ?? 0} órdenes
                </Typography>
                {onlyOpen ? (
                  <Chip
                    size="small"
                    label="Por atender"
                    color="warning"
                    onDelete={() => setOnlyOpen(false)}
                  />
                ) : null}
                {status !== 'all' ? (
                  <Chip
                    size="small"
                    label={statusOptions.find((o) => o.value === status)?.label}
                    onDelete={() => setStatus('all')}
                  />
                ) : null}
                {store !== 'all' ? (
                  <Chip
                    size="small"
                    label={
                      (data?.stores ?? []).find((s) => (s.storeId || s.slug) === store)?.name ||
                      'Tienda'
                    }
                    onDelete={() => setStore('all')}
                  />
                ) : null}
                {waFilter !== 'all' ? (
                  <Chip
                    size="small"
                    color="success"
                    label={`WA: ${WA_FILTERS.find((o) => o.value === waFilter)?.label}`}
                    onDelete={() => setWaFilter('all')}
                  />
                ) : null}
                {q.trim() ? (
                  <Chip
                    size="small"
                    label={`“${q.trim()}”`}
                    onDelete={() => setQ('')}
                  />
                ) : null}
                <Button
                  size="small"
                  onClick={clearFilters}
                  sx={{ textTransform: 'none' }}
                >
                  Limpiar
                </Button>
              </Stack>
            </>
          ) : null}
        </Card>

        {/* ── KPIs en una sola franja. "Por atender" y "Sin cobrar" filtran la lista ── */}
        {isPending ? (
          <Skeleton
            variant="rounded"
            height={104}
            sx={{ borderRadius: 3 }}
          />
        ) : (
          <Card
            sx={{
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: 'none',
              p: 0.5,
            }}
          >
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: 'repeat(2, 1fr)',
                  sm: 'repeat(3, 1fr)',
                  lg: 'repeat(6, 1fr)',
                },
                gap: 0.5,
              }}
            >
              {isLists ? (
                <>
                  <Kpi
                    label="Listas"
                    value={orders}
                    sub={`${k?.customers ?? 0} personas · ${k?.stores ?? 0} tiendas`}
                  />
                  <Kpi
                    label="Vigentes"
                    value={k?.pending ?? 0}
                    sub={`${pct(k?.pending ?? 0, orders)} · aún no pasan por caja`}
                    accent="warning"
                    active={onlyOpen}
                    onClick={() => setOnlyOpen((v) => !v)}
                  />
                  <Kpi
                    label="Validadas"
                    value={k?.validated ?? 0}
                    sub={`${pct(k?.validated ?? 0, orders)} conversión en caja`}
                    accent="success"
                    active={status === 'list_validated'}
                    onClick={() =>
                      setStatus((s) => (s === 'list_validated' ? 'all' : 'list_validated'))
                    }
                  />
                  <Kpi
                    label="Vencidas"
                    value={k?.expired ?? 0}
                    sub={`${pct(k?.expired ?? 0, orders)} del total`}
                    active={status === 'list_expired'}
                    onClick={() =>
                      setStatus((s) => (s === 'list_expired' ? 'all' : 'list_expired'))
                    }
                  />
                  <Kpi
                    label="Artículos"
                    value={k?.itemsTotal ?? 0}
                    sub={`${orders ? ((k?.itemsTotal ?? 0) / orders).toFixed(1) : '0'} por lista`}
                  />
                  <Kpi
                    label="Ahorro estimado"
                    value={centsToUsd(k?.savingsCents)}
                    sub={`${(k?.points ?? 0).toLocaleString('en-US')} puntos dados`}
                  />
                </>
              ) : (
                <>
                  <Kpi
                    label="Órdenes"
                    value={orders}
                    sub={`${k?.customers ?? 0} personas · ${k?.stores ?? 0} tiendas`}
                  />
                  <Kpi
                    label="Por atender"
                    value={k?.pending ?? 0}
                    sub={`${pct(k?.pending ?? 0, orders)} del total`}
                    accent="warning"
                    active={onlyOpen}
                    onClick={() => setOnlyOpen((v) => !v)}
                  />
                  <Kpi
                    label="Sin cobrar"
                    value={k?.unpaid ?? 0}
                    sub={centsToUsd(k?.unpaidCents)}
                    accent="error"
                    active={status === 'awaiting_payment'}
                    onClick={() =>
                      setStatus((s) => (s === 'awaiting_payment' ? 'all' : 'awaiting_payment'))
                    }
                  />
                  <Kpi
                    label="Venta"
                    value={centsToUsd(k?.grossCents)}
                    sub={`Cobrado ${centsToUsd(k?.collectedCents)}`}
                    accent="success"
                  />
                  <Kpi
                    label="Ticket promedio"
                    value={centsToUsd(k?.avgTicketCents)}
                    sub="sin canceladas"
                  />
                  <Kpi
                    label="Entregadas"
                    value={k?.completed ?? 0}
                    sub={`${pct(k?.completed ?? 0, orders)} · ${k?.cancelled ?? 0} canceladas`}
                  />
                </>
              )}
            </Box>
            <StatusBar
              byStatus={data?.byStatus ?? {}}
              total={orders}
            />
            {/* Respuestas al bot de WhatsApp: cuentan órdenes por estado y filtran la lista */}
            <Divider />
            <Stack
              direction="row"
              spacing={0.75}
              alignItems="center"
              flexWrap="wrap"
              useFlexGap
              sx={{ px: 2, py: 1.25 }}
            >
              <WhatsApp sx={{ fontSize: 18, color: '#25D366', mr: 0.25 }} />
              {WA_FILTERS.map((o) => {
                const n = o.value === 'all' ? null : waCounts[o.value] || 0;
                const active = waFilter === o.value;
                return (
                  <Chip
                    key={o.value}
                    size="small"
                    label={n == null ? o.label : `${o.label} · ${n}`}
                    onClick={() => setWaFilter(active && o.value !== 'all' ? 'all' : o.value)}
                    color={active ? 'success' : 'default'}
                    variant={active ? 'filled' : 'outlined'}
                    sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}
                  />
                );
              })}
            </Stack>
          </Card>
        )}

        {/* ── Árbol ── */}
        {isError ? (
          <Alert
            severity="error"
            sx={{ borderRadius: 2 }}
          >
            No se pudo cargar la matriz. Reintenta en unos segundos.
          </Alert>
        ) : isPending ? (
          <Stack spacing={1}>
            {[0, 1, 2].map((i) => (
              <Skeleton
                key={i}
                variant="rounded"
                height={56}
                sx={{ borderRadius: 3 }}
              />
            ))}
          </Stack>
        ) : branches.length === 0 ? (
          <Card
            sx={{
              p: 4,
              textAlign: 'center',
              borderRadius: 3,
              border: '1px dashed',
              borderColor: 'divider',
              boxShadow: 'none',
            }}
          >
            <PhoneInTalkRounded sx={{ fontSize: 40, color: 'text.disabled' }} />
            <Typography
              variant="subtitle1"
              fontWeight={700}
              sx={{ mt: 1 }}
            >
              {filtered
                ? 'Sin resultados con estos filtros'
                : isLists
                  ? 'Sin listas en este período'
                  : 'Sin órdenes en este período'}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: filtered ? 2 : 0 }}
            >
              {filtered
                ? 'Probá quitando algún filtro o cambiando el período.'
                : 'No hay a quién llamar todavía.'}
            </Typography>
            {filtered ? (
              <Button
                variant="outlined"
                onClick={clearFilters}
                sx={{ textTransform: 'none', borderRadius: 2 }}
              >
                Limpiar filtros
              </Button>
            ) : null}
          </Card>
        ) : (
          <Stack spacing={1}>
            {branches.map(([name, list], i) => (
              <StoreBranch
                key={name}
                storeName={name}
                rows={list}
                defaultExpanded={i === 0 || waFilter !== 'all'}
                showDate={multiDay}
                wa={wa}
                onSendWa={openSingle}
              />
            ))}
          </Stack>
        )}
      </Stack>

      <SendWaDialog
        state={sendDialog}
        stores={data?.stores ?? []}
        onClose={() => setSendDialog(null)}
      />
    </Container>
  );
}
