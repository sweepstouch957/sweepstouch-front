'use client';

import { PromoterBrief, StoreInfo, StoresNearbyTableProps } from '@models/near-by';
import RefreshIcon from '@mui/icons-material/Refresh';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {
  Avatar,
  Box,
  Button,

  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { getDistance } from '@utils/ui/near-by';
import React, { useMemo, useState } from 'react';
import PromotersDialog from '../../dialogs/near-by-promotor/PromotorInfo';
import QuickImpulseDialog from '../../dialogs/near-by-promotor/QuickImpulse';
import FiltersBar from './filters';
import { FiltersBarSkeleton, TableSkeletonRows } from './skelleton';

// ===== Tabla principal =====
const StoresNearbyTable: React.FC<StoresNearbyTableProps> = ({
  // data
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
}) => {
  const [sortBy, setSortBy] = useState<'nearest' | 'promoters' | 'name' | 'customers'>('nearest');
  const [promotersOf, setPromotersOf] = useState<{
    store: StoreInfo;
    promoters: PromoterBrief[];
  } | null>(null);
  const [quickImpulse, setQuickImpulse] = useState<{
    store: StoreInfo;
    promoters: PromoterBrief[];
  } | null>(null);

  const filtered = useMemo(() => {
    const onlyWithPromoters = (stores ?? []).filter((s) => (s.promoters?.length ?? 0) > 0);

    const sorted = [...onlyWithPromoters].sort((a, b) => {
      if (sortBy === 'promoters') return (b.promoters?.length ?? 0) - (a.promoters?.length ?? 0);
      if (sortBy === 'name') return (a.store.name ?? '').localeCompare(b.store.name ?? '');
      if (sortBy === 'customers')
        return (b.store.customerCount ?? -1) - (a.store.customerCount ?? -1);

      // nearest
      const mind = (arr: PromoterBrief[]) =>
        Math.min(
          ...arr
            .map(getDistance)
            .filter((d): d is number => typeof d === 'number')
            .concat([Number.POSITIVE_INFINITY])
        );
      const da = mind(a.promoters ?? []);
      const db = mind(b.promoters ?? []);
      return da - db;
    });

    return sorted;
  }, [stores, sortBy]);

  return (
    <Box>
      {/* Filtros (UI controlada; el search ya lo usa el backend) */}
      {isLoading ? (
        <FiltersBarSkeleton />
      ) : (
        <FiltersBar
          total={total}
          isLoading={isLoading}
          searchTerm={searchTerm}
          onSearchTermChange={onSearchTermChange}
          audienceMax={audienceMax}
          onAudienceMaxChange={onAudienceMaxChange}
        />
      )}

      {/* Tabla */}
      {isLoading ? (
        <TableContainer
          component={Paper}
          sx={{ borderRadius: 4 }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Tienda</TableCell>
                <TableCell>Clientes</TableCell>
                <TableCell>Promotoras cercanas</TableCell>
                <TableCell>Más cercanas</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableSkeletonRows rows={rowsPerPage || 6} />
          </Table>
        </TableContainer>
      ) : isError ? (
        <Stack
          alignItems="center"
          py={6}
        >
          <Typography
            color="error"
            fontWeight={700}
          >
            Error al cargar los datos.
          </Typography>
          <Button
            startIcon={<RefreshIcon />}
            sx={{ mt: 1 }}
            onClick={() => onRetry?.()}
          >
            Reintentar
          </Button>
        </Stack>
      ) : (
        <TableContainer
          component={Paper}
          sx={{ borderRadius: 4 }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Tienda</TableCell>
                <TableCell>Clientes</TableCell>
                <TableCell>Promotoras cercanas</TableCell>
                <TableCell>Más cercanas</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filtered.map(({ store, promoters }) => {
                const top3 = [...promoters]
                  .sort((a, b) => {
                    const da = getDistance(a);
                    const db = getDistance(b);
                    if (typeof da === 'number' && typeof db === 'number') return da - db;
                    if (typeof da === 'number') return -1;
                    if (typeof db === 'number') return 1;
                    return (a.firstName ?? '').localeCompare(b.firstName ?? '');
                  })
                  .slice(0, 3);

                const cannotImpulse = store.canImpulse === false;

                return (
                  <React.Fragment key={store.id}>
                    <TableRow hover>
                      <TableCell>
                        <Stack
                          direction="row"
                          spacing={2}
                          alignItems="center"
                        >
                          <Avatar
                            src={store.imageUrl}
                            variant="rounded"
                            sx={{ width: 48, height: 48, borderRadius: 2 }}
                          />
                          <Box>
                            <Typography
                              fontWeight={500}
                              sx={{ letterSpacing: 0.2 }}
                            >
                              {store.name ?? 'Tienda sin nombre'}
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                            >
                              {[store.city, store.state, store.zipCode]
                                .filter(Boolean)
                                .join(', ') || '—'}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>

                      <TableCell width={140}>
                        <Typography
                          variant="body2"
                          sx={{ mb: 0.5 }}
                          fontWeight={600}
                        >
                          {store.customerCount?.toLocaleString?.() ?? '—'}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography
                          component="span"
                          fontWeight={400}
                          color="text.secondary"
                        >
                          {promoters.length}
                        </Typography>
                      </TableCell>

                      <TableCell width={360}>
                        {top3.length > 0 ? (
                          <Stack
                            direction="row"
                            spacing={1.5}
                            alignItems="center"
                          >
                            <Stack
                              spacing={0.5}
                              sx={{ minWidth: 0 }}
                            >
                              {top3.map((p) => (
                                <Stack
                                  key={p._id}
                                  direction="row"
                                  spacing={1}
                                  alignItems="center"
                                >
                                  <Avatar
                                    src={p.profileImage || '/placeholder-profile.png'}
                                    sx={{ width: 28, height: 28 }}
                                  />
                                  <Typography
                                    variant="body2"
                                    fontWeight={400}
                                    noWrap
                                  >
                                    {p.firstName} {p.lastName},{' '}
                                    <Typography
                                      component="span"
                                      fontWeight={200}
                                      fontSize={'0.7rem'}
                                      color="primary.main"
                                    >
                                      {getDistance(p)?.toFixed(1) ?? '—'} mi
                                    </Typography>
                                  </Typography>
                                </Stack>
                              ))}
                            </Stack>
                          </Stack>
                        ) : (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                          >
                            —
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell align="right">
                        <Stack
                          direction="row"
                          spacing={1}
                          justifyContent="flex-end"
                        >

                          <Tooltip title="Ver promotoras">
                            <IconButton onClick={() => setPromotersOf({ store, promoters })}>
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>

                          <Tooltip
                            title={
                              cannotImpulse
                                ? 'Ya hay un turno activo'
                                : promoters.length
                                  ? 'Impulsar'
                                  : 'No hay promotoras cercanas'
                            }
                          >
                            <span>
                              <Button
                                size="small"
                                variant="contained"
                                startIcon={<RocketLaunchIcon />}
                                disabled={cannotImpulse /* o !promoters.length */}
                                onClick={() => setQuickImpulse({ store, promoters })}
                                sx={{ textTransform: 'none' }}
                              >
                                Impulsar
                              </Button>
                            </span>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>

          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(_, p) => onChangePage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => onChangeRowsPerPage(Number(e.target.value))}
            rowsPerPageOptions={[5, 10, 20, 25, 50]}
          />
        </TableContainer>
      )}

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
