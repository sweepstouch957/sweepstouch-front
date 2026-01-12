// app/components/stores/Results.tsx (puede ser .tsx o .jsx)
'use client';

import { AccountCircle, Settings, Web } from '@mui/icons-material';
import {
  Box,
  Card,
  Checkbox,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
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
  Tooltip,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import { useState } from 'react';
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
function splitByFirstNumber(raw, fallbackAddress) {
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

function buildSwitchUrl(storeId) {
  return `${MERCHANT_ORIGIN}/?ac=${storeId}`;
}

/* --------------------------- helpers de morosidad -------------------------- */

function getDebtStatus(pending = 0) {
  if (pending <= 0) {
    return {
      label: 'OK',
      color: 'white',
      bg: 'success.light',
    };
  }

  // <= 198 => Low debt
  if (pending <= 198) {
    return {
      label: 'Low debt',
      color: 'white',
      bg: 'warning.light',
    };
  }

  // > 198 => High debt
  return {
    label: 'High debt',
    color: 'white',
    bg: 'error.light',
  };
}

function formatMoney(value = 0, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

/* ----------------------------- tiny components ---------------------------- */
const LogoImg = ({ src }) => {
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
const Results = ({
  stores,
  page,
  limit,
  total,

  status,
  sortBy,
  order,
  search,
  debtStatus,
  minDebt,
  maxDebt,

  onPageChange,
  onLimitChange,
  onSearchChange,
  onStatusChange,
  onSortChange,
  onOrderChange,

  audienceLt,
  onAudienceLtChange,

  onDebtStatusChange,
  onMinDebtChange,
  onMaxDebtChange,
  handleSortChange,
  handleOrderChange,
  loading,
  error,
}) => {
  const [selectedItems, setSelected] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [selectedStore, setSelectedStore] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const { t } = useTranslation();

  const handleOpenModal = (store) => {
    setSelectedStore(store);
    setOpenModal(true);
    setActiveTab(0);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedStore(null);
  };

  const handleTabChange = (_, newValue) => {
    setActiveTab(newValue);
  };

  const handleSelectAll = (event) => {
    setSelected(event.target.checked ? stores.map((s) => s._id || s.id) : []);
  };

  const handleSelectOne = (_, id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSearchChange = (e) => {
    onSearchChange(e.target.value);
  };

  // Ordenar desde el header (Name, Customers, Status/active, Days overdue)
  const handleRequestSort = (field) => {
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

      <StoreFilter
        t={t}
        search={search}
        total={total}
        status={status}
        audienceLt={audienceLt}
        debtStatus={debtStatus}
        minDebt={minDebt}
        maxDebt={maxDebt}
        handleSearchChange={handleSearchChange}
        onStatusChange={onStatusChange}
        onAudienceLtChange={onAudienceLtChange}
        onDebtStatusChange={onDebtStatusChange}
        onMinDebtChange={onMinDebtChange}
        onMaxDebtChange={onMaxDebtChange}
        // 🆕 sort
        sortBy={sortBy}
        order={order as 'asc' | 'desc'}
        onSortChange={handleSortChange}
        onOrderChange={handleOrderChange}
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
                    <TableCell sortDirection={sortBy === 'name' ? order : false}>
                      <TableSortLabel
                        active={sortBy === 'name'}
                        direction={sortBy === 'name' ? order : 'asc'}
                        onClick={() => handleRequestSort('name')}
                      >
                        {t('Store name')}
                      </TableSortLabel>
                    </TableCell>

                    {/* Address (no sortable) */}
                    <TableCell>{t('Address')}</TableCell>

                    {/* Customers (sortable) */}
                    <TableCell sortDirection={sortBy === 'customerCount' ? order : false}>
                      <TableSortLabel
                        active={sortBy === 'customerCount'}
                        direction={sortBy === 'customerCount' ? order : 'asc'}
                        onClick={() => handleRequestSort('customerCount')}
                      >
                        {t('Customers')}
                      </TableSortLabel>
                    </TableCell>

                    {/* Balance pendiente */}
                    <TableCell align="right">{t('Balance')}</TableCell>

                    {/* Days overdue (sortable) */}
                    <TableCell
                      align="right"
                      sortDirection={sortBy === 'maxDaysOverdue' ? order : false}
                    >
                      <TableSortLabel
                        active={sortBy === 'maxDaysOverdue'}
                        direction={sortBy === 'maxDaysOverdue' ? order : 'desc'}
                        onClick={() => handleRequestSort('maxDaysOverdue')}
                      >
                        {t('Days overdue')}
                      </TableSortLabel>
                    </TableCell>

                    {/* Nueva columna: estado de crédito */}
                    <TableCell align="center">{t('Credit status')}</TableCell>

                    {/* Status (sortable via 'active') */}
                    <TableCell
                      align="center"
                      sortDirection={sortBy === 'active' ? order : false}
                    >
                      <TableSortLabel
                        active={sortBy === 'active'}
                        direction={sortBy === 'active' ? order : 'asc'}
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
                    const { displayName, displayAddress } = splitByFirstNumber(
                      store.name,
                      store.address
                    );

                    const pending = (store.billing && store.billing.totalPending) || 0;
                    const debtStatusMeta = getDebtStatus(pending);
                    const daysOverdue = (store.billing && store.billing.maxDaysOverdue) || 0;

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
                            style={{
                              textDecoration: 'none',
                              color: 'inherit',
                            }}
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

                        {/* Balance pendiente */}
                        <TableCell align="right">
                          <Tooltip
                            title={
                              store.billing
                                ? `Invoiced: ${formatMoney(
                                    store.billing.totalInvoiced || 0
                                  )} · Paid: ${formatMoney(store.billing.totalPaid || 0)}`
                                : ''
                            }
                            arrow
                          >
                            <Typography
                              fontWeight={600}
                              color={pending > 0 ? 'error.main' : 'success.main'}
                            >
                              {formatMoney(pending)}
                            </Typography>
                          </Tooltip>
                        </TableCell>

                        {/* Days overdue */}
                        <TableCell align="right">
                          <Tooltip
                            title={
                              daysOverdue > 0
                                ? `${daysOverdue} ${t('days overdue')}`
                                : t('No overdue')
                            }
                            arrow
                          >
                            <Typography
                              fontWeight={600}
                              color={daysOverdue > 0 ? 'warning.main' : 'text.secondary'}
                            >
                              {daysOverdue > 0 ? `${daysOverdue}d` : '—'}
                            </Typography>
                          </Tooltip>
                        </TableCell>

                        {/* Estado de crédito (pill) */}
                        <TableCell align="center">
                          <Box
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              px: 1.5,
                              py: 0.4,
                              borderRadius: 999,
                              fontSize: 12,
                              fontWeight: 600,
                              bgcolor: debtStatusMeta.bg,
                              color: debtStatusMeta.color,
                              textTransform: 'uppercase',
                              letterSpacing: 0.6,
                            }}
                          >
                            {debtStatusMeta.label}
                          </Box>
                        </TableCell>

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
