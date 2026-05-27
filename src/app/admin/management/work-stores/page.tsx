'use client';

import NewShiftModal from '@/components/application-ui/dialogs/shift/modal';
import { StoresMapCanvas } from '@/components/application-ui/map/StoresMapCanvas';
import PageHeading from '@/components/base/page-heading';
import { usePromotersNearStore } from '@/hooks/fetching/promoter/usePromotersNearStore';
import { useStores } from '@/hooks/fetching/stores/useStores';
import { promoterService, NearbyPromoter } from '@/services/promotor.service';
import { shiftService } from '@/services/shift.service';
import { Store } from '@/services/store.service';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import {
  Box,
  Button,
  Container,
  IconButton,
  InputAdornment,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import React, {
  useCallback,
  useDeferredValue,
  useMemo,
  useState,
} from 'react';

import { FilterBar } from './components/FilterBar';
import { StoreList } from './components/StoreList';
import { StoreDetailPanel } from './components/StoreDetailPanel';
import { PANEL_HEIGHT, SKELETON_ROWS } from './constants';
import { StatusFilter, SortBy } from './types';

// ── Page ──────────────────────────────────────────────────────────────────────


const WorkStoresPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // ── Filter state ─────────────────────────────────────────────────────────────
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [minCustomers, setMinCustomers] = useState('');
  const [maxCustomers, setMaxCustomers] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('promoters_desc');

  // ── Page state ───────────────────────────────────────────────────────────────
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearch = useDeferredValue(searchTerm);   // non-blocking search
  const [activeTab, setActiveTab] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStoreId, setModalStoreId] = useState<string | null>(null);
  const [modalPromoterId, setModalPromoterId] = useState<string | null>(null);
  const [radiusKm, setRadiusKm] = useState(8); // 8 Km = 5 miles default

  // ── Data ─────────────────────────────────────────────────────────────────────

  const { data: stores, isLoading: loadingStores } = useStores();

  // Batch promoter counts — always on; drives both the count badge and sort
  const { data: promoterBatchData, isLoading: loadingBatch } = useQuery({
    queryKey: ['stores-promoter-counts', radiusKm],
    queryFn: () =>
      promoterService.getStoresUnderWithNearbyPromoters({
        limit: 500,
        radiusMi: Math.round(radiusKm / 1.6),
        audienceLt: 99999,
      }),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const promoterCountMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const sw of promoterBatchData?.stores ?? []) {
      map.set(sw.store.id, sw.promoters.length);
    }
    return map;
  }, [promoterBatchData?.stores]);

  // All promoters with GPS — no radius filter, powers global map pins
  const { data: allLocatedData } = useQuery({
    queryKey: ['promoters-with-location'],
    queryFn: () => promoterService.getAllLocatedPromoters(),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  // Promoters near selected store (lazy)
  const { data: nearData, isLoading: loadingPromoters } = usePromotersNearStore(
    selectedStore?._id,
    radiusKm,
  );

  // Shift status badges for selected store (lazy)
  const { data: storeShiftsData } = useQuery({
    queryKey: ['shifts', 'by-store', selectedStore?._id],
    queryFn: () => shiftService.getAllShifts({ storeId: selectedStore!._id, limit: 100 }),
    enabled: !!selectedStore?._id,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  // ── Derived ──────────────────────────────────────────────────────────────────

  const allPromoters = useMemo(() => {
    const map = new Map<string, NearbyPromoter>();
    // Global pin layer — every promoter with GPS, regardless of store proximity
    for (const p of allLocatedData?.promoters ?? []) {
      map.set(p._id, p);
    }
    // Enrich with richer near-under data (distance, etc.) when available
    for (const sw of promoterBatchData?.stores ?? []) {
      for (const p of sw.promoters ?? []) {
        map.set(p._id, p);
      }
    }
    for (const p of nearData?.promoters ?? []) {
      map.set(p._id, p);
    }
    return Array.from(map.values());
  }, [allLocatedData, promoterBatchData, nearData]);

  const promoterShiftStatusMap = useMemo(() => {
    const map = new Map<string, 'active' | 'pending'>();
    for (const shift of storeShiftsData?.shifts ?? []) {
      if (!shift.promoterId) continue;
      const s = (shift.status ?? '').toLowerCase();
      if (s === 'active' || s === 'assigned') {
        map.set(shift.promoterId, 'active');
      } else if ((s === 'pendiente' || s === 'available') && !map.has(shift.promoterId)) {
        map.set(shift.promoterId, 'pending');
      }
    }
    return map;
  }, [storeShiftsData?.shifts]);

  // Uses deferredSearch so typing doesn't block the UI
  const filteredStores = useMemo(() => {
    const all = stores ?? [];
    const min = minCustomers !== '' ? Number(minCustomers) : null;
    const max = maxCustomers !== '' ? Number(maxCustomers) : null;
    const lc = deferredSearch.toLowerCase();
    return all.filter((s) => {
      const count = s.customerCount || 0;
      if (lc && !s.name.toLowerCase().includes(lc)) return false;
      if (statusFilter === 'active' && !s.active) return false;
      if (statusFilter === 'inactive' && s.active) return false;
      if (min !== null && count < min) return false;
      if (max !== null && count > max) return false;
      return true;
    });
  }, [stores, statusFilter, minCustomers, maxCustomers, deferredSearch]);

  const sortedStores = useMemo(() => {
    if (sortBy === 'default' || promoterCountMap.size === 0) return filteredStores;
    return [...filteredStores].sort(
      (a, b) =>
        (promoterCountMap.get(b._id) ?? promoterCountMap.get(b.id) ?? 0) -
        (promoterCountMap.get(a._id) ?? promoterCountMap.get(a.id) ?? 0),
    );
  }, [filteredStores, sortBy, promoterCountMap]);

  const totalCustomers = useMemo(
    () => filteredStores.reduce((acc, s) => acc + (s.customerCount || 0), 0),
    [filteredStores],
  );

  // ── Handlers (stable refs — don't trigger child memo invalidation) ────────────

  const openShiftModal = useCallback((storeId: string, promoterId?: string) => {
    setModalStoreId(storeId);
    setModalPromoterId(promoterId ?? null);
    setModalOpen(true);
  }, []);

  const closeShiftModal = useCallback(() => {
    setModalOpen(false);
    setModalStoreId(null);
    setModalPromoterId(null);
  }, []);

  const handleStoreClick = useCallback(
    (store: Store) => {
      setSelectedStore(store);
      if (isMobile) setActiveTab(1);
    },
    [isMobile],
  );

  const clearSelectedStore = useCallback(() => setSelectedStore(null), []);

  // ── Render ───────────────────────────────────────────────────────────────────

  const panel = (
    <Box
      sx={{
        height: isMobile ? 'calc(100vh - 160px)' : PANEL_HEIGHT,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        borderRadius: isMobile ? 0 : 2,
        border: isMobile ? 'none' : (t) => `1px solid ${t.palette.divider}`,
        overflow: 'hidden',
      }}
    >
      {/* Panel header */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderBottom: (t) => `1px solid ${t.palette.divider}`,
          flexShrink: 0,
        }}
      >
        {selectedStore ? (
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
          >
            <IconButton
              size="small"
              onClick={clearSelectedStore}
              sx={{ flexShrink: 0 }}
            >
              <ArrowBackIcon fontSize="small" />
            </IconButton>
            <Typography
              variant="body2"
              fontWeight={600}
              noWrap
              flex={1}
            >
              {selectedStore.name}
            </Typography>
            <Button
              size="small"
              variant="contained"
              startIcon={<AddIcon sx={{ fontSize: 13 }} />}
              onClick={() => openShiftModal(selectedStore._id)}
              sx={{
                borderRadius: 8,
                textTransform: 'none',
                fontSize: 12,
                px: 1.5,
                py: 0.5,
                flexShrink: 0,
                bgcolor: '#EE1E7C',
                '&:hover': { bgcolor: '#d01a6e' },
              }}
            >
              Nuevo turno
            </Button>
          </Stack>
        ) : (
          <TextField
            size="small"
            fullWidth
            placeholder="Buscar tienda..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon
                    fontSize="small"
                    sx={{ color: 'text.disabled' }}
                  />
                </InputAdornment>
              ),
            }}
          />
        )}
      </Box>

      {/* Panel content */}
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {selectedStore ? (
          <StoreDetailPanel
            store={selectedStore}
            promoters={nearData?.promoters}
            loading={loadingPromoters}
            statusMap={promoterShiftStatusMap}
            onCreateShift={openShiftModal}
          />
        ) : loadingStores ? (
          <Box p={2}>
            {SKELETON_ROWS.map((_, i) => (
              <Skeleton
                key={i}
                height={64}
                sx={{ mb: 0.5, borderRadius: 1.5 }}
                animation="wave"
              />
            ))}
          </Box>
        ) : (
          <StoreList
            stores={sortedStores}
            promoterCountMap={promoterCountMap}
            onStoreSelect={handleStoreClick}
            selectedId={selectedStore?._id}
          />
        )}
      </Box>
    </Box>
  );

  const filterBar = (
    <FilterBar
      statusFilter={statusFilter}
      onStatusChange={setStatusFilter}
      minCustomers={minCustomers}
      onMinChange={setMinCustomers}
      maxCustomers={maxCustomers}
      onMaxChange={setMaxCustomers}
      sortBy={sortBy}
      onSortChange={setSortBy}
      filteredCount={filteredStores.length}
      totalCustomers={totalCustomers}
      loadingBatch={loadingBatch}
      isMobile={isMobile}
      radiusKm={radiusKm}
      onRadiusChange={setRadiusKm}
    />
  );

  const modal = (
    <NewShiftModal
      open={modalOpen}
      onClose={closeShiftModal}
      initialStoreId={modalStoreId}
      initialPromoterId={modalPromoterId}
    />
  );

  if (!isMobile) {
    return (
      <Container
        maxWidth="xl"
        sx={{ py: 3 }}
      >
        <PageHeading
          title="Tiendas y Asignaciones"
          description="Selecciona una tienda en el mapa para ver promotoras cercanas y crear turnos"
        />
        <Box mt={2}>{filterBar}</Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 2 }}>
          <StoresMapCanvas
            stores={filteredStores}
            promoters={allPromoters}
            height={PANEL_HEIGHT}
            onStoreClick={handleStoreClick}
            selectedStoreId={selectedStore?._id}
          />
          {panel}
        </Box>
        {modal}
      </Container>
    );
  }

  return (
    <Box sx={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ px: 2, pt: 2, pb: 0.5, flexShrink: 0 }}>
        <Typography
          variant="h6"
          fontWeight={700}
        >
          Tiendas y Asignaciones
        </Typography>
      </Box>
      <Box sx={{ px: 2, pt: 1, flexShrink: 0 }}>{filterBar}</Box>
      <Box sx={{ borderBottom: (t) => `1px solid ${t.palette.divider}`, flexShrink: 0 }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          variant="fullWidth"
        >
          <Tab label="Mapa" />
          <Tab label="Tiendas" />
        </Tabs>
      </Box>
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <Box sx={{ display: activeTab === 0 ? 'block' : 'none', height: '100%' }}>
          <StoresMapCanvas
            stores={filteredStores}
            promoters={allPromoters}
            height="100%"
            onStoreClick={handleStoreClick}
            selectedStoreId={selectedStore?._id}
          />
        </Box>
        <Box sx={{ display: activeTab === 1 ? 'flex' : 'none', flexDirection: 'column', height: '100%' }}>
          {panel}
        </Box>
      </Box>
      {modal}
    </Box>
  );
};

export default WorkStoresPage;
