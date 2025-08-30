// ShiftManagementPage.tsx
'use client';

import StoresNearbyTable from '@/components/application-ui/tables/stores-warning/results';
import PageHeading from '@/components/base/page-heading';
import { useUnder1500NearbyPromoters } from '@/hooks/fetching/promoter/useInWarningStores';
import { Container } from '@mui/material';
import { useState } from 'react';

const CandidatesStorePage = () => {
  const [radiusKm, setRadiusKm] = useState(20);
  const { data, isError, isLoading, refetch } = useUnder1500NearbyPromoters(radiusKm);

  const changeRadius = (newRadius: number) => {
    setRadiusKm(newRadius);
    refetch();
  };
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
        radiusKm={data?.radiusMi }
        stores={data?.stores ?? []}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        changeRadius={changeRadius}
      />
    </Container>
  );
};

export default CandidatesStorePage;
