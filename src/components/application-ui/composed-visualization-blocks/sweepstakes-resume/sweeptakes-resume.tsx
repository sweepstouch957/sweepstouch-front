import { sweepstakesClient } from '@/services/sweepstakes.service';
import PieChartTwoToneIcon from '@mui/icons-material/PieChartTwoTone';
import {
  alpha,
  Box,
  Button,
  Card,
  Divider,
  Unstable_Grid2 as Grid,
  Skeleton,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

function Component() {
  const { t } = useTranslation();
  const theme = useTheme();
  const smUp = useMediaQuery(theme.breakpoints.up('sm'));

  const xLabels = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];

  const { data = [], isLoading } = useQuery({
    queryKey: ['sweepstake-reports'],
    queryFn: () => sweepstakesClient.getMonthlyParticipants(),
    staleTime: 1000 * 60 * 5,
  });

  const newCustomers = data.map((d) => d.newCustomers);
  const existingCustomers = data.map((d) => d.existingCustomers);

  return (
    <Card>
      <Grid container>
        <Grid
          xs={12}
          lg={12}
          display="flex"
          flexDirection="column"
        >
          <Box p={{ xs: 2, sm: 3 }}>
            <Box>
              <Typography variant="h4">{t('Monthly Participantes Status')}</Typography>
              <Typography
                variant="subtitle2"
                color="text.secondary"
              >
                {t('Check how the sweepstakes are going')}
              </Typography>
            </Box>
          </Box>

          <Divider />

          <Box
            flexGrow={1}
            px={2}
          >
            {isLoading ? (
              <Skeleton
                variant="rectangular"
                height={380}
              />
            ) : (
              <BarChart
                height={380}
                margin={{ left: smUp ? 62 : 0, top: 56, right: smUp ? 22 : 0 }}
                series={[
                  {
                    data: newCustomers,
                    label: 'New Customers',
                    stack: 'total',
                    color: theme.palette.success.light,
                  },
                  {
                    data: existingCustomers,
                    label: 'Existing',
                    stack: 'total',
                    color: theme.palette.secondary.light,
                  },
                ]}
                xAxis={[
                  {
                    scaleType: 'band',
                    data: xLabels,
                  },
                ]}
                slotProps={{
                  legend: {
                    labelStyle: {
                      fontWeight: 500,
                    },
                    itemMarkWidth: 12,
                    itemMarkHeight: 12,
                    markGap: 6,
                    itemGap: 12,
                    position: { vertical: 'top', horizontal: 'right' },
                    padding: { top: 12 },
                  },
                }}
                sx={{
                  '.MuiBarElement-root': {
                    fillOpacity: theme.palette.mode === 'dark' ? 0.76 : 1,
                    ry: theme.shape.borderRadius / 1.5,
                  },
                  '.MuiChartsLegend-mark': {
                    rx: theme.shape.borderRadius,
                  },
                  '.MuiChartsAxis-left': {
                    display: { xs: 'none', sm: 'block' },
                  },
                }}
              />
            )}
          </Box>

          <Divider />

          <Box
            p={{ xs: 2, sm: 3 }}
            sx={{
              textAlign: 'center',
              backgroundColor:
                theme.palette.mode === 'dark'
                  ? alpha(theme.palette.neutral[25], 0.02)
                  : 'neutral.25',
            }}
          >
            <Button
              size="large"
              sx={{
                px: 2,
                transform: 'translateY(0px)',
                boxShadow: `0px 1px 4px ${alpha(
                  theme.palette.primary.main,
                  0.25
                )}, 0px 3px 12px 2px ${alpha(theme.palette.primary.main, 0.35)}`,
                fontSize: theme.typography.pxToRem(14),
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: `0px 1px 4px ${alpha(
                    theme.palette.primary.main,
                    0.25
                  )}, 0px 3px 12px 2px ${alpha(theme.palette.primary.main, 0.35)}`,
                },
                '&:active': {
                  boxShadow: 'none',
                },
              }}
              variant="contained"
              startIcon={<PieChartTwoToneIcon />}
            >
              {t('Download report')}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Card>
  );
}

export default Component;
