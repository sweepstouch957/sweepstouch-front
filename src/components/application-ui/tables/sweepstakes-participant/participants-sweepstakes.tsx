'use client';

import { sweepstakesClient } from '@/services/sweepstakes.service';
import MoreVertTwoToneIcon from '@mui/icons-material/MoreVertTwoTone';
import StorefrontIcon from '@mui/icons-material/Storefront';
import {
  Avatar,
  Box,
  Card,
  Chip,
  Divider,
  IconButton,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Typography,
  useMediaQuery,
  useTheme,
  Stack,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  sweepstakeId: string;
}

function SweepstakeStoresTable({ sweepstakeId }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['store-sweepstakes', sweepstakeId, page, limit, sortOrder],
    queryFn: () =>
      sweepstakesClient.getStoresBySweepstkesFiltered(sweepstakeId, {
        page: page + 1,
        limit,
        sortBy: 'participants',
        sortOrder,
      }),
    staleTime: 1000 * 60 * 5,
    enabled: !!sweepstakeId,
  });

  const stores = data?.data || [];
  const total = data?.total || 0;

  const handlePageChange = (_: any, newPage: number) => setPage(newPage);
  const handleLimitChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLimit(parseInt(event.target.value, 10));
    setPage(0);
  };
  const handleSort = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
    setPage(0);
  };

  const showSkeletons = isLoading || (isFetching && stores.length === 0);

  return (
    <Card sx={{ borderRadius: 4, overflow: 'hidden' }} elevation={0} variant="outlined">
      <Box
        px={{ xs: 2, sm: 3 }}
        py={{ xs: 2, sm: 3 }}
        display="flex"
        flexDirection={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
        gap={{ xs: 2, sm: 0 }}
        bgcolor={theme.palette.mode === 'light' ? '#f8fafc' : '#1e1e1e'}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            {t('Sweepstake Stores')}
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            {t('List of all stores with participation metrics')}
          </Typography>
        </Box>
        <IconButton color="secondary" size="small" sx={{ alignSelf: { xs: 'flex-end', sm: 'center' } }}>
          <MoreVertTwoToneIcon />
        </IconButton>
      </Box>
      <Divider />
      <Box width="100%">
        <TableContainer sx={{ minWidth: 320 }}>
          <Table size={isMobile ? 'small' : 'medium'}>
            {!isMobile && (
              <TableHead sx={{ bgcolor: theme.palette.mode === 'light' ? '#ffffff' : '#2d2d2d' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, py: 2, color: 'text.secondary' }}>{t('Store')}</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>{t('Type')}</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>{t('Customers')}</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>
                    <TableSortLabel
                      active={true}
                      direction={sortOrder}
                      onClick={handleSort}
                    >
                      {t('Participations')}
                    </TableSortLabel>
                  </TableCell>
                </TableRow>
              </TableHead>
            )}
            <TableBody>
              {showSkeletons ? (
                Array.from({ length: limit }).map((_, i) => (
                  <TableRow key={i}>
                    {isMobile ? (
                      <TableCell>
                        <Stack direction="row" spacing={2} p={1} alignItems="center">
                          <Skeleton variant="rounded" width={52} height={52} />
                          <Stack flex={1} spacing={1}>
                            <Skeleton variant="text" width="60%" />
                            <Skeleton variant="text" width="40%" />
                          </Stack>
                        </Stack>
                      </TableCell>
                    ) : (
                      <>
                        <TableCell>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Skeleton variant="rounded" width={40} height={40} />
                            <Skeleton variant="text" width={120} />
                          </Stack>
                        </TableCell>
                        <TableCell><Skeleton variant="text" width={60} /></TableCell>
                        <TableCell><Skeleton variant="text" width={40} /></TableCell>
                        <TableCell><Skeleton variant="text" width={60} /></TableCell>
                      </>
                    )}
                  </TableRow>
                ))
              ) : stores.map((store: any) =>
                isMobile ? (
                  <TableRow hover key={store.storeId}>
                    <TableCell sx={{ p: 2 }}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar
                          src={store.storeImage}
                          variant="rounded"
                          sx={{
                            width: 52,
                            height: 52,
                            border: `1px solid ${theme.palette.divider}`,
                            bgcolor: theme.palette.action.hover,
                            color: 'text.secondary',
                            borderRadius: 2
                          }}
                        >
                          {!store.storeImage && <StorefrontIcon fontSize="medium" />}
                        </Avatar>
                        <Box flex={1}>
                          <Typography variant="body1" fontWeight={700} noWrap>
                            {store.storeName}
                          </Typography>
                          <Stack direction="row" mt={0.5} gap={1} flexWrap="wrap" alignItems="center">
                            <Chip
                              size="small"
                              label={store.storeType || 'N/A'}
                              sx={{
                                fontWeight: 500,
                                fontSize: '0.7rem',
                                color: 'text.secondary',
                                bgcolor: 'action.hover'
                              }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              Customers: {store.storeCustomerCount}
                            </Typography>
                            <Chip
                              label={`${store.totalParticipations} parts`}
                              size="small"
                              color="primary"
                              variant="outlined"
                              sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                            />
                          </Stack>
                        </Box>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ) : (
                  <TableRow hover key={store.storeId}>
                    <TableCell>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar
                          src={store.storeImage}
                          variant="rounded"
                          sx={{
                            width: 44,
                            height: 44,
                            bgcolor: 'action.hover',
                            color: 'text.secondary',
                            borderRadius: 2
                          }}
                        >
                          {!store.storeImage && <StorefrontIcon fontSize="small" />}
                        </Avatar>
                        <Typography variant="subtitle2" fontWeight={600} noWrap>
                          {store.storeName}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={store.storeType || 'N/A'}
                        size="small"
                        sx={{ fontWeight: 500, bgcolor: 'action.hover', color: 'text.secondary' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>{store.storeCustomerCount}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight={700} color="primary.main">
                        {store.totalParticipations}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {(!showSkeletons && stores.length > 0) && (
          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={handlePageChange}
            rowsPerPage={limit}
            onRowsPerPageChange={handleLimitChange}
            rowsPerPageOptions={[5, 10, 25]}
            labelRowsPerPage={isMobile ? t('Rows') : t('Rows per page')}
            sx={{ borderTop: `1px solid ${theme.palette.divider}` }}
          />
        )}
      </Box>
    </Card>
  );
}

export default SweepstakeStoresTable;
