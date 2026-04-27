'use client';

import ShiftPreviewModal from '@/components/application-ui/dialogs/shift-preview';
import DeleteShiftDialog from '@/components/application-ui/dialogs/shift/delete';
import NewShiftModal from '@/components/application-ui/dialogs/shift/modal';
import { ShiftRow, StatusFilter, UseShiftsTableResult } from '@/hooks/pages/useShiftsPage';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {
  alpha,
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  FormControl,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Pagination,
  Select,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { format } from 'date-fns';
import es from 'date-fns/locale/es';

const STATUS_CONFIG: Record<
  string,
  { label: string; color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' }
> = {
  available: { label: 'Disponible', color: 'info' },
  assigned: { label: 'Asignado', color: 'primary' },
  active: { label: 'Activo', color: 'success' },
  completed: { label: 'Completado', color: 'default' },
};

interface ShiftCardProps {
  row: ShiftRow;
  usd: Intl.NumberFormat;
  openPreview: (id: string) => void;
  openEdit: (id: string) => void;
  openDelete: (id: string) => void;
}

const ShiftCard = ({ row, usd, openPreview, openEdit, openDelete }: ShiftCardProps) => {
  const theme = useTheme();
  const s = STATUS_CONFIG[row.status ?? ''] ?? { label: row.status, color: 'default' as const };

  const promoterName = [
    row.requestedBy?.firstName ?? row.promoterInfo?.firstName ?? '',
    row.requestedBy?.lastName ?? row.promoterInfo?.lastName ?? '',
  ]
    .join(' ')
    .trim() || 'Sin asignar';
  const promoterImg = row.requestedBy?.profileImage;

  const startDate = row.startTime
    ? format(new Date(row.startTime), "EEE d MMM", { locale: es })
    : '—';
  const startTime = row.startTime ? format(new Date(row.startTime), 'HH:mm') : '—';
  const endTime = row.endTime ? format(new Date(row.endTime), 'HH:mm') : '—';

  const canEdit = !['active', 'completed'].includes(row.status ?? '');

  return (
    <Card
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          height: 4,
          background: `linear-gradient(90deg, ${theme.palette[s.color]?.main ?? theme.palette.grey[400]}, ${alpha(theme.palette[s.color]?.main ?? theme.palette.grey[400], 0.4)})`,
        }}
      />
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        {/* Store + Status */}
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
          <Box flex={1} minWidth={0} pr={1}>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <LocationOnIcon sx={{ fontSize: 14, color: 'primary.main', flexShrink: 0 }} />
              <Typography fontWeight={700} fontSize={14} noWrap>
                {row.storeInfo?.name || row.supermarketName || 'Tienda'}
              </Typography>
            </Stack>
            {row.storeInfo?.address && (
              <Typography variant="caption" color="text.secondary" noWrap display="block" pl={2.25}>
                {row.storeInfo.address}
              </Typography>
            )}
          </Box>
          <Chip label={s.label} color={s.color} size="small" sx={{ flexShrink: 0, fontWeight: 600 }} />
        </Stack>

        {/* Date + Time */}
        <Stack direction="row" spacing={2.5} mb={1.5}>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <CalendarMonthIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
            <Typography variant="caption" color="text.secondary">{startDate}</Typography>
          </Stack>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <AccessTimeIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
            <Typography variant="caption" color="text.secondary">
              {startTime} – {endTime}
            </Typography>
          </Stack>
        </Stack>

        {/* Promoter */}
        <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
          <Avatar
            src={promoterImg}
            sx={{ width: 26, height: 26, fontSize: 11, bgcolor: 'primary.main' }}
          >
            {promoterName[0]}
          </Avatar>
          <Typography variant="caption" fontWeight={600}>
            {promoterName}
          </Typography>
        </Stack>

        {/* Stats */}
        <Stack
          direction="row"
          spacing={2}
          mb={1.5}
          sx={{
            bgcolor: 'action.hover',
            borderRadius: 2,
            px: 1.5,
            py: 1,
          }}
        >
          <Box>
            <Typography variant="caption" color="text.disabled" display="block">Números</Typography>
            <Typography fontWeight={700} fontSize={13}>{row.totalParticipations ?? 0}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.disabled" display="block">Ganancia</Typography>
            <Typography fontWeight={700} fontSize={13} color="success.main">
              {usd.format(row.totalEarnings ?? 0)}
            </Typography>
          </Box>
        </Stack>

        {/* Actions */}
        <Stack
          direction="row"
          spacing={0.5}
          pt={1}
          sx={{ borderTop: '1px solid', borderColor: 'divider' }}
        >
          <Tooltip title="Ver detalle">
            <IconButton size="small" onClick={() => openPreview(row._id)}>
              <VisibilityIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          {canEdit && (
            <>
              <Tooltip title="Editar">
                <IconButton size="small" color="secondary" onClick={() => openEdit(row._id)}>
                  <EditIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Eliminar">
                <IconButton size="small" color="error" onClick={() => openDelete(row._id)}>
                  <DeleteIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

const SkeletonCard = () => (
  <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
    <Skeleton variant="rectangular" height={4} />
    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
        <Box flex={1}>
          <Skeleton width="60%" height={18} />
          <Skeleton width="80%" height={13} sx={{ mt: 0.5 }} />
        </Box>
        <Skeleton variant="rounded" width={72} height={22} />
      </Stack>
      <Skeleton width="55%" height={14} sx={{ mb: 1.5 }} />
      <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
        <Skeleton variant="circular" width={26} height={26} />
        <Skeleton width={100} height={14} />
      </Stack>
      <Skeleton variant="rounded" height={40} sx={{ mb: 1.5 }} />
      <Skeleton width="40%" height={14} />
    </CardContent>
  </Card>
);

export interface MobileShiftCarouselProps extends Partial<UseShiftsTableResult> {
  sweepstakes?: { id: string; name: string }[];
}

const MobileShiftCarousel = ({
  shifts = [],
  isLoading = false,
  isFetching = false,
  pagination = { page: 1, pages: 1, total: 0 },
  page = 1,
  setPage,
  status = 'all',
  setStatus,
  usd,
  openPreview,
  openEdit,
  openDelete,
  closeAllModals,
  selectedShiftId,
  previewModalOpen = false,
  editModalOpen = false,
  deleteModalOpen = false,
  sweepstakes,
}: MobileShiftCarouselProps) => {
  const defaultUsd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
  const formatter = usd ?? defaultUsd;

  return (
    <Box>
      {/* Toolbar */}
      <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Estado</InputLabel>
          <Select
            value={status}
            label="Estado"
            onChange={(e) => setStatus?.(e.target.value as StatusFilter)}
          >
            <MenuItem value="all">Todos</MenuItem>
            <MenuItem value="available">Disponible</MenuItem>
            <MenuItem value="assigned">Asignado</MenuItem>
            <MenuItem value="active">Activo</MenuItem>
            <MenuItem value="completed">Completado</MenuItem>
          </Select>
        </FormControl>
        <Box flex={1} />
        {isFetching && !isLoading && (
          <LinearProgress sx={{ width: 60, borderRadius: 1 }} />
        )}
        <Typography variant="caption" color="text.secondary">
          {pagination.total} turnos
        </Typography>
      </Stack>

      {/* Cards */}
      <Stack spacing={1.5}>
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : shifts.length === 0
          ? (
            <Box
              sx={{
                py: 8,
                textAlign: 'center',
                color: 'text.secondary',
                border: '1px dashed',
                borderColor: 'divider',
                borderRadius: 3,
              }}
            >
              <Typography>No hay turnos para mostrar.</Typography>
            </Box>
          )
          : shifts.map((row) => (
              <ShiftCard
                key={row._id}
                row={row}
                usd={formatter}
                openPreview={openPreview ?? (() => {})}
                openEdit={openEdit ?? (() => {})}
                openDelete={openDelete ?? (() => {})}
              />
            ))}
      </Stack>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <Stack direction="row" justifyContent="center" mt={3}>
          <Pagination
            count={pagination.pages}
            page={page}
            onChange={(_, v) => setPage?.(v)}
            shape="rounded"
            size="small"
            color="primary"
          />
        </Stack>
      )}

      {/* Modals (same as desktop table) */}
      <ShiftPreviewModal
        open={previewModalOpen}
        onClose={closeAllModals ?? (() => {})}
        shiftId={selectedShiftId}
      />
      <NewShiftModal
        open={editModalOpen}
        onClose={closeAllModals ?? (() => {})}
        sweepstakes={sweepstakes}
        shiftId={selectedShiftId}
      />
      <DeleteShiftDialog
        open={deleteModalOpen}
        shiftId={selectedShiftId}
        onClose={closeAllModals ?? (() => {})}
      />
    </Box>
  );
};

export default MobileShiftCarousel;
