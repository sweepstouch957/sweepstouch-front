'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  alpha,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  IconButton,
  InputAdornment,
  Paper,
  Skeleton,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import {
  AddRounded,
  CheckCircleOutlineRounded,
  DragIndicatorRounded,
  EditRounded,
  InfoOutlined,
  PersonAddRounded,
  SearchRounded,
  StoreRounded,
  SwapHorizRounded,
} from '@mui/icons-material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { merchantService, MerchantUser } from '@/services/merchant.service';
import { getStoresWithoutFilters, Store } from '@/services/store.service';
import PageHeading from 'src/components/base/page-heading';
import { useCustomization } from 'src/hooks/use-customization';
import CreateUserDialog from 'src/components/merchants/CreateUserDialog';
import EditUserDialog from 'src/components/merchants/EditUserDialog';

/* ─────────────────────── helpers ─────────────────────── */
const getInitials = (u: MerchantUser) => {
  const f = u.firstName?.[0] ?? '';
  const l = u.lastName?.[0] ?? '';
  return (f + l).toUpperCase() || '?';
};

const avatarColor = (id: string) => {
  const colors = [
    '#6C63FF', '#FF6584', '#43A8D0', '#F7B731', '#26de81',
    '#FC5C65', '#45AAF2', '#FD9644', '#2BCB9B', '#A55EEA',
  ];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffff;
  return colors[h % colors.length];
};

/* ─────────────────────── Draggable Store Card ─────────────────────── */
interface StoreDragCardProps {
  store: Store;
  side: 'assigned' | 'available';
  onDragStart: (store: Store, from: 'assigned' | 'available') => void;
}

const StoreDragCard: React.FC<StoreDragCardProps> = ({ store, side, onDragStart }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Paper
      draggable
      onDragStart={() => onDragStart(store, side)}
      elevation={0}
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1,
        px: 1.5,
        py: 1,
        mb: 0.75,
        border: `1px solid ${alpha(
          side === 'assigned' ? theme.palette.success.main : theme.palette.divider,
          0.35
        )}`,
        borderRadius: 2,
        cursor: 'grab',
        userSelect: 'none',
        background: side === 'assigned'
          ? alpha(theme.palette.success.main, isDark ? 0.08 : 0.04)
          : theme.palette.background.paper,
        transition: 'all 0.15s ease',
        '&:hover': {
          boxShadow: theme.shadows[3],
          transform: 'translateY(-1px)',
          borderColor: side === 'assigned'
            ? theme.palette.success.main
            : theme.palette.primary.main,
        },
        '&:active': { cursor: 'grabbing', transform: 'scale(0.98)' },
      }}
    >
      <DragIndicatorRounded sx={{ color: 'text.disabled', fontSize: 18, mt: 0.3 }} />
      <Avatar
        src={store.image}
        variant="rounded"
        sx={{ width: 34, height: 34, fontSize: 13, flexShrink: 0, bgcolor: avatarColor(store._id || store.id) }}
      >
        <StoreRounded fontSize="small" />
      </Avatar>
      <Box flex={1} minWidth={0}>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Typography
            variant="body2"
            fontWeight={600}
            sx={{ flex: 1, lineHeight: 1.3, wordBreak: 'break-word' }}
          >
            {store.name}
          </Typography>
          <Chip
            label={`${store.customerCount ?? 0} customers`}
            size="small"
            sx={{ fontSize: 10, height: 18, flexShrink: 0 }}
            color={(store.customerCount ?? 0) > 0 ? 'success' : 'default'}
          />
        </Stack>
      </Box>
    </Paper>
  );
};

/* ─────────────────────── Drop Zone ─────────────────────── */
interface DropZoneProps {
  label: string;
  stores: Store[];
  isOver: boolean;
  side: 'assigned' | 'available';
  onDrop: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDragStart: (store: Store, from: 'assigned' | 'available') => void;
  loading?: boolean;
}

