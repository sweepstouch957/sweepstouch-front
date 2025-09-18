'use client';

import { Store } from '@/services/store.service';
import {
  DeleteTwoTone as DeleteIcon,
  RocketLaunchTwoTone as ImpulseIcon,
  LaunchTwoTone as LaunchIcon,
} from '@mui/icons-material';
import {
  Box,
  Card,
  Checkbox,
  IconButton,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel, // 👈 importa esto
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

  status: 'all' | 'active' | 'inactive';
  sortBy: 'customerCount' | 'name' | 'active' | string; // 👈 ampliado
  order: 'asc' | 'desc' | string;
  search: string;

  onPageChange: (page: number) => void;
  onLimitChange: (e: ChangeEvent<HTMLInputElement>) => void;

  onSearchChange: (query: string) => void;
  onStatusChange: (status: 'all' | 'active' | 'inactive') => void;
  onSortChange: (sortBy: string) => void;
  onOrderChange: (order: 'asc' | 'desc' | string) => void;

  audienceLt: string;
  onAudienceLtChange: (v: string) => void;

  loading?: boolean;
  error?: string | null;
}

const LogoImg = ({ src }: { src: string }) => (
  <Box
    component="img"
    src={src}
    alt="store logo"
    sx={{ width: 48, height: 48, borderRadius: 1, objectFit: 'cover' }}
  />
);

const StoreTableSkeleton: FC<{ rows?: number }> = ({ rows = 8 }) => (
  <Card>{/* ...igual que antes... */}</Card>
);

const StackActionsSkeleton = () => (
  <Box sx={{ display: 'inline-flex', gap: 1 }}>{/* ...igual que antes... */}</Box>
);

const Results: FC<ResultsProps> = ({
  stores,
  page,
  limit,
  total,

  status,
  sortBy,
  order,
  search,

  onPageChange,
  onLimitChange,
  onSearchChange,
  onStatusChange,
  onSortChange,
  onOrderChange,

  audienceLt,
  onAudienceLtChange,

  loading,
  error,
}) => {
  const [selectedItems, setSelected] = useState<string[]>([]);
  const { t } = useTranslation();

  const handleSelectAll = (event: ChangeEvent<HTMLInputElement>): void => {
    setSelected(event.target.checked ? stores.map((s) => s._id || s.id) : []);
  };
  const handleSelectOne = (_: any, id: string): void => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };
  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  };

  // 👇 handler genérico para ordenar desde el header
  const handleRequestSort = (field: 'name' | 'active' | 'customerCount') => {
    const fieldKey = field; // backend: usar 'active' para status
    if (sortBy === fieldKey) {
      onOrderChange(order === 'asc' ? 'desc' : 'asc');
    } else {
      onSortChange(fieldKey);
      onOrderChange('asc');
    }
    onPageChange(0);
  };

  const selectedAll = stores.length > 0 && selectedItems.length === stores.length;
  const selectedSome = selectedItems.length > 0 && selectedItems.length < stores.length;

  return (
    <>
      <StoreFilter
        t={t}
        search={search}
        status={status}
        handleSearchChange={handleSearchChange}
        onStatusChange={onStatusChange}
        audienceLt={audienceLt}
        onAudienceLtChange={onAudienceLtChange}
        // 👆 ya NO pasamos sortBy/order ni sus handlers (los quitamos del filtro)
      />

      {loading ? (
        <StoreTableSkeleton rows={limit || 8} />
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

                    {/* Name sortable */}
                    <TableCell
                      sortDirection={sortBy === 'name' ? (order as 'asc' | 'desc') : false}
                    >
                      <TableSortLabel
                        active={sortBy === 'name'}
                        direction={sortBy === 'name' ? (order as 'asc' | 'desc') : 'asc'}
                        onClick={() => handleRequestSort('name')}
                      >
                        {t('Store name')}
                      </TableSortLabel>
                    </TableCell>

                    {/* Address (no sortable) */}
                    <TableCell>{t('Address')}</TableCell>

                    {/* Customers sortable */}
                    <TableCell
                      sortDirection={sortBy === 'customerCount' ? (order as 'asc' | 'desc') : false}
                    >
                      <TableSortLabel
                        active={sortBy === 'customerCount'}
                        direction={sortBy === 'customerCount' ? (order as 'asc' | 'desc') : 'asc'}
                        onClick={() => handleRequestSort('customerCount')}
                      >
                        {t('Customers')}
                      </TableSortLabel>
                    </TableCell>

                    {/* Status sortable (usa campo 'active') */}
                    <TableCell
                      align="center"
                      sortDirection={sortBy === 'active' ? (order as 'asc' | 'desc') : false}
                    >
                      <TableSortLabel
                        active={sortBy === 'active'}
                        direction={sortBy === 'active' ? (order as 'asc' | 'desc') : 'asc'}
                        onClick={() => handleRequestSort('active')}
                      >
                        {t('Status')}
                      </TableSortLabel>
                    </TableCell>

                    <TableCell align="center">{t('Actions')}</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {stores.map((store) => {
                    const id = store._id || store.id;
                    const isSelected = selectedItems.includes(id);
                    return (
                      <TableRow
                        hover
                        key={id}
                        selected={isSelected}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={isSelected}
                            onChange={(e) => handleSelectOne(e, id)}
                          />
                        </TableCell>

                        <TableCell>
                          <LogoImg src={store.image} />
                        </TableCell>

                        <TableCell>
                          <Link
                            href={`/admin/management/stores/edit/${id}`}
                            passHref
                            style={{ textDecoration: 'none', color: 'inherit' }}
                          >
                            <Typography variant="h5">{store.name}</Typography>
                          </Link>
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
                              href={`/admin/management/stores/edit/${id}`}
                              passHref
                            >
                              <IconButton color="primary">
                                <LaunchIcon fontSize="small" />
                              </IconButton>
                            </Link>
                          </Tooltip>

                          <Tooltip
                            title={t('Boost / Impulsar')}
                            arrow
                          >
                            <Link
                              href={`/admin/management/work-stores?q=${encodeURIComponent(
                                store.name
                              )}`}
                              passHref
                            >
                              <IconButton color="primary">
                                <ImpulseIcon fontSize="small" />
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
