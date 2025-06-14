'use client';

import { campaignClient } from '@/services/campaing.service';
import { Box, CircularProgress, Unstable_Grid2 as Grid, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import Results from './results';

interface CampaignsGridProps {
  storeId?: string;
}

function CampaignsGrid({ storeId }: CampaignsGridProps) {
  const [filters, setFilters] = useState({
    status: '',
    name: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 10,
    storeId, // incluimos el storeId en los filtros
  });

  const { data, isPending, error, refetch, isFetching } = useQuery({
    queryKey: ['campaigns', filters],
    queryFn: () => campaignClient.getFilteredCampaigns(filters),
    staleTime: 1000 * 60, // 1 minuto
    placeholderData: (previousData) => previousData,
  });

  if (isPending) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="300px"
      >
        <CircularProgress size={48} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        textAlign="center"
        py={4}
      >
        <Typography
          color="error"
          variant="body1"
        >
          Error al cargar campañas
        </Typography>
      </Box>
    );
  }

  return (
    <Grid
      container
      spacing={{ xs: 2, sm: 3 }}
    >
      <Grid xs={12}>
        <Results
          campaigns={data?.data || []}
          filters={filters}
          setFilters={setFilters}
          total={data?.total || 0}
          refetch={refetch}
          storeId={storeId}
          isLoading={isFetching}
        />
      </Grid>
    </Grid>
  );
}

export default CampaignsGrid;
