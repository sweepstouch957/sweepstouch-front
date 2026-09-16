'use client';

/**
 * Qué tiendas tienen clientes con nombre.
 *
 * Sirve para saber dónde se puede personalizar un mensaje ("Hola Juan") y dónde
 * no. Un cliente cuenta como "con nombre" con la misma regla que usa el
 * placeholder `#name` al enviar: 2+ letras y que no sea un alta automática
 * ("Cliente", "Demo", "Test"...). Si acá suma, allá recibe su nombre.
 *
 * Dos filtros independientes:
 *  - Tienda: activa / inactiva / todas (estado del Store).
 *  - Cliente: activos / todos (`active === true` del Customer, la misma regla
 *    que usa el export para campañas). Con "activos" la cifra principal es
 *    nombre + teléfono + activo: lo que de verdad recibe un envío.
 *
 * El total por tienda cuenta pertenencias, no personas: un número que está en
 * tres tiendas suma en las tres. Es lo que corresponde, porque el reporte se
 * lee y se exporta tienda por tienda.
 */
import { PanelCard, numeric } from '@/components/audience/ui';
import { customerClient, type NamedByStoreRow } from '@/services/customerService';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment,
  LinearProgress,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';

const nf = new Intl.NumberFormat('es-US');

/** Excel corta el nombre de una hoja a 31 chars y rechaza : \ / ? * [ ] */
function sheetName(name: string, fallback: string) {
  const clean = String(name || fallback).replace(/[:\\/?*[\]]/g, ' ').trim();
  return (clean || fallback).slice(0, 31);
}

function stamp() {
  return new Date().toISOString().slice(0, 10);
}

function pctOf(part: number, whole: number) {
  return whole ? Math.round((part / whole) * 1000) / 10 : 0;
}

type StoreFilter = 'all' | 'active' | 'inactive';
type CustomerFilter = 'all' | 'active';
type SortKey = 'name' | 'usable' | 'named' | 'withPhone' | 'active' | 'total' | 'usablePct';

const COLUMNS: { key: SortKey; label: string; hint?: string }[] = [
  { key: 'usable', label: 'Usables', hint: 'Los que reciben un envío personalizado con el filtro de cliente elegido.' },
  { key: 'named', label: 'Con nombre' },
  { key: 'withPhone', label: 'Con teléfono' },
  { key: 'active', label: 'Activos', hint: 'Clientes con active = true. Los demás no reciben campañas.' },
  { key: 'total', label: 'Total' },
  { key: 'usablePct', label: '% usables', hint: 'Usables sobre el total de la tienda.' },
];

/** Fila ya resuelta con el filtro de cliente aplicado. */
type ViewRow = NamedByStoreRow & { usable: number; usablePct: number };

