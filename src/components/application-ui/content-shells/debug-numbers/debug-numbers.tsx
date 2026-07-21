'use client';

import { useStores } from '@/hooks/fetching/stores/useStores';
import { customerClient } from '@/services/customerService';
import FileUploadRoundedIcon from '@mui/icons-material/FileUploadRounded';
import ManageSearchRoundedIcon from '@mui/icons-material/ManageSearchRounded';
import {
  Alert,
  alpha,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
  useTheme } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';

type ParsedCsv = {
  rawLines: string[];
  phoneNumbers: string[];
};

type CsvMode = 'listed' | 'except-listed';

type CsvSummary = {
  mode: CsvMode;
  totalCsv: number;
  found: number;
  notFound: number;
  toDeactivate: number;
  toKeep: number;
};

const BULK_UPDATE_DELAY_MS = 15_000;
const RATE_LIMIT_RETRY_DELAY_MS = 120_000;
const RATE_LIMIT_MAX_RETRIES = 2;
const BULK_UPDATE_CONCURRENCY = 1;

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

function parseRows(rows: unknown[][]): ParsedCsv {
  const normalizedRows = rows
    .map((row) => row.map((cell) => (cell ?? '').toString().trim()))
    .filter((row) => row.some(Boolean));

  if (normalizedRows.length === 0) {
    return { rawLines: [], phoneNumbers: [] };
  }

  const headerCells = normalizedRows[0];
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
  for (let i = startAt; i < normalizedRows.length; i++) {
    const candidate = (normalizedRows[i][phoneIdx] ?? normalizedRows[i][0] ?? '').toString();
    const n = normalizePhone(candidate);
    if (n) phoneNumbers.push(n);
  }

  return {
    rawLines: normalizedRows.map((row) => row.join(',')),
    phoneNumbers: Array.from(new Set(phoneNumbers)),
  };
}

async function parsePhoneFile(file: File): Promise<ParsedCsv> {
  const lowerName = file.name.toLowerCase();
  if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const sheet = sheetName ? workbook.Sheets[sheetName] : null;
    if (!sheet) return { rawLines: [], phoneNumbers: [] };
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false });
    return parseRows(rows);
  }

  const text = await file.text();
  return parseCsv(text);
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

function toImportCustomer(customer: any, active: boolean) {
  return {
    phoneNumber: (customer?.phoneNumber || '').toString(),
    firstName: customer?.firstName,
    countryCode: (customer?.countryCode || '').toString() || '1',
    stores: Array.isArray(customer?.stores) && customer.stores.length ? customer.stores : [],
    active,
  };
}

const sleep = (ms: number) => new Promise((resolve) => {
  window.setTimeout(resolve, ms);
});

function isRateLimitedError(reason: any) {
  const status = reason?.response?.status;
  const code = reason?.response?.data?.code || reason?.response?.data?.error || reason?.message;
  return status === 429 || String(code || '').toUpperCase().includes('RATE_LIMIT');
}

async function runWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  concurrency = BULK_UPDATE_CONCURRENCY,
  delayMs = BULK_UPDATE_DELAY_MS
) {
  const results: PromiseSettledResult<T>[] = [];
  let idx = 0;
  let stopForRateLimit = false;
  const workers = new Array(concurrency).fill(0).map(async () => {
    while (idx < tasks.length) {
      const my = idx++;
      if (stopForRateLimit) {
        results[my] = { status: 'rejected', reason: new Error('Bulk process stopped after persistent RATE_LIMITED response.') };
        continue;
      }
      try {
        let value: T;
        let attempts = 0;
        while (true) {
          try {
            value = await tasks[my]();
            break;
          } catch (reason) {
            if (!isRateLimitedError(reason)) throw reason;
            attempts += 1;
            if (attempts > RATE_LIMIT_MAX_RETRIES) {
              stopForRateLimit = true;
              throw reason;
            }
            await sleep(RATE_LIMIT_RETRY_DELAY_MS);
          }
        }
        results[my] = { status: 'fulfilled', value };
      } catch (reason) {
        results[my] = { status: 'rejected', reason };
      } finally {
        if (idx < tasks.length && delayMs > 0) {
          await sleep(delayMs);
        }
      }
    }
  });
  await Promise.all(workers);
  return results;
}

