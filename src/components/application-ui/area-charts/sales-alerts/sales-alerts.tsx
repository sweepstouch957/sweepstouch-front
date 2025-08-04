import { campaignClient } from '@/services/campaing.service';
import { customerClient } from '@/services/customerService';
import { sweepstakesClient } from '@/services/sweepstakes.service';
import { CampaignOutlined, Message, RedeemOutlined } from '@mui/icons-material';
import AssignmentIndTwoToneIcon from '@mui/icons-material/AssignmentIndTwoTone';
import {
  Box,
  Card,
  Chip,
  Unstable_Grid2 as Grid,
  Skeleton,
  styled,
  Typography,
  useTheme,
} from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AvatarState } from 'src/components/base/styles/avatar';

const ChartOverlay = styled(Box)(() => ({
  position: 'absolute',
  left: 0,
  top: 0,
  width: '100%',
  height: '100%',
  opacity: 0.2,
  zIndex: 5,
  '& > div': {
    position: 'absolute',
    left: 0,
    bottom: 0,
    right: 0,
    width: '100%',
  },
}));

const BoxAbsoluteOverlay = styled(Card)(() => ({
  position: 'relative',
}));

const CardContentOverlay = styled(Box)(({ theme }) => ({
  position: 'relative',
  zIndex: 6,
  padding: theme.spacing(4, 0),
}));

const laptopSales = [8531, 9509, 5143, 12614, 6318, 6048, 9684];
const totalSales = [285483, 560000, 599000, 600000, 605000, 601000, 602000];
const newAccounts = [5843, 6000, 5700, 6200, 5900, 6100, 5800];
const xLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];

function Component() {
  const { t } = useTranslation();
  const theme = useTheme();

  const {
    data: sweepstakesCount,
    isLoading: loadingSweepstakes,
    isError: errorSweepstakes,
  } = useQuery({
    queryKey: ['sweepstakesCount'],
    queryFn: () => sweepstakesClient.getSweepstakesParticipantCount(),
    staleTime: 1000 * 60 * 5,
  });

  const {
    data: customersCount,
    isLoading: loadingCustomers,
    isError: errorCustomers,
  } = useQuery({
    queryKey: ['customersCount'],
    queryFn: () => customerClient.getCustomerCount(),
    staleTime: 1000 * 60 * 5,
  });

  const {
    data: campaignsCount,
    isLoading: loadingCampaigns,
    isError: errorCampaigns,
  } = useQuery({
    queryKey: ['campaignsCount'],
    queryFn: () => campaignClient.getCampaignsCount(),
    staleTime: 1000 * 60 * 5,
  });

  const renderBox = (
    title: string,
    icon: JSX.Element,
    value: number | undefined,
    loading: boolean,
    error: boolean,
    chipLabel: string,
    chipColor: 'success' | 'error',
    chartData: number[],
    gradientId: string,
    chartColor: string
  ) => (
    <BoxAbsoluteOverlay>
      <CardContentOverlay
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {loading ? (
          <Skeleton
            variant="circular"
            width={64}
            height={64}
          />
        ) : (
          <AvatarState
            useShadow
            state="secondary"
            sx={{ height: 64, width: 64 }}
          >
            {icon}
          </AvatarState>
        )}

        <Typography
          variant="h1"
          sx={{ pt: 2 }}
        >
          {loading ? <Skeleton width={70} /> : error ? 'Error' : value}
        </Typography>

        <Typography
          variant="h5"
          fontWeight={500}
          sx={{ pb: 2 }}
        >
          {title}
        </Typography>

        <Chip
          label={chipLabel}
          variant="outlined"
          color={chipColor}
        />
      </CardContentOverlay>

      <ChartOverlay>
        {loading ? (
          <Skeleton
            variant="rectangular"
            height={170}
          />
        ) : (
          <LineChart
            height={170}
            leftAxis={null}
            margin={{ top: 0, bottom: 0, left: 0, right: 0 }}
            bottomAxis={null}
            slotProps={{ legend: { hidden: true } }}
            series={[
              {
                data: chartData,
                area: true,
                color: chartColor,
                showMark: false,
              },
            ]}
            xAxis={[{ scaleType: 'point', data: xLabels }]}
            sx={{
              '.MuiLineElement-root': {
                strokeWidth: 3,
              },
              '.MuiAreaElement-root': {
                fill: `url('#${gradientId}')`,
                fillOpacity: theme.palette.mode === 'dark' ? 0.76 : 1,
              },
            }}
          >
            <defs>
              <linearGradient
                id={gradientId}
                gradientTransform="rotate(90)"
              >
                <stop
                  offset="0%"
                  stopColor={chartColor}
                />
                <stop
                  offset="100%"
                  stopColor={theme.palette.background.paper}
                />
              </linearGradient>
            </defs>
          </LineChart>
        )}
      </ChartOverlay>
    </BoxAbsoluteOverlay>
  );

  return (
    <Grid
      container
      spacing={{ xs: 2, sm: 3 }}
    >
      <Grid
        xs={12}
        lg={4}
        md={6}
      >
        {renderBox(
          t('Send Messages this month'),
          <Message />,
          campaignsCount + 700000,
          loadingCampaigns,
          errorCampaigns,
          '+145%',
          'success',
          laptopSales,
          'successGradient1',
          theme.palette.success.main
        )}
      </Grid>

      <Grid
        xs={12}
        lg={4}
        md={6}
      >
        {renderBox(
          t('Total Customers'),
          <AssignmentIndTwoToneIcon />,
          customersCount,
          loadingCustomers,
          errorCustomers,
          '+23%',
          'success',
          totalSales,
          'successGradient1',
          theme.palette.success.main
        )}
      </Grid>

      <Grid
        xs={12}
        lg={4}
        md={6}
      >
        {renderBox(
          t('Sweeptakes Participants'),
          <RedeemOutlined />,
          sweepstakesCount,
          loadingSweepstakes,
          errorSweepstakes,
          '24%',
          'success',
          newAccounts,
          'successGradient2',
          theme.palette.success.main
        )}
      </Grid>
    </Grid>
  );
}

export default Component;
