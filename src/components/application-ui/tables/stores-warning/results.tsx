'use client';

import { PromoterBrief, SortByOption, StoreInfo, StoresNearbyTableProps } from '@models/near-by';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import RefreshIcon from '@mui/icons-material/Refresh';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import StorefrontIcon from '@mui/icons-material/Storefront';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {
  alpha,
  Avatar,
  AvatarGroup,
  Box,
  Button,
  Card,
  Chip,
  IconButton,
  LinearProgress,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { getDistance } from '@utils/ui/near-by';
import React, { useMemo, useState } from 'react';
import PromotersDialog from '../../dialogs/near-by-promotor/PromotorInfo';
import QuickImpulseDialog from '../../dialogs/near-by-promotor/QuickImpulse';
import FiltersBar from './filters';
import { TableSkeletonRows } from './skelleton';

// ─── helpers ────────────────────────────────────────────────────────────────

const getClosestDistance = (promoters: PromoterBrief[]): number | null => {
  const ds = promoters
    .map(getDistance)
    .filter((d): d is number => typeof d === 'number');
  return ds.length > 0 ? Math.min(...ds) : null;
};

const DistanceBadge = ({ mi }: { mi: number | null }) => {
  if (mi === null) return <Typography variant="caption" color="text.disabled">—</Typography>;
  const color = mi < 5 ? 'success' : mi < 15 ? 'warning' : 'default';
  return (
    <Chip
      label={`${mi.toFixed(1)} mi`}
      color={color}
      size="small"
      sx={{ fontWeight: 700, fontSize: 11, height: 22 }}
    />
  );
};

const CustomerBar = ({
  count,
  max,
}: {
  count?: number;
  max: number;
}) => {
  const theme = useTheme();
  const pct = count != null && max > 0 ? Math.min(100, (count / max) * 100) : 0;
  const color =
    pct >= 80 ? theme.palette.error.main
    : pct >= 50 ? theme.palette.warning.main
    : theme.palette.success.main;

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="baseline" mb={0.3}>
        <Typography fontWeight={700} fontSize={13} sx={{ fontVariantNumeric: 'tabular-nums' }}>
          {count?.toLocaleString() ?? '—'}
        </Typography>
        <Typography variant="caption" color="text.disabled" sx={{ fontSize: 10 }}>
          /{max.toLocaleString()}
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={pct}
        sx={{
          height: 5,
          borderRadius: 3,
          bgcolor: alpha(color, 0.15),
          '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 3 },
        }}
      />
    </Box>
  );
};

// ─── Mobile card ─────────────────────────────────────────────────────────────

interface StoreCardProps {
  store: StoreInfo;
  promoters: PromoterBrief[];
  audienceMax: number;
  onView: () => void;
  onImpulse: () => void;
}

