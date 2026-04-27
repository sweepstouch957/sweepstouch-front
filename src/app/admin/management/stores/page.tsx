'use client';

import StoreListing from '@/components/application-ui/tables/stores/products';
import { Container } from '@mui/material';
import React from 'react';
import { useCustomization } from 'src/hooks/use-customization';

function Page(): React.JSX.Element {
  const customization = useCustomization();
  return (
    <Container
      maxWidth={customization.stretch ? false : 'xl'}
      sx={{ pt: { xs: 1, sm: 1.5 }, pb: { xs: 2, sm: 3 } }}
    >
      <StoreListing />
    </Container>
  );
}

export default Page;
