'use client';

import KpiCard from '@/components/application-ui/card-shells/kpi-card';
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import { Unstable_Grid2 as Grid } from '@mui/material';
import { routes } from 'src/router/routes';
import type { useSweepstakeStats } from './use-sweepstake-stats';

type Props = Pick<
  ReturnType<typeof useSweepstakeStats>,
  | 'metricsLoading'
  | 'totalParticipations'
  | 'totalNewNumbers'
  | 'totalRegistrations'
  | 'totalExistingNumbers'
  | 'storeCount'
  | 'avgPerStore'
>;

/** KPIs: números nuevos, participaciones, tiendas activas y ya registrados. */
export function StatsKpiCards({
  metricsLoading,
  totalParticipations,
  totalNewNumbers,
  totalRegistrations,
  totalExistingNumbers,
  storeCount,
  avgPerStore,
}: Props) {
  return (
    <Grid
      container
      spacing={{ xs: 1.5, sm: 2 }}
      sx={{ mb: 3 }}
    >
      <Grid
        xs={12}
        sm={6}
        lg={3}
      >
        <KpiCard
          layout="horizontal"
          label="Números nuevos"
          value={metricsLoading ? '—' : totalNewNumbers.toLocaleString()}
          descriptions={
            totalRegistrations > 0
              ? `${Math.round((totalNewNumbers / totalRegistrations) * 100)}% del total registrado`
              : undefined
          }
          variant="success"
          icon={<PersonAddAlt1RoundedIcon fontSize="small" />}
        />
      </Grid>
      <Grid
        xs={12}
        sm={6}
        lg={3}
      >
        <KpiCard
          layout="horizontal"
          label="Participaciones"
          value={metricsLoading ? '—' : totalParticipations.toLocaleString()}
          descriptions={
            storeCount > 0 ? `~${avgPerStore.toLocaleString()} promedio / tienda` : undefined
          }
          icon={<TrendingUpRoundedIcon fontSize="small" />}
        />
      </Grid>
      <Grid
        xs={12}
        sm={6}
        lg={3}
      >
        <KpiCard
          layout="horizontal"
          label="Tiendas activas"
          value={metricsLoading ? '—' : storeCount.toLocaleString()}
          descriptions={
            totalRegistrations > 0
              ? `${totalRegistrations.toLocaleString()} registros · Ver tiendas`
              : 'Ver tiendas'
          }
          variant="info"
          icon={<StorefrontRoundedIcon fontSize="small" />}
          href={routes.admin.management.stores.listing}
        />
      </Grid>
      <Grid
        xs={12}
        sm={6}
        lg={3}
      >
        <KpiCard
          layout="horizontal"
          label="Ya registrados"
          value={metricsLoading ? '—' : totalExistingNumbers.toLocaleString()}
          descriptions={
            totalRegistrations > 0
              ? `${Math.round((totalExistingNumbers / totalRegistrations) * 100)}% recurrentes`
              : undefined
          }
          icon={<PeopleRoundedIcon fontSize="small" />}
        />
      </Grid>
    </Grid>
  );
}
