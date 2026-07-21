'use client';

import AddTwoToneIcon from '@mui/icons-material/AddTwoTone';
import AttachFileTwoToneIcon from '@mui/icons-material/AttachFileTwoTone';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import DeleteTwoToneIcon from '@mui/icons-material/DeleteTwoTone';
import ConfirmDialog from '@/components/base/confirm-dialog';
import EditTwoToneIcon from '@mui/icons-material/EditTwoTone';
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
  IconButton,
  InputLabel,
  MenuList,
  MenuItem,
  Pagination,
  Popover,
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
import type { Theme } from '@mui/material/styles';
import { chartPalette, tint, tintBorder, type SemanticRole } from 'src/theme/semantic';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useCustomization } from 'src/hooks/use-customization';
import { getStores } from 'src/services/store.service';
import supportService, {
  SupportTicket,
  Technician,
  TicketArea,
  TicketPriority,
  TicketStatus,
  TicketType,
} from 'src/services/support.service';
import { uploadSupportEvidence } from 'src/services/upload.service';

/* ─── Lookup maps ─────────────────────────────────────────── */
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
const AREA_LABEL: Record<string, string> = {
  it: 'IT / Sistemas',
  support: 'Soporte Técnico',
  hardware: 'Hardware',
  networking: 'Redes',
  sales: 'Ventas',
  operations: 'Operaciones',
  management: 'Gerencia',
  other: 'Otro',
};
/** Áreas: color CATEGÓRICO (hay que distinguirlas entre sí, no significan estado). */
const AREA_ORDER = ['it', 'hardware', 'networking', 'sales', 'operations', 'management', 'support', 'other'];
const areaColor = (theme: Theme, area?: string) => {
  const palette = chartPalette(theme);
  const idx = AREA_ORDER.indexOf(area ?? '');
  return idx >= 0 ? palette[idx % palette.length] : theme.palette.text.disabled;
};
const STORE_TYPE_ORDER = ['elite', 'basic', 'free'];
const storeTypeColor = (theme: Theme, type?: string) => {
  const palette = chartPalette(theme);
  const idx = STORE_TYPE_ORDER.indexOf(type ?? '');
  return idx >= 0 ? palette[idx % palette.length] : theme.palette.primary.main;
};

