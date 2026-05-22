'use client';

import { usePromotorsMetrics, type MetricsPeriod } from '@/hooks/promotors/usePromotorsMetrics';
import type { RankedPromoter } from '@/services/promotor.service';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import {
  alpha,
  Avatar,
  Box,
  Chip,
  Container,
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

// ── KPI tile ──────────────────────────────────────────────────────────────────
interface KpiProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  color: string;
  loading?: boolean;
  delta?: number | null;
}

function KpiTile({ label, value, sub, icon, color, loading, delta }: KpiProps) {
  const theme = useTheme();
  const dark = theme.palette.mode === 'dark';
  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        p: 2.5,
        borderRadius: 3,
        border: '1px solid',
        borderColor: alpha(color, dark ? 0.18 : 0.15),
        bgcolor: alpha(color, dark ? 0.05 : 0.03),
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'text.secondary' }}>
          {label}
        </Typography>
        <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: alpha(color, dark ? 0.18 : 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
          {icon}
        </Box>
      </Stack>
      {loading ? (
        <Skeleton width={80} height={36} />
      ) : (
        <Typography sx={{ fontSize: 28, fontWeight: 900, lineHeight: 1, color, fontVariantNumeric: 'tabular-nums' }}>
          {value}
        </Typography>
      )}
      {(sub || delta != null) && (
        <Stack direction="row" alignItems="center" spacing={1}>
          {sub && <Typography sx={{ fontSize: 11, color: 'text.disabled' }}>{sub}</Typography>}
          {delta != null && (
            <Chip
              size="small"
              label={`${delta >= 0 ? '+' : ''}${delta}%`}
              sx={{
                height: 18, fontSize: 10, fontWeight: 700,
                bgcolor: alpha(delta >= 0 ? '#10b981' : '#ef4444', 0.1),
                color: delta >= 0 ? '#10b981' : '#ef4444',
                border: `1px solid ${alpha(delta >= 0 ? '#10b981' : '#ef4444', 0.2)}`,
              }}
            />
          )}
        </Stack>
      )}
    </Box>
  );
}

// ── Ranking bar chart ─────────────────────────────────────────────────────────
function RankingChart({ ranking, loading }: { ranking: RankedPromoter[]; loading: boolean }) {
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const secondary = theme.palette.success.main;

  if (loading) {
    return <Skeleton variant="rectangular" height={320} sx={{ borderRadius: 2 }} />;
  }

  if (!ranking.length) {
    return (
      <Box sx={{ py: 6, textAlign: 'center', color: 'text.disabled' }}>
        <TrendingUpRoundedIcon sx={{ fontSize: 40, mb: 1 }} />
        <Typography>Sin datos para el período</Typography>
      </Box>
    );
  }

  const top = ranking.slice(0, 10);
  const names = top.map((r) => r.promoterName.split(' ')[0]);
  const newVals = top.map((r) => r.newCustomers);
  const existingVals = top.map((r) => r.existingCustomers);

  return (
    <BarChart
      height={320}
      series={[
        { data: newVals, label: 'Nuevos', stack: 'total', color: primary },
        { data: existingVals, label: 'Recurrentes', stack: 'total', color: secondary },
      ]}
      xAxis={[{ scaleType: 'band', data: names, categoryGapRatio: 0.35 }]}
      yAxis={[{ label: 'Registros' }]}
      sx={{
        '.MuiBarElement-root': { ry: theme.shape.borderRadius / 1.5 },
        '.MuiChartsLegend-root': { fontSize: 12 },
      }}
      margin={{ left: 48, right: 16, top: 16, bottom: 40 }}
    />
  );
}

// ── Earnings bar chart ────────────────────────────────────────────────────────
function EarningsChart({ ranking, loading }: { ranking: RankedPromoter[]; loading: boolean }) {
  const theme = useTheme();

  if (loading) return <Skeleton variant="rectangular" height={260} sx={{ borderRadius: 2 }} />;
  if (!ranking.length) return null;

  const top = ranking.slice(0, 8);
  const names = top.map((r) => r.promoterName.split(' ')[0]);
  const vals = top.map((r) => Number(r.totalEarnings.toFixed(2)));

  return (
    <BarChart
      height={260}
      series={[{ data: vals, label: 'Ganancias ($)', color: theme.palette.warning.main }]}
      xAxis={[{ scaleType: 'band', data: names, categoryGapRatio: 0.4 }]}
      yAxis={[{ label: '$' }]}
      sx={{ '.MuiBarElement-root': { ry: theme.shape.borderRadius / 1.5 } }}
      margin={{ left: 52, right: 16, top: 16, bottom: 40 }}
    />
  );
}

