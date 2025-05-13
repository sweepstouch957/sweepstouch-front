'use client';

import { AvatarState } from '@/components/base/styles/avatar';
import { TabsAlternate } from '@/components/base/styles/tabs';
import { sweepstakesClient } from '@/services/sweepstakes.service';
import { AllInbox, QrCode, RedeemOutlined, Web } from '@mui/icons-material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TrendingUp from '@mui/icons-material/TrendingUp';
import {
  alpha,
  Box,
  Button,
  Card,
  Divider,
  Unstable_Grid2 as Grid,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Skeleton,
  Stack,
  styled,
  Tab,
  Typography,
  useTheme,
} from '@mui/material';
import { DefaultizedPieValueType } from '@mui/x-charts';
import { pieArcLabelClasses, PieChart } from '@mui/x-charts/PieChart';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { Fragment, useState } from 'react';
import { useTranslation } from 'react-i18next';

function cortarHastaPrimerNumeroIncluido(texto: string): string {
  const match = texto.match(/^.*?\d+/);
  return match ? match[0].trim() : texto;
}

const ListItemAvatarWrapper = styled(ListItemAvatar)(({ theme }) => ({
  minWidth: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: theme.spacing(1),
  padding: theme.spacing(0.5),
  borderRadius: '60px',
  background:
    theme.palette.mode === 'dark'
      ? alpha(theme.palette.common.white, 0.3)
      : alpha(theme.palette.common.black, 0.07),
  img: {
    background: theme.palette.common.white,
    padding: theme.spacing(1),
    display: 'block',
    borderRadius: 'inherit',
    height: theme.spacing(5.5),
    width: theme.spacing(5.5),
  },
}));

interface TabInfo {
  value: string;
  title: string;
  description: string;
  icon: React.ReactElement;
}

export const tabData: TabInfo[] = [
  {
    value: 'all',
    title: 'All',
    description: 'Gain insights',
    icon: <RedeemOutlined />,
  },
  {
    value: 'qr',
    title: 'QR',
    description: 'Gain insights',
    icon: <QrCode />,
  },
  {
    value: 'web',
    title: 'Web',
    description: 'Registrations by web',
    icon: <Web />,
  },
];

function SkeletonCardItem() {
  return (
    <ListItem>
      <ListItemAvatarWrapper>
        <Skeleton
          variant="circular"
          width={40}
          height={40}
        />
      </ListItemAvatarWrapper>
      <ListItemText
        primary={
          <Skeleton
            variant="text"
            width="70%"
          />
        }
        secondary={
          <Skeleton
            variant="text"
            width="50%"
          />
        }
      />
      <Box textAlign="right">
        <Skeleton
          variant="text"
          width={40}
        />
        <Skeleton
          variant="text"
          width={60}
        />
      </Box>
    </ListItem>
  );
}

