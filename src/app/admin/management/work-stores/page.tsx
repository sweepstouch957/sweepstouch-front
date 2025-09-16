// app/(whatever)/ShiftManagementPage.tsx
'use client';

import StoresNearbyTable from '@/components/application-ui/tables/stores-warning/results';
import PageHeading from '@/components/base/page-heading';
import { useNearUnderStores } from '@/hooks/fetching/promoter/useInWarningStores';
import { Container } from '@mui/material';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

const CandidatesStorePage = () => {
  // NOTA: "radiusKm" en tu UI, pero el backend usa MILLAS
  const [radiusMi, setRadiusMi] = useState<number>(20);

  // paginación controlada (0-based para UI / 1-based para backend)
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(50);

  // filtros controlados
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [audienceMax, setAudienceMax] = useState<string>('1500');

  // Lee ?q= de la URL al montar (y cuando cambie)
  useEffect(() => {
    const q = searchParams.get('q') || '';
    if (q !== searchTerm) setSearchTerm(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Hook paginado (1-based para backend)
  const { data, isError, isLoading, refetch } = useNearUnderStores({
    audienceLt: Number(audienceMax) > 0 ? Number(audienceMax) : 1500,
    radiusMi: radiusMi,
    page: page + 1,
    limit: rowsPerPage,
    sortBy: 'createdAt',
    order: 'desc',
  });

  const changeRadius = (newRadius: number) => {
    setRadiusMi(newRadius);
    refetch(); // opcional, el hook también refetchea por deps
  };

  const handleChangePage = (nextPage0: number) => setPage(nextPage0);

  const handleChangeRowsPerPage = (nextRpp: number) => {
    setRowsPerPage(nextRpp);
    setPage(0);
  };

  return (
    <Container
      maxWidth="xl"
      sx={{ py: { xs: 2, sm: 4 } }}
    >
      <PageHeading
        title="Tiendas Candidatas"
        description="Tiendas más beneficiadas con impulsadoras"
      />

      <StoresNearbyTable
        radiusKm={data?.radiusMi}
        stores={data?.stores ?? []}
        total={data?.totalStores ?? 0}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        changeRadius={changeRadius}
        // paginación controlada
        page={page}
        rowsPerPage={rowsPerPage}
        onChangePage={handleChangePage}
        onChangeRowsPerPage={handleChangeRowsPerPage}
        // filtros controlados (UI)
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        audienceMax={audienceMax}
        onAudienceMaxChange={(v) => {
          if (/^\d*$/.test(v)) setAudienceMax(v);
        }}
      />
    </Container>
  );
};

export default CandidatesStorePage;
