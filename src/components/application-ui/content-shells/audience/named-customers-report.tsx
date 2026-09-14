'use client';

/**
 * Qué tiendas tienen clientes con nombre.
 *
 * Sirve para saber dónde se puede personalizar un mensaje ("Hola Juan") y dónde
 * no. Un cliente cuenta como "con nombre" con la misma regla que usa el
 * placeholder `#name` al enviar: 2+ letras y que no sea un alta automática
 * ("Cliente", "Demo", "Test"...). Si acá suma, allá recibe su nombre.
 *
 * El total por tienda cuenta pertenencias, no personas: un número que está en
 * tres tiendas suma en las tres. Es lo que corresponde, porque el reporte se
 * lee y se exporta tienda por tienda.
 */
import { PanelCard, numeric } from '@/components/audience/ui';
import { customerClient, type NamedByStoreRow } from '@/services/customerService';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
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
  TextField,
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

export default function NamedCustomersReport(): React.JSX.Element {
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [exportError, setExportError] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['customers', 'named-by-store'],
    queryFn: () => customerClient.getNamedByStore(),
    staleTime: 300_000,
    refetchOnWindowFocus: false,
  });

  const rows = useMemo(() => {
    const all = data?.data ?? [];
    const term = search.trim().toLowerCase();
    if (!term) return all;
    return all.filter(
      (r) => r.name.toLowerCase().includes(term) || r.slug.toLowerCase().includes(term)
    );
  }, [data, search]);

  const totals = data?.totals;

  /** Hoja resumen: una fila por tienda, tal como se ve en pantalla. */
  const exportSummary = async () => {
    setBusy('summary');
    setExportError('');
    try {
      const { utils, writeFile } = await import('xlsx');
      const sheet = utils.json_to_sheet(
        rows.map((r) => ({
          Tienda: r.name,
          Slug: r.slug,
          'Clientes con nombre y teléfono': r.namedWithPhone,
          'Clientes con nombre': r.named,
          'Clientes con teléfono': r.withPhone,
          'Total de clientes': r.total,
          '% con nombre': r.namedPct,
          'ID de tienda': r.storeId,
        }))
      );
      const wb = utils.book_new();
      utils.book_append_sheet(wb, sheet, 'Resumen');
      writeFile(wb, `clientes_con_nombre_${stamp()}.xlsx`);
    } catch {
      setExportError('No se pudo generar el archivo.');
    } finally {
      setBusy(null);
    }
  };

  /** Detalle de una tienda: nombre, apellido y teléfono de cada cliente. */
  const exportStore = async (row: NamedByStoreRow) => {
    setBusy(row.storeId);
    setExportError('');
    try {
      const [{ utils, writeFile }, customers] = await Promise.all([
        import('xlsx'),
        customerClient.getNamedStoreCustomers(row.storeId),
      ]);
      const wb = utils.book_new();
      utils.book_append_sheet(
        wb,
        utils.json_to_sheet(
          customers.map((c) => ({
            Nombre: c.firstName ?? '',
            Apellido: c.lastName ?? '',
            Teléfono: c.phoneNumber ?? '',
            Email: c.email ?? '',
            Activo: c.active ? 'Sí' : 'No',
          }))
        ),
        sheetName(row.name, 'Clientes')
      );
      writeFile(wb, `clientes_${row.slug || row.storeId}_${stamp()}.xlsx`);
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
    const withData = rows.filter((r) => r.namedWithPhone > 0);
    if (!withData.length) return;
    setBusy('all');
    setExportError('');
    setProgress({ done: 0, total: withData.length });
    try {
      const { utils, writeFile } = await import('xlsx');
      const wb = utils.book_new();
      utils.book_append_sheet(
        wb,
        utils.json_to_sheet(
          withData.map((r) => ({
            Tienda: r.name,
            'Clientes con nombre y teléfono': r.namedWithPhone,
            'Total de clientes': r.total,
          }))
        ),
        'Resumen'
      );

      const used = new Set<string>();
      for (let i = 0; i < withData.length; i++) {
        const row = withData[i];
        const customers = await customerClient.getNamedStoreCustomers(row.storeId);
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

        utils.book_append_sheet(
          wb,
          utils.json_to_sheet(
            customers.map((c) => ({
              Nombre: c.firstName ?? '',
              Apellido: c.lastName ?? '',
              Teléfono: c.phoneNumber ?? '',
              Email: c.email ?? '',
            }))
          ),
          title
        );
        setProgress({ done: i + 1, total: withData.length });
      }
      writeFile(wb, `clientes_con_nombre_detalle_${stamp()}.xlsx`);
    } catch {
      setExportError('Se cortó la descarga del detalle. Probá de a una tienda.');
    } finally {
      setBusy(null);
      setProgress(null);
    }
  };

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
        >
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
          <Button
            size="small"
            variant="contained"
            startIcon={busy === 'all' ? <CircularProgress size={14} /> : <DownloadRoundedIcon />}
            disabled={!rows.length || !!busy}
            onClick={exportEverything}
          >
            Con nombres y teléfonos
          </Button>
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
          {totals && (
            <Stack
              direction="row"
              gap={1}
              flexWrap="wrap"
            >
              <Chip
                size="small"
                label={`${nf.format(totals.stores)} tiendas`}
              />
              <Chip
                size="small"
                color="primary"
                label={`${nf.format(totals.namedWithPhone)} con nombre y teléfono`}
              />
              <Chip
                size="small"
                variant="outlined"
                label={`${nf.format(totals.named)} con nombre`}
              />
              <Chip
                size="small"
                variant="outlined"
                label={`${nf.format(totals.withPhone)} con teléfono`}
              />
              <Chip
                size="small"
                variant="outlined"
                label={`${nf.format(totals.total)} contactos en total`}
              />
            </Stack>
          )}

          <TextField
            size="small"
            fullWidth
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar tienda…"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />

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

          <TableContainer sx={{ maxHeight: 520 }}>
            <Table
              size="small"
              stickyHeader
            >
              <TableHead>
                <TableRow>
                  <TableCell>Tienda</TableCell>
                  <TableCell align="right">Con nombre y teléfono</TableCell>
                  <TableCell align="right">Con nombre</TableCell>
                  <TableCell align="right">Con teléfono</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell align="right">% con nombre</TableCell>
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r) => (
                  <TableRow
                    key={r.storeId}
                    hover
                  >
                    <TableCell>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                      >
                        {r.name}
                      </Typography>
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
                      {nf.format(r.namedWithPhone)}
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
                      {nf.format(r.total)}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={numeric}
                    >
                      {r.namedPct}%
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Exportar los clientes de esta tienda">
                        <span>
                          <IconButton
                            size="small"
                            disabled={!r.namedWithPhone || !!busy}
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
                      colSpan={7}
                      align="center"
                    >
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ py: 3 }}
                      >
                        {search ? 'Ninguna tienda coincide con la búsqueda.' : 'Sin datos.'}
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
