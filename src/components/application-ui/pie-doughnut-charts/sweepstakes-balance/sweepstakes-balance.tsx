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
  Drawer,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  MenuItem,
  Select,
  Skeleton,
  Stack,
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
import { SweepstakeMiniHeader } from '../../headings/sweepstake/heading';

const ListItemAvatarWrapper = ({ children }) => {
  const theme = useTheme();
  return (
    <ListItemAvatar
      sx={{
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
      }}
    >
      {children}
    </ListItemAvatar>
  );
};

const getImage = (type: string) => {
  const images = {
    elite: PremiumIcon.src,
    basic: BasicIcon.src,
    '': FreeIcon.src,
  };
  return images[type] || FreeIcon.src;
};

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

export default function SweepstakesBalance({
  sweepstakeId = '6807fcbd8f35ccf17c308623',
}: {
  sweepstakeId: string;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [expandedDrawer, setExpandedDrawer] = useState(false);
  const [method, setMethod] = useState<'qr' | 'web' | 'all' | 'referral'>('all');
  const [startDate, setStartDate] = useState<Date | null>(new Date('2025-05-01'));
  const [endDate, setEndDate] = useState<Date | null>(() => {
    const today = new Date();
    today.setDate(today.getDate() + 1); // Suma un día
    return today;
  });
  // Data query
  const { data = [], isLoading } = useQuery({
    queryKey: [
      'sweepstake-metrics',
      sweepstakeId,
      method,
      startDate ? format(startDate, 'yyyy-MM-dd') : '',
      endDate ? format(endDate, 'yyyy-MM-dd') : '',
    ],
    queryFn: () =>
      sweepstakesClient.getRegistrationsByStore({
        startDate: startDate ? format(startDate, 'yyyy-MM-dd') : undefined,
        endDate: endDate ? format(endDate, 'yyyy-MM-dd') : undefined,
        method: method === 'all' ? undefined : method,
        sweepstakeId,
      }),
    staleTime: 1000 * 60 * 10,
  });

  const visibleData = !expandedDrawer ? data.slice(0, 4) : data;
  const total = data.reduce((acc, item) => acc + item.totalRegistrations, 0);
  const totalParticipations = data.reduce((acc, item) => acc + item.totalParticipations, 0);

  // Pie chart data (agrupa 'others' si hay más de 8 tiendas)
  const colors = [
    theme.palette.primary.main,
    theme.palette.error.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.secondary[100],
  ];
  const grouped: any[] = [];
  let othersValue = 0;
  data.forEach((item, index) => {
    const percentage = item.totalRegistrations / (total || 1);
    if (data.length > 8 && percentage < 0.07) {
      othersValue += item.totalRegistrations;
    } else {
      grouped.push({
        label: item.storeName,
        value: item.totalRegistrations,
        color: colors[index % colors.length],
      });
    }
  });
  if (othersValue > 0) {
    grouped.push({
      label: 'Otras',
      value: othersValue,
      color: '#ffe066',
    });
  }
  const pieData = grouped;
  const getArcLabel = (params: any) =>
    `${((params.value / (totalParticipations || 1)) * 100).toFixed(0)}%`;

  return (
    <>
      <Card
        sx={{
          borderRadius: 4,
          overflow: 'hidden',
          p: { xs: 1, sm: 3 },
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems="center"
        >
          {/* Summary */}
          <Stack
            flex={1}
            spacing={2}
            p={{ xs: 1, md: 2 }}
          >
            <SweepstakeMiniHeader sweepstakeId={sweepstakeId} />

            <Typography
              variant="h4"
              fontWeight={700}
              sx={{ letterSpacing: 0.5 }}
            >
              Resumen del sorteo
            </Typography>
            <Box>
              <Typography
                variant="h2"
                fontWeight={800}
                color="primary.main"
              >
                {isLoading ? <Skeleton width={100} /> : `${total} registros`}
              </Typography>
              <Typography
                variant="h6"
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
                sx={{ mr: 2, width: 58, height: 58 }}
                variant="rounded"
              >
                <TrendingUp />
              </AvatarState>
              <Box>
                <Typography
                  variant="h4"
                  fontWeight={700}
                >
                  {isLoading ? <Skeleton width={80} /> : `${totalParticipations} participaciones`}
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

          {/* Visualización: Filtros, Pie, Top tiendas */}
          <Stack
            flex={2}
            spacing={3}
            justifyContent="space-between"
            sx={{
              background:
                theme.palette.mode === 'dark'
                  ? alpha(theme.palette.neutral[25], 0.02)
                  : alpha('#f7fafc', 0.9),
              borderRadius: { xs: 3, md: 3 },
              px: { xs: 0, md: 2 },
              py: 2,
            }}
          >
            {/* Filtros */}
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
            >
              <DatePicker
                label="Fecha inicio"
                value={startDate}
                onChange={setStartDate}
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true,
                    variant: 'outlined',
                  },
                }}
                sx={{ flex: 1 }}
              />
              <DatePicker
                label="Fecha fin"
                value={endDate}
                onChange={setEndDate}
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true,
                    variant: 'outlined',
                  },
                }}
                sx={{ flex: 1 }}
              />
              <FormControl
                size="small"
                sx={{ minWidth: 160, flex: 1 }}
              >
                <InputLabel id="method-select-label">Método</InputLabel>
                <Select
                  labelId="method-select-label"
                  value={method}
                  label="Método"
                  onChange={(e) => setMethod(e.target.value as any)}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="qr">QR</MenuItem>
                  <MenuItem value="web">Tablet</MenuItem>
                  <MenuItem value="promotor">Promotoras</MenuItem>
                  <MenuItem value="referral">Referidos</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            {/* Pie y listado */}
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              alignItems="flex-start"
              justifyContent="space-between"
            >
              <Box
                minWidth={isLoading ? 230 : 240}
                minHeight={isLoading ? 230 : 240}
                display="flex"
                justifyContent="center"
                alignItems="center"
                mx="auto"
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

              {/* Listado de tiendas TOP */}
              <Card
                variant="outlined"
                elevation={0}
                sx={{
                  flex: 1,
                  maxHeight: { xs: 260, md: 330 },
                  overflowY: 'auto',
                  minWidth: 230,
                  borderRadius: 3,
                  boxShadow: 0,
                  bgcolor: 'background.default',
                  transition: 'box-shadow 0.2s',
                }}
              >
                <List disablePadding>
                  {isLoading
                    ? Array.from({ length: 4 }).map((_, index) => (
                        <Fragment key={index}>
                          <SkeletonCardItem />
                          {index !== 3 && <Divider />}
                        </Fragment>
                      ))
                    : visibleData.map((item, index) => (
                        <Fragment key={item.storeId}>
                          <ListItem
                            sx={{
                              transition: 'background 0.2s',
                              '&:hover': {
                                background: alpha(theme.palette.primary.main, 0.06),
                                boxShadow: '0 1px 8px 0 #d1d5db38',
                              },
                            }}
                          >
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
                              primaryTypographyProps={{ variant: 'h6', fontWeight: 600 }}
                              secondary={`${item.totalParticipations} participaciones`}
                              secondaryTypographyProps={{ variant: 'body2', noWrap: true }}
                            />
                            <Box ml={2}>
                              <Typography
                                align="right"
                                variant="body2"
                                color="text.secondary"
                                noWrap
                              >
                                Customers
                              </Typography>
                              <Typography
                                align="right"
                                variant="h6"
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

                {!isLoading && data.length > 4 && (
                  <Box
                    textAlign="center"
                    py={2}
                  >
                    <Button
                      endIcon={<ExpandMoreIcon />}
                      onClick={() => setExpandedDrawer(true)}
                      variant="text"
                      size="small"
                    >
                      Ver todas las tiendas
                    </Button>
                  </Box>
                )}
              </Card>
            </Stack>
          </Stack>
        </Stack>
      </Card>

      {/* Drawer para todas las tiendas */}
      <Drawer
        anchor="bottom"
        open={expandedDrawer}
        onClose={() => setExpandedDrawer(false)}
        PaperProps={{
          sx: {
            maxHeight: '85vh',
            borderRadius: '28px 28px 0 0',
            p: { xs: 1, sm: 3 },
            boxShadow: 5,
          },
        }}
      >
        <Box
          maxWidth={600}
          mx="auto"
        >
          <Typography
            variant="h5"
            fontWeight={700}
            mb={2}
          >
            Todas las tiendas
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <List>
            {data.map((item) => (
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
                    primaryTypographyProps={{ fontWeight: 700, variant: 'h6' }}
                    secondary={`${item.totalParticipations} participaciones`}
                  />
                  <Box ml={2}>
                    <Typography
                      align="right"
                      variant="body2"
                      color="text.secondary"
                      noWrap
                    >
                      Customers
                    </Typography>
                    <Typography
                      align="right"
                      variant="h6"
                      noWrap
                    >
                      {item.storeCustomerCount}
                    </Typography>
                  </Box>
                </ListItem>
                <Divider />
              </Fragment>
            ))}
          </List>
          <Box
            textAlign="center"
            py={2}
          >
            <Button
              variant="outlined"
              onClick={() => setExpandedDrawer(false)}
            >
              Cerrar
            </Button>
          </Box>
        </Box>
      </Drawer>
    </>
  );
}
