'use client';

import { usePromotorsMetrics, type MetricsPeriod } from '@/hooks/promotors/usePromotorsMetrics';
import type { RankedPromoter } from '@/services/promotor.service';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import WorkspacePremiumRoundedIcon from '@mui/icons-material/WorkspacePremiumRounded';
import {
  alpha,
  Avatar,
  Box,
  Chip,
  Container,
  Divider,
  LinearProgress,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useTheme,
} from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { useState } from 'react';
import PageHeading from 'src/components/base/page-heading';
import { useCustomization } from 'src/hooks/use-customization';

// ── Period config ─────────────────────────────────────────────────────────────
const PERIOD_LABELS: Record<MetricsPeriod, string> = {
  today: 'Hoy',
  week: 'Esta semana',
  month: 'Este mes',
};

// ── Stat row ──────────────────────────────────────────────────────────────────
function StatRow({
  icon,
  label,
  value,
  sub,
  color,
  loading,
  delta,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  loading?: boolean;
  delta?: number | null;
}) {
  const theme = useTheme();
  const dark = theme.palette.mode === 'dark';
  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={2}
      sx={{
        px: 2.5,
        py: 2,
        borderRadius: 2.5,
        border: '1px solid',
        borderColor: alpha(color, dark ? 0.16 : 0.12),
        bgcolor: alpha(color, dark ? 0.04 : 0.025),
        minWidth: 0,
      }}
    >
      <Box
        sx={{
          width: 38,
          height: 38,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: alpha(color, dark ? 0.16 : 0.1),
          color,
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box flex={1} minWidth={0}>
        <Typography noWrap sx={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary' }}>
          {label}
        </Typography>
        {loading ? (
          <Skeleton width={64} height={26} />
        ) : (
          <Typography sx={{ fontSize: 22, fontWeight: 900, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums', color }}>
            {value}
          </Typography>
        )}
        {sub && !loading && (
          <Typography noWrap sx={{ fontSize: 11, color: 'text.disabled' }}>{sub}</Typography>
        )}
      </Box>
      {delta != null && !loading && (
        <Chip
          size="small"
          label={`${delta >= 0 ? '+' : ''}${delta}%`}
          sx={{
            height: 20,
            fontSize: 10,
            fontWeight: 700,
            flexShrink: 0,
            bgcolor: alpha(delta >= 0 ? '#10b981' : '#ef4444', 0.1),
            color: delta >= 0 ? '#10b981' : '#ef4444',
            border: `1px solid ${alpha(delta >= 0 ? '#10b981' : '#ef4444', 0.18)}`,
          }}
        />
      )}
    </Stack>
  );
}

// ── Section card ──────────────────────────────────────────────────────────────
function SectionCard({
  title,
  dot,
  badge,
  children,
}: {
  title: string;
  dot: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  const dark = theme.palette.mode === 'dark';
  return (
    <Box
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        bgcolor: dark ? alpha('#fff', 0.012) : alpha('#000', 0.008),
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.25}
        sx={{
          px: 2.5,
          py: 1.75,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: dot, flexShrink: 0 }} />
        <Typography sx={{ fontWeight: 700, fontSize: 13 }}>
          {title}
        </Typography>
        {badge}
      </Stack>
      <Box sx={{ p: 2.5 }}>{children}</Box>
    </Box>
  );
}

// ── Horizontal ranking chart ──────────────────────────────────────────────────
function HorizontalRankingChart({ ranking, loading }: { ranking: RankedPromoter[]; loading: boolean }) {
  const theme = useTheme();

  if (loading) return <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 1.5 }} />;
  if (!ranking.length) {
    return (
      <Box sx={{ py: 5, textAlign: 'center', color: 'text.disabled' }}>
        <TrendingUpRoundedIcon sx={{ fontSize: 36, mb: 0.5 }} />
        <Typography sx={{ fontSize: 13 }}>Sin datos para el período</Typography>
      </Box>
    );
  }

  const top = ranking.slice(0, 8);
  const names = top.map((r) => {
    const parts = r.promoterName.split(' ');
    return parts.length >= 2 ? `${parts[0]} ${parts[1][0]}.` : parts[0];
  });
  const newVals = top.map((r) => r.newCustomers);
  const existingVals = top.map((r) => r.existingCustomers);

  // height: each promoter gets 36px row + margins
  const chartHeight = Math.max(220, top.length * 38 + 48);

  return (
    <Box sx={{ width: '100%', overflow: 'hidden' }}>
      <BarChart
        layout="horizontal"
        height={chartHeight}
        series={[
          { data: newVals, label: 'Nuevos', stack: 'total', color: theme.palette.primary.main },
          { data: existingVals, label: 'Recurrentes', stack: 'total', color: theme.palette.success.main },
        ]}
        yAxis={[{ scaleType: 'band', data: names, categoryGapRatio: 0.3 }]}
        xAxis={[{ label: 'Registros' }]}
        sx={{
          width: '100%',
          '.MuiBarElement-root': { ry: 4 },
          '.MuiChartsLegend-root text': { fontSize: 11 },
        }}
        margin={{ left: 90, right: 16, top: 8, bottom: 32 }}
      />
    </Box>
  );
}

// Removed HorizontalEarningsChart

// ── Daily registrations chart ─────────────────────────────────────────────────
function DailyRegistrationsChart({ data, loading }: { data: any[]; loading: boolean }) {
  const theme = useTheme();

  if (loading) return <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1.5 }} />;
  if (!data.length) {
    return (
      <Box sx={{ py: 5, textAlign: 'center', color: 'text.disabled' }}>
        <TrendingUpRoundedIcon sx={{ fontSize: 36, mb: 0.5 }} />
        <Typography sx={{ fontSize: 13 }}>Sin registros para el período</Typography>
      </Box>
    );
  }

  const labels = data.map((d) => {
    const parts = (d.date ?? '').split('-');
    return parts.length === 3 ? `${parts[1]}/${parts[2]}` : d.date;
  });
  const newVals = data.map((d) => d.newCustomers ?? 0);
  const existVals = data.map((d) => d.existingCustomers ?? 0);

  return (
    <Box sx={{ width: '100%', overflow: 'hidden' }}>
      <BarChart
        height={200}
        series={[
          { data: newVals, label: 'Nuevos', stack: 'total', color: theme.palette.primary.main },
          { data: existVals, label: 'Recurrentes', stack: 'total', color: theme.palette.success.main },
        ]}
        xAxis={[{ scaleType: 'band', data: labels, categoryGapRatio: 0.35, tickLabelStyle: { fontSize: 10 } }]}
        sx={{
          width: '100%',
          '.MuiBarElement-root': { ry: 3 },
          '.MuiChartsLegend-root text': { fontSize: 11 },
        }}
        margin={{ left: 40, right: 8, top: 8, bottom: 32 }}
      />
    </Box>
  );
}

