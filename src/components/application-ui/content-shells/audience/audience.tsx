'use client';

/**
 * Dashboard de audiencia.
 *
 * Antes esta página disparaba cinco endpoints y renderizaba dos: `series` (un
 * agregado del año entero), `alerts` y `simulate` se pedían en cada carga y su
 * respuesta se tiraba — sólo alimentaban una barra de progreso. Eso, más que
 * ninguna otra cosa, era la espera.
 *
 * Ahora se piden dos, y cada bloque muestra su propio esqueleto en vez de
 * bloquear la página entera hasta que termina la query más lenta.
 */

import { AudienceCharts } from '@/components/audience/AudienceCharts';
import { AudienceKpis } from '@/components/audience/AudienceKpis';
import { AudienceSummaryExecutive } from '@/components/audience/AudienceSummaryExecutive';
import { useAudienceSummary, useAudienceWeekly } from '@/hooks/fetching/campaigns/useAudience';
import type {
  AudiencePeriod,
  AudienceQueryParams,
  WeeklyBreakdownQueryParams,
} from '@/services/campaing.service';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import { Alert, Box, Container, Grid, Stack } from '@mui/material';
import React, { useMemo, useState } from 'react';
import PageHeading from 'src/components/base/page-heading';
import AudienceFilters from './audience-filters';
import NearbyOpportunitiesCard from './nearby-opportunities-card';
import SharedCustomersCard from './shared-customers-card';

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function defaultRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 30);
  return { start: toISODate(start), end: toISODate(end) };
}

/** Semanas del desglose según el período: más rango, más barras. */
const WEEKS_BY_PERIOD: Record<string, number> = { '7d': 2, '14d': 4, '30d': 8 };

export default function Audience(): React.JSX.Element {
  const [period, setPeriod] = useState<AudiencePeriod>('30d');
  const [includeInactive, setIncludeInactive] = useState(false);

  const initial = useMemo(() => defaultRange(), []);
  const [customStart, setCustomStart] = useState(initial.start);
  const [customEnd, setCustomEnd] = useState(initial.end);

  const baseParams: AudienceQueryParams = useMemo(() => {
    const p: AudienceQueryParams = { period, includeInactive };
    if (period === 'custom') {
      p.start = customStart;
      p.end = customEnd;
    }
    return p;
  }, [period, includeInactive, customStart, customEnd]);

  const weeklyParams: WeeklyBreakdownQueryParams = useMemo(
    () => ({ ...baseParams, weeks: WEEKS_BY_PERIOD[period] ?? 12 }),
    [baseParams, period]
  );

  const summary = useAudienceSummary(baseParams);
  const weekly = useAudienceWeekly(weeklyParams);

  return (
    <Container
      maxWidth="xl"
      sx={{ py: 2 }}
    >
      <PageHeading
        sx={{ px: 0 }}
        iconBox={<InsightsRoundedIcon />}
        title="Audiencia"
        description="Cuánto crece la base, quién la está usando y qué números están parados."
      />

      <Stack
        gap={2.5}
        sx={{ mt: 2 }}
      >
        <AudienceFilters
          period={period}
          onPeriodChange={setPeriod}
          customStart={customStart}
          customEnd={customEnd}
          onCustomStartChange={setCustomStart}
          onCustomEndChange={setCustomEnd}
          includeInactive={includeInactive}
          onIncludeInactiveChange={setIncludeInactive}
        />

        {summary.isError && (
          <Alert severity="error">
            No se pudieron cargar los totales de audiencia. El resto de la página sigue funcionando.
          </Alert>
        )}

        <AudienceKpis
          senders={summary.data?.senders}
          nonSenders={summary.data?.nonSenders}
        />

        <AudienceCharts
          summary={summary.data}
          weekly={weekly.data}
          loading={summary.isLoading || weekly.isLoading}
          weeklyError={weekly.isError}
        />

        {/* Los dos bloques nuevos van juntos: uno dice cuántas personas hay de
            verdad detrás de los contactos, el otro a cuántas no les llega nada.
            Cada uno tiene su propia query y su propio esqueleto. */}
        <Grid
          container
          spacing={2.5}
        >
          <Grid
            item
            xs={12}
            lg={5}
          >
            <SharedCustomersCard />
          </Grid>
          <Grid
            item
            xs={12}
            lg={7}
          >
            <NearbyOpportunitiesCard params={baseParams} />
          </Grid>
        </Grid>

        <Box>
          <AudienceSummaryExecutive
            data={summary.data}
            loading={summary.isLoading}
            error={summary.isError}
          />
        </Box>
      </Stack>
    </Container>
  );
}
