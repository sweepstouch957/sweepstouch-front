'use client';

import CampaignLogsModal from '@/components/CampaignLogsModal';
import CampaignResendModal from '@/components/CampaignResendModal';
import { useCampaignById } from '@/hooks/fetching/campaigns/useCampaignById';
import { AppBlocking, Warning } from '@mui/icons-material';
import CloseIcon from '@mui/icons-material/Close';
import ReplayIcon from '@mui/icons-material/Replay';
import SendIcon from '@mui/icons-material/Send';
import ErrorIcon from '@mui/icons-material/Error';
import PeopleIcon from '@mui/icons-material/People';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { PieChart } from '@mui/x-charts/PieChart';
import { formatInTimeZone } from 'date-fns-tz';
import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface CampaignOverviewProps {
  campaignId: string;
}

// Tarjeta de KPI compacta con icono y color
const KpiCard: FC<{
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
  tooltip?: string;
}> = ({ label, value, icon, color, onClick, tooltip }) => {
  const content = (
    <Paper
      variant="outlined"
      onClick={onClick}
      sx={{
        p: 1.5,
        borderRadius: 2.5,
        cursor: onClick ? 'pointer' : 'default',
        border: '1.5px solid',
        borderColor: 'divider',
        transition: 'all .18s',
        ...(onClick && {
          '&:hover': {
            borderColor: color,
            boxShadow: `0 0 0 2px ${color}22`,
            transform: 'translateY(-1px)',
          },
        }),
        minWidth: 110,
        flex: 1,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
        <Box sx={{ color, display: 'flex', fontSize: 18 }}>{icon}</Box>
        <Typography variant="caption" color="text.secondary" fontWeight={600} noWrap>
          {label}
        </Typography>
      </Stack>
      <Typography variant="h6" fontWeight={800} sx={{ color, lineHeight: 1.1 }}>
        {value}
      </Typography>
    </Paper>
  );

  return tooltip ? (
    <Tooltip title={tooltip} placement="top">
      {content}
    </Tooltip>
  ) : (
    content
  );
};

const CampaignOverview: FC<CampaignOverviewProps> = ({ campaignId }) => {
  const { t } = useTranslation();
  const { data: campaign, isLoading, refetch } = useCampaignById(campaignId);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [imageOpen, setImageOpen] = useState(false);
  const [logsOpen, setLogsOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [resendOpen, setResendOpen] = useState(false);

  const sent = campaign?.sent ?? 0;
  const errors = campaign?.errors ?? 0;
  const audience = campaign?.audience ?? 0;
  const notSent = campaign?.notSent ?? 0;
  const cost = campaign?.cost ? Number(campaign.cost).toFixed(2) : '0.00';

  // Total real para calcular porcentajes
  const total = sent + errors + notSent;
  const deliveryRate = audience > 0 ? Math.round((sent / audience) * 100) : 0;
  const errorRate = audience > 0 ? Math.round((errors / audience) * 100) : 0;

  const deliveryColor =
    deliveryRate > 75 ? '#19B278' : deliveryRate > 40 ? '#FFD600' : '#FF9800';

  const formattedStartDate = campaign?.startDate
    ? formatInTimeZone(campaign.startDate, 'America/New_York', 'MMMM dd yyyy, hh:mm a zzz')
    : '-';

  const handleResendClose = () => {
    setResendOpen(false);
    // Refrescar datos para que los % suban
    setTimeout(() => refetch(), 1000);
  };

  return (
    <>
      <Card sx={{ borderRadius: 4, width: '100%' }}>
        {/* ─── Header ─────────────────────────────────────────────── */}
        <CardHeader
          avatar={
            campaign?.image ? (
              <Avatar
                src={campaign.image}
                sx={{
                  width: 54,
                  height: 54,
                  cursor: 'pointer',
                  borderRadius: 2,
                  boxShadow: 1,
                }}
                onClick={() => setImageOpen(true)}
                variant="rounded"
              />
            ) : (
              <Skeleton variant="rounded" width={54} height={54} />
            )
          }
          title={
            <Typography variant="h6" fontWeight={700} noWrap sx={{ fontSize: { xs: 18, sm: 22 } }}>
              {isLoading ? <Skeleton width={160} /> : campaign?.title}
            </Typography>
          }
          subheader={
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" mt={1}>
              {isLoading ? (
                <Skeleton width={120} />
              ) : (
                <>
                  <Chip label={campaign?.type} size="small" color="primary" />
                  <Chip
                    label={campaign?.status}
                    size="small"
                    color={campaign?.status === 'completed' ? 'success' : 'warning'}
                  />
                  <Chip label={'$' + cost} size="small" color="info" icon={<AttachMoneyIcon sx={{ fontSize: 14 }} />} />
                  {campaign?.platform && (
                    <Chip label={campaign.platform} size="small" color="secondary" />
                  )}
                  {campaign?.sourceTn && (
                    <Chip label={campaign.sourceTn} size="small" color="default" />
                  )}
                </>
              )}
            </Stack>
          }
          action={
            /* Botón Resend destacado en header */
            !isLoading && errors > 0 ? (
              <Tooltip title={`Reenviar ${errors.toLocaleString()} mensajes fallidos`}>
                <Button
                  variant="contained"
                  color="warning"
                  size="small"
                  startIcon={<ReplayIcon />}
                  onClick={() => setResendOpen(true)}
                  sx={{ fontWeight: 700, whiteSpace: 'nowrap', mr: 1, mt: 0.5 }}
                >
                  Resend errors ({errors.toLocaleString()})
                </Button>
              </Tooltip>
            ) : null
          }
          sx={{ p: { xs: 2, sm: 3 } }}
        />

        <Divider />

        <CardContent
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: { xs: 4, md: 5 },
          }}
        >
          {/* ─── Left: Details + Message ──────────────────────────── */}
          <Stack flex={1.4} spacing={2} sx={{ minWidth: 0 }}>
            {/* KPIs en grid */}
            <Stack direction="row" flexWrap="wrap" gap={1.5} mb={1}>
              <KpiCard
                label="Audience"
                value={audience.toLocaleString()}
                icon={<PeopleIcon fontSize="small" />}
                color={theme.palette.info.main}
              />
              <KpiCard
                label="Delivered"
                value={sent.toLocaleString()}
                icon={<SendIcon fontSize="small" />}
                color="#19B278"
                onClick={() => setSuccessOpen(true)}
                tooltip="Ver logs de mensajes entregados"
              />
              <KpiCard
                label={`Not Sent (${errorRate}%)`}
                value={errors.toLocaleString()}
                icon={<ErrorIcon fontSize="small" />}
                color="#FF9800"
                onClick={() => setLogsOpen(true)}
                tooltip="Ver logs de errores"
              />
              <KpiCard
                label="Cost"
                value={`$${cost}`}
                icon={<AttachMoneyIcon fontSize="small" />}
                color={theme.palette.text.secondary as string}
              />
            </Stack>

            {/* Alerta de errores con botón de reenvío */}
            {!isLoading && errors > 0 && (
              <Alert
                severity="warning"
                icon={<Warning />}
                action={
                  <Button
                    color="warning"
                    size="small"
                    startIcon={<ReplayIcon />}
                    onClick={() => setResendOpen(true)}
                    sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}
                  >
                    Resend
                  </Button>
                }
              >
                <strong>{errors.toLocaleString()}</strong> mensajes no entregados
                {errorRate > 0 ? ` (${errorRate}% del audience)` : ''}.
                Puedes reenviarlos para mejorar el Delivery Rate.
              </Alert>
            )}

            <Typography variant="subtitle1" color="text.secondary" fontWeight={600}>
              {t('Description')}
            </Typography>
            <Typography sx={{ mb: 1 }}>
              {isLoading ? <Skeleton height={36} /> : campaign?.description}
            </Typography>

            <Stack direction="row" flexWrap="wrap" gap={1} mb={1}>
              <Chip
                label={<span><b>{t('Start Date')}:</b> {isLoading ? '…' : formattedStartDate}</span>}
                size="medium"
              />
              <Chip
                label={<span><b>{t('Status')}:</b> {campaign?.status ?? '-'}</span>}
                size="medium"
              />
              <Chip
                label={<span><b>{t('Audience')}:</b> {audience.toLocaleString()}</span>}
                size="medium"
              />
            </Stack>

            <Typography variant="subtitle1" color="text.secondary" fontWeight={600} mt={1}>
              {t('Message Sent')}
            </Typography>
            <Box
              sx={{
                background: theme.palette.mode === 'dark' ? '#181c1f' : '#f7fafd',
                border: `1.5px solid ${theme.palette.divider}`,
                p: 2,
                borderRadius: 2,
                minHeight: 60,
                wordBreak: 'break-word',
              }}
            >
              {isLoading ? <Skeleton height={44} /> : campaign?.content}
            </Box>
          </Stack>

          {/* ─── Right: Pie Chart ─────────────────────────────────── */}
          <Stack
            flex={1}
            alignItems="center"
            spacing={2}
            minWidth={isMobile ? '100%' : 320}
            sx={{ pt: { xs: 4, md: 0 } }}
          >
            <Typography variant="subtitle1" fontWeight={700} color="text.secondary" mb={1}>
              {t('Delivery Distribution')}
            </Typography>

            {isLoading ? (
              <Skeleton variant="circular" width={isMobile ? 180 : 250} height={isMobile ? 180 : 250} />
            ) : (
              <>
                <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <PieChart
                    series={[
                      {
                        data: [
                          { id: 0, label: 'Delivered', value: sent, color: '#19B278' },
                          { id: 1, label: 'Not Sent', value: errors, color: '#FF9800' },
                          { id: 2, label: 'Pending', value: notSent, color: '#4DA8DA' },
                        ],
                        innerRadius: isMobile ? 60 : 90,
                        outerRadius: isMobile ? 100 : 140,
                        arcLabel: () => '',
                      },
                    ]}
                    height={isMobile ? 260 : 340}
                    hideLegend
                    width={isMobile ? 320 : 400}
                  />
                  {/* Centro del donut */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      textAlign: 'center',
                      pointerEvents: 'none',
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight={600}>Delivery Rate</Typography>
                    <Typography variant="h4" fontWeight={900} color={deliveryColor}>
                      {deliveryRate}%
                    </Typography>
                  </Box>
                </Box>

                {/* Leyendas clicables */}
                <Stack direction="row" justifyContent="center" flexWrap="wrap" gap={1.5} mt={1}>
                  <Stack
                    direction="row" spacing={0.8} alignItems="center"
                    sx={{ cursor: 'pointer' }}
                    onClick={() => setSuccessOpen(true)}
                  >
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#19B278' }} />
                    <Typography variant="body2" fontWeight={600}>
                      Delivered ({sent.toLocaleString()})
                    </Typography>
                  </Stack>

                  <Stack
                    direction="row" spacing={0.8} alignItems="center"
                    sx={{ cursor: 'pointer' }}
                    onClick={() => setLogsOpen(true)}
                  >
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#FF9800' }} />
                    <Typography variant="body2" fontWeight={600}>
                      Not Sent ({errors.toLocaleString()})
                    </Typography>
                  </Stack>

                  <Stack direction="row" spacing={0.8} alignItems="center">
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#4DA8DA' }} />
                    <Typography variant="body2" fontWeight={600}>
                      Pending ({notSent.toLocaleString()})
                    </Typography>
                  </Stack>
                </Stack>

                {/* Botón de reenvío bajo el chart si hay errores */}
                {errors > 0 && (
                  <Button
                    variant="contained"
                    color="warning"
                    startIcon={<ReplayIcon />}
                    onClick={() => setResendOpen(true)}
                    fullWidth
                    sx={{ fontWeight: 700, borderRadius: 2, mt: 1 }}
                  >
                    Resend {errors.toLocaleString()} not-sent messages
                  </Button>
                )}

                {errors === 0 && sent > 0 && (
                  <Alert severity="success" sx={{ width: '100%', borderRadius: 2 }}>
                    Sin errores — delivery al {deliveryRate}%
                  </Alert>
                )}
              </>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* ─── Modales ──────────────────────────────────────────────── */}
      <Dialog open={imageOpen} onClose={() => setImageOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {t('Campaign Image')}
          <IconButton onClick={() => setImageOpen(false)} sx={{ position: 'absolute', top: 8, right: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box
            component="img"
            src={campaign?.image}
            alt="Campaign"
            sx={{ width: '100%', borderRadius: 2, maxHeight: 600, objectFit: 'contain' }}
          />
        </DialogContent>
      </Dialog>

      <CampaignLogsModal
        open={logsOpen}
        onClose={() => setLogsOpen(false)}
        campaignId={campaignId}
        defaultStatus="failed"
      />

      <CampaignLogsModal
        open={successOpen}
        onClose={() => setSuccessOpen(false)}
        campaignId={campaignId}
        defaultStatus="sent"
      />

      {/* Modal de reenvío con preview */}
      <CampaignResendModal
        open={resendOpen}
        onClose={handleResendClose}
        campaignId={campaignId}
      />
    </>
  );
};

export default CampaignOverview;
