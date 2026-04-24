'use client';

import {
  campaignRequestService,
  CampaignRequest,
  CampaignRequestStatus,
  STATUS_LABELS,
  STATUS_COLORS,
  ListRequestsParams,
} from '@/services/campaign-request.service';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FilterListIcon from '@mui/icons-material/FilterList';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import ImageIcon from '@mui/icons-material/Image';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PendingIcon from '@mui/icons-material/Pending';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import StoreIcon from '@mui/icons-material/Store';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import {
  Box,
  Card,
  Chip,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'pending_design', label: 'Pendiente diseño' },
  { value: 'in_review', label: 'En revisión' },
  { value: 'change_requested', label: 'Con cambios' },
  { value: 'approved', label: 'Aprobado' },
  { value: 'scheduled', label: 'Programado' },
  { value: 'active', label: 'Activo' },
  { value: 'completed', label: 'Completado' },
  { value: 'cancelled', label: 'Cancelado' },
];

/* ── Compact KPI bar ─────────────────────────────────────────── */
function KpiBar({ stats }: { stats: any }) {
  const items = [
    { label: 'Total', value: stats?.total ?? 0, color: 'text.primary' },
    { label: 'Pendiente', value: stats?.pending_design ?? 0, color: 'warning.main' },
    { label: 'En revisión', value: stats?.in_review ?? 0, color: 'info.main' },
    { label: 'Con cambios', value: stats?.change_requested ?? 0, color: 'error.main' },
    { label: 'Aprobados', value: (stats?.approved ?? 0) + (stats?.scheduled ?? 0) + (stats?.active ?? 0), color: 'success.main' },
    { label: 'Completados', value: stats?.completed ?? 0, color: 'text.secondary' },
  ];

  return (
    <Card sx={{ mb: 1.5 }}>
      <Stack direction="row" divider={<Box sx={{ width: '1px', bgcolor: 'divider', my: 1 }} />} sx={{ overflowX: 'auto' }}>
        {items.map((item) => (
          <Box key={item.label} sx={{ px: 2.5, py: 1.25, textAlign: 'center', minWidth: 90 }}>
            <Typography variant="h6" fontWeight={700} color={item.color} lineHeight={1}>{item.value}</Typography>
            <Typography variant="caption" color="text.secondary" noWrap>{item.label}</Typography>
          </Box>
        ))}
      </Stack>
    </Card>
  );
}

/* ── Helpers ─────────────────────────────────────────────────── */
function fd(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-HN', { day: '2-digit', month: 'short' });
}

function StatusChip({ status }: { status: CampaignRequestStatus }) {
  return (
    <Chip label={STATUS_LABELS[status] ?? status} color={STATUS_COLORS[status] ?? 'default'} size="small"
      sx={{ fontWeight: 600, fontSize: 10, height: 20, '& .MuiChip-label': { px: 1 } }} />
  );
}

