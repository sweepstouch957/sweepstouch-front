'use client';

import type { ReactNode } from 'react';
import RequestCard from '@/components/application-ui/card-shells/request';
import PageHeading from '@/components/base/page-heading';
import { promoterService } from '@/services/promotor.service';
import { shiftService } from '@/services/shift.service';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EventNoteIcon from '@mui/icons-material/EventNote';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import {
  alpha,
  Autocomplete,
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Pagination,
  Select,
  Skeleton,
  Snackbar,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

type RequestStatus = 'all' | 'pendiente' | 'aprobado' | 'rechazado' | 'cancelado';

const STATUS_TABS: { value: RequestStatus; label: string; color: string }[] = [
  { value: 'all', label: 'Todas', color: 'default' },
  { value: 'pendiente', label: 'Pendiente', color: '#f59e0b' },
  { value: 'aprobado', label: 'Aprobadas', color: '#10b981' },
  { value: 'rechazado', label: 'Rechazadas', color: '#ef4444' },
  { value: 'cancelado', label: 'Canceladas', color: '#6b7280' },
];

const LIMIT = 12;

const StatCard = ({
  icon,
  label,
  value,
  color,
  loading,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  color: string;
  loading: boolean;
}) => {
  const theme = useTheme();
  return (
    <Card
      sx={{
        flex: 1,
        minWidth: 0,
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          bgcolor: color,
        }}
      />
      <CardContent sx={{ pt: 2.5, pb: '16px !important' }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              bgcolor: alpha(color, theme.palette.mode === 'dark' ? 0.15 : 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color,
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">
              {label}
            </Typography>
            {loading ? (
              <Skeleton width={40} height={28} />
            ) : (
              <Typography fontWeight={700} fontSize={22} lineHeight={1.2}>
                {value}
              </Typography>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

const RequestsPage = () => {
  const queryClient = useQueryClient();
  const theme = useTheme();

  const [status, setStatus] = useState<RequestStatus>('all');
  const [promoterId, setPromoterId] = useState('');
  const [page, setPage] = useState(1);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'error' as 'error' | 'success',
  });

  const resetPage = useCallback(() => setPage(1), []);

  // Stats (total counts from API)
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['shiftRequestStats'],
    queryFn: () => shiftService.getShiftRequestStats(),
    staleTime: 30_000,
  });
  const stats = statsData?.data;

  // Promotoras for autocomplete
  const { data: promotersData } = useQuery({
    queryKey: ['promoters-autocomplete'],
    queryFn: () => promoterService.getAllPromoters({ limit: 200 }),
    staleTime: 60_000,
  });
  const promoterOptions = (promotersData?.data ?? []).map((p) => ({
    id: p._id,
    label: `${p.firstName} ${p.lastName}`,
  }));
  const selectedPromoter = promoterOptions.find((o) => o.id === promoterId) ?? null;

  // List with server-side filters
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['shiftRequests', status, promoterId, page],
    queryFn: () =>
      shiftService.getShiftRequests({
        status: status === 'all' ? undefined : status,
        promoterId: promoterId || undefined,
        page,
        limit: LIMIT,
        sortBy: 'requestDate',
        sortOrder: 'desc',
      }),
    staleTime: 15_000,
  });

  const requests = data?.data ?? [];
  const pagination = data?.pagination ?? { currentPage: 1, totalPages: 1, totalItems: 0 };

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['shiftRequests'] });
    queryClient.invalidateQueries({ queryKey: ['shiftRequestStats'] });
  };

  const approveMutation = useMutation({
    mutationFn: (id: string) => shiftService.approveShiftRequest(id),
    onSuccess: () => {
      invalidate();
      setSnackbar({ open: true, message: 'Solicitud aprobada con éxito.', severity: 'success' });
    },
    onError: (err: any) => {
      setSnackbar({
        open: true,
        message: err?.response?.data?.message || err?.response?.data?.error || 'Error al aprobar.',
        severity: 'error',
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      shiftService.rejectShiftRequest(id, reason),
    onSuccess: () => {
      invalidate();
      setSnackbar({ open: true, message: 'Solicitud rechazada.', severity: 'success' });
    },
    onError: (err: any) => {
      setSnackbar({
        open: true,
        message: err?.response?.data?.error || 'Error al rechazar.',
        severity: 'error',
      });
    },
  });

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3 } }}>
      <PageHeading
        title="Solicitudes de Turno"
        description="Revisa y gestiona las solicitudes de impulsadoras"
      />

      {/* KPI Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
          gap: 2,
          mt: 3,
          mb: 3,
        }}
      >
        <StatCard
          icon={<EventNoteIcon fontSize="small" />}
          label="Total"
          value={stats?.total ?? 0}
          color={theme.palette.primary.main}
          loading={statsLoading}
        />
        <StatCard
          icon={<AccessTimeIcon fontSize="small" />}
          label="Pendientes"
          value={stats?.byStatus?.pendiente ?? 0}
          color="#f59e0b"
          loading={statsLoading}
        />
        <StatCard
          icon={<CheckCircleIcon fontSize="small" />}
          label="Aprobadas"
          value={stats?.byStatus?.aprobado ?? 0}
          color="#10b981"
          loading={statsLoading}
        />
        <StatCard
          icon={<CancelIcon fontSize="small" />}
          label="Rechazadas"
          value={stats?.byStatus?.rechazado ?? 0}
          color="#ef4444"
          loading={statsLoading}
        />
      </Box>

      {/* Filters */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        mb={3}
        flexWrap="wrap"
        useFlexGap
      >
        {/* Status chip tabs */}
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {STATUS_TABS.map((tab) => (
            <Chip
              key={tab.value}
              label={tab.label}
              onClick={() => {
                setStatus(tab.value);
                resetPage();
              }}
              variant={status === tab.value ? 'filled' : 'outlined'}
              sx={{
                fontWeight: 600,
                cursor: 'pointer',
                ...(status === tab.value && tab.value !== 'all'
                  ? { bgcolor: tab.color, color: '#fff', borderColor: tab.color }
                  : {}),
              }}
            />
          ))}
        </Stack>

        <Box flex={1} />

        {/* Promotora autocomplete */}
        <Autocomplete
          size="small"
          options={promoterOptions}
          value={selectedPromoter}
          onChange={(_, val) => {
            setPromoterId(val?.id ?? '');
            resetPage();
          }}
          isOptionEqualToValue={(o, v) => o.id === v.id}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Promotora"
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <>
                    <PersonSearchIcon sx={{ fontSize: 16, color: 'text.disabled', mr: 0.5 }} />
                    {params.InputProps.startAdornment}
                  </>
                ),
              }}
            />
          )}
          sx={{ width: { xs: '100%', sm: 240 } }}
          clearOnEscape
        />

        {/* Sort */}
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Ordenar por</InputLabel>
          <Select defaultValue="requestDate" label="Ordenar por" disabled>
            <MenuItem value="requestDate">Más reciente</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {/* Fetching bar */}
      {isFetching && !isLoading && (
        <LinearProgress sx={{ mb: 1.5, borderRadius: 1, height: 2 }} />
      )}

      {/* List heading */}
      <Typography fontWeight={700} fontSize={16} mb={2} color="text.primary">
        Solicitudes{' '}
        <Typography component="span" fontWeight={400} color="text.secondary">
          ({pagination.totalItems})
        </Typography>
      </Typography>

      {/* Grid */}
      <Box
        sx={{
          display: 'grid',
          gap: 2.5,
          gridTemplateColumns: {
            xs: 'repeat(1, 1fr)',
            sm: 'repeat(2, 1fr)',
            lg: 'repeat(3, 1fr)',
          },
        }}
      >
        {isLoading
          ? Array.from({ length: LIMIT }).map((_, i) => (
              <Card key={i} sx={{ borderRadius: 3, overflow: 'hidden' }}>
                <Skeleton variant="rectangular" height={4} />
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" mb={1.5}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Skeleton variant="circular" width={36} height={36} />
                      <Box>
                        <Skeleton width={120} height={16} />
                        <Skeleton width={80} height={13} sx={{ mt: 0.3 }} />
                      </Box>
                    </Stack>
                    <Skeleton variant="rounded" width={72} height={22} />
                  </Stack>
                  <Skeleton width="70%" height={14} />
                  <Skeleton width="50%" height={14} sx={{ mt: 0.5 }} />
                  <Stack direction="row" spacing={1} mt={2}>
                    <Skeleton variant="rounded" width={80} height={28} />
                    <Skeleton variant="rounded" width={80} height={28} />
                  </Stack>
                </CardContent>
              </Card>
            ))
          : requests.length === 0
          ? (
            <Box
              sx={{
                gridColumn: '1 / -1',
                py: 10,
                textAlign: 'center',
                border: '1px dashed',
                borderColor: 'divider',
                borderRadius: 3,
                color: 'text.secondary',
              }}
            >
              <EventNoteIcon sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />
              <Typography>No hay solicitudes para mostrar.</Typography>
            </Box>
          )
          : requests.map((request: any) => (
              <RequestCard
                key={request._id}
                request={request}
                onAssign={() => approveMutation.mutate(request._id)}
                onReject={(reason) => rejectMutation.mutate({ id: request._id, reason })}
              />
            ))}
      </Box>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Stack direction="row" justifyContent="center" mt={4}>
          <Pagination
            count={pagination.totalPages}
            page={page}
            onChange={(_, v) => setPage(v)}
            shape="rounded"
            color="primary"
          />
        </Stack>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <MuiAlert severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </Container>
  );
};

export default RequestsPage;
