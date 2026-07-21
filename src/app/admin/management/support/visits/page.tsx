'use client';

import AddTwoToneIcon from '@mui/icons-material/AddTwoTone';
import ArrowBackIosNewTwoToneIcon from '@mui/icons-material/ArrowBackIosNewTwoTone';
import ArrowForwardIosTwoToneIcon from '@mui/icons-material/ArrowForwardIosTwoTone';
import CheckCircleTwoToneIcon from '@mui/icons-material/CheckCircleTwoTone';
import DeleteTwoToneIcon from '@mui/icons-material/DeleteTwoTone';
import EditTwoToneIcon from '@mui/icons-material/EditTwoTone';
import EventTwoToneIcon from '@mui/icons-material/EventTwoTone';
import WarningTwoToneIcon from '@mui/icons-material/WarningTwoTone';
import {
  alpha,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  MenuList,
  Pagination,
  Popover,
  Select,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import type { Theme } from '@mui/material/styles';
import { chartPalette, tint, tintBorder, type SemanticRole } from 'src/theme/semantic';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import { useCustomization } from 'src/hooks/use-customization';
import { getStores } from 'src/services/store.service';
import supportService, {
  SupportVisit,
  Technician,
  VisitStatus,
  VisitType,
} from 'src/services/support.service';

const STATUS_COLOR: Record<string, 'default' | 'warning' | 'info' | 'success' | 'error'> = {
  scheduled: 'warning',
  in_progress: 'info',
  completed: 'success',
  cancelled: 'error',
};
const STATUS_LABEL: Record<string, string> = {
  scheduled: 'Programada',
  in_progress: 'En curso',
  completed: 'Completada',
  cancelled: 'Cancelada',
};
const TYPE_LABEL: Record<string, string> = {
  visita_rutina: 'Rutina',
  visita_extraordinaria: 'Extraordinaria',
  instalacion: 'Instalación',
  desinstalacion: 'Desinstalación',
  reconfiguracion: 'Reconfiguración',
  soporte_remoto: 'Soporte Remoto',
};

const STORE_TYPE_ORDER = ['elite', 'basic', 'free'];
const storeTypeColor = (theme: Theme, type?: string) => {
  const palette = chartPalette(theme);
  const idx = STORE_TYPE_ORDER.indexOf(type ?? '');
  return idx >= 0 ? palette[idx % palette.length] : theme.palette.primary.main;
};

function getCurrentWeek(): { week: number; year: number } {
  const now = new Date();
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { week, year: now.getFullYear() };
}

interface StoreOption {
  _id: string;
  name: string;
  address: string;
  type?: string;
  customerCount?: number;
}

function getAudienceInfo(count: number | undefined): { label: string; role: SemanticRole } | null {
  if (!count || count === 0) return null;
  const k = count >= 1000
    ? `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}k`
    : `${count}`;
  if (count >= 30000) return { label: `${k} · Crítico`, role: 'error' };
  if (count >= 10000) return { label: `${k} · Urgente`, role: 'warning' };
  return { label: k, role: 'success' };
}

interface FormState {
  type: VisitType;
  status: VisitStatus;
  technician: Technician | null;
  store: StoreOption | null;
  scheduledDate: string;
  notes: string;
  isEmergency: boolean;
}

const EMPTY_FORM: FormState = {
  type: 'visita_rutina',
  status: 'scheduled',
  technician: null,
  store: null,
  scheduledDate: new Date().toISOString().slice(0, 16),
  notes: '',
  isEmergency: false,
};

export default function VisitsPage() {
  const customization = useCustomization();
  const theme = useTheme();
  const queryClient = useQueryClient();

  const { week: currentWeek, year: currentYear } = getCurrentWeek();
  const [week, setWeek] = useState(currentWeek);
  const [year, setYear] = useState(currentYear);
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editVisit, setEditVisit] = useState<SupportVisit | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [useWeekFilter, setUseWeekFilter] = useState(true);

  // Store autocomplete — debounced server search
  const [storeRaw, setStoreRaw] = useState('');
  const [storeSearch, setStoreSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setStoreSearch(storeRaw), 350);
    return () => clearTimeout(t);
  }, [storeRaw]);

  const LIMIT = 15;

  // Lookup data for autocompletes
  const { data: technicians = [] } = useQuery({
    queryKey: ['support-technicians'],
    queryFn: supportService.getTechnicians,
    staleTime: 5 * 60_000,
  });

  const { data: storesRes, isFetching: loadingStores } = useQuery({
    queryKey: ['stores-support-search', storeSearch],
    queryFn: () => getStores({ limit: 50, status: 'active', search: storeSearch }),
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });
  const stores: StoreOption[] = (storesRes?.data ?? []).map((s) => ({
    _id: s._id,
    name: s.name,
    address: s.address ?? '',
    type: s.type,
    customerCount: (s as any).customerCount ?? 0,
  }));

  const { data: weeklyData, isLoading: loadingWeekly } = useQuery({
    queryKey: ['support-visits-weekly', week, year],
    queryFn: () => supportService.getWeeklyVisits(week, year),
    enabled: useWeekFilter,
  });

  const { data: allData, isLoading: loadingAll } = useQuery({
    queryKey: ['support-visits-all', page, filterStatus, search],
    queryFn: () =>
      supportService.getVisits({
        page,
        limit: LIMIT,
        status: filterStatus as any,
        search: search || undefined,
      }),
    enabled: !useWeekFilter,
  });

  const isLoading = useWeekFilter ? loadingWeekly : loadingAll;
  const visits: SupportVisit[] = useWeekFilter ? (weeklyData?.data ?? []) : (allData?.data ?? []);
  const totalPages = !useWeekFilter && allData ? Math.ceil(allData.total / LIMIT) : 1;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['support-visits-weekly'] });
    queryClient.invalidateQueries({ queryKey: ['support-visits-all'] });
    queryClient.invalidateQueries({ queryKey: ['support-metrics'] });
  };

  const createMutation = useMutation({
    mutationFn: (f: FormState) =>
      supportService.createVisit({
        type: f.type,
        status: f.status,
        technicianId: f.technician?._id ?? null,
        technicianName: f.technician?.name ?? '',
        storeId: f.store?._id ?? null,
        storeName: f.store?.name ?? '',
        storeAddress: f.store?.address ?? '',
        scheduledDate: f.scheduledDate,
        notes: f.notes,
        isEmergency: f.isEmergency,
      }),
    onSuccess: () => { invalidate(); closeDialog(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, f }: { id: string; f: FormState }) =>
      supportService.updateVisit(id, {
        type: f.type,
        status: f.status,
        technicianId: f.technician?._id ?? null,
        technicianName: f.technician?.name ?? '',
        storeId: f.store?._id ?? null,
        storeName: f.store?.name ?? '',
        storeAddress: f.store?.address ?? '',
        scheduledDate: f.scheduledDate,
        notes: f.notes,
        isEmergency: f.isEmergency,
      }),
    onSuccess: () => { invalidate(); closeDialog(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => supportService.deleteVisit(id),
    onSuccess: invalidate,
  });

  const openCreate = () => {
    setEditVisit(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (visit: SupportVisit) => {
    setEditVisit(visit);
    const tech = technicians.find((t) => t._id === visit.technicianId) ?? null;
    const store = stores.find((s) => s._id === visit.storeId) ?? null;
    setForm({
      type: visit.type,
      status: visit.status,
      technician: tech ?? (visit.technicianId ? { _id: visit.technicianId, id: visit.technicianId, name: visit.technicianName, email: '' } : null),
      store: store ?? (visit.storeId ? { _id: visit.storeId, name: visit.storeName, address: visit.storeAddress } : null),
      scheduledDate: visit.scheduledDate ? new Date(visit.scheduledDate).toISOString().slice(0, 16) : '',
      notes: visit.notes,
      isEmergency: visit.isEmergency,
    });
    setDialogOpen(true);
  };

  const closeDialog = () => { setDialogOpen(false); setEditVisit(null); setForm(EMPTY_FORM); };

  const handleSubmit = () => {
    if (editVisit) updateMutation.mutate({ id: editVisit._id, f: form });
    else createMutation.mutate(form);
  };

  const prevWeek = () => { if (week === 1) { setWeek(52); setYear(y => y - 1); } else setWeek(w => w - 1); };
  const nextWeek = () => { if (week === 52) { setWeek(1); setYear(y => y + 1); } else setWeek(w => w + 1); };

  /* ── Quick status popover ── */
  const [statusPopover, setStatusPopover] = useState<{
    el: HTMLElement;
    visitId: string;
    current: VisitStatus;
  } | null>(null);

  const quickStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: VisitStatus }) =>
      supportService.updateVisit(id, { status }),
    onSuccess: () => {
      invalidate();
      setStatusPopover(null);
    },
  });

  const summary = weeklyData?.summary;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <Container maxWidth={customization.stretch ? false : 'xl'} sx={{ py: { xs: 2, sm: 3 } }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} mb={3} spacing={2}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Visitas Técnicas</Typography>
          <Typography variant="body2" color="text.secondary">Gestión de visitas y rutas del técnico</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddTwoToneIcon />} onClick={openCreate}>Programar Visita</Button>
      </Stack>

      {/* Weekly summary cards */}
      {useWeekFilter && summary && (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3}>
          {[
            { label: 'Programadas', value: summary.scheduled, color: 'warning', icon: EventTwoToneIcon },
            { label: 'Completadas', value: summary.completed, color: 'success', icon: CheckCircleTwoToneIcon },
            { label: 'Canceladas', value: summary.cancelled, color: 'error', icon: WarningTwoToneIcon },
            { label: 'Total semana', value: summary.total, color: 'primary', icon: EventTwoToneIcon },
          ].map(({ label, value, color, icon: Icon }) => {
            const palette = theme.palette[color as keyof typeof theme.palette] as any;
            return (
              <Card key={label} sx={{ flex: 1, p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ width: 44, height: 44, borderRadius: 1.5, bgcolor: alpha(palette.main, 0.12), color: palette.main, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon fontSize="small" />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">{label}</Typography>
                  <Typography variant="h5" fontWeight={700} color={palette.main}>{value}</Typography>
                </Box>
              </Card>
            );
          })}
        </Stack>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} flexWrap="wrap">
            <FormControlLabel
              control={<Switch checked={useWeekFilter} onChange={(e) => setUseWeekFilter(e.target.checked)} size="small" />}
              label="Vista semanal"
            />
            {useWeekFilter ? (
              <Stack direction="row" alignItems="center" spacing={1}>
                <IconButton size="small" onClick={prevWeek}><ArrowBackIosNewTwoToneIcon fontSize="small" /></IconButton>
                <Typography variant="body2" fontWeight={600} sx={{ minWidth: 100, textAlign: 'center' }}>
                  Semana {week}, {year}
                </Typography>
                <IconButton size="small" onClick={nextWeek}><ArrowForwardIosTwoToneIcon fontSize="small" /></IconButton>
                {week === currentWeek && year === currentYear && <Chip label="Esta semana" size="small" color="primary" />}
              </Stack>
            ) : (
              <>
                <TextField size="small" placeholder="Buscar tienda, técnico, ID..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} sx={{ minWidth: 220, flex: 1 }} />
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Estado</InputLabel>
                  <Select value={filterStatus} label="Estado" onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}>
                    <MenuItem value="all">Todos</MenuItem>
                    <MenuItem value="scheduled">Programada</MenuItem>
                    <MenuItem value="in_progress">En curso</MenuItem>
                    <MenuItem value="completed">Completada</MenuItem>
                    <MenuItem value="cancelled">Cancelada</MenuItem>
                  </Select>
                </FormControl>
              </>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Tienda</TableCell>
                <TableCell>Técnico</TableCell>
                <TableCell>Fecha Programada</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Emergencia</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6 }}><CircularProgress size={32} /></TableCell></TableRow>
              ) : !visits.length ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6 }}><Typography color="text.secondary">No hay visitas</Typography></TableCell></TableRow>
              ) : (
                visits.map((visit) => (
                  <TableRow key={visit._id} hover sx={{ '&:last-child td': { border: 0 } }}>
                    <TableCell><Typography variant="caption" fontFamily="monospace" color="text.secondary">{visit.identifier}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{TYPE_LABEL[visit.type] ?? visit.type}</Typography></TableCell>
                    <TableCell sx={{ maxWidth: 180 }}>
                      <Typography variant="body2" fontWeight={600} noWrap>{visit.storeName || '—'}</Typography>
                      <Typography variant="caption" color="text.secondary" noWrap display="block">{visit.storeAddress || ''}</Typography>
                    </TableCell>
                    <TableCell><Typography variant="body2">{visit.technicianName || '—'}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{visit.scheduledDate ? format(new Date(visit.scheduledDate), 'dd/MM/yy HH:mm') : '—'}</Typography></TableCell>
                    <TableCell>
                      <Tooltip title="Cambiar estado">
                        <Chip
                          label={STATUS_LABEL[visit.status] ?? visit.status}
                          color={STATUS_COLOR[visit.status] ?? 'default'}
                          size="small"
                          onClick={(e) => setStatusPopover({ el: e.currentTarget, visitId: visit._id, current: visit.status })}
                          sx={{ cursor: 'pointer' }}
                        />
                      </Tooltip>
                    </TableCell>
                    <TableCell>{visit.isEmergency && <Chip label="Urgente" color="error" size="small" variant="outlined" />}</TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                      <Tooltip title="Editar"><IconButton size="small" onClick={() => openEdit(visit)}><EditTwoToneIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton size="small" color="error" onClick={() => { if (confirm('¿Eliminar esta visita?')) deleteMutation.mutate(visit._id); }}>
                          <DeleteTwoToneIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {!useWeekFilter && (
          <>
            <Divider />
            <Box display="flex" justifyContent="center" py={2}>
              <Pagination count={totalPages} page={page} onChange={(_, p) => setPage(p)} color="primary" shape="rounded" />
            </Box>
          </>
        )}
      </Card>

      {/* Dialog */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editVisit ? 'Editar Visita' : 'Programar Visita'}</DialogTitle>
        <Divider />
        <DialogContent>
          <Stack spacing={2.5} pt={1}>
            <Stack direction="row" spacing={2}>
              <FormControl size="small" fullWidth>
                <InputLabel>Tipo de visita</InputLabel>
                <Select value={form.type} label="Tipo de visita" onChange={(e) => setForm({ ...form, type: e.target.value as VisitType })}>
                  {Object.entries(TYPE_LABEL).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
                </Select>
              </FormControl>
              {editVisit && (
                <FormControl size="small" fullWidth>
                  <InputLabel>Estado</InputLabel>
                  <Select value={form.status} label="Estado" onChange={(e) => setForm({ ...form, status: e.target.value as VisitStatus })}>
                    <MenuItem value="scheduled">Programada</MenuItem>
                    <MenuItem value="in_progress">En curso</MenuItem>
                    <MenuItem value="completed">Completada</MenuItem>
                    <MenuItem value="cancelled">Cancelada</MenuItem>
                  </Select>
                </FormControl>
              )}
            </Stack>

            {/* Technician autocomplete */}
            <Autocomplete
              options={technicians}
              value={form.technician}
              onChange={(_, val) => setForm({ ...form, technician: val })}
              getOptionLabel={(o) => o.name}
              isOptionEqualToValue={(a, b) => a._id === b._id}
              renderInput={(params) => (
                <TextField {...params} label="Técnico" size="small" placeholder="Buscar técnico..." />
              )}
              noOptionsText="Sin técnicos registrados"
            />

            {/* Store autocomplete — search-as-you-type */}
            <Autocomplete
              options={stores}
              value={form.store}
              onChange={(_, val) => setForm({ ...form, store: val })}
              onInputChange={(_, val) => setStoreRaw(val)}
              filterOptions={(x) => x}
              loading={loadingStores}
              getOptionLabel={(o) => o.name}
              isOptionEqualToValue={(a, b) => a._id === b._id}
              renderOption={(props, o) => {
                const color = storeTypeColor(theme, o.type);
                const aud = getAudienceInfo(o.customerCount);
                return (
                  <Box component="li" {...props} sx={{ gap: 1.5, alignItems: 'flex-start !important', py: '8px !important' }}>
                    <Avatar sx={{ width: 36, height: 36, fontSize: 13, fontWeight: 700, bgcolor: alpha(color, 0.15), color, flexShrink: 0, mt: 0.25 }}>
                      {o.name?.[0]?.toUpperCase()}
                    </Avatar>
                    <Box minWidth={0} flex={1}>
                      <Stack direction="row" alignItems="center" spacing={0.75}>
                        <Typography variant="body2" fontWeight={700} noWrap flex={1}>{o.name}</Typography>
                        {aud && (
                          <Chip
                            label={aud.label}
                            size="small"
                            sx={{
                              height: 18, fontSize: 10, fontWeight: 700, flexShrink: 0,
                              bgcolor: tint(theme, aud.role),
                              color: `${aud.role}.main`,
                              border: `1px solid ${tintBorder(theme, aud.role, 0.3)}`,
                            }}
                          />
                        )}
                      </Stack>
                      {o.address && (
                        <Typography variant="caption" color="text.secondary" noWrap display="block">{o.address}</Typography>
                      )}
                    </Box>
                  </Box>
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Tienda"
                  size="small"
                  placeholder="Escribe para buscar..."
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loadingStores ? <CircularProgress size={14} color="inherit" /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              noOptionsText={storeSearch ? 'Sin resultados' : 'Escribe para buscar una tienda...'}
            />

            <TextField
              label="Fecha y hora programada"
              type="datetime-local"
              value={form.scheduledDate}
              onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Notas"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              fullWidth
              size="small"
              multiline
              rows={2}
            />
            <FormControlLabel
              control={<Switch checked={form.isEmergency} onChange={(e) => setForm({ ...form, isEmergency: e.target.checked })} />}
              label="Visita de emergencia"
            />
          </Stack>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={closeDialog} variant="outlined">Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!form.technician || isSaving}
          >
            {isSaving ? 'Guardando...' : editVisit ? 'Guardar' : 'Programar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Quick Status Popover ── */}
      <Popover
        open={!!statusPopover}
        anchorEl={statusPopover?.el}
        onClose={() => setStatusPopover(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{ elevation: 3, sx: { minWidth: 168, borderRadius: 1.5 } }}
      >
        <MenuList dense sx={{ py: 0.5 }}>
          {Object.entries(STATUS_LABEL).map(([value, label]) => (
            <MenuItem
              key={value}
              selected={statusPopover?.current === value}
              disabled={quickStatusMutation.isPending}
              onClick={() =>
                quickStatusMutation.mutate({
                  id: statusPopover!.visitId,
                  status: value as VisitStatus,
                })
              }
              sx={{ gap: 1.5, py: 0.75, mx: 0.5, borderRadius: 1 }}
            >
              <Chip
                label={label}
                color={STATUS_COLOR[value] ?? 'default'}
                size="small"
                sx={{ pointerEvents: 'none', minWidth: 90 }}
              />
            </MenuItem>
          ))}
        </MenuList>
      </Popover>
    </Container>
  );
}