export default function NamedCustomersReport(): React.JSX.Element {
  const [search, setSearch] = useState('');
  const [storeFilter, setStoreFilter] = useState<StoreFilter>('active');
  const [customerFilter, setCustomerFilter] = useState<CustomerFilter>('active');
  const [sortKey, setSortKey] = useState<SortKey>('usable');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [busy, setBusy] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [exportError, setExportError] = useState('');

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ['customers', 'named-by-store'],
    queryFn: () => customerClient.getNamedByStore(),
    staleTime: 300_000,
    refetchOnWindowFocus: false,
  });

  const activeOnly = customerFilter === 'active';

  // Filtro de tienda → filtro de cliente (define "usable") → búsqueda → orden.
  // El estado va antes que la búsqueda porque también manda en los totales y en
  // lo que se exporta: si estás viendo sólo activas, el archivo trae sólo activas.
  const rows = useMemo<ViewRow[]>(() => {
    let all = data?.data ?? [];
    if (storeFilter !== 'all') {
      all = all.filter((r) => (storeFilter === 'active' ? r.isActive : !r.isActive));
    }
    const term = search.trim().toLowerCase();
    if (term) {
      all = all.filter(
        (r) =>
          r.name.toLowerCase().includes(term) ||
          r.slug.toLowerCase().includes(term) ||
          r.storeId.includes(term)
      );
    }
    const view = all.map((r) => {
      const usable = activeOnly ? (r.namedWithPhoneActive ?? 0) : r.namedWithPhone;
      return { ...r, usable, usablePct: pctOf(usable, r.total) };
    });
    const dir = sortDir === 'asc' ? 1 : -1;
    return view.sort((a, b) => {
      if (sortKey === 'name') return a.name.localeCompare(b.name) * dir;
      const diff = (a[sortKey] ?? 0) - (b[sortKey] ?? 0);
      return diff !== 0 ? diff * dir : a.name.localeCompare(b.name);
    });
  }, [data, search, storeFilter, activeOnly, sortKey, sortDir]);

  const counts = useMemo(() => {
    const all = data?.data ?? [];
    return {
      all: all.length,
      active: all.filter((r) => r.isActive).length,
      inactive: all.filter((r) => !r.isActive).length,
    };
  }, [data]);

  // Totales de lo que está en pantalla, no de toda la base: con el filtro puesto,
  // un total global sería un número que no corresponde a ninguna fila visible.
  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, r) => ({
          stores: acc.stores + 1,
          withData: acc.withData + (r.usable > 0 ? 1 : 0),
          total: acc.total + r.total,
          withPhone: acc.withPhone + r.withPhone,
          named: acc.named + r.named,
          active: acc.active + (r.active ?? 0),
          usable: acc.usable + r.usable,
        }),
        { stores: 0, withData: 0, total: 0, withPhone: 0, named: 0, active: 0, usable: 0 }
      ),
    [rows]
  );

  const onSort = (key: SortKey) => {
    if (key === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir(key === 'name' ? 'asc' : 'desc');
    }
  };

  const usableLabel = activeOnly ? 'con nombre, teléfono y activos' : 'con nombre y teléfono';
  const fileSuffix = activeOnly ? 'activos' : 'todos';

  const summaryRow = (r: ViewRow) => ({
    Tienda: r.name,
    Slug: r.slug,
    Estado: r.isActive ? 'Activa' : r.status,
    [`Usables (${usableLabel})`]: r.usable,
    'Con nombre y teléfono': r.namedWithPhone,
    'Con nombre, teléfono y activos': r.namedWithPhoneActive ?? 0,
    'Con nombre': r.named,
    'Con teléfono': r.withPhone,
    'Clientes activos': r.active ?? 0,
    'Total de clientes': r.total,
    '% usables': r.usablePct,
    'ID de tienda': r.storeId,
  });

  const customerRow = (c: Awaited<ReturnType<typeof customerClient.getNamedStoreCustomers>>[number]) => ({
    Nombre: c.firstName ?? '',
    Apellido: c.lastName ?? '',
    Teléfono: c.phoneNumber ?? '',
    Email: c.email ?? '',
    Activo: c.active ? 'Sí' : 'No',
  });

  /** Hoja resumen: una fila por tienda, tal como se ve en pantalla. */
  const exportSummary = async () => {
    setBusy('summary');
    setExportError('');
    try {
      const { utils, writeFile } = await import('xlsx');
      const wb = utils.book_new();
      utils.book_append_sheet(wb, utils.json_to_sheet(rows.map(summaryRow)), 'Resumen');
      writeFile(wb, `clientes_con_nombre_${fileSuffix}_${stamp()}.xlsx`);
    } catch {
      setExportError('No se pudo generar el archivo.');
    } finally {
      setBusy(null);
    }
  };

  /** Detalle de una tienda: nombre, apellido y teléfono de cada cliente. */
  const exportStore = async (row: ViewRow) => {
    setBusy(row.storeId);
    setExportError('');
    try {
      const [{ utils, writeFile }, customers] = await Promise.all([
        import('xlsx'),
        customerClient.getNamedStoreCustomers(row.storeId, activeOnly),
      ]);
      const wb = utils.book_new();
      utils.book_append_sheet(
        wb,
        utils.json_to_sheet(customers.map(customerRow)),
        sheetName(row.name, 'Clientes')
      );
      writeFile(wb, `clientes_${row.slug || row.storeId}_${fileSuffix}_${stamp()}.xlsx`);
    } catch {
      setExportError(`No se pudieron traer los clientes de ${row.name}.`);
    } finally {
      setBusy(null);
    }
  };

  /**
   * Un archivo con TODO: resumen + una hoja por tienda. Va de a una tienda por
   * vez a propósito — son tantas requests como tiendas, y en paralelo es una
   * forma elegante de tumbar el servicio.
   */
  const exportEverything = async () => {
    const withData = rows.filter((r) => r.usable > 0);
    if (!withData.length) return;
    setBusy('all');
    setExportError('');
    setProgress({ done: 0, total: withData.length });
    try {
      const { utils, writeFile } = await import('xlsx');
      const wb = utils.book_new();
      utils.book_append_sheet(wb, utils.json_to_sheet(withData.map(summaryRow)), 'Resumen');

      const used = new Set<string>(['Resumen']);
      for (let i = 0; i < withData.length; i++) {
        const row = withData[i];
        const customers = await customerClient.getNamedStoreCustomers(row.storeId, activeOnly);
        // Dos tiendas con nombres parecidos chocan al recortar a 31 chars y
        // SheetJS tira. El sufijo sale de un contador, no del nombre: si saliera
        // del nombre, un choque volvería a generar el mismo título y el bucle no
        // terminaría nunca.
        const base = sheetName(row.name, `Tienda ${i + 1}`);
        let title = base;
        for (let n = 2; used.has(title); n++) {
          title = `${base.slice(0, 31 - String(n).length - 1)} ${n}`;
        }
        used.add(title);
        utils.book_append_sheet(wb, utils.json_to_sheet(customers.map(customerRow)), title);
        setProgress({ done: i + 1, total: withData.length });
      }
      writeFile(wb, `clientes_con_nombre_detalle_${fileSuffix}_${stamp()}.xlsx`);
    } catch {
      setExportError('Se cortó la descarga del detalle. Probá de a una tienda.');
    } finally {
      setBusy(null);
      setProgress(null);
    }
  };

  const generatedAt = data?.generatedAt ? new Date(data.generatedAt) : null;

  return (
    <PanelCard
      title="Clientes con nombre por tienda"
      subtitle="Dónde se puede personalizar el mensaje y dónde el envío sale sin nombre. Exportable a Excel."
      icon={<BadgeRoundedIcon />}
      tone="primary"
      right={
        <Stack
          direction="row"
          gap={1}
          alignItems="center"
        >
          <Tooltip
            title={
              generatedAt
                ? `Generado ${generatedAt.toLocaleString('es-US')}. Click para actualizar.`
                : 'Actualizar'
            }
          >
            <span>
              <IconButton
                size="small"
                disabled={isFetching || !!busy}
                onClick={() => refetch()}
              >
                {isFetching ? <CircularProgress size={16} /> : <RefreshRoundedIcon fontSize="small" />}
              </IconButton>
            </span>
          </Tooltip>
          <Button
            size="small"
            variant="outlined"
            startIcon={
              busy === 'summary' ? <CircularProgress size={14} /> : <DownloadRoundedIcon />
            }
            disabled={!rows.length || !!busy}
            onClick={exportSummary}
          >
            Resumen
          </Button>
          <Tooltip title={`Resumen + una hoja por tienda con los clientes ${usableLabel}`}>
            <span>
              <Button
                size="small"
                variant="contained"
                startIcon={
                  busy === 'all' ? <CircularProgress size={14} /> : <DownloadRoundedIcon />
                }
                disabled={!totals.withData || !!busy}
                onClick={exportEverything}
              >
                Nombres y teléfonos ({nf.format(totals.withData)})
              </Button>
            </span>
          </Tooltip>
        </Stack>
      }
    >
      {isError && (
        <Alert severity="error">No se pudo cargar el reporte de clientes con nombre.</Alert>
      )}

      {isLoading && (
        <Stack gap={1}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton
              key={i}
              height={38}
              variant="rounded"
            />
          ))}
        </Stack>
      )}

      {!isLoading && !isError && (
        <Stack gap={2}>
          {/* Filtros: tienda y cliente son independientes. */}
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            gap={1.5}
            alignItems={{ md: 'center' }}
            flexWrap="wrap"
          >
            <Stack
              direction="row"
              gap={1}
              alignItems="center"
            >
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={600}
              >
                Tiendas
              </Typography>
              <ToggleButtonGroup
                size="small"
                exclusive
                value={storeFilter}
                onChange={(_, v) => v && setStoreFilter(v)}
                aria-label="Estado de la tienda"
              >
                <ToggleButton value="active">Activas ({counts.active})</ToggleButton>
                <ToggleButton value="inactive">Inactivas ({counts.inactive})</ToggleButton>
                <ToggleButton value="all">Todas ({counts.all})</ToggleButton>
              </ToggleButtonGroup>
            </Stack>

            <Stack
              direction="row"
              gap={1}
              alignItems="center"
            >
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={600}
              >
                Clientes
              </Typography>
              <ToggleButtonGroup
                size="small"
                exclusive
                value={customerFilter}
                onChange={(_, v) => v && setCustomerFilter(v)}
                aria-label="Estado del cliente"
              >
                <ToggleButton
                  value="active"
                  title="Sólo clientes con active = true: los que reciben campañas."
                >
                  Activos
                </ToggleButton>
                <ToggleButton value="all">Todos</ToggleButton>
              </ToggleButtonGroup>
            </Stack>

            <TextField
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar tienda, slug o ID…"
              sx={{ flex: 1, minWidth: 220 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          </Stack>

          {/* Cifras de lo que hay en pantalla. */}
          <Box
            sx={{
              display: 'grid',
              gap: 1.5,
              gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)', md: 'repeat(6, 1fr)' },
            }}
          >
            <Stat
              label={`Usables (${usableLabel})`}
              value={totals.usable}
              sub={`${pctOf(totals.usable, totals.total)}% del total`}
              highlight
            />
            <Stat
              label="Con nombre"
              value={totals.named}
              sub={`${pctOf(totals.named, totals.total)}% del total`}
            />
            <Stat
              label="Con teléfono"
              value={totals.withPhone}
              sub={`${pctOf(totals.withPhone, totals.total)}% del total`}
            />
            <Stat
              label="Activos"
              value={totals.active}
              sub={`${pctOf(totals.active, totals.total)}% del total`}
            />
            <Stat
              label="Contactos"
              value={totals.total}
              sub="pertenencias, no personas"
            />
            <Stat
              label="Tiendas"
              value={totals.stores}
              sub={`${nf.format(totals.withData)} con usables`}
            />
          </Box>

          {progress && (
            <Box>
              <LinearProgress
                variant="determinate"
                value={(progress.done / progress.total) * 100}
              />
              <Typography
                variant="caption"
                color="text.secondary"
              >
                Trayendo clientes… {progress.done} de {progress.total} tiendas
              </Typography>
            </Box>
          )}

          {exportError && <Alert severity="warning">{exportError}</Alert>}

          <TableContainer sx={{ maxHeight: 560 }}>
            <Table
              size="small"
              stickyHeader
            >
              <TableHead>
                <TableRow>
                  <TableCell sortDirection={sortKey === 'name' ? sortDir : false}>
                    <TableSortLabel
                      active={sortKey === 'name'}
                      direction={sortKey === 'name' ? sortDir : 'asc'}
                      onClick={() => onSort('name')}
                    >
                      Tienda
                    </TableSortLabel>
                  </TableCell>
                  {COLUMNS.map((c) => (
                    <TableCell
                      key={c.key}
                      align="right"
                      sortDirection={sortKey === c.key ? sortDir : false}
                    >
                      <Tooltip title={c.hint ?? ''}>
                        <TableSortLabel
                          active={sortKey === c.key}
                          direction={sortKey === c.key ? sortDir : 'desc'}
                          onClick={() => onSort(c.key)}
                        >
                          {c.label}
                        </TableSortLabel>
                      </Tooltip>
                    </TableCell>
                  ))}
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r) => (
                  <TableRow
                    key={r.storeId}
                    hover
                    sx={r.usable === 0 ? { opacity: 0.55 } : undefined}
                  >
                    <TableCell>
                      <Stack
                        direction="row"
                        gap={1}
                        alignItems="center"
                      >
                        <Typography
                          variant="body2"
                          fontWeight={600}
                        >
                          {r.name}
                        </Typography>
                        {!r.isActive && (
                          <Chip
                            size="small"
                            color="default"
                            variant="outlined"
                            label={r.status}
                            sx={{ height: 18, fontSize: 10, textTransform: 'capitalize' }}
                          />
                        )}
                      </Stack>
                      {r.slug && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          {r.slug}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ ...numeric, fontWeight: 700 }}
                    >
                      {nf.format(r.usable)}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={numeric}
                    >
                      {nf.format(r.named)}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={numeric}
                    >
                      {nf.format(r.withPhone)}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={numeric}
                    >
                      {nf.format(r.active ?? 0)}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={numeric}
                    >
                      {nf.format(r.total)}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ ...numeric, minWidth: 120 }}
                    >
                      <Stack
                        direction="row"
                        gap={1}
                        alignItems="center"
                        justifyContent="flex-end"
                      >
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(100, r.usablePct)}
                          sx={{ width: 56, height: 6, borderRadius: 3 }}
                        />
                        <Typography
                          variant="body2"
                          sx={{ ...numeric, minWidth: 44, textAlign: 'right' }}
                        >
                          {r.usablePct}%
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title={`Exportar los clientes ${usableLabel} de esta tienda`}>
                        <span>
                          <IconButton
                            size="small"
                            disabled={!r.usable || !!busy}
                            onClick={() => exportStore(r)}
                          >
                            {busy === r.storeId ? (
                              <CircularProgress size={16} />
                            ) : (
                              <DownloadRoundedIcon fontSize="small" />
                            )}
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {!rows.length && (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      align="center"
                    >
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ py: 3 }}
                      >
                        {search
                          ? 'Ninguna tienda coincide con la búsqueda.'
                          : storeFilter === 'inactive'
                            ? 'No hay tiendas inactivas con clientes.'
                            : 'Sin datos.'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Stack>
      )}
    </PanelCard>
  );
}

function Stat(props: { label: string; value: number; sub?: string; highlight?: boolean }) {
  const { label, value, sub, highlight } = props;
  return (
    <Box
      sx={(t) => ({
        p: 1.5,
        borderRadius: 1.5,
        border: `1px solid ${t.palette.divider}`,
        bgcolor: highlight ? t.palette.primary.main + '14' : 'transparent',
        minWidth: 0,
      })}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        noWrap
        display="block"
        title={label}
      >
        {label}
      </Typography>
      <Typography
        variant="h5"
        fontWeight={700}
        color={highlight ? 'primary.main' : 'text.primary'}
        sx={numeric}
      >
        {nf.format(value)}
      </Typography>
      {sub && (
        <Typography
          variant="caption"
          color="text.secondary"
          noWrap
          display="block"
        >
          {sub}
        </Typography>
      )}
    </Box>
  );
}
