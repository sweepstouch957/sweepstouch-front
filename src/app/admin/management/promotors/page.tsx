'use client';

import NewPromoterModal from '@/components/application-ui/dialogs/promotor/modal';
import KpiSection from '@/components/application-ui/section-headings/kpis/kpis';
import PromoterTable from '@/components/application-ui/tables/kpi/results';
import { promoterService, type PromoterFilters } from '@/services/promotor.service';
import AddIcon from '@mui/icons-material/Add';
import { Button, Container } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import PageHeading from 'src/components/base/page-heading';
import { useCustomization } from 'src/hooks/use-customization';

const DEFAULT_LIMIT = 25;

function Page() {
  const customization = useCustomization();
  const [modalOpen, setModalOpen] = useState(false);

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