// ── Goal progress row ─────────────────────────────────────────────────────────
function GoalProgressRow({ promoter, rank, threshold }: { promoter: any; rank: number; threshold: number }) {
  const theme = useTheme();
  const dark = theme.palette.mode === 'dark';
  const regs = promoter.totalRegistrations ?? 0;
  const pct = Math.min(100, Math.round((regs / threshold) * 100));
  const reached = regs >= threshold;
  const gold = '#f59e0b';
  const primary = theme.palette.primary.main;
  const dotColor = rank === 0 ? gold : rank === 1 ? '#9ca3af' : rank === 2 ? '#b45309' : primary;

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: '28px 1fr 56px',
        alignItems: 'center',
        gap: 1.5,
        py: 1.25,
        borderBottom: '1px solid',
        borderColor: 'divider',
        '&:last-child': { borderBottom: 0 },
      }}
    >
      {/* Rank */}
      <Typography
        textAlign="center"
        sx={{ color: dotColor, lineHeight: 1, fontSize: 12, fontWeight: 800 }}
      >
        {rank + 1}
      </Typography>

      {/* Name + bar */}
      <Box minWidth={0}>
        <Stack direction="row" alignItems="center" spacing={0.75} mb={0.5}>
          <Avatar
            src={promoter.profileImage}
            sx={{ width: 20, height: 20, fontSize: 10, bgcolor: alpha(dotColor, 0.12), color: dotColor }}
          >
            {promoter.firstName?.[0]}
          </Avatar>
          <Typography noWrap sx={{ fontSize: 12, fontWeight: 700 }}>
            {promoter.firstName} {promoter.lastName}
          </Typography>
          {reached && (
            <WorkspacePremiumRoundedIcon sx={{ fontSize: 13, color: gold, flexShrink: 0 }} />
          )}
        </Stack>
        <LinearProgress
          variant="determinate"
          value={pct}
          sx={{
            height: 5,
            borderRadius: 3,
            bgcolor: alpha(reached ? '#10b981' : primary, dark ? 0.12 : 0.08),
            '& .MuiLinearProgress-bar': {
              bgcolor: reached ? '#10b981' : primary,
              borderRadius: 3,
            },
          }}
        />
      </Box>

      {/* Count */}
      <Box textAlign="right">
        <Typography sx={{ fontSize: 13, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: reached ? '#10b981' : 'text.primary' }}>
          {regs}
        </Typography>
        <Typography sx={{ fontSize: 10, color: 'text.disabled', fontVariantNumeric: 'tabular-nums' }}>
          /{threshold}
        </Typography>
      </Box>
    </Box>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PromoterMetricsPage() {
  const customization = useCustomization();
  const theme = useTheme();
  const dark = theme.palette.mode === 'dark';
  const primary = theme.palette.primary.main;

  const [period, setPeriod] = useState<MetricsPeriod>('month');

  const {
    isLoading,
    ranking,
    totals,
    overview,
    topPromoters,
    goalReached,
    delta,
    GOAL_THRESHOLD,
    dailyRegistrations,
  } = usePromotorsMetrics({ period });

  const newPct = overview.totalParticipations > 0
    ? Math.round((overview.newUsers / overview.totalParticipations) * 100)
    : 0;
  const existPct = 100 - newPct;

  return (
    <Container sx={{ py: { xs: 2, sm: 3 } }} maxWidth={customization.stretch ? false : 'xl'}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
        gap={2}
        mb={3}
      >
        <PageHeading
          sx={{ px: 0, mb: 0 }}
          title="Métricas de Promotoras"
          description="Rendimiento, rankings y auditoría de impulsadoras"
        />
        <ToggleButtonGroup
          value={period}
          exclusive
          onChange={(_, v) => { if (v) setPeriod(v); }}
          size="small"
          color="primary"
          sx={{
            flexShrink: 0,
            '& .MuiToggleButton-root': {
              px: 2.25,
              py: 0.75,
              fontSize: 12,
              fontWeight: 700,
              textTransform: 'none',
              minWidth: 76,
            },
          }}
        >
          <ToggleButton value="today">Hoy</ToggleButton>
          <ToggleButton value="week">Semana</ToggleButton>
          <ToggleButton value="month">Mes</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {/* ── KPIs ───────────────────────────────────────────────────────── */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' },
          gap: 2,
          mb: 3,
        }}
      >
        <StatRow
          icon={<TrendingUpRoundedIcon sx={{ fontSize: 20 }} />}
          label="Registros totales"
          value={overview.totalParticipations.toLocaleString()}
          sub={PERIOD_LABELS[period]}
          color={primary}
          loading={isLoading}
          delta={delta}
        />
        <StatRow
          icon={<PersonAddAlt1RoundedIcon sx={{ fontSize: 20 }} />}
          label="Nuevos usuarios"
          value={overview.newUsers.toLocaleString()}
          sub={`${newPct}% del total`}
          color="#10b981"
          loading={isLoading}
        />
        <StatRow
          icon={<GroupsRoundedIcon sx={{ fontSize: 20 }} />}
          label="Recurrentes"
          value={overview.existingUsers.toLocaleString()}
          sub={`${existPct}% del total`}
          color="#6366f1"
          loading={isLoading}
        />
        <StatRow
          icon={<StorefrontRoundedIcon sx={{ fontSize: 20 }} />}
          label="Tiendas con actividad"
          value={overview.uniqueStoresCount}
          sub={`${overview.uniquePromotersCount} promotoras`}
          color="#0ea5e9"
          loading={isLoading}
        />
        <StatRow
          icon={<EmojiEventsRoundedIcon sx={{ fontSize: 20 }} />}
          label="Meta alcanzada"
          value={goalReached.length}
          sub={`≥${GOAL_THRESHOLD} registros totales`}
          color="#ec4899"
          loading={isLoading}
        />
        <StatRow
          icon={<WorkspacePremiumRoundedIcon sx={{ fontSize: 20 }} />}
          label="Total pagado"
          value={`$${(overview.totalPaid ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          sub="para promotoras"
          color="#f59e0b"
          loading={isLoading}
        />
        <StatRow
          icon={<SendRoundedIcon sx={{ fontSize: 20 }} />}
          label="Campañas enviadas"
          value={(overview.campaignSentCount ?? 0).toLocaleString()}
          sub="en el período"
          color="#a855f7"
          loading={isLoading}
        />
      </Box>

      {/* ── Charts row ─────────────────────────────────────────────────── */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '3fr 2fr' },
          gap: 2,
          mb: 2,
        }}
      >
        {/* Ranking horizontal chart */}
        <SectionCard
          title={`Ranking de registros — ${PERIOD_LABELS[period]}`}
          dot={primary}
        >
          <HorizontalRankingChart ranking={ranking} loading={isLoading} />
        </SectionCard>

        {/* Resumen de totales */}
        <SectionCard
          title={`Resumen de Totales — ${PERIOD_LABELS[period]}`}
          dot={theme.palette.success.main}
        >
          {!isLoading && totals && (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2.5, py: 1 }}>
              {[
                { label: 'Total registros', value: totals.grandTotalParticipations.toLocaleString() },
                { label: 'Nuevos', value: totals.grandTotalNewCustomers.toLocaleString() },
                { label: 'Recurrentes', value: (totals.grandTotalExistingCustomers ?? 0).toLocaleString() },
                { label: 'Total pagado', value: `$${(totals.grandTotalPaid ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
                { label: 'Campañas enviadas', value: (totals.grandTotalCampaignSent ?? 0).toLocaleString() },
              ].map(({ label, value }) => (
                <Box key={label}>
                  <Typography sx={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.disabled' }}>
                    {label}
                  </Typography>
                  <Typography sx={{ fontSize: 16, fontWeight: 800, fontVariantNumeric: 'tabular-nums', mt: 0.5 }}>
                    {value}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </SectionCard>
      </Box>

      {/* ── Daily registrations + performance table ─────────────────────── */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '2fr 3fr' },
          gap: 2,
          mb: 2,
        }}
      >
        {/* Daily chart */}
        <SectionCard title={`Registros por día — ${PERIOD_LABELS[period]}`} dot="#10b981">
          <DailyRegistrationsChart data={dailyRegistrations} loading={isLoading} />
        </SectionCard>

        {/* Performance table */}
        <SectionCard title="Tabla de rendimiento" dot={primary}>
          {isLoading ? (
            <Stack spacing={1}>
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} height={36} sx={{ borderRadius: 1.5 }} />
              ))}
            </Stack>
          ) : (
            <TableContainer sx={{ maxHeight: 300, overflowY: 'auto' }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', py: 1 }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', py: 1 }}>Promotora</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', py: 1 }}>Total</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', py: 1 }}>Nuevos</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', py: 1 }}>Pagado</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', py: 1 }}>Campañas</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ranking.map((r, i) => (
                    <TableRow key={r.promoterId} hover sx={{ '&:last-child td': { border: 0 } }}>
                      <TableCell sx={{ py: 0.75 }}>
                        <Typography
                          sx={{ fontSize: 11, fontWeight: 800, color: i === 0 ? '#f59e0b' : i === 1 ? '#9ca3af' : i === 2 ? '#b45309' : 'text.disabled' }}
                        >
                          {i + 1}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 0.75 }}>
                        <Typography noWrap sx={{ fontSize: 13, fontWeight: 600, maxWidth: 120 }}>
                          {r.promoterName}
                        </Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ py: 0.75 }}>
                        <Typography sx={{ fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                          {r.totalParticipations}
                        </Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ py: 0.75 }}>
                        <Typography sx={{ fontSize: 12, color: 'success.main', fontVariantNumeric: 'tabular-nums' }}>
                          {r.newCustomers}
                        </Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ py: 0.75 }}>
                        <Typography sx={{ fontSize: 12, color: 'warning.main', fontVariantNumeric: 'tabular-nums' }}>
                          ${(r.totalPaid ?? 0).toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ py: 0.75 }}>
                        <Typography sx={{ fontSize: 12, color: 'info.main', fontVariantNumeric: 'tabular-nums' }}>
                          {r.campaignSentCount ?? 0}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                  {ranking.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.disabled', fontSize: 13 }}>
                        Sin datos para el período
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </SectionCard>
      </Box>

      {/* ── Goal progress ───────────────────────────────────────────────── */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
          gap: 2,
          mb: 2,
        }}
      >
        {/* Goal progress — all top 20 */}
        <SectionCard
          title="Progreso hacia la meta"
          dot="#10b981"
          badge={
            <Chip
              size="small"
              label={`Meta: ${GOAL_THRESHOLD} registros`}
              sx={{ height: 18, fontSize: 10, fontWeight: 600, ml: 0.5 }}
            />
          }
        >
          {isLoading ? (
            <Stack spacing={1}>
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} height={48} sx={{ borderRadius: 1.5 }} />
              ))}
            </Stack>
          ) : topPromoters.length === 0 ? (
            <Box sx={{ py: 4, textAlign: 'center', color: 'text.disabled' }}>
              <EmojiEventsRoundedIcon sx={{ fontSize: 36, mb: 0.5, opacity: 0.3 }} />
              <Typography sx={{ fontSize: 13 }}>Sin promotoras registradas</Typography>
            </Box>
          ) : (
            <Box sx={{ maxHeight: 340, overflowY: 'auto' }}>
              {topPromoters.slice(0, 15).map((p, i) => (
                <GoalProgressRow key={p._id} promoter={p} rank={i} threshold={GOAL_THRESHOLD} />
              ))}
            </Box>
          )}
        </SectionCard>

        {/* All-time grid — top 10 compact */}
        <SectionCard
          title="Historial acumulado"
          dot="#6366f1"
          badge={
            <Typography sx={{ fontSize: 11, color: 'text.disabled', ml: 0.5 }}>
              todos los tiempos
            </Typography>
          }
        >
          {isLoading ? (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.25 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} height={60} sx={{ borderRadius: 2 }} />
              ))}
            </Box>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.25 }}>
              {topPromoters.slice(0, 10).map((p, i) => {
                const dotColor = i === 0 ? '#f59e0b' : i === 1 ? '#9ca3af' : i === 2 ? '#b45309' : primary;
                return (
                  <Stack
                    key={p._id}
                    direction="row"
                    alignItems="center"
                    spacing={1.25}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: i < 3 ? alpha(dotColor, dark ? 0.25 : 0.18) : 'divider',
                      bgcolor: i < 3 ? alpha(dotColor, dark ? 0.05 : 0.02) : 'transparent',
                      minWidth: 0,
                    }}
                  >
                    <Avatar
                      src={p.profileImage}
                      sx={{
                        width: 32,
                        height: 32,
                        fontSize: 12,
                        flexShrink: 0,
                        bgcolor: alpha(dotColor, 0.12),
                        color: dotColor,
                      }}
                    >
                      {p.firstName?.[0]}
                    </Avatar>
                    <Box minWidth={0} flex={1}>
                      <Typography noWrap sx={{ fontSize: 12, fontWeight: 700 }}>
                        {p.firstName} {p.lastName?.split(' ')[0]}
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={0.4}>
                        {i < 3 && <EmojiEventsRoundedIcon sx={{ fontSize: 11, color: dotColor }} />}
                        <Typography sx={{ fontSize: 11, color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
                          {(p.totalRegistrations ?? 0).toLocaleString()}
                        </Typography>
                      </Stack>
                    </Box>
                  </Stack>
                );
              })}
            </Box>
          )}
        </SectionCard>
      </Box>

    </Container>
  );
}
