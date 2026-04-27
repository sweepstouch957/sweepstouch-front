'use client';

import { User } from '@/contexts/auth/user';
import AdminPanelSettingsRoundedIcon from '@mui/icons-material/AdminPanelSettingsRounded';
import ClearRoundedIcon from '@mui/icons-material/ClearRounded';
import DeleteTwoToneIcon from '@mui/icons-material/DeleteTwoTone';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import GridViewTwoToneIcon from '@mui/icons-material/GridViewTwoTone';
import GroupWorkRoundedIcon from '@mui/icons-material/GroupWorkRounded';
import LaunchTwoToneIcon from '@mui/icons-material/LaunchTwoTone';
import MoreVertTwoToneIcon from '@mui/icons-material/MoreVertTwoTone';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import PhoneRoundedIcon from '@mui/icons-material/PhoneRounded';
import RecordVoiceOverRoundedIcon from '@mui/icons-material/RecordVoiceOverRounded';
import SearchTwoToneIcon from '@mui/icons-material/SearchTwoTone';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
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
  useTheme,
  Theme,
} from '@mui/material';
import React, {
  ChangeEvent,
  FC,
  MouseEvent,
  SyntheticEvent,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { TabsShadow } from 'src/components/base/styles/tabs';
import BulkDelete from './bulk-delete';

export const CardWrapper = styled(Card)(
  ({ theme }) => `
  position: relative;
  overflow: hidden;
  transition: box-shadow 0.25s ease, transform 0.2s ease;
  border: 1px solid ${theme.palette.divider};
  border-radius: 20px;
  &:hover {
    box-shadow: 0 8px 32px ${alpha(theme.palette.common.black, 0.12)};
    transform: translateY(-2px);
  }
`
);

// ---------- Role → palette ----------
const ROLE_PALETTE_KEY: Record<string, string> = {
  admin: 'error',
  merchant: 'info',
  promotor: 'warning',
  promotor_owner: 'warning',
  cashier: 'secondary',
  general_manager: 'success',
  merchant_manager: 'info',
  design: 'primary',
  campaign_manager: 'success',
  promotor_manager: 'warning',
  marketing: 'primary',
};

const getRolePalette = (roleKey: string, theme: Theme) => {
  const key = (ROLE_PALETTE_KEY[roleKey] ?? 'primary') as keyof typeof theme.palette;
  return (theme.palette[key] as any) ?? theme.palette.primary;
};

// ---------- Avatar helpers ----------
const AVATAR_COLORS = [
  '#6C63FF', '#FF6584', '#43A8D0', '#F7B731', '#26de81',
  '#FC5C65', '#45AAF2', '#FD9644', '#2BCB9B', '#A55EEA',
];
const getAvatarColor = (id = '') => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
};
const getInitials = (u: any) =>
  ((u.firstName?.[0] ?? '') + (u.lastName?.[0] ?? '')).toUpperCase() || '?';

// ---------- Types ----------
interface ResultsProps {
  users: User[];
  onEditUser?: (user: any) => void;
  onAssignDepartment?: (user: any) => void;
}
interface Filters { role: string | null }
interface UITabItem { value: string; label: string; count: number }

// ---------- Role helpers ----------
const normalizeRole = (r?: string) =>
  (r ?? '').toLowerCase().trim().replace(/\s+/g, '_').replace(/-/g, '_');

const ROLE_ALIAS: Record<string, string> = {
  promotorowner: 'promotor_owner',
  promotor_manager: 'promotor_owner',
  promoter: 'promotor',
  promoters: 'promotor',
  gm: 'general_manager',
  merchant_manager: 'merchant_manager',
};

const getRoleKey = (raw?: string) => {
  const norm = normalizeRole(raw);
  return ROLE_ALIAS[norm] ?? norm;
};

const ROLE_META: Record<
  string,
  { text: string; color: 'primary' | 'secondary' | 'default' | 'info' | 'success' | 'warning' | 'error' }
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

