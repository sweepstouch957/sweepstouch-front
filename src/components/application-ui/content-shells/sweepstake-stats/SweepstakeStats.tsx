'use client';

import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import { Box, Button, Card, Container, Unstable_Grid2 as Grid } from '@mui/material';
import WeeklySales from 'src/components/application-ui/tables/sweepstakes-participant/participants-sweepstakes';
import { useCustomization } from 'src/hooks/use-customization';
import { DailyRegistrationsChart } from './DailyRegistrationsChart';
import { NewNumbersRanking } from './NewNumbersRanking';
import { ParticipantRecordsTable } from './ParticipantRecordsTable';
import { StatsFilters } from './StatsFilters';
import { StatsKpiCards } from './StatsKpiCards';
import { StatsTopBar } from './StatsTopBar';
import { StoreDistributionCard } from './StoreDistributionCard';
import { StorePerformanceGrid } from './StorePerformanceGrid';
import { useSweepstakeStats } from './use-sweepstake-stats';

/** Estadísticas de un sorteo: KPIs, filtros, gráficos, tiendas, lanzar sorteo y registros. */
export default function SweepstakeStats() {
  const customization = useCustomization();

  const {
    sweepstakeId,
    dateRange,
    setDateRange,
    method,
    setMethod,
    exporting,
    sweepstake,
    sweepstakeLoading,
    metricsLoading,
    metricsFetching,
    refetchMetrics,
    dailyLoading,
    refetchDaily,
    stores,
    totalParticipations,
    totalNewNumbers,
    totalRegistrations,
    totalExistingNumbers,
    storeCount,
    avgPerStore,
    storesByNuevos,
    pieColors,
    grouped,
    sortedStores,
    dailyMetrics,
    chartDates,
    chartNew,
    chartExisting,
    handleExport,
    lastUpdated,
  } = useSweepstakeStats();

  return (
    <>
      <Container
        maxWidth={customization.stretch ? false : 'xl'}
        sx={{ pt: { xs: 2, sm: 3 }, pb: 2 }}
      >
        {/* ── Top bar ──────────────────────────────────────────────────────── */}
        <StatsTopBar
          exporting={exporting}
          sweepstake={sweepstake}
          sweepstakeLoading={sweepstakeLoading}
          metricsLoading={metricsLoading}
          metricsFetching={metricsFetching}
          refetchMetrics={refetchMetrics}
          refetchDaily={refetchDaily}
          handleExport={handleExport}
          lastUpdated={lastUpdated}
        />

        {/* ── KPI Cards ────────────────────────────────────────────────────── */}
        <StatsKpiCards
          metricsLoading={metricsLoading}
          totalParticipations={totalParticipations}
          totalNewNumbers={totalNewNumbers}
          totalRegistrations={totalRegistrations}
          totalExistingNumbers={totalExistingNumbers}
          storeCount={storeCount}
          avgPerStore={avgPerStore}
        />

        {/* ── Filters ──────────────────────────────────────────────────────── */}
        <StatsFilters
          dateRange={dateRange}
          setDateRange={setDateRange}
          method={method}
          setMethod={setMethod}
        />

        {/* ── Daily Bar Chart ───────────────────────────────────────────────── */}
        <DailyRegistrationsChart
          dailyLoading={dailyLoading}
          dailyMetrics={dailyMetrics}
          chartDates={chartDates}
          chartNew={chartNew}
          chartExisting={chartExisting}
        />

        {/* ── Pie + Store Grid ─────────────────────────────────────────────── */}
        <Grid
          container
          spacing={{ xs: 2, sm: 3 }}
          sx={{ mb: 3 }}
        >
          {/* Pie distribution */}
          <StoreDistributionCard
            metricsLoading={metricsLoading}
            grouped={grouped}
          />

          {/* Store performance grid — by participations */}
          <StorePerformanceGrid
            metricsLoading={metricsLoading}
            stores={stores}
            totalParticipations={totalParticipations}
            pieColors={pieColors}
            sortedStores={sortedStores}
          />
        </Grid>

        {/* ── Nuevos Ranking ───────────────────────────────────────────────── */}
        <NewNumbersRanking
          metricsLoading={metricsLoading}
          storesByNuevos={storesByNuevos}
        />
      </Container>

      {/* ── Draw Launcher ────────────────────────────────────────────────── */}
      <Container
        disableGutters
        maxWidth={customization.stretch ? false : 'xl'}
      >
        <Box
          px={{ xs: 2, sm: 3 }}
          pb={{ xs: 2, sm: 3 }}
        >
          <Card
            variant="outlined"
            sx={{
              borderRadius: 3,
              p: { xs: 3, sm: 4 },
              bgcolor: 'background.paper',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Button
              variant="contained"
              size="large"
              startIcon={<PlayArrowRoundedIcon />}
              onClick={() =>
                window.open(`/sweepstakes/${sweepstakeId}/draw`, '_blank', 'noopener,noreferrer')
              }
              sx={{
                bgcolor: 'primary.main',
                borderRadius: 999,
                fontSize: { xs: 16, sm: 18 },
                fontWeight: 800,
                px: { xs: 3.5, sm: 5 },
                py: 1.5,
                textTransform: 'none',
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
              }}
            >
              Iniciar sorteo
            </Button>
          </Card>
        </Box>
      </Container>

      {/* ── Registros (participantes) ─────────────────────────────────────── */}
      <Container
        disableGutters
        maxWidth={customization.stretch ? false : 'xl'}
      >
        <Box
          px={{ xs: 2, sm: 3 }}
          pb={{ xs: 3, sm: 4 }}
        >
          <ParticipantRecordsTable
            sweepstakeId={sweepstakeId}
            startDate={dateRange.startYmd}
            endDate={dateRange.endYmd}
          />
        </Box>
      </Container>

      {/* ── Participants Table ────────────────────────────────────────────── */}
      <Container
        disableGutters
        maxWidth={customization.stretch ? false : 'xl'}
      >
        <Box
          px={{ xs: 2, sm: 3 }}
          pb={{ xs: 3, sm: 4 }}
        >
          <WeeklySales sweepstakeId={sweepstakeId} />
        </Box>
      </Container>
    </>
  );
}