const StoreCard = ({ store, promoters, audienceMax, onView, onImpulse }: StoreCardProps) => {
  const theme = useTheme();
  const cannotImpulse = store.canImpulse === false;
  const closestDist = getClosestDistance(promoters);
  const top3 = [...promoters]
    .sort((a, b) => {
      const da = getDistance(a);
      const db = getDistance(b);
      if (typeof da === 'number' && typeof db === 'number') return da - db;
      return typeof da === 'number' ? -1 : 1;
    })
    .slice(0, 4);

  return (
    <Card
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        transition: 'box-shadow 0.18s',
        '&:hover': { boxShadow: theme.shadows[6] },
      }}
    >
      <Box sx={{ height: 3, bgcolor: cannotImpulse ? 'warning.main' : 'primary.main' }} />
      <Box p={2}>
        {/* Header */}
        <Stack direction="row" spacing={1.5} alignItems="flex-start" mb={1.5}>
          <Avatar
            src={store.imageUrl}
            variant="rounded"
            sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: 'action.hover', flexShrink: 0 }}
          >
            <StorefrontIcon fontSize="small" />
          </Avatar>
          <Box flex={1} minWidth={0}>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Typography fontWeight={700} fontSize={13} noWrap flex={1}>
                {store.name ?? 'Tienda'}
              </Typography>
              {cannotImpulse && (
                <Chip label="Activa" color="warning" size="small" sx={{ height: 20, fontSize: 10, fontWeight: 700 }} />
              )}
            </Stack>
            <Typography variant="caption" color="text.secondary" noWrap display="block" sx={{ fontSize: 11 }}>
              {[store.city, store.state, store.zipCode].filter(Boolean).join(', ') || '—'}
            </Typography>
          </Box>
        </Stack>

        {/* Metrics row */}
        <Stack direction="row" spacing={2} mb={1.5}>
          <Box flex={1}>
            <Typography variant="caption" color="text.disabled" display="block" mb={0.5}>
              Tráfico
            </Typography>
            <CustomerBar count={store.customerCount} max={audienceMax} />
          </Box>
          <Box>
            <Typography variant="caption" color="text.disabled" display="block" mb={0.5}>
              Distancia
            </Typography>
            <DistanceBadge mi={closestDist} />
          </Box>
        </Stack>

        {/* Promoters avatars */}
        <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
          <AvatarGroup
            max={4}
            sx={{
              '& .MuiAvatar-root': {
                width: 28,
                height: 28,
                fontSize: 11,
                border: `2px solid ${theme.palette.background.paper}`,
              },
            }}
          >
            {top3.map((p) => (
              <Tooltip key={p._id} title={`${p.firstName} ${p.lastName} · ${getDistance(p)?.toFixed(1) ?? '?'} mi`}>
                <Avatar src={p.profileImage || '/placeholder-profile.png'}>
                  {p.firstName?.[0]}
                </Avatar>
              </Tooltip>
            ))}
          </AvatarGroup>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            {promoters.length} promotora{promoters.length !== 1 ? 's' : ''}
          </Typography>
        </Stack>

        {/* Actions */}
        <Stack direction="row" spacing={1} pt={1} sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<VisibilityIcon sx={{ fontSize: 15 }} />}
            onClick={onView}
            sx={{ textTransform: 'none', borderRadius: 2, fontSize: 12, flex: 1 }}
          >
            Ver promotoras
          </Button>
          <Tooltip title={cannotImpulse ? 'Ya hay un turno activo en esta tienda' : ''}>
            <span style={{ flex: 1 }}>
              <Button
                variant="contained"
                size="small"
                fullWidth
                startIcon={<RocketLaunchIcon sx={{ fontSize: 15 }} />}
                disabled={cannotImpulse}
                onClick={onImpulse}
                sx={{
                  textTransform: 'none',
                  borderRadius: 2,
                  fontSize: 12,
                  background: cannotImpulse
                    ? undefined
                    : `linear-gradient(135deg, ${theme.palette.primary.main}, ${alpha(theme.palette.primary.dark, 0.85)})`,
                }}
              >
                Impulsar
              </Button>
            </span>
          </Tooltip>
        </Stack>
      </Box>
    </Card>
  );
};

// ─── Skeleton card ────────────────────────────────────────────────────────────

const SkeletonCard = () => (
  <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
    <Skeleton variant="rectangular" height={3} />
    <Box p={2}>
      <Stack direction="row" spacing={1.5} mb={1.5}>
        <Skeleton variant="rounded" width={48} height={48} sx={{ borderRadius: 2 }} />
        <Box flex={1}>
          <Skeleton width="60%" height={16} />
          <Skeleton width="80%" height={12} sx={{ mt: 0.5 }} />
        </Box>
      </Stack>
      <Skeleton height={36} sx={{ mb: 1.5 }} />
      <Stack direction="row" spacing={1} mb={1.5}>
        {[0, 1, 2].map((i) => <Skeleton key={i} variant="circular" width={28} height={28} />)}
      </Stack>
      <Stack direction="row" spacing={1}>
        <Skeleton variant="rounded" height={32} sx={{ flex: 1 }} />
        <Skeleton variant="rounded" height={32} sx={{ flex: 1 }} />
      </Stack>
    </Box>
  </Card>
);

