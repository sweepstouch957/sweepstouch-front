'use client';

import { sweepstakesClient } from '@/services/sweepstakes.service';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Skeleton,
  Stack,
  styled,
  Typography,
  useTheme,
} from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { useQuery } from '@tanstack/react-query';
import { format, subHours } from 'date-fns';
import { useTranslation } from 'react-i18next';

// Styled Dividers
const DividerInfo = styled(Divider)(({ theme }) => ({
  height: '4px',
  background: theme.palette.info.main,
}));

const DividerSuccess = styled(Divider)(({ theme }) => ({
  height: '4px',
  background: theme.palette.success.main,
}));

export default function AudienceGrowthKPICard() {
  const theme = useTheme();
  const { t } = useTranslation();

  const { data, isLoading } = useQuery({
    queryKey: ['audience-growth'],
    queryFn: () => sweepstakesClient.getMonthlyParticipants(),
    staleTime: 1000 * 60 * 10,
  });

  const months = data?.months ?? [];

  const xLabels = months.map((m) => m.month);
  const newCustomers = months.map((m) => m.newCustomers);
  const existingCustomers = months.map((m) => m.existingCustomers);

  const sumNew = newCustomers.reduce((a, b) => a + b, 0);
  const sumExisting = existingCustomers.reduce((a, b) => a + b, 0);
  const sumTotal = sumNew + sumExisting;

  const pctNew = sumTotal > 0 ? (sumNew / sumTotal) * 100 : 0;
  const pctExisting = sumTotal > 0 ? (sumExisting / sumTotal) * 100 : 0;

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <CardHeader
        sx={{ p: { xs: 2, sm: 3 } }}
        titleTypographyProps={{
          variant: 'h5',
          fontWeight: 600,
          sx: {
            textTransform: 'uppercase',
            textAlign: 'center',
          },
        }}
        title={t('Crecimiento de Audiencia')}
      />

      <CardContent
        sx={{
          py: 0,
          px: { xs: 0, sm: 2 },
          flex: 1,
        }}
      >
        {isLoading ? (
          <Skeleton
            variant="rectangular"
            height={300}
          />
        ) : (
          <BarChart
            height={300}
            leftAxis={null}
            margin={{ left: 24, top: 24, right: 24 }}
            series={[
              {
                data: newCustomers,
                label: 'Nuevos',
                color: theme.palette.info.light,
              },
              {
                data: existingCustomers,
                label: 'Existentes',
                color: theme.palette.success.light,
              },
            ]}
            slotProps={{
              legend: {
                hidden: false,
                position: { vertical: 'top', horizontal: 'right' },
                labelStyle: { fontWeight: 600 },
              },
            }}
            xAxis={[
              {
                scaleType: 'band',
                data: xLabels,
              },
            ]}
            sx={{
              '.MuiBarElement-root': {
                fillOpacity: theme.palette.mode === 'dark' ? 0.8 : 1,
                rx: theme.shape.borderRadius / 1.6,
                fill: "url('#audienceGradient')",
              },
              '.MuiChartsAxis-left': {
                display: 'none',
              },
            }}
          >
            <defs>
              <linearGradient
                id="audienceGradient"
                gradientTransform="rotate(90)"
              >
                <stop
                  offset="0%"
                  stopColor={theme.palette.info.light}
                />
                <stop
                  offset="100%"
                  stopColor={theme.palette.success.main}
                />
              </linearGradient>
            </defs>
          </BarChart>
        )}

        <Stack
          sx={{ px: 4 }}
          direction="row"
          justifyContent="center"
          alignItems="center"
          spacing={1}
        >
          <Box
            py={3}
            sx={{ width: '100%' }}
          >
            <Typography
              component="h6"
              variant="h6"
              textTransform="uppercase"
              fontWeight={500}
              textAlign="center"
              sx={{ pb: 1 }}
            >
              {t('Nuevos')}
            </Typography>
            <DividerInfo />
          </Box>

          <Box
            py={3}
            sx={{ width: '100%' }}
          >
            <Typography
              component="h6"
              variant="h6"
              textTransform="uppercase"
              fontWeight={500}
              textAlign="center"
              sx={{ pb: 1 }}
            >
              {t('Existentes')}
            </Typography>
            <DividerSuccess />
          </Box>
        </Stack>

        <Typography
          component="h6"
          variant="subtitle2"
          fontWeight={600}
          textAlign="center"
          color="text.secondary"
        >
          {format(subHours(new Date(), 5), 'MMMM dd yyyy')}
        </Typography>

        {/* Percentages */}
        <Stack
          sx={{  px: 4 }}
          direction="row"
          justifyContent="center"
          alignItems="center"
          spacing={1}
        >
          <Box sx={{ width: '100%' }}>
            <Typography
              component="h6"
              variant="h2"
              textAlign="center"
              sx={{
                color: theme.palette.info.main,
                pb: 1,
              }}
            >
              {pctNew.toFixed(1)}%
            </Typography>
          </Box>

          <Box sx={{ width: '100%' }}>
            <Typography
              component="h6"
              variant="h2"
              textAlign="center"
              sx={{
                color: theme.palette.success.main,
                pb: 1,
              }}
            >
              {pctExisting.toFixed(1)}%
            </Typography>
          </Box>
        </Stack>

        {/* Totals */}
        <Stack
          sx={{ mt: 2, px: 4 }}
          direction="row"
          justifyContent="center"
          alignItems="center"
          spacing={1}
        >
          <Box sx={{ width: '100%' }}>
            <Typography
              component="h6"
              variant="body1"
              fontWeight={600}
              textAlign="center"
            >
              {t('Total nuevos')}: {sumNew.toLocaleString()}
            </Typography>
          </Box>

          <Box sx={{ width: '100%' }}>
            <Typography
              component="h6"
              variant="body1"
              fontWeight={600}
              textAlign="center"
            >
              {t('Total existentes')}: {sumExisting.toLocaleString()}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

