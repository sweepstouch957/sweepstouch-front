'use client';

import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PeopleIcon from '@mui/icons-material/People';
import StarIcon from '@mui/icons-material/Star';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { Box, Stack } from '@mui/material';
import KpiCard from '../../card-shells/kpi-card';

const KpiSection = () => {
  return (
    <Box py={2}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        justifyContent={{ sm: 'space-between' }}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        flexWrap="wrap"
      >
        <KpiCard
          icon={<PeopleIcon />}
          label="Total Impulsadoras"
          value={5}
        />
        <KpiCard
          icon={<TrendingUpIcon />}
          label="Activas"
          value={3}
        />
        <KpiCard
          icon={<CalendarMonthIcon />}
          label="Total Turnos"
          value={154}
        />
        <KpiCard
          icon={<StarIcon />}
          label="Rating Promedio"
          value={4.7}
        />
      </Stack>
    </Box>
  );
};

export default KpiSection;
