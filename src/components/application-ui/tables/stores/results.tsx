import { Store } from '@/services/store.service';
import { DeleteTwoTone as DeleteIcon, LaunchTwoTone as LaunchIcon } from '@mui/icons-material';
import {
  Box,
  Card,
  Checkbox,
  CircularProgress,
  IconButton,
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
import Link from 'next/link';
import { ChangeEvent, FC, useState } from 'react';
import { useTranslation } from 'react-i18next';
import StoreFilter from './filter';

interface ResultsProps {
  stores: Store[];
  page: number;
  limit: number;
  total: number;

  // 🔄 Reemplazamos "type" por "status"
  status: 'all' | 'active' | 'inactive';
  sortBy: string;
  order: string;
  search: string;

  onPageChange: (page: number) => void;
  onLimitChange: (e: ChangeEvent<HTMLInputElement>) => void;

  onSearchChange: (query: string) => void;
  onStatusChange: (status: 'all' | 'active' | 'inactive') => void;
  onSortChange: (sortBy: string) => void;
  onOrderChange: (order: string) => void;

  loading?: boolean;
  error?: string | null;
}

const LogoImg = ({ src }: { src: string }) => (
  <Box
    component="img"
    src={src}
    alt="store logo"
    sx={{ width: 48, height: 48, borderRadius: 1 }}
  />
);

const Results: FC<ResultsProps> = ({
  stores,
  page,
  limit,
  total,

  // props de filtros
  status,
  sortBy,
  order,
  search,

  // handlers
  onPageChange,
  onLimitChange,
  onSearchChange,
  onStatusChange,
  onSortChange,
  onOrderChange,
  loading,
  error,
}) => {
  const [selectedItems, setSelected] = useState<string[]>([]);
  const { t } = useTranslation();

  const handleSelectAll = (event: ChangeEvent<HTMLInputElement>): void => {
    setSelected(event.target.checked ? stores.map((s) => s.id) : []);
  };

  const handleSelectOne = (_: any, id: string): void => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  };

  const selectedAll = selectedItems.length === stores.length;
  const selectedSome = selectedItems.length > 0 && selectedItems.length < stores.length;

  return (
    <>
      <StoreFilter
        search={search}
        handleSearchChange={handleSearchChange}
        // 🔄 ahora usamos status en vez de type
        status={status}
        onStatusChange={onStatusChange}
        sortBy={sortBy}
        onSortChange={onSortChange}
        order={order}
        onOrderChange={onOrderChange}
        t={t}
      />

      {loading ? (
        <CircularProgress sx={{ width: '50px', height: '50px' }} />
      ) : error ? (
        <Typography
          align="center"
          color="error"
          py={5}
        >
          {t('Error fetching stores')}: {error}
        </Typography>
      ) : stores.length === 0 ? (
        <Typography
          align="center"
          py={6}
          variant="h3"
          color="text.secondary"
        >
          {t('No stores found')}
        </Typography>
      ) : (
        <>
          <Card>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedAll}
                        indeterminate={selectedSome}
                        onChange={handleSelectAll}
                      />
                    </TableCell>
                    <TableCell>{t('Brand')}</TableCell>
                    <TableCell>{t('Store name')}</TableCell>
                    <TableCell>{t('Address')}</TableCell>
                    <TableCell>{t('Customers')}</TableCell>
                    <TableCell align="center">{t('Status')}</TableCell>
                    <TableCell align="center">{t('Actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stores.map((store) => {
                    const isSelected = selectedItems.includes(store.id);
                    return (
                      <TableRow
                        hover
                        key={store.id}
                        selected={isSelected}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={isSelected}
                            onChange={(e) => handleSelectOne(e, store.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <LogoImg src={store.image} />
                        </TableCell>
                        <TableCell>
                          <Typography variant="h5">{store.name}</Typography>
                        </TableCell>
                        <TableCell>{store.address}</TableCell>
                        <TableCell>{store.customerCount}</TableCell>

                        <TableCell align="center">
                          <Typography color={store.active ? 'success.main' : 'error.main'}>
                            {store.active ? t('Active') : t('Inactive')}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip
                            title={t('View')}
                            arrow
                          >
                            <Link
                              href={`/admin/management/stores/edit/${store.id}`}
                              passHref
                            >
                              <IconButton color="primary">
                                <LaunchIcon fontSize="small" />
                              </IconButton>
                            </Link>
                          </Tooltip>
                          <Tooltip
                            title={t('Delete')}
                            arrow
                          >
                            <IconButton color="secondary">
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>

          <Box p={2}>
            <TablePagination
              component="div"
              count={total}
              page={page}
              rowsPerPage={limit}
              onPageChange={(_, newPage) => onPageChange(newPage)}
              onRowsPerPageChange={onLimitChange}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </Box>
        </>
      )}
    </>
  );
};

export default Results;