const DropZone: React.FC<DropZoneProps> = ({
  label, stores, isOver, side, onDrop, onDragOver, onDragLeave, onDragStart, loading
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [query, setQuery] = useState('');

  const color = side === 'assigned' ? theme.palette.success.main : theme.palette.primary.main;
  
  const filteredStores = React.useMemo(() => {
    if (!query) return stores;
    const q = query.toLowerCase();
    return stores.filter(s => 
      s.name.toLowerCase().includes(q) || 
      (s.address && s.address.toLowerCase().includes(q))
    );
  }, [stores, query]);

  return (
    <Box flex={1} minWidth={0}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1} spacing={1}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="subtitle2" fontWeight={700} color={side === 'assigned' ? 'success.main' : 'text.primary'}>
            {label}
          </Typography>
          <Chip label={filteredStores.length} size="small" color={side === 'assigned' ? 'success' : 'default'} />
        </Stack>
        {side === 'available' && (
          <TextField
            size="small"
            placeholder="Search stores..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRounded fontSize="small" sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              minWidth: 160,
              '& .MuiOutlinedInput-root': {
                height: 32,
                fontSize: '0.85rem',
                borderRadius: 2,
              }
            }}
          />
        )}
      </Stack>
      <Box
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        sx={{
          minHeight: 220,
          maxHeight: 340,
          overflowY: 'auto',
          borderRadius: 2.5,
          border: `2px dashed ${isOver ? color : alpha(color, 0.3)}`,
          background: isOver
            ? alpha(color, isDark ? 0.12 : 0.06)
            : alpha(theme.palette.background.default, 0.5),
          p: 1.5,
          transition: 'all 0.2s ease',
          backdropFilter: 'blur(4px)',
        }}
      >
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} height={50} sx={{ borderRadius: 2, mb: 0.75 }} />
          ))
        ) : filteredStores.length === 0 ? (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            height="100%"
            minHeight={160}
            color="text.disabled"
          >
            <SwapHorizRounded sx={{ fontSize: 40, mb: 1, opacity: 0.4 }} />
            <Typography variant="caption" align="center">
              {query ? 'No stores match your search' : (isOver ? 'Drop here to ' + (side === 'assigned' ? 'assign' : 'remove') : 'Drag stores here')}
            </Typography>
          </Box>
        ) : (
          filteredStores.map((s) => (
            <StoreDragCard key={s._id || s.id} store={s} side={side} onDragStart={onDragStart} />
          ))
        )}
      </Box>
    </Box>
  );
};

/* ─────────────────────── Merchant Assignment Panel ─────────────────────── */
interface MerchantAssignPanelProps {
  merchant: MerchantUser;
  allStores: Store[];
  onEdit: (u: MerchantUser) => void;
}

