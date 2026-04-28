'use client';

import PageHeading from '@/components/base/page-heading';
import { campaignClient } from '@/services/campaing.service';
import type { FilterStatsResponse } from '@/services/campaing.service';
import {
  alpha,
  Box,
  Collapse,
  CircularProgress,
  Divider,
  IconButton,
  LinearProgress,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
  Unstable_Grid2 as Grid,
  useTheme,
} from '@mui/material';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import CampaignRoundedIcon from '@mui/icons-material/CampaignRounded';
import PeopleOutlineRoundedIcon from '@mui/icons-material/PeopleOutlineRounded';
import SmsRoundedIcon from '@mui/icons-material/SmsRounded';
import ImageRoundedIcon from '@mui/icons-material/ImageRounded';
import RouterRoundedIcon from '@mui/icons-material/RouterRounded';
import MonetizationOnRoundedIcon from '@mui/icons-material/MonetizationOnRounded';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';
import ExportButton from '../../buttons/export-button';
import Results from './results';

interface CampaignsGridProps {
  storeId?: string;
}

/* ─── Platform color map ─── */
const PLATFORM_META: Record<string, { label: string; color: string }> = {
  infobip: { label: 'Infobip', color: '#e91e8c' },
  bandwidth: { label: 'Bandwidth', color: '#2196f3' },
  twillio: { label: 'Twilio', color: '#7c3aed' },
  twilio: { label: 'Twilio', color: '#7c3aed' },
  unknown: { label: 'Sin plataforma', color: '#6b7280' },
  '': { label: 'Sin plataforma', color: '#6b7280' },
};

/* ─────────────────────────────────────────
   KPI CARD  —  executive left-border style
───────────────────────────────────────────*/
function KpiCard({
  icon,
  label,
  description,
  value,
  color,
  loading,
}: {
  icon: ReactNode;
  label: string;
  description: string;
  value: number | undefined;
  color: string;
  loading?: boolean;
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      sx={{
        position: 'relative',
        borderRadius: 2.5,
        border: '1px solid',
        borderColor: alpha(color, isDark ? 0.22 : 0.18),
        bgcolor: alpha(color, isDark ? 0.06 : 0.03),
        overflow: 'hidden',
        p: 2,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          boxShadow: `0 0 0 1px ${alpha(color, 0.4)}, 0 8px 24px ${alpha(color, 0.15)}`,
          borderColor: alpha(color, 0.5),
          transform: 'translateY(-2px)',
        },
      }}
    >
      {/* Left accent bar */}
      <Box
        sx={{
          position: 'absolute',
          left: 0, top: 0, bottom: 0,
          width: 3,
          bgcolor: color,
          borderRadius: '4px 0 0 4px',
        }}
      />

      <Stack spacing={0.75} sx={{ pl: 0.5 }}>
        {/* Icon + label row */}
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box
            sx={{
              width: 30,
              height: 30,
              borderRadius: 1.5,
              bgcolor: alpha(color, isDark ? 0.18 : 0.12),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color,
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
          <Typography
            sx={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'text.secondary',
            }}
          >
            {label}
          </Typography>
        </Stack>

        {/* Big number */}
        {loading ? (
          <Skeleton width={72} height={36} sx={{ borderRadius: 1 }} />
        ) : (
          <Typography
            sx={{
              fontSize: 30,
              fontWeight: 800,
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
              color,
              letterSpacing: '-0.5px',
            }}
          >
            {value?.toLocaleString() ?? 0}
          </Typography>
        )}

        {/* Description */}
        <Typography sx={{ fontSize: 11, color: 'text.disabled', lineHeight: 1.3 }}>
          {description}
        </Typography>
      </Stack>
    </Box>
  );
}

