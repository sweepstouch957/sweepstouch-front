'use client';

import PageHeading from '@/components/base/page-heading';
import { campaignClient } from '@/services/campaing.service';
import type { FilterStatsResponse } from '@/services/campaing.service';
import {
  alpha,
  Box,
  CircularProgress,
  Divider,
  LinearProgress,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
  Unstable_Grid2 as Grid,
  useTheme,
} from '@mui/material';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import CampaignRoundedIcon from '@mui/icons-material/CampaignRounded';
import PeopleOutlineRoundedIcon from '@mui/icons-material/PeopleOutlineRounded';
import SmsRoundedIcon from '@mui/icons-material/SmsRounded';
import ImageRoundedIcon from '@mui/icons-material/ImageRounded';
import RouterRoundedIcon from '@mui/icons-material/RouterRounded';
import MonetizationOnRoundedIcon from '@mui/icons-material/MonetizationOnRounded';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';
import ExportButton from '../../buttons/export-button';
import Results from './results';
import type { Theme } from '@mui/material/styles';
import { tint } from '@/theme/semantic';
import {
  KpiCard as PanelKpiCard,
  KpiRow,
  PageHero,
  panelBorder,
} from '../../content-shells/store-managment/panel-kit';
import AddCircleOutlineRoundedIcon from '@mui/icons-material/AddCircleOutlineRounded';
import ScienceRoundedIcon from '@mui/icons-material/ScienceRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import Button from '@mui/material/Button';
import Link from 'next/link';

/** $1.72M en vez de $1,720,000: en una tarjeta de KPI el orden de magnitud
    importa más que el centavo, y el número largo rompía la línea. */
const compactUsd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 2,
});

/** Botones de la portada: mismo alto y radio que en Tiendas. */
const heroBtn = {
  height: 44,
  px: 2,
  borderRadius: '12px',
  textTransform: 'none' as const,
  fontWeight: 700,
  color: 'text.secondary',
  borderColor: 'divider',
  '&:hover': { borderColor: 'text.disabled', bgcolor: 'action.hover' },
};

interface CampaignsGridProps {
  storeId?: string;
  forceCards?: boolean;
}

/* ─── Platform color map ─── */
const platformMeta = (theme: Theme): Record<string, { label: string; color: string }> => ({
  infobip: { label: 'Infobip', color: theme.palette.primary.main },
  bandwidth: { label: 'Bandwidth', color: theme.palette.info.main },
  twillio: { label: 'Twilio', color: theme.palette.secondary.main },
  twilio: { label: 'Twilio', color: theme.palette.secondary.main },
  unknown: { label: 'Sin plataforma', color: theme.palette.text.secondary },
  '': { label: 'Sin plataforma', color: theme.palette.text.secondary },
});

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
        // Diseño: tarjeta blanca de radio 16, no un bloque teñido del color del
        // KPI. Cinco fondos de colores distintos convierten la fila en un
        // semáforo y el dato deja de leerse.
        borderRadius: '16px',
        border: panelBorder(theme),
        bgcolor: 'background.paper',
        overflow: 'hidden',
        p: 1.25,
      }}
    >
      {/* El color del KPI queda en una barra fina, no en todo el fondo */}
      <Box
        sx={{
          position: 'absolute',
          left: 0, top: 0, bottom: 0,
          width: 3,
          bgcolor: color,
          borderRadius: '4px 0 0 4px',
        }}
      />

      <Stack spacing={0.5}
sx={{ pl: 0.5 }}>
        {/* Icon + label row */}
        <Stack direction="row"
