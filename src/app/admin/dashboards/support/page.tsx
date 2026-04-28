'use client';

import BuildRoundedIcon from '@mui/icons-material/BuildRounded';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import { Box, Button, Container, Unstable_Grid2 as Grid, useTheme } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { useTranslation } from 'react-i18next';
import RecentTicketsList from 'src/components/admin/support/RecentTicketsList';
import SupportMetricCards from 'src/components/admin/support/SupportMetricCards';
import SupportTypeChart from 'src/components/admin/support/SupportTypeChart';
import WeeklyVisitsChart from 'src/components/admin/support/WeeklyVisitsChart';
import PageHeading from 'src/components/base/page-heading';
import { AvatarState } from 'src/components/base/styles/avatar';
import { useCustomization } from 'src/hooks/use-customization';
import supportService from 'src/services/support.service';

function Page(): React.JSX.Element {
  const customization = useCustomization();
  const theme = useTheme();
  const { t } = useTranslation();

  const { data: metrics, isLoading: loadingMetrics } = useQuery({
    queryKey: ['support-metrics'],
    queryFn: supportService.getSupportMetrics,
    refetchInterval: 60_000,
  });

  const { data: ticketsRes, isLoading: loadingTickets } = useQuery({
    queryKey: ['support-tickets-open'],
    queryFn: () => supportService.getTickets({ status: 'open', limit: 10, priority: undefined }),
    refetchInterval: 60_000,
  });

  return (
    <>
      <Container
        sx={{ py: { xs: 2, sm: 3 } }}
        maxWidth={customization.stretch ? false : 'xl'}
      >
        <PageHeading
          sx={{ px: 0 }}
          title={t('Soporte Técnico')}
          description="Gestión de tickets y visitas del equipo técnico"
          actions={
            <Button
              sx={{ mt: { xs: 2, md: 0 } }}
              variant="contained"
              startIcon={<FileDownloadOutlinedIcon fontSize="small" />}
            >
              {t('Exportar')}
            </Button>
          }
          iconBox={
            <AvatarState
              isSoft
              variant="rounded"
              state="primary"
              sx={{
                height: theme.spacing(7),
                width: theme.spacing(7),
                svg: { height: theme.spacing(4), width: theme.spacing(4), minWidth: theme.spacing(4) },
              }}
            >
              <BuildRoundedIcon />
            </AvatarState>
          }
        />
      </Container>

      <Container disableGutters maxWidth={customization.stretch ? false : 'xl'}>
        <Box px={{ xs: 2, sm: 3 }} pb={{ xs: 2, sm: 3 }}>
          <Grid container spacing={{ xs: 2, sm: 3 }}>

            {/* Metric cards - full width */}
            <Grid xs={12}>
              <SupportMetricCards metrics={metrics} loading={loadingMetrics} />
            </Grid>

            {/* Charts row */}
            <Grid xs={12} md={7}>
              <WeeklyVisitsChart weeklyVisits={metrics?.weeklyVisits} loading={loadingMetrics} />
            </Grid>
            <Grid xs={12} md={5}>
              <SupportTypeChart distribution={metrics?.typeDistribution} loading={loadingMetrics} />
            </Grid>

            {/* Priority tickets list */}
            <Grid xs={12}>
              <RecentTicketsList
                tickets={ticketsRes?.data ?? []}
                loading={loadingTickets}
              />
            </Grid>
          </Grid>
        </Box>
      </Container>
    </>
  );
}

export default Page;