const ROLE_TABS_LABEL: Record<string, string> = {
  admin: 'Administrators',
  merchant: 'Merchants',
  promotor: 'Promotors',
  promotor_owner: 'Promotor Owners',
  cashier: 'Cashiers',
  general_manager: 'General Managers',
  merchant_manager: 'Merchant Managers',
  marketing: 'Marketing',
};

const toTitle = (k: string) =>
  k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const normalizeVal = (v: unknown): string => {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (Array.isArray(v)) return v.map(normalizeVal).join(' ');
  try { return JSON.stringify(v); } catch { return ''; }
};

const applyFilters = (users: User[], query: string, filters: Filters): User[] => {
  const q = (query ?? '').toLowerCase();
  return users.filter((user) => {
    if (filters.role && getRoleKey((user as any).role) !== filters.role) return false;
    if (!q) return true;
    for (const property of ['email', 'name', 'firstName', 'lastName']) {
      const val = (user as any)?.[property];
      const text = Array.isArray(val) ? val.join(' ') : normalizeVal(val);
      if (text.toLowerCase().includes(q)) return true;
    }
    return false;
  });
};

const applyPagination = (users: User[], page: number, limit: number): User[] =>
  users.slice(page * limit, page * limit + limit);

const buildExportRows = (rows: User[]) =>
  rows.map((u) => {
    const roleKey = getRoleKey((u as any).role);
    const roleLabel = ROLE_META[roleKey]?.text ?? toTitle(roleKey || '');
    const isMerchant = roleKey === 'merchant';
    return {
      ID: (u as any).id ?? '',
      Nombre: `${(u as any).firstName ?? ''} ${(u as any).lastName ?? ''}`.trim(),
      Email: (u as any).email ?? '',
      Rol: roleLabel,
      Username: isMerchant ? (u as any).phoneNumber ?? '' : (u as any).firstName ?? '',
      AccessCode: isMerchant ? (u as any).accessCode ?? '' : '',
    };
  });

