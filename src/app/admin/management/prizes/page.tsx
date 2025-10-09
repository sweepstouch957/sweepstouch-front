
'use client';

import { Container } from '@mui/material';
import PrizesGrid from '@/components/application-ui/tables/prizes/prizes';

export default function Page() {
  return (
    <Container
      maxWidth="xl"
      sx={{ py: 2 }}>
      <PrizesGrid />
    </Container>
  );
}
