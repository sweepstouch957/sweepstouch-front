import { sweepstakesClient } from '@/services/sweepstakes.service';
import MoreVertTwoToneIcon from '@mui/icons-material/MoreVertTwoTone';
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
  useTheme,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TableHeadWrapper, TableRowDivider, TableWrapper } from 'src/components/base/styles/table';

function Component() {
  const { t } = useTranslation();
  const theme = useTheme();

  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);

  const { data, isLoading } = useQuery({
    queryKey: ['store-sweepstakes', page, limit],
    queryFn: () =>
      sweepstakesClient.getStoresBySweepstkesFiltered(
        process.env.NEXT_PUBLIC_SWEEPTAKE_LABOR_DAY!,
        {
          page: page + 1,
          limit,
        }
      ),
    staleTime: 1000 * 60 * 5,
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
    <Card>
      <Box
        px={3}
        py={2}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
      >
        <Box>
          <Typography variant="h4">{t('Sweepstake Stores')}</Typography>
          <Typography
            variant="subtitle2"
            color="text.secondary"
          >
            {t('List of all stores with participation metrics')}
          </Typography>
        </Box>
        <IconButton color="secondary">
          <MoreVertTwoToneIcon />
        </IconButton>
      </Box>
      <Divider />
      <Box
        px={3}
        pb={3}
      >
        <TableContainer>
          <TableWrapper>
            <TableHeadWrapper>
              <TableRow>
                <TableCell>{t('Store')}</TableCell>
                <TableCell>{t('Type')}</TableCell>
                <TableCell>{t('Customers')}</TableCell>
                <TableCell>{t('Participations')}</TableCell>
              </TableRow>
            </TableHeadWrapper>
            <TableBody>
              {isLoading
                ? Array.from({ length: limit }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Box
                          display="flex"
                          alignItems="center"
                        >
                          <Skeleton
                            variant="circular"
                            width={40}
                            height={40}
                            sx={{ mr: 1 }}
                          />
                          <Skeleton
                            variant="text"
                            width={180}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Skeleton
                          variant="text"
                          width={60}
                        />
                      </TableCell>
                      <TableCell>
                        <Skeleton
                          variant="text"
                          width={40}
                        />
                      </TableCell>
                      <TableCell>
                        <Skeleton
                          variant="text"
                          width={40}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                : stores.map((store) => (
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
                              sx={{ mr: 1 }}
                            />
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
                          />
                        </TableCell>
                        <TableCell>{store.storeCustomerCount}</TableCell>
                        <TableCell>{store.totalParticipations}</TableCell>
                      </TableRow>
                      <TableRowDivider />
                    </>
                  ))}
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
          />
        </Box>
      </Box>
    </Card>
  );
}

export default Component;
