'use client';

import NewPromoterModal from '@/components/application-ui/dialogs/promotor/modal';
import KpiSection from '@/components/application-ui/section-headings/kpis/kpis';
import PromoterTable from '@/components/application-ui/tables/kpi/results';
import PromoterSmsAuditPanel from '@/components/application-ui/tables/promoters/PromoterSmsAuditPanel';
import { promoterService, type Promoter, type PromoterFilters } from '@/services/promotor.service';
import AddIcon from '@mui/icons-material/Add';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import SmsRoundedIcon from '@mui/icons-material/SmsRounded';
import {
  Autocomplete,
  Box,
  Button,
  Container,
  Stack,
  Tab,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { endOfWeek, formatISO, startOfWeek } from 'date-fns';
import { useCallback, useMemo, useState } from 'react';
import PageHeading from 'src/components/base/page-heading';
import { useCustomization } from 'src/hooks/use-customization';

const DEFAULT_LIMIT = 25;

function Page() {
  const customization = useCustomization();
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // ── Tab 0: Promoter list state ─────────────────────────────────────────────
  const [filters, setFilters] = useState<PromoterFilters>({
    page: 1,
    limit: DEFAULT_LIMIT,
    order: 'desc',
    sortBy: 'totalRegistrations',
  });

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ['promoters', filters],
    queryFn: () => promoterService.getAllPromoters(filters),
    staleTime: 30_000,
  });

  const handleFilterChange = useCallback((next: Partial<PromoterFilters>) => {
    setFilters((prev) => ({ ...prev, ...next, page: 1 }));
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  const handleLimitChange = useCallback((limit: number) => {
    setFilters((prev) => ({ ...prev, limit, page: 1 }));
  }, []);

  // ── Tab 1: Audit state ─────────────────────────────────────────────────────
  const now = new Date();
  const s0 = startOfWeek(now, { weekStartsOn: 1 });
  const e0 = endOfWeek(now, { weekStartsOn: 1 });

  const [auditStartDate, setAuditStartDate] = useState(formatISO(s0, { representation: 'date' }));
  const [auditEndDate, setAuditEndDate]     = useState(formatISO(e0, { representation: 'date' }));
  const [auditUseDateRange, setAuditUseDateRange] = useState(true);
  const [selectedPromoter, setSelectedPromoter] = useState<Promoter | null>(null);

  // Fetch all promoters for autocomplete (lightweight, cached)
  const { data: allPromotersData } = useQuery({
    queryKey: ['promoters-autocomplete'],
    queryFn: () => promoterService.getAllPromoters({ limit: 200, sortBy: 'firstName', order: 'asc' }),
    staleTime: 120_000,
  });

  const promoterOptions = useMemo(() => allPromotersData?.data ?? [], [allPromotersData]);

  return (
    <>
      <Container
        sx={{ py: { xs: 2, sm: 3 } }}
        maxWidth={customization.stretch ? false : 'xl'}
      >
        <PageHeading
          sx={{ px: 0 }}
          title="Impulsadoras"
          description="Gestión y seguimiento de promotoras"
          actions={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              disableElevation
              sx={{ borderRadius: 10, fontWeight: 600, textTransform: 'none' }}
              onClick={() => setModalOpen(true)}
            >
              Nueva Impulsadora
            </Button>
          }
        />
      </Container>

      <Container
        maxWidth={customization.stretch ? false : 'xl'}
        sx={{ pb: { xs: 2, sm: 3 } }}
      >
        {/* Tab navigation */}
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{ mb: 3, borderBottom: '1px solid', borderColor: 'divider' }}
        >
          <Tab
            icon={<GroupsRoundedIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label="Impulsadoras"
          />
          <Tab
            icon={<SmsRoundedIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label="Auditoría SMS"
          />
        </Tabs>

        {/* Tab 0 — Promoter list */}
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

        {/* Tab 1 — SMS Audit */}
        {activeTab === 1 && (
          <Box>
            {/* Filters: promoter selector + date range */}
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              alignItems={{ xs: 'stretch', md: 'flex-end' }}
              sx={{ mb: 3 }}
            >
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
                    placeholder="Buscar por nombre..."
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props} key={option._id}>
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
                sx={{ minWidth: { xs: '100%', md: 320 } }}
                isOptionEqualToValue={(opt, val) => opt._id === val._id}
              />

              <ToggleButtonGroup
                value={auditUseDateRange ? 'range' : 'all'}
                exclusive
                onChange={(_, v) => {
                  if (v !== null) setAuditUseDateRange(v === 'range');
                }}
                size="small"
                color="primary"
                sx={{ height: 40 }}
              >
                <ToggleButton value="all" sx={{ textTransform: 'none', fontWeight: 700 }}>
                  Histórico (Todo)
                </ToggleButton>
                <ToggleButton value="range" sx={{ textTransform: 'none', fontWeight: 700 }}>
                  Rango de Fechas
                </ToggleButton>
              </ToggleButtonGroup>

              {auditUseDateRange && (
                <>
                  <TextField
                    label="Fecha inicio"
                    type="date"
                    size="small"
                    value={auditStartDate}
                    onChange={(e) => setAuditStartDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ minWidth: 160 }}
                  />
                  <TextField
                    label="Fecha fin"
                    type="date"
                    size="small"
                    value={auditEndDate}
                    onChange={(e) => setAuditEndDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ minWidth: 160 }}
                  />
                </>
              )}
            </Stack>

            {/* Audit panel */}
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
                  borderColor: 'divider',
                  borderRadius: 3,
                  bgcolor: (t) =>
                    t.palette.mode === 'dark'
                      ? 'rgba(255,255,255,0.02)'
                      : 'rgba(0,0,0,0.015)',
                }}
              >
                <SmsRoundedIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
                <Typography variant="h6" color="text.disabled" fontWeight={600}>
                  Selecciona una promotora
                </Typography>
                <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
                  Elige una promotora del selector para ver la auditoría de SMS de los números que registró.
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Container>

      <NewPromoterModal
        open={modalOpen}
        onCreated={() => {
          setModalOpen(false);
          void refetch();
        }}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}

export default Page;
