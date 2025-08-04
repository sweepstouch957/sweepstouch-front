'use client';

import { shiftService } from '@/services/shift.service';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ReportIcon from '@mui/icons-material/Report';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { Box, Skeleton } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import KpiCard from '../../card-shells/kpi-card';

export default function KpiCards() {
  const { data, isLoading } = useQuery({
    queryKey: ['shift-metrics'],
    queryFn: () => shiftService.getShiftMetrics(),
  });

  const kpis = [
    {
      icon: <CalendarMonthIcon sx={{ fontSize: 24 }} />,
      label: 'Total Turnos',
      value: data?.total,
    },
    {
      icon: <TrendingUpIcon sx={{ fontSize: 24 }} />,
      label: 'En Progreso',
      value: data?.inProgress || 0,
    },
    {
      icon: <AccessTimeIcon sx={{ fontSize: 24 }} />,
      label: 'Programados',
      value: data?.scheduled || 0,
    },
    {
      icon: <ReportIcon sx={{ fontSize: 24 }} />,
      label: 'Sin Asignar',
      value: data?.unassigned || 0,
    },
  ];

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
        mb: 3,
      }}
    >
      {isLoading
        ? Array.from({ length: 4 }).map((_, idx) => (
            <Skeleton
              key={idx}
              variant="rounded"
              height={120}
              animation="wave"
            />
          ))
        : kpis.map((kpi) => (
            <KpiCard
              key={kpi.label}
              icon={kpi.icon}
              label={kpi.label}
              value={kpi.value}
            />
          ))}
    </Box>
  );
}
