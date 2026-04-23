'use client';

import { User } from '@/contexts/auth/user';
import ClearRoundedIcon from '@mui/icons-material/ClearRounded';
import DeleteTwoToneIcon from '@mui/icons-material/DeleteTwoTone';
import GridViewTwoToneIcon from '@mui/icons-material/GridViewTwoTone';
import LaunchTwoToneIcon from '@mui/icons-material/LaunchTwoTone';
import MoreVertTwoToneIcon from '@mui/icons-material/MoreVertTwoTone';
import GroupWorkRoundedIcon from '@mui/icons-material/GroupWorkRounded';
import SearchTwoToneIcon from '@mui/icons-material/SearchTwoTone';
import TableRowsTwoToneIcon from '@mui/icons-material/TableRowsTwoTone';
import {
  alpha,
  Avatar,
  Box,
  Card,
  Checkbox,
  Chip,
  Unstable_Grid2 as Grid,
  IconButton,
  InputAdornment,
  Link,
  MenuItem,
  Select,
  Stack,
  styled,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';

import React, {
  ChangeEvent,
  FC,
  MouseEvent,
  SyntheticEvent,
  useEffect,
  useMemo,
  useState
} from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { TabsShadow } from 'src/components/base/styles/tabs';
import BulkDelete from './bulk-delete';

/**
 * RESULTS (Users listing)
 * - Role normalization & dynamic tabs
 * - Safe search (no toLowerCase on undefined)
 * - Export to XLSX via CustomEvent('users-export')
 */

// ---------- Styles ----------
export const CardWrapper = styled(Card)(
  ({ theme }) => `
  position: relative;
  overflow: visible;
  transition: box-shadow 0.25s ease, transform 0.2s ease;
  border: 1px solid ${theme.palette.divider};
  border-radius: 16px;

  &:hover {
    box-shadow: 0 8px 32px ${alpha(theme.palette.common.black, 0.12)};
    transform: translateY(-2px);
  }

  &::after {
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    border-radius: inherit;
    z-index: 1;
    pointer-events: none;
  }

  &.Mui-selected::after {
    box-shadow: 0 0 0 3px ${theme.palette.primary.main};
  }
`
);

// ---------- Avatar color helper ----------
const AVATAR_COLORS = [
  '#6C63FF', '#FF6584', '#43A8D0', '#F7B731', '#26de81',
  '#FC5C65', '#45AAF2', '#FD9644', '#2BCB9B', '#A55EEA',
];
const getAvatarColor = (id = '') => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
};
const getInitials = (u: any) => {
  const f = u.firstName?.[0] ?? '';
  const l = u.lastName?.[0] ?? '';
  return (f + l).toUpperCase() || '?';
};

// ---------- Tipos ----------
interface ResultsProps {
  users: User[];
  onEditUser?: (user: any) => void;
  onAssignDepartment?: (user: any) => void;
}

interface Filters {
  role: string | null;
}

interface UITabItem {
  value: string;
  label: string;
  count: number;
}

