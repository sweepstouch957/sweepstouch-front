// ShiftManagementPage.tsx
'use client';

import StoresNearbyTable from '@/components/application-ui/tables/stores-warning/results';
import PageHeading from '@/components/base/page-heading';
import { useUnder1500NearbyPromoters } from '@/hooks/fetching/promoter/useInWarningStores';
import { Container } from '@mui/material';

const CandidatesStorePage = () => {
  const { data, isError, isLoading, refetch } = useUnder1500NearbyPromoters();


  return (
    <Container
      maxWidth="xl"
      sx={{ py: { xs: 2, sm: 4 } }}
    >
      <PageHeading
        title="Tiendas Candidatas"
        description="Tiendas mas beneficiadas con impulsadoras"
      />
      <StoresNearbyTable
        radiusKm={data?.radiusKm}
        stores={data?.stores ?? []}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
      />
    </Container>
  );
};

export default CandidatesStorePage;