// ── Goal table ────────────────────────────────────────────────────────────────
function GoalTable({ promoters, threshold, loading }: { promoters: any[]; threshold: number; loading: boolean }) {
  const theme = useTheme();
  const dark = theme.palette.mode === 'dark';

  if (loading) {
    return (
      <Stack spacing={1}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} height={44} sx={{ borderRadius: 1.5 }} />
        ))}
      </Stack>
    );
  }

  if (!promoters.length) {
    return (
      <Box sx={{ py: 5, textAlign: 'center', color: 'text.disabled' }}>
        <EmojiEventsRoundedIcon sx={{ fontSize: 36, mb: 1, opacity: 0.4 }} />
        <Typography fontSize={13}>Ninguna promotora ha alcanzado la meta aún</Typography>
      </Box>
    );
  }

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>#</TableCell>
            <TableCell sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Promotora</TableCell>
            <TableCell align="right" sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Registros</TableCell>
            <TableCell align="right" sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Meta</TableCell>
            <TableCell align="right" sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Exceso</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {promoters.map((p, i) => {
            const regs = p.totalRegistrations ?? 0;
            const excess = regs - threshold;
            return (
              <TableRow
                key={p._id}
                hover
                sx={{ '&:last-child td': { border: 0 } }}
              >
                <TableCell>
                  <Typography fontSize={13} fontWeight={700} color={i < 3 ? 'warning.main' : 'text.secondary'}>
                    {i + 1}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Stack direction="row" alignItems="center" spacing={1.25}>
                    <Avatar
                      src={p.profileImage}
                      sx={{ width: 28, height: 28, fontSize: 12, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}
                    >
                      {p.firstName?.[0]}
                    </Avatar>
                    <Box>
                      <Typography fontSize={13} fontWeight={600} lineHeight={1.2}>
                        {p.firstName} {p.lastName}
                      </Typography>
                      <Typography fontSize={11} color="text.disabled">{p.email}</Typography>
                    </Box>
                  </Stack>
                </TableCell>
                <TableCell align="right">
                  <Typography fontSize={13} fontWeight={700} fontVariantNumeric="tabular-nums">
                    {regs.toLocaleString()}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography fontSize={13} color="text.secondary" fontVariantNumeric="tabular-nums">
                    {threshold}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Chip
                    size="small"
                    label={`+${excess}`}
                    sx={{
                      height: 20, fontSize: 10, fontWeight: 700,
                      bgcolor: alpha('#10b981', dark ? 0.15 : 0.1),
                      color: '#10b981',
                      border: `1px solid ${alpha('#10b981', 0.2)}`,
                    }}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
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
    dashStats,
    ranking,
    totals,
    overview,
    topPromoters,
    goalReached,
    delta,
    GOAL_THRESHOLD,
  } = usePromotorsMetrics({ period });

  const PERIOD_LABELS: Record<MetricsPeriod, string> = {
    today: 'Hoy',
    week: 'Esta semana',
    month: 'Este mes',
  };

  return (
    <Container sx={{ py: { xs: 2, sm: 3 } }} maxWidth={customization.stretch ? false : 'xl'}>
      {/* Header */}
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" gap={2} mb={3}>
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
            '& .MuiToggleButton-root': { px: 2, fontSize: 12, fontWeight: 700, textTransform: 'none', minWidth: 80 },
          }}
        >
          <ToggleButton value="today">Hoy</ToggleButton>
          <ToggleButton value="week">Semana</ToggleButton>
          <ToggleButton value="month">Mes</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {/* KPIs */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(6, 1fr)' },
          gap: 2,
          mb: 3,
        }}
      >
        <KpiTile
          label="Registros"
          value={overview.totalParticipations.toLocaleString()}
          icon={<TrendingUpRoundedIcon sx={{ fontSize: 18 }} />}
          color={primary}
          loading={isLoading}
          delta={delta}
          sub={PERIOD_LABELS[period]}
        />
        <KpiTile
          label="Nuevos usuarios"
          value={overview.newUsers.toLocaleString()}
          icon={<PersonAddAlt1RoundedIcon sx={{ fontSize: 18 }} />}
          color="#10b981"
          loading={isLoading}
          sub={`${overview.totalParticipations > 0 ? Math.round((overview.newUsers / overview.totalParticipations) * 100) : 0}% del total`}
        />
        <KpiTile
          label="Recurrentes"
          value={overview.existingUsers.toLocaleString()}
          icon={<GroupsRoundedIcon sx={{ fontSize: 18 }} />}
          color="#6366f1"
          loading={isLoading}
          sub={`${overview.totalParticipations > 0 ? Math.round((overview.existingUsers / overview.totalParticipations) * 100) : 0}% del total`}
        />
        <KpiTile
          label="Ganancias est."
          value={`$${(totals?.grandTotalEarnings ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={<StarRoundedIcon sx={{ fontSize: 18 }} />}
          color="#f59e0b"
          loading={isLoading}
          sub="para promotoras"
        />
        <KpiTile
          label="Tiendas activas"
          value={overview.uniqueStoresCount.toLocaleString()}
          icon={<StorefrontRoundedIcon sx={{ fontSize: 18 }} />}
          color="#0ea5e9"
          loading={isLoading}
          sub={`${overview.uniquePromotersCount} promotoras`}
        />
        <KpiTile
          label="Meta alcanzada"
          value={goalReached.length}
          icon={<EmojiEventsRoundedIcon sx={{ fontSize: 18 }} />}
          color="#ec4899"
          loading={isLoading}
          sub={`≥${GOAL_THRESHOLD} registros`}
        />
      </Box>

      {/* Two-col: ranking chart + earnings chart */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
          gap: 2.5,
          mb: 2.5,
        }}
      >
        {/* Ranking chart */}
        <Box
          sx={{
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            p: 2.5,
            bgcolor: dark ? alpha('#fff', 0.015) : alpha('#000', 0.01),
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1} mb={2}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: primary }} />
            <Typography fontWeight={700} fontSize={14}>
              Ranking de registros — {PERIOD_LABELS[period]}
            </Typography>
            {isLoading && (
              <Box sx={{ ml: 'auto' }}>
                <Skeleton width={60} height={16} />
              </Box>
            )}
          </Stack>
          <RankingChart ranking={ranking} loading={isLoading} />
        </Box>

        {/* Earnings chart */}
        <Box
          sx={{
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            p: 2.5,
            bgcolor: dark ? alpha('#fff', 0.015) : alpha('#000', 0.01),
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1} mb={2}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: theme.palette.warning.main }} />
            <Typography fontWeight={700} fontSize={14}>
              Top ganancias — {PERIOD_LABELS[period]}
            </Typography>
          </Stack>
          <EarningsChart ranking={ranking} loading={isLoading} />

          {/* Totals strip */}
          {!isLoading && totals && (
            <Box
              sx={{
                mt: 2,
                pt: 2,
                borderTop: '1px solid',
                borderColor: 'divider',
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 1.5,
              }}
            >
              {[
                { label: 'Total registros', value: totals.grandTotalParticipations.toLocaleString() },
                { label: 'Total ganancias', value: `$${totals.grandTotalEarnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
                { label: 'Nuevos totales', value: totals.grandTotalNewCustomers.toLocaleString() },
                { label: 'Recurrentes', value: (totals.grandTotalExistingCustomers ?? 0).toLocaleString() },
              ].map(({ label, value }) => (
                <Box key={label}>
                  <Typography fontSize={10} fontWeight={700} textTransform="uppercase" letterSpacing="0.06em" color="text.secondary">
                    {label}
                  </Typography>
                  <Typography fontSize={15} fontWeight={800} fontVariantNumeric="tabular-nums">
                    {value}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Box>

      {/* Two-col: top promoters table + goal achievement */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
          gap: 2.5,
          mb: 2.5,
        }}
      >
        {/* Detailed ranking table */}
        <Box
          sx={{
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            p: 2.5,
            bgcolor: dark ? alpha('#fff', 0.015) : alpha('#000', 0.01),
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1} mb={2}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: primary }} />
            <Typography fontWeight={700} fontSize={14}>
              Tabla de rendimiento
            </Typography>
          </Stack>
          {isLoading ? (
            <Stack spacing={1}>
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} height={40} sx={{ borderRadius: 1.5 }} />
              ))}
            </Stack>
          ) : (
            <TableContainer sx={{ maxHeight: 380, overflowY: 'auto' }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Promotora</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Registros</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Nuevos</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ganancias</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ranking.map((r, i) => (
                    <TableRow key={r.promoterId} hover sx={{ '&:last-child td': { border: 0 } }}>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography fontSize={11} fontWeight={700} color={i < 3 ? 'warning.main' : 'text.disabled'} sx={{ width: 18 }}>
                            {i + 1}
                          </Typography>
                          <Typography fontSize={13} fontWeight={600} noWrap sx={{ maxWidth: 140 }}>
                            {r.promoterName}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell align="right">
                        <Typography fontSize={13} fontWeight={700} fontVariantNumeric="tabular-nums">
                          {r.totalParticipations}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography fontSize={12} color="success.main" fontVariantNumeric="tabular-nums">
                          {r.newCustomers}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography fontSize={12} color="warning.main" fontVariantNumeric="tabular-nums">
                          ${r.totalEarnings.toFixed(2)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                  {ranking.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.disabled', fontSize: 13 }}>
                        Sin datos para el período
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>

        {/* Goal achievement */}
        <Box
          sx={{
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            p: 2.5,
            bgcolor: dark ? alpha('#fff', 0.015) : alpha('#000', 0.01),
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1} mb={2}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#10b981' }} />
            <Typography fontWeight={700} fontSize={14}>
              Promotoras que alcanzaron meta
            </Typography>
            <Chip
              size="small"
              label={`≥${GOAL_THRESHOLD} registros totales`}
              sx={{ height: 18, fontSize: 10, fontWeight: 600 }}
            />
          </Stack>
          <GoalTable promoters={goalReached} threshold={GOAL_THRESHOLD} loading={isLoading} />
        </Box>
      </Box>

      {/* All-time top promoters (from getAllPromoters) */}
      <Box
        sx={{
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          p: 2.5,
          bgcolor: dark ? alpha('#fff', 0.015) : alpha('#000', 0.01),
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1} mb={2.5}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#6366f1' }} />
          <Typography fontWeight={700} fontSize={14}>
            Top promotoras (histórico acumulado)
          </Typography>
          <Typography fontSize={12} color="text.disabled">
            Ordenado por registros totales
          </Typography>
        </Stack>
        {isLoading ? (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2,1fr)', sm: 'repeat(3,1fr)', md: 'repeat(4,1fr)', lg: 'repeat(5,1fr)' }, gap: 1.5 }}>
            {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} height={70} sx={{ borderRadius: 2 }} />)}
          </Box>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(2,1fr)', sm: 'repeat(3,1fr)', md: 'repeat(4,1fr)', lg: 'repeat(5,1fr)' },
              gap: 1.5,
            }}
          >
            {topPromoters.slice(0, 20).map((p, i) => (
              <Box
                key={p._id}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: i < 3 ? alpha('#f59e0b', dark ? 0.25 : 0.2) : 'divider',
                  bgcolor: i < 3 ? alpha('#f59e0b', dark ? 0.05 : 0.02) : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.25,
                  minWidth: 0,
                }}
              >
                <Avatar
                  src={p.profileImage}
                  sx={{
                    width: 34, height: 34, fontSize: 13, flexShrink: 0,
                    bgcolor: alpha(i < 3 ? '#f59e0b' : primary, 0.12),
                    color: i < 3 ? '#f59e0b' : primary,
                  }}
                >
                  {p.firstName?.[0]}
                </Avatar>
                <Box minWidth={0} flex={1}>
                  <Typography fontSize={12} fontWeight={700} noWrap>
                    {p.firstName} {p.lastName}
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    {i < 3 && <EmojiEventsRoundedIcon sx={{ fontSize: 11, color: '#f59e0b' }} />}
                    <Typography fontSize={11} color="text.secondary" fontVariantNumeric="tabular-nums">
                      {(p.totalRegistrations ?? 0).toLocaleString()} reg.
                    </Typography>
                  </Stack>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Container>
  );
}
