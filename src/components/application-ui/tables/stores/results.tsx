'use client';

import { Store } from '@/services/store.service';
import {
  DeleteTwoTone as DeleteIcon,
  RocketLaunchTwoTone as ImpulseIcon,
  LaunchTwoTone as LaunchIcon,
  Web,
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
  TableSortLabel,
  Tooltip,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import React, { ChangeEvent, FC, useState } from 'react';
import { useTranslation } from 'react-i18next';
import StoreFilter from './filter';
import { StoreTableSkeleton } from './skelleton';

/* ------------------------------- helper split ------------------------------ */
// Corta en el PRIMER dígito que aparezca.
// "Antillana Superfood 2750 E Tremont Ave, Bronx, NY 10461, USA"
// => name: "Antillana Superfood"
//    address: "2750 E Tremont Ave, Bronx, NY 10461, USA"
function splitByFirstNumber(raw: string, fallbackAddress?: string) {
  const s = (raw || '').trim();
  const i = s.search(/\d/);
  if (i > 0) {
    const name = s
      .slice(0, i)
      .trim()
      .replace(/[,\-\s]+$/, '');
    const address = s.slice(i).trim();
    return { displayName: name, displayAddress: address };
  }
  return { displayName: s, displayAddress: (fallbackAddress || '').trim() };
}

/* --------------------------------- props ---------------------------------- */
interface ResultsProps {
  stores: Store[];
  page: number;
  limit: number;
  total: number;

  status: 'all' | 'active' | 'inactive';
  sortBy: 'customerCount' | 'name' | 'active' | string;
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

/* ----------------------------- tiny components ---------------------------- */
const LogoImg = ({ src }: { src: string }) => (
  <Box
    component="img"
    src={src}
    alt="store logo"
    sx={{ width: 40, height: 40, borderRadius: 1, objectFit: 'cover' }}
  />
);

/* -------------------------------- component -------------------------------- */
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
    setSelected(event.target.checked ? stores.map((s: any) => s._id || s.id) : []);
  };

  const handleSelectOne = (_: any, id: string): void => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  };

  // Ordenar desde el header (Name, Customers, Status/active)
  const handleRequestSort = (field: 'name' | 'active' | 'customerCount') => {
    if (sortBy === field) {
      onOrderChange(order === 'asc' ? 'desc' : 'asc');
    } else {
      onSortChange(field);
      onOrderChange('asc');
    }
    onPageChange(0);
  };

  const selectedAll = stores.length > 0 && selectedItems.length === stores.length;
  const selectedSome = selectedItems.length > 0 && selectedItems.length < stores.length;

  return (
    <>
      {/* Filtros arriba (sin sort/order aquí, solo búsqueda, status y audienceLt) */}
      <StoreFilter
        t={t}
        search={search}
        total={total}
        status={status}
        handleSearchChange={handleSearchChange}
        onStatusChange={onStatusChange}
        audienceLt={audienceLt}
        onAudienceLtChange={onAudienceLtChange}
      />

      {loading ? (
        <StoreTableSkeleton rows={limit || 12} />
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

                    {/* Name (sortable) */}
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

                    {/* Customers (sortable) */}
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

                    {/* Status (sortable via 'active') */}
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
                  {stores.map((store: any) => {
                    const id = store._id || store.id;
                    const isSelected = selectedItems.includes(id);
                    const { displayName, displayAddress } = splitByFirstNumber(
                      store.name,
                      store.address
                    );

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
                            <Typography
                              variant="h6"
                              sx={{ fontSize: 15 }}
                            >
                              {displayName}
                            </Typography>
                          </Link>
                        </TableCell>

                        <TableCell>{displayAddress}</TableCell>

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
                            title={t('Merchant')}
                            arrow
                          >
                            <IconButton color="secondary" 
                            onClick={() => {
                              window.open(`https://merchant.sweepstouch.com/${store.accessCode}`, '_blank');
                            }}>
                              <Web fontSize="small" />
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

          {/* 🧭 Paginación MUI clásica */}
          <Box p={2}>
            <TablePagination
              component="div"
              count={total}
              page={page}
              rowsPerPage={limit}
              onPageChange={(_, newPage) => onPageChange(newPage)}
              onRowsPerPageChange={onLimitChange}
              rowsPerPageOptions={[5, 10, 25, 50, 100]}
            />
          </Box>
        </>
      )}
    </>
  );
};

export default Results;