alignItems="center"
spacing={0.75}>
          <Box
            sx={{
              width: 20,
              height: 20,
              borderRadius: 1,
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
            noWrap
            sx={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: 1,
              textTransform: 'uppercase',
              color: 'text.secondary',
            }}
          >
            {label}
          </Typography>
        </Stack>

        {/* La cifra: grande y en color de texto, como en el diseño */}
        {loading ? (
          <Skeleton width={70}
height={30}
sx={{ borderRadius: 1 }} />
        ) : (
          <Typography
            sx={{
              fontSize: 25,
              fontWeight: 700,
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-0.7px',
            }}
          >
            {value?.toLocaleString() ?? 0}
          </Typography>
        )}

        {/* Description */}
        <Typography sx={{ fontSize: 11, color: 'text.secondary', lineHeight: 1.3 }}>
          {description}
        </Typography>
      </Stack>
    </Box>
  );
}

/* ─────────────────────────────────────────
   STAT CELL  — ✅ module scope extract: defining inside MessagingPanel created
   a new component class every render (react-doctor: Nested component definition)
───────────────────────────────────────────*/
interface StatCellProps {
  icon: ReactNode;
  color: string;
  label: string;
  sublabel: string;
  value: number;
  pct?: number;
  extraInfo?: ReactNode;
  isCurrency?: boolean;
  loading?: boolean;
  isDark?: boolean;
}

/**
 * KPI del Store Panel 2.0: la cifra manda. El icono a color y el porcentaje
 * acompañan; el número va en el color del texto y grande (25px), no en el color
 * de acento — cuatro números de cuatro colores distintos compiten entre sí y
 * ninguno destaca. El `translateY` al pasar por encima se fue: es un dato, no
 * un botón.
 */