/* ── Main table row — expanded detail ───────────────────────── */
function RequestRow({ req, onClick }: { req: CampaignRequest; onClick: () => void }) {
  const lastProposal = req.proposals?.[req.proposals.length - 1];
  const lastChange = req.changeRequests?.[req.changeRequests.length - 1];

  return (
    <TableRow
      hover
      sx={{ cursor: 'pointer', verticalAlign: 'top', '& td': { py: 1, px: 1.5 } }}
      onClick={onClick}
    >
      {/* Tienda */}
      <TableCell sx={{ minWidth: 140 }}>
        <Stack direction="row" spacing={0.75} alignItems="flex-start">
          <Box sx={{ mt: 0.25, color: 'primary.main', flexShrink: 0 }}>
            <StoreIcon sx={{ fontSize: 14 }} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight={700} lineHeight={1.3}>
              {req.storeName ?? req.storeSlug ?? '—'}
            </Typography>
            {req.storePhone && (
              <Typography variant="caption" color="text.disabled">{req.storePhone}</Typography>
            )}
            <br />
            <Typography variant="caption" color="text.secondary">{fd(req.createdAt)}</Typography>
          </Box>
        </Stack>
      </TableCell>

      {/* Campaña + lo que dijo el cliente */}
      <TableCell sx={{ minWidth: 220 }}>
        <Typography variant="body2" fontWeight={700} lineHeight={1.3} mb={0.4}>
          {req.title ?? <em style={{ opacity: 0.4 }}>Sin título</em>}
        </Typography>
        {req.promotionText && (
          <Typography variant="caption" color="text.secondary"
            sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {req.promotionText}
          </Typography>
        )}
        {req.specialNotes && (
          <Box sx={{ mt: 0.5, px: 1, py: 0.3, bgcolor: 'warning.lighter', borderRadius: 1, borderLeft: '2px solid', borderColor: 'warning.main' }}>
            <Typography variant="caption" color="warning.dark" fontWeight={500}>📝 {req.specialNotes}</Typography>
          </Box>
        )}
      </TableCell>

      {/* Período */}
      <TableCell sx={{ minWidth: 100 }}>
        <Typography variant="caption" fontWeight={600}>{fd(req.startDate)}</Typography>
        <br />
        <Typography variant="caption" color="text.secondary">{fd(req.endDate)}</Typography>
        {req.durationDays && (
          <><br /><Typography variant="caption" color="text.disabled">{req.durationDays}d</Typography></>
        )}
      </TableCell>

      {/* Productos — listado compacto */}
      <TableCell sx={{ minWidth: 180 }}>
        {(!req.products || req.products.length === 0) ? (
          <Typography variant="caption" color="text.disabled">—</Typography>
        ) : (
          <Box component="ul" sx={{ m: 0, pl: 1.5, listStyle: 'none' }}>
            {req.products.slice(0, 4).map((p, i) => (
              <Box component="li" key={i} sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mb: 0.2 }}>
                <Typography variant="caption" fontWeight={600} noWrap sx={{ maxWidth: 110 }}>{p.name}</Typography>
                {p.price != null && (
                  <Typography variant="caption" color="success.main" fontWeight={700} noWrap>
                    ${Number(p.price).toFixed(2)}{p.unit ? `/${p.unit}` : ''}
                  </Typography>
                )}
                {p.discount && (
                  <Chip label={p.discount} size="small" color="error"
                    sx={{ fontSize: 9, height: 16, '& .MuiChip-label': { px: 0.5 } }} />
                )}
              </Box>
            ))}
            {req.products.length > 4 && (
              <Typography variant="caption" color="text.disabled">+{req.products.length - 4} más</Typography>
            )}
          </Box>
        )}
      </TableCell>

      {/* Propuestas + cambios */}
      <TableCell sx={{ minWidth: 160 }}>
        <Stack spacing={0.5}>
          <StatusChip status={req.status} />

          {/* Última propuesta thumbnail */}
          {lastProposal?.imageUrl && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box
                component="img"
                src={lastProposal.imageUrl}
                sx={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 0.5, border: '1px solid', borderColor: 'divider', flexShrink: 0 }}
                onError={(e: any) => { e.target.style.display = 'none'; }}
              />
              <Box>
                <Typography variant="caption" color="text.secondary" lineHeight={1.2}>
                  Propuesta #{req.proposals.length}
                </Typography>
                <br />
                <Typography variant="caption"
                  color={lastProposal.status === 'approved' ? 'success.main' : lastProposal.status === 'rejected' ? 'error.main' : 'text.secondary'}>
                  {lastProposal.status === 'approved' ? '✅ Aprobada' : lastProposal.status === 'rejected' ? '❌ Rechazada' : '⏳ Pendiente'}
                </Typography>
              </Box>
            </Box>
          )}

          {!lastProposal && (
            <Typography variant="caption" color="text.disabled" sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
              <ImageIcon sx={{ fontSize: 11 }} /> Sin propuesta
            </Typography>
          )}

          {/* Último cambio solicitado */}
          {lastChange && (
            <Box sx={{ px: 0.75, py: 0.3, bgcolor: 'error.lighter', borderRadius: 0.5, borderLeft: '2px solid', borderColor: 'error.main' }}>
              <Typography variant="caption" color="error.dark"
                sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                ✏️ {lastChange.description}
              </Typography>
            </Box>
          )}
        </Stack>
      </TableCell>

      {/* Diseñador */}
      <TableCell sx={{ minWidth: 110 }}>
        <Typography variant="caption" color={req.assignedDesignerName ? 'text.primary' : 'text.disabled'} fontWeight={req.assignedDesignerName ? 600 : 400}>
          {req.assignedDesignerName ?? 'Sin asignar'}
        </Typography>
        {lastProposal?.isAIGenerated && (
          <><br /><Chip icon={<SmartToyIcon />} label="AI" color="info" size="small"
            sx={{ mt: 0.3, fontSize: 9, height: 16, '& .MuiChip-label': { px: 0.5 } }} /></>
        )}
      </TableCell>

      {/* Acción */}
      <TableCell align="right" sx={{ width: 40 }}>
        <Tooltip title="Ver detalle">
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); onClick(); }}>
            <OpenInNewIcon sx={{ fontSize: 15 }} />
          </IconButton>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
}

