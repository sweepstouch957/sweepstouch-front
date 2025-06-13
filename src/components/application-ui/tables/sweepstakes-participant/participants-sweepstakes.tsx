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
  TableBody,
  TableCell,
  TableContainer,
  TablePagination,
  TableRow,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TableHeadWrapper, TableRowDivider, TableWrapper } from 'src/components/base/styles/table';

interface Props {
  sweepstakeId: string;
}

function SweepstakeStoresTable({ sweepstakeId }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);

  const { data, isLoading } = useQuery({
    queryKey: ['store-sweepstakes', sweepstakeId, page, limit],
    queryFn: () =>
      sweepstakesClient.getStoresBySweepstkesFiltered(sweepstakeId, {
        page: page + 1,
        limit,
      }),
    staleTime: 1000 * 60 * 5,
    enabled: !!sweepstakeId,
  });

  const stores = data?.data || [];
  const total = data?.total || 0;

  const handlePageChange = (_: any, newPage: number) => {
    setPage(newPage);
  };

  const handleLimitChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLimit(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Card sx={{ borderRadius: 6 }}>
      <Box
        px={isMobile ? 2 : 3}
        py={isMobile ? 1.5 : 2}
        display="flex"
        flexDirection={isMobile ? 'column' : 'row'}
        alignItems={isMobile ? 'flex-start' : 'center'}
        justifyContent="space-between"
        gap={isMobile ? 1 : 0}
      >
        <Box>
          <Typography
            variant={isMobile ? 'h5' : 'h4'}
            fontWeight={700}
          >
            {t('Sweepstake Stores')}
          </Typography>
          <Typography
            variant="subtitle2"
            color="text.secondary"
            fontSize={isMobile ? 14 : 16}
          >
            {t('List of all stores with participation metrics')}
          </Typography>
        </Box>
        <IconButton
          color="secondary"
          sx={{ alignSelf: isMobile ? 'flex-end' : 'center' }}
        >
          <MoreVertTwoToneIcon />
        </IconButton>
      </Box>
      <Divider />
      <Box
        px={isMobile ? 1 : 3}
        pb={isMobile ? 1 : 3}
        width="100%"
        sx={{
          overflowX: isMobile ? 'auto' : 'unset',
        }}
      >
        <TableContainer sx={{ minWidth: 320 }}>
          <TableWrapper>
            {!isMobile && (
              <TableHeadWrapper>
                <TableRow>
                  <TableCell>{t('Store')}</TableCell>
                  <TableCell>{t('Type')}</TableCell>
                  <TableCell>{t('Customers')}</TableCell>
                  <TableCell>{t('Participations')}</TableCell>
                </TableRow>
              </TableHeadWrapper>
            )}
            <TableBody>
              {isLoading
                ? Array.from({ length: limit }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={isMobile ? 1 : 4}>
                        <Box
                          display="flex"
                          alignItems="center"
                          gap={2}
                          p={2}
                          sx={{
                            bgcolor: theme.palette.action.hover,
                            borderRadius: 4,
                          }}
                        >
                          <Skeleton
                            variant="circular"
                            width={40}
                            height={40}
                          />
                          <Box flex={1}>
                            <Skeleton
                              variant="text"
                              width="60%"
                            />
                            <Skeleton
                              variant="text"
                              width="30%"
                            />
                          </Box>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                : stores.map((store) =>
                    isMobile ? (
                      <TableRow
                        hover
                        key={store.storeId}
                      >
                        <TableCell
                          colSpan={4}
                          sx={{ p: 0, border: 0 }}
                        >
                          <Card
                            elevation={3}
                            sx={{
                              display: 'flex',
                              flexDirection: 'row',
                              alignItems: 'center',
                              p: 1.5,
                              mb: 2,
                              borderRadius: 4,
                              background: theme.palette.mode === 'dark' ? '#181A1B' : '#fafbfc',
                              boxShadow: '0 2px 16px 0 #0002',
                            }}
                          >
                            <Avatar
                              src={store.storeImage}
                              sx={{
                                width: 52,
                                height: 52,
                                mr: 2,
                                border: `2.5px solid ${theme.palette.primary.light}`,
                                boxShadow: 1,
                                bgcolor: theme.palette.grey[200],
                              }}
                            >
                              {!store.storeImage && <StorefrontIcon fontSize="medium" />}
                            </Avatar>
                            <Box
                              flex={1}
                              minWidth={0}
                            >
                              <Typography
                                variant="subtitle1"
                                fontWeight={700}
                                noWrap
                                sx={{ fontSize: 17, color: theme.palette.text.primary }}
                              >
                                {store.storeName}
                              </Typography>
                              <Box
                                mt={0.5}
                                display="flex"
                                gap={1}
                                alignItems="center"
                                flexWrap="wrap"
                              >
                                <Chip
                                  size="small"
                                  label={store.storeType || 'N/A'}
                                  variant="outlined"
                                  sx={{
                                    fontWeight: 600,
                                    px: 1.3,
                                    background:
                                      theme.palette.mode === 'dark' ? '#232323' : '#f3f3f3',
                                    color: theme.palette.text.secondary,
                                  }}
                                />
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ ml: 0.3, fontWeight: 400 }}
                                >
                                  Clientes: <b>{store.storeCustomerCount}</b>
                                </Typography>
                                <Chip
                                  label={
                                    <span>
                                      <b style={{ color: theme.palette.primary.main }}>
                                        {store.totalParticipations}
                                      </b>{' '}
                                      participaciones
                                    </span>
                                  }
                                  size="small"
                                  variant="outlined"
                                  sx={{
                                    borderColor: theme.palette.primary.light,
                                    color: theme.palette.primary.dark,
                                    fontWeight: 700,
                                    ml: 0.5,
                                    background:
                                      theme.palette.mode === 'dark' ? '#232323' : '#eef8ff',
                                  }}
                                />
                              </Box>
                            </Box>
                          </Card>
                        </TableCell>
                      </TableRow>
                    ) : (
                      <>
                        <TableRow
                          hover
                          key={store.storeId}
                        >
                          <TableCell>
                            <Box
                              display="flex"
                              alignItems="center"
                            >
                              <Avatar
                                src={store.storeImage}
                                sx={{ mr: 1, width: 40, height: 40 }}
                              >
                                {!store.storeImage && <StorefrontIcon fontSize="small" />}
                              </Avatar>
                              <Typography
                                variant="subtitle2"
                                noWrap
                              >
                                {store.storeName}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={store.storeType || 'N/A'}
                              variant="outlined"
                              sx={{ fontWeight: 600 }}
                            />
                          </TableCell>
                          <TableCell>{store.storeCustomerCount}</TableCell>
                          <TableCell>
                            <Typography
                              fontWeight={700}
                              color="primary"
                            >
                              {store.totalParticipations}
                            </Typography>
                          </TableCell>
                        </TableRow>
                        <TableRowDivider />
                      </>
                    )
                  )}
            </TableBody>
          </TableWrapper>
        </TableContainer>

        <Box mt={2}>
          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={handlePageChange}
            rowsPerPage={limit}
            onRowsPerPageChange={handleLimitChange}
            rowsPerPageOptions={[5, 10, 25]}
            labelRowsPerPage={isMobile ? t('Rows') : t('Rows per page')}

          />
        </Box>
      </Box>
    </Card>
  );
}

export default SweepstakeStoresTable;