function StatCell({ icon, color, label, sublabel, value, pct, extraInfo, isCurrency, loading }: StatCellProps) {
  return (
    <Stack
      spacing={0.5}
      sx={{ flex: 1, minWidth: 0, px: 1.25, py: 1 }}
    >
      <Stack direction="row"
alignItems="center"
spacing={0.75}>
        <Box sx={{ color, display: 'flex' }}>{icon}</Box>
        <Typography noWrap
sx={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: 'text.secondary' }}>
          {label}
        </Typography>
        {pct !== undefined && (
          <Box
            sx={{
              ml: 'auto',
              px: 0.85,
              py: 0.2,
              borderRadius: '7px',
              bgcolor: alpha(color, 0.12),
            }}
          >
            <Typography sx={{ fontSize: 10, fontWeight: 800, color, fontVariantNumeric: 'tabular-nums' }}>
              {pct}%
            </Typography>
          </Box>
        )}
      </Stack>

      {loading ? (
        <Skeleton width={90}
height={30}
sx={{ borderRadius: 1 }} />
      ) : (
        <Stack direction="row"
alignItems="baseline"
spacing={0.35}>
          {isCurrency && <Typography sx={{ fontSize: 17, fontWeight: 700, color: 'text.secondary' }}>$</Typography>}
          <Typography
            sx={{
              fontSize: 25,
              fontWeight: 700,
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-0.7px',
            }}
          >
            {isCurrency ? value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : value.toLocaleString()}
          </Typography>
        </Stack>
      )}

      <Typography sx={{ fontSize: 11, color: 'text.secondary', lineHeight: 1.3 }}>
        {sublabel}
      </Typography>
      {extraInfo && (
        <Typography sx={{ fontSize: 10.5, color, fontWeight: 700 }}>
          {extraInfo}
        </Typography>
      )}
    </Stack>
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


  return (
    <Box
      sx={{
        // Tarjeta del diseño: blanca, radio 18, borde casi invisible. Sin cambio
        // de color al pasar por encima — no es clicable, no debe parecerlo.
        borderRadius: '18px',
        border: panelBorder(theme),
        bgcolor: 'background.paper',
        overflow: 'hidden',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
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
          bgcolor: alpha(isDark ? theme.palette.common.white : theme.palette.common.black, isDark ? 0.02 : 0.015),
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
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(5, 1fr)' },
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

        {/* Platforms — full-width bottom strip */}
        <Box
          sx={{
            gridColumn: '1 / -1',
            borderTop: '1px solid',
            borderColor: 'divider',
            px: 2,
            py: 1.25,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            flexWrap: 'wrap',
            bgcolor: alpha(isDark ? theme.palette.common.white : theme.palette.common.black, 0.01),
          }}
        >
          <Stack direction="row"
alignItems="center"
spacing={0.75}
flexShrink={0}>
            <RouterRoundedIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
            <Typography sx={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'text.secondary' }}>
              Plataformas
            </Typography>
          </Stack>
          <Divider orientation="vertical"
flexItem
sx={{ height: 16, alignSelf: 'center' }} />
          {loading ? (
            <Stack direction="row"
spacing={2}>
              <Skeleton width={80}
height={20}
sx={{ borderRadius: 1 }} />
              <Skeleton width={60}
height={20}
sx={{ borderRadius: 1 }} />
            </Stack>
          ) : platforms.length === 0 ? (
            <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>Sin datos de plataforma</Typography>
          ) : (
            <Stack direction="row"
spacing={3}
flexWrap="wrap">
              {platforms.map(([key, count]) => {
                const meta = platformMeta(theme)[key] ?? { label: key, color: theme.palette.text.disabled };
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <Tooltip key={key}
title={`${count} campañas · ${pct}% del total`}
arrow
placement="top">
                    <Stack direction="row"
alignItems="center"
spacing={1}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: meta.color, flexShrink: 0 }} />
                      <Typography sx={{ fontSize: 12, fontWeight: 700, color: meta.color }}>
                        {meta.label}
                      </Typography>
                      <Typography sx={{ fontSize: 12, fontWeight: 800, color: meta.color, fontVariantNumeric: 'tabular-nums' }}>
                        {count.toLocaleString()}
                      </Typography>
                      <Box sx={{ width: 48, height: 4, borderRadius: 2, bgcolor: alpha(meta.color, 0.15), overflow: 'hidden' }}>
                        <Box sx={{ width: `${pct}%`, height: '100%', bgcolor: meta.color, borderRadius: 2 }} />
                      </Box>
                    </Stack>
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
function CampaignsGrid({ storeId, forceCards = false }: CampaignsGridProps) {
  const [showMetrics, setShowMetrics] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    title: '',
    storeName: '',
    type: '',
    platform: '',
    circularss: '',
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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const statsKey = useMemo(() => ({
    status: filters.status,
    title: filters.title,
    type: filters.type,
    platform: filters.platform,
    circularss: filters.circularss,
    startDate: filters.startDate,
    endDate: filters.endDate,
    storeId: filters.storeId,
  }), [filters.status, filters.title, filters.type, filters.platform, filters.circularss, filters.startDate, filters.endDate, filters.storeId]);

  const { data: stats, isFetching: statsFetching } = useQuery({
    queryKey: ['campaigns-stats', statsKey],
    queryFn: () =>
      campaignClient.getFilterStats({
        status: filters.status || undefined,
        title: filters.title || undefined,
        type: filters.type || undefined,
        platform: filters.platform || undefined,
        circularss: filters.circularss || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        storeId: filters.storeId || undefined,
      }),
    staleTime: 30_000,
    placeholderData: (prev) => prev ?? EMPTY_STATS,
  });

  // ✅ MUST be before any early return — Rules of Hooks
  const handleSetFilters = useCallback((next: typeof filters) => {
    setFilters(next);
  }, []);

  if (isPending) {
    return (
      <Box display="flex"
justifyContent="center"
alignItems="center"
height="300px">
        <CircularProgress size={48} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box textAlign="center"
py={4}>
        <Typography color="error">Error al cargar campañas</Typography>
      </Box>
    );
  }

  const s = stats ?? EMPTY_STATS;
  const isLoading = statsFetching && !stats;

  return (
    <>
      {/* Portada del Store Panel 2.0: el resumen de la red en una línea, con
          los números del filtro activo — no un subtítulo genérico. */}
      <Box sx={{ mb: 1.5 }}>
        <PageHero
          eyebrow={storeId ? 'Tienda · Campañas' : 'Management · Campaigns'}
          title={storeId ? t('Campañas') : t('Campañas de la red')}
          subtitle={
            stats
              ? `${(stats.total ?? 0).toLocaleString()} envíos · ${(
                  stats.messages?.totalAudience ?? 0
                ).toLocaleString()} personas alcanzadas`
              : undefined
          }
          actions={
            <>
              <ExportButton
                eventName="campaigns:export"
                emitOnly
                variant="outlined"
                sx={heroBtn}
              >
                Exportar
              </ExportButton>

              {/* Enviar prueba vivía como ítem suelto del menú lateral. Es una
                  acción sobre campañas, no una sección: acá está donde se usa
                  y el menú deja de tener un renglón más que leer. */}
              {!storeId && (
                <Button
                  component={Link}
                  href="/admin/management/campaings/send-test"
                  variant="outlined"
                  startIcon={<ScienceRoundedIcon />}
                  sx={heroBtn}
                >
                  Enviar prueba
                </Button>
              )}

              <Button
                component={Link}
                href="/admin/management/campaings/create"
                variant="contained"
                disableElevation
                startIcon={<AddCircleOutlineRoundedIcon />}
                sx={{ ...heroBtn, color: undefined, borderColor: undefined }}
              >
                Nueva campaña
              </Button>
            </>
          }
        />
      </Box>

      {/* Los cinco KPIs del diseño. Antes era una tira "Métricas y desglose"
          que había que desplegar para ver los números, y cerrada mostraba tres
          sueltos sin jerarquía. Acá el resumen de la red se lee de entrada. */}
      <Box sx={{ mb: 1.5 }}>
        {(isFetching || statsFetching) && !isPending && (
          <LinearProgress sx={{ mb: 1.5, borderRadius: 1, height: 2, opacity: 0.5 }} />
        )}

        <KpiRow min={196}>
          <PanelKpiCard
            icon={<CampaignRoundedIcon sx={{ fontSize: 17, color: 'primary.main' }} />}
            label="Envíos"
            value={isLoading ? '—' : s.total.toLocaleString()}
            delta="en el filtro activo"
          />
          <PanelKpiCard
            icon={<CheckCircleOutlineRoundedIcon sx={{ fontSize: 17, color: 'success.main' }} />}
            label="Completadas"
            value={isLoading ? '—' : (s.byStatus.completed ?? 0).toLocaleString()}
            delta={`${(s.byStatus.scheduled ?? 0).toLocaleString()} programadas`}
          />
          <PanelKpiCard
            icon={<PeopleOutlineRoundedIcon sx={{ fontSize: 17, color: 'info.main' }} />}
            label="Audiencia"
            value={isLoading ? '—' : s.messages.totalAudience.toLocaleString()}
            delta="mensajes entregables"
          />
          <PanelKpiCard
            icon={<MonetizationOnRoundedIcon sx={{ fontSize: 17, color: 'warning.main' }} />}
            label="Costo"
            value={isLoading ? '—' : compactUsd.format(s.messages.totalCost ?? 0)}
            delta="facturado a tiendas"
          />
          <PanelKpiCard
            icon={<TrendingUpRoundedIcon sx={{ fontSize: 17, color: 'success.main' }} />}
            label="Entrega media"
            value={isLoading ? '—' : `${Math.round(s.messages.avgDeliveryRate ?? 0)}%`}
            delta={storeId ? 'esta tienda' : 'red completa'}
            tone={(s.messages.avgDeliveryRate ?? 0) >= 85 ? 'success' : 'warning'}
          />
        </KpiRow>
      </Box>

      <Grid container
mt={0}
spacing={{ xs: 2, sm: 3 }}>
        <Grid xs={12}>
          <Results
            campaigns={data?.data || []}
            filters={filters}
            setFilters={handleSetFilters}
            total={data?.total || 0}
            refetch={refetch}
            storeId={storeId}
            isLoading={isFetching}
            forceCards={forceCards}
          />
        </Grid>
      </Grid>
    </>
  );
}

export default CampaignsGrid;
