'use client';

import { useSweepstakes } from '@/hooks/fetching/sweepstakes/useSweepstakes';
import { sweepstakesClient } from '@/services/sweepstakes.service';
import BarChartIcon from '@mui/icons-material/BarChart';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PeopleIcon from '@mui/icons-material/People';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

interface ActiveSweepstakeCardProps {
  storeId: string;
}

export const ActiveSweepstakeCard = ({ storeId }: ActiveSweepstakeCardProps) => {
  const queryClient = useQueryClient();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [selectedSweepstakeId, setSelectedSweepstakeId] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  const {
    data: sweepstake,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['active-sweepstake', storeId],
    queryFn: () => sweepstakesClient.getSweepstakeByStoreId(storeId,true),
    enabled: !!storeId,
  });


  const { data: allSweepstakes, isLoading: loadingAll } = useSweepstakes({ status: 'in progress' });

  const { mutate: reassign, isPending } = useMutation({
    mutationFn: (newId: string) =>
      sweepstakesClient.reasignSweepstake(sweepstake?._id || '', storeId, newId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-sweepstake', storeId] });
      setSnackbar({
        open: true,
        message: 'Sweepstake reasignado correctamente',
        severity: 'success',
      });
      setSelectedSweepstakeId('');
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Error al reasignar sweepstake', severity: 'error' });
    },
  });

  const handleReassign = () => {
    if (selectedSweepstakeId.trim()) {
      reassign(selectedSweepstakeId.trim());
    }
  };

  if (isLoading) return <CircularProgress />;

  if (isError || !sweepstake) {
    return (
      <Card
        sx={{
          p: 3,
          borderRadius: 4,
          boxShadow: 6,
          background: 'linear-gradient(to right, #fff7f9, #fceef4)',
          textAlign: 'center',
        }}
      >
        <Typography
          variant="h6"
          fontWeight={700}
          color="#fc066f"
          mb={2}
        >
          No hay un sweepstake activo
        </Typography>

        <Typography
          variant="body1"
          color="text.secondary"
          mb={3}
        >
          Puedes asignar uno nuevo desde el menú:
        </Typography>

        {loadingAll ? (
          <CircularProgress />
        ) : allSweepstakes?.length > 0 ? (
          <Stack
            spacing={2}
            direction={isMobile ? 'column' : 'row'}
            justifyContent="center"
          >
            <Select
              size="small"
              value={selectedSweepstakeId}
              onChange={(e) => setSelectedSweepstakeId(e.target.value)}
              displayEmpty
              sx={{ minWidth: 220, bgcolor: '#fff' }}
            >
              <MenuItem value="">Selecciona un sweepstake</MenuItem>
              {allSweepstakes.map((sw) => (
                <MenuItem
                  key={sw.id}
                  value={sw.id}
                >
                  {sw.name}
                </MenuItem>
              ))}
            </Select>

            <Button
              variant="contained"
              color="secondary"
              onClick={handleReassign}
              disabled={!selectedSweepstakeId}
            >
              Asignar
            </Button>
          </Stack>
        ) : (
          <Typography color="text.secondary">No hay sorteos disponibles</Typography>
        )}

        <Snackbar
          open={snackbar.open}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          autoHideDuration={4000}
          message={snackbar.message}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          ContentProps={{
            sx: {
              backgroundColor: snackbar.severity === 'success' ? '#4caf50' : '#f44336',
            },
          }}
        />
      </Card>
    );
  }

  return (
    <Card
      sx={{
        p: 2,
        borderRadius: 4,
        boxShadow: 6,
        background: 'linear-gradient(to right, #fdfbfb, #ebedee)',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'stretch' : 'center',
        gap: 3,
      }}
    >
      <Avatar
        src={sweepstake.image}
        alt={sweepstake.name}
        variant="rounded"
        sx={{
          width: isMobile ? '100%' : 120,
          height: isMobile ? 180 : 120,
          borderRadius: 3,
          objectFit: 'cover',
        }}
      />

      <Box flex={1}>
        <Typography
          variant="h6"
          fontWeight="bold"
          color="#004aad"
          mb={1}
        >
          {sweepstake.name}
        </Typography>

        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          mb={0.5}
        >
          <CalendarMonthIcon sx={{ color: '#fc066f' }} />
          <Typography
            variant="body2"
            color="text.secondary"
          >
            {new Date(sweepstake.startDate).toLocaleDateString()} -{' '}
            {new Date(sweepstake.endDate).toLocaleDateString()}
          </Typography>
        </Stack>

        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
        >
          <PeopleIcon sx={{ color: '#fc066f' }} />
          <Typography
            variant="body2"
            color="text.secondary"
          >
            Participantes: <strong>{sweepstake.participants}</strong>
          </Typography>
        </Stack>

        <Stack
          direction={isMobile ? 'column' : 'row'}
          spacing={2}
          mt={3}
        >
          <Select
            size="small"
            value={selectedSweepstakeId}
            onChange={(e) => setSelectedSweepstakeId(e.target.value)}
            displayEmpty
            sx={{ minWidth: 200, bgcolor: '#fff' }}
          >
            <MenuItem value="">Cambiar sweepstake</MenuItem>
            {allSweepstakes?.map((sw) => (
              <MenuItem
                key={sw.id}
                value={sw.id}
              >
                {sw.name}
              </MenuItem>
            ))}
          </Select>

          {selectedSweepstakeId && (
            <Button
              variant="contained"
              color="secondary"
              onClick={handleReassign}
              disabled={isPending}
            >
              {isPending ? 'Cambiando...' : 'Guardar'}
            </Button>
          )}

          <Button
            variant="outlined"
            startIcon={<BarChartIcon />}
            sx={{ ml: isMobile ? 0 : 'auto' }}
            disabled
          >
            Ver estadísticas
          </Button>
        </Stack>
      </Box>

      <Snackbar
        open={snackbar.open}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        autoHideDuration={4000}
        message={snackbar.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        ContentProps={{
          sx: {
            backgroundColor: snackbar.severity === 'success' ? '#4caf50' : '#f44336',
          },
        }}
      />
    </Card>
  );
};
