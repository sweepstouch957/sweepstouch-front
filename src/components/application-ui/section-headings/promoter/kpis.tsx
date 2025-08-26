// components/ActivationRequestsKpis.tsx
'use client';

import KpiCard from '@/components/application-ui/card-shells/kpi-card';
import { useActivationRequestsStats } from '@/hooks/fetching/promoter/useActivationStats';
import { InfoOutlined } from '@mui/icons-material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Alert, Card, CardContent, Skeleton, Stack } from '@mui/material';

interface Props {
  from?: string; // ISO date
  to?: string; // ISO date
  dangerCount?: number;
}

const KpiSkeleton = () => (
  <Card sx={{ flex: 1, minWidth: 220 }}>
    <CardContent>
      <Skeleton
        variant="text"
        width={120}
        height={24}
      />
      <Skeleton
        variant="rounded"
        height={36}
        sx={{ mt: 1 }}
      />
    </CardContent>
  </Card>
);

/**
 * Renderiza los KPIs de solicitudes de activación.
 * - Usa el hook useActivationRequestsStats
 * - Muestra 4 skeletons mientras carga
 * - Mapea los nombres del backend -> UI
 */
export default function ActivationRequestsKpis({ from, to, dangerCount }: Props) {
  const { data, isLoading, isFetching, error } = useActivationRequestsStats({ from, to });

  if (error) {
    return <Alert severity="error">No se pudieron cargar las estadísticas.</Alert>;
  }

  const apiStats = data?.data ?? {
    total: 0,
    pendiente: 0,
    aprobado: 0,
    rechazado: 0,
  };

  // Mapeo a las props que usa tu UI existente
  const stats = {
    total: apiStats.total,
    pending: apiStats.pendiente,
    approved: apiStats.aprobado,
    rejected: apiStats.rechazado,
  };

  const loading = isLoading || isFetching;

  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      spacing={2}
      mt={2}
    >
      {loading ? (
        <>
          <KpiSkeleton />
          <KpiSkeleton />
          <KpiSkeleton />
          <KpiSkeleton />

          <KpiSkeleton />
        </>
      ) : (
        <>
          <KpiCard
            icon={<CalendarMonthIcon />}
            label="Total Solicitudes"
            value={stats.total}
          />
           <KpiCard
            icon={<InfoOutlined />}
            label="Tiendas en Peligro"
            value={dangerCount || 0}
          />
          <KpiCard
            icon={<AccessTimeIcon />}
            label="Pendientes"
            value={stats.pending}
          />
          <KpiCard
            icon={<CheckCircleIcon />}
            label="Aprobadas"
            value={stats.approved}
          />
          <KpiCard
            icon={<CancelIcon />}
            label="Rechazadas"
            value={stats.rejected}
          />
        </>
      )}
    </Stack>
  );
}
