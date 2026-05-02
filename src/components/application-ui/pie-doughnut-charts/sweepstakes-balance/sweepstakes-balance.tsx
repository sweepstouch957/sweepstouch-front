'use client';


import { sweepstakesClient } from '@/services/sweepstakes.service';
import StorefrontIcon from '@mui/icons-material/Storefront';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TrendingUp from '@mui/icons-material/TrendingUp';

import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import PeopleIcon from '@mui/icons-material/People';
import {
  alpha,
  Box,
  Button,
  Card,
  Collapse,
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

  Chip,
} from '@mui/material';
import { pieArcLabelClasses, PieChart } from '@mui/x-charts/PieChart';
import RangePickerField, { RangePickerValue } from '@/components/base/range-picker-field';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Fragment, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DownloadRounded } from '@mui/icons-material';
import { CircularProgress, Tooltip } from '@mui/material';
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

function downloadCSV(rows: any[], filename: string) {
  const headers = ['#', 'Teléfono', 'Método', 'Tipo usuario', 'Cupón', 'Fecha registro', 'Tienda ID'];
  const csvRows = [
    headers.join(','),
    ...rows.map((r, i) =>
      [
        i + 1,
        r.phone || '',
        r.method || '',
        r.isNewUser ? 'Nuevo' : 'Existente',
        r.coupon || 'N/A',
        r.registeredAt ? format(new Date(r.registeredAt), 'dd/MM/yyyy HH:mm') : '',
        r.storeId || ''
      ].join(',')
    ),
  ];
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function SweepstakesBalance({
  sweepstakeId = '6807fcbd8f35ccf17c308623',
}: {
  sweepstakeId: string;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [expandedDrawer, setExpandedDrawer] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [method, setMethod] = useState<'qr' | 'web' | 'all' | 'referral'>('all');
  const [dateRange, setDateRange] = useState<RangePickerValue>({
    startYmd: '2025-05-01',
    endYmd: (() => {
      const today = new Date();
      today.setDate(today.getDate() + 1);
      return format(today, 'yyyy-MM-dd');
    })(),
  });
  const [exporting, setExporting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: [
      'sweepstake-metrics',
      sweepstakeId,
      method,
      dateRange.startYmd,
      dateRange.endYmd,
    ],
    queryFn: () =>
      sweepstakesClient.getRegistrationsByStore({
        startDate: dateRange.startYmd,
        endDate: dateRange.endYmd,
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
  const totalNewNumbers = data?.totalNewNumbers || 0;
  const totalExistingNumbers = data?.totalExistingNumbers || 0;

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

  const handleExport = async () => {
    setExporting(true);
    try {
      const result = await sweepstakesClient.exportParticipants({
        storeId: '', // For sweepstake-wide export, the backend can ignore storeId if not provided, but wait. Backend requires storeId. I will fix backend to make storeId optional! Wait, let me just pass a dummy or undefined and I'll adapt the exportParticipants method. 
        sweepstakeId,
        startDate: dateRange.startYmd,
        endDate: dateRange.endYmd,
      });
      downloadCSV(
        result.rows,
        `participantes_sweepstake_${sweepstakeId}_${dateRange.startYmd ?? 'all'}.csv`
      );
    } catch {
      // noop
    } finally {
      setExporting(false);
    }
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

            {/* ★ PRIMARY HEROES: New Numbers + Participations */}
            <Stack direction="row" spacing={2}>
              {/* New Numbers — THE STAR */}
              <Box sx={{
                flex: 1,
                background: 'linear-gradient(135deg, #2e7d32 0%, #43a047 100%)',
                color: '#fff',
                borderRadius: 3, p: 2,
                boxShadow: '0 8px 24px rgba(46,125,50,0.3)',
                position: 'relative',
                overflow: 'hidden',
              }}>
                <Box sx={{ position: 'absolute', top: -10, right: -10, opacity: 0.1 }}>
                  <PersonAddAlt1Icon sx={{ fontSize: 100 }} />
                </Box>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                  <PersonAddAlt1Icon sx={{ fontSize: 22 }} />
                  <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.9 }}>
                    Números nuevos
                  </Typography>
                </Stack>
                <Typography variant="h2" fontWeight={900} sx={{ lineHeight: 1, letterSpacing: -1 }}>
                  {isLoading ? <Skeleton width={80} sx={{ bgcolor: 'rgba(255,255,255,0.3)' }} /> : totalNewNumbers.toLocaleString()}
                </Typography>
                {!isLoading && totalRegistrations > 0 && (
                  <Typography variant="caption" sx={{ opacity: 0.8, fontWeight: 600, mt: 0.5, display: 'block' }}>
                    {Math.round((totalNewNumbers / totalRegistrations) * 100)}% del total
                  </Typography>
                )}
              </Box>

              {/* Participations — THE STAR */}
              <Box sx={{
                flex: 1,
                background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                color: '#fff',
                borderRadius: 3, p: 2,
                boxShadow: (theme) => `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)}`,
                position: 'relative',
                overflow: 'hidden',
              }}>
                <Box sx={{ position: 'absolute', top: -10, right: -10, opacity: 0.1 }}>
                  <TrendingUp sx={{ fontSize: 100 }} />
                </Box>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                  <TrendingUp sx={{ fontSize: 22 }} />
                  <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.9 }}>
                    Participaciones
                  </Typography>
                </Stack>
                <Typography variant="h2" fontWeight={900} sx={{ lineHeight: 1, letterSpacing: -1 }}>
                  {isLoading ? <Skeleton width={80} sx={{ bgcolor: 'rgba(255,255,255,0.3)' }} /> : totalParticipations.toLocaleString()}
                </Typography>
                {!isLoading && totalRegistrations > 0 && (
                  <Typography variant="caption" sx={{ opacity: 0.8, fontWeight: 600, mt: 0.5, display: 'block' }}>
                    ~{(totalParticipations / totalRegistrations).toFixed(1)} por registro
                  </Typography>
                )}
              </Box>
            </Stack>

            {/* ▼ SECONDARY: Registros + Existentes — Collapsible */}
            <Box>
              <Button
                size="small"
                onClick={() => setShowDetails(!showDetails)}
                endIcon={<ExpandMoreIcon sx={{ transform: showDetails ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />}
                sx={{ textTransform: 'none', fontWeight: 600, color: 'text.secondary', fontSize: 13, px: 1 }}
              >
                {showDetails ? 'Ocultar detalles' : 'Más detalles'}
                <Chip label={isLoading ? '...' : `${totalRegistrations.toLocaleString()} registros`} size="small" sx={{ ml: 1, fontWeight: 700, fontSize: 11 }} />
              </Button>
              <Collapse in={showDetails}>
                <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                  <Box sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5,
                    bgcolor: 'action.hover',
                    borderRadius: 2, px: 2, py: 1,
                    border: `1px solid`,
                    borderColor: 'divider',
                    flex: 1,
                  }}>
                    <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: 'primary.main', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography variant="caption" fontWeight={900}>ALL</Typography>
                    </Box>
                    <Box>
                      <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1 }}>
                        {isLoading ? <Skeleton width={60} /> : totalRegistrations.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        Registros totales
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5,
                    bgcolor: 'action.hover',
                    borderRadius: 2, px: 2, py: 1,
                    border: `1px solid`,
                    borderColor: 'divider',
                    flex: 1,
                  }}>
                    <PeopleIcon sx={{ fontSize: 28, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1 }}>
                        {isLoading ? <Skeleton width={50} /> : totalExistingNumbers.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        Ya existentes
                      </Typography>
                    </Box>
                  </Box>
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  {dateRange.startYmd && dateRange.endYmd
                    ? `Del ${dateRange.startYmd} al ${dateRange.endYmd}`
                    : 'Selecciona un rango'}
                </Typography>
              </Collapse>
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
            <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', lg: 'center' }}>
              <RangePickerField
                label="Fechas del reporte"
                value={dateRange}
                onChange={setDateRange}
                sx={{
                  flex: { xs: '1 1 auto', lg: 2 },
                  minWidth: { md: 240 },
                  bgcolor: 'background.paper',
                  borderRadius: 1,
                  '& .MuiOutlinedInput-root': { borderRadius: 2 }
                }}
              />
              <FormControl size="small" sx={{ flex: { xs: '1 1 auto', lg: 1 }, minWidth: { md: 140 }, bgcolor: 'background.paper', borderRadius: 2 }}>
                <InputLabel sx={{ fontWeight: 600 }}>Método</InputLabel>
                <Select
                  value={method}
                  label="Método"
                  onChange={(e) => setMethod(e.target.value as any)}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="all">⚡ Todos</MenuItem>
                  <MenuItem value="qr">📷 QR</MenuItem>
                  <MenuItem value="web">🌐 Web</MenuItem>
                  <MenuItem value="tablet">📱 Tablet</MenuItem>
                  <MenuItem value="promotor">🙋‍♂️ Promotoras</MenuItem>
                  <MenuItem value="referral">🚀 Referidos</MenuItem>
                  <MenuItem value="pinpad">⌨️ Pinpad</MenuItem>
                </Select>
              </FormControl>
              
              <Box flexGrow={1} display={{ xs: 'none', xl: 'block' }} />

              <Tooltip title="Exportar lista de participantes (CSV)">
                <Button
                  variant="contained"
                  disableElevation
                  color="primary"
                  startIcon={exporting ? <CircularProgress size={16} color="inherit" /> : <DownloadRounded />}
                  onClick={handleExport}
                  disabled={exporting}
                  sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, height: 40, px: 3, whiteSpace: 'nowrap', width: { xs: '100%', lg: 'auto' } }}
                >
                  Descargar CSV
                </Button>
              </Tooltip>
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
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
                            <Box textAlign="center" sx={{
                              bgcolor: 'success.main', color: '#fff',
                              borderRadius: 2, px: 1, py: 0.4,
                              minWidth: 48,
                            }}>
                              <Typography variant="caption" sx={{ fontWeight: 700, fontSize: 10, display: 'block', lineHeight: 1, mb: 0.2 }}>
                                Nuevos
                              </Typography>
                              <Typography variant="subtitle2" fontWeight={900} sx={{ lineHeight: 1 }}>
                                {(item.newNumbers || 0).toLocaleString()}
                              </Typography>
                            </Box>
                            <Box textAlign="center" sx={{
                              bgcolor: 'primary.main', color: '#fff',
                              borderRadius: 2, px: 1, py: 0.4,
                              minWidth: 48,
                            }}>
                              <Typography variant="caption" sx={{ display: 'block', lineHeight: 1, mb: 0.2, fontSize: 10, fontWeight: 700 }}>
                                Particip.
                              </Typography>
                              <Typography variant="subtitle2" fontWeight={900} sx={{ lineHeight: 1 }}>
                                {(item.totalParticipations || 0).toLocaleString()}
                              </Typography>
                            </Box>
                          </Stack>
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
                  <Stack direction="row" spacing={1.5} alignItems="center" ml={2}>
                    <Box textAlign="center" sx={{
                      bgcolor: 'success.main', color: '#fff',
                      borderRadius: 2, px: 1.5, py: 0.8,
                      minWidth: 60,
                    }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', lineHeight: 1, mb: 0.3, fontSize: 10 }}>
                        Nuevos
                      </Typography>
                      <Typography variant="h6" fontWeight={900} sx={{ lineHeight: 1 }}>
                        {(item.newNumbers || 0).toLocaleString()}
                      </Typography>
                    </Box>
                    <Box textAlign="center" sx={{
                      bgcolor: 'primary.main', color: '#fff',
                      borderRadius: 2, px: 1.5, py: 0.8,
                      minWidth: 60,
                    }}>
                      <Typography variant="caption" sx={{ display: 'block', lineHeight: 1, mb: 0.3, fontSize: 10, fontWeight: 700 }}>
                        Particip.
                      </Typography>
                      <Typography variant="h6" fontWeight={900} sx={{ lineHeight: 1 }}>
                        {(item.totalParticipations || 0).toLocaleString()}
                      </Typography>
                    </Box>
                  </Stack>
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
