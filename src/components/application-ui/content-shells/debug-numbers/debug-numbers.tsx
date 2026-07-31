'use client';

import { useStores } from '@/hooks/fetching/stores/useStores';
import { customerClient } from '@/services/customerService';
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
  FormControl,
  InputLabel,
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
import React, { useEffect, useMemo, useState } from 'react';

type DateOrder = 'newest' | 'oldest';

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

function getCreatedAtTime(customer: any): number {
  const timestamp = customer?.createdAt ? new Date(customer.createdAt).getTime() : 0;
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function compareByCreatedAt(a: any, b: any, order: DateOrder): number {
  const aTime = getCreatedAtTime(a);
  const bTime = getCreatedAtTime(b);
  if (!aTime && !bTime) return 0;
  if (!aTime) return 1;
  if (!bTime) return -1;
  return order === 'newest' ? bTime - aTime : aTime - bTime;
}

function getCustomerCreator(customer: any): string {
  const creator =
    customer?.createdBy ??
    customer?.enteredBy ??
    customer?.addedBy ??
    customer?.createdByUser ??
    customer?.user;

  if (typeof creator === 'string') return creator;
  if (creator && typeof creator === 'object') {
    const personName = [creator.firstName, creator.lastName].filter(Boolean).join(' ');
    return (
      creator.name ||
      creator.fullName ||
      personName ||
      creator.userName ||
      creator.username ||
      creator.email ||
      creator._id ||
      creator.id ||
      'No disponible'
    ).toString();
  }

  return (
    customer?.createdByName ||
    customer?.enteredByName ||
    customer?.addedByName ||
    'No disponible'
  ).toString();
}

export default function DebugNumbers(): React.JSX.Element {
  const theme = useTheme();
  const brandPink = theme.palette.primary.main;
  const qc = useQueryClient();

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
  const [dateOrder, setDateOrder] = useState<DateOrder>('newest');
  const [duplicatesOnly, setDuplicatesOnly] = useState(false);
  const [globalPhoneSearch, setGlobalPhoneSearch] = useState('');
  const [submittedPhoneSearch, setSubmittedPhoneSearch] = useState('');
  const submittedPhoneNormalized = normalizePhone(submittedPhoneSearch);

  const storeLookup = useQuery({
    queryKey: ['debug-number-store-lookup', submittedPhoneNormalized],
    enabled: submittedPhoneNormalized.length >= 7,
    queryFn: async () => {
      const results = await customerClient.searchCustomers(submittedPhoneNormalized, 100);
      const exactCustomers = results.filter(
        (customer) => normalizePhone(customer.phoneNumber) === submittedPhoneNormalized
      );
      const storeIds = new Set<string>();

      exactCustomers.forEach((customer) => {
        (customer.stores || []).forEach((store: any) => {
          const id =
            typeof store === 'string'
              ? store
              : (store?._id || store?.id || store?.storeId || '').toString();
          if (id) storeIds.add(id);
        });
      });

      return { normalized: submittedPhoneNormalized, storeIds: Array.from(storeIds) };
    },
  });

  const lookupStores = useMemo(() => {
    return (storeLookup.data?.storeIds || []).map((id) => {
      const store = (stores || []).find((item) => (item?._id || '').toString() === id);
      return store || { _id: id, name: id };
    });
  }, [storeLookup.data?.storeIds, stores]);
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
      .flatMap(([normalizedPhone, group]) => {
        const visibleCustomers = group
          .filter((c: any) => {
            const activeOk =
              activeFilter === 'all' ? true : activeFilter === 'active' ? !!c?.active : !c?.active;
            if (!activeOk) return false;
            if (!raw) return true;
            const p = (c?.phoneNumber || '').toString();
            const normP = normalizePhone(p);
            return (
              normalizedPhone.includes(normQ) ||
              (normQ && normP.includes(normQ)) ||
              p.toLowerCase().includes(qLower)
            );
          })
          .sort((a: any, b: any) => compareByCreatedAt(a, b, dateOrder));

        if (visibleCustomers.length === 0) return [];
        return [{
          normalizedPhone,
          visibleCustomers,
          totalCustomers: group.length,
        }];
      })
      .sort((a, b) =>
        compareByCreatedAt(a.visibleCustomers[0], b.visibleCustomers[0], dateOrder)
      );
  }, [activeFilter, dateOrder, duplicatePhones, numberSearch]);

  const filteredCustomers = useMemo(() => {
    const raw = numberSearch.trim();
    const normQ = normalizePhone(raw);
    const qLower = raw.toLowerCase();

    return customers
      .filter((c: any) => {
        const activeOk =
          activeFilter === 'all' ? true : activeFilter === 'active' ? !!c?.active : !c?.active;
        if (!activeOk) return false;

        if (duplicatesOnly) {
          const normalized = normalizePhone(c?.phoneNumber ?? '');
          if (!normalized || !duplicatePhones.has(normalized)) return false;
        }

        if (!raw) return true;
        const p = (c?.phoneNumber || '').toString();
        const normP = normalizePhone(p);
        return (normQ && normP.includes(normQ)) || p.toLowerCase().includes(qLower);
      })
      .sort((a: any, b: any) => compareByCreatedAt(a, b, dateOrder));
  }, [customers, numberSearch, activeFilter, duplicatesOnly, duplicatePhones, dateOrder]);

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
  }, [storeId, numberSearch, activeFilter, dateOrder, duplicatesOnly, rowsPerPage]);

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
            <Paper
              variant="outlined"
              sx={{ p: 2, borderRadius: 2 }}
            >
              <Stack spacing={1.5}>
                <Box>
                  <Typography
                    variant="subtitle1"
                    fontWeight={700}
                  >
                    Consultar número en todas las tiendas
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Ingresa un número completo para ver en qué tiendas está guardado.
                  </Typography>
                </Box>
                <Stack
                  component="form"
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1.5}
                  onSubmit={(event) => {
                    event.preventDefault();
                    setSubmittedPhoneSearch(globalPhoneSearch.trim());
                  }}
                >
                  <TextField
                    fullWidth
                    size="small"
                    label="Número de teléfono"
                    placeholder="Ej. (305) 555-0123"
                    value={globalPhoneSearch}
                    onChange={(event) => {
                      setGlobalPhoneSearch(event.target.value);
                      setSubmittedPhoneSearch('');
                    }}
                    inputProps={{ inputMode: 'tel' }}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={!globalPhoneSearch.trim() || storeLookup.isFetching}
                    sx={{ whiteSpace: 'nowrap', minWidth: 120 }}
                  >
                    {storeLookup.isFetching ? 'Buscando…' : 'Consultar'}
                  </Button>
                </Stack>

                {submittedPhoneSearch && submittedPhoneNormalized.length < 7 ? (
                  <Alert severity="warning">Ingresa un número de teléfono válido.</Alert>
                ) : null}

                {storeLookup.isError ? (
                  <Alert severity="error">
                    {storeLookup.error instanceof Error
                      ? storeLookup.error.message
                      : 'No se pudo consultar el número.'}
                  </Alert>
                ) : null}

                {storeLookup.isSuccess ? (
                  lookupStores.length > 0 ? (
                    <Stack
                      direction="row"
                      spacing={1}
                      flexWrap="wrap"
                      useFlexGap
                    >
                      {lookupStores.map((store) => (
                        <Chip
                          key={(store?._id || '').toString()}
                          label={store?.name || store?._id || 'Tienda sin nombre'}
                          color="primary"
                          variant="outlined"
                        />
                      ))}
                    </Stack>
                  ) : (
                    <Alert severity="info">
                      El número {storeLookup.data.normalized} no está guardado en ninguna tienda.
                    </Alert>
                  )
                ) : null}
              </Stack>
            </Paper>

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

                <FormControl
                  size="small"
                  sx={{ minWidth: { xs: '100%', md: 210 }, flex: { md: '0 0 210px' } }}
                  disabled={!storeId || customersPending}
                >
                  <InputLabel id="debug-date-order">Ordenar por fecha</InputLabel>
                  <Select
                    labelId="debug-date-order"
                    label="Ordenar por fecha"
                    value={dateOrder}
                    onChange={(event) => setDateOrder(event.target.value as DateOrder)}
                  >
                    <MenuItem value="newest">Más recientes primero</MenuItem>
                    <MenuItem value="oldest">Más antiguos primero</MenuItem>
                  </Select>
                </FormControl>
              </Stack>

              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1.5}
                justifyContent="flex-end"
                alignItems={{ xs: 'stretch', sm: 'center' }}
              >
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
                      bgcolor: duplicatesOnly
                        ? theme.palette.primary.dark
                        : alpha(brandPink, 0.08),
                      borderColor: brandPink,
                    },
                  }}
                >
                  {duplicatesOnly ? 'Ver todos' : 'Buscar repetidos'}
                </Button>
              </Stack>
            </Stack>

            {message ? <Alert severity={message.type}>{message.text}</Alert> : null}

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
                                <TableCell>Número</TableCell>
                                <TableCell>Ingresado por</TableCell>
                                <TableCell>Estado</TableCell>
                                <TableCell>Fecha de creación</TableCell>
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
                                          <TableCell>{getCustomerCreator(c)}</TableCell>
                                          <TableCell>
                                            <Switch
                                              checked={!!c?.active}
                                              onChange={(e) =>
                                                id
                                                  ? void handleToggleActive(c, e.target.checked)
                                                  : undefined
                                              }
                                              disabled={!id || isToggling(id)}
                                              inputProps={{
                                                'aria-label': `Cambiar estado de ${c?.phoneNumber || 'número'}`,
                                              }}
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
                                            {c?.phoneNumber || '—'}
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
                                      <TableCell>{getCustomerCreator(c)}</TableCell>
                                      <TableCell>
                                        <Switch
                                          checked={!!c?.active}
                                          onChange={(e) =>
                                            id
                                              ? void handleToggleActive(c, e.target.checked)
                                              : undefined
                                          }
                                          disabled={!id || isToggling(id)}
                                          inputProps={{
                                            'aria-label': `Cambiar estado de ${c?.phoneNumber || 'número'}`,
                                          }}
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

    </Box>
  );
}
