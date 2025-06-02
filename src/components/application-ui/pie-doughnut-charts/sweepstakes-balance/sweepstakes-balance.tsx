'use client';

import { AvatarState } from '@/components/base/styles/avatar';
import { sweepstakesClient } from '@/services/sweepstakes.service';
import { QrCode, RedeemOutlined, Web } from '@mui/icons-material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TrendingUp from '@mui/icons-material/TrendingUp';
import {
  alpha,
  Box,
  Button,
  Card,
  Divider,
  FormControl,
  Unstable_Grid2 as Grid,
  InputLabel,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  styled,
  Tab,
  Typography,
  useTheme,
} from '@mui/material';
import { pieArcLabelClasses, PieChart } from '@mui/x-charts/PieChart';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import BasicIcon from '@public/web/basic.png';
import PremiumIcon from '@public/web/elite.png';
import FreeIcon from '@public/web/free.png';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Image from 'next/image';
import { Fragment, useState } from 'react';
import { useTranslation } from 'react-i18next';

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
  {
    value: 'referral',
    title: 'Referidos',
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

const getImage = (type: string) => {
  const images = {
    elite: PremiumIcon.src,
    basic: BasicIcon.src,
    '': FreeIcon.src,
  };
  return images[type] || FreeIcon.src;
};

function SweepstakesBalance() {
  const { t } = useTranslation();
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [method, setMethod] = useState<'qr' | 'web' | 'all' | 'referral'>('all');
  const [startDate, setStartDate] = useState<Date | null>(new Date('2025-05-01'));
  const [endDate, setEndDate] = useState<Date | null>(new Date());

  const { data = [], isLoading } = useQuery({
    queryKey: [
      'sweepstake-metrics',
      method,
      startDate ? format(startDate, 'yyyy-MM-dd') : '',
      endDate ? format(endDate, 'yyyy-MM-dd') : '',
    ],
    queryFn: () =>
      sweepstakesClient.getRegistrationsByStore({
        startDate: startDate ? format(startDate, 'yyyy-MM-dd') : undefined,
        endDate: endDate ? format(endDate, 'yyyy-MM-dd') : undefined,
        method: method === 'all' ? undefined : method,
      }),

    staleTime: 1000 * 60 * 5,
  });

  const visibleData = expanded ? data : data.slice(0, 3);
  const total = data.reduce((acc, item) => acc + item.totalRegistrations, 0);
  const totalPaticipations = data.reduce((acc, item) => acc + item.totalParticipations, 0);

  const colors = [
    theme.palette.primary.main,
    theme.palette.error.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.secondary[100],
  ];

  const grouped = [];
  let othersValue = 0;

  data.forEach((item, index) => {
    const percentage = item.totalParticipations / totalPaticipations;
    if (percentage < 0.1) {
      othersValue += item.totalParticipations;
    } else {
      grouped.push({
        label: item.storeName,
        value: item.totalParticipations,
        color: colors[index % colors.length],
      });
    }
  });

  if (othersValue > 0) {
    grouped.push({
      label: 'Others',
      value: othersValue,
      color: '#ee1',
    });
  }

  const pieData = grouped;
  const getArcLabel = (params: any) => `${((params.value / total) * 100).toFixed(0)}%`;

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
                {startDate && endDate
                  ? `Del ${format(startDate, "d 'de' MMMM", { locale: es })} al ${format(
                      endDate,
                      "d 'de' MMMM",
                      { locale: es }
                    )}`
                  : 'Selecciona un rango'}
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
                  {isLoading ? <Skeleton width={100} /> : `${totalPaticipations} participaciones`}
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
          {/* 📅 DatePickers y Tabs */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            px={2}
            pt={2}
            justifyContent="space-between"
          >
            <DatePicker
              label="Fecha inicio"
              value={startDate}
              onChange={(newValue) => setStartDate(newValue)}
              slotProps={{
                textField: {
                  size: 'small',
                  fullWidth: true,
                  variant: 'outlined',
                },
              }}
            />
            <DatePicker
              label="Fecha fin"
              value={endDate}
              onChange={(newValue) => setEndDate(newValue)}
              slotProps={{
                textField: {
                  size: 'small',
                  fullWidth: true,
                  variant: 'outlined',
                },
              }}
            />

            <FormControl
              size="small"
              sx={{
                minWidth: 180,
              }}
            >
              <InputLabel id="method-select-label">Método</InputLabel>
              <Select
                labelId="method-select-label"
                id="method-select"
                value={method}
                label="Método"
                onChange={(e) => setMethod(e.target.value as 'qr' | 'web' | 'all' | 'referral')}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="qr">QR</MenuItem>
                <MenuItem value="web">Web</MenuItem>
                <MenuItem value="referral">Referidos</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          {/* 🧁 Pie Chart y Listado */}
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
                              src={getImage(item.storeType)}
                              alt={item.storeName}
                              width={40}
                              style={{ padding: '4px' }}
                              height={50}
                            />
                          </ListItemAvatarWrapper>
                          <ListItemText
                            primary={item.storeName}
                            sx={{ textWrap: 'wrap', maxWidth: '40ch' }}
                            primaryTypographyProps={{ variant: 'h5' }}
                            secondary={`${item.totalParticipations} participaciones`}
                            secondaryTypographyProps={{ variant: 'h6', noWrap: true }}
                          />
                          <Box ml={2}>
                            <Typography
                              align="right"
                              variant="body1"
                              noWrap
                            >
                              Customers
                            </Typography>
                            <Typography
                              align="right"
                              variant="h5"
                              noWrap
                            >
                              {item.storeCustomerCount}
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
