// ShiftManagementPage.tsx
'use client';

import KpiCards from '@/components/application-ui/section-headings/shifts';
import PageHeading from '@/components/base/page-heading';
import { Box, Container } from '@mui/material';

const CandidatesStorePage = () => {

  return (
    <Container
      maxWidth="xl"
      sx={{ py: { xs: 2, sm: 4 } }}
    >
      <PageHeading
        title="Tiendas Candidatas"
        description="Tiendas mas beneficiadas con impulsadoras"
      />
      <Box mt={2}>
        <KpiCards />
      </Box>
    </Container>
  );
};

export default CandidatesStorePage;
