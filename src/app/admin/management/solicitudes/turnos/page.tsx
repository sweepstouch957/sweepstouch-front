'use client';

import KpiCard from '@/components/application-ui/card-shells/kpi-card';
import RequestCard from '@/components/application-ui/card-shells/request';
import PageHeading from '@/components/base/page-heading';
import { shiftService } from '@/services/shift.service';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Box, Container, Snackbar, Stack, Typography } from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

const RequestsPage = () => {
  const queryClient = useQueryClient();

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'error' as 'error' | 'success',
  });

  const { data } = useQuery({
    queryKey: ['shiftRequests'],
    queryFn: () => shiftService.getShiftRequests(),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => shiftService.approveShiftRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shiftRequests'] });
      setSnackbar({ open: true, message: 'Solicitud aprobada con éxito.', severity: 'success' });
    },
    onError: (err: any) => {
      console.log('Error approving request:', err);

      setSnackbar({
        open: true,
        message: err?.response?.data?.error || 'Error al aprobar la solicitud.',
        severity: 'error',
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      shiftService.rejectShiftRequest(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shiftRequests'] });
      setSnackbar({ open: true, message: 'Solicitud rechazada con éxito.', severity: 'success' });
    },
    onError: (err: any) => {
      setSnackbar({
        open: true,
        message: err?.response?.data?.error || 'Error al rechazar la solicitud.',
        severity: 'error',
      });
    },
  });
  const handleAssign = (id: string) => {
    approveMutation.mutate(id);
  };

  const handleReject = (id: string, reason: string) => {
    rejectMutation.mutate({ id, reason });
  };

  const stats = {
    total: data?.data.length || 0,
    pending: data?.data.filter((s) => s.status === 'pendiente').length || 0,
    assigned: data?.data.filter((s) => s.status === 'aprobado').length || 0,
    rejected: data?.data.filter((s) => s.status === 'rechazada').length || 0,
  };

  return (
    <Container maxWidth="xl">
      <PageHeading
        title="Gestión de Solicitudes"
        description="Programa y administra los turnos de trabajo"
      />

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        mt={4}
      >
        <KpiCard
          icon={<CalendarMonthIcon />}
          label="Total Solicitudes"
          value={stats.total}
        />
        <KpiCard
          icon={<AccessTimeIcon />}
          label="Pendientes"
          value={stats.pending}
        />
        <KpiCard
          icon={<CheckCircleIcon />}
          label="Aprobadas"
          value={stats.assigned}
        />
        <KpiCard
          icon={<CancelIcon />}
          label="Rechazadas"
          value={stats.rejected}
        />
      </Stack>

      <Box mt={6}>
        <Typography
          variant="h5"
          fontWeight={700}
          mb={3}
        >
          Lista de Solicitudes ({stats.total})
        </Typography>

        <Box
          sx={{
            display: 'grid',
            gap: 3,
            gridTemplateColumns: {
              xs: 'repeat(1, 1fr)',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
            },
          }}
        >
          {data?.data.map((request) => (
            <RequestCard
              key={request._id}
              request={request}
              onAssign={() => handleAssign(request._id)}
              onReject={(reason) => handleReject(request._id, reason)}
            />
          ))}
        </Box>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <MuiAlert
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </Container>
  );
};

export default RequestsPage;
