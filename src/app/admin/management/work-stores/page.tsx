'use client';

import NewShiftModal from '@/components/application-ui/dialogs/shift/modal';
import { PromoterSearchBar } from '@/components/application-ui/map/PromoterSearchBar';
import { StoresMapCanvas } from '@/components/application-ui/map/StoresMapCanvas';
import PageHeading from '@/components/base/page-heading';
import { usePromoterMapData } from '@/hooks/fetching/promoter/usePromoterMapData';
import { usePromotersNearStore } from '@/hooks/fetching/promoter/usePromotersNearStore';
import { useStores } from '@/hooks/fetching/stores/useStores';
import { NearbyPromoter } from '@/services/promotor.service';
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
import {
  useCallback,
  useDeferredValue,
  useMemo,
  useState,
} from 'react';

import { FilterBar } from './components/FilterBar';
import { StoreDetailPanel } from './components/StoreDetailPanel';
import { StoreList } from './components/StoreList';
import { PANEL_HEIGHT, SKELETON_ROWS } from './constants';
import { SortBy, StatusFilter } from './types';

// ── Page ──────────────────────────────────────────────────────────────────────

const WorkStoresPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // ── Filter state ─────────────────────────────────────────────────────────────
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [minCustomers, setMinCustomers] = useState('');
  const [maxCustomers, setMaxCustomers] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('promoters_desc');

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearch = useDeferredValue(searchTerm);
  const [activeTab, setActiveTab] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStoreId, setModalStoreId] = useState<string | null>(null);
  const [modalPromoterId, setModalPromoterId] = useState<string | null>(null);
  const [radiusKm, setRadiusKm] = useState(8);
  const [highlightedPromoterId, setHighlightedPromoterId] = useState<string | undefined>();
  const [promoterSearch, setPromoterSearch] = useState<NearbyPromoter | null>(null);
  const [onlineOnly, setOnlineOnly] = useState(false);

  // ── Data ─────────────────────────────────────────────────────────────────────
  const { data: stores, isLoading: loadingStores } = useStores();

  const { allPromoters, promoterCountMap, loadingBatch } = usePromoterMapData(radiusKm);

  const { data: nearData, isLoading: loadingPromoters } = usePromotersNearStore(
    selectedStore?._id,
    radiusKm,
  );

  const { data: storeShiftsData } = useQuery({
    queryKey: ['shifts', 'by-store', selectedStore?._id] as const,
    queryFn: () => shiftService.getAllShifts({ storeId: selectedStore!._id, limit: 100 }),
    enabled: !!selectedStore?._id,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  // ── Derived ──────────────────────────────────────────────────────────────────

  /** Client-side online filter — zero network cost. */
  const visiblePromoters = useMemo(
    () => (onlineOnly ? allPromoters.filter((p) => p.isOnline) : allPromoters),
    [allPromoters, onlineOnly],
  );

  const onlineCount = useMemo(
    () => allPromoters.filter((p) => p.isOnline).length,
    [allPromoters],
  );

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

  // ── Stable handlers ───────────────────────────────────────────────────────────

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

  const handlePromoterSearch = useCallback((p: NearbyPromoter | null) => {
    setPromoterSearch(p);
    setHighlightedPromoterId(p?._id);
  }, []);

  const handleToggleOnlineOnly = useCallback(() => setOnlineOnly((v) => !v), []);

  // ── Shared fragments ──────────────────────────────────────────────────────────

  const mapSearchBar = (
    <PromoterSearchBar
      promoters={allPromoters}
      value={promoterSearch}
      onlineOnly={onlineOnly}
      onlineCount={onlineCount}
      onChange={handlePromoterSearch}
      onToggleOnlineOnly={handleToggleOnlineOnly}
    />
  );

  const mapCanvas = (height: number | string) => (
    <StoresMapCanvas
      stores={filteredStores}
      promoters={visiblePromoters}
      height={height}
      onStoreClick={handleStoreClick}
      selectedStoreId={selectedStore?._id}
      highlightedPromoterId={highlightedPromoterId}
    />
  );

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
      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderBottom: (t) => `1px solid ${t.palette.divider}`,
          flexShrink: 0,
        }}
      >
        {selectedStore ? (
          <Stack direction="row" alignItems="center" spacing={1}>
            <IconButton size="small" onClick={clearSelectedStore} sx={{ flexShrink: 0 }}>
              <ArrowBackIcon fontSize="small" />
            </IconButton>
            <Typography variant="body2" fontWeight={600} noWrap flex={1}>
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
                  <SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
            }}
          />
        )}
      </Box>

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
              <Skeleton key={i} height={64} sx={{ mb: 0.5, borderRadius: 1.5 }} animation="wave" />
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

  // ── Desktop ───────────────────────────────────────────────────────────────────
  if (!isMobile) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <PageHeading
          title="Tiendas y Asignaciones"
          description="Selecciona una tienda en el mapa para ver promotoras cercanas y crear turnos"
        />
        <Box mt={2}>{filterBar}</Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {mapSearchBar}
            {mapCanvas(PANEL_HEIGHT)}
          </Box>
          {panel}
        </Box>
        {modal}
      </Container>
    );
  }

  // ── Mobile ────────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ px: 2, pt: 2, pb: 0.5, flexShrink: 0 }}>
        <Typography variant="h6" fontWeight={700}>
          Tiendas y Asignaciones
        </Typography>
      </Box>
      <Box sx={{ px: 2, pt: 1, flexShrink: 0 }}>{filterBar}</Box>
      <Box sx={{ borderBottom: (t) => `1px solid ${t.palette.divider}`, flexShrink: 0 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="fullWidth">
          <Tab label="Mapa" />
          <Tab label="Tiendas" />
        </Tabs>
      </Box>
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <Box
          sx={{
            display: activeTab === 0 ? 'flex' : 'none',
            flexDirection: 'column',
            height: '100%',
            gap: 1,
            p: 1,
          }}
        >
          {mapSearchBar}
          <Box sx={{ flex: 1, minHeight: 0 }}>{mapCanvas('100%')}</Box>
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
