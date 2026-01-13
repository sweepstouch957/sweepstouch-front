// app/components/stores/Results.tsx
'use client';

import { AccountCircle, Settings, Web } from '@mui/icons-material';
import {
  Box,
  Card,
  Checkbox,
  Chip,
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
import { StoresBillingHeader } from './header';
import { StoreTableSkeleton } from './skelleton';
import StaffManagementMock from './StaffManagementMock';
import StoreInfoSimplified from './StoreInfoSimplified';

/* ------------------------------- helper split ------------------------------ */
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

  if (pending <= 198) {
    return {
      label: 'Low debt',
      color: 'white',
      bg: 'warning.light',
    };
  }

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

/* ---------------------- helper payment method (chips) ---------------------- */

function getPaymentMethodMeta(pm) {
  switch (pm) {
    case 'central_billing':
      return { label: 'Central billing', color: 'primary' };
    case 'card':
      return { label: 'Card', color: 'info' };
    case 'quickbooks':
      return { label: 'QuickBooks', color: 'success' };
    case 'ach':
      return { label: 'ACH', color: 'secondary' };
    case 'wire':
      return { label: 'Wire', color: 'warning' };
    case 'cash':
      return { label: 'Cash', color: 'success' };
    default:
      return { label: 'N/A', color: 'default' };
  }
}

/* ----------------------------- tiny components ---------------------------- */
const LogoImg = ({ src }) => {
  if (!src) return null;

  return (
    <Box
      component="img"
      src={src}
      alt="store logo"
      sx={{ width: 40, height: 40, objectFit: 'contain', borderRadius: 1 }}
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
  paymentMethod,

  onPageChange,
  onLimitChange,
  onSearchChange,
  onStatusChange,
  onSortChange,
  onOrderChange,
  audienceLt,
  onAudienceLtChange,
  onPaymentMethodChange,
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
      {/* ---------------------------- MODAL DETALLES ---------------------------- */}
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
              variant="fullWidth"
            >
              <Tab label={t('General Info')} />
              <Tab label={t('Campaigns')} />
              <Tab label={t('Staff Management (Mock)')} />
            </Tabs>
          </Box>
          <Box sx={{ p: 3 }}>
            {activeTab === 0 && selectedStore && <StoreInfoSimplified store={selectedStore} />}
            {activeTab === 1 && selectedStore && (
              <CampaignsPanel
                storeId={selectedStore._id || selectedStore.id}
                storeName={selectedStore.name}
              />
            )}
            {activeTab === 2 && selectedStore && (
              <StaffManagementMock storeId={selectedStore._id || selectedStore.id} />
            )}
          </Box>
        </DialogContent>
      </Dialog>

      {/* ------------------------------- FILTROS -------------------------------- */}
      <StoresBillingHeader />
      <StoreFilter
        t={t}
        search={search}
        total={total}
        status={status}
        audienceLt={audienceLt}
        debtStatus={debtStatus}
        minDebt={minDebt}
        maxDebt={maxDebt}
        paymentMethod={paymentMethod}
        handleSearchChange={handleSearchChange}
        onStatusChange={onStatusChange}
        onAudienceLtChange={onAudienceLtChange}
        onDebtStatusChange={onDebtStatusChange}
        onMinDebtChange={onMinDebtChange}
        onMaxDebtChange={onMaxDebtChange}
        sortBy={sortBy}
        order={order}
        onSortChange={handleSortChange}
        onOrderChange={handleOrderChange}
        onPaymentMethodChange={onPaymentMethodChange}
      />

      {/* ------------------------------- TABLA -------------------------------- */}
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

                    {/* COL 1: Store (logo + name + address) */}
                    <TableCell sortDirection={sortBy === 'name' ? order : false}>
                      <TableSortLabel
                        active={sortBy === 'name'}
                        direction={sortBy === 'name' ? order : 'asc'}
                        onClick={() => handleRequestSort('name')}
                      >
                        {t('Store')}
                      </TableSortLabel>
                    </TableCell>

                    {/* COL 2: Customers */}
                    <TableCell sortDirection={sortBy === 'customerCount' ? order : false}>
                      <TableSortLabel
                        active={sortBy === 'customerCount'}
                        direction={sortBy === 'customerCount' ? order : 'asc'}
                        onClick={() => handleRequestSort('customerCount')}
                      >
                        {t('Customers')}
                      </TableSortLabel>
                    </TableCell>

                    {/* ⭐ COL 3: Weekly Campaign Cost */}
                    <TableCell align="right">{t('Weekly campaigns')}</TableCell>

                    {/* COL 4: Balance */}
                    <TableCell align="right">{t('Balance')}</TableCell>

                    {/* COL 5: Days overdue */}
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

                    {/* COL 6: Credit status */}
                    <TableCell align="center">{t('Credit status')}</TableCell>

                    {/* COL 7: Payment method */}
                    <TableCell align="center">{t('Payment method')}</TableCell>

                    {/* COL 8: Status */}
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

                    {/* COL 9: Actions */}
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
                    const weeklyCost = (store.billing && store.billing.lastWeekCampaignCost) || 0;

                    const debtStatusMeta = getDebtStatus(pending);
                    const daysOverdue = (store.billing && store.billing.maxDaysOverdue) || 0;

                    const pmMeta:any = getPaymentMethodMeta(store.paymentMethod);

                    return (
                      <TableRow
                        key={id}
                        hover
                        selected={isSelected}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={isSelected}
                            onChange={(e) => handleSelectOne(e, id)}
                          />
                        </TableCell>

                        {/* STORE (logo + name + address) */}
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <LogoImg src={store.image} />
                            <Box>
                              <Link
                                href={`/admin/management/stores/edit/${id}`}
                                style={{ textDecoration: 'none', color: 'inherit' }}
                              >
                                <Typography
                                  variant="subtitle1"
                                  fontWeight={700}
                                  sx={{
                                    fontSize: 15,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    maxWidth: 260,
                                  }}
                                >
                                  {displayName}
                                </Typography>
                              </Link>

                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                  fontSize: 12,
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  maxWidth: 260,
                                }}
                              >
                                {displayAddress}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>

                        {/* Customers */}
                        <TableCell>{store.customerCount}</TableCell>

                        {/* ⭐ Weekly Campaign Cost */}
                        <TableCell align="right">
                          <Typography
                            fontWeight={600}
                            color={weeklyCost > 0 ? 'primary.main' : 'text.secondary'}
                          >
                            {formatMoney(weeklyCost)}
                          </Typography>
                        </TableCell>

                        {/* Balance */}
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

                        {/* Credit status */}
                        <TableCell align="center">
                          <Box
                            sx={{
                              display: 'inline-flex',
                              px: 1.5,
                              py: 0.4,
                              borderRadius: 999,
                              fontSize: 12,
                              fontWeight: 600,
                              bgcolor: debtStatusMeta.bg,
                              color: debtStatusMeta.color,
                              textTransform: 'uppercase',
                            }}
                          >
                            {debtStatusMeta.label}
                          </Box>
                        </TableCell>

                        {/* Payment method */}
                        <TableCell align="center">
                          {store.paymentMethod ? (
                            <Chip
                              size="small"
                              label={pmMeta.label}
                              color={pmMeta.color}
                              variant="outlined"
                              sx={{ fontSize: 11, fontWeight: 600 }}
                            />
                          ) : (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                            >
                              —
                            </Typography>
                          )}
                        </TableCell>

                        {/* Status */}
                        <TableCell align="center">
                          <Typography color={store.active ? 'success.main' : 'error.main'}>
                            {store.active ? t('Active') : t('Inactive')}
                          </Typography>
                        </TableCell>

                        {/* Actions */}
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

          {/* PAGINATION */}
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
