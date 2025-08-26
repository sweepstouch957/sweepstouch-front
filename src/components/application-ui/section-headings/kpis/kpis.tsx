'use client';

import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PeopleIcon from '@mui/icons-material/People';
import StarIcon from '@mui/icons-material/Star';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import KpiCard from '../../card-shells/kpi-card';
import { promoterService } from '@/services/promotor.service';

const KpiSection = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['promoterDashboardStats'],
    queryFn: () => promoterService.getDashboardStats(),
  });

  if (isLoading) {
    return (
      <Box
        py={4}
        textAlign="center"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (isError || !data) {
    return (
      <Typography
        color="error"
        textAlign="center"
        py={4}
      >
        No se pudieron cargar las estadísticas.
      </Typography>
    );
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: 'repeat(2, 1fr)',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(4, 1fr)',
        },
        gap: 2,
      }}
    >
      <KpiCard
        icon={<PeopleIcon />}
        label="Total Impulsadoras"
        value={data.totalPromoters}
      />
      <KpiCard
        icon={<TrendingUpIcon />}
        label="Activas"
        value={data.activePromoters}
      />
      <KpiCard
        icon={<CalendarMonthIcon />}
        label="Total Turnos"
        value={data.totalShifts}
      />
      <KpiCard
        icon={<StarIcon />}
        label="Rating Promedio"
        value={data.avgRating.toFixed(1)}
      />
    </Box>
  );
};

export default KpiSection;
