'use client';

import NewPromoterModal from '@/components/application-ui/dialogs/promotor/modal';
import KpiSection from '@/components/application-ui/section-headings/kpis/kpis';
import PromoterTable from '@/components/application-ui/tables/kpi/results';
import PromoterSmsAuditPanel from '@/components/application-ui/tables/promoters/PromoterSmsAuditPanel';
import { promoterService, type Promoter, type PromoterFilters } from '@/services/promotor.service';
import { routes } from '@/router/routes';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import SmsRoundedIcon from '@mui/icons-material/SmsRounded';
import {
  alpha,
  Autocomplete,
  Box,
  Button,
  Chip,
  Container,
  Stack,
  Tab,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useTheme,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { endOfWeek, formatISO, startOfWeek } from 'date-fns';
import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageHeading from 'src/components/base/page-heading';
import { useCustomization } from 'src/hooks/use-customization';

const DEFAULT_LIMIT = 25;

function Page() {
  const customization = useCustomization();
  const theme         = useTheme();
  const isDark        = theme.palette.mode === 'dark';
  const primary       = theme.palette.primary.main;
  const { push }      = useRouter();

  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // ── Tab 0: Promoter list ───────────────────────────────────────────────────
  const [filters, setFilters] = useState<PromoterFilters>({
    page: 1, limit: DEFAULT_LIMIT, order: 'desc', sortBy: 'totalRegistrations',
  });

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ['promoters', filters],
    queryFn:  () => promoterService.getAllPromoters(filters),
    staleTime: 30_000,
  });

  const handleFilterChange = useCallback((next: Partial<PromoterFilters>) =>
    setFilters((prev) => ({ ...prev, ...next, page: 1 })), []);

  const handlePageChange  = useCallback((page: number) =>
    setFilters((prev) => ({ ...prev, page })), []);

  const handleLimitChange = useCallback((limit: number) =>
    setFilters((prev) => ({ ...prev, limit, page: 1 })), []);

  // ── Tab 1: SMS Audit ───────────────────────────────────────────────────────
  const now = new Date();
  const s0  = startOfWeek(now, { weekStartsOn: 1 });
  const e0  = endOfWeek(now, { weekStartsOn: 1 });

  const [auditStartDate,      setAuditStartDate]      = useState(formatISO(s0, { representation: 'date' }));
  const [auditEndDate,        setAuditEndDate]        = useState(formatISO(e0, { representation: 'date' }));
  const [auditUseDateRange,   setAuditUseDateRange]   = useState(true);
  const [selectedPromoter,    setSelectedPromoter]    = useState<Promoter | null>(null);

  const { data: allPromotersData } = useQuery({
    queryKey: ['promoters-autocomplete'],
    queryFn:  () => promoterService.getAllPromoters({ limit: 200, sortBy: 'firstName', order: 'asc' }),
    staleTime: 120_000,
  });

  const promoterOptions = useMemo(() => allPromotersData?.data ?? [], [allPromotersData]);

  return (
    <>
      <Container sx={{ py: { xs: 2, sm: 3 } }} maxWidth={customization.stretch ? false : 'xl'}>
        <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" gap={2}>
          <PageHeading
            sx={{ px: 0, mb: 0 }}
            title="Impulsadoras"
            description="Gestión y seguimiento de promotoras"
          />
          <Stack direction="row" spacing={1.5} flexShrink={0} flexWrap="wrap">
            <Chip
              icon={<BarChartRoundedIcon sx={{ fontSize: 14 }} />}
              label="Ver métricas"
              onClick={() => push(routes.admin.management.promotors.metrics)}
              variant="outlined"
              size="small"
              sx={{ fontWeight: 700, cursor: 'pointer', borderStyle: 'dashed' }}
            />
            <Button
              variant="contained"
              startIcon={<AddRoundedIcon />}
              disableElevation
              onClick={() => setModalOpen(true)}
              sx={{ borderRadius: 999, fontWeight: 700, textTransform: 'none' }}
            >
              Nueva Impulsadora
            </Button>
          </Stack>
        </Stack>
      </Container>

      <Container maxWidth={customization.stretch ? false : 'xl'} sx={{ pb: { xs: 3, sm: 4 } }}>
        {/* Tabs */}
        <Box sx={{ borderBottom: `1px solid ${theme.palette.divider}`, mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            sx={{
              minHeight: 44,
              '& .MuiTabs-indicator': { height: 2.5, borderRadius: '3px 3px 0 0' },
              '& .MuiTab-root': { minHeight: 44, fontSize: 13, fontWeight: 700, textTransform: 'none', py: 0 },
            }}
          >
            <Tab
              icon={<GroupsRoundedIcon sx={{ fontSize: 16 }} />}
              iconPosition="start"
              label="Impulsadoras"
            />
            <Tab
              icon={<SmsRoundedIcon sx={{ fontSize: 16 }} />}
              iconPosition="start"
              label="Auditoria SMS"
            />
          </Tabs>
        </Box>

        {/* Tab 0: Promoter list */}
        {activeTab === 0 && (
          <>
            <KpiSection />
            <PromoterTable
              promoters={data?.data ?? []}
              total={data?.pagination?.total ?? 0}
              totalPages={data?.pagination?.pages ?? 1}
              isLoading={isLoading}
              isFetching={isFetching}
              isError={isError}
              refetch={refetch}
              filters={filters}
              onFilterChange={handleFilterChange}
              onPageChange={handlePageChange}
              onLimitChange={handleLimitChange}
            />
          </>
        )}

        {/* Tab 1: SMS Audit */}
        {activeTab === 1 && (
          <Box>
            {/* Controls row */}
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={1.5}
              alignItems={{ xs: 'stretch', md: 'flex-end' }}
              sx={{
                mb: 3, p: 2, borderRadius: 2.5,
                border: `1px solid ${theme.palette.divider}`,
                bgcolor: 'action.hover',
              }}
            >
              {/* Promoter selector */}
              <Autocomplete
                options={promoterOptions}
                getOptionLabel={(p) => `${p.firstName} ${p.lastName}`}
                value={selectedPromoter}
                onChange={(_, v) => setSelectedPromoter(v)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Seleccionar Promotora"
                    size="small"
                    placeholder="Buscar por nombre…"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" key={option._id} {...props}>
                    <Stack>
                      <Typography variant="body2" fontWeight={600}>
                        {option.firstName} {option.lastName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.email} · {option.totalRegistrations ?? 0} registros
                      </Typography>
                    </Stack>
                  </Box>
                )}
                sx={{ minWidth: { xs: '100%', md: 300 } }}
                isOptionEqualToValue={(opt, val) => opt._id === val._id}
              />

              {/* Date range toggle */}
              <ToggleButtonGroup
                value={auditUseDateRange ? 'range' : 'all'}
                exclusive
                onChange={(_, v) => { if (v !== null) setAuditUseDateRange(v === 'range'); }}
                size="small" color="primary"
                sx={{
                  height: 40,
                  '& .MuiToggleButton-root': { px: 1.5, fontSize: 12, fontWeight: 700, textTransform: 'none' },
                }}
              >
                <ToggleButton value="all">Histórico (Todo)</ToggleButton>
                <ToggleButton value="range">Rango de Fechas</ToggleButton>
              </ToggleButtonGroup>

              {auditUseDateRange && (
                <Stack direction="row" spacing={1} alignItems="center">
                  <TextField
                    label="Desde" type="date" size="small"
                    value={auditStartDate}
                    onChange={(e) => setAuditStartDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ width: 150, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                  <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>to</Typography>
                  <TextField
                    label="Hasta" type="date" size="small"
                    value={auditEndDate}
                    onChange={(e) => setAuditEndDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ width: 150, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Stack>
              )}
            </Stack>

            {/* Audit panel or empty state */}
            {selectedPromoter ? (
              <PromoterSmsAuditPanel
                promoterId={selectedPromoter._id}
                promoterName={`${selectedPromoter.firstName} ${selectedPromoter.lastName}`}
                startDate={auditUseDateRange ? auditStartDate : undefined}
                endDate={auditUseDateRange ? auditEndDate : undefined}
              />
            ) : (
              <Box
                sx={{
                  py: 8,
                  textAlign: 'center',
                  border: '1px dashed',
                  borderColor: alpha(primary, isDark ? 0.2 : 0.15),
                  borderRadius: 3,
                  bgcolor: alpha(primary, isDark ? 0.03 : 0.02),
                }}
              >
                <Box
                  sx={{
                    width: 56, height: 56, borderRadius: 3, mx: 'auto', mb: 2,
                    display: 'grid', placeItems: 'center',
                    bgcolor: alpha(primary, 0.08),
                    border: `1px solid ${alpha(primary, 0.15)}`,
                  }}
                >
                  <SmsRoundedIcon sx={{ fontSize: 26, color: alpha(primary, 0.5) }} />
                </Box>
                <Typography fontWeight={700} fontSize={14} color="text.secondary">
                  Selecciona una promotora
                </Typography>
                <Typography variant="body2" color="text.disabled" sx={{ mt: 0.75, maxWidth: 360, mx: 'auto' }}>
                  Elige una promotora del selector para ver si los números que registró recibieron su SMS de confirmación via Infobip.
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Container>

      <NewPromoterModal
        open={modalOpen}
        onCreated={() => { setModalOpen(false); void refetch(); }}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}

export default Page;
