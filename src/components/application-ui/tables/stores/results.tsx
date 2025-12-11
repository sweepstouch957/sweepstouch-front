'use client';

import { Store } from '@/services/store.service';
import { AccountCircle, Settings, Web } from '@mui/icons-material';
import {
  Box,
  Card,
  Checkbox,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Skeleton,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import React, { ChangeEvent, FC, useState } from 'react';
import { useTranslation } from 'react-i18next';
import CampaignsPanel from '../../content-shells/store-managment/panel/campaigns/campaign-panel';
import StoreFilter from './filter';
import { StoreTableSkeleton } from './skelleton';
import StaffManagementMock from './StaffManagementMock';
import StoreInfoSimplified from './StoreInfoSimplified';

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
const MERCHANT_ORIGIN =
  process.env.NEXT_PUBLIC_MERCHANT_ORIGIN || 'https://merchant.sweepstouch.com';

function buildSwitchUrl(storeId: string) {
  return `${MERCHANT_ORIGIN}/?ac=${storeId}`;
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
const LogoImg = ({ src }: { src: string }) => {
  if (!src) return null;

  return (
    <Box
      component="img"
      src={src}
      alt="store logo"
      sx={{ width: 40, height: 40, objectFit: 'contain' }}
    />
  );
};

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
  const [openModal, setOpenModal] = useState(false);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const { t } = useTranslation();

  const handleOpenModal = (store: Store) => {
    setSelectedStore(store);
    setOpenModal(true);
    setActiveTab(0);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedStore(null);
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

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
      {/* Modal de detalles de la tienda */}
      <Dialog
        open={openModal}
        onClose={handleCloseModal}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          {t('Store Details')}: {selectedStore?.name}
        </DialogTitle>
        <DialogContent
          dividers
          sx={{ p: 0 }}
        >
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              aria-label="store details tabs"
              variant="fullWidth"
              sx={{ '& .MuiTabs-flexContainer': { justifyContent: 'space-around' } }}
            >
              <Tab label={t('General Info')} />
              <Tab label={t('Campaigns')} />
              <Tab label={t('Staff Management (Mock)')} />
            </Tabs>
          </Box>
          <Box sx={{ p: 3 }}>
            {/* Tab Panel 1: General Info */}
            {activeTab === 0 && selectedStore && (
              <Box>
                <StoreInfoSimplified store={selectedStore} />
              </Box>
            )}

            {/* Tab Panel 2: Campaigns */}
            {activeTab === 1 && selectedStore && (
              <Box sx={{ p: 0 }}>
                {' '}
                {/* Remove inner padding for full space */}
                <CampaignsPanel
                  storeId={selectedStore._id || selectedStore.id}
                  storeName={selectedStore.name}
                />
              </Box>
            )}

            {/* Tab Panel 3: Staff Management (Mock) */}
            {activeTab === 2 && selectedStore && (
              <Box>
                <Typography
                  variant="h5"
                  gutterBottom
                >
                  {t('Staff Management ')}
                </Typography>
                <StaffManagementMock storeId={selectedStore._id || selectedStore.id} />
              </Box>
            )}
          </Box>
        </DialogContent>
      </Dialog>
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
                                <Settings fontSize="small" />
                              </IconButton>
                            </Link>
                          </Tooltip>

                          <Tooltip
                            title={t('Merchant')}
                            arrow
                          >
                            <IconButton
                              color="secondary"
                              onClick={() => {
                                window.open(buildSwitchUrl(store.accessCode), '_blank');
                              }}
                            >
                              <Web fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          {/* Nuevo icono de usuario para el modal */}
                          <Tooltip
                            title={t('Store Details')}
                            arrow
                          >
                            <IconButton
                              color="primary"
                              onClick={() => handleOpenModal(store)}
                            >
                              <AccountCircle fontSize="small" />
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