/* ─────────────────────────────────────────
   MESSAGING INTELLIGENCE PANEL
   Unified card: SMS · MMS · Audiencia · Plataformas
───────────────────────────────────────────*/
function MessagingPanel({ stats, loading }: { stats: FilterStatsResponse; loading: boolean }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { messages, byPlatform, byType, total } = stats;

  const sms = byType['SMS'] ?? 0;
  const mms = byType['MMS'] ?? 0;
  const total_typed = sms + mms;
  const sms_pct = total_typed > 0 ? Math.round((sms / total_typed) * 100) : 0;
  const mms_pct = total_typed > 0 ? Math.round((mms / total_typed) * 100) : 0;

  const platforms = Object.entries(byPlatform)
    .filter(([key, count]) => count > 0 && key !== 'unknown' && key !== '')
    .sort(([, a], [, b]) => b - a);

  const StatCell = ({
    icon,
    color,
    label,
    sublabel,
    value,
    pct,
    extraInfo,
    isCurrency,
  }: {
    icon: ReactNode;
    color: string;
    label: string;
    sublabel: string;
    value: number;
    pct?: number;
    extraInfo?: ReactNode;
    isCurrency?: boolean;
  }) => (
    <Stack
      spacing={0.25}
      sx={{
        flex: 1,
        minWidth: 0,
        px: 2,
        py: 1.25,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': { transform: 'translateY(-2px)', bgcolor: isDark ? alpha('#fff', 0.02) : alpha('#000', 0.02) }
      }}
    >
      <Stack direction="row" alignItems="center" spacing={0.75} mb={0.25}>
        <Box sx={{ color, display: 'flex', opacity: 0.9 }}>{icon}</Box>
        <Typography sx={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'text.secondary' }}>
          {label}
        </Typography>
        {pct !== undefined && (
          <Box
            sx={{
              ml: 'auto',
              px: 0.75,
              py: 0.2,
              borderRadius: 1,
              bgcolor: alpha(color, isDark ? 0.15 : 0.1),
              border: `1px solid ${alpha(color, 0.2)}`,
            }}
          >
            <Typography sx={{ fontSize: 10, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>
              {pct}%
            </Typography>
          </Box>
        )}
      </Stack>

      {loading ? (
        <Skeleton width={80} height={30} sx={{ borderRadius: 1 }} />
      ) : (
        <Stack direction="row" alignItems="baseline" spacing={0.5}>
          {isCurrency && <Typography sx={{ fontSize: 16, fontWeight: 700, color: 'text.secondary' }}>$</Typography>}
          <Typography
            sx={{
              fontSize: 22,
              fontWeight: 800,
              lineHeight: 1,
              color,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-0.5px',
            }}
          >
            {isCurrency ? value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : value.toLocaleString()}
          </Typography>
        </Stack>
      )}

      <Typography sx={{ fontSize: 10, color: 'text.disabled', lineHeight: 1.2 }}>
        {sublabel}
      </Typography>
      {extraInfo && (
        <Typography sx={{ fontSize: 10, color: color, fontWeight: 600, mt: 0.5, opacity: 0.8 }}>
          {extraInfo}
        </Typography>
      )}
    </Stack>
  );

  return (
    <Box
      sx={{
        borderRadius: 2.5,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: isDark ? alpha('#fff', 0.02) : alpha('#000', 0.015),
        overflow: 'hidden',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          borderColor: isDark ? alpha('#fff', 0.1) : alpha('#000', 0.1),
          boxShadow: `0 8px 24px ${alpha('#000', 0.08)}`,
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2,
          py: 0.75,
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          bgcolor: isDark ? alpha('#fff', 0.02) : alpha('#000', 0.015),
        }}
      >
        <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'text.secondary' }}>
          Desglose de envíos
        </Typography>
        <Typography sx={{ fontSize: 10, color: 'text.disabled' }}>
          Refleja el filtro activo · {loading ? '…' : `${total.toLocaleString()} campañas`}
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(5, 1fr)' },
          gap: 0,
          flex: 1,
        }}
      >
        {/* SMS */}
        <Box sx={{ position: 'relative', borderRight: { sm: '1px solid', lg: '1px solid' }, borderBottom: { xs: '1px solid', md: '1px solid', lg: 'none' }, borderColor: 'divider' }}>
          <Box sx={{ position: 'absolute', left: 0, top: '25%', bottom: '25%', width: 3, bgcolor: theme.palette.info.main, borderRadius: 2 }} />
          <StatCell
            icon={<SmsRoundedIcon sx={{ fontSize: 16 }} />}
            color={theme.palette.info.main}
            label="SMS"
            sublabel="campañas de texto"
            value={sms}
            pct={sms_pct}
            extraInfo={`${(messages.totalSmsSent ?? 0).toLocaleString()} msjs. enviados`}
          />
        </Box>

        {/* MMS */}
        <Box sx={{ position: 'relative', borderRight: { md: '1px solid', lg: '1px solid' }, borderBottom: { xs: '1px solid', md: '1px solid', lg: 'none' }, borderColor: 'divider' }}>
          <Box sx={{ position: 'absolute', left: 0, top: '25%', bottom: '25%', width: 3, bgcolor: theme.palette.secondary.main, borderRadius: 2 }} />
          <StatCell
            icon={<ImageRoundedIcon sx={{ fontSize: 16 }} />}
            color={theme.palette.secondary.main}
            label="MMS"
            sublabel="campañas con imagen"
            value={mms}
            pct={mms_pct}
            extraInfo={`${(messages.totalMmsSent ?? 0).toLocaleString()} msjs. enviados`}
          />
        </Box>

        {/* Audiencia */}
        <Box sx={{ position: 'relative', borderRight: { sm: '1px solid', md: 'none', lg: '1px solid' }, borderBottom: { xs: '1px solid', md: '1px solid', lg: 'none' }, borderColor: 'divider' }}>
          <Box sx={{ position: 'absolute', left: 0, top: '25%', bottom: '25%', width: 3, bgcolor: theme.palette.success.main, borderRadius: 2 }} />
          <StatCell
            icon={<PeopleOutlineRoundedIcon sx={{ fontSize: 16 }} />}
            color={theme.palette.success.main}
            label="Audiencia total"
            sublabel="contactos únicos alcanzados"
            value={messages.totalAudience}
            extraInfo="tamaño de audiencia objetivo"
          />
        </Box>

        {/* Entregados */}
        <Box sx={{ position: 'relative', borderRight: { sm: '1px solid', md: '1px solid', lg: '1px solid' }, borderBottom: { xs: '1px solid', sm: '1px solid', md: 'none', lg: 'none' }, borderColor: 'divider' }}>
          <Box sx={{ position: 'absolute', left: 0, top: '25%', bottom: '25%', width: 3, bgcolor: theme.palette.warning.main, borderRadius: 2 }} />
          <StatCell
            icon={<CheckCircleOutlineRoundedIcon sx={{ fontSize: 16 }} />}
            color={theme.palette.warning.main}
            label="Entregados"
            sublabel="mensajes entregados con éxito"
            value={messages.totalDelivered ?? 0}
          />
        </Box>

        {/* Costo */}
        <Box sx={{ position: 'relative', borderRight: 'none', borderBottom: 'none', borderColor: 'divider' }}>
          <Box sx={{ position: 'absolute', left: 0, top: '25%', bottom: '25%', width: 3, bgcolor: theme.palette.error.main, borderRadius: 2 }} />
          <StatCell
            icon={<MonetizationOnRoundedIcon sx={{ fontSize: 16 }} />}
            color={theme.palette.error.main}
            label="Costo Total"
            sublabel="costo estimado de campañas"
            value={messages.totalCost ?? 0}
            isCurrency={true}
            extraInfo="estimación por plataforma"
          />
        </Box>

        {/* Platforms */}
        <Box sx={{ p: 2, position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Stack direction="row" alignItems="center" spacing={0.75} mb={1.5}>
            <RouterRoundedIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
            <Typography sx={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'text.secondary' }}>
              Plataformas
            </Typography>
          </Stack>
          {loading ? (
            <Stack spacing={1}>
              <Skeleton width="100%" height={24} sx={{ borderRadius: 1 }} />
              <Skeleton width="80%" height={24} sx={{ borderRadius: 1 }} />
            </Stack>
          ) : platforms.length === 0 ? (
            <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>Sin datos de plataforma</Typography>
          ) : (
            <Stack spacing={1}>
              {platforms.map(([key, count]) => {
                const meta = PLATFORM_META[key] ?? { label: key, color: '#9e9e9e' };
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <Tooltip key={key} title={`${count} campañas · ${pct}% del total`} arrow placement="left">
                    <Box>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={0.4}>
                        <Stack direction="row" alignItems="center" spacing={0.75}>
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: meta.color, flexShrink: 0 }} />
                          <Typography sx={{ fontSize: 12, fontWeight: 700, color: meta.color }}>
                            {meta.label}
                          </Typography>
                        </Stack>
                        <Typography sx={{ fontSize: 12, fontWeight: 800, color: meta.color, fontVariantNumeric: 'tabular-nums' }}>
                          {count.toLocaleString()}
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={pct}
                        sx={{
                          height: 4,
                          borderRadius: 2,
                          bgcolor: alpha(meta.color, 0.15),
                          '& .MuiLinearProgress-bar': { borderRadius: 2, bgcolor: meta.color },
                        }}
                      />
                    </Box>
                  </Tooltip>
                );
              })}
            </Stack>
          )}
        </Box>
      </Box>
    </Box>
  );
}