const MerchantAssignPanel: React.FC<MerchantAssignPanelProps> = ({ merchant, allStores, onEdit }) => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [overLeft, setOverLeft] = useState(false);
  const [overRight, setOverRight] = useState(false);
  const [assignedIds, setAssignedIds] = useState<Set<string>>(new Set());
  const dragRef = useRef<{ store: Store; from: 'assigned' | 'available' } | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

  const { data: userStores, isLoading: loadingStores } = useQuery({
    queryKey: ['user-stores', merchant._id],
    queryFn: () => merchantService.getUserStores(merchant._id),
    staleTime: 1000 * 60 * 2,
  });

  useEffect(() => {
    if (userStores) {
      setAssignedIds(new Set(userStores.map((s) => s._id || s.id)));
      setIsDirty(false);
    }
  }, [userStores]);

  const assigned = allStores.filter((s) => assignedIds.has(s._id || s.id));
  const available = allStores.filter((s) => !assignedIds.has(s._id || s.id));

  const handleDragStart = (store: Store, from: 'assigned' | 'available') => {
    dragRef.current = { store, from };
  };

  const handleDrop = (to: 'assigned' | 'available') => {
    if (!dragRef.current) return;
    const { store, from } = dragRef.current;
    if (from === to) { dragRef.current = null; return; }

    const id = store._id || store.id;
    setAssignedIds((prev) => {
      const next = new Set(prev);
      if (to === 'assigned') next.add(id);
      else next.delete(id);
      return next;
    });
    setIsDirty(true);
    dragRef.current = null;
    setOverLeft(false);
    setOverRight(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await merchantService.assignUserStores(merchant._id, Array.from(assignedIds));
      queryClient.invalidateQueries({ queryKey: ['user-stores', merchant._id] });
      setIsDirty(false);
      setSnack({ open: true, message: `Stores updated for ${merchant.firstName}`, severity: 'success' });
    } catch {
      setSnack({ open: true, message: 'Error saving store assignments', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const initials = getInitials(merchant);
  const color = avatarColor(merchant._id);

  return (
    <Card
      elevation={0}
      sx={{
        border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
        borderRadius: 3,
        overflow: 'hidden',
        transition: 'box-shadow 0.2s',
        '&:hover': { boxShadow: theme.shadows[4] },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${alpha(color, 0.15)} 0%, ${alpha(color, 0.05)} 100%)`,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.4)}`,
          px: 2.5,
          py: 1.75,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Avatar sx={{ bgcolor: color, width: 44, height: 44, fontWeight: 700, fontSize: 16 }}>
          {initials}
        </Avatar>
        <Box flex={1} minWidth={0}>
          <Typography variant="subtitle1" fontWeight={700} noWrap>
            {merchant.firstName} {merchant.lastName || ''}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {merchant.email || merchant.phoneNumber || 'No contact'}
          </Typography>
        </Box>
        <Stack direction="row" spacing={0.5} alignItems="center">
          {isDirty && (
            <Chip
              label="Unsaved"
              size="small"
              color="warning"
              sx={{ fontSize: 10, height: 20 }}
            />
          )}
          <Tooltip title="Edit user">
            <IconButton size="small" onClick={() => onEdit(merchant)}>
              <EditRounded fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* DnD Body */}
      <CardContent sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          {/* Assigned */}
          <DropZone
            label="Assigned Stores"
            stores={assigned}
            side="assigned"
            isOver={overLeft}
            loading={loadingStores}
            onDragStart={handleDragStart}
            onDrop={() => handleDrop('assigned')}
            onDragOver={(e) => { e.preventDefault(); setOverLeft(true); setOverRight(false); }}
            onDragLeave={() => setOverLeft(false)}
          />

          {/* Divider */}
          <Box display="flex" alignItems="center" justifyContent="center">
            <SwapHorizRounded sx={{ color: 'text.disabled', fontSize: 28 }} />
          </Box>

          {/* Available */}
          <DropZone
            label="Available Stores"
            stores={available}
            side="available"
            isOver={overRight}
            onDragStart={handleDragStart}
            onDrop={() => handleDrop('available')}
            onDragOver={(e) => { e.preventDefault(); setOverRight(true); setOverLeft(false); }}
            onDragLeave={() => setOverRight(false)}
          />
        </Stack>

        {isDirty && (
          <Box mt={2} display="flex" justifyContent="flex-end">
            <Button
              variant="contained"
              size="small"
              startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <CheckCircleOutlineRounded />}
              onClick={handleSave}
              disabled={saving}
              sx={{
                borderRadius: 2,
                background: `linear-gradient(135deg, ${theme.palette.success.dark} 0%, ${theme.palette.success.main} 100%)`,
              }}
            >
              {saving ? 'Saving…' : 'Save Assignment'}
            </Button>
          </Box>
        )}
      </CardContent>

      <Snackbar
        open={snack.open}
        autoHideDuration={3500}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          severity={snack.severity}
          variant="filled"
          sx={{ borderRadius: 2 }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Card>
  );
};

/* ─────────────────────── Main Page ─────────────────────── */
export default function MerchantsPage() {
  const customization = useCustomization();
  const theme = useTheme();
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<MerchantUser | null>(null);
  const queryClient = useQueryClient();

  const { data: merchants = [], isLoading: loadingMerchants } = useQuery({
    queryKey: ['merchants'],
    queryFn: () => merchantService.getMerchants(),
    staleTime: 1000 * 60 * 3,
  });

  const { data: allStores = [], isLoading: loadingAllStores } = useQuery({
    queryKey: ['all-stores-raw'],
    queryFn: () => getStoresWithoutFilters(),
    staleTime: 1000 * 60 * 5,
  });

  const filtered = merchants.filter((m) => {
    const q = search.toLowerCase();
    return (
      !q ||
      m.firstName?.toLowerCase().includes(q) ||
      m.lastName?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q) ||
      m.phoneNumber?.includes(q)
    );
  });

  return (
    <>
      <Container
        sx={{ py: { xs: 2, sm: 3 } }}
        maxWidth={customization.stretch ? false : 'xl'}
      >
        <PageHeading
          sx={{ px: 0 }}
          title="Merchants"
          description="Manage merchant managers and their store assignments. Drag & drop stores to assign or remove them."
          actions={
            <Button
              variant="contained"
              size="small"
              startIcon={<PersonAddRounded />}
              onClick={() => setCreateOpen(true)}
              sx={{
                borderRadius: 2,
                background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.4)}`,
              }}
            >
              Create User
            </Button>
          }
        />
      </Container>

      <Box pb={{ xs: 2, sm: 3 }}>
        <Container maxWidth={customization.stretch ? false : 'xl'}>
          {/* Search + info bar */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} mb={3}>
            <TextField
              size="small"
              placeholder="Search merchants…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRounded fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{ width: { xs: '100%', sm: 320 } }}
            />
            <Box display="flex" alignItems="center" gap={1} color="text.secondary">
              <InfoOutlined fontSize="small" />
              <Typography variant="caption">
                Drag stores between columns to assign or unassign them. Click Save to persist changes.
              </Typography>
            </Box>
            <Box flex={1} />
            <Stack direction="row" spacing={1}>
              <Chip
                icon={<StoreRounded />}
                label={`${allStores.length} stores total`}
                size="small"
                color="info"
              />
              <Chip
                icon={<PersonAddRounded />}
                label={`${merchants.length} merchants`}
                size="small"
                color="primary"
              />
            </Stack>
          </Stack>

          {/* Merchant panels */}
          {loadingMerchants ? (
            <Stack spacing={2}>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} variant="rectangular" height={280} sx={{ borderRadius: 3 }} />
              ))}
            </Stack>
          ) : filtered.length === 0 ? (
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              minHeight={260}
              color="text.secondary"
            >
              <StoreRounded sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
              <Typography variant="h5" fontWeight={600} mb={0.5}>
                No merchants found
              </Typography>
              <Typography variant="body2" mb={2}>
                {search ? 'Try a different search term' : 'Create a merchant_manager user to get started'}
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddRounded />}
                onClick={() => setCreateOpen(true)}
              >
                Create Merchant
              </Button>
            </Box>
          ) : (
            <Stack spacing={2.5}>
              {filtered.map((m) => (
                <MerchantAssignPanel
                  key={m._id}
                  merchant={m}
                  allStores={allStores}
                  onEdit={(u) => setEditUser(u)}
                />
              ))}
            </Stack>
          )}
        </Container>
      </Box>

      {/* Dialogs */}
      <CreateUserDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          queryClient.invalidateQueries({ queryKey: ['merchants'] });
          setCreateOpen(false);
        }}
      />

      {editUser && (
        <EditUserDialog
          open={!!editUser}
          user={editUser}
          onClose={() => setEditUser(null)}
          onUpdated={() => {
            queryClient.invalidateQueries({ queryKey: ['merchants'] });
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setEditUser(null);
          }}
        />
      )}
    </>
  );
}