/* ─── Helpers ─────────────────────────────────────────────── */
function isImageUrl(url: string) {
  return /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(url);
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

/* ─── Types ───────────────────────────────────────────────── */
interface StoreOption {
  _id: string;
  name: string;
  address: string;
  type?: string;
  customerCount?: number;
}

interface FormState {
  title: string;
  description: string;
  notes: string;
  area: TicketArea;
  type: TicketType;
  status: TicketStatus;
  priority: TicketPriority;
  store: StoreOption | null;
  assignee: Technician | null;
  reporterName: string;
  reporterIsCurrentUser: boolean;
  evidenceUrls: string[];
}

const EMPTY_FORM: FormState = {
  title: '',
  description: '',
  notes: '',
  area: 'it',
  type: 'other',
  status: 'open',
  priority: 'medium',
  store: null,
  assignee: null,
  reporterName: '',
  reporterIsCurrentUser: true,
  evidenceUrls: [],
};

/* ─── Component ───────────────────────────────────────────── */
export default function TicketsPage() {
  const customization = useCustomization();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const currentUserName = (user as any)?.name ?? (user as any)?.firstName ?? '';

  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterArea, setFilterArea] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTicket, setEditTicket] = useState<SupportTicket | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const [evidenceError, setEvidenceError] = useState('');

  // Store autocomplete debounced search
  const [storeRaw, setStoreRaw] = useState('');
  const [storeSearch, setStoreSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setStoreSearch(storeRaw), 350);
    return () => clearTimeout(t);
  }, [storeRaw]);

  const LIMIT = 15;

  /* ── Queries ── */
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

  const { data, isLoading } = useQuery({
    queryKey: ['support-tickets', page, filterStatus, filterPriority, filterArea, search],
    queryFn: () =>
      supportService.getTickets({
        page,
        limit: LIMIT,
        status: filterStatus as any,
        priority: filterPriority as any,
        area: filterArea as any,
        search: search || undefined,
      }),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
    queryClient.invalidateQueries({ queryKey: ['support-metrics'] });
  };

  /* ── Evidence upload ── */
  const handleEvidenceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setEvidenceError('');
    setUploadingEvidence(true);
    try {
      const urls = await Promise.all(files.map(uploadSupportEvidence));
      setForm((f) => ({ ...f, evidenceUrls: [...f.evidenceUrls, ...urls] }));
    } catch {
      setEvidenceError('Error al subir archivo. Intenta de nuevo.');
    } finally {
      setUploadingEvidence(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeEvidence = (idx: number) =>
    setForm((f) => ({ ...f, evidenceUrls: f.evidenceUrls.filter((_, i) => i !== idx) }));

  /* ── Mutations ── */
  const buildBody = (f: FormState) => ({
    title: f.title,
    description: f.description,
    notes: f.notes,
    area: f.area,
    type: f.type,
    status: f.status,
    priority: f.priority,
    storeId: f.store?._id ?? null,
    storeName: f.store?.name ?? '',
    storeAddress: f.store?.address ?? '',
    assigneeId: f.assignee?._id ?? null,
    assigneeName: f.assignee?.name ?? '',
    reporterName: f.reporterName,
    evidenceUrls: f.evidenceUrls,
  });

  const createMutation = useMutation({
    mutationFn: (f: FormState) => supportService.createTicket(buildBody(f)),
    onSuccess: () => { invalidate(); closeDialog(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, f }: { id: string; f: FormState }) =>
      supportService.updateTicket(id, buildBody(f)),
    onSuccess: () => { invalidate(); closeDialog(); },
  });

  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => supportService.deleteTicket(id),
    onSuccess: invalidate,
  });

  /* ── Dialog helpers ── */
  const openCreate = () => {
    setEditTicket(null);
    setForm({ ...EMPTY_FORM, reporterName: currentUserName, reporterIsCurrentUser: true });
    setStoreRaw('');
    setEvidenceError('');
    setDialogOpen(true);
  };

  const openEdit = (ticket: SupportTicket) => {
    setEditTicket(ticket);
    const store = stores.find((s) => s._id === ticket.storeId) ?? null;
    const assignee = technicians.find((t) => t._id === ticket.assigneeId) ?? null;
    setForm({
      title: ticket.title,
      description: ticket.description,
      notes: ticket.notes || '',
      area: (ticket.area as TicketArea) || 'it',
      type: ticket.type,
      status: ticket.status,
      priority: ticket.priority,
      store: store ?? (ticket.storeId ? { _id: ticket.storeId, name: ticket.storeName, address: ticket.storeAddress } : null),
      assignee: assignee ?? (ticket.assigneeId ? { _id: ticket.assigneeId, id: ticket.assigneeId, name: ticket.assigneeName, email: '' } : null),
      reporterName: ticket.reporterName || currentUserName,
      reporterIsCurrentUser: !ticket.reporterName || ticket.reporterName === currentUserName,
      evidenceUrls: ticket.evidenceUrls ?? [],
    });
    setEvidenceError('');
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditTicket(null);
    setForm(EMPTY_FORM);
    setStoreRaw('');
    setEvidenceError('');
  };

  const handleSubmit = () => {
    if (editTicket) updateMutation.mutate({ id: editTicket._id, f: form });
    else createMutation.mutate(form);
  };

  /* ── Quick status popover ── */
  const [statusPopover, setStatusPopover] = useState<{
    el: HTMLElement;
    ticketId: string;
    current: TicketStatus;
  } | null>(null);

  const quickStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TicketStatus }) =>
      supportService.updateTicket(id, { status }),
    onSuccess: () => {
      invalidate();
      setStatusPopover(null);
    },
  });

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
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Área</InputLabel>
              <Select value={filterArea} label="Área" onChange={(e) => { setFilterArea(e.target.value); setPage(1); }}>
                <MenuItem value="all">Todas</MenuItem>
                {Object.entries(AREA_LABEL).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
              </Select>
            </FormControl>
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
          </Stack>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <TableContainer sx={{ display: { xs: 'none', md: 'block' } }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Título / Tipo</TableCell>
                <TableCell>Tienda</TableCell>
                <TableCell>Área</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Prioridad</TableCell>
                <TableCell>Asignado a</TableCell>
                <TableCell>Archivos</TableCell>
                <TableCell>Creado</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={10} align="center" sx={{ py: 6 }}><CircularProgress size={32} /></TableCell></TableRow>
              ) : !data?.data?.length ? (
                <TableRow><TableCell colSpan={10} align="center" sx={{ py: 6 }}><Typography color="text.secondary">No hay tickets</Typography></TableCell></TableRow>
              ) : (
                data.data.map((ticket) => {
                  const areaHex = areaColor(theme, ticket.area);
                  return (
                    <TableRow
                      key={ticket._id}
                      hover
                      sx={{
                        '&:last-child td': { border: 0 },
                        ...(ticket.priority === 'critical' && {
                          bgcolor: alpha(theme.palette.error.main, 0.03),
                          '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.06) },
                        }),
                      }}
                    >
                      <TableCell>
                        <Typography variant="caption" fontFamily="monospace" color="text.secondary">{ticket.identifier}</Typography>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 220 }}>
                        <Typography variant="body2" fontWeight={600} noWrap>{ticket.title}</Typography>
                        <Typography variant="caption" color="text.secondary" noWrap display="block">{TYPE_LABEL[ticket.type] ?? ticket.type}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>{ticket.storeName || '—'}</Typography>
                      </TableCell>
                      <TableCell>
                        {ticket.area ? (
                          <Chip
                            label={AREA_LABEL[ticket.area] ?? ticket.area}
                            size="small"
                            sx={{ bgcolor: alpha(areaHex, 0.12), color: areaHex, fontWeight: 700, fontSize: 11, border: `1px solid ${alpha(areaHex, 0.3)}` }}
                          />
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Cambiar estado">
                          <Chip
                            label={STATUS_LABEL[ticket.status] ?? ticket.status}
                            color={STATUS_COLOR[ticket.status] ?? 'default'}
                            size="small"
                            onClick={(e) => setStatusPopover({ el: e.currentTarget, ticketId: ticket._id, current: ticket.status })}
                            sx={{ cursor: 'pointer' }}
                          />
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Chip label={PRIORITY_LABEL[ticket.priority] ?? ticket.priority} color={PRIORITY_COLOR[ticket.priority] ?? 'default'} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        {ticket.assigneeName ? (
                          <Stack direction="row" alignItems="center" spacing={0.75}>
                            <Avatar sx={{ width: 24, height: 24, fontSize: 11, bgcolor: 'secondary.main' }}>
                              {ticket.assigneeName[0]?.toUpperCase()}
                            </Avatar>
                            <Typography variant="body2" noWrap sx={{ maxWidth: 110 }}>{ticket.assigneeName}</Typography>
                          </Stack>
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        {ticket.evidenceUrls?.length ? (
                          <Chip
                            label={ticket.evidenceUrls.length}
                            size="small"
                            icon={<AttachFileTwoToneIcon sx={{ fontSize: '14px !important' }} />}
                            variant="outlined"
                            color="info"
                          />
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        <Tooltip title={ticket.createdAt ? format(new Date(ticket.createdAt), 'dd/MM/yyyy HH:mm') : ''}>
                          <Typography variant="caption" color="text.secondary" noWrap sx={{ cursor: 'default' }}>
                            {ticket.createdAt
                              ? formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true, locale: es })
                              : '—'}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                        <Tooltip title="Editar">
                          <IconButton size="small" onClick={() => openEdit(ticket)}><EditTwoToneIcon fontSize="small" /></IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton size="small" color="error" onClick={() => { setPendingDelete(ticket._id); }}>
                            <DeleteTwoToneIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Mobile View — Cards list */}
        <Box sx={{ display: { xs: 'block', md: 'none' } }}>
          {isLoading ? (
            <Box display="flex" justifyContent="center" py={6}><CircularProgress size={32} /></Box>
          ) : !data?.data?.length ? (
            <Box display="flex" justifyContent="center" py={6}><Typography color="text.secondary">No hay tickets</Typography></Box>
          ) : (
            <Stack spacing={2} p={2}>
              {data.data.map((ticket) => {
                const areaHex = areaColor(theme, ticket.area);
                return (
                  <Card
                    key={ticket._id}
                    variant="outlined"
                    sx={{
                      p: 2,
                      position: 'relative',
                      ...(ticket.priority === 'critical' && {
                        borderLeft: '4px solid',
                        borderLeftColor: 'error.main',
                        bgcolor: alpha(theme.palette.error.main, 0.02),
                      }),
                    }}
                  >
                    <Stack spacing={1.5}>
                      {/* Header row: ID + Priority + Actions */}
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Typography variant="caption" fontFamily="monospace" color="text.secondary">
                          {ticket.identifier}
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip
                            label={PRIORITY_LABEL[ticket.priority] ?? ticket.priority}
                            color={PRIORITY_COLOR[ticket.priority] ?? 'default'}
                            size="small"
                            variant="outlined"
                          />
                          <IconButton
                            size="small"
                            onClick={() => openEdit(ticket)}
                          >
                            <EditTwoToneIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => {
                              setPendingDelete(ticket._id);
                            }}
                          >
                            <DeleteTwoToneIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </Stack>

                      {/* Title & Type */}
                      <Box>
                        <Typography variant="body2" fontWeight={700}>
                          {ticket.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {TYPE_LABEL[ticket.type] ?? ticket.type}
                        </Typography>
                      </Box>

                      {/* Store & Area */}
                      <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                        {ticket.storeName && (
                          <Chip
                            label={ticket.storeName}
                            size="small"
                            variant="outlined"
                            sx={{ maxWidth: 180 }}
                          />
                        )}
                        {ticket.area && (
                          <Chip
                            label={AREA_LABEL[ticket.area] ?? ticket.area}
                            size="small"
                            sx={{
                              bgcolor: alpha(areaHex, 0.12),
                              color: areaHex,
                              fontWeight: 700,
                              fontSize: 10,
                              border: `1px solid ${alpha(areaHex, 0.3)}`,
                            }}
                          />
                        )}
                      </Stack>

                      <Divider />

                      {/* Footer: Assignee + Status + Time */}
                      <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                        <Box>
                          {ticket.assigneeName ? (
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                              <Avatar sx={{ width: 20, height: 20, fontSize: 10, bgcolor: 'secondary.main' }}>
                                {ticket.assigneeName[0]?.toUpperCase()}
                              </Avatar>
                              <Typography variant="caption" fontWeight={600}>{ticket.assigneeName}</Typography>
                            </Stack>
                          ) : (
                            <Typography variant="caption" color="text.secondary">Sin asignar</Typography>
                          )}
                        </Box>

                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography variant="caption" color="text.secondary">
                            {ticket.createdAt
                              ? formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true, locale: es })
                              : ''}
                          </Typography>
                          <Chip
                            label={STATUS_LABEL[ticket.status] ?? ticket.status}
                            color={STATUS_COLOR[ticket.status] ?? 'default'}
                            size="small"
                            onClick={(e) => setStatusPopover({ el: e.currentTarget, ticketId: ticket._id, current: ticket.status })}
                            sx={{ cursor: 'pointer', height: 20, fontSize: 11 }}
                          />
                        </Stack>
                      </Stack>
                    </Stack>
                  </Card>
                );
              })}
            </Stack>
          )}
        </Box>
        <Divider />
        <Box display="flex" justifyContent="center" py={2}>
          <Pagination count={totalPages} page={page} onChange={(_, p) => setPage(p)} color="primary" shape="rounded" />
        </Box>
      </Card>

      {/* ── Dialog ── */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editTicket ? `Editar ${editTicket.identifier}` : 'Nuevo Ticket'}
        </DialogTitle>
        <Divider />

        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2.5}>

            {/* Title */}
            <TextField
              label="Título *"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              fullWidth size="small"
              autoFocus
            />

            {/* Description */}
            <TextField
              label="Descripción"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              fullWidth size="small" multiline rows={3}
            />

            {/* Area + Type */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormControl size="small" fullWidth>
                <InputLabel>Área / Departamento *</InputLabel>
                <Select
                  value={form.area}
                  label="Área / Departamento *"
                  onChange={(e) => setForm({ ...form, area: e.target.value as TicketArea })}
                >
                  {Object.entries(AREA_LABEL).map(([k, v]) => (
                    <MenuItem key={k} value={k}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: areaColor(theme, k), flexShrink: 0 }} />
                        <span>{v}</span>
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth>
                <InputLabel>Tipo de problema</InputLabel>
                <Select value={form.type} label="Tipo de problema" onChange={(e) => setForm({ ...form, type: e.target.value as TicketType })}>
                  {Object.entries(TYPE_LABEL).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
                </Select>
              </FormControl>
            </Stack>

            {/* Priority + Status */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormControl size="small" fullWidth>
                <InputLabel>Prioridad</InputLabel>
                <Select value={form.priority} label="Prioridad" onChange={(e) => setForm({ ...form, priority: e.target.value as TicketPriority })}>
                  <MenuItem value="low">Bajo</MenuItem>
                  <MenuItem value="medium">Medio</MenuItem>
                  <MenuItem value="high">Alto</MenuItem>
                  <MenuItem value="critical">Crítico</MenuItem>
                </Select>
              </FormControl>
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
            </Stack>

            {/* Store autocomplete */}
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
                      {o.address && <Typography variant="caption" color="text.secondary" noWrap display="block">{o.address}</Typography>}
                    </Box>
                  </Box>
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Tienda (opcional)"
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

            {/* Assignee (technician) — notification on assign — only show when editing */}
            {editTicket && (
              <Autocomplete
                options={technicians}
                value={form.assignee}
                onChange={(_, val) => setForm({ ...form, assignee: val })}
                getOptionLabel={(o) => o.name}
                isOptionEqualToValue={(a, b) => a._id === b._id}
                renderOption={(props, o) => (
                  <Box component="li" {...props} sx={{ gap: 1.5 }}>
                    <Avatar sx={{ width: 32, height: 32, fontSize: 12, bgcolor: 'secondary.main', flexShrink: 0 }}>
                      {o.name?.[0]?.toUpperCase()}
                    </Avatar>
                    <Box minWidth={0}>
                      <Typography variant="body2" fontWeight={600} noWrap>{o.name}</Typography>
                      {o.email && <Typography variant="caption" color="text.secondary" noWrap display="block">{o.email}</Typography>}
                    </Box>
                  </Box>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Asignado a"
                    size="small"
                    placeholder="Buscar técnico..."
                    helperText="El técnico asignado recibirá una notificación automática"
                  />
                )}
                noOptionsText="Sin técnicos registrados"
              />
            )}

            {/* Reporter toggle */}
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ display: 'block', mb: 0.75, fontSize: 11 }}>
                Reportado por
              </Typography>
              <Stack direction="row" spacing={0.75} mb={1}>
                <Chip
                  label="Yo (usuario actual)"
                  size="small"
                  onClick={() => setForm({ ...form, reporterIsCurrentUser: true, reporterName: currentUserName })}
                  sx={{
                    cursor: 'pointer', fontWeight: form.reporterIsCurrentUser ? 700 : 500,
                    bgcolor: form.reporterIsCurrentUser ? 'primary.main' : 'transparent',
                    color: form.reporterIsCurrentUser ? 'common.white' : 'text.secondary',
                    border: '1px solid',
                    borderColor: form.reporterIsCurrentUser ? 'primary.main' : 'divider',
                  }}
                />
                <Chip
                  label="Tercero"
                  size="small"
                  onClick={() => setForm({ ...form, reporterIsCurrentUser: false, reporterName: '' })}
                  sx={{
                    cursor: 'pointer', fontWeight: !form.reporterIsCurrentUser ? 700 : 500,
                    bgcolor: !form.reporterIsCurrentUser ? 'primary.main' : 'transparent',
                    color: !form.reporterIsCurrentUser ? 'common.white' : 'text.secondary',
                    border: '1px solid',
                    borderColor: !form.reporterIsCurrentUser ? 'primary.main' : 'divider',
                  }}
                />
              </Stack>
              {form.reporterIsCurrentUser ? (
                <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 1.25, py: 0.85, borderRadius: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.05), border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}` }}>
                  <Avatar sx={{ width: 26, height: 26, fontSize: 11, fontWeight: 700, bgcolor: 'primary.main', flexShrink: 0 }}>
                    {currentUserName?.[0]?.toUpperCase() ?? 'U'}
                  </Avatar>
                  <Typography variant="body2" fontWeight={600} flex={1} noWrap>
                    {currentUserName || 'Usuario actual'}
                  </Typography>
                  <Chip label="Tú" size="small" color="primary" variant="outlined" sx={{ height: 16, fontSize: 9, fontWeight: 700, '& .MuiChip-label': { px: 0.5 } }} />
                </Stack>
              ) : (
                <TextField
                  label="Nombre del reportante"
                  value={form.reporterName}
                  onChange={(e) => setForm({ ...form, reporterName: e.target.value })}
                  fullWidth size="small"
                  placeholder="Nombre completo del tercero..."
                  autoFocus
                />
              )}
            </Box>

            <TextField
              label="Notas internas"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              fullWidth size="small" multiline rows={2}
              placeholder="Notas para el equipo (no visibles al cliente)..."
              helperText="Solo visible para técnicos y administradores"
            />

            {/* ── Evidence section ── */}
            <Divider />
            <Box>
              <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2} mb={1.5}>
                <Box>
                  <Typography variant="subtitle2" fontWeight={700}>
                    Evidencia {form.evidenceUrls.length > 0 && `(${form.evidenceUrls.length} archivo${form.evidenceUrls.length !== 1 ? 's' : ''})`}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">Fotos, capturas de pantalla o PDFs relacionados al ticket</Typography>
                </Box>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={uploadingEvidence ? <CircularProgress size={14} /> : <AttachFileTwoToneIcon />}
                  disabled={uploadingEvidence}
                  component="label"
                  sx={{ flexShrink: 0 }}
                >
                  {uploadingEvidence ? 'Subiendo...' : 'Agregar'}
                  <input
                    ref={fileInputRef}
                    hidden
                    type="file"
                    accept="image/*,application/pdf"
                    multiple
                    onChange={handleEvidenceUpload}
                  />
                </Button>
              </Stack>

              {evidenceError && (
                <Typography variant="caption" color="error" display="block" mb={1.5}>{evidenceError}</Typography>
              )}

              {form.evidenceUrls.length > 0 ? (
                <Stack direction="row" flexWrap="wrap" gap={1}>
                  {form.evidenceUrls.map((url, i) => (
                    <Box key={i} sx={{ position: 'relative' }}>
                      {isImageUrl(url) ? (
                        <Box
                          component="img"
                          src={url}
                          alt={`evidencia-${i + 1}`}
                          onClick={() => window.open(url, '_blank')}
                          sx={{
                            width: 72, height: 72,
                            objectFit: 'cover',
                            borderRadius: 1,
                            border: '1.5px solid',
                            borderColor: 'divider',
                            display: 'block',
                            cursor: 'pointer',
                            transition: 'opacity .15s',
                            '&:hover': { opacity: 0.85 },
                          }}
                        />
                      ) : (
                        <Box
                          onClick={() => window.open(url, '_blank')}
                          sx={{
                            width: 72, height: 72,
                            borderRadius: 1,
                            border: '1.5px solid',
                            borderColor: 'divider',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            bgcolor: 'action.hover',
                            gap: 0.5,
                            transition: 'background .15s',
                            '&:hover': { bgcolor: 'action.selected' },
                          }}
                        >
                          <AttachFileTwoToneIcon sx={{ fontSize: 22, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: 9, textAlign: 'center', px: 0.5, lineHeight: 1.2, wordBreak: 'break-all' }}>
                            {url.split('/').pop()?.slice(-14) ?? 'Archivo'}
                          </Typography>
                        </Box>
                      )}
                      <IconButton
                        size="small"
                        onClick={() => removeEvidence(i)}
                        sx={{
                          position: 'absolute', top: -7, right: -7,
                          width: 18, height: 18,
                          bgcolor: 'error.main', color: 'common.white',
                          border: '1.5px solid white',
                          '&:hover': { bgcolor: 'error.dark' },
                        }}
                      >
                        <CloseRoundedIcon sx={{ fontSize: 10 }} />
                      </IconButton>
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Box
                  sx={{
                    border: '1.5px dashed',
                    borderColor: 'divider',
                    borderRadius: 1.5,
                    p: 2.5,
                    textAlign: 'center',
                    color: 'text.disabled',
                  }}
                >
                  <AttachFileTwoToneIcon sx={{ fontSize: 30, mb: 0.5 }} />
                  <Typography variant="caption" display="block">
                    Sin archivos adjuntos. Agrega fotos, capturas o PDFs como evidencia del problema.
                  </Typography>
                </Box>
              )}
            </Box>

          </Stack>
        </DialogContent>

        <Divider />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={closeDialog} variant="outlined">Cancelar</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={!form.title || isSaving}>
            {isSaving ? 'Guardando...' : editTicket ? 'Guardar cambios' : 'Crear ticket'}
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
                  id: statusPopover!.ticketId,
                  status: value as TicketStatus,
                })
              }
              sx={{ gap: 1.5, py: 0.75, mx: 0.5, borderRadius: 1 }}
            >
              <Chip
                label={label}
                color={STATUS_COLOR[value] ?? 'default'}
                size="small"
                sx={{ pointerEvents: 'none', minWidth: 88 }}
              />
            </MenuItem>
          ))}
        </MenuList>
      </Popover>
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) deleteMutation.mutate(pendingDelete);
          setPendingDelete(null);
        }}
        loading={deleteMutation.isPending}
        severity="error"
        title="Eliminar ticket"
        description="Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
      />
    </Container>
  );
}