/* ─────────────────────────────────────────
   EMPTY STATE
───────────────────────────────────────────*/
const EMPTY_STATS: FilterStatsResponse = {
  ok: true,
  total: 0,
  byStatus: {},
  byType: {},
  byPlatform: {},
  messages: { totalSent: 0, totalQueued: 0, totalNotSent: 0, totalErrors: 0, totalAudience: 0, avgDeliveryRate: 0, totalCost: 0, totalDelivered: 0, totalSmsSent: 0, totalMmsSent: 0 },
};

/* ─────────────────────────────────────────
   MAIN GRID
───────────────────────────────────────────*/
function CampaignsGrid({ storeId }: CampaignsGridProps) {
  const [showMetrics, setShowMetrics] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    title: '',
    storeName: '',
    type: '',
    platform: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 15,
    storeId,
  });
  const { t } = useTranslation();
  const theme = useTheme();

  const { data, isPending, error, refetch, isFetching } = useQuery({
    queryKey: ['campaigns', filters],
    queryFn: () => campaignClient.getFilteredCampaigns(filters),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });

  const statsKey = {
    status: filters.status,
    title: filters.title,
    type: filters.type,
    platform: filters.platform,
    startDate: filters.startDate,
    endDate: filters.endDate,
    storeId: filters.storeId,
  };

  const { data: stats, isFetching: statsFetching } = useQuery({
    queryKey: ['campaigns-stats', statsKey],
    queryFn: () =>
      campaignClient.getFilterStats({
        status: filters.status || undefined,
        title: filters.title || undefined,
        type: filters.type || undefined,
        platform: filters.platform || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        storeId: filters.storeId || undefined,
      }),
    staleTime: 30_000,
    placeholderData: (prev) => prev ?? EMPTY_STATS,
  });

  if (isPending) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="300px">
        <CircularProgress size={48} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box textAlign="center" py={4}>
        <Typography color="error">Error al cargar campañas</Typography>
      </Box>
    );
  }

  const s = stats ?? EMPTY_STATS;
  const isLoading = statsFetching && !stats;

  return (
    <>
      <PageHeading
        title={t('Campaigns')}
        description={t('Overview of ongoing campaigns')}
        actions={<ExportButton eventName="campaigns:export" emitOnly />}
      />

      <Box sx={{ mt: 3, mb: 1.5 }}>
        {(isFetching || statsFetching) && !isPending && (
          <LinearProgress sx={{ mb: 1.5, borderRadius: 1, height: 2, opacity: 0.5 }} />
        )}

        {/* ── Metrics Toggle & Preview ── */}
        <Box
          onClick={() => setShowMetrics((p) => !p)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            mb: showMetrics ? 1.5 : 2.5,
            px: 2,
            py: 1.25,
            borderRadius: 2,
            bgcolor: theme.palette.mode === 'dark' ? alpha('#fff', 0.02) : alpha('#000', 0.015),
            border: '1px solid',
            borderColor: 'divider',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              bgcolor: theme.palette.mode === 'dark' ? alpha('#fff', 0.04) : alpha('#000', 0.03),
              boxShadow: `0 4px 12px ${alpha('#000', 0.05)}`
            }
          }}
        >
          <Stack direction="row" alignItems="center" spacing={2} divider={<Divider orientation="vertical" flexItem sx={{ height: 24, alignSelf: 'center' }} />}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <CampaignRoundedIcon sx={{ fontSize: 20, color: theme.palette.primary.main }} />
              <Typography sx={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                Métricas y Desglose
              </Typography>
            </Stack>

            {/* Small Preview when closed */}
            {!showMetrics && (
              <Stack direction="row" alignItems="center" spacing={3} sx={{ pl: 1, animation: 'fadeIn 0.3s ease-in-out' }}>
                <Box>
                  <Typography sx={{ fontSize: 10, color: 'text.secondary', textTransform: 'uppercase', fontWeight: 700, lineHeight: 1.2 }}>Total Filtrado</Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 800, color: theme.palette.primary.main, lineHeight: 1.2 }}>{s.total.toLocaleString()}</Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 10, color: 'text.secondary', textTransform: 'uppercase', fontWeight: 700, lineHeight: 1.2 }}>Completadas</Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 800, color: '#10b981', lineHeight: 1.2 }}>{(s.byStatus.completed ?? 0).toLocaleString()}</Typography>
                </Box>
                <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                  <Typography sx={{ fontSize: 10, color: 'text.secondary', textTransform: 'uppercase', fontWeight: 700, lineHeight: 1.2 }}>Audiencia</Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 800, color: '#8b5cf6', lineHeight: 1.2 }}>{s.messages.totalAudience.toLocaleString()}</Typography>
                </Box>
              </Stack>
            )}
          </Stack>

          <IconButton
            size="small"
            sx={{
              transform: showMetrics ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s',
            }}
          >
            <ExpandMoreRoundedIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>

        <Collapse in={showMetrics} unmountOnExit>
          <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
            {/* ── KPI Cards ── */}
            <Grid xs={12} lg={5} xl={4}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: 'repeat(2, 1fr)' },
                  gap: 1.5,
                  height: '100%',
                }}
              >
                <KpiCard
                  icon={<CampaignRoundedIcon sx={{ fontSize: 16 }} />}
                  label="Total filtrado"
                  description="campañas en el filtro activo"
                  value={s.total}
                  color={theme.palette.primary.main}
                  loading={isLoading}
                />
                <KpiCard
                  icon={<CheckCircleOutlineRoundedIcon sx={{ fontSize: 16 }} />}
                  label="Completadas"
                  description="campañas enviadas con éxito"
                  value={s.byStatus.completed ?? 0}
                  color="#10b981"
                  loading={isLoading}
                />
                <KpiCard
                  icon={<ScheduleRoundedIcon sx={{ fontSize: 16 }} />}
                  label="Programadas"
                  description="campañas en cola de envío"
                  value={s.byStatus.scheduled ?? 0}
                  color="#f59e0b"
                  loading={isLoading}
                />
                <KpiCard
                  icon={<CancelOutlinedIcon sx={{ fontSize: 16 }} />}
                  label="Canceladas"
                  description="campañas no ejecutadas"
                  value={s.byStatus.cancelled ?? 0}
                  color="#ef4444"
                  loading={isLoading}
                />
              </Box>
            </Grid>

            {/* ── Messaging Intelligence Panel ── */}
            <Grid xs={12} lg={7} xl={8}>
              <MessagingPanel stats={s} loading={isLoading} />
            </Grid>
          </Grid>
        </Collapse>
      </Box>

      <Grid container mt={0} spacing={{ xs: 2, sm: 3 }}>
        <Grid xs={12}>
          <Results
            campaigns={data?.data || []}
            filters={filters}
            setFilters={setFilters}
            total={data?.total || 0}
            refetch={refetch}
            storeId={storeId}
            isLoading={isFetching}
          />
        </Grid>
      </Grid>
    </>
  );
}

export default CampaignsGrid;