/* ── Main component ──────────────────────────────────────────── */
export default function RequestsList() {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [statusFilter, setStatusFilter] = useState('');
  const [storeFilter, setStoreFilter] = useState('');

  const params: ListRequestsParams = {
    page,
    limit: rowsPerPage,
    ...(statusFilter && { status: statusFilter as CampaignRequestStatus }),
    ...(storeFilter && { store: storeFilter }),
  };

  const { data, isLoading } = useQuery({
    queryKey: ['campaign-requests', params],
    queryFn: () => campaignRequestService.list(params),
  });

  const { data: stats } = useQuery({
    queryKey: ['campaign-requests-stats'],
    queryFn: () => campaignRequestService.getStats(),
  });

  return (
    <Box>
      <KpiBar stats={stats} />

      {/* Filters */}
      <Stack direction="row" spacing={1.5} alignItems="center" mb={1.5}>
        <FilterListIcon color="action" fontSize="small" />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel sx={{ fontSize: 13 }}>Estado</InputLabel>
          <Select value={statusFilter} label="Estado"
            onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
            sx={{ fontSize: 13 }}>
            {STATUS_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value} sx={{ fontSize: 13 }}>{o.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField size="small" label="Tienda (slug / ID)" value={storeFilter}
          onChange={(e) => { setStoreFilter(e.target.value); setPage(0); }}
          sx={{ minWidth: 200, '& input': { fontSize: 13 }, '& label': { fontSize: 13 } }} />
        {(statusFilter || storeFilter) && (
          <Chip label="Limpiar" onDelete={() => { setStatusFilter(''); setStoreFilter(''); }} size="small" />
        )}
      </Stack>

      {/* Table */}
      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& th': { fontSize: 11, fontWeight: 700, color: 'text.secondary', py: 1, px: 1.5, letterSpacing: '0.05em' } }}>
                <TableCell>TIENDA</TableCell>
                <TableCell>CAMPAÑA / CLIENTE</TableCell>
                <TableCell>PERÍODO</TableCell>
                <TableCell>PRODUCTOS</TableCell>
                <TableCell>ESTADO / PROPUESTA</TableCell>
                <TableCell>DISEÑADOR</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary', fontSize: 13 }}>
                    Cargando solicitudes...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && (!data?.data || data.data.length === 0) && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                    <Typography variant="body2" color="text.secondary">Sin solicitudes con estos filtros</Typography>
                  </TableCell>
                </TableRow>
              )}
              {data?.data.map((req: CampaignRequest) => (
                <RequestRow
                  key={req._id}
                  req={req}
                  onClick={() => router.push(`/admin/management/campaign-requests/${req._id}`)}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={data?.total ?? 0}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(0); }}
          rowsPerPageOptions={[10, 25, 50]}
          labelRowsPerPage="Por página:"
          sx={{ '& *': { fontSize: 12 } }}
        />
      </Card>
    </Box>
  );
}