function SweepstakesBalance() {
  const { t } = useTranslation();
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [method, setMethod] = useState<'qr' | 'web' | 'all'>('all');

  const { data = [], isLoading } = useQuery({
    queryKey: ['sweepstake-metrics', method],
    queryFn: () =>
      sweepstakesClient.getRegistrationsByStore({
        startDate: '2025-05-01',
        endDate: '2025-05-31',
        method: method === 'all' ? undefined : method,
      }),
    staleTime: 1000 * 60 * 5, // ❄️ 5 minutos "fresco"
  });

  const visibleData = expanded ? data : data.slice(0, 5);
  const total = data.reduce((acc, item) => acc + item.totalRegistrations, 0);

  const colors = [
    theme.palette.primary.main,
    theme.palette.error.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.info.main,
  ];

  const pieData = data.map((item, index) => ({
    label: item.storeName,
    value: item.totalRegistrations,
    color: colors[index % colors.length],
  }));

  const getArcLabel = (params: DefaultizedPieValueType) => {
    const percent = params.value / total;
    return `${(percent * 100).toFixed(0)}%`;
  };

  return (
    <Card>
      <Grid
        container
        spacing={0}
      >
        <Grid
          xs={12}
          md={3.5}
          display="flex"
          alignItems="center"
        >
          <Stack
            flex={1}
            spacing={3}
            p={2}
          >
            <Typography variant="h4">{t('Car Labor Day Summary')}</Typography>
            <Box>
              <Typography variant="h1">
                {isLoading ? <Skeleton width={120} /> : `${total} registros`}
              </Typography>
              <Typography
                variant="h4"
                fontWeight={400}
                color="text.secondary"
              >
                Total este mes
              </Typography>
            </Box>
            <Box
              display="flex"
              alignItems="center"
            >
              <AvatarState
                state="success"
                useShadow
                sx={{ mr: 2, width: 64, height: 64 }}
                variant="rounded"
              >
                <TrendingUp />
              </AvatarState>
              <Box>
                <Typography variant="h4">
                  {isLoading ? (
                    <Skeleton width={100} />
                  ) : (
                    `${data.reduce((acc, m) => acc + m.totalParticipations, 0)} participaciones`
                  )}
                </Typography>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                >
                  Participaciones totales
                </Typography>
              </Box>
            </Box>
          </Stack>
        </Grid>

        <Grid
          xs={12}
          md={8.5}
          sx={{
            position: 'relative',
            backgroundColor:
              theme.palette.mode === 'dark' ? alpha(theme.palette.neutral[25], 0.02) : 'neutral.25',
          }}
        >
          <Stack
            direction={'row'}
            justifyContent={'flex-end'}
            pt={1}
          >
            <TabsAlternate
              value={method}
              onChange={(_, newValue) => {
                setMethod(newValue as 'qr' | 'web');
              }}
              textColor="secondary"
              indicatorColor="secondary"
            >
              {tabData.map((tab) => (
                <Tab
                  key={tab.value}
                  value={tab.value}
                  label={
                    <Stack
                      textAlign="left"
                      width="100%"
                      direction="row"
                      spacing={0.5}
                      mt={1}
                    >
                      <Box>{tab.icon}</Box>
                      <Box overflow="hidden">
                        <Typography
                          variant="h5"
                          noWrap
                        >
                          {tab.title}
                        </Typography>
                      </Box>
                    </Stack>
                  }
                />
              ))}
            </TabsAlternate>
          </Stack>

          <Stack
            direction={{ xs: 'column', md: 'row' }}
            flex={1}
            p={2}
            spacing={3}
          >
            <Box
              display="flex"
              justifyContent="center"
              alignItems={'center'}
            >
              {isLoading ? (
                <Skeleton
                  variant="circular"
                  width={230}
                  height={230}
                />
              ) : (
                <PieChart
                  series={[
                    {
                      data: pieData,
                      innerRadius: 55,
                      outerRadius: 100,
                      paddingAngle: 5,
                      cornerRadius: 8,
                      startAngle: 0,
                      endAngle: 360,
                      highlightScope: { faded: 'global', highlighted: 'item' },
                      arcLabel: getArcLabel,
                    },
                  ]}
                  height={230}
                  width={230}
                  margin={{ right: 0 }}
                  slotProps={{ legend: { hidden: true } }}
                  sx={{
                    [`& .${pieArcLabelClasses.root}`]: {
                      fill: theme.palette.common.white,
                      fontWeight: 500,
                      fontSize: 14,
                    },
                  }}
                />
              )}
            </Box>

            <Card
              variant="outlined"
              elevation={0}
              sx={{ flex: 1 }}
            >
              <List disablePadding>
                {isLoading
                  ? Array.from({ length: 5 }).map((_, index) => (
                      <Fragment key={index}>
                        <SkeletonCardItem />
                        {index !== 4 && <Divider />}
                      </Fragment>
                    ))
                  : visibleData.map((item, index) => (
                      <Fragment key={item.storeId}>
                        <ListItem>
                          <ListItemAvatarWrapper>
                            <Image
                              src={item.storeImage}
                              alt={item.storeName}
                              width={40}
                              height={40}
                            />
                          </ListItemAvatarWrapper>
                          <ListItemText
                            primary={cortarHastaPrimerNumeroIncluido(item.storeName)}
                            primaryTypographyProps={{ variant: 'h5', noWrap: true }}
                            secondary={`${item.totalParticipations} registros`}
                            secondaryTypographyProps={{ variant: 'subtitle2', noWrap: true }}
                          />
                          <Box>
                            <Typography
                              align="right"
                              variant="h4"
                              noWrap
                            >
                              {(
                                (item.totalParticipations /
                                  data.reduce((acc, m) => acc + m.totalParticipations, 0)) *
                                100
                              ).toFixed(1)}
                              %
                            </Typography>
                          </Box>
                        </ListItem>
                        {index !== visibleData.length - 1 && <Divider />}
                      </Fragment>
                    ))}
              </List>

              {!isLoading && data.length > 5 && (
                <Box
                  textAlign="center"
                  py={2}
                >
                  <Button
                    endIcon={<ExpandMoreIcon />}
                    onClick={() => setExpanded(!expanded)}
                    variant="text"
                    size="small"
                  >
                    {expanded ? 'Ver menos' : 'Ver más'}
                  </Button>
                </Box>
              )}
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Card>
  );
}

export default SweepstakesBalance;
