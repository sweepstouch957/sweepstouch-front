'use client';

import YtdMessagesBarChart from '@/components/application-ui/composed-visualization-blocks/campaigns-bar/campaigns-bar';
import AudienceGrowthChart from '@/components/application-ui/composed-visualization-blocks/sweepstakes-resume/sweeptakes-resume';
import ReportsExportDialog from '@/components/application-ui/dialogs/resumen2025';
import ChartBarIcon from '@heroicons/react/24/outline/ChartBarIcon';
import TimelineRoundedIcon from '@mui/icons-material/TimelineRounded'; // ✅ opcional lindo
import { Box, Button, Container, Unstable_Grid2 as Grid, useTheme } from '@mui/material';
import React from 'react';
import { useTranslation } from 'react-i18next';
import SalesAlerts from 'src/components/application-ui/area-charts/sales-alerts/sales-alerts';
import PageHeading from 'src/components/base/page-heading';
import { AvatarState } from 'src/components/base/styles/avatar';

import { useCustomization } from 'src/hooks/use-customization';

function Page(): React.JSX.Element {
  const customization = useCustomization();
  const theme = useTheme();
  const { t } = useTranslation();

  const [openMetrics, setOpenMetrics] = React.useState(false); // ✅ NUEVO
  const lastYear = 2025; // ✅ año pasado (hoy 2026)

  const pageMeta = {
    title: 'Reports',
    description: 'Generate and access various reports',
    icon: <ChartBarIcon />,
  };

  return (
    <>
      {pageMeta.title && (
        <Container
          sx={{ py: { xs: 2, sm: 3 } }}
          maxWidth={customization.stretch ? false : 'xl'}
        >
          <PageHeading
            sx={{ px: 0 }}
            title={t(pageMeta.title)}
            description={pageMeta.description && pageMeta.description}
            actions={
              <Button
                sx={{ mt: { xs: 2, md: 0 } }}
                variant="contained"
                startIcon={<TimelineRoundedIcon fontSize="small" />}
                onClick={() => setOpenMetrics(true)} // ✅ ABRE MODAL
              >
                {t('Ver métricas 2025')}
              </Button>
            }
            iconBox={
              pageMeta.icon && (
                <AvatarState
                  isSoft
                  variant="rounded"
                  state="primary"
                  sx={{
                    height: theme.spacing(7),
                    width: theme.spacing(7),
                    svg: {
                      height: theme.spacing(4),
                      width: theme.spacing(4),
                      minWidth: theme.spacing(4),
                    },
                  }}
                >
                  {pageMeta.icon}
                </AvatarState>
              )
            }
          />
        </Container>
      )}

      <Container
        disableGutters
        maxWidth={customization.stretch ? false : 'xl'}
      >
        <Box
          px={{ xs: 2, sm: 3 }}
          pb={{ xs: 2, sm: 3 }}
        >
          <Grid
            container
            spacing={{ xs: 2, sm: 3 }}
          >
            <Grid xs={12}>
              <SalesAlerts />
            </Grid>

            {/* ✅ FORZAMOS 2025 en ambos charts del page */}
            <Grid xs={12}>
              <YtdMessagesBarChart year={lastYear} />
            </Grid>

            <Grid xs={12}>
              <AudienceGrowthChart year={lastYear} />
            </Grid>
          </Grid>
        </Box>
      </Container>

      {/* ✅ MODAL con reportes 2025 */}
      <ReportsExportDialog
        open={openMetrics}
        onClose={() => setOpenMetrics(false)}
        year={lastYear}
        // storeId={undefined} // si luego lo querés por tienda
      />
    </>
  );
}

export default Page;
