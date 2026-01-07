'use client';

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useStores } from '@/hooks/fetching/stores/useStores';
import { customerClient } from '@/services/customerService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

type ParsedCsv = {
  rawLines: string[];
  phoneNumbers: string[];
};

function getCustomerId(c: any): string {
  // El backend puede devolver _id (Mongo) o id (SQL / DTO).
  return (c?._id || c?.id || c?.customerId || '').toString();
}

function normalizePhone(input: string): string {
  const digits = (input || '').toString().replace(/\D/g, '');
  if (!digits) return '';
  // Si viene con 1 al inicio (US) y tiene 11 dígitos, lo bajamos a 10.
  if (digits.length === 11 && digits.startsWith('1')) return digits.slice(1);
  return digits;
}

function detectDelimiter(firstLine: string): ',' | ';' | '\t' {
  const comma = (firstLine.match(/,/g) || []).length;
  const semi = (firstLine.match(/;/g) || []).length;
  const tab = (firstLine.match(/\t/g) || []).length;
  if (tab >= comma && tab >= semi && tab > 0) return '\t';
  if (semi >= comma && semi > 0) return ';';
  return ',';
}

function splitLine(line: string, delim: string): string[] {
  // Split simple que respeta comillas dobles básicas
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (!inQuotes && ch === delim) {
      out.push(cur);
      cur = '';
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function parseCsv(text: string): ParsedCsv {
  const rawLines = (text || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (rawLines.length === 0) {
    return { rawLines: [], phoneNumbers: [] };
  }

  const delim = detectDelimiter(rawLines[0]);
  const headerCells = splitLine(rawLines[0], delim);
  const headerLooksLikeHeader = headerCells.some((c) => /[a-zA-Z]/.test(c));

  let phoneIdx = 0;
  let startAt = 0;

  if (headerLooksLikeHeader) {
    startAt = 1;
    const norm = headerCells.map((c) => c.toLowerCase().replace(/\s+/g, ''));
    phoneIdx = Math.max(
      norm.findIndex((c) => ['phone', 'phonenumber', 'number', 'telefono', 'tel'].includes(c)),
      0
    );
  }

  const phoneNumbers: string[] = [];
  for (let i = startAt; i < rawLines.length; i++) {
    const cells = splitLine(rawLines[i], delim);
    const candidate = (cells[phoneIdx] ?? cells[0] ?? '').toString();
    const n = normalizePhone(candidate);
    if (n) phoneNumbers.push(n);
  }

  // Dedup
  const deduped = Array.from(new Set(phoneNumbers));
  return { rawLines, phoneNumbers: deduped };
}

async function fetchAllCustomersByStore(storeId: string) {
  const pageSize = 500;
  let page = 1;
  let all: any[] = [];
  while (true) {
    const res: any = await customerClient.getCustomersByStore(storeId, page, pageSize);
    const data = res?.data || [];
    all = all.concat(data);
    const total = res?.total ?? all.length;
    if (!data.length || all.length >= total) break;
    page += 1;
    if (page > 2000) break; // safety
  }
  return all;
}

async function runWithConcurrency<T>(tasks: (() => Promise<T>)[], concurrency = 8) {
  const results: PromiseSettledResult<T>[] = [];
  let idx = 0;
  const workers = new Array(concurrency).fill(0).map(async () => {
    while (idx < tasks.length) {
      const my = idx++;
      try {
        const value = await tasks[my]();
        results[my] = { status: 'fulfilled', value };
      } catch (reason) {
        results[my] = { status: 'rejected', reason };
      }
    }
  });
  await Promise.all(workers);
  return results;
}

export default function DebugNumbers(): React.JSX.Element {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { data: stores, isPending: storesPending } = useStores();
  const [storeId, setStoreId] = useState('');

  const [storeSearch, setStoreSearch] = useState('');
  const filteredStores = useMemo(() => {
    const q = storeSearch.trim().toLowerCase();
    if (!q) return stores || [];
    return (stores || []).filter((s) => {
      const name = (s?.name || '').toString().toLowerCase();
      const id = (s?._id || '').toString().toLowerCase();
      return name.includes(q) || id.includes(q);
    });
  }, [stores, storeSearch]);

  const [numberSearch, setNumberSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const customersQuery = useQuery({
    queryKey: ['debug-customers-by-store', storeId],
    enabled: !!storeId,
    queryFn: () => fetchAllCustomersByStore(storeId),
    staleTime: 30_000,
  });

  const customers = customersQuery.data || [];
  const filteredCustomers = useMemo(() => {
    const raw = numberSearch.trim();
    const normQ = normalizePhone(raw);
    const qLower = raw.toLowerCase();

    return customers
      .filter((c: any) => {
        if (activeFilter === 'all') return true;
        if (activeFilter === 'active') return !!c?.active;
        return !c?.active;
      })
      .filter((c: any) => {
        if (!raw) return true;
        const p = (c?.phoneNumber || '').toString();
        const normP = normalizePhone(p);
        return (normQ && normP.includes(normQ)) || p.toLowerCase().includes(qLower);
      });
  }, [customers, numberSearch, activeFilter]);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  const pagedCustomers = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredCustomers.slice(start, start + rowsPerPage);
  }, [filteredCustomers, page, rowsPerPage]);

  useEffect(() => {
    // reset paginación cuando cambian filtros / tienda
    setPage(0);
  }, [storeId, numberSearch, activeFilter, rowsPerPage]);


  const [csvOpen, setCsvOpen] = useState(false);
  const [csv, setCsv] = useState<ParsedCsv | null>(null);
  const [summary, setSummary] = useState<null | {
    totalCsv: number;
    found: number;
    notFound: number;
    toDeactivate: number;
  }>(null);

  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [message, setMessage] = useState<null | { type: 'success' | 'error' | 'info'; text: string }>(
    null
  );

  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());

  // Nota: el backend de producción responde 404 a PATCH /customers/:id.
  // Para cambiar el estado usamos el endpoint existente: POST /customers/upsert
  // enviando el customer con el campo "active".
  const updateActive = useMutation({
    mutationFn: ({ customer, active }: { customer: any; active: boolean }) => {
      const phoneNumber = (customer?.phoneNumber || '').toString();
      const countryCode = (customer?.countryCode || '').toString() || '1';
      const storesArr = Array.isArray(customer?.stores) && customer.stores.length ? customer.stores : storeId ? [storeId] : [];

      return customerClient.upsertCustomer({
        phoneNumber,
        firstName: customer?.firstName,
        countryCode,
        stores: storesArr,
        active,
      });
    },
    onMutate: async ({ customer, active }) => {
      // optimistic update
      await qc.cancelQueries({ queryKey: ['debug-customers-by-store', storeId] });
      const previous = qc.getQueryData<any[]>(['debug-customers-by-store', storeId]);
      const id = getCustomerId(customer);
      qc.setQueryData<any[]>(['debug-customers-by-store', storeId], (old) =>
        (old || []).map((c: any) => (getCustomerId(c) === id ? { ...c, active } : c))
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(['debug-customers-by-store', storeId], ctx.previous);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['debug-customers-by-store', storeId] });
    },
  });

  const isToggling = (id: string) => togglingIds.has(id);

  async function handleToggleActive(customer: any, nextActive: boolean) {
    setMessage(null);
    const id = getCustomerId(customer);
    setTogglingIds((prev) => {
      const copy = new Set(prev);
      copy.add(id);
      return copy;
    });
    try {
      await updateActive.mutateAsync({ customer, active: nextActive });
    } catch (e) {
      console.error(e);
      const anyErr: any = e;
      const serverMsg = anyErr?.response?.data?.message || anyErr?.response?.data?.error;
      const status = anyErr?.response?.status;
      setMessage({
        type: 'error',
        text: serverMsg
          ? `No se pudo actualizar el estado del número (${status ?? 'error'}): ${serverMsg}`
          : 'No se pudo actualizar el estado del número. Revisa la consola para más detalles.',
      });
    } finally {
      setTogglingIds((prev) => {
        const copy = new Set(prev);
        copy.delete(id);
        return copy;
      });
    }
  }

  async function handlePickCsvFile(file: File) {
    setMessage(null);
    setSummary(null);
    setCsv(null);

    const text = await file.text();
    const parsed = parseCsv(text);
    setCsv(parsed);

    if (parsed.phoneNumbers.length === 0) {
      setMessage({ type: 'error', text: 'No se encontraron números válidos en el CSV.' });
      return;
    }

    if (!storeId) {
      setMessage({ type: 'error', text: 'Selecciona una tienda antes de procesar el CSV.' });
      return;
    }

    setProcessing(true);
    try {
      const customers = customersQuery.data ?? (await fetchAllCustomersByStore(storeId));
      const phoneToIds = new Map<string, string[]>();

      for (const c of customers) {
        const phoneNorm = normalizePhone(c?.phoneNumber ?? '');
        if (!phoneNorm) continue;
        const list = phoneToIds.get(phoneNorm) || [];
        const id = getCustomerId(c);
        if (id) list.push(id);
        phoneToIds.set(phoneNorm, list);
      }

      const foundIds = new Set<string>();
      let found = 0;
      let notFound = 0;
      for (const p of parsed.phoneNumbers) {
        const ids = phoneToIds.get(p);
        if (ids && ids.length) {
          found += 1;
          ids.forEach((id) => foundIds.add(id));
        } else {
          notFound += 1;
        }
      }

      setSummary({
        totalCsv: parsed.phoneNumbers.length,
        found,
        notFound,
        toDeactivate: foundIds.size,
      });

      setMessage({
        type: 'info',
        text: 'Listo. Revisa el resumen y luego presiona “Inactivar encontrados”.',
      });
    } catch (e) {
      console.error(e);
      setMessage({ type: 'error', text: 'No se pudo procesar el CSV. Revisa la consola.' });
    } finally {
      setProcessing(false);
    }
  }

  async function handleDeactivate() {
    if (!csv || !storeId) return;
    setMessage(null);
    setProcessing(true);
    setProgress({ done: 0, total: 0 });

    try {
      const customers = customersQuery.data ?? (await fetchAllCustomersByStore(storeId));
      const phoneToCustomers = new Map<string, any[]>();
      for (const c of customers) {
        const p = normalizePhone(c?.phoneNumber ?? '');
        if (!p) continue;
        const arr = phoneToCustomers.get(p) || [];
        arr.push(c);
        phoneToCustomers.set(p, arr);
      }

      const targets: any[] = [];
      for (const p of csv.phoneNumbers) {
        const arr = phoneToCustomers.get(p);
        if (arr?.length) targets.push(...arr);
      }

      const unique = Array.from(new Map(targets.map((c) => [getCustomerId(c), c])).values()).filter(
        (c) => !!getCustomerId(c)
      );
      setProgress({ done: 0, total: unique.length });

      const tasks = unique.map((c) => async () => {
        const res = await updateActive.mutateAsync({ customer: c, active: false });
        setProgress((prev) => ({ ...prev, done: prev.done + 1 }));
        return res;
      });

      const settled = await runWithConcurrency(tasks, 8);
      const ok = settled.filter((r) => r.status === 'fulfilled').length;
      const bad = settled.filter((r) => r.status === 'rejected').length;

      // refrescar tabla (debug) + opcionalmente customers estándar si existe en otras pantallas
      qc.invalidateQueries({ queryKey: ['debug-customers-by-store', storeId] });
      qc.invalidateQueries({ queryKey: ['customers', storeId] });

      setMessage({
        type: bad ? 'error' : 'success',
        text: bad
          ? `Proceso terminado con errores. Éxitos: ${ok}, Fallos: ${bad}.`
          : `Listo. Se inactivaron ${ok} customer(s).`,
      });
    } catch (e) {
      console.error(e);
      setMessage({ type: 'error', text: 'No se pudo inactivar. Revisa la consola.' });
    } finally {
      setProcessing(false);
    }
  }

  return (
    <Box>
      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h5">Debug numbers</Typography>
            <Typography color="text.secondary" variant="body2">
              Selecciona una tienda, revisa los customers y opcionalmente sube un CSV con números para
              inactivar en lote.
            </Typography>

            <Divider />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
              <TextField
                size="small"
                label="Buscar tienda"
                value={storeSearch}
                onChange={(e) => {
                  setStoreSearch(e.target.value);
                }}
                sx={{ minWidth: 260 }}
                disabled={storesPending}
              />

              <FormControl size="small" sx={{ minWidth: 260 }} disabled={storesPending}>
                <InputLabel id="debug-store-select">Store</InputLabel>
                <Select
                  labelId="debug-store-select"
                  label="Store"
                  value={storeId}
                  onChange={(e) => {
                    setStoreId(e.target.value);
                    setMessage(null);
                    setCsv(null);
                    setSummary(null);
                  }}
                >
                  {filteredStores.map((s) => (
                    <MenuItem key={s._id} value={s._id}>
                      {s.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                size="small"
                label="Buscar número"
                value={numberSearch}
                onChange={(e) => setNumberSearch(e.target.value)}
                sx={{ minWidth: 220 }}
                disabled={!storeId || customersQuery.isPending}
              />

              <FormControl size="small" sx={{ minWidth: 200 }} disabled={!storeId || customersQuery.isPending}>
                <InputLabel id="debug-active-filter">Estado</InputLabel>
                <Select
                  labelId="debug-active-filter"
                  label="Estado"
                  value={activeFilter}
                  onChange={(e) => setActiveFilter(e.target.value as any)}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="active">Activos</MenuItem>
                  <MenuItem value="inactive">Inactivos</MenuItem>
                </Select>
              </FormControl>

              <Box flex={1} />

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    setCsvOpen(true);
                    void handlePickCsvFile(f);
                  }
                  // permitir volver a subir el mismo archivo
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
              />

              <Button
                variant="contained"
                onClick={() => fileInputRef.current?.click()}
                disabled={!storeId || processing}
              >
                Subir CSV
              </Button>
            </Stack>

            {message ? (
              <Alert severity={message.type}>{message.text}</Alert>
            ) : null}

            {processing ? <LinearProgress /> : null}

            {storeId ? (
              <Box mt={1}>
                {customersQuery.isPending ? (
                  <Box display="flex" alignItems="center" gap={2} py={2}>
                    <CircularProgress size={20} />
                    <Typography variant="body2" color="text.secondary">
                      Cargando customers…
                    </Typography>
                  </Box>
                ) : customersQuery.isError ? (
                  <Alert severity="error">No se pudieron cargar los customers de esta tienda.</Alert>
                ) : (
                  <Card variant="outlined">
                    <CardContent>
                      <Stack spacing={1.5}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Mostrando {filteredCustomers.length} customer(s)
                          {numberSearch ? ' (filtrado)' : ''}
                        </Typography>

                        <TableContainer component={Paper} variant="outlined">
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Phone</TableCell>
                                <TableCell>Active</TableCell>
                                <TableCell>Created At</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {pagedCustomers.map((c: any) => {
                                const id = getCustomerId(c);
                                return (
                                <TableRow key={id || c?.phoneNumber}>
                                  <TableCell>{c?.phoneNumber || '—'}</TableCell>
                                  <TableCell>
                                    <Switch
                                      checked={!!c?.active}
                                      onChange={(e) =>
                                        id ? void handleToggleActive(c, e.target.checked) : undefined
                                      }
                                      disabled={!id || isToggling(id) || processing}
                                      inputProps={{ 'aria-label': 'toggle active' }}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    {c?.createdAt ? new Date(c.createdAt).toLocaleString() : '—'}
                                  </TableCell>
                                </TableRow>
                              );
                              })}
                              {pagedCustomers.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={3}>
                                    <Typography variant="body2" color="text.secondary">
                                      No hay resultados.
                                    </Typography>
                                  </TableCell>
                                </TableRow>
                              ) : null}
                            </TableBody>
                          </Table>
                        </TableContainer>

                        <TablePagination
                          component="div"
                          count={filteredCustomers.length}
                          page={page}
                          onPageChange={(_, p) => setPage(p)}
                          rowsPerPage={rowsPerPage}
                          onRowsPerPageChange={(e) => {
                            const v = parseInt(e.target.value, 10);
                            setRowsPerPage(Number.isFinite(v) ? v : 50);
                            setPage(0);
                          }}
                          rowsPerPageOptions={[25, 50, 100, 200]}
                        />
                      </Stack>
                    </CardContent>
                  </Card>
                )}
              </Box>
            ) : (
              <Box py={6} textAlign="center">
                <Typography color="text.secondary">Selecciona una tienda para ver sus customers.</Typography>
              </Box>
            )}
          </Stack>
        </CardContent>
      </Card>

      <Dialog open={csvOpen} onClose={() => setCsvOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Inactivar por CSV</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            {!storeId ? (
              <Alert severity="warning">Selecciona una tienda primero.</Alert>
            ) : null}

            {processing && !summary ? (
              <Box display="flex" alignItems="center" gap={2}>
                <CircularProgress size={20} />
                <Typography variant="body2" color="text.secondary">
                  Procesando CSV…
                </Typography>
              </Box>
            ) : null}

            {summary ? (
              <Card variant="outlined">
                <CardContent>
                  <Stack spacing={1}>
                    <Typography variant="subtitle1">Resumen</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Números únicos en CSV: <b>{summary.totalCsv}</b>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Números encontrados (match por phoneNumber): <b>{summary.found}</b>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Números no encontrados: <b>{summary.notFound}</b>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Customers a inactivar (IDs únicos): <b>{summary.toDeactivate}</b>
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            ) : null}

            {progress.total > 0 ? (
              <Typography variant="body2" color="text.secondary">
                Progreso: {progress.done}/{progress.total}
              </Typography>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCsvOpen(false)} disabled={processing}>
            Cerrar
          </Button>
          <Button
            variant="contained"
            onClick={() => void handleDeactivate()}
            disabled={!summary?.toDeactivate || processing}
          >
            Inactivar encontrados
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
