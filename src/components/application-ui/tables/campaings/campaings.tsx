'use client';

import { campaignClient } from '@/services/campaing.service';
import {
  Box,
  CircularProgress,
  Fab,
  Unstable_Grid2 as Grid,
  Snackbar,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import CampaignModal from '../../modal/campaings';
import Results from './results';

function CampaignsGrid() {
  const [filters, setFilters] = useState({
    status: '',
    storeName: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 10,
  });

  const { data, isPending, error, refetch } = useQuery({
    queryKey: ['campaigns', filters],
    queryFn: () => campaignClient.getFilteredCampaigns(filters),
    staleTime: 1000 * 60, // 1 minuto cache
    placeholderData: (previousData) => previousData,
  });

  const [openModal, setOpenModal] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  const handleAddCampaign = async (data: any) => {
    console.log('Campaña enviada:', data);
    setOpenModal(false);
    setSnackbar({ open: true, message: 'Campaña creada exitosamente' });
    refetch(); // recarga campañas después de crear
  };
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
    <>
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
          />
        </Grid>
      </Grid>

      <CampaignModal
        onSubmit={handleAddCampaign}
        open={openModal}
        onClose={() => setOpenModal(false)}
      />

      <Snackbar
        open={snackbar.open}
        onClose={() => setSnackbar({ open: false, message: '' })}
        autoHideDuration={4000}
        message={snackbar.message}
      />
    </>
  );
}

export default CampaignsGrid;
