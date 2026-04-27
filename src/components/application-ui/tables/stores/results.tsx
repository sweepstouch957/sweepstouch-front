// app/components/stores/Results.tsx
'use client';

import { Store } from '@/services/store.service';
import {
  AccountCircle,
  CancelRounded,
  CheckCircleRounded,
  PaymentsRounded,
  Settings,
  Web,
} from '@mui/icons-material';
import {
  Box,
  Card,
  Chip,
  Divider,
  IconButton,
  Skeleton,
  Stack,
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
  useMediaQuery,
  useTheme,
} from '@mui/material';
import Link from 'next/link';
import React, { ChangeEvent, FC, useMemo } from 'react';
import StoreTechModal from './StoreInfoSimplified';

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

function formatMoney(value = 0, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

/* --------------------------- payment status logic -------------------------- */
type PaymentTone = 'ok' | 'min_low' | 'low' | 'mid' | 'high' | 'critical';

function paymentTone(pending = 0, installmentsNeeded?: number | null): PaymentTone {
  if (pending <= 0) return 'ok';

  const n = Number(installmentsNeeded);
  if (!Number.isFinite(n) || n <= 0) return 'critical';

  if (n >= 5) return 'critical';
  if (n === 4) return 'high';
  if (n === 3) return 'mid';
  if (n === 2) return 'low';
  return 'min_low';
}

function toneLabel(tone: PaymentTone) {
  switch (tone) {
    case 'ok':
      return 'OK';
    case 'min_low':
      return 'MIN LOW';
    case 'low':
      return 'LOW';
    case 'mid':
      return 'MID';
    case 'high':
      return 'HIGH';
    case 'critical':
      return 'CRITICAL';
    default:
      return '—';
  }
}

type MuiChipColor = 'default' | 'success' | 'info' | 'warning' | 'error' | 'primary' | 'secondary';

function toneChipColor(tone: PaymentTone): MuiChipColor {
  switch (tone) {
    case 'ok': return 'success';
    case 'min_low': return 'default';
    case 'low': return 'info';
    case 'mid': return 'warning';
    case 'high': return 'error';
    case 'critical': return 'error';
    default: return 'default';
  }
}

function installmentsLabel(pending = 0, installmentsNeeded?: number | null) {
  if (pending <= 0) return '—';
  const n = Number(installmentsNeeded);
  if (!Number.isFinite(n) || n <= 0) return '—';
  return `${n} SEM`;
}

/* --------------------------- payment method helper -------------------------- */
function paymentMethodLabel(method?: Store['paymentMethod']) {
  switch (method) {
    case 'central_billing':
      return 'Central billing';
    case 'card':
      return 'Card';
    case 'quickbooks':
      return 'QuickBooks';
    case 'ach':
      return 'ACH';
    case 'wire':
      return 'Wire';
    case 'cash':
      return 'Cash';
    default:
      return '—';
  }
}

/* --------------------------------- props ---------------------------------- */
type StatusFilter = 'all' | 'active' | 'inactive';
type DebtStatus = 'all' | 'ok' | 'min_low' | 'low' | 'mid' | 'high' | 'critical';

interface ResultsProps {
  stores: Store[];
  page: number;
  limit: number;
  total: number;

  sortBy: string;
  order: 'asc' | 'desc';

  onPageChange: (page: number) => void;
  onLimitChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onSortChange: (sortBy: string) => void;

  loading?: boolean;
  fetching?: boolean;
  error?: string | null;
}

/* ----------------------------- tiny components ---------------------------- */
const LogoImg: FC<{ src?: string }> = ({ src }) => {
  if (!src) return null;
  return (
    <Box
      component="img"
      src={src}
      alt="store logo"
      sx={{
        width: 40,
        height: 40,
        objectFit: 'contain',
        borderRadius: 1,
        flex: '0 0 auto',
      }}
    />
  );
};

const ActiveBadge: FC<{ active: boolean }> = ({ active }) => (
  <Tooltip
    title={active ? 'Active' : 'Inactive'}
    arrow
  >
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        ml: 0.75,
        transform: 'translateY(1px)',
        cursor: 'help',
      }}
    >
      {active ? (
        <CheckCircleRounded fontSize="small" color="success" />
      ) : (
        <CancelRounded fontSize="small" color="error" />
      )}
    </Box>
  </Tooltip>
);

