'use client';

import { AvatarState } from '@/components/base/styles/avatar';
import { sweepstakesClient } from '@/services/sweepstakes.service';
import StorefrontIcon from '@mui/icons-material/Storefront';
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
  Grid,
  useTheme,
  Avatar,
} from '@mui/material';
import { pieArcLabelClasses, PieChart } from '@mui/x-charts/PieChart';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Fragment, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SweepstakeMiniHeader } from '../../headings/sweepstake/heading';

function SkeletonCardItem() {
  return (
    <ListItem>
      <ListItemAvatar>
        <Skeleton variant="rounded" width={44} height={44} sx={{ borderRadius: 2 }} />
      </ListItemAvatar>
      <ListItemText
        sx={{ ml: 1 }}
        primary={<Skeleton variant="text" width="70%" />}
        secondary={<Skeleton variant="text" width="50%" />}
      />
      <Box textAlign="right">
        <Skeleton variant="text" width={40} />
        <Skeleton variant="text" width={60} />
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
    today.setDate(today.getDate() + 1);
    return today;
  });

  const { data, isLoading } = useQuery({
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

  const stores = data?.stores || [];
  const visibleData = !expandedDrawer ? stores.slice(0, 4) : stores;

  // Usar participaciones reales para UI coherente
  const totalParticipations = stores.reduce((acc: number, item: any) => acc + item.totalParticipations, 0);
  const totalRegistrations = data?.totalRegistrations || 0;

  const colors = [
    theme.palette.primary.main,
    theme.palette.error.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.secondary[100],
  ];

  const grouped: any[] = [];
  let othersValue = 0;

  stores.forEach((item: any, index: number) => {
    if (index < 5 || stores.length <= 6) {
      grouped.push({
        id: item.storeId,
        label: item.storeName,
        value: item.totalParticipations,
        color: colors[index % colors.length],
      });
    } else {
      othersValue += item.totalParticipations;
    }
  });

  if (othersValue > 0) {
    grouped.push({
      id: 'otras',
      label: 'Otras',
      value: othersValue,
      color: theme.palette.mode === 'dark' ? theme.palette.grey[700] : theme.palette.grey[300],
    });
  }

  const getArcLabel = (params: any) => {
    const percent = params.value / (totalParticipations || 1);
    return percent >= 0.05 ? `${(percent * 100).toFixed(0)}%` : '';
  };

  const getAvatarSrc = (img: string | undefined | null) => {
    if (!img || img === 'no-image.jpg' || img === 'no-image.png' || img === 'n/a') return undefined;
    if (img.startsWith('http') || img.startsWith('data:')) return img;
    return `${process.env.NEXT_PUBLIC_API_URL}/files/images/${img}`;
  };

  return (
    <>
      <Card sx={{ borderRadius: 4, overflow: 'hidden', p: { xs: 1, sm: 2 } }} elevation={0} variant="outlined">
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="stretch" sx={{ width: '100%' }}>
          <Stack flex={1} spacing={2} p={{ xs: 1, sm: 1.5 }} sx={{ minWidth: 0 }}>
            <SweepstakeMiniHeader sweepstakeId={sweepstakeId} />
            <Typography variant="h4" fontWeight={700} sx={{ letterSpacing: 0.5 }}>
              Resumen del sorteo
            </Typography>
            <Box>
              <Typography variant="h2" fontWeight={800} color="primary.main">
                {isLoading ? <Skeleton width={100} /> : `${totalRegistrations} registros`}
              </Typography>
              <Typography variant="h6" color="text.secondary">
                {startDate && endDate
                  ? `Del ${format(startDate, "d 'de' MMMM", { locale: es })} al ${format(
                    endDate,
                    "d 'de' MMMM",
                    { locale: es }
                  )}`
                  : 'Selecciona un rango'}
              </Typography>
            </Box>
            <Box display="flex" alignItems="center">
              <AvatarState state="success" useShadow sx={{ mr: 2, width: 58, height: 58 }} variant="rounded">
                <TrendingUp />
              </AvatarState>
              <Box>
                <Typography variant="h4" fontWeight={700}>
                  {isLoading ? <Skeleton width={80} /> : `${totalParticipations} participaciones`}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary">
                  Participaciones totales
                </Typography>
              </Box>
            </Box>
          </Stack>

          <Stack
            flex={2}
            spacing={3}
            justifyContent="space-between"
            sx={{
              minWidth: 0,
              width: '100%',
              background: theme.palette.mode === 'dark' ? alpha(theme.palette.neutral[25] || '#222', 0.02) : '#f8fafc',
              borderRadius: 3,
              px: { xs: 1, sm: 1.5 },
              py: 1.5,
              border: `1px solid ${theme.palette.divider}`
            }}
          >
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <DatePicker
                label="Fecha inicio"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                slotProps={{ textField: { size: 'small', fullWidth: true, variant: 'outlined' } }}
                sx={{ flex: 1, bgcolor: 'background.paper' }}
              />
              <DatePicker
                label="Fecha fin"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                slotProps={{ textField: { size: 'small', fullWidth: true, variant: 'outlined' } }}
                sx={{ flex: 1, bgcolor: 'background.paper', minWidth: 0 }}
              />
              <FormControl size="small" sx={{ minWidth: 100, flex: 1, bgcolor: 'background.paper' }}>
                <InputLabel id="method-select-label">Método</InputLabel>
                <Select
                  labelId="method-select-label"
                  value={method}
                  label="Método"
                  onChange={(e) => setMethod(e.target.value as any)}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="qr">QR</MenuItem>
                  <MenuItem value="web">Web</MenuItem>
                  <MenuItem value="tablet">Tablet</MenuItem>
                  <MenuItem value="promotor">Promotoras</MenuItem>
                  <MenuItem value="referral">Referidos</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            <Grid container spacing={2} alignItems="center" justifyContent="center" sx={{ width: '100%', m: 0 }}>
              <Grid item xs={12} md={5} lg={5} display="flex" justifyContent="center">
                {isLoading ? (
                  <Skeleton variant="circular" width={260} height={260} />
                ) : (
                  <PieChart
                    series={[{
                      data: grouped,
                      innerRadius: 60,
                      outerRadius: 100,
                      paddingAngle: 3,
                      cornerRadius: 4,
                      cx: '50%',
                      cy: '50%',
                      highlightScope: { fade: 'global', highlight: 'item' },
                      arcLabel: getArcLabel,
                    }]}
                    height={220}
                    width={220}
                    margin={{ right: 0, top: 0, bottom: 0, left: 0 }}
                    hideLegend
                    sx={{
                      [`& .${pieArcLabelClasses.root}`]: {
                        fill: theme.palette.getContrastText(theme.palette.primary.main),
                        fontWeight: 700,
                        fontSize: 15,
                      },
                      filter: 'drop-shadow(0px 8px 16px rgba(0,0,0,0.08))'
                    }}
                  />
                )}
              </Grid>

              <Grid item xs={12} md={7} lg={7} sx={{ width: '100%', minWidth: 0, overflow: 'hidden' }}>
                <Card
                variant="outlined"
                elevation={0}
                sx={{
                  flex: 1,
                  maxHeight: { xs: 260, md: 300 },
                  overflowY: 'auto',
                  width: '100%',
                  minWidth: 0,
                  borderRadius: 3,
                  bgcolor: 'background.paper',
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
                    : visibleData.map((item: any, index: number) => (
                      <Fragment key={item.storeId || index}>
                        <ListItem sx={{ py: 1, px: 2, '&:hover': { bgcolor: 'action.hover' } }}>
                          <ListItemAvatar sx={{ minWidth: 44 }}>
                            <Avatar
                              src={getAvatarSrc(item.storeImage)}
                              variant="rounded"
                              sx={{
                                width: 34,
                                height: 34,
                                borderRadius: 3,
                                bgcolor: 'action.hover',
                                border: `1px solid ${theme.palette.divider}`,
                              }}
                            >
                              {!item.storeImage && <StorefrontIcon color="action" />}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={item.storeName}
                            primaryTypographyProps={{ variant: 'subtitle2', fontWeight: 600, noWrap: true }}
                            secondary={`${item.totalRegistrations} registros`}
                            secondaryTypographyProps={{ variant: 'caption' }}
                            sx={{ ml: 1, pr: 1 }}
                          />
                          <Box textAlign="right" sx={{ flexShrink: 0 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: -0.5 }}>
                              Customers
                            </Typography>
                            <Typography variant="subtitle2" fontWeight={700}>
                              {item.storeCustomerCount}
                            </Typography>
                          </Box>
                        </ListItem>
                        {index !== visibleData.length - 1 && <Divider />}
                      </Fragment>
                    ))}
                </List>
                {!isLoading && stores.length > 4 && (
                  <Box textAlign="center" py={1}>
                    <Button endIcon={<ExpandMoreIcon />} onClick={() => setExpandedDrawer(true)} size="small" sx={{ fontWeight: 600 }}>
                      Ver todas las tiendas
                    </Button>
                  </Box>
                )}
              </Card>
            </Grid>
          </Grid>
        </Stack>
        </Stack>
      </Card >

      <Drawer
        anchor="bottom"
        open={expandedDrawer}
        onClose={() => setExpandedDrawer(false)}
        PaperProps={{
          sx: {
            maxHeight: '85vh',
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            p: { xs: 2, sm: 3 },
          },
        }}
      >
        <Box maxWidth={600} mx="auto" width="100%">
          <Typography variant="h5" fontWeight={700} mb={2}>
            Todas las tiendas
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <List>
            {stores.map((item: any) => (
              <Fragment key={item.storeId}>
                <ListItem sx={{ py: 2 }}>
                  <ListItemAvatar>
                    <Avatar
                      src={getAvatarSrc(item.storeImage)}
                      variant="rounded"
                      sx={{ width: 52, height: 52, borderRadius: 3, bgcolor: 'action.hover' }}
                    >
                      {!item.storeImage && <StorefrontIcon color="action" />}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    sx={{ ml: 2 }}
                    primary={item.storeName}
                    primaryTypographyProps={{ fontWeight: 700, variant: 'subtitle1' }}
                    secondary={`${item.totalRegistrations} números registrados`}
                  />
                  <Box ml={2} textAlign="right">
                    <Typography variant="body2" color="text.secondary">
                      Customers
                    </Typography>
                    <Typography variant="h6" fontWeight={700}>
                      {item.storeCustomerCount}
                    </Typography>
                  </Box>
                </ListItem>
                <Divider />
              </Fragment>
            ))}
          </List>
          <Box textAlign="center" mt={3}>
            <Button variant="outlined" onClick={() => setExpandedDrawer(false)} color="inherit" sx={{ px: 4, borderRadius: 8 }}>
              Cerrar
            </Button>
          </Box>
        </Box>
      </Drawer>
    </>
  );
}
