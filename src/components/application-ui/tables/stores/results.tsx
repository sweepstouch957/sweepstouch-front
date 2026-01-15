// app/components/stores/Results.tsx
'use client';

import { Store } from '@/services/store.service';
import { AccountCircle, Settings, Web } from '@mui/icons-material';
import {
  Box,
  Card,
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
import React, { ChangeEvent, FC, useState } from 'react';
import { useTranslation } from 'react-i18next';
import CampaignsPanel from '../../content-shells/store-managment/panel/campaigns/campaign-panel';
import StoreFilter from './filter';
import { StoresBillingHeader } from './header';
import { StoreTableSkeleton } from './skelleton';
import StaffManagementMock from './StaffManagementMock';
import StoreInfoSimplified from './StoreInfoSimplified';

/* ------------------------------- helper split ------------------------------ */
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

/* --------------------------- helpers de morosidad -------------------------- */
/**
 * Se basa en:
 *  - pending <= 0  -> OK
 *  - installmentsNeeded < 2 -> LOW DEBT
 *  - installmentsNeeded >= 2 o no definido -> HIGH DEBT
 */
function getDebtStatus(pending = 0, installmentsNeeded?: number | null) {
  if (pending <= 0) {
    return { label: 'OK', color: 'white' as const, bg: 'success.light' as const };
  }

  if (!installmentsNeeded || !Number.isFinite(installmentsNeeded)) {
    return { label: 'HIGH DEBT', color: 'white' as const, bg: 'error.light' as const };
  }

  if (installmentsNeeded < 2) {
    return { label: 'LOW DEBT', color: 'white' as const, bg: 'warning.light' as const };
  }

  return { label: 'HIGH DEBT', color: 'white' as const, bg: 'error.light' as const };
}

function formatMoney(value = 0, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

/* --------------------------------- props ---------------------------------- */

type StatusFilter = 'all' | 'active' | 'inactive';
type DebtStatus = 'all' | 'ok' | 'low' | 'high';

interface ResultsProps {
  stores: Store[];
  page: number;
  limit: number;
  total: number;

  status: StatusFilter;
  sortBy: string;
  order: 'asc' | 'desc';
  search: string;

  debtStatus: DebtStatus;
  minDebt: string;
  maxDebt: string;

  onPageChange: (page: number) => void;
  onLimitChange: (e: ChangeEvent<HTMLInputElement>) => void;

  onSearchChange: (query: string) => void;
  onStatusChange: (status: StatusFilter) => void;
  onSortChange: (sortBy: string) => void;
  onOrderChange: (order: 'asc' | 'desc') => void;

  audienceLt: string;
  onAudienceLtChange: (v: string) => void;

  onDebtStatusChange: (v: DebtStatus) => void;
  onMinDebtChange: (v: string) => void;
  onMaxDebtChange: (v: string) => void;

  handleSortChange: (field: string) => void;
  handleOrderChange: (order: 'asc' | 'desc') => void;

  loading?: boolean;
  error?: string | null;
  onPaymentMethodChange?: (value: string) => void;
  paymentMethod?: string;
}

/* ----------------------------- tiny components ---------------------------- */
const LogoImg: FC<{ src?: string }> = ({ src }) => {
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
const Results: FC<ResultsProps> = ({
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
  paymentMethod,
  onPaymentMethodChange,
  error,
}) => {
  const [openModal, setOpenModal] = useState(false);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const { t } = useTranslation();

  const handleOpenModal = (store: Store) => {
    setSelectedStore(store);
    setOpenModal(true);
    setActiveTab(0);
  };

  return (
    <>
      {/* ---------------------------- MODAL DETALLES ---------------------------- */}
      <Dialog
        open={openModal}
        onClose={() => setOpenModal(false)}
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
              onChange={(_, v) => setActiveTab(v)}
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
                storeId={(selectedStore as any)._id || (selectedStore as any).id}
                storeName={selectedStore.name}
              />
            )}
            {activeTab === 2 && selectedStore && (
              <StaffManagementMock
                storeId={(selectedStore as any)._id || (selectedStore as any).id}
              />
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
        handleSearchChange={(e) => onSearchChange(e.target.value)}
        onStatusChange={onStatusChange}
        onAudienceLtChange={onAudienceLtChange}
        onDebtStatusChange={onDebtStatusChange}
        onMinDebtChange={onMinDebtChange}
        paymentMethod={paymentMethod}
        onPaymentMethodChange={onPaymentMethodChange}
        onMaxDebtChange={onMaxDebtChange}
        sortBy={sortBy}
        order={order}
        onSortChange={handleSortChange}
        onOrderChange={handleOrderChange}
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
              <Table
                sx={{
                  tableLayout: 'fixed',
                  width: '100%',
                  '& th, & td': { whiteSpace: 'nowrap' },

                  // STORE
                  '& th:nth-of-type(1), & td:nth-of-type(1)': { width: '24%' },
                  // CUSTOMERS
                  '& th:nth-of-type(2), & td:nth-of-type(2)': { width: '6%' },
                  // WEEKLY
                  '& th:nth-of-type(3), & td:nth-of-type(3)': { width: '10%' },
                  // BALANCE
                  '& th:nth-of-type(4), & td:nth-of-type(4)': { width: '13%' },
                  // PLAN (antes overdue)
                  '& th:nth-of-type(5), & td:nth-of-type(5)': { width: '8%' },
                  // CREDIT
                  '& th:nth-of-type(6), & td:nth-of-type(6)': { width: '13%' },
                  // STATUS
                  '& th:nth-of-type(7), & td:nth-of-type(7)': { width: '8%' },
                  // ACTIONS
                  '& th:nth-of-type(8), & td:nth-of-type(8)': { width: '18%' },
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <TableSortLabel
                        active={sortBy === 'name'}
                        direction={sortBy === 'name' ? order : 'asc'}
                        onClick={() => onSortChange('name')}
                      >
                        {t('Store')}
                      </TableSortLabel>
                    </TableCell>

                    <TableCell>
                      <TableSortLabel
                        active={sortBy === 'customerCount'}
                        direction={sortBy === 'customerCount' ? order : 'asc'}
                        onClick={() => onSortChange('customerCount')}
                      >
                        {t('Customers')}
                      </TableSortLabel>
                    </TableCell>

                    <TableCell align="right">{t('Weekly')}</TableCell>
                    <TableCell align="right">{t('Balance')}</TableCell>

                    {/* Columna de plan de pago (cuotas necesarias) */}
                    <TableCell align="right">{t('Installments')}</TableCell>

                    <TableCell align="center">{t('Credit')}</TableCell>

                    <TableCell align="center">
                      <TableSortLabel
                        active={sortBy === 'active'}
                        direction={sortBy === 'active' ? order : 'asc'}
                        onClick={() => onSortChange('active')}
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

                    const { displayName, displayAddress } = splitByFirstNumber(
                      store.name,
                      store.address
                    );

                    const pending = store.billing?.totalPending || 0;
                    const weeklyCost = store.billing?.lastWeekCampaignCost || 0;
                    const installmentsNeeded = store.billing?.installmentsNeeded ?? null;

                    const debtStatusMeta = getDebtStatus(pending, installmentsNeeded ?? undefined);

                    return (
                      <TableRow
                        key={id}
                        hover
                      >
                        {/* STORE */}
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
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    maxWidth: 220,
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
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  maxWidth: 220,
                                }}
                              >
                                {displayAddress}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>

                        {/* Customers */}
                        <TableCell>{store.customerCount}</TableCell>

                        {/* Weekly */}
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
                          <Typography
                            fontWeight={600}
                            color={pending > 0 ? 'error.main' : 'success.main'}
                          >
                            {formatMoney(pending)}
                          </Typography>
                        </TableCell>

                        {/* Installments (plan de pago) */}
                        <TableCell align="right">
                          <Typography
                            fontWeight={600}
                            color={pending > 0 ? 'text.primary' : 'text.secondary'}
                          >
                            {pending <= 0 ? '—' : `${installmentsNeeded} weeks` }
                          </Typography>
                        </TableCell>

                        {/* Credit */}
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
                              onClick={() =>
                                window.open(buildSwitchUrl(store.accessCode), '_blank')
                              }
                            >
                              <Web fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip
                            title={t('Details')}
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
