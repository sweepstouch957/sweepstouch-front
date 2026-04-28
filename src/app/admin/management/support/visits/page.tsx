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
  Pagination,
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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import React, { useState } from 'react';
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

  const LIMIT = 15;

  // Lookup data for autocompletes
  const { data: technicians = [] } = useQuery({
    queryKey: ['support-technicians'],
    queryFn: supportService.getTechnicians,
    staleTime: 5 * 60_000,
  });

  const { data: storesRes } = useQuery({
    queryKey: ['stores-active-list'],
    queryFn: () => getStores({ limit: 100, status: 'active' }),
    staleTime: 5 * 60_000,
  });
  const stores: StoreOption[] = (storesRes?.data ?? []).map((s) => ({
    _id: s._id,
    name: s.name,
    address: s.address ?? '',
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
                    <TableCell><Chip label={STATUS_LABEL[visit.status] ?? visit.status} color={STATUS_COLOR[visit.status] ?? 'default'} size="small" /></TableCell>
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

            {/* Store autocomplete */}
            <Autocomplete
              options={stores}
              value={form.store}
              onChange={(_, val) => setForm({ ...form, store: val })}
              getOptionLabel={(o) => o.name}
              isOptionEqualToValue={(a, b) => a._id === b._id}
              renderOption={(props, o) => (
                <Box component="li" {...props}>
                  <Box>
                    <Typography variant="body2" fontWeight={600}>{o.name}</Typography>
                    {o.address && <Typography variant="caption" color="text.secondary">{o.address}</Typography>}
                  </Box>
                </Box>
              )}
              renderInput={(params) => (
                <TextField {...params} label="Tienda" size="small" placeholder="Buscar tienda..." />
              )}
              noOptionsText="Sin tiendas disponibles"
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
            disabled={!form.technician || !form.store || isSaving}
          >
            {isSaving ? 'Guardando...' : editVisit ? 'Guardar' : 'Programar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
