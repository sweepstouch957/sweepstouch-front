'use client';

import AddTwoToneIcon from '@mui/icons-material/AddTwoTone';
import DeleteTwoToneIcon from '@mui/icons-material/DeleteTwoTone';
import EditTwoToneIcon from '@mui/icons-material/EditTwoTone';
import {
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
  IconButton,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
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
  useTheme,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import React, { useState } from 'react';
import { useCustomization } from 'src/hooks/use-customization';
import { getStores } from 'src/services/store.service';
import supportService, {
  SupportTicket,
  Technician,
  TicketPriority,
  TicketStatus,
  TicketType,
} from 'src/services/support.service';

const STATUS_COLOR: Record<string, 'warning' | 'info' | 'error' | 'success' | 'default'> = {
  open: 'warning',
  in_progress: 'info',
  resolved: 'success',
  closed: 'default',
};
const STATUS_LABEL: Record<string, string> = {
  open: 'Abierto',
  in_progress: 'En Progreso',
  resolved: 'Resuelto',
  closed: 'Cerrado',
};
const PRIORITY_COLOR: Record<string, 'error' | 'warning' | 'info' | 'success'> = {
  critical: 'error',
  high: 'warning',
  medium: 'info',
  low: 'success',
};
const PRIORITY_LABEL: Record<string, string> = {
  critical: 'Crítico',
  high: 'Alto',
  medium: 'Medio',
  low: 'Bajo',
};
const TYPE_LABEL: Record<string, string> = {
  software: 'Software',
  hardware: 'Hardware',
  connectivity: 'Conectividad',
  peripheral: 'Periféricos',
  remote: 'Remoto',
  installation: 'Instalación',
  uninstallation: 'Desinstalación',
  reconfiguration: 'Reconfiguración',
  other: 'Otro',
};

interface StoreOption {
  _id: string;
  name: string;
  address: string;
}

interface FormState {
  title: string;
  description: string;
  type: TicketType;
  status: TicketStatus;
  priority: TicketPriority;
  store: StoreOption | null;
  assignee: Technician | null;
  reporterName: string;
}

const EMPTY_FORM: FormState = {
  title: '',
  description: '',
  type: 'other',
  status: 'open',
  priority: 'medium',
  store: null,
  assignee: null,
  reporterName: '',
};

export default function TicketsPage() {
  const customization = useCustomization();
  const theme = useTheme();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTicket, setEditTicket] = useState<SupportTicket | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

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

  const { data, isLoading } = useQuery({
    queryKey: ['support-tickets', page, filterStatus, filterPriority, filterType, search],
    queryFn: () =>
      supportService.getTickets({
        page,
        limit: LIMIT,
        status: filterStatus as any,
        priority: filterPriority as any,
        type: filterType as any,
        search: search || undefined,
      }),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
    queryClient.invalidateQueries({ queryKey: ['support-metrics'] });
  };

  const createMutation = useMutation({
    mutationFn: (f: FormState) =>
      supportService.createTicket({
        title: f.title,
        description: f.description,
        type: f.type,
        status: f.status,
        priority: f.priority,
        storeId: f.store?._id ?? null,
        storeName: f.store?.name ?? '',
        storeAddress: f.store?.address ?? '',
        assigneeId: f.assignee?._id ?? null,
        assigneeName: f.assignee?.name ?? '',
        reporterName: f.reporterName,
      }),
    onSuccess: () => { invalidate(); closeDialog(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, f }: { id: string; f: FormState }) =>
      supportService.updateTicket(id, {
        title: f.title,
        description: f.description,
        type: f.type,
        status: f.status,
        priority: f.priority,
        storeId: f.store?._id ?? null,
        storeName: f.store?.name ?? '',
        storeAddress: f.store?.address ?? '',
        assigneeId: f.assignee?._id ?? null,
        assigneeName: f.assignee?.name ?? '',
        reporterName: f.reporterName,
      }),
    onSuccess: () => { invalidate(); closeDialog(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => supportService.deleteTicket(id),
    onSuccess: invalidate,
  });

  const openCreate = () => {
    setEditTicket(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (ticket: SupportTicket) => {
    setEditTicket(ticket);
    const store = stores.find((s) => s._id === ticket.storeId) ?? null;
    const assignee = technicians.find((t) => t._id === ticket.assigneeId) ?? null;
    setForm({
      title: ticket.title,
      description: ticket.description,
      type: ticket.type,
      status: ticket.status,
      priority: ticket.priority,
      store: store ?? (ticket.storeId ? { _id: ticket.storeId, name: ticket.storeName, address: ticket.storeAddress } : null),
      assignee: assignee ?? (ticket.assigneeId ? { _id: ticket.assigneeId, id: ticket.assigneeId, name: ticket.assigneeName, email: '' } : null),
      reporterName: ticket.reporterName,
    });
    setDialogOpen(true);
  };

  const closeDialog = () => { setDialogOpen(false); setEditTicket(null); setForm(EMPTY_FORM); };

  const handleSubmit = () => {
    if (editTicket) updateMutation.mutate({ id: editTicket._id, f: form });
    else createMutation.mutate(form);
  };

  const totalPages = data ? Math.ceil(data.total / LIMIT) : 1;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <Container maxWidth={customization.stretch ? false : 'xl'} sx={{ py: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} mb={3} spacing={2}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Tickets de Soporte</Typography>
          <Typography variant="body2" color="text.secondary">
            {data?.total ?? 0} ticket{data?.total !== 1 ? 's' : ''} en total
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddTwoToneIcon />} onClick={openCreate}>Nuevo Ticket</Button>
      </Stack>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} flexWrap="wrap">
            <TextField
              size="small"
              placeholder="Buscar por título, tienda, ID..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              sx={{ minWidth: 220, flex: 1 }}
            />
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Estado</InputLabel>
              <Select value={filterStatus} label="Estado" onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}>
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="open">Abierto</MenuItem>
                <MenuItem value="in_progress">En Progreso</MenuItem>
                <MenuItem value="resolved">Resuelto</MenuItem>
                <MenuItem value="closed">Cerrado</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Prioridad</InputLabel>
              <Select value={filterPriority} label="Prioridad" onChange={(e) => { setFilterPriority(e.target.value); setPage(1); }}>
                <MenuItem value="all">Todas</MenuItem>
                <MenuItem value="critical">Crítico</MenuItem>
                <MenuItem value="high">Alto</MenuItem>
                <MenuItem value="medium">Medio</MenuItem>
                <MenuItem value="low">Bajo</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Tipo</InputLabel>
              <Select value={filterType} label="Tipo" onChange={(e) => { setFilterType(e.target.value); setPage(1); }}>
                <MenuItem value="all">Todos</MenuItem>
                {Object.entries(TYPE_LABEL).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
              </Select>
            </FormControl>
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
                <TableCell>Título</TableCell>
                <TableCell>Tienda</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Prioridad</TableCell>
                <TableCell>Asignado a</TableCell>
                <TableCell>Creado</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={9} align="center" sx={{ py: 6 }}><CircularProgress size={32} /></TableCell></TableRow>
              ) : !data?.data?.length ? (
                <TableRow><TableCell colSpan={9} align="center" sx={{ py: 6 }}><Typography color="text.secondary">No hay tickets</Typography></TableCell></TableRow>
              ) : (
                data.data.map((ticket) => (
                  <TableRow key={ticket._id} hover sx={{ '&:last-child td': { border: 0 } }}>
                    <TableCell><Typography variant="caption" fontFamily="monospace" color="text.secondary">{ticket.identifier}</Typography></TableCell>
                    <TableCell sx={{ maxWidth: 240 }}><Typography variant="body2" fontWeight={600} noWrap>{ticket.title}</Typography></TableCell>
                    <TableCell><Typography variant="body2" noWrap sx={{ maxWidth: 160 }}>{ticket.storeName || '—'}</Typography></TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{TYPE_LABEL[ticket.type] ?? ticket.type}</Typography></TableCell>
                    <TableCell><Chip label={STATUS_LABEL[ticket.status] ?? ticket.status} color={STATUS_COLOR[ticket.status] ?? 'default'} size="small" /></TableCell>
                    <TableCell><Chip label={PRIORITY_LABEL[ticket.priority] ?? ticket.priority} color={PRIORITY_COLOR[ticket.priority] ?? 'default'} size="small" variant="outlined" /></TableCell>
                    <TableCell><Typography variant="body2" noWrap>{ticket.assigneeName || '—'}</Typography></TableCell>
                    <TableCell><Typography variant="caption" color="text.secondary" noWrap>{ticket.createdAt ? format(new Date(ticket.createdAt), 'dd/MM/yy') : '—'}</Typography></TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                      <Tooltip title="Editar"><IconButton size="small" onClick={() => openEdit(ticket)}><EditTwoToneIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton size="small" color="error" onClick={() => { if (confirm('¿Eliminar este ticket?')) deleteMutation.mutate(ticket._id); }}>
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
        <Divider />
        <Box display="flex" justifyContent="center" py={2}>
          <Pagination count={totalPages} page={page} onChange={(_, p) => setPage(p)} color="primary" shape="rounded" />
        </Box>
      </Card>

      {/* Dialog */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editTicket ? 'Editar Ticket' : 'Nuevo Ticket'}</DialogTitle>
        <Divider />
        <DialogContent>
          <Stack spacing={2.5} pt={1}>
            <TextField
              label="Título *"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              fullWidth
              size="small"
            />
            <TextField
              label="Descripción"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              fullWidth
              size="small"
              multiline
              rows={3}
            />
            <Stack direction="row" spacing={2}>
              <FormControl size="small" fullWidth>
                <InputLabel>Tipo</InputLabel>
                <Select value={form.type} label="Tipo" onChange={(e) => setForm({ ...form, type: e.target.value as TicketType })}>
                  {Object.entries(TYPE_LABEL).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth>
                <InputLabel>Prioridad</InputLabel>
                <Select value={form.priority} label="Prioridad" onChange={(e) => setForm({ ...form, priority: e.target.value as TicketPriority })}>
                  <MenuItem value="low">Bajo</MenuItem>
                  <MenuItem value="medium">Medio</MenuItem>
                  <MenuItem value="high">Alto</MenuItem>
                  <MenuItem value="critical">Crítico</MenuItem>
                </Select>
              </FormControl>
            </Stack>
            {editTicket && (
              <FormControl size="small" fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select value={form.status} label="Estado" onChange={(e) => setForm({ ...form, status: e.target.value as TicketStatus })}>
                  <MenuItem value="open">Abierto</MenuItem>
                  <MenuItem value="in_progress">En Progreso</MenuItem>
                  <MenuItem value="resolved">Resuelto</MenuItem>
                  <MenuItem value="closed">Cerrado</MenuItem>
                </Select>
              </FormControl>
            )}

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

            {/* Assignee (technician) autocomplete */}
            <Autocomplete
              options={technicians}
              value={form.assignee}
              onChange={(_, val) => setForm({ ...form, assignee: val })}
              getOptionLabel={(o) => o.name}
              isOptionEqualToValue={(a, b) => a._id === b._id}
              renderInput={(params) => (
                <TextField {...params} label="Asignado a" size="small" placeholder="Buscar técnico..." />
              )}
              noOptionsText="Sin técnicos registrados"
            />

            <TextField
              label="Reportado por"
              value={form.reporterName}
              onChange={(e) => setForm({ ...form, reporterName: e.target.value })}
              fullWidth
              size="small"
            />
          </Stack>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={closeDialog} variant="outlined">Cancelar</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={!form.title || isSaving}>
            {isSaving ? 'Guardando...' : editTicket ? 'Guardar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