// ─── Main component ───────────────────────────────────────────────────────────

const StoresNearbyTable: React.FC<StoresNearbyTableProps> = ({
  radiusKm,
  stores,
  total = stores?.length ?? 0,
  isLoading,
  isError,
  onRetry,
  page,
  rowsPerPage,
  onChangePage,
  onChangeRowsPerPage,
  searchTerm,
  onSearchTermChange,
  audienceMax,
  onAudienceMaxChange,
  radiusMi = 20,
  onChangeRadius,
  sortBy: externalSortBy,
  onSortChange,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [localSortBy, setLocalSortBy] = useState<SortByOption>('nearest');
  const sortBy = externalSortBy ?? localSortBy;
  const handleSort = (s: SortByOption) => {
    setLocalSortBy(s);
    onSortChange?.(s);
  };

  const audienceMaxNum = Number(audienceMax) > 0 ? Number(audienceMax) : 1500;

  const [promotersOf, setPromotersOf] = useState<{ store: StoreInfo; promoters: PromoterBrief[] } | null>(null);
  const [quickImpulse, setQuickImpulse] = useState<{ store: StoreInfo; promoters: PromoterBrief[] } | null>(null);

  const sorted = useMemo(() => {
    const withPromoters = (stores ?? []).filter((s) => (s.promoters?.length ?? 0) > 0);
    return [...withPromoters].sort((a, b) => {
      if (sortBy === 'promoters') return (b.promoters?.length ?? 0) - (a.promoters?.length ?? 0);
      if (sortBy === 'name') return (a.store.name ?? '').localeCompare(b.store.name ?? '');
      if (sortBy === 'customers') return (b.store.customerCount ?? -1) - (a.store.customerCount ?? -1);
      // nearest
      const minDist = (arr: PromoterBrief[]) =>
        Math.min(...arr.map(getDistance).filter((d): d is number => typeof d === 'number').concat([Infinity]));
      return minDist(a.promoters ?? []) - minDist(b.promoters ?? []);
    });
  }, [stores, sortBy]);

  const SortHeader = ({
    field,
    children,
  }: {
    field: SortByOption;
    children: React.ReactNode;
  }) => (
    <TableSortLabel
      active={sortBy === field}
      direction="asc"
      onClick={() => handleSort(field)}
      sx={{ fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap' }}
    >
      {children}
    </TableSortLabel>
  );

  return (
    <Box>
      <FiltersBar
        total={total}
        isLoading={isLoading}
        searchTerm={searchTerm}
        onSearchTermChange={onSearchTermChange}
        audienceMax={audienceMax}
        onAudienceMaxChange={onAudienceMaxChange}
        radiusMi={radiusMi}
        onChangeRadius={onChangeRadius}
        sortBy={sortBy}
        onSortChange={handleSort}
      />

      {/* ── Error ── */}
      {isError && (
        <Stack alignItems="center" py={8}>
          <Typography color="error" fontWeight={700} mb={1}>
            Error al cargar los datos.
          </Typography>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => onRetry?.()}>
            Reintentar
          </Button>
        </Stack>
      )}

      {/* ── Mobile cards ── */}
      {!isError && isMobile && (
        <Box>
          <Stack spacing={2}>
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
              : sorted.length === 0
              ? (
                <Box
                  sx={{
                    py: 10,
                    textAlign: 'center',
                    border: '1px dashed',
                    borderColor: 'divider',
                    borderRadius: 3,
                    color: 'text.secondary',
                  }}
                >
                  <StorefrontIcon sx={{ fontSize: 48, mb: 1, opacity: 0.25 }} />
                  <Typography>No se encontraron tiendas con promotoras cercanas.</Typography>
                </Box>
              )
              : sorted.map(({ store, promoters }) => (
                  <StoreCard
                    key={store.id}
                    store={store}
                    promoters={promoters}
                    audienceMax={audienceMaxNum}
                    onView={() => setPromotersOf({ store, promoters })}
                    onImpulse={() => setQuickImpulse({ store, promoters })}
                  />
                ))}
          </Stack>
          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(_, p) => onChangePage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => onChangeRowsPerPage(Number(e.target.value))}
            rowsPerPageOptions={[5, 10, 20, 25, 50]}
            sx={{ mt: 2 }}
          />
        </Box>
      )}

      {/* ── Desktop table ── */}
      {!isError && !isMobile && (
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
          }}
        >
          <Table>
            <TableHead>
              <TableRow
                sx={{
                  bgcolor: 'action.hover',
                  '& th': {
                    fontWeight: 700,
                    fontSize: 12,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    color: 'text.secondary',
                    py: 1.5,
                  },
                }}
              >
                <TableCell sx={{ pl: 2.5 }}>
                  <SortHeader field="name">Tienda</SortHeader>
                </TableCell>
                <TableCell width={160}>
                  <SortHeader field="customers">Tráfico</SortHeader>
                </TableCell>
                <TableCell width={180}>
                  <SortHeader field="promoters">Promotoras</SortHeader>
                </TableCell>
                <TableCell width={140}>
                  <SortHeader field="nearest">Distancia</SortHeader>
                </TableCell>
                <TableCell align="right" width={220} sx={{ pr: 2.5 }}>
                  Acciones
                </TableCell>
              </TableRow>
            </TableHead>

            {isLoading ? (
              <TableSkeletonRows rows={rowsPerPage || 8} />
            ) : (
              <TableBody>
                {sorted.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Stack alignItems="center" py={8} spacing={1}>
                        <StorefrontIcon sx={{ fontSize: 48, opacity: 0.2 }} />
                        <Typography color="text.secondary">
                          No se encontraron tiendas con promotoras cercanas.
                        </Typography>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ) : (
                  sorted.map(({ store, promoters }) => {
                    const cannotImpulse = store.canImpulse === false;
                    const closestDist = getClosestDistance(promoters);
                    const top4 = [...promoters]
                      .sort((a, b) => {
                        const da = getDistance(a);
                        const db = getDistance(b);
                        if (typeof da === 'number' && typeof db === 'number') return da - db;
                        return typeof da === 'number' ? -1 : 1;
                      })
                      .slice(0, 4);

                    return (
                      <TableRow
                        key={store.id}
                        hover
                        sx={{
                          '& td': { py: 1.5 },
                          '&:last-child td': { borderBottom: 0 },
                          transition: 'background 0.15s',
                        }}
                      >
                        {/* Store */}
                        <TableCell sx={{ pl: 2.5 }}>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Avatar
                              src={store.imageUrl}
                              variant="rounded"
                              sx={{
                                width: 44,
                                height: 44,
                                borderRadius: 2,
                                bgcolor: 'action.hover',
                                flexShrink: 0,
                                border: '1px solid',
                                borderColor: 'divider',
                              }}
                            >
                              <StorefrontIcon sx={{ fontSize: 20 }} />
                            </Avatar>
                            <Box minWidth={0}>
                              <Stack direction="row" spacing={0.75} alignItems="center">
                                <Typography fontWeight={600} fontSize={13} noWrap>
                                  {store.name ?? 'Tienda sin nombre'}
                                </Typography>
                                {cannotImpulse && (
                                  <Chip
                                    label="Activa"
                                    color="warning"
                                    size="small"
                                    sx={{ height: 18, fontSize: 10, fontWeight: 700, flexShrink: 0 }}
                                  />
                                )}
                              </Stack>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                noWrap
                                display="block"
                                sx={{ fontSize: 11 }}
                              >
                                {[store.city, store.state, store.zipCode]
                                  .filter(Boolean)
                                  .join(', ') || '—'}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>

                        {/* Traffic */}
                        <TableCell width={160}>
                          <CustomerBar count={store.customerCount} max={audienceMaxNum} />
                        </TableCell>

                        {/* Promotoras */}
                        <TableCell width={180}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <AvatarGroup
                              max={4}
                              sx={{
                                '& .MuiAvatar-root': {
                                  width: 30,
                                  height: 30,
                                  fontSize: 11,
                                  border: `2px solid ${theme.palette.background.paper}`,
                                },
                              }}
                            >
                              {top4.map((p) => (
                                <Tooltip
                                  key={p._id}
                                  title={`${p.firstName ?? ''} ${p.lastName ?? ''} · ${
                                    getDistance(p)?.toFixed(1) ?? '?'
                                  } mi`}
                                >
                                  <Avatar src={p.profileImage || '/placeholder-profile.png'}>
                                    {p.firstName?.[0]}
                                  </Avatar>
                                </Tooltip>
                              ))}
                            </AvatarGroup>
                            <Box
                              sx={{
                                px: 1,
                                py: 0.25,
                                borderRadius: 1.5,
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                              }}
                            >
                              <Typography
                                variant="caption"
                                fontWeight={700}
                                sx={{ color: 'primary.main', fontSize: 11 }}
                              >
                                {promoters.length}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>

                        {/* Distance */}
                        <TableCell width={140}>
                          <DistanceBadge mi={closestDist} />
                        </TableCell>

                        {/* Actions */}
                        <TableCell align="right" sx={{ pr: 2.5 }}>
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Tooltip title="Ver promotoras cercanas">
                              <IconButton
                                size="small"
                                onClick={() => setPromotersOf({ store, promoters })}
                                sx={{
                                  border: '1px solid',
                                  borderColor: 'divider',
                                  borderRadius: 2,
                                  '&:hover': { borderColor: 'primary.main' },
                                }}
                              >
                                <PeopleAltIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>

                            <Tooltip
                              title={
                                cannotImpulse
                                  ? 'Ya hay un turno activo en esta tienda'
                                  : promoters.length === 0
                                  ? 'No hay promotoras cercanas'
                                  : 'Asignar turno ahora'
                              }
                            >
                              <span>
                                <Button
                                  size="small"
                                  variant="contained"
                                  startIcon={<RocketLaunchIcon sx={{ fontSize: 14 }} />}
                                  disabled={cannotImpulse}
                                  onClick={() => setQuickImpulse({ store, promoters })}
                                  disableElevation
                                  sx={{
                                    textTransform: 'none',
                                    borderRadius: 2,
                                    fontSize: 12,
                                    fontWeight: 600,
                                    px: 1.5,
                                    background: cannotImpulse
                                      ? undefined
                                      : `linear-gradient(135deg, ${theme.palette.primary.main}, ${alpha(
                                          theme.palette.primary.dark,
                                          0.85
                                        )})`,
                                  }}
                                >
                                  Impulsar
                                </Button>
                              </span>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            )}
          </Table>

          <Box
            sx={{
              borderTop: '1px solid',
              borderColor: 'divider',
              bgcolor: 'action.hover',
            }}
          >
            <TablePagination
              component="div"
              count={total}
              page={page}
              onPageChange={(_, p) => onChangePage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => onChangeRowsPerPage(Number(e.target.value))}
              rowsPerPageOptions={[5, 10, 20, 25, 50]}
            />
          </Box>
        </TableContainer>
      )}

      {/* Dialogs */}
      <PromotersDialog
        open={Boolean(promotersOf)}
        onClose={() => setPromotersOf(null)}
        store={promotersOf?.store}
        promoters={promotersOf?.promoters}
        radiusKm={radiusKm}
      />

      {quickImpulse && (
        <QuickImpulseDialog
          open
          onClose={() => setQuickImpulse(null)}
          store={quickImpulse.store}
          promoters={quickImpulse.promoters}
        />
      )}
    </Box>
  );
};

export default StoresNearbyTable;