// ---------- Stats row ----------
const StatsRow: FC<{ users: User[]; roleCounts: Record<string, number> }> = ({
  users,
  roleCounts,
}) => {
  const theme = useTheme();
  const stats = [
    { label: 'Total Users', value: users.length, icon: <PeopleAltRoundedIcon />, palette: theme.palette.primary },
    { label: 'Merchants', value: (roleCounts['merchant'] ?? 0) + (roleCounts['merchant_manager'] ?? 0), icon: <StorefrontRoundedIcon />, palette: theme.palette.info },
    { label: 'Promotors', value: (roleCounts['promotor'] ?? 0) + (roleCounts['promotor_owner'] ?? 0) + (roleCounts['promotor_manager'] ?? 0), icon: <RecordVoiceOverRoundedIcon />, palette: theme.palette.warning },
    { label: 'Admins', value: roleCounts['admin'] ?? 0, icon: <AdminPanelSettingsRoundedIcon />, palette: theme.palette.error },
  ];

  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {stats.map((s, i) => (
        <Grid key={i} xs={6} sm={3}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3, p: { xs: 1.5, sm: 2 }, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: alpha(s.palette.main, 0.1), color: s.palette.main, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {s.icon}
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={700} lineHeight={1.2}>{s.value}</Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={500}>{s.label}</Typography>
            </Box>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

// ---------- Main ----------
const Results: FC<ResultsProps> = ({ users, onEditUser, onAssignDepartment }) => {
  const [selectedItems, setSelectedUsers] = useState<string[]>([]);
  const { t } = useTranslation();
  const theme = useTheme();
  const smUp = useMediaQuery(theme.breakpoints.up('sm'));
  const router = useRouter();

  const roleCounts = useMemo(() => {
    const acc: Record<string, number> = {};
    users.forEach((u) => {
      const k = getRoleKey((u as any)?.role);
      if (!k) return;
      acc[k] = (acc[k] ?? 0) + 1;
    });
    return acc;
  }, [users]);

  const ROLE_ORDER = ['admin', 'merchant_manager', 'merchant', 'promotor_owner', 'promotor', 'general_manager', 'cashier', 'marketing'];

  const tabs: UITabItem[] = useMemo(() => {
    const unknownAfter = Object.keys(roleCounts).filter((k) => !ROLE_ORDER.includes(k));
    const keys = [...ROLE_ORDER, ...unknownAfter];
    return [
      { value: 'all', label: t('All users'), count: users.length },
      ...keys
        .filter((k) => (roleCounts[k] ?? 0) > 0)
        .map((k) => ({ value: k, label: t(ROLE_TABS_LABEL[k] ?? toTitle(ROLE_META[k]?.text ?? k)), count: roleCounts[k] ?? 0 })),
    ];
  }, [users.length, roleCounts, t]);

  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(12);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Filters>({ role: null });
  const [toggleView, setToggleView] = useState<string | null>('grid_view');

  const handleTabsChange = (_e: SyntheticEvent, v: unknown) => {
    setFilters((prev) => ({ ...prev, role: v === 'all' ? null : (v as string) }));
    setSelectedUsers([]);
    setPage(0);
  };
  const handleSelectChange = (e: ChangeEvent<{ value: unknown }>) => {
    const v = e.target.value as string;
    setFilters((prev) => ({ ...prev, role: v === 'all' ? null : v }));
    setSelectedUsers([]);
    setPage(0);
  };
  const handleQueryChange = (e: ChangeEvent<HTMLInputElement>) => { e.persist(); setQuery(e.target.value); setPage(0); };
  const handleSelectAllUsers = (e: ChangeEvent<HTMLInputElement>) => setSelectedUsers(e.target.checked ? users.map((u: any) => u.id) : []);
  const handleSelectOneUser = (_e: ChangeEvent<HTMLInputElement>, id: string) =>
    setSelectedUsers((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  const handlePageChange = (_e: any, p: number) => setPage(p);
  const handleLimitChange = (e: ChangeEvent<HTMLInputElement>) => setLimit(parseInt(e.target.value));
  const handleViewOrientation = (_e: MouseEvent<HTMLElement>, v: string | null) => setToggleView(v);

  const filteredUsers = applyFilters(users, query, filters);
  const paginatedUsers = applyPagination(filteredUsers, page, limit);
  const selectedBulkActions = selectedItems.length > 0;
  const selectedSomeUsers = selectedItems.length > 0 && selectedItems.length < users.length;
  const selectedAllUsers = selectedItems.length === users.length;

  const handleExport = async (mode: 'filtered' | 'page' | 'selected' | 'all' = 'filtered') => {
    const rows =
      mode === 'page' ? paginatedUsers
      : mode === 'selected' ? users.filter((u: any) => selectedItems.includes(u.id))
      : mode === 'all' ? users : filteredUsers;
    const data = buildExportRows(rows as any);
    const XLSX = await import('xlsx');
    const ws = (XLSX.utils as any).json_to_sheet(data);
    const wb = (XLSX.utils as any).book_new();
    (XLSX.utils as any).book_append_sheet(wb, ws, 'Users');
    (XLSX as any).writeFile(wb, `users_${mode}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  useEffect(() => {
    const listener = (e: any) => handleExport(e?.detail?.mode || 'filtered');
    window.addEventListener('users-export', listener);
    return () => window.removeEventListener('users-export', listener);
  }, [filteredUsers, paginatedUsers, selectedItems, users]);

  const tableHeaderCellSx = {
    fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase' as const,
    letterSpacing: '0.06em', color: 'text.secondary',
    bgcolor: alpha(theme.palette.background.default, 0.6), py: 1.25,
  };

  return (
    <>
      <StatsRow users={users} roleCounts={roleCounts} />

      {/* ── Role filter ── */}
      <Card elevation={0} sx={{ mb: 2.5, border: `1px solid ${theme.palette.divider}`, borderRadius: 3, overflow: 'hidden' }}>
        {smUp ? (
          <TabsShadow
            sx={{
              px: 1, minHeight: 50,
              '& .MuiTabs-indicator': { display: 'none' },
              '& .MuiTabs-flexContainer': { gap: 0.5, py: 0.75 },
              '& .MuiTab-root': {
                minHeight: 38, py: 0.5, px: 1.5, borderRadius: 2,
                textTransform: 'none', fontWeight: 500, fontSize: '0.82rem',
                color: 'text.secondary', transition: 'all 0.18s ease',
                flexDirection: 'row', gap: 0.75, minWidth: 'unset',
                '&:hover': { bgcolor: alpha(theme.palette.text.primary, 0.04), color: 'text.primary' },
              },
            }}
            onChange={handleTabsChange}
            scrollButtons="auto"
            value={filters.role || 'all'}
            variant="scrollable"
          >
            {tabs.map((tab) => {
              const rk = tab.value;
              const pal = rk === 'all' ? theme.palette.primary : getRolePalette(rk, theme);
              const isActive = (filters.role ?? 'all') === tab.value;
              return (
                <Tab
                  key={tab.value}
                  value={tab.value}
                  sx={isActive ? { bgcolor: alpha(pal.main, 0.08), color: `${pal.main} !important`, border: `1px solid ${alpha(pal.main, 0.2)}`, fontWeight: '700 !important' } : {}}
                  label={
                    <Box display="flex" alignItems="center" gap={0.75}>
                      {rk !== 'all' && (
                        <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: isActive ? pal.main : alpha(pal.main, 0.45), flexShrink: 0, transition: 'all 0.18s' }} />
                      )}
                      <span>{tab.label}</span>
                      <Box sx={{
                        px: 0.75, py: 0.1, borderRadius: 1, fontSize: '0.68rem',
                        fontWeight: isActive ? 700 : 500,
                        bgcolor: isActive ? alpha(pal.main, 0.12) : alpha(theme.palette.action.disabledBackground, 0.45),
                        color: isActive ? pal.main : 'text.secondary',
                        minWidth: 20, textAlign: 'center', lineHeight: 1.6, transition: 'all 0.18s',
                      }}>
                        {tab.count}
                      </Box>
                    </Box>
                  }
                />
              );
            })}
          </TabsShadow>
        ) : (
          <Box p={1.5}>
            <Select value={(filters.role || 'all') as any} onChange={handleSelectChange as any} fullWidth size="small">
              {tabs.map((tab) => <MenuItem key={tab.value} value={tab.value}>{tab.label} ({tab.count})</MenuItem>)}
            </Select>
          </Box>
        )}
      </Card>

      {/* ── Toolbar ── */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} gap={1}>
        <Box display="flex" alignItems="center" gap={1} flex={1} minWidth={0}>
          {toggleView === 'grid_view' && (
            <Tooltip arrow placement="top" title="Select all">
              <Checkbox edge="start" disabled={paginatedUsers.length === 0} checked={selectedAllUsers} indeterminate={selectedSomeUsers} onChange={handleSelectAllUsers} sx={{ p: 0.75 }} />
            </Tooltip>
          )}
          {selectedBulkActions ? (
            <Stack direction="row" spacing={1}><BulkDelete /></Stack>
          ) : (
            <TextField
              sx={{ maxWidth: 320 }} fullWidth margin="none"
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchTwoToneIcon fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment>,
                endAdornment: query && (
                  <InputAdornment sx={{ mr: -0.7 }} position="end">
                    <IconButton color="error" onClick={() => setQuery('')} edge="end" size="small"><ClearRoundedIcon fontSize="small" /></IconButton>
                  </InputAdornment>
                ),
                sx: { borderRadius: 2 },
              }}
              onChange={handleQueryChange}
              placeholder="Search users..."
              value={query}
              size="small"
            />
          )}
        </Box>
        <Box display="flex" alignItems="center" gap={1.5}>
          {filteredUsers.length > 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
              {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
            </Typography>
          )}
          <ToggleButtonGroup size="small" color="primary" value={toggleView} exclusive onChange={handleViewOrientation} sx={{ '& .MuiToggleButton-root': { py: 0.625, px: 1 } }}>
            <ToggleButton value="table_view"><TableRowsTwoToneIcon fontSize="small" /></ToggleButton>
            <ToggleButton value="grid_view"><GridViewTwoToneIcon fontSize="small" /></ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      {/* ── Empty state ── */}
      {paginatedUsers.length === 0 ? (
        <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3, py: { xs: 6, sm: 10 } }}>
          <Box textAlign="center">
            <Box sx={{ width: 64, height: 64, borderRadius: '50%', bgcolor: alpha(theme.palette.text.secondary, 0.08), display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
              <SearchTwoToneIcon sx={{ color: 'text.disabled', fontSize: 28 }} />
            </Box>
            <Typography variant="h6" color="text.secondary" fontWeight={500}>No users found</Typography>
            <Typography variant="body2" color="text.disabled" mt={0.5}>Try adjusting your search or filter criteria</Typography>
          </Box>
        </Card>
      ) : (
        <>
          {/* ── Table view ── */}
          {toggleView === 'table_view' && (
            <>
              <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3, overflow: 'hidden' }}>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox" sx={tableHeaderCellSx}>
                          <Checkbox checked={selectedAllUsers} indeterminate={selectedSomeUsers} onChange={handleSelectAllUsers} />
                        </TableCell>
                        <TableCell sx={tableHeaderCellSx}>User</TableCell>
                        <TableCell sx={tableHeaderCellSx}>Contact</TableCell>
                        <TableCell sx={tableHeaderCellSx}>Role</TableCell>
                        <TableCell sx={tableHeaderCellSx}>Department</TableCell>
                        <TableCell align="center" sx={tableHeaderCellSx}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedUsers.map((user: any) => {
                        const isUserSelected = selectedItems.includes(user.id);
                        const roleKey = getRoleKey(user.role);
                        const pal = getRolePalette(roleKey, theme);
                        const initials = getInitials(user);
                        const avatarColor = getAvatarColor(user.id || user._id || '');
                        const roleLabel = ROLE_META[roleKey]?.text ?? toTitle(roleKey || '');

                        return (
                          <TableRow hover key={user._id} selected={isUserSelected}
                            sx={{ '&.Mui-selected': { bgcolor: alpha(theme.palette.primary.main, 0.04) }, '& td': { borderColor: theme.palette.divider } }}>
                            <TableCell padding="checkbox">
                              <Checkbox checked={isUserSelected} onChange={(e) => handleSelectOneUser(e as any, user.id)} />
                            </TableCell>
                            <TableCell>
                              <Box display="flex" alignItems="center" gap={1.5}>
                                <Avatar src={user.avatar} sx={{ width: 40, height: 40, bgcolor: avatarColor, fontSize: 14, fontWeight: 700 }}>{initials}</Avatar>
                                <Box>
                                  <Typography variant="subtitle2" fontWeight={600}>{user.firstName}{user.lastName ? ` ${user.lastName}` : ''}</Typography>
                                  {roleKey === 'merchant' && user.accessCode && (
                                    <Typography variant="caption" color="text.secondary">Code: {user.accessCode}</Typography>
                                  )}
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>{user.email || '—'}</Typography>
                              {user.phoneNumber && <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{user.phoneNumber}</Typography>}
                            </TableCell>
                            <TableCell>
                              <Chip label={roleLabel} size="small" sx={{ bgcolor: alpha(pal.main, 0.1), color: pal.main, fontWeight: 600, fontSize: '0.72rem', borderRadius: 1.5, border: `1px solid ${alpha(pal.main, 0.2)}` }} />
                            </TableCell>
                            <TableCell>
                              {user.department ? (
                                <Chip label={user.department.name || user.departmentId} size="small"
                                  sx={{ bgcolor: alpha(user.department.color || '#666', 0.12), color: user.department.color || 'text.primary', fontWeight: 600, fontSize: 11, borderRadius: 1, border: `1px solid ${alpha(user.department.color || '#666', 0.2)}` }} />
                              ) : <Typography variant="caption" color="text.disabled">—</Typography>}
                            </TableCell>
                            <TableCell align="center">
                              <Stack direction="row" spacing={0.5} justifyContent="center">
                                <Tooltip title="Edit" arrow><IconButton size="small" onClick={() => onEditUser?.(user)} sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.08) } }}><EditRoundedIcon fontSize="small" /></IconButton></Tooltip>
                                <Tooltip title="View Profile" arrow><IconButton size="small" onClick={() => router.push(`/admin/management/users-profile?id=${user._id || user.id}`)} sx={{ color: 'text.secondary', '&:hover': { color: 'info.main', bgcolor: alpha(theme.palette.info.main, 0.08) } }}><LaunchTwoToneIcon fontSize="small" /></IconButton></Tooltip>
                                <Tooltip title="Assign Dept" arrow><IconButton size="small" onClick={() => onAssignDepartment?.(user)} sx={{ color: 'text.secondary', '&:hover': { color: '#9C27B0', bgcolor: alpha('#9C27B0', 0.08) } }}><GroupWorkRoundedIcon fontSize="small" /></IconButton></Tooltip>
                                <Tooltip title="Delete" arrow><IconButton size="small" sx={{ color: 'text.secondary', '&:hover': { color: 'error.main', bgcolor: alpha(theme.palette.error.main, 0.08) } }}><DeleteTwoToneIcon fontSize="small" /></IconButton></Tooltip>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
              <Box pt={2} sx={{ '.MuiTablePagination-select': { py: 0.55 } }}>
                <TablePagination component="div" count={filteredUsers.length} onPageChange={handlePageChange} onRowsPerPageChange={handleLimitChange} page={page} rowsPerPage={limit} rowsPerPageOptions={[5, 10, 15, 25]} slotProps={{ select: { variant: 'outlined', size: 'small', sx: { p: 0 } } }} />
              </Box>
            </>
          )}

          {/* ── Grid view ── */}
          {toggleView === 'grid_view' && (
            <>
              <Grid container spacing={{ xs: 2, sm: 2.5 }}>
                {paginatedUsers.map((user: any) => {
                  const isUserSelected = selectedItems.includes(user.id);
                  const roleKey = getRoleKey(user.role);
                  const pal = getRolePalette(roleKey, theme);
                  const initials = getInitials(user);
                  const avatarColor = getAvatarColor(user.id || user._id || '');
                  const isMerchant = roleKey === 'merchant';
                  const roleLabel = ROLE_META[roleKey]?.text ?? toTitle(roleKey || '');

                  return (
                    <Grid xs={12} sm={6} lg={4} key={user._id || user.id}>
                      <Card
                        elevation={0}
                        sx={{
                          borderRadius: '20px',
                          overflow: 'hidden',
                          border: `1px solid ${isUserSelected ? pal.main : theme.palette.divider}`,
                          transition: 'all 0.25s ease',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: `0 16px 48px ${alpha(pal.main, 0.16)}`,
                            borderColor: alpha(pal.main, 0.35),
                          },
                          ...(isUserSelected && {
                            boxShadow: `0 0 0 2px ${pal.main}, 0 8px 24px ${alpha(pal.main, 0.14)}`,
                          }),
                        }}
                      >
                        {/* ── Gradient banner ── */}
                        <Box
                          sx={{
                            height: 88,
                            background: `linear-gradient(135deg, ${pal.dark ?? pal.main} 0%, ${pal.main} 65%, ${alpha(pal.light ?? pal.main, 0.85)} 100%)`,
                            position: 'relative',
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            px: 1.5,
                            pt: 1,
                            // decorative circles
                            '&::before': {
                              content: '""',
                              position: 'absolute',
                              right: -20,
                              top: -20,
                              width: 110,
                              height: 110,
                              borderRadius: '50%',
                              background: alpha('#fff', 0.1),
                              pointerEvents: 'none',
                            },
                            '&::after': {
                              content: '""',
                              position: 'absolute',
                              right: 40,
                              bottom: -28,
                              width: 72,
                              height: 72,
                              borderRadius: '50%',
                              background: alpha('#fff', 0.07),
                              pointerEvents: 'none',
                            },
                          }}
                        >
                          <Checkbox
                            size="small"
                            checked={isUserSelected}
                            onChange={(e) => handleSelectOneUser(e as any, user.id)}
                            sx={{ color: alpha('#fff', 0.7), '&.Mui-checked': { color: '#fff' }, p: 0.5, position: 'relative', zIndex: 1 }}
                          />
                          <Stack direction="row" spacing={0.25} sx={{ position: 'relative', zIndex: 1 }}>
                            <Tooltip title="Edit" arrow>
                              <IconButton size="small" onClick={() => onEditUser?.(user)}
                                sx={{ color: alpha('#fff', 0.9), '&:hover': { bgcolor: alpha('#fff', 0.18), color: '#fff' } }}>
                                <EditRoundedIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="View Profile" arrow>
                              <IconButton size="small"
                                onClick={() => router.push(`/admin/management/users-profile?id=${user._id || user.id}`)}
                                sx={{ color: alpha('#fff', 0.9), '&:hover': { bgcolor: alpha('#fff', 0.18), color: '#fff' } }}>
                                <LaunchTwoToneIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="More" arrow>
                              <IconButton size="small"
                                sx={{ color: alpha('#fff', 0.9), '&:hover': { bgcolor: alpha('#fff', 0.18), color: '#fff' } }}>
                                <MoreVertTwoToneIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </Box>

                        {/* ── Avatar + role row ── */}
                        <Box px={2.5}>
                          <Box
                            display="flex"
                            alignItems="flex-end"
                            justifyContent="space-between"
                            sx={{ mt: -4.5, mb: 1.25 }}
                          >
                            <Avatar
                              src={user.avatar}
                              sx={{
                                width: 72,
                                height: 72,
                                bgcolor: avatarColor,
                                fontSize: 22,
                                fontWeight: 700,
                                border: `4px solid ${theme.palette.background.paper}`,
                                boxShadow: `0 6px 20px ${alpha(pal.main, 0.3)}`,
                                position: 'relative',
                                zIndex: 1,
                              }}
                            >
                              {initials}
                            </Avatar>
                            <Chip
                              label={roleLabel}
                              size="small"
                              sx={{
                                mb: 0.5,
                                bgcolor: alpha(pal.main, 0.1),
                                color: pal.main,
                                fontWeight: 700,
                                fontSize: '0.7rem',
                                borderRadius: 2,
                                border: `1px solid ${alpha(pal.main, 0.28)}`,
                                height: 24,
                                letterSpacing: '0.01em',
                              }}
                            />
                          </Box>

                          {/* Name */}
                          <Typography variant="subtitle1" fontWeight={700} noWrap sx={{ lineHeight: 1.35, mb: 0.5 }}>
                            {user.firstName}{user.lastName ? ` ${user.lastName}` : ''}
                          </Typography>

                          {/* Email */}
                          {user.email && (
                            <Box display="flex" alignItems="center" gap={0.6} mb={0.4}>
                              <EmailRoundedIcon sx={{ fontSize: 13, color: 'text.disabled', flexShrink: 0 }} />
                              <Tooltip title={user.email}>
                                <Typography variant="body2" color="text.secondary" noWrap sx={{ fontSize: '0.8rem', maxWidth: '100%' }}>
                                  {user.email}
                                </Typography>
                              </Tooltip>
                            </Box>
                          )}

                          {/* Phone */}
                          {user.phoneNumber && (
                            <Box display="flex" alignItems="center" gap={0.6} mb={0.25}>
                              <PhoneRoundedIcon sx={{ fontSize: 13, color: 'text.disabled', flexShrink: 0 }} />
                              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                                {user.phoneNumber}
                              </Typography>
                            </Box>
                          )}

                          {/* Chips: dept + access code */}
                          {(user.department || (isMerchant && user.accessCode)) && (
                            <Box mt={1.25} display="flex" flexWrap="wrap" gap={0.75}>
                              {user.department && (
                                <Chip
                                  label={user.department.name}
                                  size="small"
                                  sx={{
                                    height: 20,
                                    bgcolor: alpha(user.department.color || '#666', 0.12),
                                    color: user.department.color || 'text.primary',
                                    fontWeight: 600, fontSize: 10, borderRadius: 1,
                                    border: `1px solid ${alpha(user.department.color || '#666', 0.2)}`,
                                  }}
                                />
                              )}
                              {isMerchant && user.accessCode && (
                                <Chip
                                  label={`Code: ${user.accessCode}`}
                                  size="small"
                                  sx={{
                                    height: 20, fontSize: 10, borderRadius: 1, fontWeight: 600,
                                    bgcolor: alpha(pal.main, 0.08),
                                    color: pal.main,
                                    border: `1px solid ${alpha(pal.main, 0.2)}`,
                                  }}
                                />
                              )}
                            </Box>
                          )}
                        </Box>

                        {/* ── Bottom action bar ── */}
                        <Box
                          mt={2}
                          px={2}
                          py={1.25}
                          display="flex"
                          alignItems="center"
                          justifyContent="space-between"
                          sx={{ borderTop: `1px solid ${alpha(theme.palette.divider, 0.7)}` }}
                        >
                          <Tooltip title="Assign Department" arrow>
                            <IconButton
                              size="small"
                              onClick={() => onAssignDepartment?.(user)}
                              sx={{
                                color: 'text.secondary',
                                '&:hover': { color: '#9C27B0', bgcolor: alpha('#9C27B0', 0.08) },
                              }}
                            >
                              <GroupWorkRoundedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Stack direction="row" spacing={0.75} alignItems="center">
                            <Tooltip title="Edit" arrow>
                              <IconButton
                                size="small"
                                onClick={() => onEditUser?.(user)}
                                sx={{
                                  color: 'text.secondary',
                                  border: `1px solid ${theme.palette.divider}`,
                                  borderRadius: 1.5,
                                  '&:hover': {
                                    color: pal.main,
                                    borderColor: alpha(pal.main, 0.4),
                                    bgcolor: alpha(pal.main, 0.06),
                                  },
                                }}
                              >
                                <EditRoundedIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="View Profile" arrow>
                              <IconButton
                                size="small"
                                onClick={() =>
                                  router.push(`/admin/management/users-profile?id=${user._id || user.id}`)
                                }
                                sx={{
                                  color: '#fff',
                                  bgcolor: pal.main,
                                  borderRadius: 1.5,
                                  '&:hover': { bgcolor: pal.dark ?? pal.main },
                                }}
                              >
                                <LaunchTwoToneIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </Box>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>

              <Card
                elevation={0}
                sx={{
                  p: 2, mt: 3,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  border: `1px solid ${theme.palette.divider}`, borderRadius: 3,
                  flexWrap: 'wrap', gap: 1,
                  '.MuiTablePagination-select': { py: 0.55 },
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Showing{' '}
                  <strong>{Math.min(page * limit + limit, filteredUsers.length)}</strong>{' '}
                  of <strong>{filteredUsers.length}</strong> users
                </Typography>
                <TablePagination
                  component="div"
                  count={filteredUsers.length}
                  onPageChange={handlePageChange}
                  onRowsPerPageChange={handleLimitChange}
                  page={page}
                  rowsPerPage={limit}
                  labelRowsPerPage=""
                  rowsPerPageOptions={[6, 12, 24]}
                  slotProps={{ select: { variant: 'outlined', size: 'small', sx: { p: 0 } } }}
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
