'use client';

import CampaignLogsModal from '@/components/CampaignLogsModal';
import CampaignResendModal from '@/components/CampaignResendModal';
import { useCampaignById } from '@/hooks/fetching/campaigns/useCampaignById';
import { useAuth } from '@/hooks/use-auth';
import { sendChatMessage } from '@/services/ai.service';
import { campaignClient } from '@/services/campaing.service';
import { useMutation } from '@tanstack/react-query';
import {
  AutoFixHighRounded,
  EmojiEventsRounded,
  ReportProblemRounded,
  TrendingUpRounded,
  WarningAmberRounded,
} from '@mui/icons-material';
import CloseIcon from '@mui/icons-material/Close';
import ReplayIcon from '@mui/icons-material/Replay';
import SendIcon from '@mui/icons-material/Send';
import SyncRoundedIcon from '@mui/icons-material/SyncRounded';
import ErrorIcon from '@mui/icons-material/Error';
import PeopleIcon from '@mui/icons-material/People';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ZoomInRoundedIcon from '@mui/icons-material/ZoomInRounded';
import SmartToyRoundedIcon from '@mui/icons-material/SmartToyRounded';
import {
  Alert,
  alpha,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  Divider,
  IconButton,
  Paper,
  Skeleton,
  Snackbar,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { PieChart } from '@mui/x-charts/PieChart';
import { formatInTimeZone } from 'date-fns-tz';
import { FC, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface CampaignOverviewProps {
  campaignId: string;
}

// ─── KPI Card ────────────────────────────────────────────────────────────────

const KpiCard: FC<{
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
  tooltip?: string;
  sub?: string;
}> = ({ label, value, icon, color, onClick, tooltip, sub }) => {
  const theme = useTheme();
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
          '&:hover': { borderColor: color, boxShadow: `0 0 0 2px ${color}22`, transform: 'translateY(-1px)' },
        }),
        minWidth: 110,
        flex: 1,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
        <Box sx={{ color, display: 'flex', fontSize: 18 }}>{icon}</Box>
        <Typography variant="caption" color="text.secondary" fontWeight={600} noWrap>{label}</Typography>
      </Stack>
      <Typography variant="h6" fontWeight={800} sx={{ color, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </Typography>
      {sub && (
        <Typography variant="caption" color="text.disabled" display="block" mt={0.25}>{sub}</Typography>
      )}
    </Paper>
  );
  return tooltip ? <Tooltip title={tooltip} placement="top">{content}</Tooltip> : content;
};

// ─── Delivery Rate Hero ───────────────────────────────────────────────────────

const DeliveryHero: FC<{ rate: number; color: string; isLoading?: boolean }> = ({ rate, color, isLoading }) => {
  const theme = useTheme();
  const isExcellent = rate >= 90;
  const isGood = rate >= 75 && rate < 90;

  if (isLoading) return <Skeleton variant="rounded" height={72} sx={{ borderRadius: 3, mb: 2 }} />;

  return (
    <Box
      sx={{
        borderRadius: 3,
        p: 2,
        mb: 2,
        background: isExcellent
          ? `linear-gradient(135deg, ${alpha('#10b981', 0.12)}, ${alpha('#10b981', 0.06)})`
          : isGood
          ? `linear-gradient(135deg, ${alpha('#f59e0b', 0.12)}, ${alpha('#f59e0b', 0.06)})`
          : `linear-gradient(135deg, ${alpha('#ef4444', 0.12)}, ${alpha('#ef4444', 0.06)})`,
        border: `1.5px solid ${alpha(color, 0.3)}`,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
      }}
    >
      <Box
        sx={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          bgcolor: alpha(color, 0.15),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color,
          flexShrink: 0,
        }}
      >
        {isExcellent ? (
          <EmojiEventsRounded sx={{ fontSize: 28 }} />
        ) : isGood ? (
          <TrendingUpRounded sx={{ fontSize: 28 }} />
        ) : (
          <ReportProblemRounded sx={{ fontSize: 28 }} />
        )}
      </Box>
      <Box flex={1} minWidth={0}>
        <Typography variant="h4" fontWeight={900} sx={{ color, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
          {rate}%
        </Typography>
        <Typography variant="body2" fontWeight={700} color="text.secondary" mt={0.25}>
          {isExcellent
            ? 'Entrega excelente — campaña muy exitosa'
            : isGood
            ? 'Buena entrega — hay margen de mejora'
            : 'Entrega baja — revisa configuración y usa IA para tips'}
        </Typography>
      </Box>
      <Chip
        label={isExcellent ? 'Excelente' : isGood ? 'Bueno' : 'Mejorable'}
        size="small"
        sx={{
          fontWeight: 800,
          bgcolor: alpha(color, 0.18),
          color,
          border: `1px solid ${alpha(color, 0.3)}`,
        }}
      />
    </Box>
  );
};

// ─── Pulsing dot for streaming indicator ─────────────────────────────────────

const CircularProgressDot = () => (
  <Box
    sx={{
      width: 8,
      height: 8,
      borderRadius: '50%',
      bgcolor: 'primary.main',
      animation: 'pulse 1.2s ease-in-out infinite',
      '@keyframes pulse': {
        '0%, 100%': { opacity: 1, transform: 'scale(1)' },
        '50%': { opacity: 0.4, transform: 'scale(0.7)' },
      },
    }}
  />
);

// ─── AI Suggestions Panel ────────────────────────────────────────────────────

interface AISuggestionsProps {
  campaign: {
    platform?: string;
    type: string;
    deliveryRate?: number;
    sent?: number;
    errors?: number;
    audience?: number;
    title?: string;
  };
}

const AISuggestionsPanel: FC<AISuggestionsProps> = ({ campaign }) => {
  const { user } = useAuth();
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [done, setDone] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const rate = campaign.audience && campaign.audience > 0
    ? Math.round(((campaign.sent ?? 0) / campaign.audience) * 100)
    : campaign.deliveryRate ?? 0;

  const handleAsk = () => {
    if (loading) return;
    setText('');
    setDone(false);
    setLoading(true);

    abortRef.current = new AbortController();

    const prompt = `Soy el administrador de una plataforma de marketing SMS/MMS. Tengo una campaña con los siguientes datos:
- Plataforma: ${campaign.platform || 'No especificada'}
- Tipo: ${campaign.type}
- Audiencia total: ${(campaign.audience ?? 0).toLocaleString()} personas
- Mensajes entregados: ${(campaign.sent ?? 0).toLocaleString()}
- Mensajes con error: ${(campaign.errors ?? 0).toLocaleString()}
- Tasa de entrega actual: ${rate}%

Dame 5 recomendaciones específicas y accionables para mejorar la tasa de entrega${campaign.platform ? ` en ${campaign.platform}` : ''}. Sé concreto, menciona configuraciones técnicas, horarios óptimos, y buenas prácticas del sector. Responde en español.`;

    sendChatMessage(
      {
        message: prompt,
        userId: user?.id ?? 'admin',
        userName: `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'Admin',
        userRole: user?.role ?? 'admin',
        signal: abortRef.current.signal,
      },
      (chunk) => setText((prev) => prev + chunk),
      () => { setLoading(false); setDone(true); },
      (err) => { setLoading(false); setText(`Error: ${err}`); },
    );
  };

  const handleToggle = () => {
    if (!open) {
      setOpen(true);
      if (!done && !loading) handleAsk();
    } else {
      setOpen(false);
      abortRef.current?.abort();
      setLoading(false);
    }
  };

  return (
    <Box mt={2}>
      <Button
        variant="outlined"
        fullWidth
        startIcon={<SmartToyRoundedIcon />}
        onClick={handleToggle}
        sx={{
          borderRadius: 2.5,
          fontWeight: 700,
          textTransform: 'none',
          borderColor: alpha(theme.palette.primary.main, 0.4),
          '&:hover': { borderColor: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.06) },
          justifyContent: 'flex-start',
          py: 1,
        }}
      >
        {open ? 'Ocultar sugerencias IA' : 'Sugerencias IA para mejorar entrega'}
        {loading && (
          <Box component="span" sx={{ ml: 1, display: 'flex', alignItems: 'center' }}>
            <CircularProgressDot />
          </Box>
        )}
      </Button>

      <Collapse in={open}>
        <Box
          sx={{
            mt: 1.5,
            p: 2,
            borderRadius: 2.5,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: (t) => alpha(t.palette.primary.main, 0.03),
            minHeight: 60,
          }}
        >
          {loading && !text && (
            <Stack spacing={1}>
              <Skeleton height={16} width="90%" />
              <Skeleton height={16} width="75%" />
              <Skeleton height={16} width="80%" />
            </Stack>
          )}
          {text ? (
            <Typography
              variant="body2"
              component="pre"
              sx={{
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontFamily: 'inherit',
                lineHeight: 1.7,
                m: 0,
              }}
            >
              {text}
              {loading && <Box component="span" sx={{ display: 'inline-block', width: 8, height: 14, bgcolor: 'primary.main', borderRadius: 0.5, ml: 0.5, animation: 'blink 1s step-start infinite', '@keyframes blink': { '50%': { opacity: 0 } } }} />}
            </Typography>
          ) : null}
          {done && (
            <Box mt={1.5} display="flex" justifyContent="flex-end">
              <Button
                size="small"
                startIcon={<AutoFixHighRounded />}
                onClick={handleAsk}
                sx={{ textTransform: 'none', fontSize: 12, fontWeight: 700 }}
              >
                Nueva consulta
              </Button>
            </Box>
          )}
        </Box>
      </Collapse>
    </Box>
  );
};

// ─── Main CampaignOverview ───────────────────────────────────────────────────

const CampaignOverview: FC<CampaignOverviewProps> = ({ campaignId }) => {
  const { t } = useTranslation();
  const { data: campaign, isLoading, refetch } = useCampaignById(campaignId);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [imageOpen, setImageOpen] = useState(false);
  const [logsOpen, setLogsOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [resendOpen, setResendOpen] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; msg: string; sev: 'success' | 'error' }>({
    open: false, msg: '', sev: 'success',
  });

  const syncMutation = useMutation({
    mutationFn: () =>
      campaignClient.syncCampaignMetrics({ campaignId, includeZeroSent: true }),
    onSuccess: (res) => {
      setSnack({ open: true, msg: `Métricas actualizadas — ${res?.details?.reduce((s: number, d: any) => s + (d.updatedLogs || 0), 0) || 0} logs`, sev: 'success' });
      setTimeout(() => refetch(), 600);
    },
    onError: (err: any) => {
      setSnack({ open: true, msg: err?.response?.data?.message || 'Error al sincronizar', sev: 'error' });
    },
  });

  const sent = campaign?.sent ?? 0;
  const errors = campaign?.errors ?? 0;
  const audience = campaign?.audience ?? 0;
  const notSent = campaign?.notSent ?? 0;
  const cost = campaign?.cost ? Number(campaign.cost).toFixed(2) : '0.00';

  const deliveryRate = audience > 0 ? Math.round((sent / audience) * 100) : 0;
  const errorRate = audience > 0 ? Math.round((errors / audience) * 100) : 0;

  const deliveryColor =
    deliveryRate >= 90 ? '#10b981' : deliveryRate >= 75 ? '#f59e0b' : '#ef4444';

  const formattedStartDate = campaign?.startDate
    ? formatInTimeZone(campaign.startDate, 'America/New_York', 'MMMM dd yyyy, hh:mm a zzz')
    : '-';

  const platformColor: Record<string, string> = {
    bandwidth: '#2196f3',
    infobip: '#e91e63',
    twilio: '#f44336',
  };

  const handleResendClose = () => {
    setResendOpen(false);
    setTimeout(() => refetch(), 1000);
  };

  return (
    <>
      <Card sx={{ borderRadius: 4, width: '100%' }}>
        {/* ─── Header ──────────────────────────────────────────── */}
        <CardHeader
          avatar={
            campaign?.image ? (
              <Box
                sx={{ position: 'relative', width: 56, height: 56, cursor: 'pointer', flexShrink: 0 }}
                onClick={() => setImageOpen(true)}
              >
                <Box
                  component="img"
                  src={campaign.image}
                  alt="Campaign"
                  sx={{ width: 56, height: 56, borderRadius: 2, objectFit: 'cover', boxShadow: 2 }}
                />
                <Box
                  sx={{
                    position: 'absolute', inset: 0, borderRadius: 2,
                    bgcolor: 'rgba(0,0,0,0.35)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: 0, transition: 'opacity 0.2s',
                    '&:hover': { opacity: 1 },
                  }}
                >
                  <ZoomInRoundedIcon sx={{ color: 'white', fontSize: 22 }} />
                </Box>
              </Box>
            ) : (
              <Skeleton variant="rounded" width={56} height={56} />
            )
          }
          title={
            <Typography variant="h6" fontWeight={700} noWrap sx={{ fontSize: { xs: 18, sm: 22 } }}>
              {isLoading ? <Skeleton width={160} /> : campaign?.title}
            </Typography>
          }
          subheader={
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" mt={0.75} useFlexGap>
              {isLoading ? (
                <Skeleton width={200} height={24} />
              ) : (
                <>
                  <Chip label={campaign?.type} size="small" color="primary" sx={{ fontWeight: 700 }} />
                  <Chip
                    label={campaign?.status}
                    size="small"
                    color={campaign?.status === 'completed' ? 'success' : campaign?.status === 'scheduled' ? 'warning' : 'default'}
                    sx={{ fontWeight: 700 }}
                  />
                  <Chip label={`$${cost}`} size="small" color="info" icon={<AttachMoneyIcon sx={{ fontSize: 14 }} />} sx={{ fontWeight: 700 }} />
                  {campaign?.platform && (
                    <Chip
                      label={campaign.platform}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        textTransform: 'capitalize',
                        bgcolor: alpha(platformColor[campaign.platform] ?? '#9e9e9e', 0.12),
                        color: platformColor[campaign.platform] ?? 'text.secondary',
                      }}
                    />
                  )}
                  {campaign?.sourceTn && (
                    <Chip label={campaign.sourceTn} size="small" variant="outlined" sx={{ fontWeight: 600, fontSize: 11 }} />
                  )}
                </>
              )}
            </Stack>
          }
          action={
            !isLoading ? (
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mr: 1, mt: 0.5 }}>
                {/* Sync metrics button */}
                <Tooltip title={syncMutation.isPending ? 'Sincronizando…' : 'Refrescar métricas de esta campaña'}>
                  <span>
                    <Button
                      variant="outlined"
                      size="small"
                      disabled={syncMutation.isPending}
                      onClick={() => syncMutation.mutate()}
                      startIcon={
                        syncMutation.isPending
                          ? <CircularProgress size={14} color="inherit" />
                          : <SyncRoundedIcon fontSize="small" sx={{
                              transition: 'transform 0.6s ease',
                              ...(syncMutation.isPending && { animation: 'spin 1s linear infinite', '@keyframes spin': { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } } }),
                            }} />
                      }
                      sx={{
                        fontWeight: 700,
                        textTransform: 'none',
                        borderRadius: 2,
                        fontSize: 12,
                        borderColor: (t) => alpha(t.palette.primary.main, 0.4),
                        color: 'primary.main',
                        whiteSpace: 'nowrap',
                        '&:hover': { borderColor: 'primary.main', bgcolor: (t) => alpha(t.palette.primary.main, 0.06) },
                        '&.Mui-disabled': { opacity: 0.6 },
                      }}
                    >
                      {syncMutation.isPending ? 'Sync…' : 'Sync'}
                    </Button>
                  </span>
                </Tooltip>

                {/* Resend errors button */}
                {errors > 0 && (
                  <Tooltip title={`Reenviar ${errors.toLocaleString()} mensajes fallidos`}>
                    <Button
                      variant="contained"
                      color="warning"
                      size="small"
                      startIcon={<ReplayIcon />}
                      onClick={() => setResendOpen(true)}
                      sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}
                    >
                      Resend ({errors.toLocaleString()})
                    </Button>
                  </Tooltip>
                )}
              </Stack>
            ) : null
          }
          sx={{ p: { xs: 2, sm: 3 }, pb: { xs: 1.5, sm: 2 } }}
        />

        <Divider />

        <CardContent
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: { xs: 4, md: 5 },
            p: { xs: 2, sm: 3 },
          }}
        >
          {/* ─── Left: Details ────────────────────────────────── */}
          <Stack flex={1.4} spacing={2} sx={{ minWidth: 0 }}>
            {/* Delivery Rate Hero */}
            <DeliveryHero rate={deliveryRate} color={deliveryColor} isLoading={isLoading} />

            {/* KPI Cards */}
            <Stack direction="row" flexWrap="wrap" gap={1.5}>
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
                color="#10b981"
                onClick={() => setSuccessOpen(true)}
                tooltip="Ver logs entregados"
              />
              <KpiCard
                label={`Errors (${errorRate}%)`}
                value={errors.toLocaleString()}
                icon={<ErrorIcon fontSize="small" />}
                color="#ef4444"
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

            {/* Error alert */}
            {!isLoading && errors > 0 && (
              <Alert
                severity="warning"
                icon={<WarningAmberRounded />}
                action={
                  <Button color="warning" size="small" startIcon={<ReplayIcon />} onClick={() => setResendOpen(true)} sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                    Resend
                  </Button>
                }
              >
                <strong>{errors.toLocaleString()}</strong> mensajes no entregados
                {errorRate > 0 ? ` (${errorRate}% del audience)` : ''}.
              </Alert>
            )}

            {/* Success alert */}
            {!isLoading && errors === 0 && sent > 0 && (
              <Alert severity="success" sx={{ borderRadius: 2 }}>
                Sin errores — {sent.toLocaleString()} mensajes entregados al {deliveryRate}%
              </Alert>
            )}

            {/* Date + Meta chips */}
            <Stack direction="row" flexWrap="wrap" gap={1}>
              <Chip
                label={<span><b>{t('Start Date')}:</b> {isLoading ? '…' : formattedStartDate}</span>}
                size="medium"
                sx={{ fontWeight: 600 }}
              />
              <Chip
                label={<span><b>Audience:</b> {audience.toLocaleString()}</span>}
                size="medium"
              />
            </Stack>

            {/* Description */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" fontWeight={700} mb={0.75}>
                {t('Description')}
              </Typography>
              <Typography variant="body2" sx={{ lineHeight: 1.7 }}>
                {isLoading ? <Skeleton height={40} /> : campaign?.description || '-'}
              </Typography>
            </Box>

            {/* Message content */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" fontWeight={700} mb={0.75}>
                {t('Message Sent')}
              </Typography>
              <Box
                sx={{
                  bgcolor: (t) => t.palette.mode === 'dark' ? alpha('#fff', 0.04) : alpha('#000', 0.03),
                  border: `1.5px solid ${theme.palette.divider}`,
                  p: 2,
                  borderRadius: 2,
                  minHeight: 60,
                  wordBreak: 'break-word',
                  fontSize: 14,
                  lineHeight: 1.7,
                }}
              >
                {isLoading ? <Skeleton height={44} /> : campaign?.content}
              </Box>
            </Box>

            {/* AI Suggestions */}
            {!isLoading && campaign && (
              <AISuggestionsPanel
                campaign={{
                  platform: campaign.platform,
                  type: campaign.type,
                  deliveryRate,
                  sent,
                  errors,
                  audience,
                  title: campaign.title,
                }}
              />
            )}
          </Stack>

          {/* ─── Right: Pie Chart ─────────────────────────────── */}
          <Stack
            flex={1}
            alignItems="center"
            spacing={2}
            minWidth={isMobile ? '100%' : 320}
            sx={{ pt: { xs: 0, md: 0 } }}
          >
            <Typography variant="subtitle1" fontWeight={700} color="text.secondary">
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
                          { id: 0, label: 'Delivered', value: sent, color: '#10b981' },
                          { id: 1, label: 'Not Sent', value: errors, color: '#ef4444' },
                          { id: 2, label: 'Pending', value: notSent, color: '#4DA8DA' },
                        ],
                        innerRadius: isMobile ? 60 : 90,
                        outerRadius: isMobile ? 100 : 140,
                        arcLabel: () => '',
                        highlightScope: { fade: 'global', highlight: 'item' },
                      },
                    ]}
                    height={isMobile ? 260 : 340}
                    hideLegend
                    width={isMobile ? 320 : 400}
                  />
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
                    <Typography variant="caption" fontWeight={600} color="text.secondary">Delivery</Typography>
                    <Typography variant="h4" fontWeight={900} sx={{ color: deliveryColor, lineHeight: 1 }}>
                      {deliveryRate}%
                    </Typography>
                  </Box>
                </Box>

                {/* Clickable legends */}
                <Stack direction="row" justifyContent="center" flexWrap="wrap" gap={1.5}>
                  <Stack direction="row" spacing={0.8} alignItems="center" sx={{ cursor: 'pointer' }} onClick={() => setSuccessOpen(true)}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#10b981' }} />
                    <Typography variant="body2" fontWeight={600}>Delivered ({sent.toLocaleString()})</Typography>
                  </Stack>
                  <Stack direction="row" spacing={0.8} alignItems="center" sx={{ cursor: 'pointer' }} onClick={() => setLogsOpen(true)}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#ef4444' }} />
                    <Typography variant="body2" fontWeight={600}>Errors ({errors.toLocaleString()})</Typography>
                  </Stack>
                  <Stack direction="row" spacing={0.8} alignItems="center">
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#4DA8DA' }} />
                    <Typography variant="body2" fontWeight={600}>Pending ({notSent.toLocaleString()})</Typography>
                  </Stack>
                </Stack>

                {/* Resend button */}
                {errors > 0 && (
                  <Button
                    variant="contained"
                    color="warning"
                    startIcon={<ReplayIcon />}
                    onClick={() => setResendOpen(true)}
                    fullWidth
                    sx={{ fontWeight: 700, borderRadius: 2, mt: 1 }}
                  >
                    Resend {errors.toLocaleString()} errors
                  </Button>
                )}
              </>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* ─── Image Zoom Dialog ──────────────────────────────────── */}
      <Dialog
        open={imageOpen}
        onClose={() => setImageOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden', bgcolor: 'transparent', boxShadow: 'none' } }}
      >
        <Box
          sx={{
            position: 'relative',
            bgcolor: 'background.paper',
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              zIndex: 10,
              bgcolor: alpha('#000', 0.5),
              borderRadius: '50%',
            }}
          >
            <IconButton onClick={() => setImageOpen(false)} sx={{ color: 'white' }} size="small">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
          <Box
            component="img"
            src={campaign?.image}
            alt="Campaign"
            sx={{
              width: '100%',
              maxHeight: '80vh',
              objectFit: 'contain',
              display: 'block',
            }}
          />
        </Box>
      </Dialog>

      <CampaignLogsModal open={logsOpen} onClose={() => setLogsOpen(false)} campaignId={campaignId} defaultStatus="failed" />
      <CampaignLogsModal open={successOpen} onClose={() => setSuccessOpen(false)} campaignId={campaignId} defaultStatus="sent" />
      <CampaignResendModal open={resendOpen} onClose={handleResendClose} campaignId={campaignId} />

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snack.sev} onClose={() => setSnack((s) => ({ ...s, open: false }))} sx={{ width: '100%', borderRadius: 2 }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </>
  );
};

export default CampaignOverview;
