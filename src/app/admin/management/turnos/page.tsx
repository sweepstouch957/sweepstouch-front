// ShiftManagementPage.tsx
'use client';

import MobileShiftCarousel from '@/components/application-ui/carrousel/shifts';
import NewShiftModal from '@/components/application-ui/dialogs/shift/modal';
import KpiCards from '@/components/application-ui/section-headings/shifts';
import ShiftTable from '@/components/application-ui/tables/shifts/results';
import PageHeading from '@/components/base/page-heading';
import { useSweepstakes } from '@/hooks/fetching/sweepstakes/useSweepstakes';
import AddIcon from '@mui/icons-material/Add';
import { Box, Button, Container, useMediaQuery, useTheme } from '@mui/material';
import React, { useState } from 'react';

const ShiftManagementPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [modalOpen, setModalOpen] = useState(false);
  const { data: sweepstakes, isLoading: loadingSweepstakes } = useSweepstakes();

  return (
    <Container
      maxWidth="xl"
      sx={{ py: { xs: 2, sm: 4 } }}
    >
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
        <KpiCards />
      </Box>

      <Box mt={4}>
        {isMobile ? <MobileShiftCarousel /> : <ShiftTable sweepstakes={sweepstakes} />}
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
