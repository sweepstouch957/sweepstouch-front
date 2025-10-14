'use client';

import { Box, Container } from '@mui/material';
import { useRouter } from 'next/navigation';
import React from 'react';
import CreateStoreStep2 from 'src/components/admin/stores/CreateStoreStep2';

function Page(): React.JSX.Element {
  const router = useRouter();

  const handleBack = () => {
    router.push('/admin/management/stores/create');
  };

  const handleSubmit = (data: any) => {
    console.log('Step 2 data:', data);
    // Aquí puedes manejar el envío de datos
    router.push('/admin/management/stores');
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <CreateStoreStep2
          onBack={handleBack}
          onSubmit={handleSubmit}
        />
      </Box>
    </Container>
  );
}

export default Page;