// ---------- Helpers de rol ----------
const normalizeRole = (r?: string) =>
  (r ?? '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/-/g, '_');

const ROLE_ALIAS: Record<string, string> = {
  promotorowner: 'promotor_owner',
  promotor_manager: 'promotor_owner',
  promoter: 'promotor',
  promoters: 'promotor',
  gm: 'general_manager',
  merchant_manager: 'merchant_manager'
};

const getRoleKey = (raw?: string) => {
  const norm = normalizeRole(raw);
  return ROLE_ALIAS[norm] ?? norm;
};

// Singular chip meta
const ROLE_META: Record<
  string,
  {
    text: string;
    color:
    | 'primary'
    | 'secondary'
    | 'default'
    | 'info'
    | 'success'
    | 'warning'
    | 'error';
  }
> = {
  admin: { text: 'Administrator', color: 'error' },
  merchant: { text: 'Merchant', color: 'info' },
  promotor: { text: 'Promotor', color: 'warning' },
  promotor_owner: { text: 'Promotor Owner', color: 'warning' },
  cashier: { text: 'Cashier', color: 'secondary' },
  general_manager: { text: 'General Manager', color: 'success' },
  merchant_manager: { text: 'Merchant Manager', color: 'info' },
  design: { text: 'Design', color: 'primary' },
  campaign_manager: { text: 'Campaign Manager', color: 'success' },
  promotor_manager: { text: 'Promotor Manager', color: 'warning' },
  marketing: { text: 'Marketing', color: 'primary' },
};

// Tabs plural labels
const ROLE_TABS_LABEL: Record<string, string> = {
  admin: 'Administrators',
  merchant: 'Merchants',
  promotor: 'Promotors',
  promotor_owner: 'Promotor Owners',
  cashier: 'Cashiers',
  general_manager: 'General Managers',
  merchant_manager: 'Merchant Managers',
  marketing: 'Marketing'
};

const toTitle = (k: string) =>
  k
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

// ---------- Helpers de UI ----------
const getUserRoleLabel = (userRole?: string): React.JSX.Element => {
  const roleKey = getRoleKey(userRole);
  const item =
    ROLE_META[roleKey] ?? {
      text: roleKey ? toTitle(roleKey) : 'Unknown',
      color: 'default'
    };

  return (
    <Chip
      color={item.color}
      label={item.text}
    />
  );
};

// Convert to safe string for search
const normalizeVal = (v: unknown): string => {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (Array.isArray(v)) return v.map(normalizeVal).join(' ');
  try {
    return JSON.stringify(v);
  } catch {
    return '';
  }
};

// Filters (role + query)
const applyFilters = (
  users: User[],
  query: string,
  filters: Filters
): User[] => {
  const q = (query ?? '').toLowerCase();

  return users.filter((user) => {
    if (filters.role && getRoleKey(user.role) !== filters.role) return false;

    if (!q) return true;

    const properties: Array<keyof User | string> = [
      'email',
      'name',
      'firstName',
      'lastName'
    ];
    for (const property of properties) {
      const val = (user as any)?.[property];
      const text = Array.isArray(val) ? val.join(' ') : normalizeVal(val);
      if (text.toLowerCase().includes(q)) return true;
    }
    return false;
  });
};

const applyPagination = (
  users: User[],
  page: number,
  limit: number
): User[] => {
  return users.slice(page * limit, page * limit + limit);
};

// Build plain rows for XLSX export
const buildExportRows = (rows: User[]) =>
  rows.map((u) => {
    const roleKey = getRoleKey(u.role);
    const roleLabel = ROLE_META[roleKey]?.text ?? toTitle(roleKey || '');
    const isMerchant = roleKey === 'merchant';

    return {
      ID: (u as any).id ?? '',
      Nombre: `${(u as any).firstName ?? ''} ${(u as any).lastName ?? ''}`.trim(),
      Email: (u as any).email ?? '',
      Rol: roleLabel,
      Username: isMerchant
        ? (u as any).phoneNumber ?? ''
        : (u as any).firstName ?? '',
      AccessCode: isMerchant ? (u as any).accessCode ?? '' : ''
    };
  });

const Results: FC<ResultsProps> = ({ users, onEditUser, onAssignDepartment }) => {
  const [selectedItems, setSelectedUsers] = useState<string[]>([]);
  const { t } = useTranslation();
  const theme = useTheme();
  const smUp = useMediaQuery(theme.breakpoints.up('sm'));
  const router = useRouter();

  // Dynamic counts
  const roleCounts = useMemo(() => {
    const acc: Record<string, number> = {};
    users.forEach((u) => {
      const k = getRoleKey((u as any)?.role);
      if (!k) return;
      acc[k] = (acc[k] ?? 0) + 1;
    });
    return acc;
  }, [users]);

  const ROLE_ORDER = [
    'admin',
    'merchant_manager',
    'merchant',
    'promotor_owner',
    'promotor',
    'general_manager',
    'cashier',
    'marketing'
  ];

  const tabs: UITabItem[] = useMemo(() => {
    const unknownAfter = Object.keys(roleCounts).filter(
      (k) => !ROLE_ORDER.includes(k)
    );
    const keys = [...ROLE_ORDER, ...unknownAfter];

    return [
      {
        value: 'all',
        label: t('All users'),
        count: users.length
      },
      ...keys.map((k) => ({
        value: k,
        label: t(ROLE_TABS_LABEL[k] ?? toTitle(ROLE_META[k]?.text ?? k)),
        count: roleCounts[k] ?? 0
      }))
    ];
  }, [users.length, roleCounts, t]);

  const [page, setPage] = useState<number>(0);
  const [limit, setLimit] = useState<number>(10);
  const [query, setQuery] = useState<string>('');
  const [filters, setFilters] = useState<Filters>({ role: null });

  const handleTabsChange = (
    _event: SyntheticEvent,
    tabsValue: unknown
  ) => {
    const value = tabsValue === 'all' ? null : (tabsValue as string);
    setFilters((prev) => ({ ...prev, role: value }));
    setSelectedUsers([]);
    setPage(0);
  };

  const handleSelectChange = (
    event: ChangeEvent<{ value: unknown }>
  ) => {
    const selectedValue = event.target.value as string;
    setFilters((prev) => ({
      ...prev,
      role: selectedValue === 'all' ? null : selectedValue
    }));
    setSelectedUsers([]);
    setPage(0);
  };

  const handleQueryChange = (
    event: ChangeEvent<HTMLInputElement>
  ): void => {
    event.persist();
    setQuery(event.target.value);
    setPage(0);
  };

  const handleSelectAllUsers = (
    event: ChangeEvent<HTMLInputElement>
  ): void => {
    setSelectedUsers(
      event.target.checked ? users.map((user: any) => user.id) : []
    );
  };

  const handleSelectOneUser = (
    _event: ChangeEvent<HTMLInputElement>,
    userId: string
  ): void => {
    if (!selectedItems.includes(userId)) {
      setSelectedUsers((prevSelected) => [...prevSelected, userId]);
    } else {
      setSelectedUsers((prevSelected) =>
        prevSelected.filter((id) => id !== userId)
      );
    }
  };

  const handlePageChange = (
    _event: any,
    newPage: number
  ): void => {
    setPage(newPage);
  };

  const handleLimitChange = (
    event: ChangeEvent<HTMLInputElement>
  ): void => {
    setLimit(parseInt(event.target.value));
  };

  const filteredUsers = applyFilters(users, query, filters);
  const paginatedUsers = applyPagination(filteredUsers, page, limit);
  const selectedBulkActions = selectedItems.length > 0;
  const selectedSomeUsers =
    selectedItems.length > 0 && selectedItems.length < users.length;
  const selectedAllUsers = selectedItems.length === users.length;

  const [toggleView, setToggleView] = useState<string | null>('grid_view');

  const handleViewOrientation = (
    _event: MouseEvent<HTMLElement>,
    newValue: string | null
  ) => {
    setToggleView(newValue);
  };

  const handleExport = async (
    mode: 'filtered' | 'page' | 'selected' | 'all' = 'filtered'
  ) => {
    const rows =
      mode === 'page'
        ? paginatedUsers
        : mode === 'selected'
          ? users.filter((u: any) => selectedItems.includes(u.id))
          : mode === 'all'
            ? users
            : filteredUsers;

    const data = buildExportRows(rows as any);
    const XLSX = await import('xlsx');
    const ws = (XLSX.utils as any).json_to_sheet(data);
    const wb = (XLSX.utils as any).book_new();
    (XLSX.utils as any).book_append_sheet(wb, ws, 'Users');
    const today = new Date().toISOString().slice(0, 10);
    (XLSX as any).writeFile(wb, `users_${mode}_${today}.xlsx`);
  };

  useEffect(() => {
    const listener = (e: any) => {
      const mode = e?.detail?.mode || 'filtered';
      handleExport(mode);
    };
    window.addEventListener('users-export', listener);
    return () => window.removeEventListener('users-export', listener);
  }, [filteredUsers, paginatedUsers, selectedItems, users]);

  return (
    <>
      <Card
        elevation={0}
        sx={{
          mb: 3,
          px: 1,
          background: 'transparent',
          border: 'none',
        }}
      >
        <Box
          sx={{
            py: 1,
            px: 0.5,
            bgcolor: alpha(theme.palette.background.paper, 0.4),
            borderRadius: 3,
            border: `1px solid ${theme.palette.divider}`,
            backdropFilter: 'blur(8px)',
          }}
        >
          {smUp ? (
            <TabsShadow
              sx={{
                minHeight: 40,
                '& .MuiTabs-indicator': { display: 'none' },
                '& .MuiTabs-flexContainer': { gap: 0.5 },
                '& .MuiTab-root': {
                  minHeight: 34,
                  py: 0.5,
                  px: 1.5,
                  borderRadius: 1.5,
                  textTransform: 'none',
                  fontWeight: 500,
                  fontSize: '0.85rem',
                  color: 'text.secondary',
                  transition: 'all 0.2s ease-in-out',
                  border: '1px solid transparent',
                  flexDirection: 'row',
                  gap: 1,
                  '&:hover': {
                    bgcolor: alpha(theme.palette.text.primary, 0.04),
                    color: 'text.primary',
                  },
                  '&.Mui-selected': {
                    bgcolor: theme.palette.background.paper,
                    color: 'primary.main',
                    boxShadow: `0 1px 4px ${alpha(theme.palette.common.black, 0.06)}`,
                    border: `1px solid ${theme.palette.divider}`,
                    fontWeight: 600,
                    '& .MuiChip-root': {
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                      color: 'primary.main',
                      fontWeight: 700,
                    }
                  },
                  '& .MuiChip-root': {
                    height: 20,
                    fontSize: '0.7rem',
                    minWidth: 24,
                    bgcolor: alpha(theme.palette.action.disabledBackground, 0.3),
                    color: 'text.secondary',
                    transition: 'all 0.2s',
                  }
                }
              }}
              onChange={handleTabsChange}
              scrollButtons="auto"
              value={filters.role || 'all'}
              variant="scrollable"
            >
              {tabs.map((tab) => (
                <Tab
                  key={tab.value}
                  value={tab.value}
                  label={
                    <>
                      {tab.label}
                      <Chip
                        label={tab.count}
                        size="small"
                      />
                    </>
                  }
                />
              ))}
            </TabsShadow>
          ) : (
            <Box px={1.5} pb={1.5}>
              <Select
                value={(filters.role || 'all') as any}
                onChange={handleSelectChange as any}
                fullWidth
                size="small"
              >
                {tabs.map((tab) => (
                  <MenuItem key={tab.value} value={tab.value}>
                    {tab.label} ({tab.count})
                  </MenuItem>
                ))}
              </Select>
            </Box>
          )}
        </Box>
      </Card>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        py={2}
      >
        <Box
          display="flex"
          alignItems="center"
        >
          {toggleView === 'grid_view' && (
            <Tooltip
              arrow
              placement="top"
              title={'Select all users'}
            >
              <Checkbox
                edge="start"
                sx={{ mr: 1 }}
                disabled={paginatedUsers.length === 0}
                checked={selectedAllUsers}
                indeterminate={selectedSomeUsers}
                onChange={handleSelectAllUsers}
              />
            </Tooltip>
          )}

          {selectedBulkActions ? (
            <Stack
              direction="row"
              spacing={1}
            >
              <BulkDelete />
            </Stack>
          ) : (
            <TextField
              margin="none"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchTwoToneIcon />
                  </InputAdornment>
                ),
                endAdornment: query && (
                  <InputAdornment
                    sx={{ mr: -0.7 }}
                    position="end"
                  >
                    <IconButton
                      color="error"
                      aria-label="clear input"
                      onClick={() => setQuery('')}
                      edge="end"
                      size="small"
                      sx={{ color: 'error.main' }}
                    >
                      <ClearRoundedIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                )
              }}
              onChange={handleQueryChange}
              placeholder={'Filter results'}
              value={query}
              size="small"
              variant="outlined"
            />
          )}
        </Box>

        <ToggleButtonGroup
          sx={{ ml: 1 }}
          size="large"
          color="primary"
          value={toggleView}
          exclusive
          onChange={handleViewOrientation}
        >
          <ToggleButton value="table_view">
            <TableRowsTwoToneIcon />
          </ToggleButton>
          <ToggleButton value="grid_view">
            <GridViewTwoToneIcon />
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {paginatedUsers.length === 0 ? (
        <Typography
          sx={{ py: { xs: 2, sm: 3, md: 6, lg: 10 } }}
          variant="h3"
          color="text.secondary"
          align="center"
          fontWeight={500}
        >
          {"We couldn't find any users matching your search criteria"}
        </Typography>
      ) : (
        <>
          {toggleView === 'table_view' && (
            <>
              <Card>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedAllUsers}
                            indeterminate={selectedSomeUsers}
                            onChange={handleSelectAllUsers}
                          />
                        </TableCell>
                        <TableCell>
                          Username
                        </TableCell>
                        <TableCell>
                          Name
                        </TableCell>
                        <TableCell>
                          Email
                        </TableCell>
                        <TableCell>
                          Role
                        </TableCell>
                        <TableCell>
                          Department
                        </TableCell>
                        <TableCell align="center">
                          Actions
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedUsers.map((user: any) => {
                        const isUserSelected = selectedItems.includes(user.id);
                        const roleKey = getRoleKey(user.role);
                        const username =
                          roleKey === 'merchant'
                            ? user.phoneNumber || user.firstName
                            : user.firstName;
                        const emailDisplay = user.email || '';

                        return (
                          <TableRow
                            hover
                            key={user._id}
                            selected={isUserSelected}
                          >
                            <TableCell padding="checkbox">
                              <Checkbox
                                checked={isUserSelected}
                                onChange={(event) =>
                                  handleSelectOneUser(event as any, user.id)
                                }
                                value={isUserSelected}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography fontWeight={400}>
                                {username}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Box
                                display="flex"
                                alignItems="center"
                              >
                                <Avatar
                                  variant="rounded"
                                  sx={{ mr: 1 }}
                                  src={user.avatar}
                                />
                                <Box>
                                  <Link
                                    variant="subtitle1"
                                    fontWeight={500}
                                    href=""
                                    onClick={(e) => e.preventDefault()}
                                    underline="hover"
                                  >
                                    {user.firstName}
                                  </Link>
                                  <Typography
                                    noWrap
                                    variant="subtitle2"
                                    color="text.secondary"
                                  >
                                    {user.role}
                                  </Typography>
                                  {roleKey === 'merchant' && user.accessCode && (
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      sx={{ display: 'block', mt: 0.3 }}
                                    >
                                      Access code: {user.accessCode}
                                    </Typography>
                                  )}
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Tooltip title={emailDisplay}>
                                <Typography
                                  noWrap
                                  sx={{ maxWidth: 220 }}
                                >
                                  {emailDisplay}
                                </Typography>
                              </Tooltip>
                            </TableCell>
                            <TableCell>
                              {getUserRoleLabel(user.role)}
                            </TableCell>
                            <TableCell>
                              {user.department ? (
                                <Chip
                                  label={user.department.name || user.departmentId}
                                  size="small"
                                  sx={{
                                    bgcolor: alpha(user.department.color || '#666', 0.12),
                                    color: user.department.color || 'text.primary',
                                    fontWeight: 600,
                                    fontSize: 11,
                                    borderRadius: 1,
                                    border: `1px solid ${alpha(user.department.color || '#666', 0.2)}`,
                                  }}
                                />
                              ) : (
                                <Typography variant="caption" color="text.disabled">—</Typography>
                              )}
                            </TableCell>
                            <TableCell align="center">
                              <Typography noWrap>
                                <Tooltip
                                  title={'View Profile'}
                                  arrow
                                >
                                  <IconButton color="secondary" onClick={() => router.push(`/admin/management/users-profile?id=${user._id || user.id}`)}>
                                    <LaunchTwoToneIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip
                                  title={'Delete'}
                                  arrow
                                >
                                  <IconButton color="secondary">
                                    <DeleteTwoToneIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Typography>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>

              <Box
                pt={2}
                sx={{ '.MuiTablePagination-select': { py: 0.55 } }}
              >
                <TablePagination
                  component="div"
                  count={filteredUsers.length}
                  onPageChange={handlePageChange}
                  onRowsPerPageChange={handleLimitChange}
                  page={page}
                  rowsPerPage={limit}
                  rowsPerPageOptions={[5, 10, 15]}
                  slotProps={{
                    select: {
                      variant: 'outlined',
                      size: 'small',
                      sx: { p: 0 }
                    }
                  }}
                />
              </Box>
            </>
          )}

          {toggleView === 'grid_view' && (
            <>
              <Grid container
                spacing={{ xs: 2, sm: 3 }}
              >
                {paginatedUsers.map((user: any) => {
                  const isUserSelected = selectedItems.includes(user.id);
                  const roleKey = getRoleKey(user.role);
                  const accentColor = getAvatarColor(user.id || user._id || '');
                  const initials = getInitials(user);
                  const isMerchant = roleKey === 'merchant';
                  const contactLine = user.email || user.phoneNumber || '';

                  return (
                    <Grid xs={12} sm={6} lg={4} key={user._id}>
                      <CardWrapper className={isUserSelected ? 'Mui-selected' : ''} elevation={0}>
                        <Box sx={{ position: 'relative', zIndex: 2 }}>

                          {/* ── Top bar: role chip + actions ── */}
                          <Box
                            px={2} pt={1.5} pb={0}
                            display="flex"
                            alignItems="center"
                            justifyContent="space-between"
                          >
                            {getUserRoleLabel(user.role)}
                            <Stack direction="row" spacing={0.5}>
                              <Tooltip title="Assign Department" arrow>
                                <IconButton
                                  size="small"
                                  sx={{
                                    color: 'text.secondary',
                                    '&:hover': { color: '#9C27B0', bgcolor: alpha('#9C27B0', 0.08) },
                                  }}
                                  onClick={() => onAssignDepartment?.(user)}
                                >
                                  <GroupWorkRoundedIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="View Profile" arrow>
                                <IconButton
                                  size="small"
                                  sx={{
                                    color: 'text.secondary',
                                    '&:hover': { color: accentColor, bgcolor: alpha(accentColor, 0.08) },
                                  }}
                                  onClick={() => router.push(`/admin/management/users-profile?id=${user._id || user.id}`)}
                                >
                                  <LaunchTwoToneIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="More" arrow>
                                <IconButton size="small" sx={{ color: 'text.disabled' }}>
                                  <MoreVertTwoToneIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </Box>

                          {/* ── Avatar + Name block ── */}
                          <Box px={2} pt={1.5} pb={2} display="flex" alignItems="center" gap={1.5}>
                            <Avatar
                              src={user.avatar}
                              sx={{
                                width: 52,
                                height: 52,
                                bgcolor: accentColor,
                                fontSize: 18,
                                fontWeight: 700,
                                flexShrink: 0,
                                boxShadow: `0 4px 14px ${alpha(accentColor, 0.4)}`,
                              }}
                            >
                              {initials}
                            </Avatar>

                            <Box minWidth={0} flex={1}>
                              <Typography variant="subtitle1" fontWeight={700} noWrap>
                                {user.firstName}{user.lastName ? ` ${user.lastName}` : ''}
                              </Typography>
                              <Tooltip title={contactLine}>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  noWrap
                                  sx={{ maxWidth: '100%' }}
                                >
                                  {contactLine || '—'}
                                </Typography>
                              </Tooltip>
                              {user.department && (
                                <Chip
                                  label={user.department.name}
                                  size="small"
                                  sx={{
                                    mt: 0.5,
                                    height: 20,
                                    bgcolor: alpha(user.department.color || '#666', 0.12),
                                    color: user.department.color || 'text.primary',
                                    fontWeight: 600,
                                    fontSize: 10,
                                    borderRadius: 0.75,
                                    border: `1px solid ${alpha(user.department.color || '#666', 0.2)}`,
                                  }}
                                />
                              )}
                            </Box>
                          </Box>

                          {/* ── Footer: access code / phone badges ── */}
                          {(isMerchant && (user.phoneNumber || user.accessCode)) && (
                            <Box
                              px={2} pb={1.5}
                              display="flex"
                              flexWrap="wrap"
                              gap={0.75}
                              sx={{
                                borderTop: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                                pt: 1,
                              }}
                            >
                              {user.phoneNumber && (
                                <Chip
                                  label={user.phoneNumber}
                                  size="small"
                                  variant="outlined"
                                  sx={{ fontSize: 11, borderRadius: 1 }}
                                />
                              )}
                              {user.accessCode && (
                                <Chip
                                  label={`Code: ${user.accessCode}`}
                                  size="small"
                                  color="primary"
                                  sx={{ fontSize: 11, borderRadius: 1 }}
                                />
                              )}
                            </Box>
                          )}

                        </Box>
                      </CardWrapper>
                    </Grid>
                  );
                })}
              </Grid>

              <Card
                sx={{
                  p: 2,
                  mt: 3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  '.MuiTablePagination-select': { py: 0.55 }
                }}
              >
                <Box>
                  <Typography
                    component="span"
                    variant="subtitle1">
                    {'Showing'}
                  </Typography>{' '}
                  <b>{limit}</b> {'of'} <b>{filteredUsers.length}</b>{' '}
                  <b>{'users'}</b>
                </Box>
                <TablePagination
                  component="div"
                  count={filteredUsers.length}
                  onPageChange={handlePageChange}
                  onRowsPerPageChange={handleLimitChange}
                  page={page}
                  rowsPerPage={limit}
                  labelRowsPerPage=""
                  rowsPerPageOptions={[5, 10, 15]}
                  slotProps={{
                    select: {
                      variant: 'outlined',
                      size: 'small',
                      sx: { p: 0 }
                    }
                  }}
                />
              </Card>
            </>
          )}

        </>
      )}
    </>
  );
};


export default Results;