/* -------------------------------- component -------------------------------- */
const Results: FC<ResultsProps> = ({
  stores,
  page,
  limit,
  total,
  sortBy,
  order,
  onPageChange,
  onLimitChange,
  onSortChange,
  loading,
  fetching,
  error,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const rowsPerPageOptions = useMemo(() => [5, 10, 25, 50, 100], []);

  // ✅ Modal state (Ficha técnica)
  const [techOpen, setTechOpen] = React.useState(false);
  const [techStore, setTechStore] = React.useState<{
    id: string;
    slug: string;
    name?: string;
    image?: string;
    audience?: number;
    email?: string;
    phone?: string;
    lng?: number;
    lat?: number;
    startContractDate?: string;
    address?: string;
    equipment?: any[];
    contactInfo?: any[];
  } | null>(null);

  const openTech = (store: any) => {
    const id = String(store._id || store.id || '');
    if (!id) return;
    setTechStore({
      id,
      slug: store.slug || '',
      name: store.name,
      image: store.image,
      audience: store.customerCount,
      email: store.email,
      phone: store.phoneNumber,
      lng: store.location?.coordinates?.[0] || store.lng,
      lat: store.location?.coordinates?.[1] || store.lat,
      startContractDate: store.startContractDate,
      address: store.address,
      equipment: store.equipment,
      contactInfo: store.contactInfo,
    });
    setTechOpen(true);
  };

  const closeTech = () => {
    setTechOpen(false);
    setTechStore(null);
  };

  const MobileList = () => (
    <Stack spacing={1.25}>
      {stores.map((store: any) => {
        const id = store._id || store.id;

        const { displayName, displayAddress } = splitByFirstNumber(store.name, store.address);

        const pending = store.billing?.totalPending || 0;
        const weeklyCost = store.billing?.lastWeekCampaignCost || 0;
        const installmentsNeeded = store.billing?.installmentsNeeded ?? null;

        const tone = paymentTone(pending, installmentsNeeded);
        const payMethod = paymentMethodLabel(store.paymentMethod);

        return (
          <Card
            key={id}
            variant="outlined"
            sx={{ borderRadius: 2.5, overflow: 'hidden' }}
          >
            <Box sx={{ p: 1.5 }}>
              <Stack
                direction="row"
                spacing={1.25}
                alignItems="center"
              >
                <LogoImg src={store.image} />

                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Link
                    href={`/admin/management/stores/edit/${id}`}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
                      <Typography
                        fontWeight={900}
                        sx={{
                          fontSize: 14,
                          lineHeight: 1.15,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {displayName}
                      </Typography>

                      <ActiveBadge active={!!store.active} />
                    </Box>
                  </Link>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      mt: 0.25,
                    }}
                  >
                    {displayAddress}
                  </Typography>
                </Box>

                <Stack
                  spacing={0.5}
                  alignItems="flex-end"
                >
                  <Chip
                    size="small"
                    label={store.active ? 'Active' : 'Inactive'}
                    color={store.active ? 'success' : 'error'}
                    variant="outlined"
                    sx={{ height: 22, fontSize: 11, fontWeight: 800 }}
                  />

                  <Chip
                    size="small"
                    label={toneLabel(tone)}
                    color={toneChipColor(tone)}
                    variant={tone === 'critical' ? 'filled' : 'outlined'}
                    sx={{ fontSize: 10, fontWeight: 800, height: 20, letterSpacing: 0.4, '& .MuiChip-label': { px: 0.75 } }}
                  />
                </Stack>
              </Stack>

              <Divider sx={{ my: 1.25 }} />

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Customers
                  </Typography>
                  <Typography
                    fontWeight={900}
                    sx={{ fontSize: 13 }}
                  >
                    {store.customerCount}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Weekly
                  </Typography>
                  <Typography
                    fontWeight={900}
                    sx={{ fontSize: 13 }}
                    color={weeklyCost > 0 ? 'primary.main' : 'text.secondary'}
                  >
                    {formatMoney(weeklyCost)}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Balance
                  </Typography>
                  <Typography
                    fontWeight={900}
                    sx={{ fontSize: 13 }}
                    color={pending > 0 ? 'error.main' : 'success.main'}
                  >
                    {formatMoney(pending)}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Installments
                  </Typography>
                  <Typography
                    fontWeight={900}
                    sx={{ fontSize: 13 }}
                  >
                    {installmentsLabel(pending, installmentsNeeded)}
                  </Typography>
                </Box>

                <Box sx={{ gridColumn: '1 / -1' }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Payment method
                  </Typography>
                  <Stack
                    direction="row"
                    spacing={0.75}
                    alignItems="center"
                    sx={{ mt: 0.25 }}
                  >
                    <PaymentsRounded
                      fontSize="small"
                      sx={{ color: 'text.secondary' }}
                    />
                    <Typography
                      fontWeight={900}
                      sx={{ fontSize: 13 }}
                    >
                      {payMethod}
                    </Typography>
                  </Stack>
                </Box>
              </Box>

              <Stack
                direction="row"
                spacing={1}
                justifyContent="flex-end"
                sx={{ mt: 1.25 }}
              >
                <Tooltip
                  title="View"
                  arrow
                >
                  <Link
                    href={`/admin/management/stores/edit/${id}`}
                    passHref
                  >
                    <IconButton
                      size="small"
                      color="primary"
                    >
                      <Settings fontSize="small" />
                    </IconButton>
                  </Link>
                </Tooltip>

                <Tooltip
                  title="Merchant"
                  arrow
                >
                  <IconButton
                    size="small"
                    color="secondary"
                    onClick={() => window.open(buildSwitchUrl(store.accessCode), '_blank')}
                  >
                    <Web fontSize="small" />
                  </IconButton>
                </Tooltip>

                {/* ✅ Details -> opens Tech Modal */}
                <Tooltip
                  title="Ficha técnica"
                  arrow
                >
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => openTech(store)}
                  >
                    <AccountCircle fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Box>
          </Card>
        );
      })}
    </Stack>
  );

  if (loading) {
    return (
      <Card variant="outlined" sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {['Store', 'Customers', 'Weekly', 'Balance', 'Installments', 'Status', 'Method', ''].map((h) => (
                <TableCell key={h} sx={{ py: 1 }}>
                  <Skeleton variant="text" width={h ? '80%' : 40} height={16} />
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.from({ length: 8 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton variant="rectangular" width={180} height={32} sx={{ borderRadius: 1 }} /></TableCell>
                {Array.from({ length: 6 }).map((__, j) => (
                  <TableCell key={j}><Skeleton variant="text" width="70%" height={16} /></TableCell>
                ))}
                <TableCell><Skeleton variant="circular" width={28} height={28} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    );
  }

  if (error) {
    return (
      <Card
        variant="outlined"
        sx={{ p: 3, borderRadius: 2.5 }}
      >
        <Typography color="error">{error}</Typography>
      </Card>
    );
  }

  if (!stores.length) {
    return (
      <Card
        variant="outlined"
        sx={{ p: 4, borderRadius: 2.5 }}
      >
        <Typography
          align="center"
          color="text.secondary"
          fontWeight={800}
        >
          No stores found
        </Typography>
      </Card>
    );
  }

  return (
    <>
      {isMobile ? (
        <MobileList />
      ) : (
        <Card>
          {fetching && !loading && (
            <Box sx={{ height: 2, bgcolor: 'primary.main', opacity: 0.5, transition: 'opacity 0.3s' }} />
          )}
          <TableContainer>
            <Table
              size="small"
              sx={{
                tableLayout: 'fixed',
                width: '100%',
                '& th, & td': { whiteSpace: 'nowrap' },

                // STORE
                '& th:nth-of-type(1), & td:nth-of-type(1)': { width: '26%' },
                // CUSTOMERS
                '& th:nth-of-type(2), & td:nth-of-type(2)': { width: '6%' },
                // WEEKLY
                '& th:nth-of-type(3), & td:nth-of-type(3)': { width: '10%' },
                // BALANCE
                '& th:nth-of-type(4), & td:nth-of-type(4)': { width: '13%' },
                // INSTALLMENTS
                '& th:nth-of-type(5), & td:nth-of-type(5)': { width: '11%' },
                // PAYMENT STATUS
                '& th:nth-of-type(6), & td:nth-of-type(6)': { width: '12%' },
                // PAYMENT METHOD
                '& th:nth-of-type(7), & td:nth-of-type(7)': { width: '10%' },
                // ACTIONS
                '& th:nth-of-type(8), & td:nth-of-type(8)': { width: '12%' },
              }}
            >
              <TableHead>
                <TableRow sx={{ '& th': { fontSize: 11, fontWeight: 700, color: 'text.secondary', letterSpacing: '0.05em', py: 1 } }}>
                  <TableCell>
                    <TableSortLabel
                      active={sortBy === 'name'}
                      direction={sortBy === 'name' ? order : 'asc'}
                      onClick={() => onSortChange('name')}
                    >
                      STORE
                    </TableSortLabel>
                  </TableCell>

                  <TableCell>
                    <TableSortLabel
                      active={sortBy === 'customerCount'}
                      direction={sortBy === 'customerCount' ? order : 'asc'}
                      onClick={() => onSortChange('customerCount')}
                    >
                      CUSTOMERS
                    </TableSortLabel>
                  </TableCell>

                  <TableCell align="right">WEEKLY</TableCell>
                  <TableCell align="right">BALANCE</TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={sortBy === 'maxDaysOverdue'}
                      direction={sortBy === 'maxDaysOverdue' ? order : 'asc'}
                      onClick={() => onSortChange('maxDaysOverdue')}
                    >
                      CUOTAS
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="center">ESTADO</TableCell>
                  <TableCell align="center">PAGO</TableCell>
                  <TableCell align="center">ACCIONES</TableCell>
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

                  const tone = paymentTone(pending, installmentsNeeded);
                  const payMethod = paymentMethodLabel(store.paymentMethod);

                  return (
                    <TableRow
                      key={id}
                      hover
                    >
                      {/* STORE */}
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <LogoImg src={store.image} />
                          <Box sx={{ minWidth: 0 }}>
                            <Link
                              href={`/admin/management/stores/edit/${id}`}
                              style={{ textDecoration: 'none', color: 'inherit' }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
                                <Typography
                                  variant="subtitle1"
                                  fontWeight={900}
                                  sx={{
                                    fontSize: 15,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    maxWidth: 260,
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {displayName}
                                </Typography>

                                <ActiveBadge active={!!store.active} />
                              </Box>
                            </Link>

                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                fontSize: 12,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: 280,
                                whiteSpace: 'nowrap',
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
                          fontWeight={900}
                          color={weeklyCost > 0 ? 'primary.main' : 'text.secondary'}
                        >
                          {formatMoney(weeklyCost)}
                        </Typography>
                      </TableCell>

                      {/* Balance */}
                      <TableCell align="right">
                        <Typography
                          fontWeight={900}
                          color={pending > 0 ? 'error.main' : 'success.main'}
                        >
                          {formatMoney(pending)}
                        </Typography>
                      </TableCell>

                      {/* Installments */}
                      <TableCell
                        align="right"
                        sx={{ position: 'relative' }}
                      >
                        <Typography fontWeight={900}>
                          {installmentsLabel(pending, installmentsNeeded)}
                        </Typography>
                      </TableCell>

                      {/* Payment status */}
                      <TableCell align="center">
                        <Chip
                          size="small"
                          label={toneLabel(tone)}
                          color={toneChipColor(tone)}
                          variant={tone === 'critical' ? 'filled' : 'outlined'}
                          sx={{ fontSize: 10, fontWeight: 800, height: 20, letterSpacing: 0.4, '& .MuiChip-label': { px: 0.75 } }}
                        />
                      </TableCell>

                      {/* Payment method */}
                      <TableCell align="center">
                        <Stack
                          spacing={0.5}
                          alignItems="center"
                        >
                          <Tooltip
                            title={payMethod}
                            arrow
                          >
                            <Chip
                              size="small"
                              icon={<PaymentsRounded sx={{ fontSize: 16 }} />}
                              label={payMethod}
                              variant="outlined"
                              sx={{
                                height: 24,
                                fontSize: 11,
                                fontWeight: 900,
                                '& .MuiChip-label': { px: 0.75 },
                              }}
                            />
                          </Tooltip>
                        </Stack>
                      </TableCell>

                      {/* Actions */}
                      <TableCell align="center">
                        <Tooltip
                          title="View"
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
                          title="Merchant"
                          arrow
                        >
                          <IconButton
                            color="secondary"
                            onClick={() => window.open(buildSwitchUrl(store.accessCode), '_blank')}
                          >
                            <Web fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        {/* ✅ Details -> opens Tech Modal */}
                        <Tooltip
                          title="Ficha técnica"
                          arrow
                        >
                          <IconButton
                            color="primary"
                            onClick={() => openTech(store)}
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
      )}

      <Box p={2}>
        <TablePagination
          component="div"
          count={total}
          page={page}
          rowsPerPage={limit}
          onPageChange={(_, newPage) => onPageChange(newPage)}
          onRowsPerPageChange={onLimitChange}
          rowsPerPageOptions={rowsPerPageOptions}
        />
      </Box>

      {/* ✅ Modal mounted once */}
      {techStore ? (
        <StoreTechModal
          open={techOpen}
          onClose={closeTech}
          storeId={techStore.id}
          storeSlug={techStore.slug}
          storeName={techStore.name}
          storeImage={techStore.image}
          audience={techStore.audience}
          email={techStore.email}
          phone={techStore.phone}
          lng={techStore.lng}
          lat={techStore.lat}
          startContractDate={techStore.startContractDate}
          address={techStore.address}
          equipment={techStore.equipment}
          contactInfo={techStore.contactInfo}
        />
      ) : null}
    </>
  );
};

export default Results;