export default function DebugNumbers(): React.JSX.Element {
  const theme = useTheme();
  const brandPink = theme.palette.primary.main;
  const brandPinkDark = theme.palette.primary.dark;
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const csvModeRef = useRef<CsvMode>('listed');

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

  const selectedStore = useMemo(
    () => (stores || []).find((s) => (s?._id || '').toString() === storeId) || null,
    [stores, storeId]
  );

  const [numberSearch, setNumberSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [duplicatesOnly, setDuplicatesOnly] = useState(false);
  const {
    data: customersData,
    isPending: customersPending,
    isFetching: customersFetching,
    isError: customersError,
  } = useQuery({
    queryKey: ['debug-customers-by-store', storeId],
    enabled: !!storeId,
    queryFn: () => fetchAllCustomersByStore(storeId),
    staleTime: 30_000,
  });

  const customers = useMemo(() => customersData || [], [customersData]);
  const duplicatePhones = useMemo(() => {
    const groups = new Map<string, any[]>();
    for (const c of customers) {
      const normalized = normalizePhone(c?.phoneNumber ?? '');
      if (!normalized) continue;
      const group = groups.get(normalized) || [];
      group.push(c);
      groups.set(normalized, group);
    }

    const duplicates = new Map<string, any[]>();
    groups.forEach((group, normalized) => {
      if (group.length > 1) duplicates.set(normalized, group);
    });
    return duplicates;
  }, [customers]);

  const duplicateCustomerCount = useMemo(
    () => Array.from(duplicatePhones.values()).reduce((total, group) => total + group.length, 0),
    [duplicatePhones]
  );

  const filteredDuplicateGroups = useMemo(() => {
    const raw = numberSearch.trim();
    const normQ = normalizePhone(raw);
    const qLower = raw.toLowerCase();

    return Array.from(duplicatePhones.entries())
      .map(([normalizedPhone, group]) => {
        const visibleCustomers = group
          .filter((c: any) => {
            if (activeFilter === 'all') return true;
            if (activeFilter === 'active') return !!c?.active;
            return !c?.active;
          })
          .filter((c: any) => {
            if (!raw) return true;
            const p = (c?.phoneNumber || '').toString();
            const normP = normalizePhone(p);
            return (
              normalizedPhone.includes(normQ) ||
              (normQ && normP.includes(normQ)) ||
              p.toLowerCase().includes(qLower)
            );
          });

        return {
          normalizedPhone,
          visibleCustomers,
          totalCustomers: group.length,
        };
      })
      .filter((group) => group.visibleCustomers.length > 0)
      .sort((a, b) => b.totalCustomers - a.totalCustomers);
  }, [activeFilter, duplicatePhones, numberSearch]);

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
        if (!duplicatesOnly) return true;
        const normalized = normalizePhone(c?.phoneNumber ?? '');
        return !!normalized && duplicatePhones.has(normalized);
      })
      .filter((c: any) => {
        if (!raw) return true;
        const p = (c?.phoneNumber || '').toString();
        const normP = normalizePhone(p);
        return (normQ && normP.includes(normQ)) || p.toLowerCase().includes(qLower);
      });
  }, [customers, numberSearch, activeFilter, duplicatesOnly, duplicatePhones]);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  const pagedCustomers = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredCustomers.slice(start, start + rowsPerPage);
  }, [filteredCustomers, page, rowsPerPage]);

  const pagedDuplicateGroups = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredDuplicateGroups.slice(start, start + rowsPerPage);
  }, [filteredDuplicateGroups, page, rowsPerPage]);

  useEffect(() => {
    // reset paginación cuando cambian filtros / tienda
    setPage(0);
  }, [storeId, numberSearch, activeFilter, duplicatesOnly, rowsPerPage]);

  const [csvOpen, setCsvOpen] = useState(false);
  const [csv, setCsv] = useState<ParsedCsv | null>(null);
  const [csvMode, setCsvMode] = useState<CsvMode>('listed');
  const [summary, setSummary] = useState<null | CsvSummary>(null);

  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [message, setMessage] = useState<null | {
    type: 'success' | 'error' | 'info';
    text: string;
  }>(null);

  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());

  // Nota: el backend de producción responde 404 a PATCH /customers/:id.
  // Para cambiar el estado usamos el endpoint existente: POST /customers/upsert
  // enviando el customer con el campo "active".
  const updateActive = useMutation({
    mutationFn: ({ customer, active }: { customer: any; active: boolean }) => {
      const phoneNumber = (customer?.phoneNumber || '').toString();
      const countryCode = (customer?.countryCode || '').toString() || '1';
      const storesArr =
        Array.isArray(customer?.stores) && customer.stores.length
          ? customer.stores
          : storeId
            ? [storeId]
            : [];

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

  function openCsvPicker(mode: CsvMode) {
    csvModeRef.current = mode;
    setCsvMode(mode);
    fileInputRef.current?.click();
  }

  async function handlePickCsvFile(file: File, mode: CsvMode) {
    setMessage(null);
    setSummary(null);
    setCsv(null);
    setCsvMode(mode);

    const parsed = await parsePhoneFile(file);
    setCsv(parsed);

    if (parsed.phoneNumbers.length === 0) {
      setMessage({ type: 'error', text: 'No se encontraron números válidos en el archivo.' });
      return;
    }

    if (!storeId) {
      setMessage({ type: 'error', text: 'Selecciona una tienda antes de procesar el archivo.' });
      return;
    }

    setProcessing(true);
    try {
      const customers = customersData ?? (await fetchAllCustomersByStore(storeId));
      const phoneToIds = new Map<string, string[]>();
      const csvPhones = new Set(parsed.phoneNumbers);

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

      const toDeactivate =
        mode === 'listed'
          ? foundIds.size
          : customers.filter((c) => {
            const id = getCustomerId(c);
            const phoneNorm = normalizePhone(c?.phoneNumber ?? '');
            return id && c?.active && (!phoneNorm || !csvPhones.has(phoneNorm));
          }).length;

      setSummary({
        mode,
        totalCsv: parsed.phoneNumbers.length,
        found,
        notFound,
        toDeactivate,
        toKeep: foundIds.size,
      });

      setMessage({
        type: 'info',
        text:
          mode === 'listed'
            ? 'Listo. Revisa el resumen y luego presiona "Inactivar encontrados".'
            : 'Listo. Revisa el resumen y luego presiona "Inactivar excepto archivo".',
      });
    } catch (e) {
      console.error(e);
      setMessage({ type: 'error', text: 'No se pudo procesar el archivo. Revisa la consola.' });
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
      const customers = customersData ?? (await fetchAllCustomersByStore(storeId));
      const phoneToCustomers = new Map<string, any[]>();
      const csvPhones = new Set(csv.phoneNumbers);
      for (const c of customers) {
        const p = normalizePhone(c?.phoneNumber ?? '');
        if (!p) continue;
        const arr = phoneToCustomers.get(p) || [];
        arr.push(c);
        phoneToCustomers.set(p, arr);
      }

      const targets: any[] = [];
      if (csvMode === 'listed') {
        for (const p of csv.phoneNumbers) {
          const arr = phoneToCustomers.get(p);
          if (arr?.length) targets.push(...arr);
        }
      } else {
        for (const c of customers) {
          const phoneNorm = normalizePhone(c?.phoneNumber ?? '');
          if (c?.active && (!phoneNorm || !csvPhones.has(phoneNorm))) {
            targets.push(c);
          }
        }
      }

      const unique = Array.from(new Map(targets.map((c) => [getCustomerId(c), c])).values()).filter(
        (c) => !!getCustomerId(c)
      );
      setProgress({ done: 0, total: unique.length });

      const importRows = unique.map((c) => toImportCustomer(c, false));
      const result = await customerClient.importCustomers(storeId, importRows, (done, total) => {
        setProgress({ done, total });
      });
      const ok = result.updated + result.inserted;
      const bad = result.failed;

      // refrescar tabla (debug) + opcionalmente customers estándar si existe en otras pantallas
      qc.invalidateQueries({ queryKey: ['debug-customers-by-store', storeId] });
      qc.invalidateQueries({ queryKey: ['customers', storeId] });

      setMessage({
        type: bad ? 'error' : 'success',
        text: bad
          ? `Proceso terminado con errores. Exitos: ${ok}, Fallos: ${bad}.`
          : csvMode === 'listed'
            ? `Listo. Se inactivaron ${ok} customer(s).`
            : `Listo. Se inactivaron ${ok} customer(s) fuera del archivo.`,
      });
    } catch (e) {
      console.error(e);
      setMessage({ type: 'error', text: 'No se pudo inactivar. Revisa la consola.' });
    } finally {
      setProcessing(false);
    }
  }

  async function handleDeactivateDuplicates() {
    if (!storeId || duplicatePhones.size === 0) return;
    setMessage(null);
    setProcessing(true);
    setProgress({ done: 0, total: 0 });

    try {
      const tasks: (() => Promise<any>)[] = [];
      let groupsWithoutNormalized = 0;

      duplicatePhones.forEach((group, normalizedPhone) => {
        const keeper =
          group.find((c: any) => (c?.phoneNumber || '').toString().trim() === normalizedPhone) ||
          group[0];
        const keeperId = getCustomerId(keeper);

        if (keeperId && !keeper?.active) {
          tasks.push(async () => {
            const res = await updateActive.mutateAsync({ customer: keeper, active: true });
            setProgress((prev) => ({ ...prev, done: prev.done + 1 }));
            return res;
          });
        }

        if ((keeper?.phoneNumber || '').toString().trim() !== normalizedPhone) {
          groupsWithoutNormalized += 1;
        }

        group.forEach((customer: any) => {
          const id = getCustomerId(customer);
          if (!id || id === keeperId || !customer?.active) return;
          tasks.push(async () => {
            const res = await updateActive.mutateAsync({ customer, active: false });
            setProgress((prev) => ({ ...prev, done: prev.done + 1 }));
            return res;
          });
        });
      });

      if (tasks.length === 0) {
        setMessage({
          type: 'info',
          text: 'Los duplicados ya estaban inactivos o solo quedaba activo el numero principal.',
        });
        return;
      }

      setProgress({ done: 0, total: tasks.length });
      const settled = await runWithConcurrency(tasks);
      const ok = settled.filter((r) => r.status === 'fulfilled').length;
      const bad = settled.filter((r) => r.status === 'rejected').length;
      const stoppedByRateLimit = settled.some((r) => r.status === 'rejected' && isRateLimitedError(r.reason));

      qc.invalidateQueries({ queryKey: ['debug-customers-by-store', storeId] });
      qc.invalidateQueries({ queryKey: ['customers', storeId] });

      setMessage({
        type: bad ? 'error' : 'success',
        text: stoppedByRateLimit
          ? `Proceso pausado por RATE_LIMITED persistente para proteger tu sesion. Exitos: ${ok}, pendientes/fallos: ${bad}. Espera unos minutos antes de reintentar.`
          : bad
            ? `Proceso terminado con errores. Exitos: ${ok}, Fallos: ${bad}.`
          : groupsWithoutNormalized
            ? `Listo. Se actualizaron ${ok} customer(s). ${groupsWithoutNormalized} grupo(s) no tenian un numero escrito exactamente normalizado, asi que se conservo uno como principal.`
            : `Listo. Se desactivaron duplicados y se dejo activo el numero normalizado.`,
      });
    } catch (e) {
      console.error(e);
      setMessage({
        type: 'error',
        text: 'No se pudieron desactivar los duplicados. Revisa la consola.',
      });
    } finally {
      setProcessing(false);
    }
  }

  return (
    <Box sx={{ px: { xs: 2, sm: 3 }, py: 3 }}>
      <Card
        variant="outlined"
        sx={{
          bgcolor: 'background.paper',
          borderColor: 'divider',
        }}
      >
        <CardContent>
          <Stack spacing={2}>

            <Stack spacing={1.5}>
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={2}
                alignItems={{ md: 'center' }}
              >
                <Autocomplete
                  size="small"
                  options={filteredStores}
                  value={selectedStore}
                  inputValue={storeSearch}
                  loading={storesPending}
                  disabled={storesPending}
                  getOptionLabel={(option: any) => (option?.name || '').toString()}
                  isOptionEqualToValue={(option: any, value: any) => option?._id === value?._id}
                  noOptionsText="Sin coincidencias"
                  loadingText="Cargando tiendas..."
                  onInputChange={(_, value) => {
                    setStoreSearch(value);
                  }}
                  onChange={(_, value: any | null) => {
                    setStoreId(value?._id || '');
                    setStoreSearch(value?.name || '');
                    setDuplicatesOnly(false);
                    setMessage(null);
                    setCsv(null);
                    setSummary(null);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Buscar tienda"
                      placeholder="Escribe el nombre de la tienda"
                    />
                  )}
                  sx={{ minWidth: { xs: '100%', md: 420 }, flex: { md: '1.8 1 420px' } }}
                />

                <TextField
                  size="small"
                  label="Buscar número"
                  value={numberSearch}
                  onChange={(e) => setNumberSearch(e.target.value)}
                  sx={{ minWidth: { xs: '100%', md: 240 }, flex: { md: '1 1 240px' } }}
                  disabled={!storeId || customersPending}
                />

                <FormControl
                  size="small"
                  sx={{ minWidth: { xs: '100%', md: 200 }, flex: { md: '0 0 200px' } }}
                  disabled={!storeId || customersPending}
                >
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
              </Stack>

              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1.5}
                justifyContent="flex-end"
                alignItems={{ xs: 'stretch', sm: 'center' }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  aria-label="Subir archivo de numeros"
                  accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  hidden
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setCsvOpen(true);
                      void handlePickCsvFile(f, csvModeRef.current);
                    }
                    // permitir volver a subir el mismo archivo
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                />

                <Button
                  startIcon={<ManageSearchRoundedIcon />}
                  variant={duplicatesOnly ? 'contained' : 'outlined'}
                  onClick={() => {
                    if (!duplicatesOnly && duplicatePhones.size === 0) {
                      setMessage({
                        type: 'info',
                        text: 'No se encontraron telefonos repetidos en los customers cargados de esta tienda.',
                      });
                      return;
                    } else {
                      setMessage(null);
                    }
                    setDuplicatesOnly((value) => !value);
                  }}
                  disabled={!storeId || customersPending || customersFetching}
                  sx={{
                    whiteSpace: 'nowrap',
                    color: duplicatesOnly ? 'primary.contrastText' : brandPink,
                    bgcolor: duplicatesOnly ? brandPink : 'transparent',
                    borderColor: alpha(brandPink, 0.55),
                    '&:hover': {
                      bgcolor: duplicatesOnly ? brandPinkDark : alpha(brandPink, 0.08),
                      borderColor: brandPink,
                    },
                  }}
                >
                  {duplicatesOnly ? 'Ver todos' : 'Buscar repetidos'}
                </Button>

                <Button
                  variant="contained"
                  onClick={() => void handleDeactivateDuplicates()}
                  disabled={!storeId || processing || duplicatePhones.size === 0}
                  sx={{
                    bgcolor: brandPink,
                    whiteSpace: 'nowrap',
                    '&:hover': {
                      bgcolor: brandPinkDark,
                    },
                  }}
                >
                  Desactivar duplicados
                </Button>

                <Button
                  startIcon={<FileUploadRoundedIcon />}
                  variant="contained"
                  onClick={() => openCsvPicker('listed')}
                  disabled={!storeId || processing}
                  sx={{
                    bgcolor: brandPink,
                    '&:hover': {
                      bgcolor: brandPinkDark,
                    },
                  }}
                >
                  Desactivar desde archivo
                </Button>

                <Button
                  startIcon={<FileUploadRoundedIcon />}
                  variant="outlined"
                  onClick={() => openCsvPicker('except-listed')}
                  disabled={!storeId || processing}
                  sx={{
                    color: brandPink,
                    borderColor: alpha(brandPink, 0.55),
                    '&:hover': {
                      bgcolor: alpha(brandPink, 0.08),
                      borderColor: brandPink,
                    },
                  }}
                >
                  Desactivar excepto archivo
                </Button>
              </Stack>
            </Stack>

            {message ? <Alert severity={message.type}>{message.text}</Alert> : null}

            {processing ? <LinearProgress /> : null}

            {storeId ? (
              <Box mt={1}>
                {customersPending ? (
                  <Box
                    display="flex"
                    alignItems="center"
                    gap={2}
                    py={2}
                  >
                    <CircularProgress size={20} />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      Cargando customers…
                    </Typography>
                  </Box>
                ) : customersError ? (
                  <Alert severity="error">
                    No se pudieron cargar los customers de esta tienda.
                  </Alert>
                ) : (
                  <Card
                    variant="outlined"
                    sx={{
                      borderRadius: 2.5,
                      bgcolor: 'background.paper',
                      borderColor: 'divider',
                    }}
                  >
                    <CardContent>
                      <Stack spacing={1.5}>
                        <Stack
                          direction={{ xs: 'column', sm: 'row' }}
                          spacing={1}
                          alignItems={{ xs: 'flex-start', sm: 'center' }}
                          justifyContent="space-between"
                        >
                          <Box>
                            <Typography
                              variant="subtitle2"
                              color="text.primary"
                            >
                              {duplicatesOnly
                                ? `Mostrando ${filteredDuplicateGroups.length} grupo(s) repetido(s)`
                                : `Mostrando ${filteredCustomers.length} customer(s)`}
                              {numberSearch || duplicatesOnly ? ' filtrado(s)' : ''}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {customers.length} cargados de la tienda
                            </Typography>
                          </Box>
                          <Stack
                            direction="row"
                            spacing={1}
                            flexWrap="wrap"
                            useFlexGap
                          >
                            <Chip
                              color={duplicatePhones.size ? 'warning' : 'default'}
                              variant="outlined"
                              label={`${duplicatePhones.size} telefono(s) repetido(s)`}
                              sx={{
                                minHeight: 34,
                                px: 1,
                                bgcolor: alpha(brandPink, 0.08),
                                borderColor: alpha(brandPink, 0.45),
                                color: brandPink,
                                fontSize: 15,
                                fontWeight: 800,
                                '& .MuiChip-label': {
                                  px: 1.25,
                                },
                              }}
                            />
                            {duplicatesOnly ? (
                              <Chip
                                size="small"
                                color="warning"
                                variant="outlined"
                                label={`${filteredDuplicateGroups.length} grupo(s), ${duplicateCustomerCount} customer(s)`}
                              />
                            ) : null}
                          </Stack>
                        </Stack>

                        <TableContainer
                          component={Paper}
                          variant="outlined"
                          sx={{ borderRadius: 2, borderColor: 'divider' }}
                        >
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Phone</TableCell>
                                <TableCell>Normalizado</TableCell>
                                <TableCell>Active</TableCell>
                                <TableCell>Created At</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {duplicatesOnly
                                ? pagedDuplicateGroups.map((group) => (
                                  <React.Fragment key={group.normalizedPhone}>
                                    <TableRow
                                      sx={{
                                        bgcolor: alpha(theme.palette.warning.main, 0.12),
                                      }}
                                    >
                                      <TableCell colSpan={4}>
                                        <Stack
                                          direction={{ xs: 'column', sm: 'row' }}
                                          spacing={1}
                                          alignItems={{ xs: 'flex-start', sm: 'center' }}
                                          justifyContent="space-between"
                                        >
                                          <Stack
                                            direction="row"
                                            spacing={1}
                                            alignItems="center"
                                            flexWrap="wrap"
                                            useFlexGap
                                          >
                                            <Typography
                                              variant="subtitle2"
                                              fontFamily="monospace"
                                            >
                                              {group.normalizedPhone}
                                            </Typography>
                                            <Chip
                                              size="small"
                                              color="warning"
                                              label={`${group.totalCustomers} repetidos`}
                                              sx={{ fontWeight: 800 }}
                                            />
                                          </Stack>
                                          <Typography
                                            variant="caption"
                                            color="text.secondary"
                                          >
                                            Mostrando {group.visibleCustomers.length} de{' '}
                                            {group.totalCustomers}
                                          </Typography>
                                        </Stack>
                                      </TableCell>
                                    </TableRow>
                                    {group.visibleCustomers.map((c: any) => {
                                      const id = getCustomerId(c);
                                      return (
                                        <TableRow
                                          key={id || `${group.normalizedPhone}-${c?.phoneNumber}`}
                                          hover
                                          sx={{
                                            bgcolor: alpha(theme.palette.warning.main, 0.04),
                                          }}
                                        >
                                          <TableCell sx={{ pl: { xs: 2, sm: 4 } }}>
                                            {c?.phoneNumber || '-'}
                                          </TableCell>
                                          <TableCell>
                                            <Typography
                                              variant="body2"
                                              fontFamily="monospace"
                                            >
                                              {group.normalizedPhone}
                                            </Typography>
                                          </TableCell>
                                          <TableCell>
                                            <Switch
                                              checked={!!c?.active}
                                              onChange={(e) =>
                                                id
                                                  ? void handleToggleActive(c, e.target.checked)
                                                  : undefined
                                              }
                                              disabled={!id || isToggling(id) || processing}
                                              inputProps={{ 'aria-label': 'toggle active' }}
                                            />
                                          </TableCell>
                                          <TableCell>
                                            {c?.createdAt
                                              ? new Date(c.createdAt).toLocaleString()
                                              : '-'}
                                          </TableCell>
                                        </TableRow>
                                      );
                                    })}
                                  </React.Fragment>
                                ))
                                : pagedCustomers.map((c: any) => {
                                  const id = getCustomerId(c);
                                  const normalizedPhone = normalizePhone(c?.phoneNumber ?? '');
                                  const duplicateCount =
                                    duplicatePhones.get(normalizedPhone)?.length || 0;
                                  return (
                                    <TableRow
                                      key={id || c?.phoneNumber}
                                      hover
                                      sx={
                                        duplicateCount > 1
                                          ? {
                                            bgcolor: alpha(theme.palette.warning.main, 0.08),
                                            '&:hover': {
                                              bgcolor: alpha(theme.palette.warning.main, 0.14),
                                            },
                                          }
                                          : undefined
                                      }
                                    >
                                      <TableCell>{c?.phoneNumber || '—'}</TableCell>
                                      <TableCell>
                                        <Stack
                                          direction="row"
                                          spacing={1}
                                          alignItems="center"
                                        >
                                          <Typography
                                            variant="body2"
                                            fontFamily="monospace"
                                          >
                                            {normalizedPhone || '-'}
                                          </Typography>
                                          {duplicateCount > 1 ? (
                                            <Chip
                                              size="small"
                                              color="warning"
                                              label={`${duplicateCount}x`}
                                              sx={{ height: 22, fontWeight: 800 }}
                                            />
                                          ) : null}
                                        </Stack>
                                      </TableCell>
                                      <TableCell>
                                        <Switch
                                          checked={!!c?.active}
                                          onChange={(e) =>
                                            id
                                              ? void handleToggleActive(c, e.target.checked)
                                              : undefined
                                          }
                                          disabled={!id || isToggling(id) || processing}
                                          inputProps={{ 'aria-label': 'toggle active' }}
                                        />
                                      </TableCell>
                                      <TableCell>
                                        {c?.createdAt
                                          ? new Date(c.createdAt).toLocaleString()
                                          : '—'}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              {(
                                duplicatesOnly
                                  ? pagedDuplicateGroups.length === 0
                                  : pagedCustomers.length === 0
                              ) ? (
                                <TableRow>
                                  <TableCell colSpan={4}>
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                    >
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
                          count={
                            duplicatesOnly
                              ? filteredDuplicateGroups.length
                              : filteredCustomers.length
                          }
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
              <Box
                py={6}
                textAlign="center"
              >
                <Typography color="text.secondary">
                  Selecciona una tienda para ver sus customers.
                </Typography>
              </Box>
            )}
          </Stack>
        </CardContent>
      </Card>

      <Dialog
        open={csvOpen}
        onClose={() => setCsvOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {csvMode === 'listed' ? 'Inactivar por archivo' : 'Inactivar excepto archivo'}
        </DialogTitle>
        <DialogContent>
          <Stack
            spacing={2}
            mt={1}
          >
            {!storeId ? <Alert severity="warning">Selecciona una tienda primero.</Alert> : null}

            {processing && !summary ? (
              <Box
                display="flex"
                alignItems="center"
                gap={2}
              >
                <CircularProgress size={20} />
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Procesando archivo...
                </Typography>
              </Box>
            ) : null}

            {summary ? (
              <Card variant="outlined">
                <CardContent>
                  <Stack spacing={1}>
                    <Typography variant="subtitle1">Resumen</Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      Numeros unicos en archivo: <b>{summary.totalCsv}</b>
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      Numeros encontrados (match por phoneNumber): <b>{summary.found}</b>
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      Numeros no encontrados: <b>{summary.notFound}</b>
                    </Typography>
                    {summary.mode === 'except-listed' ? (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        Customers a conservar activos por archivo: <b>{summary.toKeep}</b>
                      </Typography>
                    ) : null}
                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      {summary.mode === 'listed'
                        ? 'Customers a inactivar (IDs unicos): '
                        : 'Customers activos fuera del archivo a inactivar: '}
                      <b>{summary.toDeactivate}</b>
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            ) : null}

            {progress.total > 0 ? (
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Progreso: {progress.done}/{progress.total}
              </Typography>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setCsvOpen(false)}
            disabled={processing}
          >
            Cerrar
          </Button>
          <Button
            variant="contained"
            onClick={() => void handleDeactivate()}
            disabled={!summary?.toDeactivate || processing}
          >
            {csvMode === 'listed' ? 'Inactivar encontrados' : 'Inactivar excepto archivo'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
