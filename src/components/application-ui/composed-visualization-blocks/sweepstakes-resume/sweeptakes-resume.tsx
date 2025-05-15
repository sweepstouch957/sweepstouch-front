import MoreHorizTwoToneIcon from '@mui/icons-material/MoreHorizTwoTone';
import PieChartTwoToneIcon from '@mui/icons-material/PieChartTwoTone';
import {
  alpha,
  Box,
  Button,
  Card,
  Divider,
  Unstable_Grid2 as Grid,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { useTranslation } from 'react-i18next';

const generateRandomData = (): number[] =>
  Array.from({ length: 9 }, () => Math.floor(Math.random() * 3000));

function Component() {
  const { t } = useTranslation();
  const theme = useTheme();
  const smUp = useMediaQuery(theme.breakpoints.up('sm'));

  const xLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul' , 'Oct' , 'Sep'];

  return (
    <Card>
      <Grid container>
        <Grid
          xs={12}
          lg={12}
          sx={{
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box p={{ xs: 2, sm: 3 }}>
            <Box>
              <Typography variant="h4">{t('Monthly Participantes Status')}</Typography>
              <Typography
                variant="subtitle2"
                color="text.secondary"
              >
                {t("Check how the sweepstakes are going")}
              </Typography>
            </Box>
          </Box>
          <Divider />
          <Box
            flexGrow={1}
            px={2}
          >
            <BarChart
              height={380}
              margin={{ left: smUp ? 62 : 0, top: 56, right: smUp ? 22 : 0 }}
              series={[
                {
                  data: generateRandomData(),
                  label: 'New Customers',
                  stack: 'total',
                  color: theme.palette.success.light,
                },
                {
                  data: generateRandomData(),
                  label: 'Existing',
                  stack: 'total',
                  color: theme.palette.secondary.light,
                },
              ]}
              xAxis={[
                {
                  scaleType: 'band',
                  data: xLabels,
                  //@ts-ignore
                  categoryGapRatio: 0.4,
                  barGapRatio: 0.3,
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
          </Box>
          <Divider />
          <Box
            p={{ xs: 2, sm: 3 }}
            sx={{
              textAlign: 'center',
              backgroundColor: (theme) =>
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
