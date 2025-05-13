// app/stats/[id]/page.tsx
'use client';

import PageHeading from '@/components/base/page-heading';
import { AvatarState } from '@/components/base/styles/avatar';
import { useCustomization } from '@/hooks/use-customization';
import CampaingService from '@/services/campaing.service';
import DeviceTabletIcon from '@heroicons/react/24/outline/DeviceTabletIcon';
import ArrowDownwardTwoToneIcon from '@mui/icons-material/ArrowDownwardTwoTone';
import ArrowUpwardTwoToneIcon from '@mui/icons-material/ArrowUpwardTwoTone';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import PieChartTwoToneIcon from '@mui/icons-material/PieChartTwoTone';
import ReceiptTwoToneIcon from '@mui/icons-material/ReceiptTwoTone';
import SnowmobileTwoToneIcon from '@mui/icons-material/SnowmobileTwoTone';
import SupportTwoToneIcon from '@mui/icons-material/SupportTwoTone';
import YardTwoToneIcon from '@mui/icons-material/YardTwoTone';
import {
  alpha,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Container,
  Divider,
  Grid,
  Stack,
  styled,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { BarChart, pieArcLabelClasses, PieChart } from '@mui/x-charts';
import { format } from 'date-fns';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const AvatarWrapper = styled(Avatar)(({ theme }) => ({
  color: theme.palette.common.white,
  width: theme.spacing(5.5),
  height: theme.spacing(5.5),
}));

export default function CampaignStatsPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const customization = useCustomization();
  const theme = useTheme();
  const smUp = useMediaQuery(theme.breakpoints.up('sm'));
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const pageMeta = {
    title: 'Estadísticas de Campaña',
    description: 'Resumen detallado del rendimiento de la campaña',
    icon: <DeviceTabletIcon />,
  };

  const fetchData = async () => {
    try {
      const campaign = await CampaingService.getCampaingById(id as string);
      if (!campaign) return;
      setData(campaign);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [id]);

  if (loading) return <Box p={4}>Cargando...</Box>;
  if (!data) return <Box p={4}>No encontrado</Box>;

  const {
    title,
    description,
    type,
    store,
    content,
    startDate,
    endDate,
    audience,
    sent,
    notSent,
    errors,
    cost,
    deliveryRate,
    generalRate,
    createdBy,
    image,
    targetAudience,
    status,
    createdAt,
    updatedAt,
  } = data;

  const pieData = [
    { label: 'Enviados', color: theme.palette.success.main, value: sent },
    { label: 'No enviados', color: theme.palette.warning.main, value: notSent },
    { label: 'Errores', color: theme.palette.error.main, value: errors },
  ];

  const TOTAL = pieData.reduce((acc, item) => acc + item.value, 0);

  const getArcLabel = (params: any) => {
    const percent = params.value / TOTAL;
    return `${(percent * 100).toFixed(0)}%`;
  };

  const stackedMonthlyData = [
    { month: 'Febrero', enviados: 180, noEnviados: 20, errores: 5 },
    { month: 'Marzo', enviados: 210, noEnviados: 10, errores: 8 },
    { month: 'Abril', enviados: sent, noEnviados: notSent, errores: errors },
  ];

  return (
    <>
      <Container
        sx={{ py: { xs: 2, sm: 3 } }}
        maxWidth={customization.stretch ? false : 'xl'}
      >
        <PageHeading
          sx={{ px: 0 }}
          title={t(pageMeta.title)}
          description={pageMeta.description}
          actions={
            <Button
              sx={{ mt: { xs: 2, md: 0 } }}
              variant="contained"
              startIcon={<FileDownloadOutlinedIcon fontSize="small" />}
            >
              {t('Export')}
            </Button>
          }
          iconBox={
            <AvatarState
              isSoft
              variant="rounded"
              state="primary"
              sx={{ height: 56, width: 56, svg: { height: 32, width: 32, minWidth: 32 } }}
            >
              {pageMeta.icon}
            </AvatarState>
          }
        />
      </Container>

      <Container
        maxWidth="xl"
        sx={{ mb: 3 }}
      >
        <Grid
          container
          spacing={3}
        >
          {/* Metric cards section injected here from previous version */}

          {/* Store Info Card */}
          <Grid
            item
            xs={12}
          >
            <Card>
              <CardHeader title="Información de la Tienda" />
              <CardContent>
                <Stack spacing={1}>
                  <Typography
                    variant="h5"
                    fontWeight={700}
                  >
                    {store?.name}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    {store?.address}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    <strong>Content:</strong> {content}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    <strong>Descripción:</strong> {description}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    mt={1}
                  >
                    <strong>Tipo:</strong> {type}
                  </Typography>
                  <Typography
                    variant="body1"
                    fontWeight={600}
                    mt={2}
                  >
                    Costo estimado: ${cost}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Charts section */}
          <Grid
            item
            xs={12}
            md={8}
          >
            <Card>
              <CardHeader title="Comparativa de Envíos por Mes" />
              <CardContent>
                <BarChart
                  height={360}
                  dataset={stackedMonthlyData}
                  xAxis={[{ scaleType: 'band', dataKey: 'month' }]}
                  series={[
                    {
                      dataKey: 'enviados',
                      label: 'Enviados',
                      color: theme.palette.success.light,
                      stack: 'total',
                    },
                    {
                      dataKey: 'noEnviados',
                      label: 'No enviados',
                      color: theme.palette.warning.light,
                      stack: 'total',
                    },
                    {
                      dataKey: 'errores',
                      label: 'Errores',
                      color: theme.palette.error.light,
                      stack: 'total',
                    },
                  ]}
                  margin={{ top: 20, bottom: 30, left: 40, right: 10 }}
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid
            item
            xs={12}
            md={4}
          >
            <Card>
              <CardHeader title="Distribución actual" />
              <CardContent>
                <Box
                  display="flex"
                  justifyContent="center"
                >
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
                </Box>
                <Box
                  mt={2}
                  textAlign="center"
                >
                  <Typography variant="body2">Tasa de entrega: {deliveryRate}%</Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Total registros: {TOTAL}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Information & Audience Segments go below... */}
        </Grid>
      </Container>
    </>
  );
}
