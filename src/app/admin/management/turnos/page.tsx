// ShiftManagementPage.tsx
'use client';

import MobileShiftCarousel from '@/components/application-ui/carrousel/shifts';
import NewShiftModal from '@/components/application-ui/dialogs/shift/modal';
import KpiCards from '@/components/application-ui/section-headings/shifts';
import ShiftTable from '@/components/application-ui/tables/shifts/results';
import PageHeading from '@/components/base/page-heading';
import { useSweepstakes } from '@/hooks/fetching/sweepstakes/useSweepstakes';
import { useShiftsTable } from '@/hooks/pages/useShiftsPage';
import { promoterService } from '@/services/promotor.service';
import AddIcon from '@mui/icons-material/Add';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import {
  Autocomplete,
  Box,
  Button,
  Container,
  Stack,
  TextField,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';

const ShiftManagementPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [modalOpen, setModalOpen] = useState(false);
  const { data: sweepstakes } = useSweepstakes();

  const shiftsState = useShiftsTable({
    defaultRowsPerPage: 12,
    pageSizeOptions: [10, 12, 20, 30, 50],
  });

  // Promotoras para el autocomplete
  const { data: promotersData } = useQuery({
    queryKey: ['promoters-autocomplete'],
    queryFn: () => promoterService.getAllPromoters({ limit: 200 }),
    staleTime: 60_000,
  });
  const promoterOptions = (promotersData?.data ?? []).map((p) => ({
    id: p._id,
    label: `${p.firstName} ${p.lastName}`,
  }));

  const selectedPromoter = promoterOptions.find((o) => o.id === shiftsState.promoterId) ?? null;

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 4 } }}>
      <PageHeading
        title="Gestión de Turnos"
        description="Programa y administra los turnos de trabajo"
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            sx={{ borderRadius: 10, fontWeight: 600, textTransform: 'none' }}
            onClick={() => setModalOpen(true)}
          >
            Nuevo Turno
          </Button>
        }
      />

      <Box mt={2}>
        <KpiCards totalToPay={shiftsState.totalToPay} />
      </Box>

      {/* Promotora filter — visible on both mobile and desktop */}
      <Stack direction="row" mt={3} mb={isMobile ? 1 : 0}>
        <Autocomplete
          size="small"
          options={promoterOptions}
          value={selectedPromoter}
          onChange={(_, val) => shiftsState.setPromoterId(val?.id ?? '')}
          isOptionEqualToValue={(o, v) => o.id === v.id}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Filtrar por promotora"
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <>
                    <PersonSearchIcon sx={{ fontSize: 18, color: 'text.disabled', mr: 0.5 }} />
                    {params.InputProps.startAdornment}
                  </>
                ),
              }}
            />
          )}
          sx={{ width: { xs: '100%', sm: 280 } }}
          clearOnEscape
        />
      </Stack>

      <Box mt={2}>
        {isMobile ? (
          <MobileShiftCarousel {...shiftsState} sweepstakes={sweepstakes} />
        ) : (
          <ShiftTable sweepstakes={sweepstakes} {...shiftsState} />
        )}
      </Box>

      <NewShiftModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        sweepstakes={sweepstakes}
      />
    </Container>
  );
};

export default ShiftManagementPage;
